/**
 * Business Behavior: Session Identifier Generation
 *
 * Verifies that the system generates appropriate identifiers for
 * sharing sessions that are unique and user-friendly.
 */

import { describe, it, expect } from 'bun:test';
import { SlugGenerator } from '../../src/core/slug-generator.ts';

describe('System generates unique session identifiers', () => {
  it('creates identifiers in adjective-noun-number format', () => {
    const generator = new SlugGenerator();
    const slug = generator.generate();
    const parts = slug.split('-');

    expect(parts.length).toBe(3);
    const lastPart = parts[2] ?? '0';
    expect(parseInt(lastPart, 10)).toBeGreaterThanOrEqual(100);
    expect(parseInt(lastPart, 10)).toBeLessThanOrEqual(999);
  });

  it('never creates duplicate identifiers for different sessions', () => {
    const generator = new SlugGenerator();
    const slugs = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const slug = generator.generate();
      expect(slugs.has(slug)).toBe(false);
      slugs.add(slug);
    }
  });

  it('creates identifiers safe for URLs (alphanumeric and hyphens only)', () => {
    const generator = new SlugGenerator();

    for (let i = 0; i < 20; i++) {
      const slug = generator.generate();
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('allows releasing identifiers for reuse', () => {
    const generator = new SlugGenerator();
    const slug = generator.generate();

    generator.release(slug);

    expect(() => generator.release(slug)).not.toThrow();
  });
});
