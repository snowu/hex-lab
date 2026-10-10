// Validates content: every exercise's reference solution must pass its tests, and its starter must NOT.
// Also sanity-checks quiz answers, cards, mock questions and resource shapes.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console, setTimeout, clearTimeout, TRACKS: [] });
ctx.self = ctx; ctx.window = ctx;
vm.runInContext(fs.readFileSync(path.join(root, 'assets/harness.js'), 'utf8'), ctx);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="(content\/[^"]+)"/g)) {
  vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
}
const { TRACKS, CARDS = [], MOCK = [], RESOURCES = [] } = vm.runInContext('({TRACKS, CARDS: window.CARDS||[], MOCK: window.MOCK||[], RESOURCES: window.RESOURCES||[]})', ctx);

const simIds = new Set([...fs.readFileSync(path.join(root, 'assets/sims.js'), 'utf8').matchAll(/SIMS\.(\w+)\s*=/g)].map((m) => m[1]));
const pids = new Set();
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
      const r = await ctx.runTests(s.code + "\n;test('run', () => new Promise((r) => setTimeout(r, 80)));");
      if (r.fatal) fail(where + ' predict snippet errors: ' + r.fatal);
      else if (JSON.stringify(r.logs) !== JSON.stringify(s.output)) fail(where + ' predict output mismatch. declared ' + JSON.stringify(s.output) + ' actual ' + JSON.stringify(r.logs));
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
      const sol = await ctx.runTests(s.solution + '\n;\n' + s.tests);
      if (sol.fatal || sol.results.some((r) => !r.pass)) fail(`${where} "${s.title}" solution fails: ${sol.fatal || sol.results.filter((r) => !r.pass).map((r) => r.name + ' → ' + r.err).join('; ')}`);
      const st = await ctx.runTests(s.starter + '\n;\n' + s.tests);
      if (!st.fatal && st.results.length && st.results.every((r) => r.pass)) fail(`${where} "${s.title}" starter already passes`);
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
console.log(`${TRACKS.length} tracks, ${ids.size} lessons, ${exercises} exercises, ${bugs} bug hunts, ${predicts} predicts, ${sims} sims, ${quizzes} quizzes, ${CARDS.length} cards, ${MOCK.length} mock questions, ${RESOURCES.length} resources`);
if (bad) { console.error(bad + ' problem(s)'); process.exit(1); }
console.log('All content valid ✓');
