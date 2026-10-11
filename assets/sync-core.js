/* Local-first cloud sync: pure logic, no network and no UI. The browser wiring lives in cloud.js;
   scripts/test-sync.mjs exercises this module with simulated devices against a simulated server.

   Rules (same shape as a compare-and-swap cloud-save design):
   - local data is authoritative and always saved synchronously elsewhere; sync is a best-effort layer
   - the server's monotonic `generation` orders writes, never a device clock
   - when BOTH sides changed since the last sync, never pick automatically: report a conflict
   - never auto-apply remote data over local data; the only automatic download is onto an empty device
   - identical content is never uploaded (content hash) and an empty device never uploads over the cloud */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SyncCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const PREFIX = 'sil:';
  const META_KEY = 'sil:sync';
  /* Per-device preferences and sync bookkeeping are not progress. */
  const EXCLUDE = new Set(['sil:theme', 'sil:vim', 'sil:sync', 'sil:device', 'sil:pyMigrated', 'sil:mode']);
  const FORMAT = 1;

  function cyrb53(str, seed) {
    let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  const isSynced = (key) => key.startsWith(PREFIX) && !EXCLUDE.has(key);

  /** The synced part of storage as a plain {key: string} object. */
  function snapshot(storage) {
    const data = {};
    for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && isSynced(k)) data[k] = storage.getItem(k); }
    return data;
  }
  /** A stable hash that does not depend on key order. null means "nothing saved here". */
  function hashOf(data) {
    const keys = Object.keys(data).sort();
    return keys.length ? cyrb53(JSON.stringify(keys.map((k) => [k, data[k]]))).toString(16).padStart(14, '0') : null;
  }
  /** Short human summary shown in the conflict chooser. */
  function summarize(data) {
    const j = (k, d) => { try { return k in data ? JSON.parse(data[k]) : d; } catch { return d; } };
    const progress = j('sil:progress', {}), days = j('sil:days', []);
    let items = 0;
    for (const lesson of Object.values(progress)) for (const done of Object.values(lesson || {})) if (done === true) items++;
    return { xp: Number(j('sil:xp', 0)) || 0, items, cards: Object.keys(j('sil:cards', {})).length, days: days.length, lastActive: days.length ? days[days.length - 1] : null, keys: Object.keys(data).length };
  }

  /** What should a sync do? Mirrors the three-way comparison used by every sync engine. */
  function decideSync(localHash, lastSyncedHash, lastGeneration, cloud) {
    if (cloud == null) return localHash == null ? 'none' : 'upload';
    if (localHash == null) return 'download';
    if (localHash === cloud.hash) return 'none';
    const localChanged = localHash !== lastSyncedHash;
    const cloudChanged = lastGeneration == null || cloud.generation !== lastGeneration;
    if (localChanged && cloudChanged) return 'conflict';
    if (localChanged) return 'upload';
    if (cloudChanged) return 'download';
    return 'none';
  }

  /**
   * remote: {
   *   fetch(): Promise<null | {generation, hash, state:{v,data}, updatedAt, device}>
   *   save({expected, state, hash, format, device}): Promise<{status:'ok'|'unchanged'|'conflict'|'stale_client', generation}>
   *   remove(): Promise<void>
   * }
   * Remote functions throw an Error with `kind` 'network' | 'setup' | 'server'.
   */
  function createCoordinator({ storage, remote, userId, deviceId, now }) {
    const clock = now || (() => Date.now());
    let status = { kind: 'idle', cloud: null, error: null, at: null };
    const listeners = new Set();
    const set = (kind, extra) => { status = Object.assign({ kind, cloud: null, error: null, at: clock() }, extra || {}); listeners.forEach((f) => f(status)); return status; };
    const readMeta = () => { try { return JSON.parse(storage.getItem(META_KEY)) || {}; } catch { return {}; } };
    /* A different account on this browser is treated like a first sign-in: never upload the previous account's data blindly. */
    const meta = () => { const m = readMeta(); return m.userId === userId ? m : { userId, lastHash: null, lastGen: null }; };
    const writeMeta = (lastHash, lastGen) => storage.setItem(META_KEY, JSON.stringify({ userId, lastHash, lastGen }));
    const local = () => { const data = snapshot(storage); return { data, hash: hashOf(data) }; };

    const fail = (e) => {
      if (e && e.kind === 'network') return set('offline');
      if (e && e.kind === 'setup') return set('setup-needed', { error: e.message });
      return set('error', { error: (e && e.message) || String(e) });
    };

    function apply(cloud) {
      const doomed = [];
      for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && isSynced(k)) doomed.push(k); }
      doomed.forEach((k) => storage.removeItem(k));
      const data = (cloud.state && cloud.state.data) || {};
      for (const [k, v] of Object.entries(data)) if (isSynced(k)) storage.setItem(k, v);
      writeMeta(cloud.hash, cloud.generation);
    }

    async function upload(expected, l) {
      l = l || local();
      if (l.hash == null) return set('synced');
      let res;
      try { res = await remote.save({ expected, state: { v: FORMAT, data: l.data }, hash: l.hash, format: FORMAT, device: deviceId }); } catch (e) { return fail(e); }
      if (res.status === 'ok' || res.status === 'unchanged') { writeMeta(l.hash, res.generation); return set('synced', { generation: res.generation }); }
      if (res.status === 'stale_client') return set('update-required');
      try { const cloud = await remote.fetch(); return set('conflict', { cloud }); } catch (e) { return fail(e); }
    }

    return {
      get status() { return status; },
      onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      local,
      meta,

      /** First contact and re-checks: compare local, last-synced and cloud, then act (or ask). */
      async reconcile() {
        set('syncing');
        let cloud;
        try { cloud = await remote.fetch(); } catch (e) { fail(e); return 'error'; }
        const l = local(), m = meta();
        const action = decideSync(l.hash, m.lastHash, m.lastGen, cloud && { generation: cloud.generation, hash: cloud.hash });
        if (action === 'none') { if (cloud && l.hash === cloud.hash) writeMeta(l.hash, cloud.generation); set('synced'); }
        else if (action === 'upload') await upload(cloud ? cloud.generation : null, l);
        else if (action === 'download') { if (l.hash == null) { apply(cloud); set('applied', { cloud }); } else set('cloud-newer', { cloud }); }
        else set('conflict', { cloud });
        return action;
      },

      /** Called after local changes (debounced by the caller). Cheap when nothing changed. */
      async push() {
        if (['conflict', 'cloud-newer', 'update-required', 'applied', 'paused', 'setup-needed'].includes(status.kind)) return 'blocked';
        const l = local(), m = meta();
        if (l.hash == null) return 'empty';
        if (l.hash === m.lastHash) { if (status.kind !== 'synced') set('synced'); return 'unchanged'; }
        if (m.lastGen == null) return this.reconcile();
        set('syncing');
        await upload(m.lastGen, l);
        return status.kind;
      },

      /** The person's explicit choice on a conflict or when newer cloud data exists. */
      async resolve(choice) {
        const cloud = status.cloud;
        if (choice === 'cloud' && cloud) { apply(cloud); set('applied', { cloud }); return 'applied'; }
        if (choice === 'local') { set('syncing'); await upload(cloud ? cloud.generation : null, local()); return status.kind; }
        set('paused'); return 'paused';
      },

      /** Remove the cloud copy (used by "reset everything" so the old snapshot cannot come back). */
      async deleteCloud() {
        try { await remote.remove(); } catch (e) { fail(e); return false; }
        writeMeta(null, null); set('idle'); return true;
      },
      resume() { if (status.kind === 'paused') set('idle'); },
    };
  }

  return { PREFIX, META_KEY, EXCLUDE, FORMAT, snapshot, hashOf, summarize, decideSync, createCoordinator, cyrb53 };
});
