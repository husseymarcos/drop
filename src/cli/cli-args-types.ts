export interface CliOptions {
  file?: string;
  time?: string;
  help?: boolean;
}

export type ValidatedArgs = Required<Omit<CliOptions, 'help'>>;
