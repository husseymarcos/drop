import { afterEach, describe, expect, it } from 'bun:test';
import type { DropServer } from '../../src/core/server.ts';
import type { DropLedger } from '../../src/core/drop-ledger.ts';
import { createTestServer, fileConfig, seedDropFromFile } from '../setup';

describe('Server root address (alias mode)', () => {
  let server: DropServer;
  let ledger: DropLedger;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    ledger?.clear();
  });

  it('serves the file at GET / when a drop lives at the root address', async () => {
    const config = fileConfig('5m', '-a', 'john');
    ({ server, ledger } = createTestServer({ durationMs: config.durationMs }));
    await seedDropFromFile(ledger, config.filePath!, config.durationMs, { kind: 'root' });
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('bedtimestory');
    expect(body).not.toContain('Use the CLI to share files');
  });
});
