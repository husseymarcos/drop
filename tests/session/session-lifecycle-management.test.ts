import { beforeEach, describe, expect, it } from 'bun:test';
import { Drop } from '../../src/drop.ts';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';
import { fileConfig } from '../setup.ts';

describe('Session lifecycle management', () => {
  let store: DropStore;
  let factory: DropFactory;

  beforeEach(() => {
    store = new DropStore();
    factory = new DropFactory();
    store.onRemove((slug) => factory.release(slug));
  });

  it('returns undefined for non-existent sessions', () => {
    expect(store.find('non-existent')).toBeUndefined();
  });

  it('allows multiple downloads while session is active', async () => {
    const config = fileConfig();
    const drop = await factory.fromFile(config.filePath!, config.durationMs);
    store.add(drop.id, drop);

    drop.consume();
    expect(drop.downloadCount).toBe(1);

    drop.consume();
    expect(drop.downloadCount).toBe(2);

    expect(store.find(drop.id)).toBeDefined();
  });
});

describe('Drop entity behavior', () => {
  it('tracks its own expiration', () => {
    const expiredDrop = new Drop('x', 'f.txt', 1, 'text/plain', Buffer.from('a'), new Date(Date.now() - 1000));
    expect(expiredDrop.isExpired).toBe(true);

    const freshDrop = new Drop('y', 'f.txt', 1, 'text/plain', Buffer.from('a'), new Date(Date.now() + 60000));
    expect(freshDrop.isExpired).toBe(false);
  });

  it('increments download count on consume', () => {
    const drop = new Drop('x', 'f.txt', 1, 'text/plain', Buffer.from('a'), new Date());
    drop.consume();
    drop.consume();
    expect(drop.downloadCount).toBe(2);
  });
});
