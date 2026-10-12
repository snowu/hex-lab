// Reformat editable exercises; metadata, instructions and support provenance stay intact.
import fs from 'node:fs';
import path from 'node:path';
import {formatBundle} from './format-code.mjs';
const directory = path.resolve(import.meta.dirname, '../../content/katas/native');
const check = process.argv.includes('--check');
const selected = new Set(process.argv.slice(2).filter(arg => !arg.startsWith('--')));
let differences = 0;
let count = 0;
for (const filename of fs.readdirSync(directory).filter(f => /-(c|cpp|zig)\.json$/.test(f)).sort()) {
    const file = path.join(directory, filename);
    const original = fs.readFileSync(file, 'utf8');
    const bundle = JSON.parse(original);
    if (selected.size && !selected.has(bundle.slug) && !selected.has(bundle.language)) continue;
    const provenance = JSON.stringify(Object.fromEntries(Object.entries(bundle).filter(([key]) => !['starter', 'solution', 'tests'].includes(key))));
    formatBundle(bundle);
    const after = JSON.stringify(Object.fromEntries(Object.entries(bundle).filter(([key]) => !['starter', 'solution', 'tests'].includes(key))));
    if (provenance !== after) throw new Error('Formatting changed provenance: ' + filename);
    if (check) {
        if (JSON.stringify(bundle) !== original.trim()) { ++differences; console.error('Needs formatting: ' + filename); }
    } else fs.writeFileSync(file, JSON.stringify(bundle));
    ++count;
    if (count % 50 === 0) console.log((check ? 'Checked ' : 'Formatted ') + count + ' bundles');
}
console.log((check ? 'Checked ' : 'Formatted ') + count + ' native bundles without changing instructions/provenance');
if (differences) process.exitCode = 1;
