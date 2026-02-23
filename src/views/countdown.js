(function () {
  const globalObj = typeof globalThis !== 'undefined' && globalThis.window
    ? globalThis.window
    : globalThis;

  const startCountdown = (options) => {
    const {
      expiresAt,
      countdownEl,
      hintEl,
      expiredHintText,
      onExpire,
    } = options;

    if (!expiresAt || !countdownEl || !hintEl) {
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remainingMs = expiresAt - now;

      if (remainingMs <= 0) {
        countdownEl.textContent = '00:00';
        if (expiredHintText) {
          hintEl.textContent = expiredHintText;
        }
        if (onExpire) {
          onExpire();
        }
        return false;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const seconds = totalSeconds % 60;
      const minutes = Math.floor((totalSeconds / 60) % 60);
      const hours = Math.floor(totalSeconds / 3600);

      const parts = [];
      if (hours > 0) {
        parts.push(String(hours).padStart(2, '0'));
      }
      parts.push(String(minutes).padStart(2, '0'));
      parts.push(String(seconds).padStart(2, '0'));

      countdownEl.textContent = parts.join(':');
      return true;
    };

    updateCountdown();
    if (typeof globalObj.setInterval === 'function' && typeof globalObj.clearInterval === 'function') {
      const interval = globalObj.setInterval(() => {
        const shouldContinue = updateCountdown();
        if (!shouldContinue) {
          globalObj.clearInterval(interval);
        }
      }, 1000);
    }
  };

  globalObj.Drop = globalObj.Drop || {};
  globalObj.Drop.startCountdown = startCountdown;
}());
