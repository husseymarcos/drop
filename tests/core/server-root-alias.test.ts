import { afterEach, describe, expect, it } from 'bun:test';
import { createDropServer } from '../../src/core/server.ts';
import type { DropServer } from '../../src/core/server.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { fileConfig } from '../setup.ts';

describe('Server serveAtRoot (alias mode)', () => {
  let server: DropServer;
  let manager: InMemorySessionManager;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    manager?.cleanup();
  });

  it('serves file at GET / when serveAtRoot is true and session exists at root', async () => {
    manager = new InMemorySessionManager();
    const config = fileConfig('5m', '-a', 'john');
    await manager.createSession(config);

    server = createDropServer(manager, {
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
