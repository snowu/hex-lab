// Writes the runnable drill files: drills/zig/<id>.zig and drills/cpp/<id>.cpp (starter + tests). Run after editing content/drills-game.js.
import fs from 'node:fs';
import path from 'node:path';
import { loadDrills, fileFor, root, EXT } from './lib-drills.mjs';

const DRILLS = loadDrills();
const check = process.argv.includes('--check'); // CI: fail if drills/ is out of date with content/drills-game.js
let stale = 0;
for (const lang of Object.keys(EXT)) {
  const dir = path.join(root, 'drills', lang);
  if (!check) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }
  for (const [id, d] of Object.entries(DRILLS)) {
    const f = path.join(dir, `${id}.${EXT[lang]}`), want = fileFor(id, d, lang);
    if (check) { if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== want) { stale++; console.error('✗ out of date: drills/' + lang + '/' + id + '.' + EXT[lang]); } }
    else fs.writeFileSync(f, want);
  }
}
if (check) { if (stale) { console.error(stale + ' drill file(s) are out of date: run node scripts/gen-drills.mjs'); process.exit(1); } console.log('drills/ is in sync ✓'); process.exit(0); }
fs.writeFileSync(path.join(root, 'drills', 'README.md'), `# Game dev drills (C, Zig and C++)

Generated from \`content/drills-game.js\` by \`node scripts/gen-drills.mjs\`. Each file holds a starter with stubs followed by tests. Edit the part above the tests marker until they pass.

\`\`\`sh
cc -std=c17 -Wall drills/c/fixed_steps.c -lm -o /tmp/d && /tmp/d # C17
zig test drills/zig/fixed_steps.zig                                  # Zig (written against 0.17)
g++ -std=c++20 -Wall -o /tmp/d drills/cpp/fixed_steps.cpp && /tmp/d   # C++20
\`\`\`

The same prompts, hints and reference solutions are in the lab (game dev section). CI compiles every reference solution and checks every starter fails.
`);
console.log(`wrote ${Object.keys(DRILLS).length} drills x ${Object.keys(EXT).length} languages to drills/`);
