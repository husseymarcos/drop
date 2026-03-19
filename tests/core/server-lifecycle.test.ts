import { afterEach, describe, expect, it } from 'bun:test';
import { createDropServer } from '../../src/core/server.ts';
import type { DropServer } from '../../src/core/server.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';

describe('DropServer lifecycle', () => {
  let server: DropServer;
  let manager: InMemorySessionManager;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    manager?.cleanup();
  });

  it('start() returns url and port', async () => {
    manager = new InMemorySessionManager();
    server = createDropServer(manager, {
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
    manager = new InMemorySessionManager();
    const first = createDropServer(manager, {
      port: 0,
      serveAtRoot: false,
      durationMs: 60_000,
    });
    const { port: taken } = await first.start();

    try {
      const second = createDropServer(manager, {
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
