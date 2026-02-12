import ms, { type StringValue } from 'ms';
import type { DropConfig } from '../types/config.ts';
import { DEFAULT_PORT } from '../types/config.ts';
import type { Arguments, ValidatedArgs } from '../types/arguments.ts';

export const getConfig = (args: Arguments): DropConfig => {
  const validated = validateRequiredArgs(args);
  const durationMs = parseTime(validated.time);
  return {
    filePath: validated.file,
    durationMs,
    port: DEFAULT_PORT,
  };
};

const validateRequiredArgs = (values: Arguments): ValidatedArgs => {
  if (!values.file) {
    throw new Error('Missing required argument: -f, --file <path>');
  }
  if (!values.time) {
    throw new Error('Missing required argument: -t, --time <duration>');
  }
  return {
    file: values.file,
    time: values.time,
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
