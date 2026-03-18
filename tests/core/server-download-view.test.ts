import { afterEach, describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';
import { createDropServer } from '../../src/core/server.ts';
import type { DropServer } from '../../src/core/server.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { fixtureFile } from '../setup.ts';

describe('Download view', () => {
  let server: DropServer;
  let manager: InMemorySessionManager;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    manager?.cleanup();
  });

  it('includes expiration metadata for countdown', async () => {
    manager = new InMemorySessionManager();
    const config = parseCliArgs(['-f', fixtureFile, '-t', '5m']);
    const session = await manager.createSession(config);

    server = createDropServer(manager, {
      port: 0,
      serveAtRoot: false,
      durationMs: config.durationMs,
    });
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}/${session.id}`);

    expect(res.status).toBe(200);
    const body = await res.text();

    expect(body).toContain('data-expires-at="');
  });

  it('shows a post-download message inviting the user to try Drop', async () => {
    manager = new InMemorySessionManager();
    const config = parseCliArgs(['-f', fixtureFile, '-t', '5m']);
    const session = await manager.createSession(config);

    server = createDropServer(manager, {
      port: 0,
      serveAtRoot: false,
      durationMs: config.durationMs,
    });
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}/${session.id}`);

    expect(res.status).toBe(200);
    const body = await res.text();

    expect(body).toContain('Now try it yourself: install Drop on your machine.');
  });
});
