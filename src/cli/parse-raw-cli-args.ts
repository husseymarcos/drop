import { parseArgs } from 'node:util';
import type { CliOptions } from './cli-args-types.ts';

const cliOptionsDefinition = () => ({
  file: {
    type: 'string' as const,
    short: 'f',
  },
  time: {
    type: 'string' as const,
    short: 't',
  },
  port: {
    type: 'string' as const,
    short: 'p',
  },
  help: {
    type: 'boolean' as const,
    short: 'h',
  },
});

export const parseRawCliArgs = (args: string[]): CliOptions => {
  const { values } = parseArgs({
    args,
    options: cliOptionsDefinition(),
    allowPositionals: false,
  });
  return values as CliOptions;
};
