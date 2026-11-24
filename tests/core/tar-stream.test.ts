import { describe, expect, it } from 'bun:test';
import { buildTarStream } from '../../src/core/tar-stream.ts';

const readAll = async (body: Blob | ReadableStream<Uint8Array>): Promise<Uint8Array> =>
  new Uint8Array(await new Response(body).arrayBuffer());

describe('buildTarStream', () => {
  it('streams a tar whose length matches the announced size', async () => {
    const content = buildTarStream([
      { path: 'pkg/a.txt', blob: new Blob(['alpha']) },
      { path: 'pkg/src/b.txt', blob: new Blob(['b'.repeat(1500)]) },
    ], 'pkg');

    const bytes = await readAll(content.body());

    expect(content.fileName).toBe('pkg.tar');
    expect(content.mimeType).toBe('application/x-tar');
    expect(bytes.length).toBe(content.size);
  });

  it('produces an archive that standard readers can unpack', async () => {
    const longPath = `deep/${'nested-folder/'.repeat(10)}file.txt`;
    const content = buildTarStream([
      { path: 'a.txt', blob: new Blob(['alpha']) },
      { path: longPath, blob: new Blob(['long name']) },
    ], 'bundle');

    const files = await new Bun.Archive(await readAll(content.body())).files();

    expect(await files.get('a.txt')?.text()).toBe('alpha');
    expect(await files.get(longPath)?.text()).toBe('long name');
  });

  it('can be streamed more than once', async () => {
    const content = buildTarStream([{ path: 'a.txt', blob: new Blob(['alpha']) }], 'x');
    const first = await readAll(content.body());
    const second = await readAll(content.body());
    expect(second).toEqual(first);
  });
});
