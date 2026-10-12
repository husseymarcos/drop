import { rootAddress, slugAddress } from '../drop.ts';
import { DownloadHandler } from './handlers/download-handler.ts';
import { UploadHandler } from './handlers/upload-handler.ts';
import { renderNotFound, renderTemplate } from './template-renderer.ts';

export class RequestDispatcher {
  constructor(
    private uploadHandler: UploadHandler,
    private downloadHandler: DownloadHandler,
    private durationMs: number,
  ) {}

  async dispatch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (request.method === 'GET' && pathname === '/_/common.css') {
      return this.serveStatic('../views/common.css', 'text/css; charset=utf-8');
    }
    if (request.method === 'GET' && pathname === '/_/countdown.js') {
      return this.serveStatic('../views/countdown.js', 'application/javascript; charset=utf-8');
    }
    if (request.method === 'POST' && pathname === '/_/upload') {
      return this.uploadHandler.create(request);
    }
    if (request.method !== 'GET') return renderNotFound();
    if (pathname === '/') return this.handleRoot(searchParams);

    return this.downloadHandler.show(
      slugAddress(pathname.slice(1)),
      searchParams.get('download') === '1',
    );
  }

  private serveStatic(path: string, contentType: string): Response {
    return new Response(Bun.file(new URL(path, import.meta.url)), {
      headers: { 'Content-Type': contentType },
    });
  }

  private async handleRoot(searchParams: URLSearchParams): Promise<Response> {
    const response = await this.downloadHandler.show(
      rootAddress,
      searchParams.get('download') === '1',
    );
    if (response.status !== 404) {
      return response;
    }

    const html = await renderTemplate('root', {
      expiresAt: new Date(Date.now() + this.durationMs).toISOString(),
    });
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
