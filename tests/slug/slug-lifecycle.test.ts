import { describe, expect, it } from 'bun:test';
import { SlugGenerator } from '../../src/core/slug-generator.ts';

describe('Slug lifecycle', () => {
  it('allows releasing identifiers for reuse', () => {
    const generator = new SlugGenerator();
    const slug = generator.generate();

    generator.release(slug);

    expect(() => generator.release(slug)).not.toThrow();
  });
});
