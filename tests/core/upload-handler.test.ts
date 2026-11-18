import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import { UploadHandler } from '../../src/core/handlers/upload-handler.ts';

const MB = 1024 * 1024;

const uploadRequest = (formData: FormData, headers: Record<string, string> = {}) =>
  new Request('http://localhost/_/upload', { method: 'POST', body: formData, headers });

describe('UploadHandler', () => {
  it('returns missing-file when no file parts', async () => {
    const handler = new UploadHandler(new DropLedger(), 60_000, MB);

    const response = await handler.create(uploadRequest(new FormData()));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing file');
  });

  it('creates drop from single file', async () => {
    const ledger = new DropLedger();
    const handler = new UploadHandler(ledger, 60_000, MB);

    const formData = new FormData();
    formData.set('file', new Blob(['hello'], { type: 'text/plain' }), 'note.txt');

    const response = await handler.create(uploadRequest(formData));

    expect(response.status).toBe(200);
    const payload = await response.json() as { path: string; fileName: string; mimeType: string };

    expect(payload.fileName).toBe('note.txt');
    expect(payload.mimeType).toBe('text/plain');
    expect(ledger.resolve({ kind: 'slug', value: payload.path.slice(1) })).toBeDefined();
  });

  it('creates archive drop for multiple files', async () => {
    const handler = new UploadHandler(new DropLedger(), 60_000, MB);

    const formData = new FormData();
    formData.append('file', new Blob(['a']), 'pkg/a.txt');
    formData.append('file', new Blob(['b']), 'pkg/b.txt');
    formData.set('directoryName', 'pkg');

    const response = await handler.create(uploadRequest(formData));

    expect(response.status).toBe(200);
    const payload = await response.json() as { fileName: string; mimeType: string };

    expect(payload.fileName).toBe('pkg.tar');
    expect(payload.mimeType).toBe('application/x-tar');
  });

  it('rejects uploads larger than the cap before reading them', async () => {
    const ledger = new DropLedger();
    const handler = new UploadHandler(ledger, 60_000, MB);

    const formData = new FormData();
    formData.set('file', new Blob(['x'.repeat(2 * MB)]), 'big.bin');

    const response = await handler.create(uploadRequest(formData));

    expect(response.status).toBe(413);
  });

  it('rejects a declared Content-Length above the cap', async () => {
    const handler = new UploadHandler(new DropLedger(), 60_000, MB);
    const formData = new FormData();
    formData.set('file', new Blob(['x']), 'tiny.txt');

    const response = await handler.create(
      uploadRequest(formData, { 'content-length': String(5 * MB) }),
    );

    expect(response.status).toBe(413);
  });

  it('answers 400 for a malformed body', async () => {
    const handler = new UploadHandler(new DropLedger(), 60_000, MB);
    const request = new Request('http://localhost/_/upload', {
      method: 'POST',
      body: 'not multipart',
      headers: { 'content-type': 'multipart/form-data; boundary=nope' },
    });

    expect((await handler.create(request)).status).toBe(400);
  });
});
