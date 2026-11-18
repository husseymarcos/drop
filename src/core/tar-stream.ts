import type { DropContent } from '../drop.ts';

export type TarEntry = {
  path: string;
  blob: Blob;
};

const BLOCK = 512;
const encoder = new TextEncoder();

export function buildTarStream(entries: TarEntry[], name: string): DropContent {
  const headers = entries.map((entry) => headerBlocks(entry));
  const size = entries.reduce(
    (total, entry, index) => total + headers[index]!.length + padded(entry.blob.size),
    2 * BLOCK,
  );

  return {
    fileName: `${name}.tar`,
    mimeType: 'application/x-tar',
    size,
    body: () => toStream(tarChunks(entries, headers)),
  };
}

async function* tarChunks(
  entries: TarEntry[],
  headers: Uint8Array[],
): AsyncGenerator<Uint8Array> {
  for (const [index, entry] of entries.entries()) {
    yield headers[index]!;
    for await (const chunk of entry.blob.stream()) {
      yield chunk;
    }
    const padding = padded(entry.blob.size) - entry.blob.size;
    if (padding > 0) yield new Uint8Array(padding);
  }
  yield new Uint8Array(2 * BLOCK);
}

function toStream(chunks: AsyncGenerator<Uint8Array>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await chunks.next();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });
}

function headerBlocks(entry: TarEntry): Uint8Array {
  const pathBytes = encoder.encode(entry.path);
  if (pathBytes.length <= 100) {
    return ustarHeader(pathBytes, entry.blob.size, '0');
  }

  const record = paxRecord('path', entry.path);
  const paxHeader = ustarHeader(encoder.encode('././@PaxHeader'), record.length, 'x');
  const paxBody = new Uint8Array(padded(record.length));
  paxBody.set(record);
  const fileHeader = ustarHeader(pathBytes.slice(0, 100), entry.blob.size, '0');
  return concat([paxHeader, paxBody, fileHeader]);
}

function ustarHeader(name: Uint8Array, size: number, type: string): Uint8Array {
  const header = new Uint8Array(BLOCK);
  header.set(name.slice(0, 100), 0);
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, Math.floor(Date.now() / 1000));
  header.fill(0x20, 148, 156);
  header[156] = type.charCodeAt(0);
  header.set(encoder.encode('ustar\u000000'), 257);

  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  writeOctal(header, 148, 7, checksum);
  header[155] = 0x20;
  return header;
}

function writeOctal(target: Uint8Array, offset: number, width: number, value: number): void {
  const digits = value.toString(8).padStart(width - 1, '0');
  target.set(encoder.encode(digits), offset);
  target[offset + width - 1] = 0;
}

function paxRecord(key: string, value: string): Uint8Array {
  const body = encoder.encode(` ${key}=${value}\n`).length;
  let length = body + 1;
  while (String(length).length + body !== length) {
    length = String(length).length + body;
  }
  return encoder.encode(`${length} ${key}=${value}\n`);
}

function padded(size: number): number {
  return Math.ceil(size / BLOCK) * BLOCK;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
