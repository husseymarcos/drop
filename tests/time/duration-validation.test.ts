import { describe, expect, it } from 'bun:test';
import { parseDuration, TimeParserError } from '../../src/utils/time-parser.ts';

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
