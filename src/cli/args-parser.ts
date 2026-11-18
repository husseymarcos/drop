import { parseArgs } from 'node:util';
import type { DropConfig } from '../types.ts';
import { DEFAULT_MAX_UPLOAD_BYTES, DEFAULT_PORT } from '../types.ts';
import { toMessage } from '../utils.ts';
import { printHelp, printVersion } from './help.ts';

const RECEIVE_COMMAND = 'receive';

export const parseCliArgs = (argv: string[]): DropConfig => {
  try {
    const { values: opts, positionals } = parseArgs({
      args: argv,
      options: {
        'file': { type: 'string', short: 'f' },
        'time': { type: 'string', short: 't' },
        'port': { type: 'string', short: 'p' },
        'alias': { type: 'string', short: 'a' },
        'host': { type: 'string' },
        'max-upload': { type: 'string' },
        'help': { type: 'boolean', short: 'h' },
        'version': { type: 'boolean', short: 'v' },
      },
      allowPositionals: true,
      strict: true,
    });

    if (opts.help) {
      printHelp();
      process.exit(0);
    }

    if (opts.version) {
      printVersion();
      process.exit(0);
    }

    const receiving = positionals[0] === RECEIVE_COMMAND;
    const paths = receiving ? positionals.slice(1) : positionals;
    const durationMs = parseTime(opts.time ?? DEFAULT_DURATION);
    const alias = parseAlias(opts.alias);

    return {
      mode: receiving ? 'receive' : 'send',
      filePath: receiving ? rejectPaths(paths, opts.file) : pickFile(paths, opts.file),
      durationMs,
      port: defaultPort(opts.port, alias),
      alias,
      host: opts.host?.trim() || undefined,
      maxUploadBytes: opts['max-upload'] === undefined
        ? DEFAULT_MAX_UPLOAD_BYTES
        : parseSize(opts['max-upload']),
    };
  }
  catch (error) {
    throw new Error(`Failed to parse arguments: ${toMessage(error)}`);
  }
};

const DEFAULT_DURATION = '5m';

const pickFile = (paths: string[], flagged: string | undefined): string => {
  const candidates = flagged === undefined ? paths : [flagged, ...paths];
  if (candidates.length === 0) {
    throw new Error('Missing file. Usage: drop <file> [-t 10m]');
  }
  if (candidates.length > 1) {
    throw new Error('Drop shares one file at a time. Pass a folder to share several.');
  }
  return candidates[0]!;
};

const rejectPaths = (paths: string[], flagged: string | undefined): undefined => {
  if (paths.length > 0 || flagged !== undefined) {
    throw new Error('drop receive does not take a file. Run drop <file> to send one.');
  }
  return undefined;
};

/** Chooses the explicit port, the HTTP default for aliases, or the application default. */
const defaultPort = (portValue: string | undefined, alias: string | undefined): number => {
  if (portValue !== undefined) return parsePort(portValue);
  if (alias !== undefined) return 80;
  return DEFAULT_PORT;
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

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  k: 1024,
  kb: 1024,
  m: 1024 ** 2,
  mb: 1024 ** 2,
  g: 1024 ** 3,
  gb: 1024 ** 3,
};

const parseSize = (sizeValue: string): number => {
  const match = sizeValue.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb?|mb?|gb?)?$/);
  const bytes = match ? parseFloat(match[1]!) * SIZE_UNITS[match[2] ?? 'b']! : Number.NaN;
  if (!Number.isFinite(bytes) || bytes <= 0) {
    throw new Error(`Invalid size: "${sizeValue}". Use formats like: 500mb, 2gb`);
  }
  return Math.floor(bytes);
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
