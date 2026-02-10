import type { DropConfig } from '../types/config.ts';
import { parseDropConfig } from './parse-drop-config.ts';
import { parseRawCliArgs } from './parse-raw-cli-args.ts';
import { CliError } from './error.ts';

export { CliError } from './error.ts';
export { printHelp } from './help.ts';

export interface ParsedArgs {
  config: DropConfig;
  showHelp: boolean;
}

export const parseCliArgs = (args: string[]): ParsedArgs => {
  try {
    const values = parseRawCliArgs(args);

    if (values.help) {
      return {
        config: {} as DropConfig,
        showHelp: true,
      };
    }

    const config = parseDropConfig(values);
    return {
      config,
      showHelp: false,
    };
  }
  catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    throw new CliError(`Failed to parse arguments: ${error}`);
  }
};
