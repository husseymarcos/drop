/**
 * Business Behavior: End-to-End File Sharing Flows
 *
 * Verifies complete user scenarios and business processes
 * without testing implementation details.
 */

import { describe, it, expect } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { SlugGenerator } from '../../src/core/slug-generator.ts';
import type { Logger } from '../../src/types/index.ts';

const createMockLogger = (): Logger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
});

describe('User creates a file sharing session', () => {
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

describe('System generates unique sharing links', () => {
  it('creates distinct identifiers for concurrent sessions', () => {
    const generator = new SlugGenerator();
    const slugs = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const slug = generator.generate();
      expect(slugs.has(slug)).toBe(false);
      slugs.add(slug);
    }
  });
});

describe('Session security and access control', () => {
  it('enforces single-download policy', () => {
    const manager = new InMemorySessionManager(createMockLogger());
    const session = {
      id: 'secure-session',
      fileName: 'confidential.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      data: Buffer.from('content'),
      expiresAt: new Date(Date.now() + 300000),
      isConsumed: false,
      downloadCount: 0,
    };

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    (manager as any).sessions.set('secure-session', session);

    // First download succeeds
    expect(manager.consumeSession('secure-session')).toBeDefined();

    // Second download fails
    expect(manager.consumeSession('secure-session')).toBeUndefined();
  });

  it('automatically expires sessions after time limit', () => {
    const manager = new InMemorySessionManager(createMockLogger());
    const expiredSession = {
      id: 'expired-session',
      fileName: 'old.txt',
      fileSize: 100,
      mimeType: 'text/plain',
      data: Buffer.from('content'),
      expiresAt: new Date(Date.now() - 1000), // Expired
      isConsumed: false,
      downloadCount: 0,
    };

    // biome-ignore lint/suspicious/noExplicitAny: Accessing private member for testing
    (manager as any).sessions.set('expired-session', expiredSession);

    expect(manager.getSession('expired-session')).toBeUndefined();
    expect(manager.isExpired(expiredSession)).toBe(true);
  });
});

describe('System prevents invalid operations', () => {
  it('rejects incomplete CLI commands', () => {
    expect(() => parseCliArgs(['-t', '5m'])).toThrow(); // Missing file
    expect(() => parseCliArgs(['-f', 'file.txt'])).toThrow(); // Missing time
  });

  it('rejects invalid time specifications', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', 'invalid'])).toThrow();
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '-5m'])).toThrow();
  });
});
