/* Cloud sync wiring: Supabase email-code sign-in, the remote adapter for sync-core, the Plan-page panel and the
   header status icon. All sync decisions live in sync-core.js (unit-tested); this file only talks to the network and the DOM.
   Local data always works without an account, and nothing here ever blocks saving locally. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  const { $, $$, esc, ic, toast } = H;
  const CFG = window.CLOUD_CONFIG || {};
  const configured = !!(CFG.url && CFG.key && window.SyncCore);
  const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/+esm';
  const AUTH_KEY = 'sil-auth'; /* own storage key: other apps on this GitHub Pages origin keep their own sessions */
  let sb = null, session = null, coord = null, timer = null, mounted = null, ui = { stage: 'email', email: '', busy: false, msg: '' };

  const deviceId = (() => {
    try { let d = localStorage.getItem('sil:device'); if (!d) { d = (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()).slice(2); localStorage.setItem('sil:device', d); } return d; } catch { return 'unknown'; }
  })();

  async function client() {
    if (sb) return sb;
    const { createClient } = await import(SDK); /* loaded only when someone signs in or a session exists */
    sb = createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_KEY } });
    sb.auth.onAuthStateChange((_event, s) => setTimeout(() => attach(s), 0)); /* deferred: Supabase calls this while holding its auth lock */
    return sb;
  }

  function mapError(error) {
    const msg = String((error && error.message) || error || 'request failed'), e = new Error(msg);
    if (error && (error.code === 'PGRST205' || error.code === '42P01' || error.code === 'PGRST202' || error.code === '42883') || /Could not find the (table|function)|does not exist/i.test(msg)) { e.kind = 'setup'; e.message = 'The cloud table is not set up yet. Run supabase/lab_progress.sql in the Supabase SQL editor.'; }
    else if (/Failed to fetch|NetworkError|Load failed|network/i.test(msg) || !navigator.onLine) e.kind = 'network';
    else e.kind = 'server';
    return e;
  }
  const guard = async (fn) => { try { return await fn(); } catch (e) { throw e && e.kind ? e : mapError(e); } };
  const remote = {
    fetch: () => guard(async () => {
      const { data, error } = await (await client()).from('lab_progress').select('state, generation, content_hash, updated_at, device_id').maybeSingle();
      if (error) throw mapError(error);
      return data ? { generation: Number(data.generation), hash: data.content_hash, state: data.state, updatedAt: data.updated_at, device: data.device_id } : null;
    }),
    save: ({ expected, state, hash, format, device }) => guard(async () => {
      const { data, error } = await (await client()).rpc('lab_save_progress', { p_expected_generation: expected, p_state: state, p_format_version: format, p_device_id: device, p_content_hash: hash });
      if (error) throw mapError(error);
      const row = Array.isArray(data) ? data[0] : data;
      return { status: row.result_status, generation: row.result_generation == null ? null : Number(row.result_generation) };
    }),
    remove: () => guard(async () => {
      const { error } = await (await client()).from('lab_progress').delete().eq('user_id', session.user.id);
      if (error) throw mapError(error);
    }),
  };

  /* ---------------- session + coordinator ---------------- */
  async function attach(s) {
    const isOwner = !!(s && s.user && String(s.user.email || '').toLowerCase() === window.OWNER_EMAIL);
    if (isOwner !== !!window.OWNER_VIEW) { setTimeout(() => location.reload(), 300); } /* owner-gate.js decides at load */
    if (s && s.user) {
      if (coord && session && session.user.id === s.user.id) { session = s; return; }
      session = s;
      coord = SyncCore.createCoordinator({ storage: localStorage, remote, userId: s.user.id, deviceId });
      coord.onChange(() => { paintIcon(); redraw(); });
      paintIcon(); redraw();
      await coord.reconcile(); afterSync();
      if (coord.status.kind === 'conflict' || coord.status.kind === 'cloud-newer') toast('Cloud sync needs a decision: open Plan');
    } else { session = null; coord = null; paintIcon(); redraw(); }
  }
  function afterSync() {
    if (coord && coord.status.kind === 'applied') { toast('Loaded your progress from the cloud'); setTimeout(() => location.reload(), 900); }
  }
  async function init() {
    paintIcon();
    if (!configured) return;
    let hasSession = false; try { hasSession = localStorage.getItem(AUTH_KEY) !== null; } catch {}
    if (!hasSession) return;
    try { const { data } = await (await client()).auth.getSession(); await attach(data.session); } catch { paintIcon(); }
  }

  const api = {
    configured: () => configured,
    signedIn: () => !!(session && coord),
    status: () => (coord ? coord.status : { kind: session ? 'idle' : 'signed-out' }),
    markDirty() { if (!coord) return; clearTimeout(timer); timer = setTimeout(async () => { await coord.push(); afterSync(); }, 4000); },
    async syncNow() { if (!coord) return; coord.resume(); await coord.reconcile(); afterSync(); },
    async resolve(choice) { if (!coord) return; await coord.resolve(choice); afterSync(); },
    async deleteCloud() { return coord ? coord.deleteCloud() : true; },
    async requestCode(email) { const { error } = await (await client()).auth.signInWithOtp({ email, options: { shouldCreateUser: true } }); if (error) throw error; },
    async verifyCode(email, token) { const { data, error } = await (await client()).auth.verifyOtp({ email, token, type: 'email' }); if (error) throw error; if (!data.session) throw new Error('That code did not sign you in. Try again.'); await attach(data.session); },
    async signOut() { try { await (await client()).auth.signOut(); } finally { await attach(null); } },
    mount(el) { mounted = el; draw(el); },
  };
  window.CLOUD = api;

  /* ---------------- header icon ---------------- */
  function paintIcon() {
    const b = $('#cloudBtn'); if (!b) return;
    b.hidden = !configured;
    if (!configured) return;
    const k = coord ? coord.status.kind : session ? 'idle' : 'signed-out';
    b.dataset.st = k; b.innerHTML = ic('cloud', 18) + '<i class="dot"></i>';
    b.title = { synced: 'Cloud sync: up to date', syncing: 'Cloud sync: syncing…', offline: 'Cloud sync: offline, saved on this device', conflict: 'Cloud sync: choose which copy to keep', 'cloud-newer': 'Cloud sync: newer progress available', 'signed-out': 'Cloud sync: sign in', 'setup-needed': 'Cloud sync: setup needed', error: 'Cloud sync: error', 'update-required': 'Cloud sync: update required', paused: 'Cloud sync: paused' }[k] || 'Cloud sync';
  }

  /* ---------------- plan-page panel ---------------- */
  const redraw = () => { if (mounted && document.body.contains(mounted)) draw(mounted); };
  const when = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return String(iso || ''); } };
  function sum(label, s, extra) { return `<div class="cs-col"><div class="cs-h">${label}</div><ul><li><b>${s.xp}</b> XP</li><li><b>${s.items}</b> items completed</li><li><b>${s.cards}</b> flashcards scheduled</li><li><b>${s.days}</b> active days${s.lastActive ? ', last ' + esc(s.lastActive) : ''}</li>${extra || ''}</ul></div>`; }

  function draw(el) {
    if (!configured) { el.innerHTML = '<p class="muted">Cloud sync is not configured in this build. Your progress stays in this browser (use Export below for backups).</p>'; return; }
    if (!session) {
      el.innerHTML = `<p class="muted">Optional. Sign in with an email code to keep your progress in sync across devices. Everything keeps working without an account, and your local data is never overwritten without asking.</p>
        ${ui.stage === 'email' ? `<div class="cs-row"><input id="cemail" class="inp" type="email" autocomplete="email" placeholder="you@example.com" value="${esc(ui.email)}"><button class="btn primary" id="csend" ${ui.busy ? 'disabled' : ''}>Send code</button></div>`
        : `<p>A code was sent to <b>${esc(ui.email)}</b>. Enter it here (it works on any device).</p><div class="cs-row"><input id="ccode" class="inp" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" maxlength="10"><button class="btn primary" id="cverify" ${ui.busy ? 'disabled' : ''}>Verify</button><button class="btn ghost" id="cback">Use another email</button></div>`}
        ${ui.msg ? `<p class="${/sent|ok/i.test(ui.msg) ? 'muted' : 'cs-err'}">${esc(ui.msg)}</p>` : ''}`;
      /* Read the inputs BEFORE the busy redraw rebuilds the form, otherwise the typed value is gone. */
      const run = async (fn) => { ui.busy = true; ui.msg = ''; draw(el); try { await fn(); } catch (e) { ui.msg = (e && e.message) || 'Something went wrong'; } ui.busy = false; draw(el); };
      const send = $('#csend', el);
      if (send) send.onclick = () => {
        const email = $('#cemail', el).value.trim(); ui.email = email;
        run(async () => { if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.'); await api.requestCode(email); ui.stage = 'code'; ui.msg = 'Code sent. Check your inbox.'; });
      };
      const ver = $('#cverify', el);
      if (ver) ver.onclick = () => {
        const tok = $('#ccode', el).value.trim();
        run(async () => { if (!tok) throw new Error('Enter the code from the email.'); await api.verifyCode(ui.email, tok); ui = { stage: 'email', email: '', busy: false, msg: '' }; });
      };
      const back = $('#cback', el); if (back) back.onclick = () => { ui.stage = 'email'; ui.msg = ''; draw(el); };
      return;
    }
    const st = coord ? coord.status : { kind: 'idle' }, cloud = st.cloud;
    const line = { idle: 'Connecting…', syncing: 'Syncing…', synced: 'Synced. This device and the cloud match.', offline: 'Offline: saved on this device, will retry automatically.', 'setup-needed': esc(st.error || 'Setup needed.'), error: 'Error: ' + esc(st.error || 'unknown'), 'update-required': 'Update required: this build is older than the saved cloud data, so it will not overwrite it. Reload the page.', paused: 'Auto-sync is paused on this device.', applied: 'Loaded from the cloud. Reloading…', conflict: 'Both this device and the cloud changed since the last sync. Choose which copy to keep. Nothing has been overwritten.', 'cloud-newer': 'The cloud has newer progress from another device. This device has no unsynced changes.' }[st.kind] || '';
    let body = `<p><span class="cs-dot" data-st="${esc(st.kind)}"></span> <b>${esc(session.user.email || 'signed in')}</b><br><span class="muted">${line}</span></p>`;
    if ((st.kind === 'conflict' || st.kind === 'cloud-newer') && cloud) {
      body += `<div class="cs-cmp">${sum('This device', SyncCore.summarize(coord.local().data))}${sum('Cloud copy', SyncCore.summarize((cloud.state && cloud.state.data) || {}), `<li class="muted">saved ${esc(when(cloud.updatedAt))}</li>`)}</div>
        <div class="dbar"><button class="btn primary" id="ccloud">Use the cloud copy</button><button class="btn" id="clocal">Use this device</button><button class="btn ghost" id="ckeep">Keep offline for now</button></div>
        <p class="muted">“Use the cloud copy” replaces the progress on this device. “Use this device” replaces the cloud copy. Neither is automatic.</p>`;
    }
    body += `<div class="dbar"><button class="btn" id="csync">Sync now</button><button class="btn ghost" id="cout">Sign out</button><button class="btn ghost" id="cdel">Delete my cloud copy</button></div>`;
    el.innerHTML = body;
    const on = (id, fn) => { const b = $('#' + id, el); if (b) b.onclick = fn; };
    on('ccloud', () => { if (confirm('Replace the progress on THIS device with the cloud copy?')) api.resolve('cloud'); });
    on('clocal', () => { if (confirm('Replace the CLOUD copy with the progress on this device?')) api.resolve('local'); });
    on('ckeep', () => api.resolve('keep'));
    on('csync', () => api.syncNow());
    on('cout', () => { if (confirm('Sign out? Your progress stays on this device.')) api.signOut(); });
    on('cdel', async () => { if (confirm('Delete your copy in the cloud? This device keeps its progress and will upload it again on the next sync.')) { await api.deleteCloud(); redraw(); } });
  }

  init();
  addEventListener('online', () => { if (coord) api.syncNow(); });
  let lastCheck = 0;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && coord && Date.now() - lastCheck > 30000 && ['synced', 'offline', 'idle'].includes(coord.status.kind)) { lastCheck = Date.now(); api.syncNow(); } });
});
