import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser';
import { InMemorySessionManager } from '../../src/core/session-manager';
import { SlugGenerator } from '../../src/core/slug-generator';

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
  it('enforces single-download policy', async () => {
    const manager = new InMemorySessionManager();

    const config = parseCliArgs([
      '-f',
      '/Users/marcoshussey/Documents/Proyects/drop/package.json',
      '-t',
      '5m',
    ]).config;
    const session = await manager.createSession(config);

    const consumed = manager.consumeSession(session.id);
    expect(consumed).toBeDefined();
    expect(consumed?.isConsumed).toBe(true);

    expect(manager.consumeSession(session.id)).toBeUndefined();
    expect(manager.getSession(session.id)).toBeUndefined();

    manager.cleanup();
  });

  it('automatically expires sessions after time limit', async () => {
    const manager = new InMemorySessionManager();

    const config = parseCliArgs([
      '-f',
      '/Users/marcoshussey/Documents/Proyects/drop/package.json',
      '-t',
      '1s',
    ]).config;
    const session = await manager.createSession(config);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(manager.isExpired(session)).toBe(true);
    expect(manager.getSession(session.id)).toBeUndefined();

    manager.cleanup();
  });
});

describe('System prevents invalid operations', () => {
  it('rejects incomplete CLI commands', () => {
    expect(() => parseCliArgs(['-t', '5m'])).toThrow();
    expect(() => parseCliArgs(['-f', 'file.txt'])).toThrow();
  });

  it('rejects invalid time specifications', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', 'invalid'])).toThrow();
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '-5m'])).toThrow();
  });
});
