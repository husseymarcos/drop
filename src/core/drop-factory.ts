import { Drop } from '../drop.ts';
import { detectMimeType } from '../utils.ts';
import { FileLoader } from './file-loader.ts';
import { SlugGenerator } from './slug-generator.ts';

export class DropFactory {
  constructor(
    private slugGenerator = new SlugGenerator(),
    private fileLoader = new FileLoader(),
  ) {}

  async fromFile(filePath: string, durationMs: number, alias?: string): Promise<Drop> {
    const slug = alias ? '' : this.slugGenerator.generate();
    try {
      const expiresAt = new Date(Date.now() + durationMs);
      return await this.fileLoader.load(filePath, slug, expiresAt);
    }
    catch (error) {
      if (slug) this.slugGenerator.release(slug);
      throw error;
    }
  }

  fromUpload(fileName: string, data: Buffer, durationMs: number): Drop {
    const slug = this.slugGenerator.generate();
    const expiresAt = new Date(Date.now() + durationMs);
    return new Drop(slug, fileName, data.length, detectMimeType(fileName), data, expiresAt);
  }

  release(slug: string): void {
    this.slugGenerator.release(slug);
  }
}
