import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI help functionality', () => {
  it('shows help when requested with -h flag', () => {
    const result = parseCliArgs(['-h']);
    expect(result.showHelp).toBe(true);
  });

  it('shows help when requested with --help flag', () => {
    const result = parseCliArgs(['--help']);
    expect(result.showHelp).toBe(true);
  });

  it('prioritizes help over other arguments', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '5m', '-h']);
    expect(result.showHelp).toBe(true);
  });
});
