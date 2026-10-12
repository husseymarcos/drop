import { Drop, type DropAddress, type DropContent, slugAddress } from '../drop.ts';
import { SlugGenerator } from './slug-generator.ts';

export type CreateDropOptions = {
  durationMs: number;
  address?: DropAddress;
};

const defaultSlugGenerator = new SlugGenerator();

export class DropLedger {
  private drops = new Map<string, Drop>();

  constructor(
    private nextSlug: () => string = () => defaultSlugGenerator.next(),
    private now: () => number = Date.now,
  ) {}

  create(content: DropContent, options: CreateDropOptions): Drop {
    const address = options.address ?? slugAddress(this.uniqueSlug());
    const expiresAt = new Date(this.now() + options.durationMs);
    const drop = new Drop(
      address,
      content.fileName,
      content.data.length,
      content.mimeType,
      content.data,
      expiresAt,
    );

    this.drops.set(keyFor(address), drop);
    return drop;
  }

  resolve(address: DropAddress): Drop | undefined {
    const drop = this.drops.get(keyFor(address));
    return drop && drop.expiresAt.getTime() > this.now() ? drop : undefined;
  }

  clear(): void {
    this.drops.clear();
  }

  private uniqueSlug(): string {
    for (let attempt = 0; attempt < 100; attempt++) {
      const slug = this.nextSlug();
      if (!this.drops.has(keyFor(slugAddress(slug)))) {
        return slug;
      }
    }

    return `drop-${this.now()}`;
  }
}

function keyFor(address: DropAddress): string {
  return address.kind === 'root' ? 'root' : `slug:${address.value}`;
}
