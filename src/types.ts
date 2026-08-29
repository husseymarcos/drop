export interface DropConfig {
  filePath?: string;
  durationMs: number;
  port?: number;
  alias?: string;
}

export const DEFAULT_PORT = 8080;

export interface CliArgs {
  file?: string;
  time?: string;
  port?: string;
  alias?: string;
  help?: boolean;
}
