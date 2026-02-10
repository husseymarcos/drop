import { describe, expect, it } from 'bun:test';
import { SlugGenerator } from '../../src/core/slug-generator';

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
