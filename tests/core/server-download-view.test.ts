import { afterEach, describe, expect, it } from 'bun:test';
import type { DropServer } from '../../src/core/server.ts';
import type { DropLedger } from '../../src/core/drop-ledger.ts';
import { pathFor } from '../../src/drop.ts';
import { createTestServer, fileConfig, seedDropFromFile } from '../setup';

describe('Download view', () => {
  let server: DropServer;
  let ledger: DropLedger;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    ledger?.clear();
  });

  it('includes expiration metadata for countdown', async () => {
    const config = fileConfig();
    ({ server, ledger } = createTestServer({ durationMs: config.durationMs }));
    const drop = await seedDropFromFile(ledger, config.filePath!, config.durationMs);
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}${pathFor(drop.address)}`);

    expect(res.status).toBe(200);
    const body = await res.text();

    expect(body).toContain('data-expires-at="');
  });

  it('serves the file bytes when download is requested', async () => {
    const config = fileConfig();
    ({ server, ledger } = createTestServer({ durationMs: config.durationMs }));
    const drop = await seedDropFromFile(ledger, config.filePath!, config.durationMs);
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}${pathFor(drop.address)}?download=1`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('bedtimestory.txt');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect((await res.arrayBuffer()).byteLength).toBe(drop.fileSize);
  });

  it('shows a post-download message inviting the user to try Drop', async () => {
    const config = fileConfig();
    ({ server, ledger } = createTestServer({ durationMs: config.durationMs }));
    const drop = await seedDropFromFile(ledger, config.filePath!, config.durationMs);
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}${pathFor(drop.address)}`);

    expect(res.status).toBe(200);
    const body = await res.text();

    expect(body).toContain('Now try it yourself: install Drop on your machine.');
  });
});
