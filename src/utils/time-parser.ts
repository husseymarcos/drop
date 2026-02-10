import type { ParsedDuration } from '../types/utils.ts';

const TIME_UNITS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

type TimeUnit = keyof typeof TIME_UNITS;

export class TimeParserError extends Error {
  constructor(input: string) {
    super(`Invalid time format: "${input}". Use formats like: 5m, 1h, 90s, or seconds (300)`);
    this.name = 'TimeParserError';
  }
}

export const parseDuration = (input: string): ParsedDuration => {
  const trimmed = input.trim().toLowerCase();

  // Check if it's just a number (treat as seconds)
  if (/^\d+$/.test(trimmed)) {
    const seconds = parseInt(trimmed, 10);
    if (seconds <= 0) {
      throw new TimeParserError(input);
    }
    return {
      milliseconds: seconds * 1000,
      humanReadable: formatDuration(seconds * 1000),
    };
  }

  // Parse with unit (e.g., "5m", "1h")
  const match = trimmed.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new TimeParserError(input);
  }

  const value = match[1] ?? '';
  const unit = (match[2] ?? 's') as TimeUnit;
  const milliseconds = parseInt(value, 10) * TIME_UNITS[unit];

  return {
    milliseconds,
    humanReadable: formatDuration(milliseconds),
  };
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};
