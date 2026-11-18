import { readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { DropContent } from '../drop.ts';
import { buildTarStream, type TarEntry } from './tar-stream.ts';

export class FileLoader {
  async load(filePath: string): Promise<DropContent> {
    try {
      const fileStats = await stat(filePath);
      return fileStats.isDirectory()
        ? await this.loadDirectory(filePath)
        : this.loadFile(filePath, fileStats.size);
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Cannot read ${filePath}: ${err.message}`, { cause: err });
    }
  }

  private loadFile(filePath: string, size: number): DropContent {
    const file = Bun.file(filePath);
    return {
      fileName: basename(filePath),
      mimeType: file.type,
      size,
      body: () => file,
    };
  }

  private async loadDirectory(directoryPath: string): Promise<DropContent> {
    const entries: TarEntry[] = [];
    await this.collectEntries(directoryPath, '', entries);
    return buildTarStream(entries, basename(directoryPath));
  }

  private async collectEntries(
    directoryPath: string,
    prefix: string,
    entries: TarEntry[],
  ): Promise<void> {
    const dirEntries = await readdir(directoryPath, { withFileTypes: true });

    for (const entry of dirEntries) {
      const fullPath = join(directoryPath, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.collectEntries(fullPath, relativePath, entries);
      }
      else if (entry.isFile()) {
        const { size } = await stat(fullPath);
        entries.push({ path: relativePath, blob: Bun.file(fullPath).slice(0, size) });
      }
    }
  }
}
