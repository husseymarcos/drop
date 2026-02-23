import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI argument validation', () => {
  it('allows omitting file and defaults duration when omitted', () => {
    expect(parseCliArgs(['-t', '5m']).durationMs).toBe(300000);
    expect(parseCliArgs(['-f', 'video.mp4']).durationMs).toBe(300000);
  });

  it('rejects invalid duration formats', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', 'invalid'])).toThrow(Error);
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5x'])).toThrow(Error);
  });
});
