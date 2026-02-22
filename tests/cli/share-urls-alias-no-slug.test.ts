import { describe, expect, it } from 'bun:test';
import { buildShareUrls } from '../../src/cli/share-urls.ts';

describe('Share URLs when alias is set (no slug)', () => {
  it('returns LAN and alias URLs without path when sessionId is empty', () => {
    const result = buildShareUrls(
      { alias: 'john', filePath: '/x', durationMs: 300000 },
      'http://192.168.1.1:8080',
      '',
      true,
    );
    expect(result.lanUrl).toBe('http://192.168.1.1:8080/');
    expect(result.aliasUrl).toBe('http://john.local:8080/');
  });

  it('omits port in alias URL when port is 80', () => {
    const result = buildShareUrls(
      { alias: 'john', filePath: '/x', durationMs: 300000 },
      'http://192.168.1.1:80',
      '',
      true,
    );
    expect(result.aliasUrl).toBe('http://john.local/');
  });

  it('returns LAN URL with slug when sessionId is non-empty and no alias', () => {
    const result = buildShareUrls(
      { filePath: '/x', durationMs: 300000 },
      'http://192.168.1.1:8080',
      'swift-wave-402',
      false,
    );
    expect(result.lanUrl).toBe('http://192.168.1.1:8080/swift-wave-402');
    expect(result.aliasUrl).toBeUndefined();
  });
});
