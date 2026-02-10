import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';

describe('Resource cleanup', () => {
  it('removes all sessions on cleanup', async () => {
    const manager = new InMemorySessionManager();

    const config = parseCliArgs([
      '-f',
      '/Users/marcoshussey/Documents/Proyects/drop/package.json',
      '-t',
      '5m',
    ]).config;

    const sessions = await Promise.all([
      manager.createSession(config),
      manager.createSession(config),
      manager.createSession(config),
    ]);

    for (const session of sessions) {
      expect(manager.getSession(session.id)).toBeDefined();
    }

    manager.cleanup();

    for (const session of sessions) {
      expect(manager.getSession(session.id)).toBeUndefined();
    }
  });
});
