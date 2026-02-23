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
    expect(html).toContain('id="drop-empty-state"');
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
});
