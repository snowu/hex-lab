// Tests for assets/sync-core.js: simulated devices against a simulated server that implements the same
// compare-and-swap rules as supabase/lab_progress.sql. No network, no Supabase.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../assets/sync-core.js');

class Storage { // minimal localStorage
  constructor(init) { this.m = new Map(Object.entries(init || {})); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
class Server { // mirrors lab_save_progress (one row per user)
  constructor() { this.rows = new Map(); this.saves = 0; this.down = false; }
  remoteFor(user) {
    const guard = () => { if (this.down) { const e = new Error('offline'); e.kind = 'network'; throw e; } };
    return {
      fetch: async () => { guard(); const r = this.rows.get(user); return r ? { generation: r.generation, hash: r.hash, state: JSON.parse(JSON.stringify(r.state)), updatedAt: 't', device: r.device } : null; },
      save: async ({ expected, state, hash, format, device }) => {
        guard(); this.saves++;
        const r = this.rows.get(user);
        if (!r) { if (expected != null) return { status: 'conflict', generation: null }; this.rows.set(user, { state: JSON.parse(JSON.stringify(state)), generation: 1, format, hash, device }); return { status: 'ok', generation: 1 }; }
        if (format < r.format) return { status: 'stale_client', generation: r.generation };
        if (r.hash === hash) return { status: 'unchanged', generation: r.generation };
        if (expected == null || expected !== r.generation) return { status: 'conflict', generation: r.generation };
        Object.assign(r, { state: JSON.parse(JSON.stringify(state)), generation: r.generation + 1, format, hash, device });
        return { status: 'ok', generation: r.generation };
      },
      remove: async () => { guard(); this.rows.delete(user); },
    };
  }
}
const device = (server, user, name, init) => { const storage = new Storage(init); return { storage, c: S.createCoordinator({ storage, remote: server.remoteFor(user), userId: user, deviceId: name }) }; };
const xp = (n) => ({ 'sil:xp': String(n), 'sil:progress': JSON.stringify({ l1: { q1: true } }) });

let passed = 0, total = 0;
const test = async (name, fn) => { total++; try { await fn(); passed++; console.log('PASS', name); } catch (e) { console.error('FAIL', name, '\n', e); process.exitCode = 1; } };
/* The app reloads the page after a download, which creates a fresh coordinator. */
const reload = (srv, d, user, name) => { d.c = S.createCoordinator({ storage: d.storage, remote: srv.remoteFor(user), userId: user, deviceId: name }); };

await test('hash ignores key order and ignores per-device keys', () => {
  const a = new Storage({ 'sil:a': '1', 'sil:b': '2', 'sil:theme': 'dark', 'other:x': 'y' });
  const b = new Storage({ 'sil:b': '2', 'sil:a': '1', 'sil:theme': 'light', 'sil:vim': 'true' });
  assert.equal(S.hashOf(S.snapshot(a)), S.hashOf(S.snapshot(b)));
  assert.deepEqual(Object.keys(S.snapshot(a)).sort(), ['sil:a', 'sil:b']);
  assert.equal(S.hashOf({}), null);
  assert.notEqual(S.hashOf({ 'sil:a': '1' }), S.hashOf({ 'sil:a': '2' }));
});

await test('decideSync matches the exercise table', () => {
  const C = (g, h) => ({ generation: g, hash: h });
  const cases = [[[null, null, null, null], 'none'], [['L1', null, null, null], 'upload'], [[null, null, null, C(3, 'C3')], 'download'], [['X', null, null, C(2, 'X')], 'none'],
    [['L1', null, null, C(2, 'C2')], 'conflict'], [['L2', 'L1', 4, C(4, 'L1')], 'upload'], [['L1', 'L1', 4, C(5, 'C5')], 'download'], [['L2', 'L1', 4, C(5, 'C5')], 'conflict'],
    [['L1', 'L1', 4, C(4, 'L1')], 'none'], [['L2', 'L1', 4, null], 'upload']];
  for (const [args, expected] of cases) assert.equal(S.decideSync(...args), expected, JSON.stringify(args));
});

await test('first device uploads; an empty second device downloads automatically', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(100)), B = device(srv, 'u', 'B');
  assert.equal(await A.c.reconcile(), 'upload'); assert.equal(A.c.status.kind, 'synced'); assert.equal(srv.rows.get('u').generation, 1);
  assert.equal(await B.c.reconcile(), 'download'); assert.equal(B.c.status.kind, 'applied');
  assert.equal(B.storage.getItem('sil:xp'), '100');
  assert.equal(S.hashOf(S.snapshot(B.storage)), S.hashOf(S.snapshot(A.storage)));
});

await test('a local change is pushed with the last generation; identical state is not re-uploaded', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1));
  await A.c.reconcile(); const saves = srv.saves;
  assert.equal(await A.c.push(), 'unchanged'); assert.equal(srv.saves, saves);
  A.storage.setItem('sil:xp', '2');
  await A.c.push(); assert.equal(srv.rows.get('u').generation, 2); assert.equal(A.c.status.kind, 'synced');
  const again = srv.saves; await A.c.push(); assert.equal(srv.saves, again);
});

await test('a clean device is told about newer cloud data but never overwritten automatically', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1)), B = device(srv, 'u', 'B');
  await A.c.reconcile(); await B.c.reconcile();
  A.storage.setItem('sil:xp', '50'); await A.c.push();
  assert.equal(await B.c.reconcile(), 'download'); assert.equal(B.c.status.kind, 'cloud-newer');
  assert.equal(B.storage.getItem('sil:xp'), '1');
  await B.c.resolve('cloud'); assert.equal(B.storage.getItem('sil:xp'), '50');
  assert.equal(B.c.meta().lastGen, 2);
});

await test('both sides changed: conflict, nothing is overwritten, and the choice is honoured', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1)), B = device(srv, 'u', 'B');
  await A.c.reconcile(); await B.c.reconcile(); reload(srv, B, 'u', 'B');
  A.storage.setItem('sil:xp', '10'); await A.c.push();
  B.storage.setItem('sil:xp', '77');
  await B.c.push();
  assert.equal(B.c.status.kind, 'conflict'); assert.equal(B.storage.getItem('sil:xp'), '77'); assert.equal(srv.rows.get('u').state.data['sil:xp'], '10');
  assert.equal(S.summarize(B.c.status.cloud.state.data).xp, 10);
  await B.c.resolve('local');
  assert.equal(B.c.status.kind, 'synced'); assert.equal(srv.rows.get('u').state.data['sil:xp'], '77'); assert.equal(srv.rows.get('u').generation, 3);
});

await test('choosing the cloud copy replaces local data', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1)), B = device(srv, 'u', 'B');
  await A.c.reconcile(); await B.c.reconcile(); reload(srv, B, 'u', 'B');
  A.storage.setItem('sil:xp', '10'); await A.c.push(); B.storage.setItem('sil:xp', '77'); B.storage.setItem('sil:extra', 'local-only'); await B.c.push();
  await B.c.resolve('cloud');
  assert.equal(B.storage.getItem('sil:xp'), '10'); assert.equal(B.storage.getItem('sil:extra'), null);
});

await test('first sign-in with different data on both sides is a conflict, never an auto-upload', async () => {
  const srv = new Server(); await device(srv, 'u', 'A', xp(500)).c.reconcile();
  const B = device(srv, 'u', 'B', xp(3));
  assert.equal(await B.c.reconcile(), 'conflict'); assert.equal(srv.rows.get('u').generation, 1); assert.equal(B.storage.getItem('sil:xp'), '3');
});

await test('switching accounts on one browser is treated as a first sign-in', async () => {
  const srv = new Server(), A = device(srv, 'alice', 'A', xp(5)); await A.c.reconcile();
  await device(srv, 'bob', 'Z', xp(900)).c.reconcile();
  const asBob = S.createCoordinator({ storage: A.storage, remote: srv.remoteFor('bob'), userId: 'bob', deviceId: 'A' });
  assert.equal(await asBob.reconcile(), 'conflict');
  assert.equal(srv.rows.get('bob').state.data['sil:xp'], '900');
});

await test('theme and vim preferences are never uploaded', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', { ...xp(1), 'sil:theme': 'dark', 'sil:vim': 'true', 'sil:device': 'abc' });
  await A.c.reconcile();
  assert.deepEqual(Object.keys(srv.rows.get('u').state.data).sort(), ['sil:progress', 'sil:xp']);
});

await test('an empty device never uploads over existing cloud data', async () => {
  const srv = new Server(); await device(srv, 'u', 'A', xp(9)).c.reconcile();
  const B = device(srv, 'u', 'B'); assert.equal(await B.c.push(), 'empty'); assert.equal(srv.rows.get('u').generation, 1);
});

await test('an older client gets update-required and cannot overwrite a newer format', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1)); await A.c.reconcile();
  srv.rows.get('u').format = 2;
  A.storage.setItem('sil:xp', '2'); await A.c.push();
  assert.equal(A.c.status.kind, 'update-required'); assert.equal(srv.rows.get('u').state.data['sil:xp'], '1');
  assert.equal(await A.c.push(), 'blocked');
});

await test('offline: no data is lost, bookkeeping is untouched, and sync recovers', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1)); await A.c.reconcile();
  srv.down = true; A.storage.setItem('sil:xp', '2'); await A.c.push();
  assert.equal(A.c.status.kind, 'offline'); assert.equal(A.storage.getItem('sil:xp'), '2'); assert.equal(A.c.meta().lastGen, 1);
  srv.down = false; await A.c.push();
  assert.equal(A.c.status.kind, 'synced'); assert.equal(srv.rows.get('u').state.data['sil:xp'], '2');
});

await test('reset: deleting the cloud copy stops the old snapshot from coming back', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(40)); await A.c.reconcile();
  assert.equal(await A.c.deleteCloud(), true); assert.equal(srv.rows.size, 0);
  for (const k of [...A.storage.m.keys()]) A.storage.removeItem(k);            // local reset
  const fresh = S.createCoordinator({ storage: A.storage, remote: srv.remoteFor('u'), userId: 'u', deviceId: 'A' });
  assert.equal(await fresh.reconcile(), 'none');                               // nothing resurrects
  assert.equal(A.storage.length, 0);
});

await test('a stale-generation race is reported as a conflict, not applied', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1)), B = device(srv, 'u', 'B');
  await A.c.reconcile(); await B.c.reconcile();
  B.c = S.createCoordinator({ storage: B.storage, remote: srv.remoteFor('u'), userId: 'u', deviceId: 'B' }); // the app reloads after a download
  A.storage.setItem('sil:xp', '2'); B.storage.setItem('sil:xp', '3');
  await Promise.all([A.c.push(), B.c.push()]);
  const kinds = [A.c.status.kind, B.c.status.kind].sort();
  assert.deepEqual(kinds, ['conflict', 'synced']); assert.equal(srv.rows.get('u').generation, 2);
});

await test('keep-offline pauses auto sync until resumed', async () => {
  const srv = new Server(), A = device(srv, 'u', 'A', xp(1)), B = device(srv, 'u', 'B', xp(2));
  await A.c.reconcile(); await B.c.reconcile();
  assert.equal(B.c.status.kind, 'conflict'); await B.c.resolve('keep');
  assert.equal(B.c.status.kind, 'paused'); B.storage.setItem('sil:xp', '3'); assert.equal(await B.c.push(), 'blocked');
});

console.log(`\n${passed}/${total} sync tests passed`);
if (passed !== total) process.exit(1);
