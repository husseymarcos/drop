import { describe, expect, it } from 'bun:test';
import { renderTemplate } from '../../src/core/template-renderer.ts';

describe('renderTemplate', () => {
  it('substitutes placeholders in download template', async () => {
    const html = await renderTemplate('download', {
      filename: 'report.pdf',
      slug: 'swift-wave',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(html).toContain('report.pdf');
    expect(html).toContain('swift-wave');
    expect(html).toContain('2030-01-01T00:00:00.000Z');
    expect(html).not.toContain('{{FILENAME}}');
    expect(html).not.toContain('{{SLUG}}');
    expect(html).not.toContain('{{EXPIRES_AT}}');
  });

  it('leaves empty strings for missing context keys', async () => {
    const html = await renderTemplate('not-found', {});
    expect(html).not.toContain('{{FILENAME}}');
  });
});
