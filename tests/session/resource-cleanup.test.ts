import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import type { DropContent } from '../../src/drop.ts';

const content: DropContent = {
  fileName: 'f.txt',
  data: Buffer.from('a'),
  mimeType: 'text/plain',
};

describe('Resource cleanup', () => {
  it('removes all drops on clear', () => {
    const ledger = new DropLedger();
    const drops = [
      ledger.create(content, { durationMs: 300_000 }),
      ledger.create(content, { durationMs: 300_000 }),
      ledger.create(content, { durationMs: 300_000 }),
    ];

    for (const drop of drops) {
      expect(ledger.resolve(drop.address)).toBeDefined();
    }

    ledger.clear();

    for (const drop of drops) {
      expect(ledger.resolve(drop.address)).toBeUndefined();
    }
  });
});
