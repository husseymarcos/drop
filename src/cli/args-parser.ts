import { Command } from 'commander';
import type { DropConfig } from '../types/config';
import { parseDropConfig } from './parse-drop-config';
import { CliError } from './error';

export { CliError } from './error';
export { printHelp } from './help';

export interface ParsedArgs {
  config: DropConfig;
  showHelp: boolean;
}

const buildProgram = (): Command =>
  new Command()
    .option('-f, --file <path>', 'Path to the file to share')
    .option('-t, --time <duration>', 'Time until the drop expires')
    .option('-p, --port <number>', 'Port to run the server on', '8080')
    .option('-h, --help', 'Show help message')
    .exitOverride();

export const parseCliArgs = (args: string[]): ParsedArgs => {
  try {
    const program = buildProgram();
    program.parse(args, { from: 'user' });
    const opts = program.opts<{ file?: string; time?: string; port?: string; help?: boolean }>();

    if (opts.help) {
      return {
        config: {} as DropConfig,
        showHelp: true,
      };
    }

    const config = parseDropConfig({
      file: opts.file,
      time: opts.time,
      port: opts.port,
    });
    return {
      config,
      showHelp: false,
    };
  }
  catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    const err = error as { code?: string };
    if (err.code === 'commander.helpDisplayed') {
      return { config: {} as DropConfig, showHelp: true };
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(`Failed to parse arguments: ${message}`);
  }
};
