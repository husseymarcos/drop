export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

type ActiveLogLevel = Exclude<LogLevel, 'silent'>;

const levelOrder: Record<ActiveLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentThreshold: number | null = null;

export const setLogLevel = (level: LogLevel): void => {
  if (level === 'silent') {
    currentThreshold = null;
    return;
  }

  currentThreshold = levelOrder[level];
};

const shouldLog = (level: ActiveLogLevel): boolean => {
  if (currentThreshold === null) {
    return false;
  }

  return levelOrder[level] >= currentThreshold;
};

export const debug = (...args: unknown[]): void => {
  if (shouldLog('debug')) {
    console.debug(...args);
  }
};

export const info = (...args: unknown[]): void => {
  if (shouldLog('info')) {
    console.info(...args);
  }
};

export const warn = (...args: unknown[]): void => {
  if (shouldLog('warn')) {
    console.warn(...args);
  }
};

export const error = (...args: unknown[]): void => {
  if (shouldLog('error')) {
    console.error(...args);
  }
};
