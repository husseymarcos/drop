import { afterEach, describe, expect, it } from 'bun:test';
import type { DropServer } from '../../src/core/server.ts';
import type { DropLedger } from '../../src/core/drop-ledger.ts';
import { createTestServer } from '../setup';

describe('Root upload mode', () => {
  let server: DropServer;
  let ledger: DropLedger;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    ledger?.clear();
  });

  it('renders a root view with a drag-and-drop upload card', async () => {
    ({ server, ledger } = createTestServer({ durationMs: 5 * 60 * 1000 }));
    const { url: baseUrl } = await server.start();

    const res = await fetch(`${baseUrl}/`);

    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain('data-drop-root="1"');
    expect(html).toContain('data-upload-card');
    expect(html).toContain('data-expires-at="');
  });

  it('accepts uploads and returns a path that can be used to access the download page', async () => {
    ({ server, ledger } = createTestServer({ durationMs: 5 * 60 * 1000 }));
    const { url: baseUrl } = await server.start();

    const formData = new FormData();
    const fileContents = 'hello from upload';
    const blob = new Blob([fileContents], { type: 'text/plain' });
    formData.set('file', blob, 'upload.txt');

    const uploadRes = await fetch(`${baseUrl}/_/upload`, {
      method: 'POST',
      body: formData,
    });

    expect(uploadRes.status).toBe(200);

    const payload = await uploadRes.json() as { path: string };

    expect(payload.path.startsWith('/')).toBe(true);

    const pageRes = await fetch(`${baseUrl}${payload.path}`);
    expect(pageRes.status).toBe(200);
    const pageHtml = await pageRes.text();

    expect(pageHtml).toContain('upload.txt');
  });

  it('accepts directory uploads by archiving multiple files into a single downloadable archive', async () => {
    ({ server, ledger } = createTestServer({ durationMs: 5 * 60 * 1000 }));
    const { url: baseUrl } = await server.start();

    const formData = new FormData();
    const dirName = 'project';

    const fileOneContents = 'console.log("file one");';
    const fileTwoContents = 'console.log("file two");';

    const fileOneBlob = new Blob([fileOneContents], { type: 'text/javascript' });
    const fileTwoBlob = new Blob([fileTwoContents], { type: 'text/javascript' });

    formData.append('file', fileOneBlob, `${dirName}/index.js`);
    formData.append('file', fileTwoBlob, `${dirName}/src/main.js`);
    formData.set('directoryName', dirName);

    const uploadRes = await fetch(`${baseUrl}/_/upload`, {
      method: 'POST',
      body: formData,
    });

    expect(uploadRes.status).toBe(200);

    const payload = await uploadRes.json() as { path: string; fileName: string };

    expect(payload.path.startsWith('/')).toBe(true);
    expect(payload.fileName).toContain(dirName);

    const pageRes = await fetch(`${baseUrl}${payload.path}`);
    expect(pageRes.status).toBe(200);
    const pageHtml = await pageRes.text();

    expect(pageHtml).toContain(payload.fileName);
  });

  it('respects the configured durationMs for upload sessions', async () => {
    const configuredDurationMs = 3000;
    ({ server, ledger } = createTestServer({ durationMs: configuredDurationMs }));
    const { url: baseUrl } = await server.start();

    const formData = new FormData();
    const fileContents = 'duration test';
    const blob = new Blob([fileContents], { type: 'text/plain' });
    formData.set('file', blob, 'duration.txt');

    const createdAtMs = Date.now();

    const uploadRes = await fetch(`${baseUrl}/_/upload`, {
      method: 'POST',
      body: formData,
    });

    expect(uploadRes.status).toBe(200);

    const payload = await uploadRes.json() as { path: string };

    const drop = ledger.resolve({ kind: 'slug', value: payload.path.slice(1) });
    expect(drop).toBeDefined();

    if (!drop) return;

    const actualDurationMs = drop.expiresAt.getTime() - createdAtMs;

    expect(actualDurationMs).toBeGreaterThanOrEqual(configuredDurationMs - 500);
    expect(actualDurationMs).toBeLessThanOrEqual(configuredDurationMs + 2000);
  });
});
