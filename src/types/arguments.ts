export interface Arguments {
  file?: string;
  time?: string;
  help?: boolean;
  logs?: boolean;
}

export type ValidatedArgs = Required<Pick<Arguments, 'file' | 'time'>>;
