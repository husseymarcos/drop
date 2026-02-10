/**
 * Business Behavior: File Sharing Session Lifecycle
 *
 * Verifies the core business rules for managing ephemeral file
 * sharing sessions: creation, expiration, and single-use policy.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import type { Logger, DropSession } from '../../src/types/index.ts';

const createMockLogger = (): Logger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
});

describe('Session lifecycle and expiration', () => {
  let manager: InMemorySessionManager;

  beforeEach(() => {
    manager = new InMemorySessionManager(createMockLogger());
  });

  it('recognizes active sessions that have not expired', () => {
    const futureDate = new Date(Date.now() + 300000);
    const session = createMockSession('active-123', futureDate, false);

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    (manager as any).sessions.set('active-123', session);

    expect(manager.isExpired(session)).toBe(false);
    expect(manager.getSession('active-123')).toBeDefined();
  });

  it('recognizes expired sessions and denies access', () => {
    const pastDate = new Date(Date.now() - 1000);
    const session = createMockSession('expired-123', pastDate, false);

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    (manager as any).sessions.set('expired-123', session);

    expect(manager.isExpired(session)).toBe(true);
    expect(manager.getSession('expired-123')).toBeUndefined();
  });
});

describe('Single-use download policy', () => {
  let manager: InMemorySessionManager;

  beforeEach(() => {
    manager = new InMemorySessionManager(createMockLogger());
  });

  it('allows the first download and marks session consumed', () => {
    const futureDate = new Date(Date.now() + 300000);
    const session = createMockSession('share-123', futureDate, false);

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    (manager as any).sessions.set('share-123', session);

    const consumed = manager.consumeSession('share-123');

    expect(consumed).toBeDefined();
    expect(consumed?.isConsumed).toBe(true);
    expect(consumed?.downloadCount).toBe(1);
  });

  it('denies subsequent downloads after consumption', () => {
    const futureDate = new Date(Date.now() + 300000);
    const session = createMockSession('share-123', futureDate, false);

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    (manager as any).sessions.set('share-123', session);

    // First download succeeds
    manager.consumeSession('share-123');

    // Second download fails
    expect(manager.consumeSession('share-123')).toBeUndefined();
    expect(manager.getSession('share-123')).toBeUndefined();
  });
});

describe('Session access control', () => {
  let manager: InMemorySessionManager;

  beforeEach(() => {
    manager = new InMemorySessionManager(createMockLogger());
  });

  it('returns undefined for non-existent sessions', () => {
    expect(manager.getSession('non-existent')).toBeUndefined();
  });

  it('prevents access to already-consumed sessions', () => {
    const futureDate = new Date(Date.now() + 300000);
    const session = createMockSession('consumed-123', futureDate, true, 1);

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    (manager as any).sessions.set('consumed-123', session);

    expect(manager.getSession('consumed-123')).toBeUndefined();
  });
});

describe('Resource cleanup', () => {
  it('removes all sessions on system shutdown', () => {
    const manager = new InMemorySessionManager(createMockLogger());
    const futureDate = new Date(Date.now() + 300000);

    for (let i = 0; i < 5; i++) {
      const session = createMockSession(`session-${i}`, futureDate, false);
      // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
      (manager as any).sessions.set(`session-${i}`, session);
    }

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    expect((manager as any).sessions.size).toBe(5);

    manager.cleanup();

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    expect((manager as any).sessions.size).toBe(0);
  });
});

// Helper function to create mock sessions
function createMockSession(
  id: string,
  expiresAt: Date,
  isConsumed: boolean,
  downloadCount = 0
): DropSession {
  return {
    id,
    fileName: 'test.txt',
    fileSize: 100,
    mimeType: 'text/plain',
    data: Buffer.from('test'),
    expiresAt,
    isConsumed,
    downloadCount,
  };
}
