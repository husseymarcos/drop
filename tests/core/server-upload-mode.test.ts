import { afterEach, describe, expect, it } from 'bun:test';
import { BunDropServer } from '../../src/core/server.ts';
import { InMemorySessionManager } from '../../src/core/session-manager.ts';

describe('Root upload mode', () => {
  let server: BunDropServer;
  let manager: InMemorySessionManager;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    manager?.cleanup();
  });

  it('renders a root view with a drag-and-drop upload card', async () => {
    manager = new InMemorySessionManager();

    server = new BunDropServer(manager, {
      port: 0,
      host: '127.0.0.1',
      serveAtRoot: false,
      durationMs: 5 * 60 * 1000,
    });

    await server.start();

    const baseUrl = server.getUrl();
    const res = await fetch(`${baseUrl}/`);

    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain('data-drop-root="1"');
    expect(html).toContain('data-upload-card');
    expect(html).toContain('data-expires-at="');
  });

  it('accepts uploads and returns a slug that can be used to access the download page', async () => {
    manager = new InMemorySessionManager();

    server = new BunDropServer(manager, {
      port: 0,
      host: '127.0.0.1',
      serveAtRoot: false,
      durationMs: 5 * 60 * 1000,
    });

    await server.start();

    const baseUrl = server.getUrl();

    const formData = new FormData();
    const fileContents = 'hello from upload';
    const blob = new Blob([fileContents], { type: 'text/plain' });
    formData.set('file', blob, 'upload.txt');

    const uploadRes = await fetch(`${baseUrl}/_/upload`, {
      method: 'POST',
      body: formData,
    });

    expect(uploadRes.status).toBe(200);

    const payload = await uploadRes.json() as { slug: string };

    expect(typeof payload.slug).toBe('string');
    expect(payload.slug.length).toBeGreaterThan(0);

    const pageRes = await fetch(`${baseUrl}/${payload.slug}`);
    expect(pageRes.status).toBe(200);
    const pageHtml = await pageRes.text();

    expect(pageHtml).toContain('upload.txt');
  });

  it('accepts directory uploads by zipping multiple files into a single downloadable archive', async () => {
    manager = new InMemorySessionManager();

    server = new BunDropServer(manager, {
      port: 0,
      host: '127.0.0.1',
      serveAtRoot: false,
      durationMs: 5 * 60 * 1000,
    });

    await server.start();

    const baseUrl = server.getUrl();

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

    const payload = await uploadRes.json() as { slug: string; fileName: string };

    expect(typeof payload.slug).toBe('string');
    expect(payload.slug.length).toBeGreaterThan(0);
    expect(payload.fileName).toContain(dirName);

    const pageRes = await fetch(`${baseUrl}/${payload.slug}`);
    expect(pageRes.status).toBe(200);
    const pageHtml = await pageRes.text();

    expect(pageHtml).toContain(payload.fileName);
  });

  it('respects the configured durationMs for upload sessions', async () => {
    manager = new InMemorySessionManager();

    const configuredDurationMs = 3000;

    server = new BunDropServer(manager, {
      port: 0,
      host: '127.0.0.1',
      serveAtRoot: false,
      durationMs: configuredDurationMs,
    });

    await server.start();

    const baseUrl = server.getUrl();

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

    const payload = await uploadRes.json() as { slug: string };

    const session = manager.getSession(payload.slug);
    expect(session).toBeDefined();

    if (!session) return;

    const actualDurationMs = session.expiresAt.getTime() - createdAtMs;

    // The actual duration should be close to the configured duration,
    // within a small tolerance to account for execution time.
    expect(actualDurationMs).toBeGreaterThanOrEqual(configuredDurationMs - 500);
    expect(actualDurationMs).toBeLessThanOrEqual(configuredDurationMs + 2000);
  });
});
