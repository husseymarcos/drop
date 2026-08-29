import { DropStore } from '../drop-store.ts';
import { renderNotFound, renderTemplate } from '../template-renderer.ts';

export class DownloadHandler {
  constructor(private store: DropStore) {}

  async handle(slug: string, shouldDownload: boolean): Promise<Response> {
    const drop = this.store.find(slug);

    if (!drop) {
      return renderNotFound();
    }

    if (!shouldDownload) {
      const html = await renderTemplate('download', {
        filename: drop.fileName,
        slug: drop.id,
        expiresAt: drop.expiresAt.toISOString(),
      });
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    drop.consume();
    console.info(`Session download registered: ${drop.id} (downloads: ${drop.downloadCount})`);

    return new Response(drop.data, {
      headers: {
        'Content-Type': drop.mimeType,
        'Content-Disposition': `attachment; filename="${drop.fileName}"`,
        'Content-Length': drop.fileSize.toString(),
        'Cache-Control': 'no-store',
      },
    });
  }
}
