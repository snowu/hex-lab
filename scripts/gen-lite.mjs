// Generates lite/: a static, script-free copy of the lessons, flashcards, mock questions and links for browsers
// that cannot run the app (the Kindle / e-ink browsers: old WebKit, no modern JS). index.html sends those
// browsers here. Quiz answers sit in an answer key at the bottom of each page (no <details>, no JS needed).
//   node scripts/gen-lite.mjs           regenerate lite/
//   node scripts/gen-lite.mjs --check   CI: fail if lite/ is out of date with content/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'lite');
const check = process.argv.includes('--check');

const ctx = vm.createContext({ console, TRACKS: [] });
ctx.self = ctx; ctx.window = ctx;
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of indexHtml.matchAll(/<script src="(content\/[^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
const { TRACKS, CARDS = [], MOCK = [], RESOURCES = [] } = vm.runInContext('({TRACKS, CARDS: window.CARDS||[], MOCK: window.MOCK||[], RESOURCES: window.RESOURCES||[]})', ctx);
createRequire(import.meta.url)('../assets/lesson-time.js').apply(TRACKS);

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const L = 'ABCDEFGH';
const lessonIds = new Set(TRACKS.flatMap((t) => t.lessons.map((l) => l.id)));
/* Content HTML links into the app router (#/lesson/x, #/katas...): point lessons at their lite page, everything else at the full app. */
const fix = (html) => String(html == null ? '' : html).replace(/href="#\/([^"]*)"/g, (m, r) => {
  const lm = /^lesson\/([\w-]+)$/.exec(r);
  if (lm && lessonIds.has(lm[1])) return `href="${lm[1]}.html"`;
  const tm = /^track\/([\w-]+)$/.exec(r);
  if (tm) return `href="index.html#${tm[1]}"`;
  return `href="../index.html?full#/${r}"`;
});
const isGame = (x) => x.domain === 'gamedev';

const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Hex Lab lite</title>
<link rel="stylesheet" href="lite.css">
</head>
<body>
<p class="top"><a href="index.html">Hex Lab lite</a> · <a href="cards.html">cards</a> · <a href="mock.html">mock</a> · <a href="links.html">links</a> · <a href="../index.html?full">full app</a></p>
${body}
<p class="foot">Lite version for e-readers and older browsers: read-only, nothing is saved. Code challenges, simulations and progress tracking need the <a href="../index.html?full">full app</a>.</p>
</body>
</html>
`;

/* Answer-key machinery: each question links down to its answer and back. */
function keyed() {
  const key = [];
  const add = (label, html) => { const n = key.length + 1; key.push(`<div class="ans" id="a${n}"><p><b>${n}. ${esc(label)}</b> <a href="#q${n}">back ↑</a></p>${html}</div>`); return n; };
  const link = (n) => `<p class="tolink" id="q${n}"><a href="#a${n}">answer ${n} ↓</a></p>`;
  const render = () => (key.length ? `<h2 id="key">Answer key</h2>${key.join('\n')}` : '');
  return { add, link, render };
}
const opts = (o) => `<ol class="opts">${o.map((x, i) => `<li><b>${L[i]}.</b> ${fix(x)}</li>`).join('')}</ol>`;
const choice = (k, label, s) => `${opts(s.options)}${k.link(k.add(label, `<p><b>${L[s.answer]}.</b> ${fix(s.options[s.answer])}</p>${s.explain ? `<div>${fix(s.explain)}</div>` : ''}`))}`;
const pre = (code) => `<pre>${esc(code)}</pre>`;

function section(s, k) {
  switch (s.type) {
    case 'text': return fix(s.html);
    case 'reveal': return `<h3>${esc(s.title)}</h3>${fix(s.html)}`;
    case 'steps': return s.steps.map((x, i) => `<h3>${i + 1}. ${esc(x.title.replace(/^\d+\.\s*/, ''))}</h3>${fix(x.html)}`).join('\n');
    case 'quiz': return `<div class="box"><p class="kind">Quick check</p><div class="q">${fix(s.q)}</div>${choice(k, 'Quick check', s)}</div>`;
    case 'predict': return `<div class="box"><p class="kind">Predict the output: ${esc(s.title)}</p>${fix(s.intro)}${pre(s.code)}<div class="q">${fix(s.question)}</div>${choice(k, s.title, s)}</div>`;
    case 'code': {
      const isSql = s.kind === 'sql' || s.kind === 'ddl';
      const ans = `${s.hint ? `<p><b>Hint:</b> ${fix(s.hint)}</p>` : ''}${s.solution ? `<p><b>Reference solution:</b></p>${pre(s.solution)}` : ''}${s.notes ? `<p>${fix(s.notes)}</p>` : ''}`;
      return `<div class="box"><p class="kind">Challenge (${isSql ? 'SQL' : 'Python'}): ${esc(s.title)}</p>${fix(s.prompt)}${isSql && s.schema ? `<p><b>Schema:</b></p>${pre(s.schema)}` : ''}${s.starter ? `<p><b>Starter:</b></p>${pre(s.starter)}` : ''}${ans ? k.link(k.add(s.title, ans)) : ''}<p class="note">Running and testing your code needs the full app.</p></div>`;
    }
    case 'drill': {
      const langs = ['zig', 'cpp', 'c'].filter((x) => s[x] && s[x].starter);
      const ans = `${s.hint ? `<p><b>Hint:</b> ${fix(s.hint)}</p>` : ''}${s.notes ? `<p>${fix(s.notes)}</p>` : ''}`;
      return `<div class="box"><p class="kind">Drill: ${esc(s.title)}</p>${fix(s.prompt)}${langs.length ? `<p><b>Starter (${{ zig: 'Zig', cpp: 'C++', c: 'C' }[langs[0]]}):</b></p>${pre(s[langs[0]].starter)}` : ''}${ans ? k.link(k.add(s.title, ans)) : ''}<p class="note">Drills compile on a computer: open the full app for every language and the tests.</p></div>`;
    }
    case 'bug': {
      const lines = s.code.split('\n').map((t, i) => `${String(i + 1).padStart(String(s.code.split('\n').length).length)}  ${t}`).join('\n');
      const ans = `${s.hint ? `<p><b>Hint:</b> ${fix(s.hint)}</p>` : ''}<ul>${s.bugs.map((b) => `<li><b>Line ${b.line}:</b> ${fix(b.why)}</li>`).join('')}</ul>`;
      return `<div class="box"><p class="kind">Bug hunt: ${esc(s.title)}</p>${fix(s.prompt)}${pre(lines)}<p>${s.bugs.length} buggy line${s.bugs.length > 1 ? 's' : ''}. Find them, then check.</p>${k.link(k.add(s.title, ans))}</div>`;
    }
    case 'sim': return `<div class="box"><p class="kind">Simulation: ${esc(s.title)}</p>${fix(s.intro)}${s.try ? `<p><b>Try this in the full app:</b></p><ul>${s.try.map((x) => `<li>${fix(x)}</li>`).join('')}</ul>` : ''}<p class="note">Interactive: needs the full app.</p></div>`;
    default: return fix(s.html);
  }
}

const files = new Map();
const tracksOf = (game) => TRACKS.filter((t) => isGame(t) === game);

for (const t of TRACKS) t.lessons.forEach((l, i) => {
  const k = keyed();
  const prev = t.lessons[i - 1], next = t.lessons[i + 1];
  const nav = `<p class="nav">${prev ? `<a href="${prev.id}.html">← ${esc(prev.title)}</a>` : ''}${prev && next ? ' · ' : ''}${next ? `<a href="${next.id}.html">${esc(next.title)} →</a>` : ''}</p>`;
  const body = l.sections.map((s) => `<div class="sec">${section(s, k)}</div>`).join('\n'); // before checks: answer numbers follow reading order
  const checks = (l.checks || []).map((c, j) => `<div class="box"><div class="q">${j + 1}. ${fix(c.q)}</div>${choice(k, 'Check ' + (j + 1), c)}</div>`).join('\n');
  files.set(l.id + '.html', page(l.title, `<p class="crumb"><a href="index.html#${t.id}">${esc(t.title)}</a> · lesson ${i + 1} of ${t.lessons.length} · ${l.minutes} min</p>
<h1>${esc(l.title)}</h1>
${l.summary ? `<p class="sum">${esc(l.summary)}</p>` : ''}
${body}
${checks ? `<h2>Check your understanding</h2>\n${checks}` : ''}
${nav}
${k.render()}
${nav}`));
});

const trackList = (game) => tracksOf(game).map((t) => `<h3 id="${t.id}">${esc(t.title)}</h3>
<p>${esc(t.blurb || '')}</p>
<ol>${t.lessons.map((l) => `<li><a href="${l.id}.html">${esc(l.title)}</a> <span class="muted">${l.minutes} min</span></li>`).join('')}</ol>`).join('\n');
files.set('index.html', page('Lessons', `<h1>Hex Lab lite</h1>
<p>Every lesson as plain text: readable on a Kindle or any older browser. Questions link to an answer key at the bottom of each page.</p>
<p><a href="#interview">Interview prep</a> · <a href="#gamedev">Game dev</a></p>
<h2 id="interview">Interview prep</h2>
${trackList(false)}
<h2 id="gamedev">Game dev</h2>
${trackList(true)}`));

{
  const k = keyed(), groups = new Map();
  for (const c of CARDS) { const g = (isGame(c) ? 'Game dev: ' : '') + (c.track || 'Other'); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(c); }
  files.set('cards.html', page('Flashcards', `<h1>Flashcards</h1>
${[...groups].map(([g, cs]) => `<h2>${esc(g)}</h2>\n${cs.map((c) => `<div class="box"><div class="q">${fix(c.q)}</div>${k.link(k.add('Card', `<div class="q">${fix(c.q)}</div><div>${fix(c.a)}</div>`))}</div>`).join('\n')}`).join('\n')}
${k.render()}`));
}
files.set('mock.html', page('Mock interview', `<h1>Mock interview questions</h1>
<p>Answer out loud against the clock, then score yourself on the rubric.</p>
${MOCK.map((m, i) => `<div class="box"><p class="kind">${esc(m.kind)} · ${m.minutes} min</p><div class="q">${i + 1}. ${fix(m.q)}</div>${m.rubric ? `<p><b>A strong answer covers:</b></p><ul>${m.rubric.map((r) => `<li>${fix(r)}</li>`).join('')}</ul>` : ''}</div>`).join('\n')}`));
{
  const groups = new Map();
  for (const r of RESOURCES) { const g = (isGame(r) ? 'Game dev: ' : '') + (r.cat || 'Other'); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r); }
  files.set('links.html', page('Links', `<h1>Links</h1>
${[...groups].map(([g, rs]) => `<h2>${esc(g)}</h2>\n<ul>${rs.map((r) => `<li><a href="${esc(r.url)}">${esc(r.title)}</a>${r.note ? `: ${fix(r.note)}` : ''}</li>`).join('')}</ul>`).join('\n')}`));
}
/* Plain CSS a 2010 WebKit understands: black on white, no flexbox/grid/variables. */
files.set('lite.css', `body { margin: 0 auto; max-width: 40em; padding: 0 16px 2em; font-family: Georgia, serif; font-size: 1.05em; line-height: 1.5; color: #000; background: #fff; }
a { color: #000; }
h1 { font-size: 1.6em; line-height: 1.2; margin: .6em 0 .3em; }
h2 { font-size: 1.3em; margin-top: 1.6em; border-bottom: 2px solid #000; }
h3 { font-size: 1.1em; margin-top: 1.3em; }
pre, code, kbd { font-family: "Courier New", Courier, monospace; font-size: .9em; }
pre { white-space: pre-wrap; word-wrap: break-word; border: 1px solid #000; padding: 8px; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
img, svg { max-width: 100%; height: auto; }
.top, .crumb, .nav, .foot, .muted, .note { font-family: Helvetica, Arial, sans-serif; font-size: .85em; }
.top { border-bottom: 1px solid #000; padding: 8px 0; margin: 0; }
.foot { border-top: 1px solid #000; margin-top: 2em; padding-top: 8px; }
.sum { font-style: italic; }
.box, .callout { border: 1px solid #000; padding: 4px 12px; margin: 1em 0; }
.kind { font-family: Helvetica, Arial, sans-serif; font-weight: bold; text-transform: uppercase; font-size: .8em; letter-spacing: .05em; }
.q { font-weight: bold; margin: .5em 0; }
.opts { list-style: none; padding-left: 0; }
.opts li { margin: .3em 0; }
.ans { border-top: 1px dashed #000; padding-top: 4px; }
.nav { margin-top: 2em; }
`);

let stale = 0;
if (check) {
  for (const [name, want] of files) { const f = path.join(dir, name); if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== want) { stale++; console.error('✗ out of date: lite/' + name); } }
  for (const name of fs.existsSync(dir) ? fs.readdirSync(dir) : []) if (!files.has(name)) { stale++; console.error('✗ no longer generated: lite/' + name); }
  if (stale) { console.error(stale + ' lite file(s) are out of date: run node scripts/gen-lite.mjs'); process.exit(1); }
  console.log('lite/ is in sync ✓ (' + files.size + ' files)');
} else {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const [name, body] of files) fs.writeFileSync(path.join(dir, name), body);
  console.log('wrote lite/ (' + files.size + ' files)');
}
