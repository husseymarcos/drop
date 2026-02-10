import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { DropSession } from '../types/session.ts';

export class FileLoaderError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'FileLoaderError';
  }
}

export interface FileLoader {
  load(filePath: string, sessionId: string, expiresAt: Date): Promise<DropSession>;
}

export class InMemoryFileLoader implements FileLoader {
  async load(filePath: string, sessionId: string, expiresAt: Date): Promise<DropSession> {
    console.debug(`Loading file: ${filePath}`);

    try {
      const data = await readFile(filePath);
      const fileName = basename(filePath);
      const mimeType = this.detectMimeType(fileName);

      console.info(`File loaded: ${fileName} (${this.formatBytes(data.length)})`);

      return {
        id: sessionId,
        fileName,
        fileSize: data.length,
        mimeType,
        data,
        expiresAt,
        isConsumed: false,
        downloadCount: 0,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to load file: ${filePath}`, err.message);
      throw new FileLoaderError(`Cannot load file: ${filePath}`, err);
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

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }
}
