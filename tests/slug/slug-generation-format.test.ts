import { describe, expect, it } from 'bun:test';
import { SlugGenerator } from '../../src/core/slug-generator';

describe('Slug generation format', () => {
  it('pairs two readable words with a random 8-character token', () => {
    const slug = new SlugGenerator().next();
    expect(slug).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]{8}$/);
  });

  it('creates URL-safe identifiers', () => {
    const generator = new SlugGenerator();
    for (let i = 0; i < 20; i++) {
      expect(generator.next()).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('draws the token from a large space so slugs are hard to guess', () => {
    const generator = new SlugGenerator();
    const tokens = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      tokens.add(generator.next().split('-').at(-1)!);
    }
    expect(tokens.size).toBe(5000);
  });
});
