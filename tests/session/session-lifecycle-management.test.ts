import { beforeEach, describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { fixtureFile } from '../setup.ts';

describe('Session lifecycle management', () => {
  let manager: InMemorySessionManager;

  beforeEach(() => {
    manager = new InMemorySessionManager();
  });

  it('returns undefined for non-existent sessions', () => {
    expect(manager.getSession('non-existent')).toBeUndefined();
  });

  it('enforces single-download policy', async () => {
    const config = parseCliArgs([
      '-f',
      fixtureFile,
      '-t',
      '5m',
    ]).config;

    const session = await manager.createSession(config);
    const slug = session.id;

    const consumed = manager.consumeSession(slug);
    expect(consumed).toBeDefined();
    expect(consumed?.isConsumed).toBe(true);

    expect(manager.consumeSession(slug)).toBeUndefined();
    expect(manager.getSession(slug)).toBeUndefined();
  });
});
