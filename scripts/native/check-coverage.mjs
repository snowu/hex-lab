import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'content/katas/native');
const ctx = vm.createContext({window: {}});
for (const file of ['content/katas/index.js', 'content/katas/native/index.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
}
const expected = ctx.window.KATAS.items.map(k => k.slug).sort();
assert.deepEqual(Array.from(ctx.window.NATIVE_KATAS.items, k => k.slug).sort(), Array.from(expected));
const coverage = JSON.parse(fs.readFileSync(path.join(dir, 'coverage.json')));
const variants = new Set();
const validPath = name => name.length > 0 && !name.startsWith('/') && !name.includes('\\') && !name.split('/').includes('..');
for (const slug of expected) for (const language of ['c', 'zig', 'cpp']) {
  const entry = coverage.variants.find(v => v.slug === slug && v.language === language);
  assert(entry && entry.status !== 'missing', `Missing ${slug}/${language}`);
  variants.add(`${slug}/${language}`);
  const bundle = JSON.parse(fs.readFileSync(path.join(dir, `${slug}-${language}.json`)));
  assert.equal(bundle.slug, slug);
  assert.equal(bundle.language, language);
  assert(bundle.source && bundle.ref && bundle.license === 'MIT', `Missing provenance: ${slug}/${language}`);
  assert(bundle.instructions?.trim(), `Missing instructions: ${slug}/${language}`);
  const support = JSON.parse(fs.readFileSync(path.join(dir, 'support', `${bundle.support}.json`)));
  for (const group of ['starter', 'solution', 'tests']) {
    assert(Object.keys(bundle[group]).length > 0, `Empty ${slug}/${language}/${group}`);
    for (const [name, code] of Object.entries(bundle[group])) {
      assert(validPath(name) && typeof code === 'string' && code.trim(), `Invalid file ${slug}/${language}/${name}`);
      assert(!Object.hasOwn(support, name), `Support shadows ${name}`);
    }
  }
  for (const name of Object.keys(support)) assert(validPath(name), `Invalid support path ${name}`);
  for (const name of Object.keys(bundle.tests)) assert(!Object.hasOwn(bundle.starter, name), `Tests shadow ${name}`);
}
assert.equal(coverage.variants.length, variants.size, 'Duplicate or unexpected coverage entries');
console.log(`${expected.length} exercises, ${variants.size} complete native variants`);
