import type { DropConfig } from '../types.ts';
import { Drop } from '../drop.ts';
import { detectMimeType } from '../utils.ts';
import { FileLoader } from './file-loader.ts';
import { SlugGenerator } from './slug-generator.ts';

export class InMemorySessionManager {
  private sessions = new Map<string, Drop>();
  private slugGenerator: SlugGenerator;
  private fileLoader: FileLoader;
  private cleanupTimer?: Timer;

  constructor(
    slugGenerator = new SlugGenerator(),
    fileLoader = new FileLoader(),
  ) {
    this.slugGenerator = slugGenerator;
    this.fileLoader = fileLoader;
    this.startCleanupInterval();
  }

  async createSession(config: DropConfig): Promise<Drop> {
    let slug: string | undefined;
    try {
      if (!config.filePath) {
        throw new Error('Missing filePath in DropConfig for createSession');
      }

      slug = config.alias ? '' : this.slugGenerator.generate();
      const expiresAt = new Date(Date.now() + config.durationMs);

      console.debug(`Creating session with slug: ${slug || '(root)'}`);

      const drop = await this.fileLoader.load(config.filePath, slug, expiresAt);

      this.sessions.set(slug, drop);

      console.info(`Session created: ${slug || '(root)'} (expires: ${expiresAt.toISOString()})`);

      return drop;
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
    fileName: string, data: Buffer, durationMs: number): Promise<Drop> {
    const slug = this.slugGenerator.generate();
    const expiresAt = new Date(Date.now() + durationMs);
    const drop = new Drop(slug, fileName, data.length, detectMimeType(fileName), data, expiresAt);

    this.sessions.set(slug, drop);

    console.info(`Upload session created: ${slug} (${fileName})`);

    return drop;
  }

  getSession(slug: string): Drop | undefined {
    const drop = this.sessions.get(slug);
    return drop && !drop.isExpired ? drop : undefined;
  }

  consumeSession(slug: string): Drop | undefined {
    const drop = this.getSession(slug);
    if (drop) {
      drop.consume();
      console.info(`Session download registered: ${slug} (downloads: ${drop.downloadCount})`);
    }
    return drop;
  }

  private deleteSession(slug: string): void {
    const drop = this.sessions.get(slug);
    if (drop) {
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
    let cleaned = 0;

    for (const [slug, drop] of this.sessions.entries()) {
      if (drop.isExpired) {
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
