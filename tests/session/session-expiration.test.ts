import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import type { DropContent } from '../../src/drop.ts';

const content: DropContent = {
  fileName: 'f.txt',
  data: Buffer.from('a'),
  mimeType: 'text/plain',
};

describe('Session expiration', () => {
  it('hides a drop once its duration elapses', () => {
    let now = 1_000_000;
    const ledger = new DropLedger(() => 'fixed-slug', () => now);
    const drop = ledger.create(content, { durationMs: 1000 });

    expect(ledger.resolve(drop.address)).toBeDefined();

    now += 1001;

    expect(ledger.resolve(drop.address)).toBeUndefined();
  });

  it('keeps a drop available before it expires', () => {
    let now = 1_000_000;
    const ledger = new DropLedger(() => 'fixed-slug', () => now);
    const drop = ledger.create(content, { durationMs: 60_000 });

    now += 59_999;

    expect(ledger.resolve(drop.address)).toBeDefined();
  });
});
