import { beforeEach, describe, expect, it } from 'bun:test';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';
import { fileConfig } from '../setup.ts';

describe('Session with alias (root path)', () => {
  let store: DropStore;
  let factory: DropFactory;

  beforeEach(() => {
    store = new DropStore();
    factory = new DropFactory();
  });

  it('creates drop with empty id when alias is set', async () => {
    const config = fileConfig('5m', '-a', 'john');
    const drop = await factory.fromFile(config.filePath!, config.durationMs, config.alias);
    store.add(drop.id, drop);
    expect(drop.id).toBe('');
  });

  it('resolves drop at root via find("") when alias was used', async () => {
    const config = fileConfig('5m', '-a', 'john');
    const drop = await factory.fromFile(config.filePath!, config.durationMs, config.alias);
    store.add(drop.id, drop);
    const found = store.find('');
    expect(found).toBeDefined();
    expect(found?.id).toBe('');
    expect(found?.fileName).toBe(drop.fileName);
  });
});
