export interface DropConfig {
  filePath?: string;
  durationMs: number;
  port?: number;
  alias?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  serveAtRoot?: boolean;
  durationMs: number;
}

export const DEFAULT_PORT = 8080;

export interface DropSession {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: Buffer;
  expiresAt: Date;
  downloadCount: number;
}

export interface CliArgs {
  file?: string;
  time?: string;
  port?: string;
  alias?: string;
  help?: boolean;
}
