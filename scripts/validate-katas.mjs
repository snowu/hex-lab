// Every imported kata: the reference solution must pass all its tests, and the starter stub must NOT pass them all.
// Runs under CPython with the same assets/harness.py the browser uses (Pyodide).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'content/katas/python');
if (!fs.existsSync(dir)) { console.log('no katas imported'); process.exit(0); }
const katas = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const header = (k) => `#!unittest:${k.module}\n${k.tests}`;
const cases = katas.flatMap((k) => [{ id: 'sol:' + k.slug, code: k.example, tests: header(k) }, { id: 'start:' + k.slug, code: k.stub, tests: header(k) }]);
const run = spawnSync('python3', ['-I', path.join(root, 'scripts/pyrun.py')], { input: JSON.stringify(cases), encoding: 'utf8', maxBuffer: 1 << 28, timeout: 15 * 60 * 1000 });
if (run.status !== 0) { console.error(run.stderr || run.error); process.exit(1); }
const res = Object.fromEntries(JSON.parse(run.stdout).map((r) => [r.id, r]));
let bad = 0, tests = 0;
for (const k of katas) {
  const s = res['sol:' + k.slug], t = res['start:' + k.slug];
  const fails = s.results.filter((r) => !r.pass);
  tests += s.results.length;
  if (s.fatal || fails.length || !s.results.length) { bad++; console.error(`✗ ${k.slug}: reference solution fails: ${s.fatal || fails.slice(0, 2).map((r) => r.name + ' → ' + r.err).join(' | ') || 'no tests'}`); }
  else if (!k.refactor && !t.fatal && t.results.length && t.results.every((r) => r.pass)) { bad++; console.error(`✗ ${k.slug}: the starter stub already passes every test`); }
}
console.log(`${katas.length} katas, ${tests} tests: ${bad ? bad + ' problem(s)' : 'all reference solutions pass and all starters fail'}`);
process.exit(bad ? 1 : 0);
