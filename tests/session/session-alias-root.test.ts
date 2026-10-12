import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import type { DropContent } from '../../src/drop.ts';

const content: DropContent = {
  fileName: 'bedtimestory.txt',
  data: Buffer.from('a'),
  mimeType: 'text/plain',
};

describe('Drop with alias (root address)', () => {
  it('stores a drop at the root address when alias is used', () => {
    const ledger = new DropLedger();
    const drop = ledger.create(content, {
      durationMs: 300_000,
      address: { kind: 'root' },
    });

    expect(drop.address).toEqual({ kind: 'root' });
    expect(ledger.resolve({ kind: 'root' })).toBeDefined();
  });

  it('does not resolve a slug drop at the root address', () => {
    const ledger = new DropLedger(() => 'swift-wave-402');
    ledger.create(content, { durationMs: 300_000 });

    expect(ledger.resolve({ kind: 'root' })).toBeUndefined();
  });
});
