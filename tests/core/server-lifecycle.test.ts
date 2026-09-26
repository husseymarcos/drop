import { afterEach, describe, expect, it } from 'bun:test';
import type { DropServer } from '../../src/core/server.ts';
import type { DropLedger } from '../../src/core/drop-ledger.ts';
import { createTestServer } from '../setup';

describe('DropServer lifecycle', () => {
  let server: DropServer;
  let ledger: DropLedger;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    ledger?.clear();
  });

  it('start() returns url and port', async () => {
    ({ server, ledger } = createTestServer());

    const info = await server.start();

    expect(typeof info.url).toBe('string');
    expect(info.url.startsWith('http://')).toBe(true);
    expect(Number.isInteger(info.port)).toBe(true);
    expect(info.port).toBeGreaterThan(0);
  });

  it('selects the next port when the preferred port is in use', async () => {
    const first = createTestServer();
    const { port: taken } = await first.server.start();

    try {
      const second = createTestServer({ port: taken });
      const { port: chosen } = await second.server.start();

      expect(chosen).not.toBe(taken);

      server = second.server;
      ledger = second.ledger;
    }
    finally {
      await first.server.stop();
    }
  });
});
