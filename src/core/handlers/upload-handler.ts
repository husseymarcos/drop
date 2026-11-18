import { type DropContent, pathFor } from '../../drop.ts';
import type { ActivityLog } from '../../types.ts';
import { formatBytes } from '../../utils.ts';
import { DropLedger } from '../drop-ledger.ts';
import { buildTarStream } from '../tar-stream.ts';

export class UploadHandler {
  constructor(
    private ledger: DropLedger,
    private durationMs: number,
    private maxBytes: number,
    private report: ActivityLog = () => {},
  ) {}

  /** Creates a drop from the files in a multipart upload request. */
  async create(request: Request): Promise<Response> {
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > this.maxBytes) {
      return this.tooLarge();
    }

    const formData = await this.readForm(request);
    if (!formData) {
      return new Response('Malformed upload', { status: 400 });
    }

    const files = formData.getAll('file').filter((value) => value instanceof File) as File[];

    if (files.length === 0) {
      return new Response('Missing file', { status: 400 });
    }

    if (files.reduce((total, file) => total + file.size, 0) > this.maxBytes) {
      return this.tooLarge();
    }

    const directoryName = this.extractDirectoryName(formData);
    const content = files.length === 1 && !directoryName
      ? this.singleContent(files[0]!)
      : this.archiveContent(files, directoryName);

    const drop = this.ledger.create(content, { durationMs: this.durationMs });
    this.report(`Received ${drop.fileName} (${drop.sizeLabel})`, pathFor(drop.address));

    return new Response(JSON.stringify({
      path: pathFor(drop.address),
      fileName: drop.fileName,
      expiresAt: drop.expiresAt.toISOString(),
      fileSize: drop.fileSize,
      mimeType: drop.mimeType,
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  private async readForm(request: Request): Promise<FormData | undefined> {
    try {
      return await request.formData() as globalThis.FormData;
    }
    catch {
      return undefined;
    }
  }

  private tooLarge(): Response {
    return new Response(`Upload exceeds the ${formatBytes(this.maxBytes)} limit`, { status: 413 });
  }

  private extractDirectoryName(formData: FormData): string | undefined {
    const field = formData.get('directoryName');
    return typeof field === 'string' && field.trim().length > 0
      ? field.trim()
      : undefined;
  }

  private singleContent(file: File): DropContent {
    return {
      fileName: file.name || 'upload',
      mimeType: (file.type || 'application/octet-stream').split(';')[0]!,
      size: file.size,
      body: () => file,
    };
  }

  private archiveContent(files: File[], directoryName?: string): DropContent {
    const entries = files.map((file) => ({ path: file.name, blob: file }));
    const name = directoryName ?? (files[0]?.name?.split('/')[0] || 'directory');
    return buildTarStream(entries, name);
  }
}
