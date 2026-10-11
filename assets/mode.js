/* Content mode: the lab has two sections that share all the machinery (lessons, progress, cards, mock, links).
   'interview' is the original; 'gamedev' is game dev theory, practice, techniques and pixel art.
   Items tagged domain:'gamedev' (tracks, cards, mock questions, resources) are kept only in game mode, and everything else only in interview mode.
   Runs synchronously before app.js, so the app just sees one set of content. Switching reloads the page. */
(function () {
  'use strict';
  let mode = 'interview';
  try { if (JSON.parse(localStorage.getItem('sil:mode')) === 'gamedev') mode = 'gamedev'; } catch { /* default */ }
  const game = mode === 'gamedev';
  window.MODE = mode;
  const keep = (arr) => { for (let i = arr.length - 1; i >= 0; i--) if ((arr[i].domain === 'gamedev') !== game) arr.splice(i, 1); };
  keep(window.TRACKS); keep(window.CARDS || []); keep(window.MOCK || []); keep(window.RESOURCES || []);

  const $ = (s) => document.querySelector(s);
  if (game) {
    document.documentElement.dataset.mode = 'gamedev';
    document.title = 'Game Dev Lab';
    const tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.content = '#07040d';
    $('.brand-t').innerHTML = 'gamedev<span class="u">_</span>lab';
    const lr = document.querySelector('.logo rect'); if (lr) lr.setAttribute('fill', '#b98cff');
    const fav = document.querySelector('link[rel=icon]'); if (fav) fav.href = fav.href.replace('%2339ff7a', '%23b98cff');
    $('.brand').setAttribute('aria-label', 'Game Dev Lab home');
    for (const k of ['design', 'katas', 'stories']) { const a = document.querySelector(`.top nav a[href="#/${k}"]`); if (a) a.remove(); }
    const guard = () => { if (/^#\/(design|katas|stories)/.test(location.hash)) location.hash = '#/'; };
    addEventListener('hashchange', guard); guard();
  }
  const b = document.createElement('button');
  b.id = 'modeBtn'; b.className = 'icon-btn mode-btn'; b.type = 'button';
  b.innerHTML = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  b.title = game ? 'You are in the game dev section. Switch to interview prep' : 'Switch to the game dev section (theory, pixel art, Zig and C++ drills)';
  b.setAttribute('aria-label', b.title);
  window.switchMode = () => { try { localStorage.setItem('sil:mode', JSON.stringify(game ? 'interview' : 'gamedev')); } catch { /* ignore */ } location.hash = '#/'; location.reload(); };
  b.onclick = window.switchMode;
  $('.top-r').prepend(b);
})();
