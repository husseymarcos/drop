export interface CliOptions {
  file?: string;
  time?: string;
  port?: string;
  help?: boolean;
}

export interface ValidatedArgs {
  file: string;
  time: string;
  port?: string;
}
