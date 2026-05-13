import { Drop } from '../../drop.ts';
import { DropStore } from '../drop-store.ts';
import { renderTemplate } from '../template-renderer.ts';

export class DownloadHandler {
  constructor(private store: DropStore) {}

  async handle(slug: string, shouldDownload: boolean): Promise<Response> {
    const drop = this.store.find(slug);

    if (!drop) {
      return this.notFound();
    }

    if (!shouldDownload) {
      return this.renderView(drop);
    }

    return this.serveFile(drop);
  }

  private notFound(): Promise<Response> {
    return renderTemplate('not-found', {}).then((html) =>
      new Response(html, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    );
  }

  private renderView(drop: Drop): Promise<Response> {
    return renderTemplate('download', {
      filename: drop.fileName,
      slug: drop.id,
      expiresAt: drop.expiresAt.toISOString(),
    }).then((html) =>
      new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    );
  }

  private serveFile(drop: Drop): Response {
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
