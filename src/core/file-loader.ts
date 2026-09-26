import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { DropContent } from '../drop.ts';
import { buildTarArchive } from './tar-archive.ts';
import { formatBytes } from '../utils.ts';

export class FileLoader {
  async load(filePath: string): Promise<DropContent> {
    console.debug(`Loading file: ${filePath}`);

    try {
      const fileStats = await stat(filePath);
      const content = fileStats.isDirectory()
        ? await this.loadDirectory(filePath)
        : await this.loadFile(filePath);

      console.info(`File loaded: ${content.fileName} (${formatBytes(content.data.length)})`);

      return content;
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to load file: ${filePath}`, err.message);
      throw new Error(`Cannot load file: ${filePath}`, { cause: err });
    }
  }

  private async loadFile(filePath: string): Promise<DropContent> {
    return {
      fileName: basename(filePath),
      data: await readFile(filePath),
      mimeType: Bun.file(filePath).type,
    };
  }

  private async loadDirectory(directoryPath: string): Promise<DropContent> {
    const entries: Record<string, Uint8Array> = {};
    await this.collectEntries(directoryPath, '', entries);
    return buildTarArchive(entries, basename(directoryPath));
  }

  private async collectEntries(
    directoryPath: string,
    prefix: string,
    entries: Record<string, Uint8Array>,
  ): Promise<void> {
    const dirEntries = await readdir(directoryPath, { withFileTypes: true });

    for (const entry of dirEntries) {
      const fullPath = join(directoryPath, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.collectEntries(fullPath, relativePath, entries);
      }
      else if (entry.isFile()) {
        entries[relativePath] = new Uint8Array(await readFile(fullPath));
      }
    }
  }
}
