import { join } from 'node:path';
import { parseCliArgs } from '../src/cli/args-parser.ts';
import { createDropServer } from '../src/core/server.ts';
import type { DropServer } from '../src/core/server.ts';
import { DropLedger } from '../src/core/drop-ledger.ts';
import { FileLoader } from '../src/core/file-loader.ts';
import type { DropAddress, DropContent } from '../src/drop.ts';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

export const fixtureFile = join(process.cwd(), 'tests', 'bedtimestory.txt');

export function fileConfig(time = '5m', ...extra: string[]) {
  return parseCliArgs(['-f', fixtureFile, '-t', time, ...extra]);
}

export function textContent(fileName: string, text: string): DropContent {
  const blob = new Blob([text], { type: 'text/plain' });
  return { fileName, mimeType: 'text/plain', size: blob.size, body: () => blob };
}

export function createTestServer(
  options: { port?: number; durationMs?: number; acceptsUploads?: boolean } = {},
): { server: DropServer; ledger: DropLedger } {
  const ledger = new DropLedger();
  const server = createDropServer(ledger, {
    port: 0,
    durationMs: 60_000,
    advertisedHost: '127.0.0.1',
    acceptsUploads: false,
    maxUploadBytes: 64 * 1024 * 1024,
    ...options,
  });
  return { server, ledger };
}

export async function seedDropFromFile(
  ledger: DropLedger,
  filePath: string,
  durationMs: number,
  address?: DropAddress,
) {
  const content = await new FileLoader().load(filePath);
  return ledger.create(content, { durationMs, address });
}
