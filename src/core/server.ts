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
    const slug = url.pathname.slice(1); // Remove leading /

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
      },
    );
  }

  private handleDownloadRequest(slug: string): Response {
    const session = this.sessionManager.getSession(slug);

    if (!session) {
      console.warn(`Session not found or expired: ${slug}`);
      return new Response('File not found or expired', { status: 404 });
    }

    if (this.sessionManager.isExpired(session)) {
      console.warn(`Session expired: ${slug}`);
      return new Response('File has expired', { status: 410 });
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
