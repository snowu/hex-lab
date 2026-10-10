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

const simIds = new Set([...fs.readFileSync(path.join(root, 'assets/sims.js'), 'utf8').matchAll(/SIMS\.(\w+)\s*=/g)].map((m) => m[1]));
const pids = new Set();
const cases = []; // python cases to run
let bad = 0, exercises = 0, quizzes = 0, bugs = 0, predicts = 0, sims = 0;
const fail = (m) => { bad++; console.error('✗', m); };
const ids = new Set();

for (const t of TRACKS) for (const l of t.lessons) {
  if (ids.has(l.id)) fail('duplicate lesson id ' + l.id); ids.add(l.id);
  if (!/^[\w-]+$/.test(l.id)) fail('bad lesson id ' + l.id);
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
    if (s.type === 'sim') {
      if (!s.pid) fail(where + ' sim section needs a pid');
      if (!simIds.has(s.id)) fail(where + ' sim "' + s.id + '" has no implementation in assets/sims.js');
      sims++;
    }
    if (s.pid) { if (pids.has(l.id + ':' + s.pid)) fail(where + ' duplicate pid ' + s.pid); pids.add(l.id + ':' + s.pid); }
    if (s.type === 'code') {
      exercises++;
      if (s.ref) fail(where + ' unresolved exercise ref ' + s.ref);
      for (const f of ['title', 'prompt', 'starter', 'tests', 'solution', 'hint']) if (!s[f]) fail(`${where} exercise missing "${f}"`);
      cases.push({ id: 'sol:' + where, kind: 'sol', section: s, code: s.solution, tests: s.tests });
      cases.push({ id: 'start:' + where, kind: 'start', section: s, code: s.starter, tests: s.tests });
    }
  }
}

if (cases.length) {
  const run = spawnSync('python3', [path.join(root, 'scripts/pyrun.py')], { input: JSON.stringify(cases.map(({ id, code, tests, allow_empty }) => ({ id, code, tests, allow_empty }))), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (run.error || run.status !== 0) { console.error('✗ python3 failed:', run.error?.message || run.stderr.slice(-800)); process.exit(1); }
  const byId = Object.fromEntries(JSON.parse(run.stdout).map((r) => [r.id, r]));
  for (const c of cases) {
    const r = byId[c.id], s = c.section;
    if (c.kind === 'sol') {
      if (r.fatal || r.results.some((x) => !x.pass)) fail(`"${s.title}" solution fails: ${r.fatal || r.results.filter((x) => !x.pass).map((x) => x.name + ' → ' + x.err).join('; ')}`);
      else if (!r.results.length) fail(`"${s.title}" has no tests`);
    } else if (c.kind === 'start') {
      if (r.fatal) fail(`"${s.title}" starter does not even run: ${r.fatal}`);
      else if (r.results.length && r.results.every((x) => x.pass)) fail(`"${s.title}" starter already passes its tests`);
    } else if (c.kind === 'predict') {
      if (r.fatal) fail(`predict "${s.title}" errors: ${r.fatal}`);
      else if (JSON.stringify(r.logs) !== JSON.stringify(s.output)) fail(`predict "${s.title}" output mismatch. declared ${JSON.stringify(s.output)} actual ${JSON.stringify(r.logs)}`);
    }
  }
}

CARDS.forEach((c, i) => { if (!c.q || !c.a || !c.track) fail('card ' + i + ' malformed'); });
MOCK.forEach((m, i) => {
  if (!m.q || !m.kind || !m.rubric?.length || !m.minutes) fail('mock ' + i + ' malformed');
  if (!m.lessons?.length) fail('mock ' + i + ' has no lessons to revisit');
  for (const id of m.lessons || []) if (!ids.has(id)) fail('mock ' + i + ' links to unknown lesson ' + id);
});
RESOURCES.forEach((r, i) => { if (!/^https:\/\//.test(r.url) || !r.title || !r.cat || !r.note) fail('resource ' + i + ' malformed'); });
console.log(`${TRACKS.length} tracks, ${ids.size} lessons, ${exercises} python exercises, ${bugs} bug hunts, ${predicts} predicts, ${sims} sims, ${quizzes} quizzes, ${CARDS.length} cards, ${MOCK.length} mock questions, ${RESOURCES.length} resources`);
if (bad) { console.error(bad + ' problem(s)'); process.exit(1); }
console.log('All content valid ✓');
