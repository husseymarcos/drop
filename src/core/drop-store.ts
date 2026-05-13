import { Drop } from '../drop.ts';

export class DropStore {
  private drops = new Map<string, Drop>();
  private onRemoveCallback?: (slug: string) => void;

  onRemove(callback: (slug: string) => void): void {
    this.onRemoveCallback = callback;
  }

  add(slug: string, drop: Drop): void {
    this.drops.set(slug, drop);
  }

  find(slug: string): Drop | undefined {
    const drop = this.drops.get(slug);
    return drop && !drop.isExpired ? drop : undefined;
  }

  remove(slug: string): void {
    if (this.drops.has(slug)) {
      this.drops.delete(slug);
      this.onRemoveCallback?.(slug);
    }
  }

  all(): Drop[] {
    return [...this.drops.values()];
  }

  clear(): void {
    const slugs = [...this.drops.keys()];
    for (const slug of slugs) {
      this.remove(slug);
    }
  }
}
