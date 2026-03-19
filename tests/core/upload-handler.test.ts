import { describe, expect, it } from 'bun:test';
import { handleUpload } from '../../src/core/upload-handler.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';

describe('handleUpload', () => {
  it('returns missing-file when no file parts', async () => {
    const manager = new InMemorySessionManager();
    const formData = new FormData();
    const result = await handleUpload(formData, manager, 60_000);
    expect(result).toEqual({ ok: false, status: 400, body: 'Missing file' });
    manager.cleanup();
  });

  it('creates session from single file without HTTP', async () => {
    const manager = new InMemorySessionManager();
    const formData = new FormData();
    const blob = new Blob(['hello'], { type: 'text/plain' });
    formData.set('file', blob, 'note.txt');

    const result = await handleUpload(formData, manager, 60_000);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.fileName).toBe('note.txt');
    expect(result.payload.mimeType).toBe('text/plain');
    expect(result.payload.slug.length).toBeGreaterThan(0);
    expect(manager.getSession(result.payload.slug)).toBeDefined();
    manager.cleanup();
  });

  it('creates archive session for multiple files', async () => {
    const manager = new InMemorySessionManager();
    const formData = new FormData();
    formData.append('file', new Blob(['a']), 'pkg/a.txt');
    formData.append('file', new Blob(['b']), 'pkg/b.txt');
    formData.set('directoryName', 'pkg');

    const result = await handleUpload(formData, manager, 60_000);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.fileName).toContain('pkg');
    expect(result.payload.fileName.endsWith('.tar')).toBe(true);
    manager.cleanup();
  });
});
