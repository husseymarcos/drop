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

describe('FileLoader directory support', () => {
  it('loads a directory recursively into a single archive', async () => {
    const dirPath = await createTempDirectoryWithFiles();
    const loader = new FileLoader();

    const content = await loader.load(dirPath);

    expect(content.fileName).toBe(`${basename(dirPath)}.tar`);
    expect(content.mimeType).toBe('application/x-tar');
    expect(content.data.length).toBeGreaterThan(0);
  });
});
