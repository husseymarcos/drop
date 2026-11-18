import { describe, expect, it } from 'bun:test';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { FileLoader } from '../../src/core/file-loader.ts';

const createTempDirectoryWithFiles = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'drop-dir-'));

  const nestedDir = join(root, 'nested');
  await mkdir(nestedDir);

  await writeFile(join(root, 'root.txt'), 'root file');
  await writeFile(join(nestedDir, 'nested.txt'), 'nested file');

  return root;
};

describe('FileLoader', () => {
  it('streams a directory recursively as a single archive', async () => {
    const dirPath = await createTempDirectoryWithFiles();

    const content = await new FileLoader().load(dirPath);
    const bytes = new Uint8Array(await new Response(content.body()).arrayBuffer());
    const files = await new Bun.Archive(bytes).files();

    expect(content.fileName).toBe(`${basename(dirPath)}.tar`);
    expect(content.mimeType).toBe('application/x-tar');
    expect(content.size).toBe(bytes.length);
    expect(await files.get('nested/nested.txt')?.text()).toBe('nested file');
  });

  it('serves a single file from disk without reading it up front', async () => {
    const dirPath = await createTempDirectoryWithFiles();
    const filePath = join(dirPath, 'root.txt');

    const content = await new FileLoader().load(filePath);

    expect(content.fileName).toBe('root.txt');
    expect(content.size).toBe(9);
    expect(content.body()).toBeInstanceOf(Blob);
    expect(await new Response(content.body()).text()).toBe('root file');
  });
});
