import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { DropServer, createDropServer } from '../core/server.ts';
import { BonjourMdnsPublisher, toMdnsHost } from '../core/mdns.ts';
import { DropLedger } from '../core/drop-ledger.ts';
import { FileLoader } from '../core/file-loader.ts';
import { pickLanAddress } from '../core/lan-address.ts';
import { rootAddress } from '../drop.ts';
import type { DropConfig } from '../types.ts';
import { formatBytes, toMessage } from '../utils.ts';
import { parseCliArgs } from './args-parser.ts';
import { buildShareUrls } from './share-urls.ts';
import { waitForStop, type StopReason } from './stop-signal.ts';
import { LiveStatus, renderQr, renderShareCard } from './terminal-output.ts';

const GOODBYE: Record<StopReason, string> = {
  expired: 'Time is up. The link no longer works.',
  interrupted: 'Stopped. The link no longer works.',
  quit: 'Stopped. The link no longer works.',
};

export class DropCli {
  private mdnsPublisher = new BonjourMdnsPublisher();

  async run(args: string[]): Promise<void> {
    try {
      const config = parseCliArgs(args);
      await this.share(config);
      process.exit(0);
    }
    catch (error) {
      console.error(toMessage(error));
      console.error('\nRun with -h or --help for usage information.');
      process.exit(1);
    }
  }

  private async share(config: DropConfig): Promise<void> {
    const content = config.filePath
      ? await new FileLoader().load(resolve(config.filePath))
      : undefined;
    const ledger = new DropLedger();
    const expiresAt = Date.now() + config.durationMs;
    const status = new LiveStatus(process.stdout, expiresAt);
    let baseUrl = '';

    const server = createDropServer(ledger, {
      port: config.port,
      durationMs: config.durationMs,
      advertisedHost: pickLanAddress(networkInterfaces(), config.host),
      acceptsUploads: config.mode === 'receive',
      maxUploadBytes: config.maxUploadBytes,
      report: (message, path) => status.log(path ? `${message}: ${baseUrl}${path}` : message),
    });

    const started = await server.start();
    baseUrl = started.url;
    const activePort = started.port;
    const aliasPublished = this.publishAlias(config, activePort);

    if (content) {
      const drop = ledger.create(content, {
        durationMs: config.durationMs,
        address: config.alias ? rootAddress : undefined,
      });
      const urls = buildShareUrls(config, baseUrl, drop.address, aliasPublished);
      console.log(renderShareCard({
        title: `${drop.fileName} · ${drop.sizeLabel}`,
        urls,
        qr: renderQr(urls.lanUrl),
      }));
    }
    else {
      const urls = buildShareUrls(config, baseUrl, rootAddress, aliasPublished);
      console.log(renderShareCard({
        title: `Receiving files (up to ${formatBytes(config.maxUploadBytes)} per upload)`,
        urls,
        qr: renderQr(urls.lanUrl),
      }));
    }

    status.start();
    const reason = await waitForStop({
      durationMs: config.durationMs,
      keyboard: process.stdin,
      signals: process,
    });
    status.stop();

    await this.shutdown(server, ledger);
    console.log(`  ${GOODBYE[reason]}`);
  }

  private async shutdown(server: DropServer, ledger: DropLedger): Promise<void> {
    await server.stop();
    ledger.clear();
    await this.mdnsPublisher.stop();
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
