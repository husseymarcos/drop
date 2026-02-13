export interface Arguments {
  file?: string;
  time?: string;
  port?: string;
  alias?: string;
  help?: boolean;
}

export type ValidatedArgs = Required<Pick<Arguments, 'file' | 'time'>>;
