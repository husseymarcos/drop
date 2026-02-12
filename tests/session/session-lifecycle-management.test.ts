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

  it('allows multiple downloads while session is active', async () => {
    const config = parseCliArgs([
      '-f',
      fixtureFile,
      '-t',
      '5m',
    ]);

    const session = await manager.createSession(config);
    const slug = session.id;

    const firstDownload = manager.consumeSession(slug);
    expect(firstDownload).toBeDefined();
    expect(firstDownload?.downloadCount).toBe(1);

    const secondDownload = manager.consumeSession(slug);
    expect(secondDownload).toBeDefined();
    expect(secondDownload?.downloadCount).toBe(2);

    expect(manager.getSession(slug)).toBeDefined();
  });
});
