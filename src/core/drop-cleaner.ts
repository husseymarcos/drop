import { DropStore } from './drop-store.ts';

export class DropCleaner {
  private timer?: Timer;

  constructor(
    private store: DropStore,
    private intervalMs = 30000,
  ) {}

  start(): void {
    this.timer = setInterval(() => {
      this.performCleanup();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private performCleanup(): void {
    let cleaned = 0;

    for (const drop of this.store.all()) {
      if (drop.isExpired) {
        this.store.remove(drop.id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`Cleaned up ${cleaned} expired sessions`);
    }
  }
}
