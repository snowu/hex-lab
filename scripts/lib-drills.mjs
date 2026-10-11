// Loads content/drills-game.js and builds the single-file form of each drill (your code first, then the tests).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EXT = { zig: 'zig', cpp: 'cpp' };

export function loadDrills() {
  const ctx = vm.createContext({});
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync(path.join(root, 'content/drills-game.js'), 'utf8'), ctx, { filename: 'content/drills-game.js' });
  return ctx.DRILLS;
}

/** The whole file a learner edits: header comment, starter (or solution), tests. */
let _ctx;
export function fileFor(id, d, lang, which = 'starter') {
  if (!_ctx) { _ctx = vm.createContext({}); _ctx.window = _ctx; vm.runInContext(fs.readFileSync(path.join(root, 'content/drills-game.js'), 'utf8'), _ctx); }
  return _ctx.drillFile(id, d, lang, which);
}
