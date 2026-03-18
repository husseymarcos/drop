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

export type DropServerConfig = {
  port?: number;
  durationMs: number;
  serveAtRoot?: boolean;
};

export interface DropServer {
  start(): Promise<{ url: string; port: number }>;
  stop(): Promise<void>;
}

export function createDropServer(sessionManager: SessionManager, config: DropServerConfig): DropServer {
  return new BunDropServer(sessionManager, {
    host: '0.0.0.0',
    port: config.port ?? 8080,
    serveAtRoot: config.serveAtRoot ?? false,
    durationMs: config.durationMs,
  });
}

export class BunDropServer implements DropServer {
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

  getUrl(): string {
    const host = this.config.host === '0.0.0.0' ? this.getLocalIp() : this.config.host;
    const port = this.config.port;
    const portSuffix = port === 80 ? '' : `:${port}`;
    return `http://${host}${portSuffix}`;
  }

  getPort(): number {
    return this.config.port;
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
      default:
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
    const files = formData.getAll('file').filter((value) => value instanceof File) as File[];

    if (files.length === 0) {
      return new Response('Missing file', { status: 400 });
    }

    const durationMs = this.config.durationMs;

    const directoryNameField = formData.get('directoryName');
    const directoryName = typeof directoryNameField === 'string' && directoryNameField.trim().length > 0
      ? directoryNameField.trim()
      : undefined;

    let session;

    if (files.length === 1 && !directoryName) {
      const result = await handleUploadSingle(files[0]!, this.sessionManager, durationMs);
      session = result.session;
    }
    else {
      const result = await handleUploadMultiple(files, directoryName, this.sessionManager, durationMs);
      session = result.session;
    }

    const payload = {
      slug: session.id,
      fileName: session.fileName,
      expiresAt: session.expiresAt.toISOString(),
      fileSize: session.fileSize,
      mimeType: session.mimeType,
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  private async handleDownloadRequest(slug: string, shouldDownload: boolean): Promise<Response> {
    const session = this.sessionManager.getSession(slug);

    if (!session) {
      console.warn(`Session not found or expired: ${slug}`);
      const html = await renderTemplate('notFound', {});
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
    const html = await renderTemplate('notFound', {});
    return new Response(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
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

export type Route =
  | { kind: 'static-css' }
  | { kind: 'static-js' }
  | { kind: 'upload' }
  | { kind: 'download'; slug: string; download: boolean }
  | { kind: 'root'; isDownload: boolean }
  | { kind: 'notFound' };

export function routeRequest(
  method: string,
  pathname: string,
  searchParams: URLSearchParams,
): Route {
  if (pathname === '/_/common.css' && method === 'GET') {
    return { kind: 'static-css' };
  }

  if (pathname === '/_/countdown.js' && method === 'GET') {
    return { kind: 'static-js' };
  }

  if (pathname === '/_/upload' && method === 'POST') {
    return { kind: 'upload' };
  }

  if (method !== 'GET') {
    return { kind: 'notFound' };
  }

  const slug = pathname.slice(1);
  if (!slug) {
    return { kind: 'root', isDownload: false };
  }

  return {
    kind: 'download',
    slug,
    download: searchParams.get('download') === '1',
  };
}

async function serveStaticAsset(type: 'css' | 'js'): Promise<Response> {
  const path = type === 'css' ? '../views/common.css' : '../views/countdown.js';
  const contentType = type === 'css' ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8';
  const file = Bun.file(new URL(path, import.meta.url));
  return new Response(file, {
    headers: { 'Content-Type': contentType },
  });
}

export type TemplateName = 'root' | 'download' | 'notFound';

export type TemplateContext = {
  filename?: string;
  slug?: string;
  expiresAt?: string;
};

export async function renderTemplate(name: TemplateName, context: TemplateContext): Promise<string> {
  const pathMap: Record<TemplateName, string> = {
    root: '../views/root.html',
    download: '../views/download.html',
    notFound: '../views/not-found.html',
  };

  const htmlFile = Bun.file(new URL(pathMap[name], import.meta.url));
  const template = await htmlFile.text();

  let result = template;
  result = result.replace(/{{FILENAME}}/g, context.filename ?? '');
  result = result.replace(/{{SLUG}}/g, context.slug ?? '');
  result = result.replace(/{{EXPIRES_AT}}/g, context.expiresAt ?? '');

  return result;
}

export interface UploadResult {
  session: Awaited<ReturnType<SessionManager['createUploadSession']>>;
}

export async function handleUploadSingle(
  file: File,
  sessionManager: SessionManager,
  durationMs: number,
): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  const fileName = file.name || 'upload';

  const session = await sessionManager.createUploadSession(
    fileName,
    data,
    durationMs,
  );

  return { session };
}

export async function handleUploadMultiple(
  files: File[],
  directoryName: string | undefined,
  sessionManager: SessionManager,
  durationMs: number,
): Promise<UploadResult> {
  const archiveEntries: Record<string, Uint8Array> = {};

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    archiveEntries[file.name] = new Uint8Array(arrayBuffer);
  }

  const archive = new Bun.Archive(archiveEntries);
  const archiveBlob = await archive.blob();
  const archiveBuffer = Buffer.from(await archiveBlob.arrayBuffer());

  const inferredDirectoryName = directoryName
    ?? (files[0]?.name?.split('/')[0] || 'directory');

  const archiveFileName = `${inferredDirectoryName}.tar`;

  const session = await sessionManager.createUploadSession(
    archiveFileName,
    archiveBuffer,
    durationMs,
  );

  return { session };
}
