// Compiles the complete code samples inside lessons. A sample is marked  <pre><code data-check="zig|cpp">...</code></pre>  in the lesson HTML.
// Zig samples are run with `zig test` (every declaration is analysed, embedded tests must pass); C++ samples are compiled with g++ -std=c++20 -fsyntax-only.
// Needs zig (ZIG=/path) and g++ (CXX=...). A missing toolchain is skipped with a warning unless --require is given.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require_ = process.argv.includes('--require');
const ZIG = process.env.ZIG || 'zig', CXX = process.env.CXX || 'g++';
const have = (cmd, arg) => { const r = spawnSync(cmd, [arg], { encoding: 'utf8' }); return !r.error && r.status === 0; };
const tools = { zig: have(ZIG, 'version'), cpp: have(CXX, '--version') };

const ctx = vm.createContext({ console, TRACKS: [] }); ctx.self = ctx; ctx.window = ctx;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="(content\/[^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const found = [];
for (const t of ctx.TRACKS) for (const l of t.lessons) l.sections.forEach((s, i) => {
  for (const m of String(s.html || '').matchAll(/<pre><code data-check="(zig|cpp)">([\s\S]*?)<\/code><\/pre>/g)) found.push({ lang: m[1], code: unesc(m[2]), where: `${l.id}#${i}` });
});

let bad = 0, ran = 0; const fail = (m) => { bad++; console.error('✗', m); };
for (const [lang, ok] of Object.entries(tools)) if (!ok && found.some((f) => f.lang === lang)) (require_ ? fail : console.warn)(`${lang === 'zig' ? ZIG : CXX} not found, skipping ${lang} snippets`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'snippets-'));
found.forEach((f, n) => {
  if (!tools[f.lang]) return;
  const dir = path.join(tmp, String(n)); fs.mkdirSync(dir);
  let r;
  if (f.lang === 'zig') {
    const file = path.join(dir, 'snippet.zig'); fs.writeFileSync(file, f.code + '\n\ntest "all declarations compile" {\n    std.testing.refAllDecls(@This());\n}\n');
    r = spawnSync(ZIG, ['test', file, '--cache-dir', path.join(tmp, 'zc'), '--global-cache-dir', path.join(tmp, 'zg')], { encoding: 'utf8', cwd: dir, timeout: 180000 });
  } else {
    const file = path.join(dir, 'snippet.cpp'); fs.writeFileSync(file, f.code);
    r = spawnSync(CXX, ['-std=c++20', '-Wall', '-Wextra', '-fsyntax-only', file], { encoding: 'utf8', timeout: 120000 });
  }
  ran++;
  if (r.status !== 0) fail(`${f.where} (${f.lang}) does not compile/pass:\n${((r.stderr || '') + (r.stdout || '')).split('\n').slice(0, 12).join('\n')}`);
});
fs.rmSync(tmp, { recursive: true, force: true });
if (bad) { console.error(bad + ' problem(s)'); process.exit(1); }
console.log(`${found.length} lesson code samples found, ${ran} compiled and passed ✓`);
