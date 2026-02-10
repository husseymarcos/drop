import { describe, expect, it } from 'bun:test';
import { SlugGenerator } from '../src/core/slug-generator.ts';

describe('Slug generation format', () => {
  it('creates identifiers in adjective-noun-number format', () => {
    const generator = new SlugGenerator();
    const slug = generator.generate();
    const parts = slug.split('-');

    expect(parts.length).toBe(3);
    const lastPart = parts[2] ?? '0';
    expect(parseInt(lastPart, 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(lastPart, 10)).toBeLessThanOrEqual(999);
  });

  it('creates URL-safe identifiers', () => {
    const generator = new SlugGenerator();

    for (let i = 0; i < 20; i++) {
      const slug = generator.generate();
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('Slug uniqueness', () => {
  it('generates unique identifiers for multiple sessions', () => {
    const generator = new SlugGenerator();
    const slugs = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const slug = generator.generate();
      expect(slugs.has(slug)).toBe(false);
      slugs.add(slug);
    }
  });
});

describe('Slug lifecycle', () => {
  it('allows releasing identifiers for reuse', () => {
    const generator = new SlugGenerator();
    const slug = generator.generate();

    generator.release(slug);

    expect(() => generator.release(slug)).not.toThrow();
  });
});
