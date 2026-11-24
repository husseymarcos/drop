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
      content.size,
      content.mimeType,
      content.body,
      expiresAt,
    );

    this.drops.set(keyFor(address), drop);
    return drop;
  }

  resolve(address: DropAddress): Drop | undefined {
    const drop = this.drops.get(keyFor(address));
    return drop && !this.isPast(drop) ? drop : undefined;
  }

  hasExpired(address: DropAddress): boolean {
    const drop = this.drops.get(keyFor(address));
    return drop !== undefined && this.isPast(drop);
  }

  clear(): void {
    this.drops.clear();
  }

  private isPast(drop: Drop): boolean {
    return drop.expiresAt.getTime() <= this.now();
  }

  private uniqueSlug(): string {
    for (let attempt = 0; attempt < 100; attempt++) {
      const slug = this.nextSlug();
      if (!this.drops.has(keyFor(slugAddress(slug)))) {
        return slug;
      }
    }

    throw new Error('Could not find a free slug after 100 attempts');
  }
}

function keyFor(address: DropAddress): string {
  return address.kind === 'root' ? 'root' : `slug:${address.value}`;
}
