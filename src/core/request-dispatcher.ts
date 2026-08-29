import { routeRequest } from './router.ts';
import { DropStore } from './drop-store.ts';
import { DownloadHandler } from './handlers/download-handler.ts';
import { UploadHandler } from './handlers/upload-handler.ts';
import { renderNotFound, renderTemplate } from './template-renderer.ts';

export class RequestDispatcher {
  constructor(
    private uploadHandler: UploadHandler,
    private downloadHandler: DownloadHandler,
    private store: DropStore,
    private serveAtRoot: boolean,
    private durationMs: number,
  ) {}

  async dispatch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = routeRequest(request.method, url.pathname, url.searchParams);

    switch (route.kind) {
      case 'static-css':
        return this.serveStatic('../views/common.css', 'text/css; charset=utf-8');
      case 'static-js':
        return this.serveStatic('../views/countdown.js', 'application/javascript; charset=utf-8');
      case 'upload':
        return this.uploadHandler.handle(request);
      case 'download':
        return this.downloadHandler.handle(route.slug, route.download);
      case 'root':
        return this.handleRoot(url.searchParams);
      case 'not-found':
        return renderNotFound();
    }
  }

  private serveStatic(path: string, contentType: string): Response {
    return new Response(Bun.file(new URL(path, import.meta.url)), {
      headers: { 'Content-Type': contentType },
    });
  }

  private async handleRoot(searchParams: URLSearchParams): Promise<Response> {
    if (this.serveAtRoot) {
      const drop = this.store.find('');
      if (drop) {
        return this.downloadHandler.handle('', searchParams.get('download') === '1');
      }
    }

    const html = await renderTemplate('root', {
      expiresAt: new Date(Date.now() + this.durationMs).toISOString(),
    });
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
