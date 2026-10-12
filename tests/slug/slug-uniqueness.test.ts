import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import type { DropContent } from '../../src/drop.ts';

const content: DropContent = {
  fileName: 'f.txt',
  data: Buffer.from('a'),
  mimeType: 'text/plain',
};

describe('Slug uniqueness', () => {
  it('assigns a unique slug to every created drop', () => {
    const ledger = new DropLedger();
    const slugs = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const drop = ledger.create(content, { durationMs: 300_000 });
      const slug = drop.address.kind === 'slug' ? drop.address.value : '';
      expect(slugs.has(slug)).toBe(false);
      slugs.add(slug);
    }
  });

  it('retries generation when a candidate slug is already taken', () => {
    const candidates = ['dupe', 'dupe', 'fresh'];
    let index = 0;
    const ledger = new DropLedger(() => candidates[index++]!);

    ledger.create(content, { durationMs: 300_000 });
    const second = ledger.create(content, { durationMs: 300_000 });

    expect(second.address).toEqual({ kind: 'slug', value: 'fresh' });
  });
});
