import type { DropConfig, DropSession } from '../types.ts';
import { detectMimeType } from '../utils.ts';
import { InMemoryFileLoader } from './file-loader.ts';
import { SlugGenerator } from './slug-generator.ts';

export class InMemorySessionManager {
  private sessions: Map<string, DropSession> = new Map();
  private slugGenerator: SlugGenerator;
  private fileLoader: InMemoryFileLoader;
  private cleanupTimer?: Timer;

  constructor() {
    this.slugGenerator = new SlugGenerator();
    this.fileLoader = new InMemoryFileLoader();
    this.startCleanupInterval();
  }

  async createSession(config: DropConfig): Promise<DropSession> {
    let slug: string | undefined;
    try {
      if (!config.filePath) {
        throw new Error('Missing filePath in DropConfig for createSession');
      }

      slug = config.alias ? '' : this.slugGenerator.generate();
      const expiresAt = new Date(Date.now() + config.durationMs);

      console.debug(`Creating session with slug: ${slug || '(root)'}`);

      const session = await this.fileLoader.load(config.filePath, slug, expiresAt);

      this.sessions.set(slug, session);

      console.info(`Session created: ${slug || '(root)'} (expires: ${expiresAt.toISOString()})`);

      return session;
    }
    catch (error) {
      if (slug && slug.length > 0) {
        this.slugGenerator.release(slug);
      }

      if (error instanceof Error && error.message.includes('Cannot load file')) {
        throw error;
      }

      throw new Error('Failed to create session', { cause: error instanceof Error ? error : undefined });
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
      mimeType: detectMimeType(fileName),
      data,
      expiresAt,
      downloadCount: 0,
    };

    this.sessions.set(slug, session);

    console.info(`Upload session created: ${slug} (${fileName})`);

    return session;
  }

  getSession(slug: string): DropSession | undefined {
    const session = this.sessions.get(slug);

    if (!session || this.isExpired(session)) {
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

    for (const slug of this.sessions.keys()) {
      this.deleteSession(slug);
    }
  }
}
