import { Command } from 'commander';
import type { CliArgs, DropConfig } from '../types.ts';
import { DEFAULT_PORT } from '../types.ts';
import { printHelp } from './help.ts';

export const parseCliArgs = (argv: string[]): DropConfig => {
  try {
    const program = buildProgram();
    program.parse(argv, { from: 'user' });
    const opts = program.opts<CliArgs>();

    if (opts.help) {
      printHelp();
      process.exit(0);
    }

    return getConfig({
      file: opts.file,
      time: opts.time,
      port: opts.port,
      alias: opts.alias,
    });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse arguments: ${message}`);
  }
};

const buildProgram = (): Command =>
  new Command()
    .option('-f, --file <path>', 'Path to the file to share')
    .option('-t, --time <duration>', 'Time until the drop expires')
    .option('-p, --port <number>', 'Port to run the server on')
    .option('-a, --alias <hostname>', 'Alias hostname to display in the share URL')
    .option('-h, --help', 'Show help message')
    .exitOverride();

const DEFAULT_DURATION = '5m';

const getConfig = (args: CliArgs): DropConfig => {
  const durationMs = parseTime(args.time ?? DEFAULT_DURATION);
  const alias = parseAlias(args.alias);
  const port
    = args.port !== undefined
      ? parsePort(args.port)
      : alias !== undefined
        ? 80
        : DEFAULT_PORT;
  return {
    filePath: args.file,
    durationMs,
    port,
    alias,
  };
};

const parseTime = (timeValue: string): number => {
  const trimmed = timeValue.trim();
  const normalized = /^\d+$/.test(trimmed) ? `${trimmed}s` : trimmed.toLowerCase();
  const durationMs = Number(ms(normalized));
  if (Number.isNaN(durationMs) || durationMs <= 0) {
    throw new Error(
      `Invalid time format: "${timeValue}". Use formats like: 5m, 1h, 90s, or seconds (300)`,
    );
  }
  return durationMs;
};

const parsePort = (portValue?: string): number => {
  if (!portValue) return DEFAULT_PORT;
  const parsed = parseInt(portValue.trim(), 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `Invalid port: "${portValue}". Use a number between 1 and 65535`,
    );
  }
  return parsed;
};

const parseAlias = (aliasValue?: string): string | undefined => {
  if (!aliasValue) return undefined;
  const trimmed = aliasValue.trim();
  if (!trimmed) {
    throw new Error('Alias cannot be empty');
  }
  const normalized = trimmed.toLowerCase().replace(/\.local$/i, '');
  const isValidAlias = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized);
  if (!isValidAlias) {
    throw new Error(
      'Invalid alias format. Use letters, numbers, or hyphens (e.g. john, marcos-laptop)',
    );
  }
  return normalized;
};

function ms(value: string): number {
  const units: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  const match = value.match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d)?$/);
  if (!match) return Number.NaN;

  const num = parseFloat(match[1]!);
  const unit = match[2] || 's';
  return num * (units[unit] || 1000);
}
