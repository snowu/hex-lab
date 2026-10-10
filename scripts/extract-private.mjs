// One-off: pulls the Neonomics material out of the PUBLIC content into private/neonomics.json (gitignored) and
// private/seed.sql (paste into the Supabase SQL editor). Run BEFORE deleting the public copies.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console, TRACKS: [] }); ctx.self = ctx; ctx.window = ctx;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="(content\/[^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
const g = vm.runInContext('({TRACKS, CARDS: window.CARDS||[], MOCK: window.MOCK||[], RESOURCES: window.RESOURCES||[]})', ctx);

const lossless = (v, where) => { // JSON must not silently drop functions / undefined
  const walk = (x, p) => { if (typeof x === 'function') throw new Error('function at ' + p); if (x && typeof x === 'object') for (const k of Object.keys(x)) walk(x[k], p + '.' + k); };
  walk(v, where); return JSON.parse(JSON.stringify(v));
};
const idx = g.TRACKS.findIndex((t) => t.id === 'openbanking');
if (idx < 0) throw new Error('openbanking track not found (already extracted?)');
const bundle = {
  v: 1,
  trackIndex: idx,
  track: lossless(g.TRACKS[idx], 'track'),
  mock: g.MOCK.filter((q) => /^Neonomics/.test(q.kind)).map((q) => ({ ...lossless(q, 'mock'), kind: 'Open Banking' })),
  cards: lossless(g.CARDS.filter((c) => c.track === 'Open Banking'), 'cards'),
  resources: g.RESOURCES.filter((r) => /^Neonomics/.test(r.cat)).map((r) => ({ ...lossless(r, 'res'), cat: 'Open Banking' })),
};
fs.mkdirSync(path.join(root, 'private'), { recursive: true });
const json = JSON.stringify(bundle);
fs.writeFileSync(path.join(root, 'private/neonomics.json'), JSON.stringify(bundle, null, 1));
const tag = '$neo$'; if (json.includes(tag)) throw new Error('dollar-quote collision');
fs.writeFileSync(path.join(root, 'private/seed.sql'),
  `-- Private study material, readable only by the account allowed in supabase/lab_private.sql.\n-- Run in the Supabase SQL editor (it runs as the owner, so row-level security does not block it). Re-running updates it.\n` +
  `insert into public.lab_private (id, data) values ('neonomics', ${tag}${json}${tag}::jsonb)\non conflict (id) do update set data = excluded.data, updated_at = now();\n`);
const sections = bundle.track.lessons.reduce((n, l) => n + l.sections.length, 0);
console.log(`track "${bundle.track.title}" at index ${idx}: ${bundle.track.lessons.length} lessons, ${sections} sections; ${bundle.mock.length} mock, ${bundle.cards.length} cards, ${bundle.resources.length} resources; ${(json.length / 1024).toFixed(1)} KB`);
