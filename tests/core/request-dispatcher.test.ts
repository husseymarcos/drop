import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import { DownloadHandler } from '../../src/core/handlers/download-handler.ts';
import { UploadHandler } from '../../src/core/handlers/upload-handler.ts';
import { RequestDispatcher } from '../../src/core/request-dispatcher.ts';

const createDispatcher = (): RequestDispatcher => {
  const ledger = new DropLedger();
  return new RequestDispatcher(
    new UploadHandler(ledger, 60_000),
    new DownloadHandler(ledger),
    60_000,
  );
};

describe('RequestDispatcher', () => {
  it('dispatches public, static, and unsupported requests', async () => {
    const dispatcher = createDispatcher();

    const root = await dispatcher.dispatch(new Request('http://localhost/'));
    const css = await dispatcher.dispatch(new Request('http://localhost/_/common.css'));
    const script = await dispatcher.dispatch(new Request('http://localhost/_/countdown.js'));
    const missing = await dispatcher.dispatch(new Request('http://localhost/missing'));
    const unsupported = await dispatcher.dispatch(new Request('http://localhost/', {
      method: 'POST',
    }));

    expect(root.status).toBe(200);
    expect(css.headers.get('content-type')).toBe('text/css; charset=utf-8');
    expect(script.headers.get('content-type')).toBe('application/javascript; charset=utf-8');
    expect(missing.status).toBe(404);
    expect(unsupported.status).toBe(404);
  });
});
