export interface DropConfig {
  filePath: string;
  durationMs: number;
  port?: number;
  alias?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
}

export const DEFAULT_PORT = 8080;
