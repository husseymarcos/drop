export interface Arguments {
  file?: string;
  time?: string;
  help?: boolean;
}

export type ValidatedArgs = Required<Omit<Arguments, 'help'>>;
