import type { DropConfig } from '../types/config';
import type { DropSession } from '../types/session';
import type { FileLoader } from './file-loader';
import { FileLoaderError, InMemoryFileLoader } from './file-loader';
import * as logger from '../utils/logger.ts';
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
      const slug = this.slugGenerator.generate();
      const expiresAt = new Date(Date.now() + config.durationMs);

      logger.debug(`Creating session with slug: ${slug}`);

      const session = await this.fileLoader.load(config.filePath, slug, expiresAt);

      this.sessions.set(slug, session);

      logger.info(`Session created: ${slug} (expires: ${expiresAt.toISOString()})`);

      return session;
    }
    catch (error) {
      if (error instanceof FileLoaderError) {
        throw new SessionManagerError('Failed to create session', error);
      }
      throw error;
    }
  }

  getSession(slug: string): DropSession | undefined {
    const session = this.sessions.get(slug);

    if (!session) {
      return undefined;
    }

    if (this.isExpired(session) || session.isConsumed) {
      return undefined;
    }

    return session;
  }

  consumeSession(slug: string): DropSession | undefined {
    const session = this.getSession(slug);

    if (!session) {
      return undefined;
    }

    session.isConsumed = true;
    session.downloadCount++;

    logger.info(`Session consumed: ${slug} (downloads: ${session.downloadCount})`);

    // Schedule cleanup after a short delay to allow download to complete
    setTimeout(() => {
      this.deleteSession(slug);
    }, 1000);

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
      logger.info(`Session deleted: ${slug}`);
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
      if (now > session.expiresAt || session.isConsumed) {
        this.deleteSession(slug);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired sessions`);
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

    logger.info('Session manager cleaned up');
  }
}
