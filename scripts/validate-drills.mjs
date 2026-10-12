// Compiles and runs every game dev drill. For each language the reference solution + tests must pass, and the starter + tests must fail
// (but the starter must still compile, so learners see failing tests instead of a wall of compiler errors).
// Needs `zig` (override: ZIG=/path/to/zig) and `g++` (override: CXX=...). A missing toolchain is skipped with a warning unless --require is given.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadDrills, fileFor, EXT } from './lib-drills.mjs';

const require_ = process.argv.includes('--require');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DRILLS = loadDrills();
const CC = process.env.CC || 'cc';
const ZIG = process.env.ZIG || 'zig', CXX = process.env.CXX || 'g++';
const have = (cmd, arg) => { const r = spawnSync(cmd, [arg], { encoding: 'utf8' }); return !r.error && r.status === 0; };
const tools = { c: have(CC, '--version'), zig: have(ZIG, 'version'), cpp: have(CXX, '--version') };
let bad = 0, ran = 0;
const fail = (m) => { bad++; console.error('✗', m); };

for (const [lang, ok] of Object.entries(tools)) if (!ok) { (require_ ? fail : console.warn)(`${lang === 'zig' ? ZIG : lang === 'c' ? CC : CXX} not found, skipping ${lang} drills`); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drills-'));
const run = (lang, id, which) => {
  const dir = path.join(tmp, lang, which), file = path.join(dir, `${id}.${EXT[lang]}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, fileFor(id, DRILLS[id], lang, which));
  if (lang === 'zig') return spawnSync(ZIG, ['test', file, '--cache-dir', path.join(tmp, 'zcache'), '--global-cache-dir', path.join(tmp, 'zglobal')], { encoding: 'utf8', cwd: dir, timeout: 180000 });
  const exe = path.join(dir, id);
  const c = spawnSync(lang === 'c' ? CC : CXX, [lang === 'c' ? '-std=c17' : '-std=c++20', '-Wall', '-Wextra', '-Wno-unused-parameter', '-O1', '-fsanitize=address,undefined', '-o', exe, file, '-lm'], { encoding: 'utf8', timeout: 180000 });
  if (c.status !== 0) return { compileError: true, status: c.status, stdout: c.stdout, stderr: c.stderr };
  const r = spawnSync(exe, [], { encoding: 'utf8', timeout: 20000 });
  return { ...r, compiled: true };
};
const compileFailed = (lang, r) => (lang !== 'zig' ? r.compileError : /\.zig:\d+:\d+: error:/.test(r.stderr || ''));

for (const [id, d] of Object.entries(DRILLS)) {
  if (only.length && !only.includes(id)) continue;
  for (const f of ['title', 'prompt', 'hint', 'notes', 'minutes', 'level']) if (!d[f]) fail(`${id}: missing ${f}`);
  for (const lang of Object.keys(EXT)) {
    if (!d[lang]) { fail(`${id}: missing ${lang}`); continue; }
    for (const f of ['starter', 'tests', 'solution']) if (!d[lang][f]) fail(`${id}/${lang}: missing ${f}`);
    if (!tools[lang]) continue;
    const sol = run(lang, id, 'solution');
    ran++;
    if (sol.status !== 0) fail(`${id}/${lang}: reference solution fails\n${((sol.stderr || '') + (sol.stdout || '')).split('\n').slice(0, 14).join('\n')}`);
    const st = run(lang, id, 'starter');
    if (st.status === 0) fail(`${id}/${lang}: starter already passes its tests`);
    else if (compileFailed(lang, st)) fail(`${id}/${lang}: starter does not compile\n${(st.stderr || '').split('\n').slice(0, 8).join('\n')}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
if (bad) { console.error(bad + ' problem(s)'); process.exit(1); }
console.log(`${Object.keys(DRILLS).length} drills, ${ran} solutions compiled and passed, starters fail as expected ✓`);
