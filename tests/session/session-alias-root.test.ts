import { beforeEach, describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';
import { fixtureFile } from '../setup.ts';

describe('Session with alias (root path)', () => {
  let manager: InMemorySessionManager;

  beforeEach(() => {
    manager = new InMemorySessionManager();
  });

  it('creates session with empty id when alias is set', async () => {
    const config = parseCliArgs(['-f', fixtureFile, '-t', '5m', '-a', 'john']);
    const session = await manager.createSession(config);
    expect(session.id).toBe('');
  });

  it('resolves session at root via getSession("") when alias was used', async () => {
    const config = parseCliArgs(['-f', fixtureFile, '-t', '5m', '-a', 'john']);
    const session = await manager.createSession(config);
    const found = manager.getSession('');
    expect(found).toBeDefined();
    expect(found?.id).toBe('');
    expect(found?.fileName).toBe(session.fileName);
  });
});
