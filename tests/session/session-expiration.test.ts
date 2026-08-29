import { describe, expect, it } from 'bun:test';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';
import { fileConfig } from '../setup.ts';

describe('Session expiration', () => {
  it('recognizes expired sessions', async () => {
    const store = new DropStore();
    const factory = new DropFactory();
    const drop = await factory.fromFile(fileConfig('1s').filePath!, 1000);
    store.add(drop.id, drop);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(drop.isExpired).toBe(true);
    expect(store.find(drop.id)).toBeUndefined();
  });

  it('recognizes non-expired sessions', async () => {
    const store = new DropStore();
    const factory = new DropFactory();
    const drop = await factory.fromFile(fileConfig('1h').filePath!, 3600000);
    store.add(drop.id, drop);

    expect(drop.isExpired).toBe(false);
    expect(store.find(drop.id)).toBeDefined();
  });
});
