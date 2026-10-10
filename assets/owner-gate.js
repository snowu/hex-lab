/* Cosmetic gate: the focus track and its mock questions, cards and resources are shown only when the signed-in account is the owner.
   This is NOT access control (the content is in the public files); it just keeps it out of everyone else's way.
   Runs synchronously before app.js, reading the email from the stored sign-in session, so it works offline. */
(function () {
  'use strict';
  const OWNER = 'zancato.t@gmail.com';
  let owner = false;
  try { const s = JSON.parse(localStorage.getItem('sil-auth')); owner = !!(s && s.user && String(s.user.email || '').toLowerCase() === OWNER); } catch { /* signed out */ }
  window.OWNER_VIEW = owner;
  window.OWNER_EMAIL = OWNER;
  if (owner) return;
  const drop = (arr, hide) => { for (let i = arr.length - 1; i >= 0; i--) if (hide(arr[i])) arr.splice(i, 1); };
  drop(window.TRACKS, (t) => t.id === 'openbanking');
  drop(window.MOCK || [], (q) => /^Neonomics/.test(q.kind));
  drop(window.CARDS || [], (c) => c.track === 'Open Banking');
  drop(window.RESOURCES || [], (r) => /^Neonomics/.test(r.cat));
})();
