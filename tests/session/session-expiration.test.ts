import { describe, expect, it } from 'bun:test';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { fileConfig } from '../setup.ts';

describe('Session expiration', () => {
  it('recognizes expired sessions', async () => {
    const manager = new InMemorySessionManager();
    const session = await manager.createSession(fileConfig('1s'));

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(manager.isExpired(session)).toBe(true);
    expect(manager.getSession(session.id)).toBeUndefined();

    manager.cleanup();
  });

  it('recognizes non-expired sessions', async () => {
    const manager = new InMemorySessionManager();
    const session = await manager.createSession(fileConfig('1h'));

    expect(manager.isExpired(session)).toBe(false);
    expect(manager.getSession(session.id)).toBeDefined();

    manager.cleanup();
  });
});
