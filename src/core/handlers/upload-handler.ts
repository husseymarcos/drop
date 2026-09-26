import { type DropContent, pathFor } from '../../drop.ts';
import { DropLedger } from '../drop-ledger.ts';
import { buildTarArchive } from '../tar-archive.ts';

export class UploadHandler {
  constructor(
    private ledger: DropLedger,
    private durationMs: number,
  ) {}

  /** Creates a drop from the files in a multipart upload request. */
  async create(request: Request): Promise<Response> {
    const formData = await request.formData() as globalThis.FormData;
    const files = formData.getAll('file').filter((value) => value instanceof File) as File[];

    if (files.length === 0) {
      return new Response('Missing file', { status: 400 });
    }

    const directoryName = this.extractDirectoryName(formData);
    const content = files.length === 1 && !directoryName
      ? await this.singleContent(files[0]!)
      : await this.archiveContent(files, directoryName);

    const drop = this.ledger.create(content, { durationMs: this.durationMs });

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

  private extractDirectoryName(formData: FormData): string | undefined {
    const field = formData.get('directoryName');
    return typeof field === 'string' && field.trim().length > 0
      ? field.trim()
      : undefined;
  }

  private async singleContent(file: File): Promise<DropContent> {
    return {
      fileName: file.name || 'upload',
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: (file.type || 'application/octet-stream').split(';')[0]!,
    };
  }

  private async archiveContent(files: File[], directoryName?: string): Promise<DropContent> {
    const entries: Record<string, Uint8Array> = {};

    for (const file of files) {
      entries[file.name] = new Uint8Array(await file.arrayBuffer());
    }

    const name = directoryName ?? (files[0]?.name?.split('/')[0] || 'directory');
    return buildTarArchive(entries, name);
  }
}
