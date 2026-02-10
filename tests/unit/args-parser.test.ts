/**
 * Business Behavior: CLI Argument Parsing
 *
 * Verifies that the CLI correctly interprets user commands according
 * to business rules for creating file sharing sessions.
 */

import { describe, it, expect } from 'bun:test';
import { parseCliArgs, CliError } from '../../src/cli/args-parser.ts';

describe('CLI interprets user commands', () => {
  it('accepts file path and duration to create a sharing session', () => {
    const command = parseCliArgs(['-f', 'video.mp4', '-t', '5m']);

    expect(command.config.filePath).toBe('video.mp4');
    expect(command.config.durationMs).toBe(300000); // 5 minutes in milliseconds
  });

  it('uses port 8080 by default when not specified', () => {
    const command = parseCliArgs(['-f', 'file.txt', '-t', '5m']);

    expect(command.config.port).toBe(8080);
  });

  it('allows custom port within valid range (1-65535)', () => {
    const command = parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', '3000']);

    expect(command.config.port).toBe(3000);
  });
});

describe('CLI validates business constraints', () => {
  it('requires both file and duration - cannot share without them', () => {
    expect(() => parseCliArgs(['-t', '5m'])).toThrow(CliError);
    expect(() => parseCliArgs(['-f', 'video.mp4'])).toThrow(CliError);
  });

  it('rejects invalid duration formats to prevent confusion', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', 'invalid'])).toThrow(CliError);
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5x'])).toThrow(CliError);
  });

  it('rejects invalid port numbers to ensure connectivity', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', '0'])).toThrow(CliError);
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', '70000'])).toThrow(CliError);
    expect(() => parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', 'abc'])).toThrow(CliError);
  });

  it('interprets bare numbers as seconds, not minutes', () => {
    // Business rule: "300" means 300 seconds (5 min), not 300 minutes
    const command = parseCliArgs(['-f', 'file.txt', '-t', '300']);

    expect(command.config.durationMs).toBe(300000);
  });
});

describe('CLI provides help functionality', () => {
  it('shows help when requested with -h flag', () => {
    const command = parseCliArgs(['-h']);

    expect(command.showHelp).toBe(true);
  });

  it('shows help when requested with --help flag', () => {
    const command = parseCliArgs(['--help']);

    expect(command.showHelp).toBe(true);
  });

  it('prioritizes help over other arguments', () => {
    const command = parseCliArgs(['-f', 'file.txt', '-t', '5m', '-h']);

    expect(command.showHelp).toBe(true);
  });
});
