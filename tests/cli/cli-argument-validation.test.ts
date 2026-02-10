import { describe, expect, it } from 'bun:test';
import { CliError, parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI argument validation', () => {
  it('requires both file and duration parameters', () => {
    expect(() => parseCliArgs(['-t', '5m'])).toThrow(CliError);
    expect(() => parseCliArgs(['-f', 'video.mp4'])).toThrow(CliError);
  });

  it('rejects invalid duration formats', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', 'invalid'])).toThrow(CliError);
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5x'])).toThrow(CliError);
  });

  it('rejects invalid port numbers', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', '0'])).toThrow(CliError);
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', '70000'])).toThrow(CliError);
  });
});
