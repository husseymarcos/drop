import { describe, expect, it } from 'bun:test';
import { toMdnsHost } from '../../src/core/mdns.ts';

describe('mDNS host helper', () => {
  it('builds .local hostnames from alias values', () => {
    expect(toMdnsHost('john')).toBe('john.local');
    expect(toMdnsHost('marcos-laptop')).toBe('marcos-laptop.local');
  });
});
