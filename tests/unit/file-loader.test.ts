/**
 * Business Behavior: File Type Recognition and Metadata
 *
 * Verifies that the system correctly identifies file types and
 * formats metadata for user display.
 */

import { describe, it, expect } from 'bun:test';
import { InMemoryFileLoader } from '../../src/core/file-loader.ts';
import type { Logger } from '../../src/types/index.ts';

const createMockLogger = (): Logger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
});

describe('System identifies file types correctly', () => {
  const loader = new InMemoryFileLoader(createMockLogger());

  it('recognizes PDF documents', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('document.pdf')).toBe('application/pdf');
  });

  it('recognizes image formats', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('photo.jpg')).toBe('image/jpeg');
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('photo.jpeg')).toBe('image/jpeg');
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('photo.png')).toBe('image/png');
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('photo.gif')).toBe('image/gif');
  });

  it('recognizes video files', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('video.mp4')).toBe('video/mp4');
  });

  it('recognizes audio files', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('song.mp3')).toBe('audio/mpeg');
  });

  it('recognizes text files', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('readme.txt')).toBe('text/plain');
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('data.json')).toBe('application/json');
  });

  it('defaults to binary stream for unknown types', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('file.unknown')).toBe('application/octet-stream');
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('Makefile')).toBe('application/octet-stream');
  });

  it('handles case-insensitive extensions', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('photo.PDF')).toBe('application/pdf');
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).detectMimeType('photo.JPG')).toBe('image/jpeg');
  });
});

describe('System formats file sizes for display', () => {
  const loader = new InMemoryFileLoader(createMockLogger());

  it('displays bytes for small files', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).formatBytes(512)).toBe('512 Bytes');
  });

  it('displays KB for kilobyte-range files', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).formatBytes(1536)).toBe('1.5 KB');
  });

  it('displays MB for megabyte-range files', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('displays GB for gigabyte-range files', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('handles zero bytes', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
    expect((loader as any).formatBytes(0)).toBe('0 Bytes');
  });
});
