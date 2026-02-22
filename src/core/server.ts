import { networkInterfaces } from 'node:os';
import type { ServerConfig } from '../types/config.ts';
import type { SessionManager } from './session-manager.ts';

export class DropServerError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'DropServerError';
  }
}

export interface DropServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getUrl(): string;
  getPort(): number;
}

export class BunDropServer implements DropServer {
  private server?: ReturnType<typeof Bun.serve>;
  private sessionManager: SessionManager;
  private config: ServerConfig;

  constructor(sessionManager: SessionManager, config: ServerConfig) {
    this.sessionManager = sessionManager;
    this.config = config;
  }

  async start(): Promise<void> {
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
        return;
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

  getUrl(): string {
    const host = this.config.host === '0.0.0.0' ? this.getLocalIp() : this.config.host;
    return `http://${host}:${this.config.port}`;
  }

  getPort(): number {
    return this.config.port;
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const shouldDownload = url.searchParams.get('download') === '1';

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (pathname === '/_/common.css') {
      const cssFile = Bun.file(new URL('../views/common.css', import.meta.url));
      return new Response(cssFile, {
        headers: { 'Content-Type': 'text/css; charset=utf-8' },
      });
    }

    const slug = pathname.slice(1);
    if (!slug) {
      if (this.config.serveAtRoot && this.sessionManager.getSession('')) {
        return this.handleDownloadRequest('', shouldDownload);
      }
      return await this.handleRootRequest();
    }

    return this.handleDownloadRequest(slug, shouldDownload);
  }

  private async handleRootRequest(): Promise<Response> {
    const htmlFile = Bun.file(new URL('../views/root.html', import.meta.url));
    return new Response(htmlFile, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  private async handleDownloadRequest(slug: string, shouldDownload: boolean): Promise<Response> {
    const session = this.sessionManager.getSession(slug);

    if (!session) {
      console.warn(`Session not found or expired: ${slug}`);
      const htmlFile = Bun.file(new URL('../views/not-found.html', import.meta.url));
      return new Response(htmlFile, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (this.sessionManager.isExpired(session)) {
      console.warn(`Session expired: ${slug}`);
      return new Response('File has expired', { status: 410 });
    }

    if (!shouldDownload) {
      const templateFile = Bun.file(new URL('../views/download.html', import.meta.url));
      const template = await templateFile.text();
      const html = template
        .replace(/{{FILENAME}}/g, session.fileName)
        .replace(/{{SLUG}}/g, slug);

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

  private getLocalIp(): string {
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
