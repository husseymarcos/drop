import { describe, expect, it } from 'bun:test';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { fileConfig } from '../setup.ts';

describe('Resource cleanup', () => {
  it('removes all sessions on cleanup', async () => {
    const manager = new InMemorySessionManager();
    const config = fileConfig();

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
