import { networkInterfaces } from 'node:os';
import type { ServerConfig } from '../types/config.ts';
import { routeRequest } from './router.ts';
import type { SessionManager } from './session-manager.ts';
import { renderTemplate } from './template-renderer.ts';
import { handleUpload } from './upload-handler.ts';

export class DropServerError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'DropServerError';
  }
}

export type DropServerConfig = {
  port?: number;
  durationMs: number;
  serveAtRoot?: boolean;
};

export interface DropServer {
  start(): Promise<{ url: string; port: number }>;
  stop(): Promise<void>;
}

export function createDropServer(
  sessionManager: SessionManager,
  config: DropServerConfig,
): DropServer {
  return new BunDropServer(sessionManager, {
    host: '0.0.0.0',
    port: config.port ?? 8080,
    serveAtRoot: config.serveAtRoot ?? false,
    durationMs: config.durationMs,
  });
}

class BunDropServer implements DropServer {
  private server?: ReturnType<typeof Bun.serve>;
  private sessionManager: SessionManager;
  private config: ServerConfig;

  constructor(sessionManager: SessionManager, config: ServerConfig) {
    this.sessionManager = sessionManager;
    this.config = config;
  }

  async start(): Promise<{ url: string; port: number }> {
    const initialPort = this.config.port;
    let nextPort = initialPort;

    while (nextPort <= 65535) {
      try {
        this.server = Bun.serve({
          port: nextPort,
          hostname: this.config.host,
          fetch: this.handleRequest.bind(this),
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
        throw new DropServerError(`Failed to start server on port ${nextPort}`, err);
      }
    }

    throw new DropServerError(
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

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    const route = routeRequest(request.method, pathname, searchParams);

    switch (route.kind) {
      case 'static-css':
        return serveStaticAsset('css');
      case 'static-js':
        return serveStaticAsset('js');
      case 'upload':
        return this.handleUploadRequest(request);
      case 'download':
        return this.handleDownloadRequest(route.slug, route.download ?? false);
      case 'root':
        if (this.config.serveAtRoot && this.sessionManager.getSession('')) {
          return this.handleDownloadRequest('', url.searchParams.get('download') === '1');
        }
        return this.handleRootRequest();
      case 'not-found':
        return this.handleNotFoundRequest();
    }
  }

  private async handleRootRequest(): Promise<Response> {
    const html = await renderTemplate('root', {
      expiresAt: new Date(Date.now() + this.config.durationMs).toISOString(),
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  private async handleUploadRequest(request: Request): Promise<Response> {
    const formData = await request.formData();
    const result = await handleUpload(formData, this.sessionManager, this.config.durationMs);

    if (!result.ok) {
      return new Response(result.body, { status: result.status });
    }

    return new Response(JSON.stringify(result.payload), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  private async handleDownloadRequest(slug: string, shouldDownload: boolean): Promise<Response> {
    const session = this.sessionManager.getSession(slug);

    if (!session) {
      console.warn(`Session not found or expired: ${slug}`);
      const html = await renderTemplate('not-found', {});
      return new Response(html, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (this.sessionManager.isExpired(session)) {
      console.warn(`Session expired: ${slug}`);
      return new Response('File has expired', { status: 410 });
    }

    if (!shouldDownload) {
      const html = await renderTemplate('download', {
        filename: session.fileName,
        slug,
        expiresAt: session.expiresAt.toISOString(),
      });

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    this.sessionManager.consumeSession(slug);

    return new Response(session.data, {
      headers: {
        'Content-Type': session.mimeType,
        'Content-Disposition': `attachment; filename="${session.fileName}"`,
        'Content-Length': session.fileSize.toString(),
        'Cache-Control': 'no-store',
      },
    });
  }

  private async handleNotFoundRequest(): Promise<Response> {
    const html = await renderTemplate('not-found', {});
    return new Response(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  private getLocalIp(): string {
    try {
      const interfaces = networkInterfaces();

      for (const ifaceName of Object.keys(interfaces)) {
        const iface = interfaces[ifaceName];
        if (!iface) continue;

        for (const alias of iface) {
          if (alias.family === 'IPv4' && !alias.internal) {
            return alias.address;
          }
        }
      }
    }
    catch {
      return 'localhost';
    }
    return 'localhost';
  }

  private isAddressInUseError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    if ('code' in error && error.code === 'EADDRINUSE') {
      return true;
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message.includes('EADDRINUSE');
    }

    return false;
  }
}

async function serveStaticAsset(type: 'css' | 'js'): Promise<Response> {
  const path = type === 'css' ? '../views/common.css' : '../views/countdown.js';
  const contentType = type === 'css' ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8';
  const file = Bun.file(new URL(path, import.meta.url));
  return new Response(file, {
    headers: { 'Content-Type': contentType },
  });
}
