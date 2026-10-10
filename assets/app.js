(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const store = {
  get(k, d) { try { const v = localStorage.getItem('sil:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sil:' + k, JSON.stringify(v)); } catch {} },
};
const app = $('#app');
try { if (!localStorage.getItem('sil:pyMigrated')) { Object.keys(localStorage).filter((k) => k.startsWith('sil:draft:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('sil:pyMigrated', 'true'); } } catch {}
const TRACKS = window.TRACKS, CARDS = window.CARDS || [], MOCK = window.MOCK || [], RES = window.RESOURCES || [];

/* ---------- icons ---------- */
const P = {
  playbook: '<circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5"/>',
  coding: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  design: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  reliability: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  ai: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
  openbanking: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  cloud: '<path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
  flame: '<path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.5 1.5 2 2 2 0-3-1-5 1-8z"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  rotate: '<polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  arrowL: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
  link: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V22h16"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  bug: '<rect x="8" y="6" width="8" height="14"/><path d="M19 7l-3 2M5 7l3 2M19 19l-3-2M5 19l3-2M20 13h-4M4 13h4M12 20V10M9 6a3 3 0 0 1 6 0"/>',
  sim: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
};
const ic = (n, s = 18, sw = 1.8) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${P[n] || ''}</svg>`;
const HUE = { playbook: 255, coding: 190, design: 150, reliability: 28, ai: 320, openbanking: 44, cloud: 215 };
const hueOf = (id) => HUE[id] ?? ([...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360);
const trackOf = (lessonId) => TRACKS.find((t) => t.lessons.some((l) => l.id === lessonId));
const ring = (pct, size = 46) => `<span class="pct ${size >= 48 ? 'lg' : ''}" style="--p:${pct}"><b>${pct}%</b><i></i></span>`;

/* ---------- progress, xp, streak ---------- */
let progress = store.get('progress', {});
let xp = store.get('xp', 0);
let days = store.get('days', []);
const dstr = (d) => d.toISOString().slice(0, 10);
const KP = { quiz: 'q', code: 'c', bug: 'b', predict: 'p' };
function keysOf(l) {
  if (l._keys) return l._keys;
  let n = 0; /* legacy sections keep index-based keys so saved progress/drafts survive; added sections use their pid */
  l._keys = l.sections.map((s) => { const legacy = !s.pid, idx = legacy ? n++ : null; return KP[s.type] ? (legacy ? KP[s.type] + idx : 'x:' + s.pid) : null; });
  return l._keys;
}
const itemsOf = (l) => l.sections.map((s, i) => ({ s, k: keysOf(l)[i] })).filter((x) => x.k);
const lessonPct = (l) => {
  const items = itemsOf(l), p = progress[l.id] || {};
  if (!items.length) return p.read ? 100 : 0;
  return Math.round((items.filter((x) => p[x.k]).length / items.length) * 100);
};
const trackPct = (t) => Math.round(t.lessons.reduce((a, l) => a + lessonPct(l), 0) / t.lessons.length);
const trackMin = (t) => t.lessons.reduce((a, l) => a + l.minutes, 0);
const findLesson = (id) => { for (const t of TRACKS) { const i = t.lessons.findIndex((l) => l.id === id); if (i >= 0) return { t, l: t.lessons[i], i }; } };
const level = () => Math.floor(Math.sqrt(xp / 40)) + 1;
const streak = () => {
  const set = new Set(days), d = new Date();
  if (!set.has(dstr(d))) d.setDate(d.getDate() - 1);
  let n = 0; while (set.has(dstr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
};
function touchDay() { const t = dstr(new Date()); if (!days.includes(t)) { days.push(t); store.set('days', days); } }
function addXp(n, msg) {
  xp += n; store.set('xp', xp); touchDay(); renderXp();
  if (msg) toast(`+${n} XP · ${msg}`);
}
function mark(lid, k, award, msg) {
  const p = (progress[lid] = progress[lid] || {});
  if (p[k]) return false;
  p[k] = true; store.set('progress', progress); addXp(award, msg); return true;
}
function renderXp() {
  const L = level(), lo = 40 * (L - 1) ** 2, hi = 40 * L ** 2, s = streak();
  $('#xp').innerHTML = `<span class="lv">${L}</span><span>${xp} XP</span><span class="xb"><i style="width:${Math.round(((xp - lo) / (hi - lo)) * 100)}%"></i></span>${s ? `<span class="fl">${ic('flame', 15)}${s}</span>` : ''}`;
  $('#xp').title = `Level ${L} · ${hi - xp} XP to next level${s ? ` · ${s}-day streak` : ''}`;
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = ic('bolt', 16) + esc(msg);
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2700);
}
function confetti(x, y, hue = 255) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#fx'), g = c.getContext('2d'), dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; g.scale(dpr, dpr);
  const cols = ['#39ff7a', '#00e5a0', '#ffb000', '#00e5ff', '#d4f5e0', '#7dffb2'];
  const ps = Array.from({ length: 90 }, () => ({ x, y, vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3, s: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
  let t0 = performance.now();
  (function frame(t) {
    const dt = Math.min(2, (t - t0) / 16.7); t0 = t; g.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of ps) { p.vy += .28 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y < innerHeight + 20) alive++;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); g.restore(); }
    if (alive) requestAnimationFrame(frame); else g.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

/* ---------- theme ---------- */
const sysDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
const curTheme = () => document.documentElement.dataset.theme || (sysDark() ? 'dark' : 'light');
function setTheme(t) { if (t) document.documentElement.dataset.theme = t; $('#themeBtn').innerHTML = ic(curTheme() === 'dark' ? 'sun' : 'moon', 18); }
setTheme(store.get('theme', null));
$('#themeBtn').onclick = () => { const n = curTheme() === 'dark' ? 'light' : 'dark'; store.set('theme', n); setTheme(n); };
$('#sIc').innerHTML = ic('search', 16); $('#cIc').innerHTML = ic('search', 18);

/* ---------- router ---------- */
const routes = [
  [/^#?\/?$/, viewHome],
  [/^#\/track\/([\w-]+)$/, viewTrack],
  [/^#\/lesson\/([\w-]+)$/, viewLesson],
  [/^#\/review$/, viewReview],
  [/^#\/mock$/, viewMock],
  [/^#\/resources$/, viewResources],
];
let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  $('#pbar i').style.width = '0';
  const h = decodeURIComponent(location.hash || '#/');
  app.classList.remove('in'); void app.offsetWidth; app.classList.add('in');
  for (const [re, fn] of routes) { const m = h.match(re); if (m) { fn(...m.slice(1)); setNav(h); window.scrollTo(0, 0); return; } }
  app.innerHTML = '<h1>Not found</h1><p><a href="#/">Back home</a></p>';
}
function setNav(h) {
  const key = h.startsWith('#/review') ? 'review' : h.startsWith('#/mock') ? 'mock' : h.startsWith('#/resources') ? 'resources' : 'home';
  $$('.top nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === key));
}
addEventListener('hashchange', route);

/* ---------- home ---------- */
function nextLesson() {
  const last = store.get('last', null), f = last && findLesson(last);
  if (f && lessonPct(f.l) < 100) return { ...f, resume: true };
  for (const t of TRACKS) for (const [i, l] of t.lessons.entries()) if (lessonPct(l) < 100) return { t, l, i, resume: false, started: !!progress[l.id] };
  return null;
}
function viewHome() {
  document.title = 'Senior Interview Lab';
  const total = TRACKS.reduce((a, t) => a + t.lessons.length, 0);
  const done = TRACKS.reduce((a, t) => a + t.lessons.filter((l) => lessonPct(l) === 100).length, 0);
  const due = dueCards().length, nx = nextLesson(), s = streak();
  const cnt = (type) => TRACKS.reduce((a, t) => a + t.lessons.reduce((b, l) => b + l.sections.filter((x) => x.type === type).length, 0), 0);
  const exTotal = cnt('code'), bugTotal = cnt('bug'), simTotal = cnt('sim');
  app.innerHTML = `
    <section class="hero"><div class="hero-l">
      <span class="eyebrow"><span class="p">$</span> ./senior-prep <b>--mode=ai-era</b></span>
      <h1>Practice like it's the <span class="grad">real interview.</span><span class="cur"></span></h1>
      <p class="lead">${TRACKS.length} tracks with ${exTotal} Python coding challenges, ${bugTotal} bug hunts and ${simTotal} interactive simulations, plus flashcards and mock interviews. From system design and Kafka to AWS, Terraform and a dedicated open-banking track for Neonomics. Every lesson works as text, as practice, or both.</p>
      <div class="cta">
        <a class="btn primary" href="#/lesson/${(nx ? nx.l : TRACKS[0].lessons[0]).id}">${ic('play', 16)} ${nx && (nx.resume || nx.started) ? 'Continue learning' : 'Start learning'}</a>
        <a class="btn" href="#/review">${ic('cards', 16)} ${due} cards due</a>
        <button class="btn ghost" id="heroSearch">${ic('search', 16)} Search <kbd>Ctrl K</kbd></button>
      </div></div>
      <div class="hero-r" aria-hidden="true"><div class="pv brk">
        <div class="pv-tab"><span class="tl3"><i></i><i></i><i></i></span><span class="file">rateLimiter.js</span></div>
        <pre class="pv-code"><span class="k">class</span> <span class="f">RateLimiter</span> {
  <span class="f">tryAcquire</span>(n = <span class="n">1</span>) {
    <span class="k">this</span>._refill();
    <span class="k">if</span> (<span class="k">this</span>.tokens &gt;= n) {
      <span class="k">this</span>.tokens -= n;
      <span class="k">return true</span>;
    }
    <span class="k">return false</span>;
  }
}</pre>
        <div class="pv-t"><div class="pv-s"><b>6/6 passing</b><span class="segs"><i class="p"></i><i class="p"></i><i class="p"></i><i class="p"></i><i class="p"></i><i class="p"></i></span></div>
          <div class="res pass"><span class="ric">${ic('check', 14, 2.6)}</span><span class="nm">starts full</span></div>
          <div class="res pass"><span class="ric">${ic('check', 14, 2.6)}</span><span class="nm">refills over time</span></div>
          <div class="res pass"><span class="ric">${ic('check', 14, 2.6)}</span><span class="nm">never exceeds capacity</span></div></div>
        <span class="pv-xp">${ic('bolt', 14)} +50 XP</span>
      </div></div>
    </section>
    <section class="stats" aria-label="Your progress">
      <div class="stat"><span class="si">${ic('book', 20)}</span><div><div class="v">${done}/${total}</div><div class="l">lessons complete</div></div></div>
      <div class="stat"><span class="si">${ic('bolt', 20)}</span><div><div class="v">Level ${level()}</div><div class="l">${xp} XP earned</div></div></div>
      <div class="stat"><span class="si" style="color:#ff9a3d">${ic('flame', 20)}</span><div><div class="v">${s} day${s === 1 ? '' : 's'}</div><div class="l">current streak</div></div></div>
      <a class="stat" href="#/review"><span class="si">${ic('cards', 20)}</span><div><div class="v">${due}</div><div class="l">flashcards due</div></div></a>
    </section>
    ${nx ? `<a class="cont tc" style="--h:${hueOf(nx.t.id)}" href="#/lesson/${nx.l.id}">${ring(lessonPct(nx.l), 52, 5)}<div class="tx"><div class="k">${nx.resume || nx.started ? 'Continue where you left off' : 'Up next'}</div><div class="tt">${esc(nx.l.title)}</div><div class="sub">${esc(nx.t.title)} · ${nx.l.minutes} min</div></div>${ic('arrow', 22)}</a>` : `<div class="cont tc" style="--h:150">${ic('trophy', 28)}<div class="tx"><div class="tt">Every lesson complete. Go run some mock interviews.</div></div></div>`}
    ${(() => { const ms = mockSummary(); return ms.weakest && ms.weakest.avg < 80 ? `<a class="cont tc" id="weak" style="--h:${MOCK_HUE[ms.weakest.kind] ?? 255};margin-top:12px" href="#/mock"><span class="si" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--panel2);color:var(--c)">${ic('target', 22)}</span><div class="tx"><div class="k">Weak spot from your mock interviews</div><div class="tt">${esc(ms.weakest.kind)} · ${ms.weakest.avg}% rubric coverage</div><div class="sub">${ms.weakest.n} attempt${ms.weakest.n === 1 ? '' : 's'}. Practice it again.</div></div>${ic('arrow', 22)}</a>` : ''; })()}
    <div class="sec-h"><h2>Tracks</h2><span>${total} lessons · ${Math.round(TRACKS.reduce((a, t) => a + trackMin(t), 0) / 60)} hours</span></div>
    <div class="tgrid">${TRACKS.map((t) => `
      <a class="tcard tc ${t.hot ? 'feat' : ''}" style="--h:${hueOf(t.id)}" href="#/track/${t.id}">
        <div class="row"><span class="ticon">${ic(t.id, 24)}</span>${ring(trackPct(t), 44, 4)}</div>
        <div class="bd"><h3>${esc(t.title)}</h3>
        <p>${esc(t.blurb)}</p></div>
        <div class="meta">${t.hot ? '<span class="chip hot">Neonomics focus</span>' : ''}<span class="chip">${t.lessons.length} lessons</span><span class="chip">${ic('clock', 12)} ${trackMin(t)} min</span></div>
      </a>`).join('')}</div>
    <div class="sec-h"><h2>Toolkit</h2></div>
    <div class="tools">
      <a class="tool" href="#/review"><span class="si">${ic('cards', 22)}</span><div><b>Flashcards</b><span>${CARDS.length} cards · spaced repetition</span></div></a>
      <a class="tool" href="#/mock"><span class="si">${ic('mic', 22)}</span><div><b>Mock interview</b><span>${MOCK.length} questions · timer · rubric</span></div></a>
      <a class="tool" href="#/resources"><span class="si">${ic('link', 22)}</span><div><b>Free resources</b><span>${RES.length} hand-picked links</span></div></a>
    </div>`;
  $('#heroSearch').onclick = openPalette;
  const wk = $('#weak'); if (wk) wk.onclick = () => store.set('mockkind', mockSummary().weakest.kind);
}

/* ---------- track ---------- */
function viewTrack(id) {
  const t = TRACKS.find((x) => x.id === id); if (!t) return viewHome();
  document.title = t.title + ' · Senior Interview Lab';
  const h = hueOf(t.id);
  app.innerHTML = `
    <div class="crumbs"><a href="#/">${ic('home', 14)} Tracks</a> ${ic('arrow', 12)} <span>${esc(t.title)}</span></div>
    <section class="thead tc brk" style="--h:${h}"><span class="ticon">${ic(t.id, 32)}</span><div style="flex:1"><h1>${esc(t.title)}</h1><p>${esc(t.blurb)}</p></div>${ring(trackPct(t), 64, 6)}</section>
    <div class="tl">${t.lessons.map((l, i) => {
      const p = lessonPct(l), ex = l.sections.filter((s) => s.type === 'code').length;
      return `<a class="lrow tc ${p === 100 ? 'done' : ''}" style="--h:${h}" href="#/lesson/${l.id}"><span class="n">${p === 100 ? ic('check', 18, 2.6) : i + 1}</span><span class="tx"><div class="tt">${esc(l.title)}</div><div class="sub">${esc(l.summary || '')}</div></span><span class="rt">${ex ? `<span class="chip">${ic('terminal', 12)} ${ex}</span>` : ''}<span>${l.minutes} min</span><span class="mini"><i style="width:${p}%"></i></span></span></a>`;
    }).join('')}</div>`;
}

/* ---------- lesson ---------- */
function secMeta(s, i) {
  if (s.type === 'quiz') { const q = strip(s.q); return { t: q.length > 44 ? q.slice(0, 44) + '…' : q, act: true }; }
  if (s.type === 'code' || s.type === 'bug' || s.type === 'predict') return { t: s.title, act: true };
  if (s.type === 'sim') return { t: s.title };
  if (s.type === 'steps') return { t: 'Walkthrough' };
  if (s.type === 'reveal') return { t: s.title.replace(/^[^\p{L}\p{N}“"(]+/u, '') };
  const m = /<h[23][^>]*>(.*?)<\/h[23]>/is.exec(s.html || '');
  if (m) return { t: strip(m[1]) };
  return i === 0 ? { t: 'Overview' } : null;
}
function viewLesson(id) {
  const f = findLesson(id); if (!f) return viewHome();
  const { t, l, i } = f, h = hueOf(t.id);
  document.title = l.title + ' · Senior Interview Lab';
  store.set('last', l.id);
  const ct = (...ty) => l.sections.filter((x) => ty.includes(x.type)).length;
  const nCode = ct('code', 'bug'), nQuiz = ct('quiz', 'predict'), nSim = ct('sim');
  const mode = store.get('lmode', 'all'), READ = ['text', 'reveal'];
  const cls = (x) => (READ.includes(x.type) ? 'read' : x.type === 'steps' ? 'both' : 'prac');
  VIM.eds = [];
  if (l.sections.some((x) => x.type === 'code' || x.type === 'predict') && mode !== 'read') warmPython();
  const metas = l.sections.map(secMeta);
  const outline = metas.map((m, k) => m && `<li class="${cls(l.sections[k])}"><button data-t="s${k}" class="${m.act ? 'act' : ''}"><span class="ck">${ic('check', 10, 3.4)}</span><span>${esc(m.t)}</span></button></li>`).filter(Boolean).join('');
  const nxt = t.lessons[i + 1];
  app.innerHTML = `
    <div class="lesson tc m-${mode}" style="--h:${h}">
      <aside class="outline"><p class="oh">In this lesson</p><ol>${outline}</ol><div class="sm"><b id="lpct">${lessonPct(l)}%</b> complete<br>${nQuiz} quick check${nQuiz === 1 ? '' : 's'}${nCode ? ` · ${nCode} challenge${nCode === 1 ? '' : 's'}` : ''}${nSim ? ` · ${nSim} simulation${nSim === 1 ? '' : 's'}` : ''}</div></aside>
      <article>
        <div class="crumbs"><a href="#/">${ic('home', 14)}</a> ${ic('arrow', 12)} <a href="#/track/${t.id}">${esc(t.title)}</a> ${ic('arrow', 12)} <span>Lesson ${i + 1}</span></div>
        <header class="lhead"><span class="chip tc" style="--h:${h}">${ic(t.id, 13)} ${esc(t.title)}</span><h1>${esc(l.title)}</h1><p class="sum">${esc(l.summary || '')}</p>
          <div class="metas"><span class="chip">${ic('clock', 12)} ${l.minutes} min</span>${nQuiz ? `<span class="chip">${ic('target', 12)} ${nQuiz} quick check${nQuiz === 1 ? '' : 's'}</span>` : ''}${nCode ? `<span class="chip">${ic('terminal', 12)} ${nCode} challenge${nCode === 1 ? '' : 's'}</span>` : ''}${nSim ? `<span class="chip">${ic('sim', 12)} ${nSim} simulation${nSim === 1 ? '' : 's'}</span>` : ''}</div>
          <div class="seg" role="group" aria-label="Lesson view"><button data-m="all" class="${mode === 'all' ? 'on' : ''}">text + practice</button><button data-m="read" class="${mode === 'read' ? 'on' : ''}">read</button><button data-m="practice" class="${mode === 'practice' ? 'on' : ''}">practice</button></div></header>
        <div class="lbody" id="body"></div>
        <div class="endcard tc brk" style="--h:${h}">${nxt ? `<div class="tx"><div class="k">Up next</div><div class="tt">${esc(nxt.title)}</div></div><a class="btn primary" href="#/lesson/${nxt.id}">Next lesson ${ic('arrow', 16)}</a>` : `<div class="tx"><div class="k">Track end</div><div class="tt">That's the last lesson in ${esc(t.title)}.</div></div><a class="btn primary" href="#/">Pick another track ${ic('arrow', 16)}</a>`}
          ${i > 0 ? `<a class="btn" href="#/lesson/${t.lessons[i - 1].id}">${ic('arrowL', 16)} Previous</a>` : ''}</div>
      </article>
    </div>`;
  const body = $('#body');
  const outBtns = {}; $$('.outline button').forEach((b) => (outBtns[b.dataset.t] = b));
  const sync = () => {
    $('#lpct').textContent = lessonPct(l) + '%';
    const p = progress[l.id] || {};
    l.sections.forEach((s, k) => { const b = outBtns['s' + k], key = keysOf(l)[k]; if (b && key) b.parentElement.classList.toggle('okk', !!p[key]); });
  };
  const disposers = [], redraws = [];
  l.sections.forEach((s, k) => {
    const el = document.createElement('section'); el.className = 'sec ' + cls(s); el.id = 's' + k; body.appendChild(el);
    const r = ({ text: rText, quiz: rQuiz, reveal: rReveal, steps: rSteps, code: rCode, bug: rBug, predict: rPredict, sim: rSim }[s.type] || rText)(el, s, l, k, sync, h, disposers);
    if (typeof r === 'function' && s.type === 'steps') redraws.push(r);
  });
  $$('.seg button').forEach((b) => (b.onclick = () => {
    const m = b.dataset.m; store.set('lmode', m);
    $('.lesson').className = 'lesson tc m-' + m; $$('.seg button').forEach((x) => x.classList.toggle('on', x === b));
    redraws.forEach((f) => f());
  }));
  if (!itemsOf(l).length) progress[l.id] = { ...(progress[l.id] || {}), read: true }, store.set('progress', progress);
  sync();
  $$('.outline button').forEach((b) => (b.onclick = () => document.getElementById(b.dataset.t).scrollIntoView({ behavior: 'smooth', block: 'start' })));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { Object.values(outBtns).forEach((b) => b.classList.remove('on')); outBtns[e.target.id] && outBtns[e.target.id].classList.add('on'); } }), { rootMargin: '-20% 0px -65% 0px' });
  $$('.sec', body).forEach((s) => io.observe(s));
  const onScroll = () => { const d = document.documentElement; $('#pbar i').style.width = Math.min(100, (scrollY / Math.max(1, d.scrollHeight - innerHeight)) * 100) + '%'; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  cleanup = () => { io.disconnect(); removeEventListener('scroll', onScroll); disposers.forEach((d) => d()); };
}
const label = (icn, txt) => `<div class="sec-label">${ic(icn, 14)} ${txt}</div>`;
function rText(el, s) { el.innerHTML = `<div class="html">${s.html}</div>`; }
function rReveal(el, s) { el.innerHTML = `<details><summary>${esc(s.title)}</summary><div class="html">${s.html}</div></details>`; }
function rQuiz(el, s, l, idx, sync) {
  const key = keysOf(l)[idx]; let done = false;
  el.innerHTML = `${label('target', 'Quick check')}<div class="quiz"><div class="q">${s.q}</div>${s.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="l">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}<div class="explain" hidden></div></div>`;
  const ex = $('.explain', el);
  if ((progress[l.id] || {})[key]) { /* already solved earlier: show the answer */
    const b = $(`.opt[data-i="${s.answer}"]`, el); b.classList.add('right'); $$('.opt', el).forEach((x) => (x.disabled = true)); ex.hidden = false; ex.classList.add('ok'); ex.innerHTML = s.explain; done = true;
  }
  $$('.opt', el).forEach((b) => (b.onclick = () => {
    if (done) return;
    if (+b.dataset.i === s.answer) {
      done = true; b.classList.add('right'); $$('.opt', el).forEach((x) => (x.disabled = true));
      ex.hidden = false; ex.classList.add('ok'); ex.innerHTML = s.explain;
      mark(l.id, key, 10, 'Nice one'); sync();
    } else { b.classList.add('wrong'); b.disabled = true; ex.hidden = false; ex.classList.remove('ok'); ex.textContent = 'Not quite. Think about the trade-off and try another option.'; }
  }));
}
function rSteps(el, s, l, idx, sync, hue) {
  let n = 0;
  const draw = () => {
    if (store.get('lmode', 'all') === 'read') {
      el.innerHTML = `<div class="html">${s.steps.map((x, i) => `<h3>${i + 1}. ${esc(x.title.replace(/^\d+\.\s*/, ''))}</h3>${x.html}`).join('')}</div>`; return;
    }
    el.innerHTML = `${label('route', 'Walkthrough')}<div class="stepper"><div class="dots">${s.steps.map((x, i) => `${i ? `<i class="${i <= n ? 'done' : ''}"></i>` : ''}<button class="${i === n ? 'on' : i < n ? 'done' : ''}" data-i="${i}" aria-label="Step ${i + 1}">${i + 1}</button>`).join('')}</div>
      <h3>${esc(s.steps[n].title)}</h3><div class="html">${s.steps[n].html}</div>
      <div class="nav"><button class="btn sm" id="pv" ${n === 0 ? 'disabled' : ''}>${ic('arrowL', 14)} Back</button><button id="nx" class="btn sm primary" ${n === s.steps.length - 1 ? 'disabled' : ''}>Next ${ic('arrow', 14)}</button></div></div>`;
    $$('.dots button', el).forEach((b) => (b.onclick = () => { n = +b.dataset.i; draw(); }));
    $('#pv', el).onclick = () => { n--; draw(); }; $('#nx', el).onclick = () => { n++; draw(); };
  };
  draw();
  return draw;
}

/* ---------- vim mode ---------- */
const VIM = { on: store.get('vim', false), eds: [] };
function applyVim() {
  if (window.CodeMirror && CodeMirror.Vim && !CodeMirror.Vim._silDefined) {
    CodeMirror.Vim.defineEx('run', 'run', (cm) => cm._run && cm._run());
    CodeMirror.Vim.defineEx('write', 'w', (cm) => cm._run && cm._run());
    CodeMirror.Vim._silDefined = true;
  }
  VIM.eds.forEach(({ cm, vb, vm, vh }) => {
    cm.setOption('keyMap', VIM.on ? 'vim' : 'default');
    cm.setOption('showCursorWhenSelecting', VIM.on);
    vb.textContent = VIM.on ? 'vim: on' : 'vim: off'; vb.classList.toggle('on', VIM.on); vh.hidden = !VIM.on;
    vm.textContent = VIM.on ? '-- NORMAL --' : '';
  });
}

/* ---------- code exercises ---------- */
/* Python runs in a persistent Pyodide web worker (CPython compiled to WebAssembly). The first run downloads the
   runtime (cached afterwards); an infinite loop is handled by terminating the worker, which restarts on the next run. */
const PY = { worker: null, ready: null, isReady: false, id: 0, pending: new Map() };
function pyStart() {
  if (PY.ready) return PY.ready;
  const w = new Worker('assets/pyworker.js'); PY.worker = w;
  PY.ready = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timed out loading')), 120000);
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'ready') { clearTimeout(t); PY.isReady = true; resolve(); }
      else if (m.type === 'init-error') { clearTimeout(t); reject(new Error(m.error)); }
      else if (m.type === 'result') { const done = PY.pending.get(m.id); if (done) { PY.pending.delete(m.id); done(m.data); } }
    };
    w.onerror = (e) => { clearTimeout(t); reject(new Error(e.message || 'worker error')); };
  });
  PY.ready.catch(() => pyKill());
  return PY.ready;
}
function pyKill() { if (PY.worker) PY.worker.terminate(); Object.assign(PY, { worker: null, ready: null, isReady: false }); PY.pending.clear(); }
const warmPython = () => setTimeout(() => pyStart().catch(() => {}), 800);
async function runPython(code, tests, { allowEmpty = false, onLoading } = {}) {
  if (!PY.isReady && onLoading) onLoading();
  try { await pyStart(); } catch (e) { pyKill(); return { fatal: "Couldn't load the Python runtime (" + e.message + '). It is fetched from a CDN on first use, so you need to be online.', results: [], logs: [] }; }
  const w = PY.worker, id = ++PY.id;
  return new Promise((resolve) => {
    const t = setTimeout(() => { pyKill(); resolve({ fatal: 'Timed out after 6s. Infinite loop or too slow? (The Python runtime restarts on the next run.)', results: [], logs: [] }); }, 6000);
    PY.pending.set(id, (data) => { clearTimeout(t); resolve(data); });
    w.postMessage({ id, code, tests, allowEmpty });
  });
}
const LOADING = '<div class="sumbar"><b>Loading the Python runtime…</b><span class="muted">first run only, about 10 MB, then it is cached</span></div>';
function rCode(el, s, l, idx, sync, hue) {
  const key = keysOf(l)[idx], dk = 'pydraft:' + l.id + ':' + key.slice(1), solved = () => !!(progress[l.id] || {})[key];
  el.innerHTML = `${label('terminal', 'Challenge')}<div class="ex tc brk">
    <div class="ex-head"><div class="ex-title">${esc(s.title)}</div><span class="chip st ${solved() ? 'good' : ''}">${solved() ? ic('check', 12, 3) + ' Solved' : 'Unsolved'}</span></div>
    <div class="ex-prompt">${s.prompt}</div>
    <div class="ex-win"><div class="ex-tab"><span class="tl3"><i></i><i></i><i></i></span><span class="file">solution.py</span><span class="sp"></span><span class="vmode"></span><button type="button" class="vimbtn" title="Toggle Vim keybindings">vim: off</button><span><kbd>Ctrl</kbd> <kbd>↵</kbd> run</span></div><div class="editor"></div><div class="vimhint" hidden>h j k l move · w b e words · 0 $ line · gg G file · i a o insert · x dd yy p edit · u undo · ciw · / search · <b>:run</b> or <b>:w</b> runs the tests</div></div>
    <div class="ex-actions"><button class="btn primary run">${ic('play', 15)} Run tests</button><button class="btn hint">${ic('bulb', 15)} Hint</button><button class="btn sol">${ic('eye', 15)} Solution</button><span class="sp"></span><button class="btn ghost reset">${ic('rotate', 15)} Reset</button></div>
    <div class="out" aria-live="polite"></div></div>`;
  const host = $('.editor', el), start = store.get(dk, s.starter);
  let get, set;
  if (window.CodeMirror) {
    const cm = CodeMirror(host, { value: start, mode: 'python', lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, viewportMargin: Infinity,
      extraKeys: { Tab: (c) => c.execCommand('insertSoftTab'), 'Ctrl-Enter': () => run(), 'Cmd-Enter': () => run() } });
    get = () => cm.getValue(); set = (v) => cm.setValue(v); cm.on('change', () => store.set(dk, cm.getValue()));
    cm._run = () => run();
    const vb = $('.vimbtn', el), vm = $('.vmode', el), vh = $('.vimhint', el);
    if (window.CodeMirror.Vim) {
      VIM.eds.push({ cm, vb, vm, vh });
      cm.on('vim-mode-change', (ev) => { vm.textContent = '-- ' + String(ev.mode).toUpperCase() + (ev.subMode ? ' ' + ev.subMode.toUpperCase() : '') + ' --'; });
      vb.onclick = () => { VIM.on = !VIM.on; store.set('vim', VIM.on); applyVim(); if (VIM.on) cm.focus(); };
    } else vb.hidden = true;
    applyVim();
  } else {
    const ta = document.createElement('textarea'); ta.value = start; ta.spellcheck = false; host.appendChild(ta);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });
    ta.addEventListener('input', () => store.set(dk, ta.value)); get = () => ta.value; set = (v) => { ta.value = v; store.set(dk, v); };
  }
  const out = $('.out', el), runBtn = $('.run', el);
  async function run() {
    runBtn.disabled = true; out.innerHTML = PY.isReady ? '<div class="sumbar"><b>Running…</b></div>' : LOADING;
    const r = await runPython(get(), s.tests, { onLoading: () => (out.innerHTML = LOADING) });
    runBtn.disabled = false;
    const pass = r.results.filter((x) => x.pass).length, all = r.results.length;
    let h = '';
    if (all && pass === all) h += `<div class="allpass">${ic('trophy', 20)} All ${all} tests pass</div>`;
    else if (all) h += `<div class="sumbar"><b>${pass}/${all} passing</b><span class="segs">${r.results.map((x) => `<i class="${x.pass ? 'p' : ''}"></i>`).join('')}</span></div>`;
    if (r.fatal) h += `<div class="res fail"><span class="ric">${ic('x', 15, 2.6)}</span><div class="nm">Error<small>${esc(r.fatal)}</small></div></div>`;
    h += r.results.map((x) => `<div class="res ${x.pass ? 'pass' : 'fail'}"><span class="ric">${ic(x.pass ? 'check' : 'x', 15, 2.6)}</span><div><span class="nm">${esc(x.name)}</span>${x.err ? `<small>${esc(x.err)}</small>` : ''}</div></div>`).join('');
    if (r.logs && r.logs.length) h += `<div class="logs">${esc(r.logs.join('\n'))}</div>`;
    out.innerHTML = h;
    if (all && pass === all) {
      const first = mark(l.id, key, 50, 'Challenge solved');
      const st = $('.st', el); st.className = 'chip st good'; st.innerHTML = ic('check', 12, 3) + ' Solved';
      if (first) { const b = runBtn.getBoundingClientRect(); confetti(b.left + b.width / 2, b.top, hue); }
      sync();
    }
  }
  runBtn.onclick = run;
  $('.hint', el).onclick = () => { out.innerHTML = `<div class="callout tip"><b>Hint.</b> ${s.hint || 'Start with the simplest failing test.'}</div>`; };
  $('.sol', el).onclick = () => { out.innerHTML = `<div class="callout warn"><b>Spoiler.</b> One reasonable solution, but try first.</div><pre><code>${esc(s.solution)}</code></pre>${s.notes ? `<div class="callout">${s.notes}</div>` : ''}`; };
  $('.reset', el).onclick = () => { if (confirm('Reset to starter code?')) { set(s.starter); out.innerHTML = ''; } };
}


/* ---------- simulation ---------- */
function rSim(el, s, l, idx, sync, hue, disposers) {
  el.innerHTML = `${label('sim', 'Simulation')}<div class="simbox tc brk"><div class="ex-head"><div class="ex-title">${esc(s.title)}</div></div>${s.intro ? `<div class="ex-prompt">${s.intro}</div>` : ''}<div class="simroot"></div>${s.try ? `<div class="trylist"><b>Try this</b><ul>${s.try.map((x) => `<li>${x}</li>`).join('')}</ul></div>` : ''}</div>`;
  const fn = window.SIMS && window.SIMS[s.id], root = $('.simroot', el);
  if (!fn) { root.innerHTML = '<p class="warn">Simulation failed to load.</p>'; return; }
  const dispose = fn(root); if (dispose) disposers.push(dispose);
}

/* ---------- find the bug ---------- */
function rBug(el, s, l, idx, sync, hue) {
  const key = keysOf(l)[idx], lines = s.code.split('\n'), sel = new Set(), solved = () => !!(progress[l.id] || {})[key];
  const bugLines = s.bugs.map((b) => b.line), okLines = s.ok || [];
  el.innerHTML = `${label('bug', 'Bug hunt')}<div class="ex bugbox tc brk">
    <div class="ex-head"><div class="ex-title">${esc(s.title)}</div><span class="chip st ${solved() ? 'good' : ''}">${solved() ? ic('check', 12, 3) + ' Found' : `${bugLines.length} bug${bugLines.length > 1 ? 's' : ''}`}</span></div>
    <div class="ex-prompt">${s.prompt}</div>
    <div class="bug-code" role="group" aria-label="Code. Click the lines that contain bugs.">${lines.map((t, i) => `<button type="button" class="bl" data-n="${i + 1}" aria-pressed="false"><span class="ln">${i + 1}</span><code>${esc(t) || ' '}</code></button>`).join('')}</div>
    <div class="ex-actions"><button class="btn primary bcheck">${ic('check', 15)} Check my answer</button><button class="btn hint">${ic('bulb', 15)} Hint</button><button class="btn show">${ic('eye', 15)} Show answer</button><span class="sp"></span><span class="selc muted"></span></div>
    <div class="out" aria-live="polite"></div></div>`;
  const out = $('.out', el), cnt = $('.selc', el);
  const paint = (n, cls) => { const b = $(`.bl[data-n="${n}"]`, el); if (b) b.classList.add(cls); };
  const explain = () => `<div class="bugwhy">${s.bugs.map((b) => `<div class="callout"><b>Line ${b.line}.</b> ${b.why}</div>`).join('')}${s.notes ? `<div class="callout tip">${s.notes}</div>` : ''}</div>`;
  const upd = () => { cnt.textContent = sel.size ? `${sel.size} line${sel.size > 1 ? 's' : ''} selected` : 'click lines to select'; }; upd();
  $$('.bl', el).forEach((b) => (b.onclick = () => {
    const n = +b.dataset.n; $$('.bl', el).forEach((x) => x.classList.remove('hit', 'miss', 'fp'));
    if (sel.has(n)) sel.delete(n); else sel.add(n);
    b.classList.toggle('sel', sel.has(n)); b.setAttribute('aria-pressed', sel.has(n)); upd();
  }));
  $('.bcheck', el).onclick = () => {
    if (!sel.size) { out.innerHTML = '<div class="callout warn">Select the lines you think are buggy first.</div>'; return; }
    $$('.bl', el).forEach((x) => x.classList.remove('hit', 'miss', 'fp'));
    const found = bugLines.filter((n) => sel.has(n)), missed = bugLines.filter((n) => !sel.has(n)), extra = [...sel].filter((n) => !bugLines.includes(n) && !okLines.includes(n));
    found.forEach((n) => paint(n, 'hit')); extra.forEach((n) => paint(n, 'fp'));
    if (!missed.length && !extra.length) {
      out.innerHTML = `<div class="allpass">${ic('trophy', 20)} Found ${bugLines.length === 1 ? 'the bug' : 'all ' + bugLines.length + ' bugs'}</div>${explain()}`;
      const first = mark(l.id, key, 30, 'Bug squashed');
      const st = $('.st', el); st.className = 'chip st good'; st.innerHTML = ic('check', 12, 3) + ' Found'; sync();
      if (first) { const r = $('.bcheck', el).getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, hue); }
    } else {
      out.innerHTML = `<div class="sumbar"><b>${found.length}/${bugLines.length} bugs found</b>${extra.length ? `<span class="chip hot">${extra.length} selected line${extra.length > 1 ? 's' : ''} ${extra.length > 1 ? 'are' : 'is'} not a bug</span>` : ''}</div><p class="muted">Green = real bug${found.length ? '' : ' (none yet)'}, struck-through = not a bug. Adjust your selection and check again, or ask for a hint.</p>`;
    }
  };
  $('.hint', el).onclick = () => { out.innerHTML = `<div class="callout tip"><b>Hint.</b> ${s.hint || 'Think about edge cases, concurrency, money, and security.'}</div>`; };
  $('.show', el).onclick = () => { $$('.bl', el).forEach((x) => x.classList.remove('hit', 'miss', 'fp')); bugLines.forEach((n) => paint(n, 'miss')); out.innerHTML = explain(); };
}

/* ---------- predict the output ---------- */
function rPredict(el, s, l, idx, sync) {
  const key = keysOf(l)[idx]; let done = false;
  el.innerHTML = `${label('bulb', 'Predict the output')}<div class="quiz"><div class="ex-title" style="margin-bottom:8px">${esc(s.title)}</div>${s.intro ? `<div class="ex-prompt" style="padding:0 0 8px">${s.intro}</div>` : ''}
    <pre><code>${esc(s.code)}</code></pre><div class="q" style="margin-top:14px">${s.question}</div>
    ${s.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="l">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}
    <div class="explain" hidden></div>
    <div class="ex-actions" style="padding:12px 0 0"><button class="btn run">${ic('play', 15)} Run it for real</button><span class="muted">executes the snippet in the sandbox and shows its actual output</span></div><div class="out" style="padding:0"></div></div>`;
  const ex = $('.explain', el), out = $('.out', el);
  const finish = (b) => { done = true; if (b) b.classList.add('right'); $$('.opt', el).forEach((x) => (x.disabled = true)); ex.hidden = false; ex.classList.add('ok'); ex.innerHTML = s.explain; };
  if ((progress[l.id] || {})[key]) finish($(`.opt[data-i="${s.answer}"]`, el));
  $$('.opt', el).forEach((b) => (b.onclick = () => {
    if (done) return;
    if (+b.dataset.i === s.answer) { finish(b); mark(l.id, key, 15, 'Called it'); sync(); }
    else { b.classList.add('wrong'); b.disabled = true; ex.hidden = false; ex.classList.remove('ok'); ex.textContent = 'Not that one. Trace it step by step, or run it to see.'; }
  }));
  $('.run', el).onclick = async () => {
    out.innerHTML = PY.isReady ? '<div class="sumbar"><b>Running…</b></div>' : LOADING;
    const r = await runPython(s.code, '', { allowEmpty: true });
    out.innerHTML = r.fatal ? `<div class="res fail"><div class="nm">Error<small>${esc(r.fatal)}</small></div></div>` : `<div class="logs actual">${esc((r.logs || []).join('\n') || '(no output)')}</div>`;
  };
}

/* ---------- flashcards ---------- */
const BOX_DAYS = [0, 1, 3, 7, 21, 60];
const cid = (c) => { let h = 0; for (const ch of c.q) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'c' + (h >>> 0).toString(36); };
let cardState = store.get('cards', {});
const dueCards = (track) => CARDS.filter((c) => (!track || c.track === track) && (!cardState[cid(c)] || cardState[cid(c)].due <= Date.now()));
const trackHue = (name) => ({ Playbook: 255, Design: 150, Reliability: 28, Kafka: 275, AWS: 215, Terraform: 262, AI: 320, 'Open Banking': 44 }[name] ?? hueOf(name));
function viewReview() {
  document.title = 'Flashcards · Senior Interview Lab';
  let filter = '', deck = [], cur = 0, flipped = false, total = 0;
  const tracks = [...new Set(CARDS.map((c) => c.track))];
  const build = (all) => { deck = (all ? CARDS.filter((c) => !filter || c.track === filter) : dueCards(filter)).sort(() => Math.random() - 0.5); total = deck.length; cur = 0; flipped = false; draw(); };
  const draw = () => {
    const filters = `<div class="filters"><button class="fchip ${!filter ? 'on' : ''}" data-f="">All</button>${tracks.map((t) => `<button class="fchip ${filter === t ? 'on' : ''}" data-f="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    let body;
    if (cur >= deck.length) body = `<div class="empty deck"><div class="big">${ic('trophy', 30)}</div><h2 style="margin:0 0 6px">${total ? 'Deck complete' : 'Nothing due'}${filter ? ' · ' + esc(filter) : ''}</h2><p style="color:var(--muted);margin:0 0 18px">${total ? `You reviewed ${total} card${total === 1 ? '' : 's'}. Cards you missed come back sooner.` : 'Come back tomorrow, or run a mock interview.'}</p><button class="btn" id="again">${ic('rotate', 16)} Review everything anyway</button> <a class="btn primary" href="#/mock">${ic('mic', 16)} Mock interview</a></div>`;
    else {
      const c = deck[cur], h = trackHue(c.track);
      body = `<div class="deck tc" style="--h:${h}"><div class="pgl"><span>Card ${Math.min(cur + 1, total)} of ${total}</span><span>${deck.length - cur} left</span></div><div class="pg"><i style="width:${(cur / Math.max(1, total)) * 100}%"></i></div>
        <div class="fc-wrap"><div class="fc ${flipped ? 'flipped' : ''}" id="fc" tabindex="0" role="button" aria-label="Flip card"><div class="face front"><span class="chip tc tagl" style="--h:${h}">${esc(c.track)}</span><div class="qq">${c.q}</div><div class="hint">Click or press <kbd>Space</kbd> to reveal</div></div><div class="face back"><span class="chip tc tagl" style="--h:${h}">Answer</span><div class="aa">${c.a}</div></div></div></div>
        <div class="rate" ${flipped ? '' : 'hidden'}><button class="r0" data-r="0">Again<small>1 · soon</small></button><button class="r1" data-r="1">Hard<small>2 · 1 day</small></button><button class="r2" data-r="2">Good<small>3 · days</small></button><button class="r3" data-r="3">Easy<small>4 · weeks</small></button></div></div>`;
    }
    app.innerHTML = `<div class="page-h"><h1>Flashcards</h1><p>Say the answer out loud before flipping. Cards you miss come back sooner.</p></div>${filters}${body}`;
    $$('.fchip').forEach((b) => (b.onclick = () => { filter = b.dataset.f; build(false); }));
    const fc = $('#fc'); if (fc) { fc.onclick = flip; fc.onkeydown = (e) => { if (e.key === 'Enter') flip(); }; }
    $$('.rate button').forEach((b) => (b.onclick = () => rate(+b.dataset.r)));
    const ag = $('#again'); if (ag) ag.onclick = () => build(true);
  };
  const flip = () => { if (cur >= deck.length) return; flipped = !flipped; $('#fc').classList.toggle('flipped', flipped); $('.rate').hidden = !flipped; };
  const rate = (r) => {
    const c = deck[cur], id = cid(c), st = cardState[id] || { box: 0 };
    st.box = r === 0 ? 0 : r === 1 ? Math.max(1, st.box) : Math.min(BOX_DAYS.length - 1, st.box + (r === 3 ? 2 : 1));
    st.due = Date.now() + (r === 0 ? 5 * 60e3 : BOX_DAYS[st.box] * 864e5);
    cardState[id] = st; store.set('cards', cardState);
    xp += 2; store.set('xp', xp); touchDay(); renderXp();
    if (r === 0) deck.push(c);
    cur++; flipped = false; draw();
  };
  const key = (e) => {
    if (e.target.matches('input,textarea') || $('#cmdk') && !$('#cmdk').hidden) return;
    if (e.code === 'Space') { e.preventDefault(); flip(); }
    else if (flipped && '1234'.includes(e.key) && e.key) rate(+e.key - 1);
  };
  addEventListener('keydown', key); cleanup = () => removeEventListener('keydown', key);
  build(false);
}

/* ---------- mock interview ---------- */
const mockHist = () => store.get('mockhist', []);
function mockSummary() {
  const h = mockHist(), by = {};
  h.forEach((a) => { const b = (by[a.kind] = by[a.kind] || { n: 0, sum: 0 }); b.n++; b.sum += a.total ? a.hit / a.total : 0; });
  Object.values(by).forEach((b) => (b.avg = Math.round((b.sum / b.n) * 100)));
  const w = Object.entries(by).sort((x, y) => x[1].avg - y[1].avg)[0];
  const avg = h.length ? Math.round((h.reduce((s, a) => s + (a.total ? a.hit / a.total : 0), 0) / h.length) * 100) : 0;
  return { h, by, seen: new Set(h.map((a) => a.id)), avg, weakest: w && { kind: w[0], n: w[1].n, avg: w[1].avg } };
}
const ago = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
const MOCK_HUE = { Behavioral: 255, 'System Design': 150, 'Neonomics / Open Banking': 44, 'Scale & Cloud': 215, 'AI Era': 320 };
function viewMock() {
  document.title = 'Mock interview · Senior Interview Lab';
  let kind = store.get('mockkind', ''), q = null, t0 = 0, iv = null, secs = 0, rec = null;
  store.set('mockkind', '');
  const kinds = [...new Set(MOCK.map((m) => m.kind))];
  const kh = (k) => MOCK_HUE[k] ?? hueOf(k);
  const fmtT = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const renderStats = () => {
    const el = $('#mstats'); if (!el) return;
    const s = mockSummary(); if (!s.h.length) { el.innerHTML = ''; return; }
    const weak = s.weakest && s.weakest.avg < 80 ? s.weakest : null;
    el.innerHTML = `<div class="mst"><div class="mst-top">
        <div><b>${s.h.length}</b><span>attempts</span></div><div><b>${s.avg}%</b><span>avg rubric coverage</span></div><div><b>${s.seen.size}/${MOCK.length}</b><span>questions tried</span></div>
        ${weak ? `<button class="btn sm primary" id="pw">${ic('target', 14)} Practice weakest: ${esc(weak.kind)}</button>` : ''}</div>
      <div class="mrows">${kinds.map((k) => { const b = s.by[k]; return `<div class="mrow tc" style="--h:${kh(k)}"><span class="mk">${esc(k)}</span><span class="mbar"><i style="width:${b ? b.avg : 0}%"></i></span><span class="mv">${b ? `${b.avg}% · ${b.n}×` : 'not tried'}</span></div>`; }).join('')}</div>
      <details><summary>Recent attempts</summary>${s.h.slice(-6).reverse().map((a) => { const m = MOCK.find((x) => cid(x) === a.id); return `<div class="mhist"><span class="chip">${a.hit}/${a.total}</span><span class="mq">${esc(m ? strip(m.q) : 'Question')}</span><span class="mt">${ago(a.ts)}</span></div>`; }).join('')}</details></div>`;
    const pw = $('#pw'); if (pw) pw.onclick = () => { kind = weak.kind; pick(); };
  };
  const draw = () => {
    app.innerHTML = `<div class="mock"><div class="page-h"><h1>Mock interview</h1><p>Pick a type, answer out loud (or jot bullets), then check yourself against the rubric. Think aloud, state assumptions, name trade-offs. Your results are saved on this device.</p></div>
      <div id="mstats"></div>
      <div class="filters"><button class="fchip ${!kind ? 'on' : ''}" data-k="">Any</button>${kinds.map((k) => `<button class="fchip ${kind === k ? 'on' : ''}" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>
      ${q ? `<div class="qcard tc brk" style="--h:${kh(q.kind)}"><span class="chip tc">${esc(q.kind)}</span> <span class="chip">${ic('clock', 12)} suggested ${q.minutes} min</span>
        <div class="qq">${q.q}</div>
        <div class="timer"><span class="tm" id="tm">00:00</span><span class="tb" id="tb"><i style="width:0"></i></span></div>
        <textarea class="notes" placeholder="Your notes: assumptions, structure, trade-offs…"></textarea>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button id="done" class="btn primary">${ic('check', 16)} I'm done: show rubric</button><button id="skip" class="btn">${ic('rotate', 16)} Another question</button></div>
        <div id="rub"></div></div>` : `<div class="empty"><div class="big">${ic('mic', 30)}</div><h2 style="margin:0 0 6px">Ready when you are</h2><p style="color:var(--muted);margin:0 0 18px">You'll get a random question (unseen ones first) and a timer.</p><button class="btn primary" id="go">${ic('play', 16)} Give me a question</button></div>`}</div>`;
    renderStats();
    $$('.fchip').forEach((b) => (b.onclick = () => { kind = b.dataset.k; pick(); }));
    const go = $('#go'); if (go) go.onclick = pick;
    const sk = $('#skip'); if (sk) sk.onclick = pick;
    const dn = $('#done'); if (dn) dn.onclick = showRubric;
    if (q) tick();
  };
  const showRubric = () => {
    clearInterval(iv);
    if (!rec) {
      rec = { id: cid(q), kind: q.kind, ts: Date.now(), secs, hit: 0, total: q.rubric.length };
      const all = mockHist(); all.push(rec); store.set('mockhist', all.slice(-200));
      addXp(15, 'Mock interview done'); renderStats();
    }
    const rev = (q.lessons || []).map((id) => findLesson(id)).filter(Boolean);
    $('#rub').innerHTML = `<h3>A strong answer covers</h3><p style="color:var(--muted);margin:0 0 6px;font-size:.9rem">Tick what you covered. Took ${fmtT(secs)}. <span id="cov"></span></p><ul class="rubric">${q.rubric.map((r) => `<li><span class="cb">${ic('check', 12, 3.4)}</span><span>${r}</span></li>`).join('')}</ul>
      ${rev.length ? `<div class="revisit"><span>Revisit what you missed:</span>${rev.map((f) => `<a class="chip tc" style="--h:${hueOf(f.t.id)}" href="#/lesson/${f.l.id}">${ic(f.t.id, 12)} ${esc(f.l.title)}</a>`).join('')}</div>` : ''}`;
    $$('.rubric li').forEach((li) => (li.onclick = () => {
      li.classList.toggle('hit');
      const n = $$('.rubric li.hit').length, all = mockHist(), r = all.find((a) => a.ts === rec.ts);
      if (r) { r.hit = n; store.set('mockhist', all); rec.hit = n; }
      $('#cov').textContent = `Covered ${n}/${q.rubric.length}.`; renderStats();
    }));
  };
  const tick = () => { clearInterval(iv); iv = setInterval(() => { secs = Math.floor((Date.now() - t0) / 1000); const tm = $('#tm'); if (!tm) return; tm.textContent = fmtT(secs); const pct = Math.min(100, (secs / (q.minutes * 60)) * 100), tb = $('#tb'); tb.firstChild.style.width = pct + '%'; tb.classList.toggle('over', secs > q.minutes * 60); }, 500); };
  const pick = () => {
    const pool = MOCK.filter((m) => !kind || m.kind === kind), seen = mockSummary().seen, fresh = pool.filter((m) => !seen.has(cid(m))), src = fresh.length ? fresh : pool;
    let n; do { n = src[Math.floor(Math.random() * src.length)]; } while (src.length > 1 && n === q);
    q = n; t0 = Date.now(); secs = 0; rec = null; draw();
  };
  cleanup = () => clearInterval(iv);
  draw();
}

/* ---------- resources ---------- */
const catIcon = (c) => ({ 'Neonomics & Open Banking': 'openbanking', 'System Design': 'design', Kafka: 'route', AWS: 'cloud', Terraform: 'cloud', 'Coding Practice': 'coding', 'AI Engineering': 'ai', 'Security & Career': 'reliability' }[c] || 'book');
const catHue = (c) => ({ 'Neonomics & Open Banking': 44, 'System Design': 150, Kafka: 275, AWS: 215, Terraform: 262, 'Coding Practice': 190, 'AI Engineering': 320, 'Security & Career': 28 }[c] ?? hueOf(c));
function viewResources() {
  document.title = 'Free resources · Senior Interview Lab';
  const cats = [...new Set(RES.map((r) => r.cat))]; let f = '';
  const draw = () => {
    app.innerHTML = `<div class="page-h"><h1>Free resources</h1><p>Hand-picked, openly readable material. Links open in a new tab.</p></div>
      <div class="filters"><button class="fchip ${!f ? 'on' : ''}" data-c="">All · ${RES.length}</button>${cats.map((c) => `<button class="fchip ${f === c ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="rgrid">${RES.filter((r) => !f || r.cat === f).map((r) => `<a class="rcard tc" style="--h:${catHue(r.cat)}" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="chip tc" style="align-self:flex-start">${ic(catIcon(r.cat), 12)} ${esc(r.cat)}</span><h3><span>${esc(r.title)}</span>${ic('link', 15)}</h3><p>${esc(r.note)}</p></a>`).join('')}</div>`;
    $$('.fchip').forEach((b) => (b.onclick = () => { f = b.dataset.c; draw(); }));
  };
  draw();
}

/* ---------- command palette ---------- */
let index = null, palSel = 0, palItems = [];
function buildIndex() {
  index = [];
  TRACKS.forEach((t) => {
    index.push({ kind: 'Track', icon: t.id, hue: hueOf(t.id), title: t.title, sub: t.blurb, href: '#/track/' + t.id, text: (t.title + ' ' + t.blurb).toLowerCase() });
    t.lessons.forEach((l) => index.push({ kind: 'Lesson', icon: t.id, hue: hueOf(t.id), title: l.title, sub: t.title + ' · ' + (l.summary || ''), href: '#/lesson/' + l.id,
      text: (l.title + ' ' + (l.summary || '') + ' ' + l.sections.map((s) => strip((s.html || '') + ' ' + (s.q || '') + ' ' + (s.prompt || '') + ' ' + (s.question || '') + ' ' + (s.intro || '') + ' ' + (s.title || '') + ' ' + (s.steps ? s.steps.map((x) => x.title + ' ' + x.html).join(' ') : ''))).join(' ')).toLowerCase() }));
  });
  CARDS.forEach((c) => index.push({ kind: 'Flashcard', icon: 'cards', hue: trackHue(c.track), title: strip(c.q), sub: strip(c.a).slice(0, 120), href: '#/review', text: (strip(c.q) + ' ' + strip(c.a)).toLowerCase() }));
  MOCK.forEach((m) => index.push({ kind: 'Mock', icon: 'mic', hue: 255, title: strip(m.q), sub: m.kind, href: '#/mock', text: (strip(m.q) + ' ' + m.rubric.join(' ')).toLowerCase() }));
  RES.forEach((r) => index.push({ kind: 'Resource', icon: 'link', hue: catHue(r.cat), title: r.title, sub: r.note, href: r.url, ext: true, text: (r.title + ' ' + r.note + ' ' + r.cat).toLowerCase() }));
}
const QUICK = () => [
  { kind: 'Go to', icon: 'home', title: 'Learn', sub: 'All tracks', href: '#/' }, { kind: 'Go to', icon: 'cards', title: 'Flashcards', sub: 'Spaced repetition', href: '#/review' },
  { kind: 'Go to', icon: 'mic', title: 'Mock interview', sub: 'Random question + timer', href: '#/mock' }, { kind: 'Go to', icon: 'link', title: 'Free resources', sub: 'Curated links', href: '#/resources' },
  ...TRACKS.map((t) => ({ kind: 'Tracks', icon: t.id, hue: hueOf(t.id), title: t.title, sub: `${t.lessons.length} lessons`, href: '#/track/' + t.id })),
];
function openPalette() { $('#cmdk').hidden = false; $('#cq').value = ''; renderPal(); $('#cq').focus(); }
function closePalette() { $('#cmdk').hidden = true; }
function renderPal() {
  if (!index) buildIndex();
  const terms = $('#cq').value.toLowerCase().split(/\s+/).filter(Boolean);
  palItems = terms.length
    ? index.map((d) => ({ d, score: terms.reduce((a, t) => a + (d.title.toLowerCase().includes(t) ? 6 : 0) + (d.text.includes(t) ? 1 : -100), 0) + (d.kind === 'Lesson' ? 1 : 0) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 30).map((x) => x.d)
    : QUICK();
  palSel = 0;
  let lastKind = '', h = '';
  palItems.forEach((d, i) => {
    if (d.kind !== lastKind) { h += `<div class="cg">${esc(d.kind)}</div>`; lastKind = d.kind; }
    h += `<a class="ci tc ${i === 0 ? 'sel' : ''}" style="--h:${d.hue ?? 255}" data-i="${i}" href="${esc(d.href)}" ${d.ext ? 'target="_blank" rel="noopener"' : ''}><span class="cic">${ic(d.icon, 16)}</span><span class="ct"><b>${esc(d.title)}</b><small>${esc(d.sub || '')}</small></span></a>`;
  });
  $('#cres').innerHTML = h || '<div class="cnone">No results. Try another word.</div>';
  $$('#cres .ci').forEach((a) => { a.onclick = () => closePalette(); a.onmousemove = () => selPal(+a.dataset.i); });
}
function selPal(i) {
  const els = $$('#cres .ci'); if (!els.length) return;
  palSel = (i + els.length) % els.length;
  els.forEach((e, k) => e.classList.toggle('sel', k === palSel)); els[palSel].scrollIntoView({ block: 'nearest' });
}
$('#searchBtn').onclick = openPalette;
$('#cq').addEventListener('input', renderPal);
$('#cmdk').addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closePalette(); });
addEventListener('keydown', (e) => {
  const open = !$('#cmdk').hidden;
  if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !open && !e.target.matches('input,textarea,.CodeMirror *'))) { e.preventDefault(); open ? closePalette() : openPalette(); return; }
  if (!open) return;
  if (e.key === 'Escape') closePalette();
  else if (e.key === 'ArrowDown') { e.preventDefault(); selPal(palSel + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); selPal(palSel - 1); }
  else if (e.key === 'Enter') { const a = $$('#cres .ci')[palSel]; if (a) { e.preventDefault(); a.click(); } }
});

/* ---------- reset all local data ---------- */
$('#wipe').onclick = () => {
  let keys = [];
  try { keys = Object.keys(localStorage).filter((k) => k.startsWith('sil:')); } catch {}
  if (!keys.length) { alert('Nothing stored on this device. Nothing to reset.'); return; }
  const done = TRACKS.reduce((a, t) => a + t.lessons.filter((l) => lessonPct(l) === 100).length, 0);
  const drafts = keys.filter((k) => k.startsWith('sil:pydraft:')).length;
  const msg = `Reset ALL progress on this device?\n\n` +
    `  - ${done} completed lessons (and partial progress)\n  - ${xp} XP, level ${level()}, ${streak()}-day streak\n` +
    `  - ${Object.keys(cardState).length} scheduled flashcards\n  - ${mockHist().length} mock interview attempts\n` +
    `  - ${drafts} saved code drafts\n  - theme preference\n\nThis cannot be undone.`;
  if (!confirm(msg)) return;
  try { keys.forEach((k) => localStorage.removeItem(k)); } catch {}
  location.hash = '#/'; location.reload();
};

renderXp();
route();
})();
