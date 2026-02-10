import { describe, expect, it } from 'bun:test';
import { formatDuration, parseDuration, TimeParserError } from '../src/utils/time-parser.ts';

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

describe('Duration validation', () => {
  it('rejects empty duration', () => {
    expect(() => parseDuration('')).toThrow(TimeParserError);
  });

  it('rejects unknown time units', () => {
    expect(() => parseDuration('5x')).toThrow(TimeParserError);
  });

  it('rejects negative durations', () => {
    expect(() => parseDuration('-300')).toThrow(TimeParserError);
  });

  it('rejects combined units', () => {
    expect(() => parseDuration('5m30s')).toThrow(TimeParserError);
  });
});

describe('Duration formatting', () => {
  it('formats seconds appropriately', () => {
    expect(formatDuration(45000)).toBe('45s');
  });

  it('formats minutes with remaining seconds', () => {
    expect(formatDuration(300000)).toBe('5m 0s');
  });

  it('formats hours with remaining minutes', () => {
    expect(formatDuration(7200000)).toBe('2h 0m');
  });

  it('formats days with remaining hours', () => {
    expect(formatDuration(90000000)).toBe('1d 1h');
  });

  it('handles zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});
