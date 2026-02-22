import { Command } from 'commander';
import type { DropConfig } from '../types/config.ts';
import { getConfig } from './config.ts';
import type { CliArgs } from '../types/arguments.ts';
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

    const parsedArgs: CliArgs = {
      file: opts.file,
      time: opts.time,
      port: opts.port,
      alias: opts.alias,
    };

    return getConfig(parsedArgs);
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
