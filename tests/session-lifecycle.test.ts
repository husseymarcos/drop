import { beforeEach, describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../src/cli/args-parser.ts';
import { InMemorySessionManager } from '../src/core/session-manager.ts';
import type { Logger } from '../src/types/index.ts';

const createMockLogger = (): Logger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
});

describe('Session creation through CLI', () => {
  it('accepts valid CLI commands with various time formats', () => {
    const scenarios = [
      { args: ['-f', 'video.mp4', '-t', '5m'], expected: { duration: 300000, port: 8080 } },
      {
        args: ['-f', 'backup.zip', '-t', '1h', '-p', '3000'],
        expected: { duration: 3600000, port: 3000 },
      },
      { args: ['-f', 'file.txt', '-t', '300'], expected: { duration: 300000, port: 8080 } },
    ];

    for (const scenario of scenarios) {
      const result = parseCliArgs(scenario.args);
      expect(result.config.durationMs).toBe(scenario.expected.duration);
      expect(result.config.port).toBe(scenario.expected.port);
    }
  });
});

describe('Session lifecycle management', () => {
  let manager: InMemorySessionManager;

  beforeEach(() => {
    manager = new InMemorySessionManager(createMockLogger());
  });

  it('returns undefined for non-existent sessions', () => {
    expect(manager.getSession('non-existent')).toBeUndefined();
  });

  it('enforces single-download policy', async () => {
    // This test verifies the business rule: once a file is downloaded, it's no longer available
    // We test this through the public API by creating a real session
    const config = parseCliArgs([
      '-f',
      '/Users/marcoshussey/Documents/Proyects/drop/package.json',
      '-t',
      '5m',
    ]).config;

    const session = await manager.createSession(config);
    const slug = session.id;

    // First consume succeeds
    const consumed = manager.consumeSession(slug);
    expect(consumed).toBeDefined();
    expect(consumed?.isConsumed).toBe(true);

    // Second consume should fail (single-download policy)
    expect(manager.consumeSession(slug)).toBeUndefined();
    expect(manager.getSession(slug)).toBeUndefined();
  });
});

describe('Session expiration', () => {
  it('recognizes expired sessions', async () => {
    const manager = new InMemorySessionManager(createMockLogger());

    // Create a session with a very short expiration time (1 second)
    const config = parseCliArgs([
      '-f',
      '/Users/marcoshussey/Documents/Proyects/drop/package.json',
      '-t',
      '1s',
    ]).config;

    const session = await manager.createSession(config);

    // Wait for expiration (session expires after 1 second)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Session should be expired
    expect(manager.isExpired(session)).toBe(true);
    expect(manager.getSession(session.id)).toBeUndefined();

    manager.cleanup();
  });

  it('recognizes non-expired sessions', async () => {
    const manager = new InMemorySessionManager(createMockLogger());

    // Create a session with a long expiration time
    const config = parseCliArgs([
      '-f',
      '/Users/marcoshussey/Documents/Proyects/drop/package.json',
      '-t',
      '1h',
    ]).config;

    const session = await manager.createSession(config);

    // Session should not be expired immediately
    expect(manager.isExpired(session)).toBe(false);
    expect(manager.getSession(session.id)).toBeDefined();

    manager.cleanup();
  });
});

describe('Resource cleanup', () => {
  it('removes all sessions on cleanup', async () => {
    const manager = new InMemorySessionManager(createMockLogger());

    // Create multiple sessions
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

    // All sessions should exist
    for (const session of sessions) {
      expect(manager.getSession(session.id)).toBeDefined();
    }

    // Cleanup
    manager.cleanup();

    // All sessions should be removed
    for (const session of sessions) {
      expect(manager.getSession(session.id)).toBeUndefined();
    }
  });
});
