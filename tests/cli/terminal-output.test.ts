import { describe, expect, it } from 'bun:test';
import { formatRemaining, renderQr, renderShareCard } from '../../src/cli/terminal-output.ts';

describe('Terminal output', () => {
  it('renders a QR code with block characters', () => {
    const qr = renderQr('http://192.168.1.15:8080/brave-otter-k7m2q9xd');
    const lines = qr.split('\n');

    expect(lines.length).toBeGreaterThan(10);
    expect(qr).toMatch(/[█▀▄]/);
  });

  it('formats the time left as a clock', () => {
    expect(formatRemaining(299_400)).toBe('5:00');
    expect(formatRemaining(61_000)).toBe('1:01');
    expect(formatRemaining(3_723_000)).toBe('1:02:03');
    expect(formatRemaining(-5)).toBe('0:00');
  });

  it('prints the numeric-IP URL next to the alias URL', () => {
    const card = renderShareCard({
      title: 'report.pdf · 2.4 MB',
      urls: { lanUrl: 'http://192.168.1.15/', aliasUrl: 'http://john.local/' },
      qr: 'QR',
    });

    expect(card).toContain('http://john.local/');
    expect(card).toContain('http://192.168.1.15/');
    expect(card).toContain('q');
  });
});
