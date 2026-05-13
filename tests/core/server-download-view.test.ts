import { afterEach, describe, expect, it } from 'bun:test';
import { createDropServer } from '../../src/core/server.ts';
import type { DropServer } from '../../src/core/server.ts';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';
import { fileConfig } from '../setup.ts';

describe('Download view', () => {
  let server: DropServer;
  let store: DropStore;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    store?.clear();
  });

  it('includes expiration metadata for countdown', async () => {
    store = new DropStore();
    const factory = new DropFactory();
    const config = fileConfig();
    const drop = await factory.fromFile(config.filePath!, config.durationMs);
    store.add(drop.id, drop);

    server = createDropServer(store, factory, {
      port: 0,
      serveAtRoot: false,
      durationMs: config.durationMs,
    });
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}/${drop.id}`);

    expect(res.status).toBe(200);
    const body = await res.text();

    expect(body).toContain('data-expires-at="');
  });

  it('shows a post-download message inviting the user to try Drop', async () => {
    store = new DropStore();
    const factory = new DropFactory();
    const config = fileConfig();
    const drop = await factory.fromFile(config.filePath!, config.durationMs);
    store.add(drop.id, drop);

    server = createDropServer(store, factory, {
      port: 0,
      serveAtRoot: false,
      durationMs: config.durationMs,
    });
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}/${drop.id}`);

    expect(res.status).toBe(200);
    const body = await res.text();

    expect(body).toContain('Now try it yourself: install Drop on your machine.');
  });
});
