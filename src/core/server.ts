/**
 * HTTP Server for Drop
 */

import type { Logger, ServerConfig } from '../types/index.ts';
import type { SessionManager } from './session-manager.ts';

export class DropServerError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'DropServerError';
  }
}

export interface DropServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getUrl(): string;
}

export class BunDropServer implements DropServer {
  private server?: ReturnType<typeof Bun.serve>;
  private sessionManager: SessionManager;
  private logger: Logger;
  private config: ServerConfig;

  constructor(sessionManager: SessionManager, logger: Logger, config: ServerConfig) {
    this.sessionManager = sessionManager;
    this.logger = logger;
    this.config = config;
  }

  async start(): Promise<void> {
    try {
      this.server = Bun.serve({
        port: this.config.port,
        hostname: this.config.host,
        fetch: this.handleRequest.bind(this),
      });

      this.logger.info(`Server started on ${this.getUrl()}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new DropServerError(`Failed to start server on port ${this.config.port}`, err);
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.logger.info('Server stopped');
    }
  }

  getUrl(): string {
    const host = this.config.host === '0.0.0.0' ? this.getLocalIp() : this.config.host;
    return `http://${host}:${this.config.port}`;
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const slug = url.pathname.slice(1); // Remove leading /

    this.logger.debug(`Request: ${request.method} ${url.pathname}`);

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!slug) {
      return this.handleRootRequest();
    }

    return this.handleDownloadRequest(slug);
  }

  private handleRootRequest(): Response {
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Drop - File Sharing</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    .info { background: #f5f5f5; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Drop</h1>
  <div class="info">
    <p>This is a Drop file sharing server.</p>
    <p>Use the CLI to share files:</p>
    <code>drop -f &lt;file&gt; -t &lt;time&gt;</code>
  </div>
</body>
</html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  private handleDownloadRequest(slug: string): Response {
    const session = this.sessionManager.getSession(slug);

    if (!session) {
      this.logger.warn(`Session not found or expired: ${slug}`);
      return new Response('File not found or expired', { status: 404 });
    }

    if (this.sessionManager.isExpired(session)) {
      this.logger.warn(`Session expired: ${slug}`);
      return new Response('File has expired', { status: 410 });
    }

    // Mark session as consumed
    this.sessionManager.consumeSession(slug);

    this.logger.info(`Serving file: ${session.fileName} (${session.fileSize} bytes)`);

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
    // Simple way to get local IP
    const { networkInterfaces } = require('node:os');
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
}
