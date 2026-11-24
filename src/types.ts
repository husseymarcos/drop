export type DropMode = 'send' | 'receive';

export interface DropConfig {
  mode: DropMode;
  filePath?: string;
  durationMs: number;
  port?: number;
  alias?: string;
  host?: string;
  maxUploadBytes: number;
}

export const DEFAULT_PORT = 8080;

export const DEFAULT_MAX_UPLOAD_BYTES = 1024 ** 3;

export type ActivityLog = (message: string, path?: string) => void;
