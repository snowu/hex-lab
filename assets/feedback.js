/* "Get AI feedback" widget. The browser only ever talks to the feedback Worker (worker/); the model key lives there.
   Everything the model returns is rendered with textContent, never as HTML. */
(function () {
  'use strict';
  const cfg = () => (window.FEEDBACK_CONFIG && window.FEEDBACK_CONFIG.url || '').replace(/\/$/, '');
  const enabled = () => !!cfg();
  const COOLDOWN_MS = 4000;

  async function ask(kind, prompt, answer) {
    let res;
    try {
      res = await fetch(cfg() + '/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, prompt, answer }), signal: AbortSignal.timeout(60000) });
    } catch (e) { throw new Error(e && e.name === 'TimeoutError' ? 'The reviewer took too long.' : 'Could not reach the reviewer. Are you offline?'); }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || 'The reviewer failed (' + res.status + ').');
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
  window.FEEDBACK = { enabled, ask, mount, chat, health };
})();
