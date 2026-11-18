import { describe, expect, it } from 'bun:test';
import { EventEmitter } from 'node:events';
import { waitForStop } from '../../src/cli/stop-signal.ts';

class FakeKeyboard extends EventEmitter {
  isTTY = true;
  rawMode = false;
  setRawMode(mode: boolean) {
    this.rawMode = mode;
    return this;
  }

  resume() {
    return this;
  }

  pause() {
    return this;
  }
}

describe('waitForStop', () => {
  it('resolves as expired when the duration elapses', async () => {
    expect(await waitForStop({ durationMs: 10, signals: new EventEmitter() })).toBe('expired');
  });

  it('resolves at once when the sender presses q, and restores the terminal', async () => {
    const keyboard = new FakeKeyboard();
    const stopped = waitForStop({ durationMs: 60_000, keyboard, signals: new EventEmitter() });

    expect(keyboard.rawMode).toBe(true);
    keyboard.emit('data', Buffer.from('q'));

    expect(await stopped).toBe('quit');
    expect(keyboard.rawMode).toBe(false);
  });

  it('treats Ctrl-C in raw mode as an interrupt', async () => {
    const keyboard = new FakeKeyboard();
    const stopped = waitForStop({ durationMs: 60_000, keyboard, signals: new EventEmitter() });

    keyboard.emit('data', Buffer.from([3]));

    expect(await stopped).toBe('interrupted');
  });

  it('resolves on SIGINT and SIGTERM', async () => {
    const signals = new EventEmitter();
    const stopped = waitForStop({ durationMs: 60_000, signals });

    signals.emit('SIGTERM');

    expect(await stopped).toBe('interrupted');
    expect(signals.listenerCount('SIGINT')).toBe(0);
  });
});
