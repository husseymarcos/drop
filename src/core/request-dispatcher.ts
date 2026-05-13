import { routeRequest } from './router.ts';
import { DropStore } from './drop-store.ts';
import { DownloadHandler } from './handlers/download-handler.ts';
import { NotFoundHandler } from './handlers/not-found-handler.ts';
import { RootHandler } from './handlers/root-handler.ts';
import { StaticHandler } from './handlers/static-handler.ts';
import { UploadHandler } from './handlers/upload-handler.ts';

export class RequestDispatcher {
  constructor(
    private staticHandler: StaticHandler,
    private uploadHandler: UploadHandler,
    private downloadHandler: DownloadHandler,
    private rootHandler: RootHandler,
    private notFoundHandler: NotFoundHandler,
    private store: DropStore,
    private serveAtRoot: boolean,
  ) {}

  async dispatch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = routeRequest(request.method, url.pathname, url.searchParams);

    switch (route.kind) {
      case 'static-css':
        return this.staticHandler.handle('css');
      case 'static-js':
        return this.staticHandler.handle('js');
      case 'upload':
        return this.uploadHandler.handle(request);
      case 'download':
        return this.downloadHandler.handle(route.slug, route.download);
      case 'root':
        return this.handleRoot(url.searchParams);
      case 'not-found':
        return this.notFoundHandler.handle();
    }
  }

  private handleRoot(searchParams: URLSearchParams): Promise<Response> {
    if (this.serveAtRoot) {
      const drop = this.store.find('');
      if (drop) {
        return this.downloadHandler.handle('', searchParams.get('download') === '1');
      }
    }
    return this.rootHandler.handle();
  }
}
