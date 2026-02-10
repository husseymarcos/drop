import { describe, expect, it } from 'bun:test';
import { parseDuration } from '../../src/utils/time-parser.ts';

describe('Duration parsing', () => {
  it('converts seconds notation to milliseconds', () => {
    const result = parseDuration('90s');
    expect(result.milliseconds).toBe(90000);
  });

  it('converts minutes notation to milliseconds', () => {
    const result = parseDuration('5m');
    expect(result.milliseconds).toBe(300000);
  });

  it('converts hours notation to milliseconds', () => {
    const result = parseDuration('2h');
    expect(result.milliseconds).toBe(7200000);
  });

  it('converts days notation to milliseconds', () => {
    const result = parseDuration('1d');
    expect(result.milliseconds).toBe(86400000);
  });

  it('interprets bare numbers as seconds', () => {
    const result = parseDuration('300');
    expect(result.milliseconds).toBe(300000);
  });

  it('handles flexible input formats', () => {
    expect(parseDuration('5M').milliseconds).toBe(300000);
    expect(parseDuration('  5m  ').milliseconds).toBe(300000);
  });
});
