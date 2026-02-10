import { describe, expect, it } from 'bun:test';
import { CliError, parseCliArgs } from '../src/cli/args-parser.ts';

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

describe('CLI port configuration', () => {
  it('uses default port 8080 when not specified', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '5m']);
    expect(result.config.port).toBe(8080);
  });

  it('accepts custom port within valid range', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', '3000']);
    expect(result.config.port).toBe(3000);
  });
});

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
