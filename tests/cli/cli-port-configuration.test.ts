import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI port configuration', () => {
  it('uses default port 8080 when not specified', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '5m']);
    expect(result.port).toBe(8080);
  });

  it('uses port from -p flag', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-t', '5m', '-p', '3000']);
    expect(result.port).toBe(3000);
  });

  it('uses port from --port flag', () => {
    const result = parseCliArgs(['-f', 'file.txt', '--port', '9000']);
    expect(result.port).toBe(9000);
  });

  it('rejects invalid port (non-numeric)', () => {
    expect(() =>
      parseCliArgs(['-f', 'file.txt', '-p', 'abc']),
    ).toThrow('Invalid port');
  });

  it('rejects port out of range (too high)', () => {
    expect(() =>
      parseCliArgs(['-f', 'file.txt', '-p', '70000']),
    ).toThrow('Invalid port');
  });

  it('rejects port zero', () => {
    expect(() =>
      parseCliArgs(['-f', 'file.txt', '-p', '0']),
    ).toThrow('Invalid port');
  });
});
