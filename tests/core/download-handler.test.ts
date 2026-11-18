import { describe, expect, it } from 'bun:test';
import { DropLedger } from '../../src/core/drop-ledger.ts';
import { DownloadHandler } from '../../src/core/handlers/download-handler.ts';
import { textContent } from '../setup';

describe('DownloadHandler', () => {
  it('answers 410 Gone once a known drop has expired', async () => {
    let now = 1_000_000;
    const ledger = new DropLedger(() => 'brave-otter-abcd2345', () => now);
    const drop = ledger.create(textContent('a.txt', 'alpha'), { durationMs: 5_000 });
    const handler = new DownloadHandler(ledger);

    now += 5_001;
    const page = await handler.show(drop.address, false);
    const file = await handler.show(drop.address, true);
    const unknown = await handler.show({ kind: 'slug', value: 'never-existed' }, true);

    expect(page.status).toBe(410);
    expect(file.status).toBe(410);
    expect(unknown.status).toBe(404);
  });

  it('shows the file name and size on the recipient page', async () => {
    const ledger = new DropLedger();
    const drop = ledger.create(textContent('notes.txt', 'x'.repeat(2048)), { durationMs: 60_000 });

    const html = await (await new DownloadHandler(ledger).show(drop.address, false)).text();

    expect(html).toContain('notes.txt');
    expect(html).toContain('2 KB');
  });

  it('escapes HTML in uploaded file names', async () => {
    const ledger = new DropLedger();
    const drop = ledger.create(textContent('<img src=x onerror=alert(1)>.txt', 'x'), {
      durationMs: 60_000,
    });

    const html = await (await new DownloadHandler(ledger).show(drop.address, false)).text();

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;.txt');
  });

  it('sends a UTF-8 filename that phones keep intact', async () => {
    const ledger = new DropLedger();
    const drop = ledger.create(textContent('informe año.pdf', 'x'), { durationMs: 60_000 });

    const response = await new DownloadHandler(ledger).show(drop.address, true);

    expect(response.headers.get('content-disposition')).toContain(
      'filename*=UTF-8\'\'informe%20a%C3%B1o.pdf',
    );
  });

  it('reports each download to the activity log', async () => {
    const ledger = new DropLedger();
    const drop = ledger.create(textContent('a.txt', 'alpha'), { durationMs: 60_000 });
    const messages: string[] = [];

    await new DownloadHandler(ledger, (message) => messages.push(message)).show(drop.address, true);

    expect(messages).toEqual(['Download started: a.txt']);
  });
});
