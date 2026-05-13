import { describe, expect, it } from 'bun:test';
import { DropFactory } from '../../src/core/drop-factory.ts';
import { DropStore } from '../../src/core/drop-store.ts';
import { UploadHandler } from '../../src/core/handlers/upload-handler.ts';

describe('UploadHandler', () => {
  it('returns missing-file when no file parts', async () => {
    const store = new DropStore();
    const factory = new DropFactory();
    const handler = new UploadHandler(factory, store, 60_000);

    const request = new Request('http://localhost/_/upload', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await handler.handle(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing file');
  });

  it('creates drop from single file', async () => {
    const store = new DropStore();
    const factory = new DropFactory();
    const handler = new UploadHandler(factory, store, 60_000);

    const formData = new FormData();
    const blob = new Blob(['hello'], { type: 'text/plain' });
    formData.set('file', blob, 'note.txt');

    const request = new Request('http://localhost/_/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await handler.handle(request);

    expect(response.status).toBe(200);
    const payload = await response.json() as {
      slug: string;
      fileName: string;
      mimeType: string;
    };

    expect(payload.fileName).toBe('note.txt');
    expect(payload.mimeType).toBe('text/plain');
    expect(payload.slug.length).toBeGreaterThan(0);
    expect(store.find(payload.slug)).toBeDefined();
  });

  it('creates archive drop for multiple files', async () => {
    const store = new DropStore();
    const factory = new DropFactory();
    const handler = new UploadHandler(factory, store, 60_000);

    const formData = new FormData();
    formData.append('file', new Blob(['a']), 'pkg/a.txt');
    formData.append('file', new Blob(['b']), 'pkg/b.txt');
    formData.set('directoryName', 'pkg');

    const request = new Request('http://localhost/_/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await handler.handle(request);

    expect(response.status).toBe(200);
    const payload = await response.json() as { fileName: string };

    expect(payload.fileName).toContain('pkg');
    expect(payload.fileName.endsWith('.tar')).toBe(true);
  });
});
