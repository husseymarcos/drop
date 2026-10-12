import { networkInterfaces } from 'node:os';
import { DropLedger } from './drop-ledger.ts';
import { RequestDispatcher } from './request-dispatcher.ts';
import { DownloadHandler } from './handlers/download-handler.ts';
import { UploadHandler } from './handlers/upload-handler.ts';
import { toMessage } from '../utils.ts';

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
        const err = error instanceof Error ? error : new Error(toMessage(error));
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
  ledger: DropLedger,
  config: { port?: number; durationMs: number },
): DropServer {
  const dispatcher = new RequestDispatcher(
    new UploadHandler(ledger, config.durationMs),
    new DownloadHandler(ledger),
    config.durationMs,
  );

  return new DropServer(
    { host: '0.0.0.0', port: config.port ?? 8080 },
    dispatcher,
  );
}
