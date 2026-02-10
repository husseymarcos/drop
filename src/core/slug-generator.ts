import { defaultSuffix, generate } from 'memorable-ids';

export class SlugGenerator {
  private usedSlugs: Set<string> = new Set();

  generate(): string {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const slug = generate({
        components: 2,
        suffix: defaultSuffix,
        separator: '-',
      });

      if (!this.usedSlugs.has(slug)) {
        this.usedSlugs.add(slug);
        return slug;
      }

      attempts++;
    }

    return `drop-${Date.now()}`;
  }

  release(slug: string): void {
    this.usedSlugs.delete(slug);
  }
}
