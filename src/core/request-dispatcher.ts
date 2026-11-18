import { rootAddress, slugAddress } from '../drop.ts';
import { DownloadHandler } from './handlers/download-handler.ts';
import { UploadHandler } from './handlers/upload-handler.ts';
import { htmlResponse, renderNotFound, renderTemplate, staticAssets } from './template-renderer.ts';

export type DispatchOptions = {
  durationMs: number;
  acceptsUploads: boolean;
};

export class RequestDispatcher {
  private readonly expiresAt: string;

  constructor(
    private uploadHandler: UploadHandler,
    private downloadHandler: DownloadHandler,
    private options: DispatchOptions,
  ) {
    this.expiresAt = new Date(Date.now() + options.durationMs).toISOString();
  }

  async dispatch(request: Request): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);
    const wantsDownload = searchParams.get('download') === '1';

    if (request.method === 'GET' && pathname === '/_/common.css') {
      return this.serveStatic(staticAssets.css, 'text/css; charset=utf-8');
    }
    if (request.method === 'GET' && pathname === '/_/countdown.js') {
      return this.serveStatic(staticAssets.countdown, 'application/javascript; charset=utf-8');
    }
    if (request.method === 'POST' && pathname === '/_/upload' && this.options.acceptsUploads) {
      return this.uploadHandler.create(request);
    }
    if (request.method !== 'GET') return renderNotFound();
    if (pathname === '/') return this.handleRoot(wantsDownload);

    return this.downloadHandler.show(slugAddress(pathname.slice(1)), wantsDownload);
  }

  private serveStatic(body: string, contentType: string): Response {
    return new Response(body, { headers: { 'Content-Type': contentType } });
  }

  private async handleRoot(wantsDownload: boolean): Promise<Response> {
    const response = await this.downloadHandler.show(rootAddress, wantsDownload);
    if (response.status !== 404 || !this.options.acceptsUploads) {
      return response;
    }
    return htmlResponse(renderTemplate('root', { expiresAt: this.expiresAt }));
  }
}
