import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DropServer } from '../core/server.ts';
import type { MdnsPublisher } from '../core/mdns.ts';
import { BonjourMdnsPublisher, toMdnsHost } from '../core/mdns.ts';
import { BunDropServer, DropServerError } from '../core/server.ts';
import type { SessionManager } from '../core/session-manager.ts';
import { InMemorySessionManager, SessionManagerError } from '../core/session-manager.ts';
import type { DropConfig } from '../types/config.ts';
import { DEFAULT_PORT } from '../types/config.ts';
import type { DropSession } from '../types/session.ts';
import { parseCliArgs } from './args-parser.ts';
import { buildShareUrls } from './share-urls.ts';
export class DropCli {
  private sessionManager?: SessionManager;
  private server?: DropServer;
  private mdnsPublisher: MdnsPublisher;
  private aliasPublished = false;
  private shutdownInProgress = false;

  constructor(mdnsPublisher: MdnsPublisher = new BonjourMdnsPublisher()) {
    this.mdnsPublisher = mdnsPublisher;
  }

  async run(args: string[]): Promise<void> {
    try {
      const config = parseCliArgs(args);
      await this.validateAndRun(config);
    }
    catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        console.error('\nRun with -h or --help for usage information.');
        process.exit(1);
      }

      console.error('Unexpected error:', error);
      process.exit(1);
    }
  }

  private async validateAndRun(config: DropConfig): Promise<void> {
    this.sessionManager = new InMemorySessionManager();

    const port = config.port || DEFAULT_PORT;
    this.server = new BunDropServer(this.sessionManager, {
      port,
      host: '0.0.0.0',
      serveAtRoot: !!config.alias,
      durationMs: config.durationMs,
    });

    if (config.filePath) {
      const resolvedPath = resolve(config.filePath);
      if (!existsSync(resolvedPath)) {
        throw new Error(`File not found: ${config.filePath}`);
      }

      config.filePath = resolvedPath;

      let session: DropSession;
      try {
        session = await this.sessionManager.createSession(config);
        await this.server.start();
      }
      catch (error) {
        if (error instanceof SessionManagerError || error instanceof DropServerError) {
          throw new Error(error.message);
        }
        throw error;
      }

      const activePort = this.server.getPort();
      this.aliasPublished = this.publishAliasIfConfigured(config, activePort);
      const urls = this.getShareUrls(config, activePort, session.id, this.aliasPublished);
      console.log('\n✓ Drop created successfully!\n');
      console.log(`File: ${session.fileName}`);
      console.log(`Size: ${this.formatBytes(session.fileSize)}`);
      console.log(`Expires: ${session.expiresAt.toISOString()}`);
      if (urls.aliasUrl) {
        console.log(`\nAlias URL: ${urls.aliasUrl}`);
        console.log(`LAN URL:   ${urls.lanUrl}\n`);
      }
      else {
        console.log(`\nURL: ${urls.lanUrl}\n`);
      }
      console.log('Waiting for downloads until expiration...\n');
    }
    else {
      try {
        await this.server.start();
      }
      catch (error) {
        if (error instanceof DropServerError) {
          throw new Error(error.message);
        }
        throw error;
      }

      const activePort = this.server.getPort();
      this.aliasPublished = this.publishAliasIfConfigured(config, activePort);

      const baseUrl = this.server.getUrl();
      console.log('\n✓ Drop server ready for uploads!\n');

      if (this.aliasPublished && config.alias) {
        const urls = this.getShareUrls(config, activePort, '', true);
        if (urls.aliasUrl) {
          console.log(`Alias Upload UI: ${urls.aliasUrl}`);
          console.log(`LAN Upload UI:   ${urls.lanUrl}\n`);
        }
        else {
          console.log(`Upload UI: ${baseUrl}/\n`);
        }
      }
      else {
        console.log(`Upload UI: ${baseUrl}/\n`);
      }

      console.log(`Expires: in ${config.durationMs / 1000}s\n`);
    }

    this.setupShutdownHandlers();

    await this.waitForExpiration(config.durationMs);

    await this.shutdown();
  }

  private setupShutdownHandlers(): void {
    const shutdown = (signal: string) => {
      if (this.shutdownInProgress) {
        return;
      }
      this.shutdownInProgress = true;
      console.log(`Received ${signal}, shutting down...`);
      void this.shutdown()
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error during shutdown: ${message}`);
          process.exit(1);
        });
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
    await this.mdnsPublisher.stop();
    if (this.server) {
      await this.server.stop();
    }
    if (this.sessionManager) {
      this.sessionManager.cleanup();
    }
    console.log('Goodbye!');
  }

  private getShareUrls(
    config: DropConfig,
    port: number,
    sessionId: string,
    includeAlias: boolean,
  ): { lanUrl: string; aliasUrl?: string } {
    const baseUrl = this.server?.getUrl() ?? `http://localhost:${port}`;
    return buildShareUrls(config, baseUrl, sessionId, includeAlias);
  }

  private publishAliasIfConfigured(config: DropConfig, port: number): boolean {
    if (!config.alias) {
      return false;
    }
    try {
      this.mdnsPublisher.publishAlias(config.alias, port);
      return true;
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Could not publish mDNS alias "${toMdnsHost(config.alias)}": ${message}`);
      return false;
    }
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
