import ms, { type StringValue } from 'ms';
import type { DropConfig } from '../types/config.ts';
import { DEFAULT_PORT } from '../types/config.ts';
import type { Arguments, ValidatedArgs } from '../types/arguments.ts';

const DEFAULT_DURATION = '5m';

export const getConfig = (args: Arguments): DropConfig => {
  const validated = validateRequiredArgs(args);
  const durationMs = parseTime(validated.time);
  return {
    filePath: validated.file,
    durationMs,
    port: parsePort(args.port),
    alias: parseAlias(args.alias),
  };
};

const validateRequiredArgs = (values: Arguments): ValidatedArgs => {
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
