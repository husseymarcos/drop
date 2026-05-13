import { join } from 'node:path';
import { parseCliArgs } from '../src/cli/args-parser.ts';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

export const fixtureFile = join(process.cwd(), 'tests', 'bedtimestory.txt');

export function fileConfig(time = '5m', ...extra: string[]) {
  return parseCliArgs(['-f', fixtureFile, '-t', time, ...extra]);
}
