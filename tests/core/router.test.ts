import { describe, expect, it } from 'bun:test';
import { routeRequest } from '../../src/core/router.ts';

describe('routeRequest', () => {
  it('maps static assets and upload endpoint', () => {
    expect(routeRequest('GET', '/_/common.css', new URLSearchParams())).toEqual({ kind: 'static-css' });
    expect(routeRequest('GET', '/_/countdown.js', new URLSearchParams())).toEqual({ kind: 'static-js' });
    expect(routeRequest('POST', '/_/upload', new URLSearchParams())).toEqual({ kind: 'upload' });
  });

  it('maps GET / to root', () => {
    expect(routeRequest('GET', '/', new URLSearchParams())).toEqual({ kind: 'root' });
  });

  it('maps GET /slug with optional download query', () => {
    expect(routeRequest('GET', '/abc-123', new URLSearchParams())).toEqual({
      kind: 'download',
      slug: 'abc-123',
      download: false,
    });
    const q = new URLSearchParams({ download: '1' });
    expect(routeRequest('GET', '/abc-123', q)).toEqual({
      kind: 'download',
      slug: 'abc-123',
      download: true,
    });
  });

  it('returns not-found for unsupported methods on non-upload paths', () => {
    expect(routeRequest('POST', '/', new URLSearchParams())).toEqual({ kind: 'not-found' });
    expect(routeRequest('PUT', '/foo', new URLSearchParams())).toEqual({ kind: 'not-found' });
  });

  it('does not treat wrong method as static or upload', () => {
    expect(routeRequest('POST', '/_/common.css', new URLSearchParams())).toEqual({ kind: 'not-found' });
  });
});
