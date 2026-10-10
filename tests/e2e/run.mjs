// Runs every suite in order against one static server and one browser. Usage: node e2e/run.mjs [suite ...]
import { serve, launch, reporter } from './helpers.mjs';

const ALL = ['smoke', 'exercises', 'interactive', 'fullstack', 'cloud', 'feedback', 'gate', 'katas'];
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const server = process.env.LAB_URL ? { url: process.env.LAB_URL, close() {} } : await serve();
const browser = await launch();
let pass = 0, fail = 0;
for (const name of wanted) {
  const r = reporter(name);
  console.log(`\n=== ${name} ===`);
  try { await (await import(`./${name}.mjs`)).default({ url: server.url, browser, ...r, ok: r.ok.bind(r), section: r.section.bind(r) }); }
  catch (e) { r.ok(false, `suite crashed: ${e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e}`); }
  pass += r.counts.pass; fail += r.counts.fail;
}
await browser.close(); server.close();
console.log(`\nE2E: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
