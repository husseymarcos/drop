import ms, { type StringValue } from 'ms';
import type { DropConfig } from '../types/config.ts';
import { DEFAULT_PORT } from '../types/config.ts';
import type { CliArgs } from '../types/arguments.ts';

const DEFAULT_DURATION = '5m';

export const getConfig = (args: CliArgs): DropConfig => {
  const validated = validateRequiredArgs(args);
  const durationMs = parseTime(validated.time);
  const alias = parseAlias(args.alias);
  const port
    = args.port !== undefined
      ? parsePort(args.port)
      : alias !== undefined
        ? 80
        : DEFAULT_PORT;
  return {
    filePath: validated.file,
    durationMs,
    port,
    alias,
  };
};

const validateRequiredArgs = (values: CliArgs): { file: string; time: string } => {
  if (!values.file) {
    throw new Error('Missing required argument: -f, --file <path>');
  }
  return {
    file: values.file,
    time: values.time ?? DEFAULT_DURATION,
  };
};

const parseTime = (timeValue: string): number => {
  const trimmed = timeValue.trim();
  const normalized = /^\d+$/.test(trimmed) ? `${trimmed}s` : trimmed.toLowerCase();
  const durationMs = ms(normalized as StringValue);
  if (typeof durationMs !== 'number' || durationMs <= 0) {
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
