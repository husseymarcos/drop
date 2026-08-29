import { Drop } from '../drop.ts';

export class DropStore {
  private drops = new Map<string, Drop>();

  add(slug: string, drop: Drop): void {
    this.drops.set(slug, drop);
  }

  find(slug: string): Drop | undefined {
    const drop = this.drops.get(slug);
    return drop && !drop.isExpired ? drop : undefined;
  }

  clear(): void {
    this.drops.clear();
  }
}
