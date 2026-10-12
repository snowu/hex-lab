// Inventory a reviewed contract checklist and immutable evidence; compilation
// and mutation rejection are separate runtime checks, not inferred from counts.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root = path.resolve(import.meta.dirname, '../..');
const directory = path.join(root, 'content/katas/native');
const checklist = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'semantic-checklist.json')));
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const bundles = fs.readdirSync(directory).filter(f => /-(c|cpp|zig)\.json$/.test(f)).map(filename => ({filename, bundle: JSON.parse(fs.readFileSync(path.join(directory, filename)))}));
if (bundles.length !== 417) throw new Error('Expected all 417 native bundles');
const baseline = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'provenance-baseline.json')));
const provenanceFields = baseline.fields;
for (const {filename, bundle} of bundles) {
    const expected = baseline.records[filename];
    if (!expected || hash(Object.fromEntries(provenanceFields.map(key => [key, bundle[key]]))) !== expected.provenanceSha256) throw new Error('Changed provenance/instructions: ' + filename);
}
const selected = bundles.filter(({bundle: b}) => b.language === 'c' && b.source.startsWith('local/') || b.language === 'cpp' && (b.derivedFrom || b.source.startsWith('local/')) || b.language === 'zig' && b.source === 'native-port');
const records = selected.map(({filename, bundle: b}) => {
    if (!checklist[b.slug]) throw new Error('Missing reviewed checklist: ' + b.slug);
    const tests = Object.values(b.tests).join('\n');
    if (!tests.trim()) throw new Error('Missing native evidence: ' + filename);
    return {slug: b.slug, language: b.language, reviewedContract: checklist[b.slug], nativeTestFiles: Object.keys(b.tests), nativeReferenceFiles: Object.keys(b.solution), assertionSites: (tests.match(/\bassert\(|\bt\.expect\w*\(|\bTEST_ASSERT_\w+\(|\bREQUIRE\w*\(/g) || []).length, namedTestCases: (tests.match(/\btest\s+"|\bTEST_CASE\(|\bRUN_TEST\(/g) || []).length, instructionsSha256: hash(b.instructions), starterSha256: hash(b.starter), referenceSha256: hash(b.solution), testsSha256: hash(b.tests), provenanceSha256: hash(Object.fromEntries(provenanceFields.map(key => [key, b[key]])))};
});
const counts = Object.fromEntries(['c', 'cpp', 'zig'].map(language => [language, records.filter(r => r.language === language).length]));
if (counts.c !== 55 || counts.cpp !== 54 || counts.zig !== 40) throw new Error('Original-port audit scope changed: ' + JSON.stringify(counts));
const report = {scope: {bundles: 417, reviewedOriginalPorts: 149, exercises: Object.keys(checklist).length, languages: counts}, evidenceMeaning: 'The checklist records manual instruction/reference/test review. Assertion sites and test-case counts describe evidence size; they do not claim exhaustive correctness. Execute validate.mjs and contract-regressions.mjs for runtime evidence.', records};
fs.mkdirSync(path.join(root, 'docs'), {recursive: true});
fs.writeFileSync(path.join(root, 'docs/native-semantic-audit.json'), JSON.stringify(report, null, 2) + '\n');
let matrix = '# Native contract matrix\n\nManual review covers the public behaviors below for all 149 original ports (55 C, 54 C++, 40 Zig), across 70 exercises. All 417 bundles retain their instruction text and upstream provenance fields. Runtime regression evidence is in [native-contract-regressions.json](native-contract-regressions.json); source/test hashes and exact per-variant evidence are in [native-semantic-audit.json](native-semantic-audit.json).\n\nCounts are static assertion sites, not exhaustive scenario counts: loop/table tests execute several cases at each site. Scalar domains follow each native header (for example uint16 square-root, uint32 VLQ, and int/i64 rational arithmetic). Ownership, caller buffer capacity, coordinate bases and error/status conventions are documented in the native APIs; these representations are reviewed alongside the Python instructions.\n\n| Exercise | Reviewed ports (assertion sites) | Contract features reviewed |\n| --- | --- | --- |\n';
for (const slug of Object.keys(checklist).sort()) {
    const ports = records.filter(r => r.slug === slug).map(r => `[${r.language} (${r.assertionSites})](../content/katas/native/${slug}-${r.language}.json)`).join(', ');
    matrix += '| ' + slug + ' | ' + ports + ' | ' + checklist[slug].replaceAll('|', '\\|') + ' |\n';
}
fs.writeFileSync(path.join(root, 'docs/native-contract-matrix.md'), matrix);
console.log('Reviewed 149 original ports / 70 contracts; preserved provenance/instructions on all 417 bundles');
