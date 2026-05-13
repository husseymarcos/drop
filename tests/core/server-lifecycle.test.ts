import { afterEach, describe, expect, it } from 'bun:test';
import { createDropServer } from '../../src/core/server.ts';
import type { DropServer } from '../../src/core/server.ts';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';

describe('DropServer lifecycle', () => {
  let server: DropServer;
  let store: DropStore;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    store?.clear();
  });

  it('start() returns url and port', async () => {
    store = new DropStore();
    const factory = new DropFactory();
    server = createDropServer(store, factory, {
      port: 0,
      serveAtRoot: false,
      durationMs: 60_000,
    });

    const info = await server.start();

    expect(typeof info.url).toBe('string');
    expect(info.url.startsWith('http://')).toBe(true);
    expect(Number.isInteger(info.port)).toBe(true);
    expect(info.port).toBeGreaterThan(0);
  });

  it('selects the next port when the preferred port is in use', async () => {
    store = new DropStore();
    const factory = new DropFactory();
    const first = createDropServer(store, factory, {
      port: 0,
      serveAtRoot: false,
      durationMs: 60_000,
    });
    const { port: taken } = await first.start();

    try {
      const second = createDropServer(store, factory, {
        port: taken,
        serveAtRoot: false,
        durationMs: 60_000,
      });
      const { port: chosen } = await second.start();

      expect(chosen).not.toBe(taken);

      server = second;
    }
    finally {
      await first.stop();
    }
  });
});
