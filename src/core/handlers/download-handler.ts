import { type DropAddress, pathFor } from '../../drop.ts';
import { DropLedger } from '../drop-ledger.ts';
import { renderNotFound, renderTemplate } from '../template-renderer.ts';

export class DownloadHandler {
  constructor(private ledger: DropLedger) {}

  /** Renders a drop or returns its file response when download is requested. */
  async show(address: DropAddress, shouldDownload: boolean): Promise<Response> {
    const drop = this.ledger.resolve(address);

    if (!drop) {
      return renderNotFound();
    }

    if (!shouldDownload) {
      const html = await renderTemplate('download', {
        filename: drop.fileName,
        path: pathFor(drop.address),
        expiresAt: drop.expiresAt.toISOString(),
      });
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    console.info(`Download served: ${pathFor(drop.address)}`);

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
