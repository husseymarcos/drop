import { parseArgs } from 'node:util';
import type { DropConfig } from '../types/index.ts';
import { parseDuration, TimeParserError } from '../utils/time-parser.ts';

export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}

export interface ParsedArgs {
  config: DropConfig;
  showHelp: boolean;
}

const DEFAULT_PORT = 8080;

export const parseCliArgs = (args: string[]): ParsedArgs => {
  try {
    const { values } = parseArgs({
      args,
      options: {
        file: {
          type: 'string',
          short: 'f',
        },
        time: {
          type: 'string',
          short: 't',
        },
        port: {
          type: 'string',
          short: 'p',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
      },
      allowPositionals: false,
    });

    if (values.help) {
      return {
        config: {} as DropConfig,
        showHelp: true,
      };
    }

    if (!values.file) {
      throw new CliError('Missing required argument: -f, --file <path>');
    }

    if (!values.time) {
      throw new CliError('Missing required argument: -t, --time <duration>');
    }

    let durationMs: number;
    try {
      const parsed = parseDuration(values.time);
      durationMs = parsed.milliseconds;
    } catch (error) {
      if (error instanceof TimeParserError) {
        throw new CliError(error.message);
      }
      throw error;
    }

    const port = values.port ? parseInt(values.port, 10) : DEFAULT_PORT;
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      throw new CliError(`Invalid port: ${values.port}. Must be between 1 and 65535.`);
    }

    return {
      config: {
        filePath: values.file,
        durationMs,
        port,
      },
      showHelp: false,
    };
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    throw new CliError(`Failed to parse arguments: ${error}`);
  }
};

export const printHelp = (): void => {
  console.log(`
Drop - Ephemeral file sharing over LAN

Usage: drop -f <file> -t <time> [options]

Options:
  -f, --file <path>     Path to the file to share (required)
  -t, --time <duration> Time until the drop expires (required)
                        Formats: 5m, 1h, 90s, or seconds (300)
  -p, --port <number>   Port to run the server on (default: 8080)
  -h, --help            Show this help message

Examples:
  drop -f video.mp4 -t 5m
  drop -f backup.zip -t 1h -p 3000
  drop -f document.pdf -t 300
`);
};
