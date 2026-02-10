import { CliError } from './error.ts';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DropServer } from '../core/server.ts';
import { BunDropServer, DropServerError } from '../core/server.ts';
import type { SessionManager } from '../core/session-manager.ts';
import { InMemorySessionManager, SessionManagerError } from '../core/session-manager.ts';
import type { DropConfig } from '../types/config.ts';
import type { DropSession } from '../types/session.ts';
import { parseCliArgs } from './args-parser.ts';
import { printHelp } from './help.ts';

const DEFAULT_PORT = 8080;
export class DropCli {
  private sessionManager?: SessionManager;
  private server?: DropServer;

  async run(args: string[]): Promise<void> {
    try {
      const { config, showHelp } = parseCliArgs(args);

      if (showHelp) {
        printHelp();
        process.exit(0);
      }

      await this.validateAndRun(config);
    }
    catch (error) {
      if (error instanceof CliError) {
        console.error(error.message);
        console.error('\nRun with -h or --help for usage information.');
        process.exit(1);
      }

      console.error('Unexpected error:', error);
      process.exit(1);
    }
  }

  private async validateAndRun(config: DropConfig): Promise<void> {
    const resolvedPath = resolve(config.filePath);
    if (!existsSync(resolvedPath)) {
      throw new CliError(`File not found: ${config.filePath}`);
    }

    config.filePath = resolvedPath;

    this.sessionManager = new InMemorySessionManager();

    const port = config.port || DEFAULT_PORT;
    this.server = new BunDropServer(this.sessionManager, { port, host: '0.0.0.0' });

    let session: DropSession;
    try {
      session = await this.sessionManager.createSession(config);
    }
    catch (error) {
      if (error instanceof SessionManagerError) {
        throw new CliError(error.message);
      }
      throw error;
    }

    try {
      await this.server.start();
    }
    catch (error) {
      if (error instanceof DropServerError) {
        throw new CliError(error.message);
      }
      throw error;
    }

    const url = `${this.server.getUrl()}/${session.id}`;
    console.log('\n✓ Drop created successfully!\n');
    console.log(`File: ${session.fileName}`);
    console.log(`Size: ${this.formatBytes(session.fileSize)}`);
    console.log(`Expires: ${session.expiresAt.toISOString()}`);
    console.log(`\nURL: ${url}\n`);
    console.log('Waiting for download...\n');

    this.setupShutdownHandlers();

    await this.waitForExpiration(config.durationMs);

    await this.shutdown();
  }

  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      console.info(`Received ${signal}, shutting down...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  private async waitForExpiration(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }

  private async shutdown(): Promise<void> {
    if (this.server) {
      await this.server.stop();
    }
    if (this.sessionManager) {
      this.sessionManager.cleanup();
    }
    console.info('Goodbye!');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }
}

if (import.meta.main) {
  const cli = new DropCli();
  await cli.run(process.argv.slice(2));
}
