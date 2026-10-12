/* Install banner: invite installation when the browser fires beforeinstallprompt.
   Shows at most once per 30-day cooldown, never when already installed (standalone).
   Chromium-only path: other browsers never fire the event, so nothing renders there. */
(() => {
  'use strict';
  const KEY = 'sil:installDismiss', COOLDOWN = 30 * 24 * 3600 * 1000, DELAY = 1200;
  let deferred = null, scheduled = false;

  const standalone = () =>
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator && window.navigator.standalone === true);
  const dismissed = () => {
    try {
      const t = Number(JSON.parse(localStorage.getItem(KEY) || '0'));
      return Date.now() - t < COOLDOWN;
    } catch { return false; }
  };
  const stamp = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  function show() {
    if (document.querySelector('#installBanner') || !deferred || standalone() || dismissed()) return;
    const el = document.createElement('div');
    el.id = 'installBanner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Install Hex Lab');
    el.innerHTML =
      '<span>Install Hex Lab for fullscreen + offline</span>' +
      '<button type="button" class="btn primary" data-install>Install</button>' +
      '<button type="button" class="btn" data-dismiss aria-label="Dismiss">Later</button>';
    el.querySelector('[data-install]').addEventListener('click', async () => {
      try {
        if (deferred && typeof deferred.prompt === 'function') {
          await deferred.prompt();
          if (deferred.userChoice) await deferred.userChoice.catch(() => {});
        }
      } catch {}
      stamp(Date.now() + COOLDOWN * 365 * 100); // asked: stay quiet
      deferred = null;
      el.remove();
    });
    el.querySelector('[data-dismiss]').addEventListener('click', () => {
      stamp(Date.now());
      deferred = null;
      el.remove();
    });
    document.body.appendChild(el);
  }

  function maybe() {
    if (scheduled || document.querySelector('#installBanner')) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; show(); }, DELAY);
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    try { e.preventDefault(); } catch {}
    deferred = e;
    maybe();
  });
  window.addEventListener('appinstalled', () => {
    stamp(Date.now() + COOLDOWN * 365 * 100);
    deferred = null;
    const el = document.querySelector('#installBanner');
    if (el) el.remove();
  });
})();
