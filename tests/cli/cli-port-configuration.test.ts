import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI port configuration', () => {
  it('uses default port 8080 when not specified', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '5m']);
    expect(result.config.port).toBe(8080);
  });
});
