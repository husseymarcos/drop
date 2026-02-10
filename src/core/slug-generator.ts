/**
 * Slug generator - creates unique, readable identifiers
 */

const ADJECTIVES = [
  'swift',
  'bright',
  'calm',
  'bold',
  'cool',
  'warm',
  'wild',
  'quiet',
  'rapid',
  'smooth',
  'sharp',
  'light',
  'dark',
  'quick',
  'brave',
];

const NOUNS = [
  'wave',
  'star',
  'wind',
  'fire',
  'moon',
  'sun',
  'bird',
  'fish',
  'tree',
  'flow',
  'path',
  'beam',
  'spark',
  'drop',
  'leaf',
];

export class SlugGenerator {
  private usedSlugs: Set<string> = new Set();

  generate(): string {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      const num = Math.floor(Math.random() * 900) + 100; // 100-999
      const slug = `${adj}-${noun}-${num}`;

      if (!this.usedSlugs.has(slug)) {
        this.usedSlugs.add(slug);
        return slug;
      }

      attempts++;
    }

    // Fallback to timestamp-based slug
    return `drop-${Date.now()}`;
  }

  release(slug: string): void {
    this.usedSlugs.delete(slug);
  }
}
