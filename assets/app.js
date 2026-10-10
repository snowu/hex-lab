(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
const store = {
  get(k, d) { try { const v = localStorage.getItem('sil:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sil:' + k, JSON.stringify(v)); } catch {} },
};
const app = $('#app');
const TRACKS = window.TRACKS, CARDS = window.CARDS || [], MOCK = window.MOCK || [], RES = window.RESOURCES || [];

/* ---------- progress ---------- */
let progress = store.get('progress', {}); // { lessonId: { 'q0': true, 'c1': true } }
const itemsOf = (l) => l.sections.map((s, i) => ({ s, k: (s.type === 'quiz' ? 'q' : 'c') + i })).filter((x) => x.s.type === 'quiz' || x.s.type === 'code');
const lessonPct = (l) => {
  const items = itemsOf(l); const p = progress[l.id] || {};
  if (!items.length) return p.read ? 100 : 0;
  return Math.round((items.filter((x) => p[x.k]).length / items.length) * 100);
};
const trackPct = (t) => Math.round(t.lessons.reduce((a, l) => a + lessonPct(l), 0) / t.lessons.length);
const mark = (lid, k) => { (progress[lid] = progress[lid] || {})[k] = true; store.set('progress', progress); };
const findLesson = (id) => { for (const t of TRACKS) { const i = t.lessons.findIndex((l) => l.id === id); if (i >= 0) return { t, l: t.lessons[i], i }; } };

/* ---------- theme ---------- */
const applyTheme = (t) => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
applyTheme(store.get('theme', null));
$('#themeBtn').onclick = () => {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark'; store.set('theme', next); applyTheme(next);
  $$('.CodeMirror').forEach((el) => el.CodeMirror && el.CodeMirror.setOption('theme', next === 'dark' ? 'material-darker' : 'default'));
};
const cmTheme = () => (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark' ? 'material-darker' : 'default';

/* ---------- router ---------- */
const routes = [
  [/^#?\/?$/, viewHome],
  [/^#\/track\/([\w-]+)$/, viewTrack],
  [/^#\/lesson\/([\w-]+)$/, viewLesson],
  [/^#\/review$/, viewReview],
  [/^#\/mock$/, viewMock],
  [/^#\/resources$/, viewResources],
  [/^#\/search\/(.*)$/, viewSearch],
];
let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const h = decodeURIComponent(location.hash || '#/');
  for (const [re, fn] of routes) { const m = h.match(re); if (m) { fn(...m.slice(1)); setNav(h); window.scrollTo(0, 0); return; } }
  app.innerHTML = '<h1>Not found</h1><p><a href="#/">Back home</a></p>';
}
function setNav(h) {
  const key = h.startsWith('#/review') ? 'review' : h.startsWith('#/mock') ? 'mock' : h.startsWith('#/resources') ? 'resources' : 'home';
  $$('.top nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === key));
}
addEventListener('hashchange', route);

/* ---------- views ---------- */
function viewHome() {
  document.title = 'Senior Interview Lab';
  const total = TRACKS.reduce((a, t) => a + t.lessons.length, 0);
  const done = TRACKS.reduce((a, t) => a + t.lessons.filter((l) => lessonPct(l) === 100).length, 0);
  const due = dueCards().length;
  app.innerHTML = `
    <h1>Level up for senior interviews, in the AI era</h1>
    <p class="lead">Short interactive lessons, a real code editor with tests, flashcards with spaced repetition, and mock-interview prompts. Generic senior material plus a dedicated open-banking track for Neonomics.</p>
    <div class="grid">
      <div class="card"><h3>${done}/${total} lessons</h3><p>complete</p><div class="bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div></div>
      <a class="card" href="#/review"><h3>${due} cards due</h3><p>${CARDS.length} flashcards in total. Spaced repetition.</p></a>
      <a class="card" href="#/mock"><h3>Mock interview</h3><p>Random question, a timer, then a self-check rubric.</p></a>
    </div>
    <h2>Tracks</h2>
    <div class="grid">${TRACKS.map((t) => `
      <a class="card" href="#/track/${t.id}">
        <h3>${t.icon} ${esc(t.title)}</h3>
        ${t.hot ? '<span class="tag hot">Neonomics</span>' : ''}<span class="tag">${t.lessons.length} lessons</span>
        <p>${esc(t.blurb)}</p>
        <div class="bar"><i style="width:${trackPct(t)}%"></i></div>
      </a>`).join('')}</div>
    <div class="callout tip"><b>Suggested order.</b> Playbook, then Coding Fluency and System Design in parallel, then Reliability, AI-Era, and the Open Banking track in the last week. Do the flashcards daily.</div>`;
}

function viewTrack(id) {
  const t = TRACKS.find((x) => x.id === id); if (!t) return viewHome();
  document.title = t.title + ' · Senior Interview Lab';
  app.innerHTML = `
    <div class="crumbs"><a href="#/">Tracks</a> / ${esc(t.title)}</div>
    <h1>${t.icon} ${esc(t.title)}</h1><p class="lead">${esc(t.blurb)}</p>
    <ul class="lessonlist">${t.lessons.map((l, i) => {
      const p = lessonPct(l);
      return `<li><a class="${p === 100 ? 'done' : ''}" href="#/lesson/${l.id}"><span class="n">${p === 100 ? '✓' : i + 1}</span><span><b>${esc(l.title)}</b><br><small style="color:var(--muted)">${esc(l.summary || '')}</small></span><span class="meta">${l.minutes} min · ${p}%</span></a></li>`;
    }).join('')}</ul>`;
}

function viewLesson(id) {
  const f = findLesson(id); if (!f) return viewHome();
  const { t, l, i } = f;
  document.title = l.title + ' · Senior Interview Lab';
  app.innerHTML = `
    <div class="crumbs"><a href="#/">Tracks</a> / <a href="#/track/${t.id}">${esc(t.title)}</a> / ${esc(l.title)}</div>
    <h1>${esc(l.title)}</h1>
    <div class="bar" title="Lesson progress"><i id="lbar" style="width:${lessonPct(l)}%"></i></div>
    <div id="body"></div>
    <div class="nextprev">
      ${i > 0 ? `<a class="btn" href="#/lesson/${t.lessons[i - 1].id}">← ${esc(t.lessons[i - 1].title)}</a>` : '<span></span>'}
      ${i < t.lessons.length - 1 ? `<a class="btn primary" href="#/lesson/${t.lessons[i + 1].id}">${esc(t.lessons[i + 1].title)} →</a>` : `<a class="btn primary" href="#/track/${t.id}">Finish track</a>`}
    </div>`;
  const body = $('#body');
  const bump = () => { $('#lbar').style.width = lessonPct(l) + '%'; };
  const editors = [];
  l.sections.forEach((s, idx) => {
    const el = document.createElement('section'); el.className = 'sec'; body.appendChild(el);
    ({ text: rText, quiz: rQuiz, reveal: rReveal, steps: rSteps, code: rCode }[s.type] || rText)(el, s, l, idx, bump, editors);
  });
  if (!itemsOf(l).length) { mark(l.id, 'read'); bump(); }
  cleanup = () => editors.forEach((e) => e.dispose && e.dispose());
}

function rText(el, s) { el.innerHTML = s.html; }
function rReveal(el, s) { el.innerHTML = `<details><summary>${esc(s.title)}</summary>${s.html}</details>`; }
function rQuiz(el, s, l, idx, bump) {
  const key = 'q' + idx; let answered = false;
  el.innerHTML = `<div class="quiz"><div class="q">${s.q}</div>${s.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}<div class="explain" hidden></div></div>`;
  $$('.opt', el).forEach((b) => b.onclick = () => {
    if (answered && b.classList.contains('wrong')) return;
    const i = +b.dataset.i;
    if (i === s.answer) {
      b.classList.add('right'); answered = true;
      $$('.opt', el).forEach((x) => (x.disabled = true));
      const ex = $('.explain', el); ex.hidden = false; ex.innerHTML = '✅ ' + s.explain;
      mark(l.id, key); bump();
    } else { b.classList.add('wrong'); b.disabled = true; const ex = $('.explain', el); ex.hidden = false; ex.textContent = 'Not quite. Try another option.'; }
  });
}
function rSteps(el, s) {
  let n = 0;
  const draw = () => {
    el.innerHTML = `<div class="stepper"><div class="dots">${s.steps.map((x, i) => `<button class="${i === n ? 'on' : ''}" data-i="${i}">${i + 1}</button>`).join('')}</div>
      <h3 style="margin-top:0">${esc(s.steps[n].title)}</h3>${s.steps[n].html}
      <div class="nav"><button id="pv" ${n === 0 ? 'disabled' : ''}>← Back</button><button id="nx" class="primary" ${n === s.steps.length - 1 ? 'disabled' : ''}>Next →</button></div></div>`;
    $$('.dots button', el).forEach((b) => b.onclick = () => { n = +b.dataset.i; draw(); });
    $('#pv', el).onclick = () => { n--; draw(); }; $('#nx', el).onclick = () => { n++; draw(); };
  };
  draw();
}

/* ---------- code exercises ---------- */
function runInWorker(code) {
  return new Promise((resolve) => {
    let w; try { w = new Worker('assets/worker.js'); } catch (e) { return resolve({ fatal: 'Cannot start worker: ' + e.message, results: [], logs: [] }); }
    const t = setTimeout(() => { w.terminate(); resolve({ fatal: 'Timed out after 4s. Infinite loop or too slow?', results: [], logs: [] }); }, 4000);
    w.onmessage = (e) => { clearTimeout(t); w.terminate(); resolve(e.data); };
    w.onerror = (e) => { clearTimeout(t); w.terminate(); resolve({ fatal: e.message || 'Worker error', results: [], logs: [] }); };
    w.postMessage({ code });
  });
}
function rCode(el, s, l, idx, bump, editors) {
  const key = 'c' + idx, dk = 'draft:' + l.id + ':' + idx;
  el.innerHTML = `<div class="ex">
    <div class="head"><b>🛠 ${esc(s.title)}</b>${s.prompt}</div>
    <div class="editor"></div>
    <div class="bar2"><button class="primary run">▶ Run tests <small>(Ctrl/⌘+Enter)</small></button><button class="hint">Hint</button><button class="sol">Show solution</button><button class="reset">Reset</button><span class="status ${(progress[l.id] || {})[key] ? 'ok' : ''}">${(progress[l.id] || {})[key] ? '✓ solved' : ''}</span></div>
    <div class="out"></div></div>`;
  const host = $('.editor', el); const start = store.get(dk, s.starter);
  let get, set;
  if (window.CodeMirror) {
    const cm = CodeMirror(host, { value: start, mode: 'javascript', lineNumbers: true, theme: cmTheme(), indentUnit: 2, tabSize: 2, indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, viewportMargin: Infinity,
      extraKeys: { Tab: (c) => c.execCommand('insertSoftTab'), 'Ctrl-Enter': () => run(), 'Cmd-Enter': () => run() } });
    host.firstChild.CodeMirror = cm; get = () => cm.getValue(); set = (v) => cm.setValue(v);
    cm.on('change', () => store.set(dk, cm.getValue()));
  } else {
    const ta = document.createElement('textarea'); ta.value = start; ta.spellcheck = false; host.appendChild(ta);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); const a = ta.selectionStart; ta.setRangeText('  ', a, ta.selectionEnd, 'end'); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });
    ta.addEventListener('input', () => store.set(dk, ta.value)); get = () => ta.value; set = (v) => { ta.value = v; store.set(dk, v); };
  }
  const out = $('.out', el);
  async function run() {
    out.innerHTML = '<em>Running…</em>';
    const r = await runInWorker(get() + '\n;\n' + s.tests);
    const pass = r.results.filter((x) => x.pass).length, all = r.results.length;
    let h = '';
    if (r.fatal) h += `<div class="res fail">✗ <div>Error<small>${esc(r.fatal)}</small></div></div>`;
    h += r.results.map((x) => `<div class="res ${x.pass ? 'pass' : 'fail'}">${x.pass ? '✓' : '✗'} <div>${esc(x.name)}${x.err ? `<small>${esc(x.err)}</small>` : ''}</div></div>`).join('');
    if (r.logs && r.logs.length) h += `<div class="logs">${esc(r.logs.join('\n'))}</div>`;
    if (all && pass === all) { h = `<div class="res pass"><b>All ${all} tests pass 🎉</b></div>` + h; mark(l.id, key); bump(); const st = $('.status', el); st.className = 'status ok'; st.textContent = '✓ solved'; }
    else if (all) h = `<div><b>${pass}/${all} passing</b></div>` + h;
    out.innerHTML = h;
  }
  $('.run', el).onclick = run;
  $('.hint', el).onclick = () => { out.innerHTML = `<div class="callout tip"><b>Hint:</b> ${s.hint || 'Start with the simplest failing test.'}</div>`; };
  $('.sol', el).onclick = () => { out.innerHTML = `<div class="callout warn">Try first! Here is one reasonable solution:</div><pre><code>${esc(s.solution)}</code></pre>${s.notes ? `<p>${s.notes}</p>` : ''}`; };
  $('.reset', el).onclick = () => { if (confirm('Reset to starter code?')) { set(s.starter); out.innerHTML = ''; } };
  editors.push({ dispose() {} });
}

/* ---------- flashcards ---------- */
const BOX_DAYS = [0, 1, 3, 7, 21, 60];
const cid = (c) => { let h = 0; for (const ch of c.q) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'c' + (h >>> 0).toString(36); };
let cardState = store.get('cards', {});
const dueCards = (track) => CARDS.filter((c) => (!track || c.track === track) && (!cardState[cid(c)] || cardState[cid(c)].due <= Date.now()));
function viewReview() {
  document.title = 'Flashcards · Senior Interview Lab';
  let filter = '', deck = [], cur = 0, flipped = false;
  const tracks = [...new Set(CARDS.map((c) => c.track))];
  const build = () => { deck = dueCards(filter).sort(() => Math.random() - 0.5); cur = 0; flipped = false; draw(); };
  const draw = () => {
    const filters = `<div class="filters"><button data-f="" class="${!filter ? 'on' : ''}">All</button>${tracks.map((t) => `<button data-f="${esc(t)}" class="${filter === t ? 'on' : ''}">${esc(t)}</button>`).join('')}</div>`;
    let body;
    if (cur >= deck.length) body = `<div class="card flash"><div><h2>🎉 Nothing due${filter ? ' in ' + esc(filter) : ''}</h2><p class="lead">Come back tomorrow, or practice with a mock question.</p><p><button id="again">Review everything anyway</button></p></div></div>`;
    else {
      const c = deck[cur];
      body = `<div class="card flash" id="fc"><div class="side">${flipped ? c.a : '<b>' + c.q + '</b>'}<p style="color:var(--muted);font-size:.85rem;margin-top:16px">${flipped ? '' : 'Click or press Space to reveal'}</p></div></div>
        ${flipped ? '<div class="rate"><button data-r="0">Again</button><button data-r="1">Hard</button><button class="primary" data-r="2">Good</button><button data-r="3">Easy</button></div>' : ''}
        <p style="text-align:center;color:var(--muted)">${cur + 1} / ${deck.length} · ${esc(c.track)}</p>`;
    }
    app.innerHTML = `<h1>Flashcards</h1><p class="lead">Say the answer out loud before flipping. Cards you miss come back sooner.</p>${filters}${body}`;
    $$('.filters button').forEach((b) => b.onclick = () => { filter = b.dataset.f; build(); });
    const fc = $('#fc'); if (fc) fc.onclick = () => { flipped = true; draw(); };
    $$('.rate button').forEach((b) => b.onclick = () => rate(+b.dataset.r));
    const ag = $('#again'); if (ag) ag.onclick = () => { deck = CARDS.filter((c) => !filter || c.track === filter).sort(() => Math.random() - 0.5); cur = 0; flipped = false; draw(); };
  };
  const rate = (r) => {
    const c = deck[cur], id = cid(c), st = cardState[id] || { box: 0 };
    st.box = r === 0 ? 0 : r === 1 ? Math.max(1, st.box) : Math.min(BOX_DAYS.length - 1, st.box + (r === 3 ? 2 : 1));
    st.due = Date.now() + (r === 0 ? 5 * 60e3 : BOX_DAYS[st.box] * 864e5);
    cardState[id] = st; store.set('cards', cardState);
    if (r === 0) deck.push(c);
    cur++; flipped = false; draw();
  };
  const key = (e) => {
    if (e.target.matches('input,textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); if (!flipped && cur < deck.length) { flipped = true; draw(); } }
    else if (flipped && '1234'.includes(e.key)) rate(+e.key - 1);
  };
  addEventListener('keydown', key); cleanup = () => removeEventListener('keydown', key);
  build();
}

/* ---------- mock interview ---------- */
function viewMock() {
  document.title = 'Mock interview · Senior Interview Lab';
  let kind = '', q = null, t0 = 0, iv = null, secs = 0;
  const kinds = [...new Set(MOCK.map((m) => m.kind))];
  const draw = () => {
    app.innerHTML = `<h1>Mock interview</h1><p class="lead">Pick a type, answer out loud (or write bullet points), then compare against the rubric. Aim to think aloud, state assumptions, and name trade-offs.</p>
      <div class="filters"><button data-k="" class="${!kind ? 'on' : ''}">Any</button>${kinds.map((k) => `<button data-k="${esc(k)}" class="${kind === k ? 'on' : ''}">${esc(k)}</button>`).join('')}</div>
      ${q ? `<div class="card"><span class="tag">${esc(q.kind)}</span><span class="tag">suggested ${q.minutes} min</span><h2 style="margin-top:8px">${q.q}</h2>
        <div class="timer" id="tm">00:00</div>
        <textarea id="notes" rows="7" style="width:100%;margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit" placeholder="Your notes, assumptions, structure…"></textarea>
        <button id="done" class="primary">Done: show rubric</button> <button id="skip">Another question</button>
        <div id="rub"></div></div>` : '<p><button class="primary" id="go">Give me a question</button></p>'}`;
    $$('.filters button').forEach((b) => b.onclick = () => { kind = b.dataset.k; pick(); });
    const go = $('#go'); if (go) go.onclick = pick;
    const sk = $('#skip'); if (sk) sk.onclick = pick;
    const dn = $('#done'); if (dn) dn.onclick = () => { clearInterval(iv); $('#rub').innerHTML = `<h3>A strong answer covers</h3><ul class="rubric">${q.rubric.map((r) => `<li>${r}</li>`).join('')}</ul><p style="color:var(--muted)">Took ${fmtT(secs)}. Which points did you miss? Turn them into flashcards or revisit the lesson.</p>`; };
    if (q) tick();
  };
  const fmtT = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const tick = () => { clearInterval(iv); const el = $('#tm'); iv = setInterval(() => { secs = Math.floor((Date.now() - t0) / 1000); if ($('#tm')) $('#tm').textContent = fmtT(secs); }, 500); if (el) el.textContent = fmtT(secs); };
  const pick = () => { const pool = MOCK.filter((m) => !kind || m.kind === kind); let n; do { n = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && n === q); q = n; t0 = Date.now(); secs = 0; draw(); };
  cleanup = () => clearInterval(iv);
  draw();
}

/* ---------- resources ---------- */
function viewResources() {
  document.title = 'Free resources · Senior Interview Lab';
  const cats = [...new Set(RES.map((r) => r.cat))]; let f = '';
  const draw = () => {
    app.innerHTML = `<h1>Free resources</h1><p class="lead">Hand-picked free material. Everything here is openly readable. Links open in a new tab.</p>
      <div class="filters"><button data-c="" class="${!f ? 'on' : ''}">All</button>${cats.map((c) => `<button data-c="${esc(c)}" class="${f === c ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
      <div class="grid">${RES.filter((r) => !f || r.cat === f).map((r) => `<a class="card" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="tag">${esc(r.cat)}</span><h3>${esc(r.title)} ↗</h3><p>${esc(r.note)}</p></a>`).join('')}</div>`;
    $$('.filters button').forEach((b) => b.onclick = () => { f = b.dataset.c; draw(); });
  };
  draw();
}

/* ---------- search ---------- */
let index = null;
function buildIndex() {
  index = [];
  TRACKS.forEach((t) => t.lessons.forEach((l) => index.push({ kind: 'Lesson', title: l.title, sub: t.title, href: '#/lesson/' + l.id, text: (l.title + ' ' + (l.summary || '') + ' ' + l.sections.map((s) => strip((s.html || '') + ' ' + (s.q || '') + ' ' + (s.prompt || '') + ' ' + (s.steps ? s.steps.map((x) => x.title + ' ' + x.html).join(' ') : ''))).join(' ')).toLowerCase() })));
  CARDS.forEach((c) => index.push({ kind: 'Card', title: strip(c.q), sub: strip(c.a).slice(0, 140), href: '#/review', text: (strip(c.q) + ' ' + strip(c.a)).toLowerCase() }));
  RES.forEach((r) => index.push({ kind: 'Resource', title: r.title, sub: r.note, href: r.url, ext: true, text: (r.title + ' ' + r.note + ' ' + r.cat).toLowerCase() }));
  MOCK.forEach((m) => index.push({ kind: 'Mock', title: strip(m.q), sub: m.kind, href: '#/mock', text: (strip(m.q) + ' ' + m.rubric.join(' ')).toLowerCase() }));
}
function viewSearch(qs) {
  if (!index) buildIndex();
  const terms = qs.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = terms.length ? index.map((d) => ({ d, score: terms.reduce((a, t) => a + (d.title.toLowerCase().includes(t) ? 5 : 0) + (d.text.includes(t) ? 1 : -100), 0) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 40) : [];
  app.innerHTML = `<h1>Search: “${esc(qs)}”</h1>${hits.length ? hits.map(({ d }) => `<div class="hit"><span class="tag">${d.kind}</span><a href="${esc(d.href)}" ${d.ext ? 'target="_blank" rel="noopener"' : ''}>${esc(d.title)}</a><small>${esc(d.sub)}</small></div>`).join('') : '<p>No results.</p>'}`;
}
$('#searchForm').onsubmit = (e) => { e.preventDefault(); const v = $('#q').value.trim(); if (v) location.hash = '#/search/' + encodeURIComponent(v); };
addEventListener('keydown', (e) => { if (e.key === '/' && !e.target.matches('input,textarea,.CodeMirror *')) { e.preventDefault(); $('#q').focus(); } });

route();
})();
