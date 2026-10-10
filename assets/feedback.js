/* "Get AI feedback" widget. The browser only ever talks to the feedback Worker (worker/); the model key lives there.
   Everything the model returns is rendered with textContent, never as HTML. */
(function () {
  'use strict';
  const cfg = () => (window.FEEDBACK_CONFIG && window.FEEDBACK_CONFIG.url || '').replace(/\/$/, '');
  const enabled = () => !!cfg();
  const COOLDOWN_MS = 4000;


  /* ---------- usage counter (stored on this device only; "silu:" is not part of synced progress) ---------- */
  const UKEY = 'silu:usage';
  /* USD per 1M tokens [input, output] and the Go plan's monthly dollar cap per model (opencode.ai/docs/go). Estimates, not a bill. */
  const PRICE = { 'deepseek-v4-flash': { off: [0.15, 0.6], peak: [0.3, 1.2], cap: 30 }, 'muse-spark-1.3-contributor': { off: [0.1, 0.2], cap: 60 }, 'hy3': { off: [0.14, 0.58], cap: 60 } };
  const peakNow = (d) => { const h = d.getUTCHours(), wd = d.getUTCDay(); return wd >= 1 && wd <= 5 && ((h >= 1 && h < 4) || (h >= 6 && h < 10)); };
  const costOf = (model, tin, tout, when) => { const p = PRICE[model]; if (!p) return 0; const r = (peakNow(when) && p.peak) || p.off; return (tin * r[0] + tout * r[1]) / 1e6; };
  const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const readU = () => { try { const v = JSON.parse(localStorage.getItem(UKEY)); return v && v.days ? v : { days: {} }; } catch { return { days: {} }; } };
  function record(feature, u) {
    if (!u) return;
    try {
      const all = readU(), now = new Date(), k = dayKey(now), d = (all.days[k] = all.days[k] || { c: 0, i: 0, o: 0, $: 0, f: {}, m: {} });
      const cost = costOf(u.model, u.in || 0, u.out || 0, now);
      d.c++; d.i += u.in || 0; d.o += u.out || 0; d.$ += cost; d.f[feature] = (d.f[feature] || 0) + 1;
      const m = (d.m[u.model] = d.m[u.model] || { c: 0, i: 0, o: 0, $: 0 }); m.c++; m.i += u.in || 0; m.o += u.out || 0; m.$ += cost;
      Object.keys(all.days).sort().slice(0, -62).forEach((x) => delete all.days[x]);
      localStorage.setItem(UKEY, JSON.stringify(all));
    } catch { /* storage unavailable: no counter, everything else works */ }
    window.dispatchEvent(new Event('lab-usage'));
  }
  const blank = () => ({ calls: 0, tin: 0, tout: 0, cost: 0, byModel: {}, byFeature: {} });
  function usage() {
    const all = readU(), now = new Date(), today = dayKey(now), month = today.slice(0, 7), out = { today: blank(), month: blank(), all: blank() };
    for (const [k, d] of Object.entries(all.days)) {
      for (const [name, bucket] of [['all', true], ['month', k.startsWith(month)], ['today', k === today]]) {
        if (!bucket) continue;
        const b = out[name]; b.calls += d.c; b.tin += d.i; b.tout += d.o; b.cost += d.$;
        for (const [f, n] of Object.entries(d.f)) b.byFeature[f] = (b.byFeature[f] || 0) + n;
        for (const [m, x] of Object.entries(d.m)) { const t = (b.byModel[m] = b.byModel[m] || { calls: 0, tin: 0, tout: 0, cost: 0 }); t.calls += x.c; t.tin += x.i; t.tout += x.o; t.cost += x.$; }
      }
    }
    out.caps = Object.fromEntries(Object.entries(PRICE).map(([m, p]) => [m, p.cap]));
    return out;
  }
  const resetUsage = () => { try { localStorage.removeItem(UKEY); } catch { /* ignore */ } window.dispatchEvent(new Event('lab-usage')); };

  async function ask(kind, prompt, answer) {
    let res;
    try {
      res = await fetch(cfg() + '/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, prompt, answer }), signal: AbortSignal.timeout(60000) });
    } catch (e) { throw new Error(e && e.name === 'TimeoutError' ? 'The reviewer took too long.' : 'Could not reach the reviewer. Are you offline?'); }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || 'The reviewer failed (' + res.status + ').');
    record('review', data.usage);
    return data;
  }

  const li = (items, cls) => { const ul = document.createElement('ul'); ul.className = cls; (items || []).forEach((t) => { const x = document.createElement('li'); x.textContent = t; ul.appendChild(x); }); return ul; };
  const head = (t) => { const h = document.createElement('div'); h.className = 'fbk-h'; h.textContent = t; return h; };

  function render(box, fb) {
    box.replaceChildren();
    const v = document.createElement('div'); v.className = 'fbk-verdict ' + fb.verdict; v.textContent = { pass: 'Looks solid', partial: 'Partly there', fail: 'Needs work' }[fb.verdict];
    box.appendChild(v);
    if (fb.strengths.length) { box.appendChild(head('What works')); box.appendChild(li(fb.strengths, 'fbk-good')); }
    if (fb.issues.length) { box.appendChild(head('What to fix')); box.appendChild(li(fb.issues, 'fbk-bad')); }
    if (fb.next_step) { box.appendChild(head('Practise next')); const p = document.createElement('p'); p.textContent = fb.next_step; box.appendChild(p); }
    const n = document.createElement('p'); n.className = 'muted fbk-note'; n.textContent = 'AI opinion from a small, cheap model. Treat it as a second pair of eyes, not a grader.'; box.appendChild(n);
  }

  /** mount(container, {kind, prompt, getAnswer}) adds a button and a result area; does nothing when not configured. */
  function mount(container, opts) {
    if (!container || !enabled()) return;
    container.replaceChildren();
    container.classList.add('fbk');
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.textContent = 'Get AI feedback';
    const box = document.createElement('div'); box.className = 'fbk-box'; box.setAttribute('aria-live', 'polite');
    container.append(btn, box);
    let last = 0;
    btn.onclick = async () => {
      const answer = String(opts.getAnswer() || '').trim();
      if (answer.length < 10) { box.textContent = 'Write an answer first.'; return; }
      if (Date.now() - last < COOLDOWN_MS) return;
      last = Date.now(); btn.disabled = true; box.textContent = 'Reviewing…';
      try { render(box, await ask(opts.kind, opts.prompt, answer)); }
      catch (e) { box.textContent = e.message; }
      btn.disabled = false;
    };
  }
  async function chat(messages, context) {
    let res;
    try { res = await fetch(cfg() + '/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages, context }), signal: AbortSignal.timeout(70000) }); }
    catch (e) { throw new Error(e && e.name === 'TimeoutError' ? 'The tutor took too long.' : 'Could not reach the tutor. Are you offline?'); }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || 'The tutor failed (' + res.status + ').');
    record('chat', data.usage);
    return data.reply;
  }
  /** Connection check: resolves {ok, model, codeModel} or {ok:false, error}. */
  async function health() {
    try {
      const res = await fetch(cfg() + '/health', { signal: AbortSignal.timeout(8000) });
      const d = await res.json();
      return d && d.ok && d.configured ? { ok: true, model: d.model, codeModel: d.codeModel } : { ok: false, error: d && !d.configured ? 'Worker has no model key' : 'Unexpected reply' };
    } catch { return { ok: false, error: 'Unreachable' }; }
  }
  /** AI mock interviewer. mode 'turn' -> {reply, done}; mode 'grade' -> {hits, summary, strengths, gaps, next_step}. */
  async function interview(payload) {
    let res;
    try { res = await fetch(cfg() + '/interview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(70000) }); }
    catch (e) { throw new Error(e && e.name === 'TimeoutError' ? 'The interviewer took too long.' : 'Could not reach the interviewer. Are you offline?'); }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || 'The interviewer failed (' + res.status + ').');
    record('interview', data.usage);
    return data;
  }
  window.FEEDBACK = { enabled, ask, mount, chat, health, interview, usage, resetUsage };
})();
