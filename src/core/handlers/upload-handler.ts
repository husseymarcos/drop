import { Drop } from '../../drop.ts';
import { DropFactory } from '../drop-factory.ts';
import { DropStore } from '../drop-store.ts';

export class UploadHandler {
  constructor(
    private factory: DropFactory,
    private store: DropStore,
    private durationMs: number,
  ) {}

  async handle(request: Request): Promise<Response> {
    const formData = await request.formData();
    const files = formData.getAll('file').filter((value) => value instanceof File) as File[];

    if (files.length === 0) {
      return new Response('Missing file', { status: 400 });
    }

    const directoryName = this.extractDirectoryName(formData);
    const drop = files.length === 1 && !directoryName
      ? await this.handleSingle(files[0]!)
      : await this.handleMultiple(files, directoryName);

    this.store.add(drop.id, drop);

    return new Response(JSON.stringify({
      slug: drop.id,
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

  private async handleSingle(file: File): Promise<Drop> {
    const arrayBuffer = await file.arrayBuffer();
    return this.factory.fromUpload(
      file.name || 'upload',
      Buffer.from(arrayBuffer),
      this.durationMs,
    );
  }

  private async handleMultiple(files: File[], directoryName?: string): Promise<Drop> {
    const archiveEntries: Record<string, Uint8Array> = {};

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      archiveEntries[file.name] = new Uint8Array(arrayBuffer);
    }

    const archive = new Bun.Archive(archiveEntries);
    const archiveBlob = await archive.blob();
    const archiveBuffer = Buffer.from(await archiveBlob.arrayBuffer());

    const name = directoryName ?? (files[0]?.name?.split('/')[0] || 'directory');

    return this.factory.fromUpload(
      `${name}.tar`,
      archiveBuffer,
      this.durationMs,
    );
  }
}
