import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('CLI positional path and modes', () => {
  it('accepts the file as a positional argument', () => {
    const config = parseCliArgs(['./report.pdf', '-t', '10m']);
    expect(config.mode).toBe('send');
    expect(config.filePath).toBe('./report.pdf');
    expect(config.durationMs).toBe(600_000);
  });

  it('keeps -f working', () => {
    expect(parseCliArgs(['-f', 'video.mp4']).filePath).toBe('video.mp4');
  });

  it('rejects a file given both positionally and with -f', () => {
    expect(() => parseCliArgs(['a.txt', '-f', 'b.txt'])).toThrow('one file');
  });

  it('requires a file when sending', () => {
    expect(() => parseCliArgs(['-t', '5m'])).toThrow('Missing file');
  });

  it('enters receive mode only through the receive command', () => {
    const config = parseCliArgs(['receive', '-t', '30m']);
    expect(config.mode).toBe('receive');
    expect(config.filePath).toBeUndefined();
    expect(config.durationMs).toBe(1_800_000);
  });

  it('rejects a file in receive mode', () => {
    expect(() => parseCliArgs(['receive', 'x.txt'])).toThrow(Error);
  });

  it('parses the host override', () => {
    expect(parseCliArgs(['a.txt', '--host', 'en0']).host).toBe('en0');
    expect(parseCliArgs(['a.txt', '--host', '192.168.1.20']).host).toBe('192.168.1.20');
    expect(parseCliArgs(['a.txt']).host).toBeUndefined();
  });

  it('caps uploads at 1 GB by default and accepts a custom limit', () => {
    expect(parseCliArgs(['receive']).maxUploadBytes).toBe(1024 ** 3);
    expect(parseCliArgs(['receive', '--max-upload', '200mb']).maxUploadBytes).toBe(200 * 1024 ** 2);
    expect(parseCliArgs(['receive', '--max-upload', '2G']).maxUploadBytes).toBe(2 * 1024 ** 3);
    expect(() => parseCliArgs(['receive', '--max-upload', 'lots'])).toThrow('Invalid size');
  });
});
