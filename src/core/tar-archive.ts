import type { DropContent } from '../drop.ts';

export async function buildTarArchive(
  entries: Record<string, Uint8Array>,
  name: string,
): Promise<DropContent> {
  const blob = await new Bun.Archive(entries).blob();

  return {
    fileName: `${name}.tar`,
    data: Buffer.from(await blob.arrayBuffer()),
    mimeType: 'application/x-tar',
  };
}
