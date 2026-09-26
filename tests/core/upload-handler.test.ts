import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import { UploadHandler } from '../../src/core/handlers/upload-handler.ts';

describe('UploadHandler', () => {
  it('returns missing-file when no file parts', async () => {
    const handler = new UploadHandler(new DropLedger(), 60_000);

    const request = new Request('http://localhost/_/upload', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await handler.create(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing file');
  });

  it('creates drop from single file', async () => {
    const ledger = new DropLedger();
    const handler = new UploadHandler(ledger, 60_000);

    const formData = new FormData();
    const blob = new Blob(['hello'], { type: 'text/plain' });
    formData.set('file', blob, 'note.txt');

    const request = new Request('http://localhost/_/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await handler.create(request);

    expect(response.status).toBe(200);
    const payload = await response.json() as {
      path: string;
      fileName: string;
      mimeType: string;
    };

    expect(payload.fileName).toBe('note.txt');
    expect(payload.mimeType).toBe('text/plain');
    expect(payload.path.startsWith('/')).toBe(true);
    expect(ledger.resolve({ kind: 'slug', value: payload.path.slice(1) })).toBeDefined();
  });

  it('creates archive drop for multiple files', async () => {
    const ledger = new DropLedger();
    const handler = new UploadHandler(ledger, 60_000);

    const formData = new FormData();
    formData.append('file', new Blob(['a']), 'pkg/a.txt');
    formData.append('file', new Blob(['b']), 'pkg/b.txt');
    formData.set('directoryName', 'pkg');

    const request = new Request('http://localhost/_/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await handler.create(request);

    expect(response.status).toBe(200);
    const payload = await response.json() as { fileName: string; mimeType: string };

    expect(payload.fileName).toBe('pkg.tar');
    expect(payload.mimeType).toBe('application/x-tar');
  });
});
