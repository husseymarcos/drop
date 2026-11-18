import { DropLedger } from './drop-ledger.ts';
import { RequestDispatcher } from './request-dispatcher.ts';
import { DownloadHandler } from './handlers/download-handler.ts';
import { UploadHandler } from './handlers/upload-handler.ts';
import type { ActivityLog } from '../types.ts';
import { toMessage } from '../utils.ts';

const MULTIPART_OVERHEAD_BYTES = 1024 * 1024;

export type DropServerConfig = {
  port: number;
  advertisedHost: string;
  maxRequestBodySize: number;
};

export class DropServer {
  private server?: ReturnType<typeof Bun.serve>;

  constructor(
    private config: DropServerConfig,
    private dispatcher: RequestDispatcher,
  ) {}

  async start(): Promise<{ url: string; port: number }> {
    const initialPort = this.config.port;
    let nextPort = initialPort;

    while (nextPort <= 65535) {
      try {
        this.server = Bun.serve({
          port: nextPort,
          hostname: '0.0.0.0',
          maxRequestBodySize: this.config.maxRequestBodySize,
          fetch: (req) => this.dispatcher.dispatch(req),
        });

        this.config.port = this.server.port ?? nextPort;
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

  /** Stops listening and closes open connections, including downloads in progress. */
  async stop(): Promise<void> {
    await this.server?.stop(true);
    this.server = undefined;
  }

  private getUrl(): string {
    const port = this.config.port;
    const portSuffix = port === 80 ? '' : `:${port}`;
    return `http://${this.config.advertisedHost}${portSuffix}`;
  }

  private isAddressInUseError(error: unknown): boolean {
    return error instanceof Error
      && (('code' in error && error.code === 'EADDRINUSE')
        || error.message.includes('EADDRINUSE'));
  }
}

export type CreateDropServerOptions = {
  port?: number;
  durationMs: number;
  advertisedHost: string;
  acceptsUploads: boolean;
  maxUploadBytes: number;
  report?: ActivityLog;
};

export function createDropServer(
  ledger: DropLedger,
  options: CreateDropServerOptions,
): DropServer {
  const dispatcher = new RequestDispatcher(
    new UploadHandler(ledger, options.durationMs, options.maxUploadBytes, options.report),
    new DownloadHandler(ledger, options.report),
    { durationMs: options.durationMs, acceptsUploads: options.acceptsUploads },
  );

  return new DropServer(
    {
      port: options.port ?? 8080,
      advertisedHost: options.advertisedHost,
      maxRequestBodySize: options.acceptsUploads
        ? options.maxUploadBytes + MULTIPART_OVERHEAD_BYTES
        : MULTIPART_OVERHEAD_BYTES,
    },
    dispatcher,
  );
}
