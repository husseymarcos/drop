import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI alias option', () => {
  it('uses alias in parsed config when provided', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-a', 'john']);
    expect(result.alias).toBe('john');
    expect(result.durationMs).toBe(300000);
  });

  it('normalizes .local suffix in alias values', () => {
    const result = parseCliArgs(['-f', 'file.txt', '-a', 'John.Local']);
    expect(result.alias).toBe('john');
  });

  it('rejects empty alias values', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-a', '   '])).toThrow(Error);
  });

  it('rejects aliases with invalid characters', () => {
    expect(() => parseCliArgs(['-f', 'file.txt', '-a', 'john wifi'])).toThrow(Error);
  });
});
