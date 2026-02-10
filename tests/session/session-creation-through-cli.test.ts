import { describe, expect, it } from 'bun:test';
import { parseCliArgs } from '../../src/cli/args-parser.ts';

describe('Session creation through CLI', () => {
  it('accepts valid CLI commands with various time formats', () => {
    const scenarios = [
      { args: ['-f', 'video.mp4', '-t', '5m'], expected: { duration: 300000, port: 8080 } },
      {
        args: ['-f', 'backup.zip', '-t', '1h', '-p', '3000'],
        expected: { duration: 3600000, port: 3000 },
      },
      { args: ['-f', 'file.txt', '-t', '300'], expected: { duration: 300000, port: 8080 } },
    ];

    for (const scenario of scenarios) {
      const result = parseCliArgs(scenario.args);
      expect(result.config.durationMs).toBe(scenario.expected.duration);
      expect(result.config.port).toBe(scenario.expected.port);
    }
  });
});
