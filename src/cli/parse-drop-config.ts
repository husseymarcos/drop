import type { DropConfig } from '../types/config.ts';
import { parseDuration, TimeParserError } from '../utils/time-parser.ts';
import { CliError } from './error.ts';
import type { CliOptions, ValidatedArgs } from './cli-args-types.ts';

const DEFAULT_PORT = 8080;

const validateRequiredArgs = (values: CliOptions): ValidatedArgs => {
  if (!values.file) {
    throw new CliError('Missing required argument: -f, --file <path>');
  }
  if (!values.time) {
    throw new CliError('Missing required argument: -t, --time <duration>');
  }
  return {
    file: values.file,
    time: values.time,
    port: values.port,
  };
};

const parseDurationMs = (timeValue: string): number => {
  try {
    const parsed = parseDuration(timeValue);
    return parsed.milliseconds;
  }
  catch (error) {
    if (error instanceof TimeParserError) {
      throw new CliError(error.message);
    }
    throw error;
  }
};

const parsePort = (portValue: string | undefined): number => {
  const port = portValue ? parseInt(portValue, 10) : DEFAULT_PORT;
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new CliError(`Invalid port: ${portValue}. Must be between 1 and 65535.`);
  }
  return port;
};

export const parseDropConfig = (values: CliOptions): DropConfig => {
  const validated = validateRequiredArgs(values);
  const durationMs = parseDurationMs(validated.time);
  const port = parsePort(validated.port);
  return {
    filePath: validated.file,
    durationMs,
    port,
  };
};
