import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Drop } from '../drop.ts';
import { formatBytes } from '../utils.ts';

export class FileLoader {
  async load(filePath: string, id: string, expiresAt: Date): Promise<Drop> {
    console.debug(`Loading file: ${filePath}`);

    try {
      const fileStats = await stat(filePath);

      let data: Buffer;
      let fileName: string;
      let mimeType: string;

      if (fileStats.isDirectory()) {
        const archive = await this.loadDirectoryAsArchive(filePath);
        data = archive.data;
        fileName = archive.fileName;
        mimeType = archive.mimeType;
      }
      else {
        data = await readFile(filePath);
        fileName = basename(filePath);
        mimeType = Bun.file(filePath).type;
      }

      console.info(`File loaded: ${fileName} (${formatBytes(data.length)})`);

      return new Drop(id, fileName, data.length, mimeType, data, expiresAt);
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to load file: ${filePath}`, err.message);
      throw new Error(`Cannot load file: ${filePath}`, { cause: err });
    }
  }

  private async loadDirectoryAsArchive(
    directoryPath: string,
  ): Promise<{ data: Buffer; fileName: string; mimeType: string }> {
    const entries: Record<string, Uint8Array> = {};
    await this.collectEntries(directoryPath, '', entries);

    const blob = await new Bun.Archive(entries).blob();
    const directoryName = basename(directoryPath);

    return {
      data: Buffer.from(await blob.arrayBuffer()),
      fileName: `${directoryName}.tar`,
      mimeType: 'application/x-tar',
    };
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
