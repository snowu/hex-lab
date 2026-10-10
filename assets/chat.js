/* Tutor chat: a side panel that knows what you are looking at. When "page context" is on, each message carries the visible
   page text plus whatever is in your editors and answer boxes. Needs the feedback Worker (see feedback-config.js). */
(function () {
  'use strict';
  if (!window.FEEDBACK || !FEEDBACK.enabled()) return;
  const KEY = 'silc:chat'; /* "silc:" is not synced with progress */
  const MAX_KEPT = 30, MAX_SENT = 10, PAGE_CHARS = 6000, DRAFT_CHARS = 3000;
  const $ = (s, el) => (el || document).querySelector(s);
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(msgs.slice(-MAX_KEPT))); } catch { /* ignore */ } };
  let msgs = load(), busy = false, useCtx = true;
  const WIDE = 'silc:wide';
  const wide = () => { try { return localStorage.getItem(WIDE) === '1'; } catch { return false; } };
  const applyWide = () => document.body.classList.toggle('chat-wide', wide());

  const SUGGEST = ['Explain this page in simple terms', 'Quiz me on this, one question at a time', 'What would a senior interviewer push on here?', 'Review what I have written so far'];

  /* ---------- page context ---------- */
  function gather() {
    const app = $('#app'); if (!app) return '';
    const parts = [`Route: ${location.hash || '#/'}`, `Page text:\n${(app.innerText || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, PAGE_CHARS)}`];
    let drafts = '';
    app.querySelectorAll('.CodeMirror').forEach((el, i) => { if (el.CodeMirror) drafts += `\n[editor ${i + 1}]\n${el.CodeMirror.getValue()}\n`; });
    app.querySelectorAll('textarea').forEach((t, i) => { if (t.value.trim() && !t.closest('.CodeMirror')) drafts += `\n[answer box ${i + 1}]\n${t.value}\n`; });
    if (drafts.trim()) parts.push(`What the learner has written/typed so far:${drafts.slice(0, DRAFT_CHARS)}`);
    return parts.join('\n\n');
  }

  /* ---------- safe rich text: headings, lists, fenced code, `inline code`, **bold**; everything else is text ---------- */
  function inline(parent, text) {
    text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\s][^*\n]*\*)/g).forEach((bit) => {
      if (bit.length > 2 && bit.startsWith('`') && bit.endsWith('`')) { const c = document.createElement('code'); c.textContent = bit.slice(1, -1); parent.appendChild(c); }
      else if (bit.length > 4 && bit.startsWith('**') && bit.endsWith('**')) { const b = document.createElement('strong'); b.textContent = bit.slice(2, -2); parent.appendChild(b); }
      else if (bit.length > 2 && bit.startsWith('*') && bit.endsWith('*')) { const i = document.createElement('em'); i.textContent = bit.slice(1, -1); parent.appendChild(i); }
      else if (bit) parent.appendChild(document.createTextNode(bit));
    });
  }
  function rich(el, text) {
    el.replaceChildren();
    text.split(/(```[\s\S]*?```)/g).forEach((chunk) => {
      if (!chunk) return;
      if (chunk.startsWith('```') && chunk.endsWith('```') && chunk.length >= 6) {
        const pre = document.createElement('pre'), code = document.createElement('code');
        code.textContent = chunk.slice(3, -3).replace(/^[a-zA-Z0-9_+-]*\n/, '').replace(/\n$/, ''); pre.appendChild(code); el.appendChild(pre); return;
      }
      let list = null, para = null;
      const flush = () => { list = null; para = null; };
      chunk.split('\n').forEach((line) => {
        const h = /^#{1,4}\s+(.*)$/.exec(line), ul = /^\s*[-*•]\s+(.*)$/.exec(line), ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
        if (!line.trim()) { flush(); return; }
        if (h) { flush(); const e = document.createElement('h4'); inline(e, h[1]); el.appendChild(e); return; }
        if (ul || ol) {
          const tag = ul ? 'UL' : 'OL';
          if (!list || list.tagName !== tag) { list = document.createElement(tag.toLowerCase()); el.appendChild(list); para = null; }
          const li = document.createElement('li'); inline(li, (ul || ol)[1]); list.appendChild(li); return;
        }
        list = null;
        if (!para) { para = document.createElement('p'); el.appendChild(para); } else para.appendChild(document.createElement('br'));
        inline(para, line);
      });
    });
  }

  /* ---------- panel ---------- */
  const panel = document.createElement('aside');
  panel.id = 'chat'; panel.hidden = true; panel.setAttribute('aria-label', 'Tutor chat');
  panel.innerHTML = `<div class="chat-head"><b>Tutor</b><span class="chat-st" id="chatSt">checking…</span><span class="sp"></span>
      <button class="icon-btn" id="chatTest" title="Test the connection" aria-label="Test the connection">↻</button>
      <button class="icon-btn" id="chatWide" title="Wider / narrower" aria-label="Toggle chat width">⇔</button>
      <button class="icon-btn" id="chatClear" title="Clear the conversation" aria-label="Clear the conversation">⌫</button>
      <button class="icon-btn" id="chatX" title="Close (Esc)" aria-label="Close chat">✕</button></div>
    <div class="chat-log" id="chatLog" aria-live="polite"></div>
    <div class="chat-foot"><label class="chat-ctx"><input type="checkbox" id="chatCtx" checked> <span id="chatCtxL">Include this page</span></label>
      <div class="chat-row"><textarea id="chatIn" rows="2" placeholder="Ask about this page… (Enter to send, Shift+Enter for a new line)" maxlength="2000"></textarea><button class="btn primary" id="chatSend">Send</button></div></div>`;
  document.body.appendChild(panel);
  const log = $('#chatLog'), input = $('#chatIn'), sendBtn = $('#chatSend'), st = $('#chatSt');

  function bubble(role, text) {
    const d = document.createElement('div'); d.className = 'chat-msg ' + role;
    if (role === 'assistant') rich(d, text); else d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function draw() {
    log.replaceChildren();
    if (!msgs.length) {
      const h = document.createElement('div'); h.className = 'chat-empty';
      h.innerHTML = '<p>Ask anything about what you are studying. With <b>Include this page</b> on, I can see the lesson, exercise or answer you have open, and the code in your editor.</p>';
      SUGGEST.forEach((q) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'fchip'; b.textContent = q; b.onclick = () => send(q); h.appendChild(b); });
      log.appendChild(h);
    } else msgs.forEach((m) => bubble(m.role, m.content));
  }
  function ctxLabel() {
    const n = gather().length;
    $('#chatCtxL').textContent = useCtx ? `Include this page (${n > 1000 ? (n / 1000).toFixed(1) + 'k' : n} chars)` : 'Page not included';
  }
  async function test() {
    st.textContent = 'checking…'; st.dataset.ok = '';
    const h = await FEEDBACK.health();
    st.dataset.ok = h.ok ? '1' : '0';
    st.textContent = h.ok ? `connected · ${h.model}` : `offline · ${h.error}`;
    return h;
  }
  async function send(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true; input.value = '';
    if (!msgs.length) log.replaceChildren();
    msgs.push({ role: 'user', content: text }); bubble('user', text);
    const wait = bubble('assistant', 'Thinking…'); wait.classList.add('wait');
    try {
      const reply = await FEEDBACK.chat(msgs.slice(-MAX_SENT).map((m) => ({ role: m.role, content: m.content })), useCtx ? gather() : '');
      msgs.push({ role: 'assistant', content: reply }); wait.classList.remove('wait'); rich(wait, reply);
    } catch (e) {
      msgs.pop(); wait.classList.remove('wait'); wait.classList.add('err'); wait.textContent = e.message; input.value = text;
    }
    save(); busy = false; sendBtn.disabled = false; log.scrollTop = log.scrollHeight; input.focus();
  }
  function open() {
    panel.hidden = false; document.body.classList.add('chat-open'); draw(); ctxLabel(); input.focus(); test();
  }
  function close() { panel.hidden = true; document.body.classList.remove('chat-open'); }
  const toggle = () => (panel.hidden ? open() : close());

  $('#chatX').onclick = close;
  $('#chatTest').onclick = test;
  $('#chatWide').onclick = () => { try { localStorage.setItem(WIDE, wide() ? '0' : '1'); } catch { /* ignore */ } applyWide(); };
  applyWide();
  $('#chatClear').onclick = () => { if (!msgs.length || confirm('Clear this conversation?')) { msgs = []; save(); draw(); } };
  $('#chatCtx').onchange = (e) => { useCtx = e.target.checked; ctxLabel(); };
  sendBtn.onclick = () => send(input.value);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); toggle(); } });
  addEventListener('hashchange', () => { if (!panel.hidden) setTimeout(ctxLabel, 400); });

  /* Any element with data-ask="…" (see askBtn in app.js) opens the chat and sends that question, with the page as context. */
  function ask(prompt) {
    if (panel.hidden) open();
    if (busy) return;
    useCtx = true; $('#chatCtx').checked = true; ctxLabel();
    send(prompt);
  }
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-ask]'); if (b) { e.preventDefault(); ask(b.dataset.ask); } });
  window.CHAT = { open, close, ask };

  const btn = $('#chatBtn');
  if (btn) { btn.hidden = false; btn.innerHTML = (window.LAB ? LAB.ic('chat', 18) : 'Ask'); btn.onclick = toggle; }
})();
