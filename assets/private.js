/* Private material loader. The owner's Neonomics track is not shipped with the site: after signing in, this fetches
   it from the `lab_private` table, whose row-level security only lets the owner's account read it (supabase/lab_private.sql).
   A copy is cached on this device for offline study, and removed on sign-out, reset, or when another account signs in. */
(function () {
  'use strict';
  const CACHE = 'silp:bundle'; /* "silp:" (not "sil:") so it is never part of the synced progress snapshot */
  const AUTH_KEY = 'sil-auth';
  let merged = 0;
  const g = () => ({ TRACKS: window.TRACKS, MOCK: window.MOCK, CARDS: window.CARDS, RESOURCES: window.RESOURCES });
  const read = () => { try { return JSON.parse(localStorage.getItem(CACHE)); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(CACHE, JSON.stringify(v)); } catch { /* quota or blocked: just no offline copy */ } };
  const drop = () => { try { localStorage.removeItem(CACHE); } catch { /* ignore */ } };
  const refresh = () => window.dispatchEvent(new Event('hashchange'));

  /* Only trust the cache while an auth session is stored on this device. */
  try { if (localStorage.getItem(AUTH_KEY) !== null) (read() || []).forEach((b) => { merged += PrivateMerge.merge(g(), b); }); else drop(); } catch { /* ignore */ }

  window.PRIVATE = {
    active: () => merged > 0,
    /** Called by cloud.js after sign-in. client is the Supabase client. */
    async load(client) {
      let rows;
      try { const r = await client.from('lab_private').select('id,data').order('id'); if (r.error) throw r.error; rows = r.data; } catch { return false; } /* offline: keep the cache */
      const bundles = (rows || []).map((r) => r.data).filter(Boolean); /* every bundle this account may read; RLS decides which */
      if (!bundles.length) { this.clear(); return false; } /* signed in, but allowed to read nothing */
      const fresh = JSON.stringify(read()) !== JSON.stringify(bundles);
      write(bundles);
      let n = 0; bundles.forEach((b) => { n += PrivateMerge.merge(g(), b); }); merged += n;
      if (n && fresh) refresh();
      return true;
    },
    /** Sign-out, reset or a non-owner account: forget the copy; reload if it is already merged into this page. */
    clear() {
      const had = read() !== null; drop();
      if (merged > 0) { merged = 0; setTimeout(() => location.reload(), 50); } else if (had) { /* nothing visible to undo */ }
    },
  };
})();
