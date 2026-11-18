import type { EventEmitter } from 'node:events';

export type StopReason = 'expired' | 'interrupted' | 'quit';

type Keyboard = EventEmitter & {
  isTTY?: boolean;
  setRawMode?: (mode: boolean) => unknown;
  resume: () => unknown;
  pause: () => unknown;
};

const CTRL_C = 0x03;
const STOP_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

/** Resolves on the first of: expiry, q, Ctrl-C, SIGINT or SIGTERM, then releases the terminal. */
export function waitForStop(options: {
  durationMs: number;
  keyboard?: Keyboard;
  signals: EventEmitter;
}): Promise<StopReason> {
  const { durationMs, keyboard, signals } = options;
  const interactive = Boolean(keyboard?.isTTY && keyboard.setRawMode);

  return new Promise<StopReason>((resolve) => {
    const finish = (reason: StopReason) => {
      clearTimeout(timer);
      for (const signal of STOP_SIGNALS) signals.off(signal, onSignal);
      if (interactive && keyboard) {
        keyboard.off('data', onKey);
        keyboard.setRawMode?.(false);
        keyboard.pause();
      }
      resolve(reason);
    };

    const onSignal = () => finish('interrupted');
    const onKey = (chunk: Buffer) => {
      if (chunk.includes(CTRL_C)) finish('interrupted');
      else if (chunk.toString().toLowerCase().includes('q')) finish('quit');
    };

    const timer = setTimeout(() => finish('expired'), durationMs);
    for (const signal of STOP_SIGNALS) signals.on(signal, onSignal);

    if (interactive && keyboard) {
      keyboard.setRawMode?.(true);
      keyboard.resume();
      keyboard.on('data', onKey);
    }
  });
}
