import type { DropConfig } from '../types/config';
import type { DropSession } from '../types/session';
import type { FileLoader } from './file-loader';
import { FileLoaderError, InMemoryFileLoader } from './file-loader';
import { SlugGenerator } from './slug-generator';

export class SessionManagerError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'SessionManagerError';
  }
}

export interface SessionManager {
  createSession(config: DropConfig): Promise<DropSession>;
  createUploadSession(fileName: string, data: Buffer, durationMs: number): Promise<DropSession>;
  getSession(slug: string): DropSession | undefined;
  consumeSession(slug: string): DropSession | undefined;
  isExpired(session: DropSession): boolean;
  cleanup(): void;
}

export class InMemorySessionManager implements SessionManager {
  private sessions: Map<string, DropSession> = new Map();
  private slugGenerator: SlugGenerator;
  private fileLoader: FileLoader;
  private cleanupTimer?: Timer;

  constructor() {
    this.slugGenerator = new SlugGenerator();
    this.fileLoader = new InMemoryFileLoader();
    this.startCleanupInterval();
  }

  async createSession(config: DropConfig): Promise<DropSession> {
    try {
      const slug = config.alias ? '' : this.slugGenerator.generate();
      const expiresAt = new Date(Date.now() + config.durationMs);

      console.debug(`Creating session with slug: ${slug || '(root)'}`);

      if (!config.filePath) {
        throw new SessionManagerError('Missing filePath in DropConfig for createSession');
      }

      const session = await this.fileLoader.load(config.filePath, slug, expiresAt);

      this.sessions.set(slug, session);

      console.info(`Session created: ${slug || '(root)'} (expires: ${expiresAt.toISOString()})`);

      return session;
    }
    catch (error) {
      if (error instanceof FileLoaderError) {
        throw new SessionManagerError('Failed to create session', error);
      }
      throw error;
    }
  }

  async createUploadSession(
    fileName: string, data: Buffer, durationMs: number): Promise<DropSession> {
    const slug = this.slugGenerator.generate();
    const expiresAt = new Date(Date.now() + durationMs);

    const session: DropSession = {
      id: slug,
      fileName,
      fileSize: data.length,
      mimeType: this.detectMimeType(fileName),
      data,
      expiresAt,
      isConsumed: false,
      downloadCount: 0,
    };

    this.sessions.set(slug, session);

    console.info(`
      Upload session created: ${slug} (${fileName}) expires at ${expiresAt.toISOString()}`);

    return session;
  }

  getSession(slug: string): DropSession | undefined {
    const session = this.sessions.get(slug);

    if (!session) {
      return undefined;
    }

    if (this.isExpired(session)) {
      return undefined;
    }

    return session;
  }

  consumeSession(slug: string): DropSession | undefined {
    const session = this.getSession(slug);

    if (!session) {
      return undefined;
    }

    session.downloadCount++;

    console.info(`Session download registered: ${slug} (downloads: ${session.downloadCount})`);

    return session;
  }

  isExpired(session: DropSession): boolean {
    return new Date() > session.expiresAt;
  }

  private deleteSession(slug: string): void {
    const session = this.sessions.get(slug);
    if (session) {
      this.sessions.delete(slug);
      this.slugGenerator.release(slug);
      console.info(`Session deleted: ${slug}`);
    }
  }

  private startCleanupInterval(): void {
    // Run cleanup every 30 seconds
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 30000);
  }

  private performCleanup(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [slug, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.deleteSession(slug);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Clear all sessions
    for (const slug of this.sessions.keys()) {
      this.deleteSession(slug);
    }
  }

  private detectMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      zip: 'application/zip',
      json: 'application/json',
      txt: 'text/plain',
      html: 'text/html',
      js: 'application/javascript',
      ts: 'application/typescript',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
