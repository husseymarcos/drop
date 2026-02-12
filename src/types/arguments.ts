export interface Arguments {
  file?: string;
  time?: string;
  alias?: string;
  help?: boolean;
}

export type ValidatedArgs = Required<Pick<Arguments, 'file' | 'time'>>;
