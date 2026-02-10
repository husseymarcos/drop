/**
 * Configuration types for Drop CLI and server
 */

export interface DropConfig {
  filePath: string;
  durationMs: number;
  port?: number;
}

export interface ServerConfig {
  port: number;
  host: string;
}
