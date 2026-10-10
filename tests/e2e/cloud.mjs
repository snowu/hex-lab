import { newPage } from './helpers.mjs';

// The real Supabase SDK is replaced by a fake module (served for the pinned CDN URL), and the "server" lives in this process,
// so two simulated devices (two browser contexts) can sync with each other. No request ever reaches a real project.
const FAKE_SDK = `
export function createClient(url, key, opts) {
  const SK = opts.auth.storageKey; let listeners = [];
  const load = () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } };
  const emit = (ev, s) => listeners.forEach((f) => f(ev, s));
  const call = (name, args) => window.__fake(name, args);
  const err = (e) => (e ? { message: e.message, code: e.code } : null);
  const token = () => (load() || {}).access_token;
  return {
    auth: {
      async getSession() { return { data: { session: load() }, error: null }; },
      onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithOtp({ email }) { const r = await call('otp', { email }); return { data: {}, error: err(r.error) }; },
      async verifyOtp({ email, token }) { const r = await call('verify', { email, token }); if (r.error) return { data: { session: null }, error: err(r.error) }; localStorage.setItem(SK, JSON.stringify(r.session)); emit('SIGNED_IN', r.session); return { data: { session: r.session }, error: null }; },
      async signOut() { localStorage.removeItem(SK); emit('SIGNED_OUT', null); return { error: null }; },
    },
    from() { return {
      select() { return { async maybeSingle() { const r = await call('select', { token: token() }); return { data: r.data, error: err(r.error) }; } }; },
      delete() { return { async eq() { const r = await call('delete', { token: token() }); return { error: err(r.error) }; } }; },
    }; },
    async rpc(fn, args) { const r = await call('rpc', { fn, args, token: token() }); return { data: r.data, error: err(r.error) }; },
  };
}`;

class FakeServer { // implements the same rules as supabase/lab_progress.sql
  constructor() { this.rows = new Map(); this.emails = []; this.setupMissing = false; this.saves = 0; }
  user(token) { return token && token.startsWith('tok-') ? 'id-' + token.slice(4) : null; }
  handle(name, a) {
    if (name === 'otp') { this.emails.push(a.email); return {}; }
    if (name === 'verify') return a.token === '123456' ? { session: { access_token: 'tok-' + a.email, user: { id: 'id-' + a.email, email: a.email } } } : { error: { message: 'Token has expired or is invalid' } };
    const uid = this.user(a.token);
    if (!uid) return { error: { message: 'JWT required' } };
    if (this.setupMissing) return { error: { code: 'PGRST205', message: "Could not find the table 'public.lab_progress' in the schema cache" } };
    const row = this.rows.get(uid);
    if (name === 'select') return { data: row ? { state: row.state, generation: row.generation, content_hash: row.hash, updated_at: new Date().toISOString(), device_id: row.device } : null };
    if (name === 'delete') { this.rows.delete(uid); return {}; }
    this.saves++;
    const p = a.args, ret = (status, generation) => ({ data: [{ result_status: status, result_generation: generation, result_updated_at: new Date().toISOString() }] });
    if (!row) { if (p.p_expected_generation != null) return ret('conflict', null); this.rows.set(uid, { state: p.p_state, generation: 1, format: p.p_format_version, hash: p.p_content_hash, device: p.p_device_id }); return ret('ok', 1); }
    if (p.p_format_version < row.format) return ret('stale_client', row.generation);
    if (row.hash === p.p_content_hash) return ret('unchanged', row.generation);
    if (p.p_expected_generation == null || p.p_expected_generation !== row.generation) return ret('conflict', row.generation);
    Object.assign(row, { state: p.p_state, generation: row.generation + 1, hash: p.p_content_hash, device: p.p_device_id });
    return ret('ok', row.generation);
  }
}

export default async function ({ url, browser, ok, section }) {
  const server = new FakeServer();
  const device = async (seed) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: 'dark' });
    await context.exposeFunction('__fake', (name, args) => server.handle(name, args));
    await context.route(/@supabase\/supabase-js@.*\/\+esm/, (route) => route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: FAKE_SDK }));
    const page = await newPage(context);
    page.on('dialog', (d) => d.accept());
    await page.goto(url + '#/plan'); await page.waitForTimeout(600);
    if (seed) { await page.evaluate((s) => Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)), seed); await page.reload(); await page.waitForTimeout(600); }
    return page;
  };
  const xp = (p) => p.evaluate(() => localStorage.getItem('sil:xp'));
  const panel = async (p) => (await p.locator('#cloudpanel').innerText()).replace(/\s+/g, ' ');
  const signIn = async (p, email) => {
    await p.locator('#cemail').fill(email); await p.locator('#csend').click(); await p.waitForSelector('#ccode');
    await p.locator('#ccode').fill('123456'); await p.locator('#cverify').click();
  };
  const waitFor = async (fn, ms = 10000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch { /* the page is reloading */ } await new Promise((r) => setTimeout(r, 150)); } return false; };

  section('sign-in with an emailed code');
  const A = await device({ 'sil:xp': '120', 'sil:progress': JSON.stringify({ l1: { q1: true } }) });
  ok(await A.locator('#cloudBtn').isVisible(), 'the header cloud icon is shown when cloud sync is configured');
  ok(await A.locator('#cemail').isVisible(), 'a signed-out panel offers an email field');
  await A.locator('#cemail').fill('not-an-email'); await A.locator('#csend').click();
  ok((await panel(A)).includes('valid email'), 'an invalid email is rejected locally');
  await A.locator('#cemail').fill('me@example.com'); await A.locator('#csend').click(); await A.waitForSelector('#ccode');
  ok(server.emails.includes('me@example.com'), 'a code is requested for that email');
  await A.locator('#ccode').fill('000000'); await A.locator('#cverify').click(); await A.waitForTimeout(500);
  ok((await panel(A)).includes('invalid'), 'a wrong code shows an error and does not sign in');
  await A.locator('#ccode').fill('123456'); await A.locator('#cverify').click();
  ok(await waitFor(async () => (await panel(A)).includes('Synced')), 'the right code signs in and syncs');
  ok(server.rows.get('id-me@example.com') && server.rows.get('id-me@example.com').generation === 1 && server.rows.get('id-me@example.com').state.data['sil:xp'] === '120', 'the first device uploaded its progress as generation 1');
  ok(!('sil:theme' in server.rows.get('id-me@example.com').state.data), 'per-device preferences are not uploaded');

  section('a second device downloads automatically (it is empty)');
  const B = await device();
  await signIn(B, 'me@example.com');
  ok(await waitFor(async () => (await xp(B)) === '120', 15000), 'the empty device loaded 120 XP from the cloud (after its reload)');
  ok(await waitFor(async () => { const t = await panel(B); return t.includes('me@example.com') && t.includes('Synced'); }, 15000), 'the session persists across the reload and shows as synced');

  section('changes upload automatically (debounced) and carry the right generation');
  await B.evaluate(() => { localStorage.setItem('sil:xp', '200'); window.CLOUD.markDirty(); });
  ok(await waitFor(() => server.rows.get('id-me@example.com').generation === 2, 9000), 'a local change reached the cloud as generation 2');
  const saves = server.saves; await B.evaluate(() => window.CLOUD.markDirty()); await B.waitForTimeout(5000);
  ok(server.saves === saves, 'an unchanged snapshot is not uploaded again');

  section('device A is clean but the cloud is newer: it is told, never overwritten');
  await A.locator('#csync').click();
  ok(await waitFor(async () => (await panel(A)).includes('newer progress')), 'a banner explains that newer progress exists');
  ok((await xp(A)) === '120', 'local data is untouched until a choice is made');
  ok(await A.locator('#cloudBtn').getAttribute('data-st') === 'cloud-newer', 'the header icon signals that a decision is needed');

  section('both devices changed: explicit conflict, nothing overwritten');
  await A.evaluate(() => localStorage.setItem('sil:xp', '150'));
  await A.locator('#csync').click();
  ok(await waitFor(async () => (await panel(A)).includes('Both this device and the cloud changed')), 'a conflict is reported');
  const p = await panel(A);
  ok(p.includes('150') && p.includes('200'), 'both candidates are shown side by side (150 on this device, 200 in the cloud)');
  ok(server.rows.get('id-me@example.com').state.data['sil:xp'] === '200', 'the cloud copy was not overwritten');
  await A.locator('#ccloud').click();
  ok(await waitFor(async () => (await xp(A)) === '200', 15000), 'choosing the cloud copy installs it on this device');

  section('choosing this device overwrites the cloud (only on request)');
  await A.waitForTimeout(800);
  await A.evaluate(() => localStorage.setItem('sil:xp', '300')); await B.evaluate(() => localStorage.setItem('sil:xp', '250'));
  await B.evaluate(() => window.CLOUD.syncNow()); await B.waitForTimeout(800);
  await A.locator('#csync').click(); await A.waitForTimeout(800);
  if (await A.locator('#clocal').count()) { await A.locator('#clocal').click(); await A.waitForTimeout(800); }
  ok(server.rows.get('id-me@example.com').state.data['sil:xp'] === '300', 'Use this device replaced the cloud copy');

  section('a missing table is explained, not silent');
  server.setupMissing = true;
  const C = await device();
  await signIn(C, 'other@example.com');
  ok(await waitFor(async () => (await panel(C)).includes('not set up yet')), 'the panel tells you to run supabase/lab_progress.sql');
  server.setupMissing = false;

  section('reset also removes the cloud copy so old progress cannot come back');
  await B.locator('#wipe').click();
  ok(await waitFor(() => !server.rows.has('id-me@example.com')), 'the cloud copy was deleted with the local reset', 15000);
  await B.waitForTimeout(1500);
  ok((await xp(B)) === null, 'after the reload nothing resurrected from the cloud');

  section('sign out keeps local data');
  await A.locator('#cout').click(); await A.waitForTimeout(500);
  ok(await A.locator('#cemail').isVisible() && (await xp(A)) !== null, 'signed out, local progress still there');

  const errs = [A, B, C].flatMap((x) => x.errors);
  ok(errs.length === 0, 'no uncaught errors in any device ' + JSON.stringify(errs.slice(0, 2)));
  for (const x of [A, B, C]) await x.context().close();
}
