// Validates content.
//  - every Python exercise's reference solution must pass its tests, and its starter must NOT (run under CPython
//    with the same assets/harness.py the browser uses via Pyodide)
//  - every predict-the-output snippet must print exactly its declared output
//  - bug-hunt line numbers, quiz answers, mock/lesson links, simulations, cards and resources are sane
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console, TRACKS: [] });
ctx.self = ctx; ctx.window = ctx;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="(content\/[^"]+)"/g)) {
  vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
}
const { TRACKS, CARDS = [], MOCK = [], RESOURCES = [] } = vm.runInContext('({TRACKS, CARDS: window.CARDS||[], MOCK: window.MOCK||[], RESOURCES: window.RESOURCES||[]})', ctx);

/* Lesson time: computed from the content (assets/lesson-time.js), never hand-written. Every lesson must land in a sane range. */
import { createRequire as _cr } from 'node:module';
const LessonTime = _cr(import.meta.url)('../assets/lesson-time.js');
LessonTime.apply(TRACKS);
for (const t of TRACKS) for (const l of t.lessons) if (!(Number.isInteger(l.minutes) && l.minutes >= 5 && l.minutes <= 120)) { console.error('✗ lesson time out of range: ' + l.id + ' = ' + l.minutes); process.exitCode = 1; }
/* Every track needs an icon in assets/app.js (a missing one renders as an empty box on the home page). */
{
  const appSrc = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8'), pBlock = appSrc.slice(appSrc.indexOf('const P = {'), appSrc.indexOf('const ic = '));
  const icons = new Set([...pBlock.matchAll(/^\s{2}(\w+):\s*'</gm)].map((m) => m[1]));
  for (const t of TRACKS) if (!icons.has(t.id)) { console.error('✗ track "' + t.id + '" has no icon in assets/app.js (P)'); process.exitCode = 1; }
}
const simIds = new Set(['sims.js', 'sims-game.js'].flatMap((f) => [...fs.readFileSync(path.join(root, 'assets', f), 'utf8').matchAll(/SIMS\.(\w+)\s*=/g)].map((m) => m[1])));
const pids = new Set();
const cases = []; // python cases to run
let bad = 0, drills = 0, exercises = 0, quizzes = 0, checks = 0, bugs = 0, predicts = 0, sims = 0;
const fail = (m) => { bad++; console.error('✗', m); };
const ids = new Set();

/* HTML in lesson prose must be balanced: an unclosed <b> or <li> restyles everything after it. */
function htmlBalance(html) {
  const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']), stack = [];
  const body = String(html).replace(/<!--[\s\S]*?-->/g, '').replace(/<(pre|code)\b([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs) => `<${tag}${attrs}></${tag}>`); // contents of code are text
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    const [, close, name, self] = m, tag = name.toLowerCase();
    if (VOID.has(tag) || self) continue;
    if (!close) stack.push(tag);
    else { const top = stack.pop(); if (top !== tag) return `</${tag}> closes <${top || 'nothing'}>`; }
  }
  return stack.length ? `unclosed <${stack[stack.length - 1]}>` : null;
}
for (const t of TRACKS) for (const l of t.lessons) l.sections.forEach((x, i) => {
  for (const f of ['html', 'intro', 'prompt', 'explain']) if (typeof x[f] === 'string') { const e = htmlBalance(x[f]); if (e) { bad++; console.error(`✗ ${l.id}#${i} ${f}: ${e}`); } }
});

for (const t of TRACKS) for (const l of t.lessons) {
  if (ids.has(l.id)) fail('duplicate lesson id ' + l.id); ids.add(l.id);
  if (!/^[\w-]+$/.test(l.id)) fail('bad lesson id ' + l.id);
  if (!Array.isArray(l.checks) || l.checks.length < 2) fail(l.id + ' needs at least 2 end-of-lesson checks');
  else for (const [i, c] of l.checks.entries()) {
    const where = `${l.id} check ${i}`;
    if (!c.q || !c.explain) fail(where + ' needs q and explain');
    if (!Array.isArray(c.options) || c.options.length !== 4) fail(where + ' needs exactly 4 options');
    else if (new Set(c.options).size !== 4) fail(where + ' has duplicate options');
    if (!(c.answer >= 0 && c.answer < 4)) fail(where + ' answer out of range');
    for (const f of ['q', 'explain']) if (typeof c[f] === 'string') { const e = htmlBalance(c[f]); if (e) { bad++; console.error(`✗ ${where} ${f}: ${e}`); } }
    checks++;
  }
  for (const [i, s] of l.sections.entries()) {
    const where = `${l.id}#${i}`;
    if (s.type === 'quiz') {
      quizzes++;
      if (!(s.answer >= 0 && s.answer < s.options.length)) fail(where + ' quiz answer out of range');
    }
    if (s.type === 'bug') {
      const n = s.code.split('\n').length;
      if (!s.pid) fail(where + ' bug section needs a pid');
      if (!s.bugs?.length) fail(where + ' bug section has no bugs');
      for (const b of s.bugs || []) { if (!(b.line >= 1 && b.line <= n)) fail(where + ' bug line ' + b.line + ' out of range'); if (!b.why) fail(where + ' bug line ' + b.line + ' has no explanation'); }
      for (const o of s.ok || []) if (!(o >= 1 && o <= n)) fail(where + ' ok line ' + o + ' out of range');
      bugs++;
    }
    if (s.type === 'predict') {
      if (!s.pid) fail(where + ' predict section needs a pid');
      if (!(s.answer >= 0 && s.answer < s.options.length)) fail(where + ' predict answer out of range');
      cases.push({ id: 'predict:' + where, kind: 'predict', section: s, code: s.code, tests: '', allow_empty: true });
      predicts++;
    }
    if (s.type === 'drill') {
      drills++;
      if (s.ref) fail(where + ' unresolved drill ref ' + s.ref);
      if (!s.pid) fail(where + ' drill needs a pid');
      for (const f of ['title', 'prompt', 'hint', 'notes']) if (!s[f]) fail(`${where} drill missing "${f}"`);
      for (const lang of ['c', 'zig', 'cpp']) for (const f of ['starter', 'tests', 'solution']) if (!s[lang]?.[f]) fail(`${where} drill missing ${lang}.${f}`);
    }
    if (s.type === 'sim') {
      if (!s.pid) fail(where + ' sim section needs a pid');
      if (!simIds.has(s.id)) fail(where + ' sim "' + s.id + '" has no implementation in assets/sims.js');
      sims++;
    }
    if (s.pid) { if (pids.has(l.id + ':' + s.pid)) fail(where + ' duplicate pid ' + s.pid); pids.add(l.id + ':' + s.pid); }
    if (s.type === 'code') {
      exercises++;
      if (s.ref) fail(where + ' unresolved exercise ref ' + s.ref);
      const sqlKind = s.kind === 'sql' || s.kind === 'ddl';
      for (const f of sqlKind ? ['title', 'prompt', 'starter', 'solution', 'schema', 'hint'] : ['title', 'prompt', 'starter', 'tests', 'solution', 'hint']) if (!s[f]) fail(`${where} exercise missing "${f}"`);
      if (sqlKind) {
        if (s.kind === 'ddl' && !s.verify) fail(`${where} ddl exercise needs verify`);
        if (s.kind === 'sql' && !s.expect) fail(`${where} sql exercise needs expect rows`);
        const spec = (sql) => ({ kind: s.kind, sql, schema: s.schema, seed: s.seed, hidden: s.hidden, solution: s.solution, ordered: s.ordered, names: s.names, verify: s.verify });
        cases.push({ id: 'sol:' + where, kind: 'sol', section: s, sql_spec: spec(s.solution) });
        cases.push({ id: 'start:' + where, kind: 'start', section: s, sql_spec: spec(s.starter) });
      } else {
        cases.push({ id: 'sol:' + where, kind: 'sol', section: s, code: s.solution, tests: s.tests });
        cases.push({ id: 'start:' + where, kind: 'start', section: s, code: s.starter, tests: s.tests });
      }
    }
  }
}

if (cases.length) {
  const run = spawnSync('python3', [path.join(root, 'scripts/pyrun.py')], { input: JSON.stringify(cases.map(({ id, code, tests, allow_empty, sql_spec }) => ({ id, code, tests, allow_empty, sql_spec }))), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (run.error || run.status !== 0) { console.error('✗ python3 failed:', run.error?.message || run.stderr.slice(-800)); process.exit(1); }
  const byId = Object.fromEntries(JSON.parse(run.stdout).map((r) => [r.id, r]));
  for (const c of cases) {
    const r = byId[c.id], s = c.section;
    if (c.kind === 'sol') {
      if (r.fatal || r.results.some((x) => !x.pass)) fail(`"${s.title}" solution fails: ${r.fatal || r.results.filter((x) => !x.pass).map((x) => x.name + ' → ' + x.err).join('; ')}`);
      else if (!r.results.length) fail(`"${s.title}" has no tests`);
      else if (s.kind === 'sql') {
        const norm = (rows) => (s.ordered ? rows : [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))).map((x) => JSON.stringify(x));
        if (r.expected.total !== s.expect.length || JSON.stringify(norm(r.expected.rows)) !== JSON.stringify(norm(s.expect))) fail(`"${s.title}" reference result differs from declared expect.\n   actual:   ${JSON.stringify(r.expected.rows)}\n   expected: ${JSON.stringify(s.expect)}`);
      }
    } else if (c.kind === 'start') {
      if (s.kind === 'sql' || s.kind === 'ddl') { if (!r.fatal && r.results.length && r.results.every((x) => x.pass)) fail(`"${s.title}" starter already passes`); }
      else if (r.fatal) fail(`"${s.title}" starter does not even run: ${r.fatal}`);
      else if (r.results.length && r.results.every((x) => x.pass)) fail(`"${s.title}" starter already passes its tests`);
    } else if (c.kind === 'predict') {
      if (r.fatal) fail(`predict "${s.title}" errors: ${r.fatal}`);
      else if (JSON.stringify(r.logs) !== JSON.stringify(s.output)) fail(`predict "${s.title}" output mismatch. declared ${JSON.stringify(s.output)} actual ${JSON.stringify(r.logs)}`);
    }
  }
}

// design lab content
const DESIGNS = vm.runInContext('window.DESIGNS || []', ctx), ESTIMATES = vm.runInContext('window.ESTIMATES || []', ctx), STEPS = vm.runInContext('window.DESIGN_STEPS || []', ctx);
for (const d of DESIGNS) {
  for (const s of STEPS) if (!d.ref?.[s.id] || d.ref[s.id].length < 80) fail(`design ${d.id}: missing or thin reference for step ${s.id}`);
  if (d.rubric?.length !== 8) fail(`design ${d.id}: rubric should have 8 items`);
  if (d.hints?.length !== 3) fail(`design ${d.id}: needs 3 hints`);
  if (!d.followups?.length || !d.tradeoffs?.length) fail(`design ${d.id}: needs follow-ups and trade-offs`);
}
for (const e of ESTIMATES) for (let i = 0; i < 200; i++) { const g = e.gen(Math.random); if (!(g.answer > 0 && Number.isFinite(g.answer)) || !g.q || !g.steps?.length) { fail(`estimate ${e.id}: bad generated scenario ${JSON.stringify(g)}`); break; } }
// Validate learning designs as well as the default interview content.
ctx.MODE = 'gamedev';
vm.runInContext(fs.readFileSync(path.join(root, 'content/dev-design.js'), 'utf8'), ctx);
for (const d of ctx.DESIGNS) {
  for (const step of ctx.DESIGN_STEPS) if (!d.ref?.[step.id] || d.ref[step.id].length < 80) fail(`game design ${d.id}: missing reference for ${step.id}`);
  if (!d.id.startsWith('gd-') || !d.prompt || !(d.minutes > 0) || d.rubric?.length < 6 || d.hints?.length < 2 || !d.followups?.length || !d.tradeoffs?.length) fail(`game design ${d.id}: incomplete practice content`);
}
for (const e of ctx.ESTIMATES) for (let i = 0; i < 200; i++) { const g = e.gen(Math.random); if (!(g.answer > 0 && Number.isFinite(g.answer)) || !g.q || !g.steps?.length) fail(`game estimate ${e.id}: invalid scenario`); }
CARDS.forEach((c, i) => { if (!c.q || !c.a || !c.track) fail('card ' + i + ' malformed'); });
MOCK.forEach((m, i) => {
  if (!m.q || !m.kind || !m.rubric?.length || !m.minutes) fail('mock ' + i + ' malformed');
  if (!m.lessons?.length) fail('mock ' + i + ' has no lessons to revisit');
  for (const id of m.lessons || []) if (!ids.has(id)) fail('mock ' + i + ' links to unknown lesson ' + id);
});
RESOURCES.forEach((r, i) => { if (!/^https:\/\//.test(r.url) || !r.title || !r.cat || !r.note) fail('resource ' + i + ' malformed'); });
console.log(`${TRACKS.length} tracks, ${ids.size} lessons, ${exercises} python exercises, ${bugs} bug hunts, ${predicts} predicts, ${sims} sims, ${drills} C/Zig/C++ drills, ${DESIGNS.length} design reps, ${ESTIMATES.length} estimation types, ${quizzes} quizzes, ${checks} lesson checks, ${CARDS.length} cards, ${MOCK.length} mock questions, ${RESOURCES.length} resources`);
if (bad) { console.error(bad + ' problem(s)'); process.exit(1); }
console.log('All content valid ✓');
