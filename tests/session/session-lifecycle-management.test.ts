import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import { Drop } from '../../src/drop.ts';

describe('Session lifecycle management', () => {
  it('returns undefined for non-existent sessions', () => {
    const ledger = new DropLedger();
    expect(ledger.resolve({ kind: 'slug', value: 'non-existent' })).toBeUndefined();
  });
});

describe('Drop entity behavior', () => {
  it('derives a human-readable size label', () => {
    const drop = new Drop(
      { kind: 'slug', value: 'x' },
      'f.txt',
      1536,
      'text/plain',
      Buffer.from('a'),
      new Date(Date.now() + 60_000),
    );
    expect(drop.sizeLabel).toBe('1.5 KB');
  });
});
