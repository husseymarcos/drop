import { networkInterfaces } from 'node:os';
import { DropFactory } from './drop-factory.ts';
import { DropStore } from './drop-store.ts';
import { RequestDispatcher } from './request-dispatcher.ts';
import { DownloadHandler } from './handlers/download-handler.ts';
import { NotFoundHandler } from './handlers/not-found-handler.ts';
import { RootHandler } from './handlers/root-handler.ts';
import { StaticHandler } from './handlers/static-handler.ts';
import { UploadHandler } from './handlers/upload-handler.ts';

export class DropServer {
  private server?: ReturnType<typeof Bun.serve>;

  constructor(
    private config: { port: number; host: string },
    private dispatcher: RequestDispatcher,
  ) {}

  async start(): Promise<{ url: string; port: number }> {
    const initialPort = this.config.port;
    let nextPort = initialPort;

    while (nextPort <= 65535) {
      try {
        this.server = Bun.serve({
          port: nextPort,
          hostname: this.config.host,
          fetch: (req) => this.dispatcher.dispatch(req),
        });

        this.config.port = this.server.port ?? nextPort;
        console.log(`Server started on ${this.getUrl()}`);
        return { url: this.getUrl(), port: this.config.port };
      }
      catch (error) {
        if (this.isAddressInUseError(error)) {
          nextPort++;
          continue;
        }
        const err = error instanceof Error ? error : new Error(String(error));
        throw new Error(`Failed to start server on port ${nextPort}`, { cause: err });
      }
    }

    throw new Error(
      `Failed to start server: no available ports from ${initialPort} to 65535`,
    );
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      console.log('Server stopped');
    }
  }

  private getUrl(): string {
    const host = this.config.host === '0.0.0.0' ? this.getLocalIp() : this.config.host;
    const port = this.config.port;
    const portSuffix = port === 80 ? '' : `:${port}`;
    return `http://${host}${portSuffix}`;
  }

  private getLocalIp(): string {
    try {
      for (const iface of Object.values(networkInterfaces()).flat()) {
        if (iface?.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    catch { /* empty */ }
    return 'localhost';
  }

  private isAddressInUseError(error: unknown): boolean {
    return error instanceof Error
      && (('code' in error && error.code === 'EADDRINUSE')
        || error.message.includes('EADDRINUSE'));
  }
}

export function createDropServer(
  store: DropStore,
  factory: DropFactory,
  config: { port?: number; durationMs: number; serveAtRoot?: boolean },
): DropServer {
  const dispatcher = new RequestDispatcher(
    new StaticHandler(),
    new UploadHandler(factory, store, config.durationMs),
    new DownloadHandler(store),
    new RootHandler(config.durationMs),
    new NotFoundHandler(),
    store,
    config.serveAtRoot ?? false,
  );

  return new DropServer(
    { host: '0.0.0.0', port: config.port ?? 8080 },
    dispatcher,
  );
}
