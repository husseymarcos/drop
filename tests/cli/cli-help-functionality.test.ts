import { afterEach, describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

const originalExit = process.exit;
const originalLog = console.log;

afterEach(() => {
  (process as unknown as { exit: typeof process.exit }).exit = originalExit;
  console.log = originalLog;
});

describe('CLI help functionality', () => {
  it.each<[string[]]>([
    [['-h']],
    [['--help']],
    [['-f', 'file.txt', '-t', '5m', '-h']],
  ])('exits after showing help', (args) => {
    const exitCodes: number[] = [];
    (process as unknown as { exit: typeof process.exit }).exit = ((code?: number) => {
      exitCodes.push(code ?? 0);
      throw new Error('TEST_EXIT');
    }) as typeof process.exit;
    console.log = () => {};

    expect(() => parseCliArgs(args)).toThrow('TEST_EXIT');
    expect(exitCodes).toEqual([0]);
  });
});
