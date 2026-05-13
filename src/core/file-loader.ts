import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import JSZip from 'jszip';
import type { DropSession } from '../types.ts';
import { detectMimeType, formatBytes } from '../utils.ts';

export class InMemoryFileLoader {
  async load(filePath: string, sessionId: string, expiresAt: Date): Promise<DropSession> {
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
        mimeType = detectMimeType(fileName);
      }

      console.info(`File loaded: ${fileName} (${formatBytes(data.length)})`);

      return {
        id: sessionId,
        fileName,
        fileSize: data.length,
        mimeType,
        data,
        expiresAt,
        downloadCount: 0,
      };
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
    const zip = new JSZip();
    await this.addDirectoryToZip(zip, directoryPath, '');

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const directoryName = basename(directoryPath);

    return {
      data: buffer,
      fileName: `${directoryName}.zip`,
      mimeType: 'application/zip',
    };
  }

  private async addDirectoryToZip(
    zip: JSZip, directoryPath: string, prefix: string): Promise<void> {
    const entries = await readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(directoryPath, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.addDirectoryToZip(zip, fullPath, relativePath);
      }
      else if (entry.isFile()) {
        const fileData = await readFile(fullPath);
        zip.file(relativePath, fileData);
      }
    }
  }
}
