import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import { DownloadHandler } from '../../src/core/handlers/download-handler.ts';
import { UploadHandler } from '../../src/core/handlers/upload-handler.ts';
import { RequestDispatcher } from '../../src/core/request-dispatcher.ts';

const createDispatcher = (acceptsUploads: boolean): RequestDispatcher => {
  const ledger = new DropLedger();
  return new RequestDispatcher(
    new UploadHandler(ledger, 60_000, 1024),
    new DownloadHandler(ledger),
    { durationMs: 60_000, acceptsUploads },
  );
};

const upload = () => {
  const formData = new FormData();
  formData.set('file', new Blob(['x']), 'x.txt');
  return new Request('http://localhost/_/upload', { method: 'POST', body: formData });
};

describe('RequestDispatcher', () => {
  it('dispatches public, static, and unsupported requests', async () => {
    const dispatcher = createDispatcher(true);

    const root = await dispatcher.dispatch(new Request('http://localhost/'));
    const css = await dispatcher.dispatch(new Request('http://localhost/_/common.css'));
    const script = await dispatcher.dispatch(new Request('http://localhost/_/countdown.js'));
    const missing = await dispatcher.dispatch(new Request('http://localhost/missing'));
    const unsupported = await dispatcher.dispatch(new Request('http://localhost/', {
      method: 'POST',
    }));

    expect(root.status).toBe(200);
    expect(css.headers.get('content-type')).toBe('text/css; charset=utf-8');
    expect(await css.text()).toContain('--sky');
    expect(script.headers.get('content-type')).toBe('application/javascript; charset=utf-8');
    expect(missing.status).toBe(404);
    expect(unsupported.status).toBe(404);
  });

  it('keeps the upload path closed unless receive mode is on', async () => {
    const sending = createDispatcher(false);
    const receiving = createDispatcher(true);

    expect((await sending.dispatch(new Request('http://localhost/'))).status).toBe(404);
    expect((await sending.dispatch(upload())).status).toBe(404);
    expect((await receiving.dispatch(upload())).status).toBe(200);
  });
});
