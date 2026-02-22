export interface DropConfig {
  filePath: string;
  durationMs: number;
  port?: number;
  alias?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  serveAtRoot?: boolean;
}

export const DEFAULT_PORT = 8080;
