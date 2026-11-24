import { describe, expect, it } from 'bun:test';
import { renderTemplate } from '../../src/core/template-renderer.ts';

describe('renderTemplate', () => {
  it('substitutes placeholders in download template', () => {
    const html = renderTemplate('download', {
      filename: 'report.pdf',
      size: '2.4 MB',
      path: '/swift-wave',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(html).toContain('report.pdf');
    expect(html).toContain('2.4 MB');
    expect(html).toContain('/swift-wave');
    expect(html).toContain('2030-01-01T00:00:00.000Z');
    expect(html).not.toMatch(/{{[A-Z_]+}}/);
  });

  it('leaves empty strings for missing context keys', () => {
    const html = renderTemplate('not-found', {});
    expect(html).not.toMatch(/{{[A-Z_]+}}/);
  });
});
