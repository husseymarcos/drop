import { describe, expect, it } from 'bun:test';
import { formatDuration } from '../../src/utils/time-parser.ts';

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
