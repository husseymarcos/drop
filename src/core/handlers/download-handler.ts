import { type DropAddress, pathFor } from '../../drop.ts';
import type { ActivityLog } from '../../types.ts';
import { DropLedger } from '../drop-ledger.ts';
import {
  htmlResponse,
  renderExpired,
  renderNotFound,
  renderTemplate,
} from '../template-renderer.ts';

export class DownloadHandler {
  constructor(
    private ledger: DropLedger,
    private report: ActivityLog = () => {},
  ) {}

  /** Renders a drop or returns its file response when download is requested. */
  async show(address: DropAddress, shouldDownload: boolean): Promise<Response> {
    const drop = this.ledger.resolve(address);

    if (!drop) {
      return this.ledger.hasExpired(address) ? renderExpired() : renderNotFound();
    }

    if (!shouldDownload) {
      return htmlResponse(renderTemplate('download', {
        filename: drop.fileName,
        size: drop.sizeLabel,
        path: pathFor(drop.address),
        expiresAt: drop.expiresAt.toISOString(),
      }));
    }

    this.report(`Download started: ${drop.fileName}`);

    return new Response(drop.openBody(), {
      headers: {
        'Content-Type': drop.mimeType,
        'Content-Disposition': contentDisposition(drop.fileName),
        'Content-Length': drop.fileSize.toString(),
        'Cache-Control': 'no-store',
      },
    });
  }
}

function contentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, '_');
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
