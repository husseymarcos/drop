import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI argument validation', () => {
  it('requires both file and duration parameters', () => {
    expect(() => parseCliArgs(['-t', '5m'])).toThrow(Error);
    expect(() => parseCliArgs(['-f', 'video.mp4'])).toThrow(Error);
  });

  it('rejects invalid duration formats', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', 'invalid'])).toThrow(Error);
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5x'])).toThrow(Error);
  });
});
