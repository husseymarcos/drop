import { describe, expect, it } from 'bun:test';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';
import { fileConfig } from '../setup.ts';

describe('Resource cleanup', () => {
  it('removes all sessions on clear', async () => {
    const store = new DropStore();
    const factory = new DropFactory();
    store.onRemove((slug) => factory.release(slug));

    const drops = await Promise.all([
      factory.fromFile(fileConfig().filePath!, 300000),
      factory.fromFile(fileConfig().filePath!, 300000),
      factory.fromFile(fileConfig().filePath!, 300000),
    ]);

    for (const drop of drops) {
      store.add(drop.id, drop);
    }

    for (const drop of drops) {
      expect(store.find(drop.id)).toBeDefined();
    }

    store.clear();

    for (const drop of drops) {
      expect(store.find(drop.id)).toBeUndefined();
    }
  });
});
