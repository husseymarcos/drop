import { Command } from 'commander';
import type { DropConfig } from '../types/config.ts';
import { getConfig } from './parse-drop-config.ts';
import type { Arguments } from '../types/arguments.ts';

export interface ParsedArgs {
  config: DropConfig;
  showHelp: boolean;
}

const buildProgram = (): Command =>
  new Command()
    .option('-f, --file <path>', 'Path to the file to share')
    .option('-t, --time <duration>', 'Time until the drop expires')
    .option('-h, --help', 'Show help message')
    .exitOverride();

export const parseCliArgs = (argv: string[]): ParsedArgs => {
  try {
    const program = buildProgram();
    program.parse(argv, { from: 'user' });
    const opts = program.opts<Arguments>();

    if (opts.help) {
      return {
        config: {} as DropConfig,
        showHelp: true,
      };
    }

    const parsedArgs: Arguments = {
      file: opts.file,
      time: opts.time,
    };

    const config: DropConfig = getConfig(parsedArgs);

    return {
      config,
      showHelp: false,
    };
  }
  catch (error) {
    const err = error as { code?: string };
    if (err.code === 'commander.helpDisplayed') {
      return { config: {} as DropConfig, showHelp: true };
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse arguments: ${message}`);
  }
};
