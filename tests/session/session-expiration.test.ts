import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { fixtureFile } from '../setup.ts';

describe('Session expiration', () => {
  it('recognizes expired sessions', async () => {
    const manager = new InMemorySessionManager();

    const config = parseCliArgs([
      '-f',
      fixtureFile,
      '-t',
      '1s',
    ]).config;

    const session = await manager.createSession(config);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(manager.isExpired(session)).toBe(true);
    expect(manager.getSession(session.id)).toBeUndefined();

    manager.cleanup();
  });

  it('recognizes non-expired sessions', async () => {
    const manager = new InMemorySessionManager();

    const config = parseCliArgs([
      '-f',
      fixtureFile,
      '-t',
      '1h',
    ]).config;

    const session = await manager.createSession(config);

    expect(manager.isExpired(session)).toBe(false);
    expect(manager.getSession(session.id)).toBeDefined();

    manager.cleanup();
  });
});
