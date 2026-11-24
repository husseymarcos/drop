import { Bonjour, type Service } from 'bonjour-service';
import { toMessage } from '../utils.ts';

export const toMdnsHost = (alias: string): string => `${alias}.local`;

export class BonjourMdnsPublisher {
  private bonjour?: Bonjour;
  private service?: Service;

  publishAlias(alias: string, port: number): void {
    if (this.service) {
      return;
    }
    const host = toMdnsHost(alias);
    this.bonjour = new Bonjour();
    this.service = this.bonjour.publish({
      name: `Drop ${alias}`,
      type: 'http',
      port,
      host,
      txt: { app: 'drop' },
    });
    this.service.on('error', (error) => {
      console.warn(`mDNS publish warning: ${toMessage(error)}`);
    });
  }

  async stop(): Promise<void> {
    if (!this.bonjour) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.bonjour?.unpublishAll(() => resolve());
    });
    await new Promise<void>((resolve) => {
      this.bonjour?.destroy(() => resolve());
    });
    this.service = undefined;
    this.bonjour = undefined;
  }
}
