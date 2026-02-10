import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI time format interpretation', () => {
  it('parses seconds notation correctly', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '90s']);
    expect(result.config.durationMs).toBe(90000);
  });

  it('parses minutes notation correctly', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '5m']);
    expect(result.config.durationMs).toBe(300000);
  });

  it('parses hours notation correctly', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '1h']);
    expect(result.config.durationMs).toBe(3600000);
  });

  it('interprets bare numbers as seconds', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '300']);
    expect(result.config.durationMs).toBe(300000);
  });
});
