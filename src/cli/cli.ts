import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DropServer, createDropServer } from '../core/server.ts';
import { BonjourMdnsPublisher, toMdnsHost } from '../core/mdns.ts';
import type { MdnsPublisher } from '../core/mdns.ts';
import { DropCleaner } from '../core/drop-cleaner.ts';
import { DropFactory } from '../core/drop-factory.ts';
import { DropStore } from '../core/drop-store.ts';
import type { DropConfig } from '../types.ts';
import { formatBytes } from '../utils.ts';
import { parseCliArgs } from './args-parser.ts';
import { buildShareUrls } from './share-urls.ts';

export class DropCli {
  private mdnsPublisher: MdnsPublisher;
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
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      console.error('\nRun with -h or --help for usage information.');
      process.exit(1);
    }
  }

  private async validateAndRun(config: DropConfig): Promise<void> {
    const store = new DropStore();
    const factory = new DropFactory();
    store.onRemove((slug) => factory.release(slug));

    const cleaner = new DropCleaner(store);
    cleaner.start();

    const server = createDropServer(store, factory, {
      port: config.port,
      serveAtRoot: !!config.alias,
      durationMs: config.durationMs,
    });

    let activePort: number;
    let baseUrl: string;

    try {
      const serverInfo = await server.start();
      activePort = serverInfo.port;
      baseUrl = serverInfo.url;
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }

    const aliasPublished = this.publishAlias(config, activePort);

    if (config.filePath) {
      const resolvedPath = resolve(config.filePath);
      if (!existsSync(resolvedPath)) {
        throw new Error(`File not found: ${config.filePath}`);
      }
      config.filePath = resolvedPath;

      const drop = await factory.fromFile(config.filePath, config.durationMs, config.alias);
      store.add(drop.id, drop);
      const urls = buildShareUrls(config, baseUrl, drop.id, aliasPublished);

      console.log('\n✓ Drop created successfully!\n');
      console.log(`File: ${drop.fileName}`);
      console.log(`Size: ${formatBytes(drop.fileSize)}`);
      console.log(`Expires: ${drop.expiresAt.toISOString()}`);
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
      console.log('\n✓ Drop server ready for uploads!\n');

      if (aliasPublished && config.alias) {
        const urls = buildShareUrls(config, baseUrl, '', true);
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

    this.setupShutdownHandlers(server, store, cleaner);
    await this.waitForExpiration(config.durationMs);
    await this.shutdown(server, store, cleaner);
  }

  private setupShutdownHandlers(
    server: DropServer,
    store: DropStore,
    cleaner: DropCleaner,
  ): void {
    const shutdown = (signal: string) => {
      if (this.shutdownInProgress) return;
      this.shutdownInProgress = true;
      console.log(`Received ${signal}, shutting down...`);
      void this.shutdown(server, store, cleaner)
        .then(() => process.exit(0))
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
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  private async shutdown(
    server: DropServer,
    store: DropStore,
    cleaner: DropCleaner,
  ): Promise<void> {
    await this.mdnsPublisher.stop();
    cleaner.stop();
    await server.stop();
    store.clear();
    console.log('Goodbye!');
  }

  private publishAlias(config: DropConfig, port: number): boolean {
    if (!config.alias) return false;
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
}

if (import.meta.main) {
  const cli = new DropCli();
  await cli.run(process.argv.slice(2));
}
