import { afterEach, describe, expect, it } from 'bun:test';
import { createDropServer } from '../../src/core/server.ts';
import type { DropServer } from '../../src/core/server.ts';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';
import { fileConfig } from '../setup.ts';

describe('Server serveAtRoot (alias mode)', () => {
  let server: DropServer;
  let store: DropStore;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    store?.clear();
  });

  it('serves file at GET / when serveAtRoot is true and session exists at root', async () => {
    store = new DropStore();
    const factory = new DropFactory();
    const config = fileConfig('5m', '-a', 'john');
    const drop = await factory.fromFile(config.filePath!, config.durationMs, config.alias);
    store.add(drop.id, drop);

    server = createDropServer(store, factory, {
      port: 0,
      serveAtRoot: true,
      durationMs: config.durationMs,
    });
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('bedtimestory');
    expect(body).not.toContain('Use the CLI to share files');
  });
});
