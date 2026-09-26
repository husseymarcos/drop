import { resolve } from 'node:path';
import { DropServer, createDropServer } from '../core/server.ts';
import { BonjourMdnsPublisher, toMdnsHost } from '../core/mdns.ts';
import { DropLedger } from '../core/drop-ledger.ts';
import { FileLoader } from '../core/file-loader.ts';
import { rootAddress } from '../drop.ts';
import type { DropConfig } from '../types.ts';
import { toMessage } from '../utils.ts';
import { parseCliArgs } from './args-parser.ts';
import { buildShareUrls } from './share-urls.ts';

export class DropCli {
  private mdnsPublisher = new BonjourMdnsPublisher();
  private shutdownInProgress = false;

  async run(args: string[]): Promise<void> {
    try {
      const config = parseCliArgs(args);
      await this.validateAndRun(config);
    }
    catch (error) {
      console.error(toMessage(error));
      console.error('\nRun with -h or --help for usage information.');
      process.exit(1);
    }
  }

  private async validateAndRun(config: DropConfig): Promise<void> {
    const ledger = new DropLedger();

    const server = createDropServer(ledger, {
      port: config.port,
      durationMs: config.durationMs,
    });

    const { url: baseUrl, port: activePort } = await server.start();
    const aliasPublished = this.publishAlias(config, activePort);

    if (config.filePath) {
      const content = await new FileLoader().load(resolve(config.filePath));
      const drop = ledger.create(content, {
        durationMs: config.durationMs,
        address: config.alias ? rootAddress : undefined,
      });
      const urls = buildShareUrls(config, baseUrl, drop.address, aliasPublished);

      console.log('\n✓ Drop created successfully!\n');
      console.log(`File: ${drop.fileName}`);
      console.log(`Size: ${drop.sizeLabel}`);
      console.log(`Expires: ${drop.expiresAt.toISOString()}`);
      this.printUrls(urls, 'URL');
      console.log('Waiting for downloads until expiration...\n');
    }
    else {
      console.log('\n✓ Drop server ready for uploads!\n');
      this.printUrls(buildShareUrls(config, baseUrl, rootAddress, aliasPublished), 'Upload UI');
      console.log(`Expires: in ${config.durationMs / 1000}s\n`);
    }

    this.setupShutdownHandlers(server, ledger);
    await Bun.sleep(config.durationMs);
    await this.shutdown(server, ledger);
  }

  /** Prints the LAN URL and, when available, its mDNS alias. */
  private printUrls(
    urls: { lanUrl: string; aliasUrl?: string },
    singleLabel: string,
  ): void {
    if (urls.aliasUrl) {
      console.log(`\nAlias URL: ${urls.aliasUrl}`);
      console.log(`LAN URL:   ${urls.lanUrl}\n`);
    }
    else {
      console.log(`\n${singleLabel}: ${urls.lanUrl}\n`);
    }
  }

  private setupShutdownHandlers(server: DropServer, ledger: DropLedger): void {
    const shutdown = (signal: string) => {
      if (this.shutdownInProgress) return;
      this.shutdownInProgress = true;
      console.log(`Received ${signal}, shutting down...`);
      void this.shutdown(server, ledger)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(`Error during shutdown: ${toMessage(error)}`);
          process.exit(1);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  private async shutdown(server: DropServer, ledger: DropLedger): Promise<void> {
    await this.mdnsPublisher.stop();
    await server.stop();
    ledger.clear();
    console.log('Goodbye!');
  }

  private publishAlias(config: DropConfig, port: number): boolean {
    if (!config.alias) return false;
    try {
      this.mdnsPublisher.publishAlias(config.alias, port);
      return true;
    }
    catch (error) {
      console.warn(
        `Could not publish mDNS alias "${toMdnsHost(config.alias)}": ${toMessage(error)}`,
      );
      return false;
    }
  }
}
