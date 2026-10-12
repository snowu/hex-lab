// These mutations restore known semantic bugs, not compilation failures.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root = path.resolve(import.meta.dirname, '../..');
const catalog = path.join(root, 'content/katas/native');
const tempRoot = process.env.TMPDIR || path.join(os.homedir(), '.cache/native-validation');
fs.mkdirSync(tempRoot, {recursive: true});
const temporary = fs.mkdtempSync(path.join(tempRoot, 'contract-regressions-'));
const zig = process.env.ZIG || 'zig';
function body(source, signature, replacement) {
    const signatureAt = source.indexOf(signature);
    if (signatureAt < 0) throw new Error('Missing mutation target: ' + signature);
    const start = source.indexOf('{', signatureAt);
    let depth = 1, end = start + 1;
    while (depth) { if (source[end] === '{') ++depth; if (source[end] === '}') --depth; ++end; }
    return source.slice(0, start) + '{' + replacement + '}' + source.slice(end);
}
function change(files, filename, mutate) {
    const original = files[filename];
    const next = mutate(original);
    if (next === original) throw new Error('Mutation did not change ' + filename);
    files[filename] = next;
}
function restoreFixture(files, id) {
    const fixture = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'regression-fixtures', id + '.json'), 'utf8'));
    for (const [filename, code] of Object.entries(fixture.files)) change(files, filename, () => code);
}
const fixtures = [
    {id: 'c-bank-unlocked', slug: 'bank-account', language: 'c', mutate(files) {
        change(files, 'exercise.c', text => body(body(text, 'static void acquire(', '(void)account;'), 'static void release(', '(void)account;'));
    }},
    {id: 'cpp-bank-unlocked', slug: 'bank-account', language: 'cpp', mutate(files) {
        change(files, 'bank_account.cpp', text => text.replace(/std::lock_guard guard\(mutex_\);/g, '/* old unlocked access */'));
    }},
    {id: 'zig-bank-unlocked', slug: 'bank-account', language: 'zig', mutate(files) {
        change(files, 'bank_account.zig', text => body(body(text, 'fn acquire(', '_ = self;'), 'fn release(', '_ = self;'));
    }},
    {id: 'c-robot-predictable-permutation', slug: 'robot-name', language: 'c', mutate(files) {
        restoreFixture(files, 'c-robot-predictable-permutation');
    }},
    ...['c', 'cpp'].map(language => ({id: language + '-zipper-shared-mutation', slug: 'zipper', language, mutate(files) {
        change(files, language === 'c' ? 'exercise.c' : 'exercise.cpp', text => body(text, 'static zipper copy_zipper(', 'return *source;'));
    }})),
    ...['c', 'cpp'].map(language => ({id: language + '-wordsearch-missing-diagonal', slug: 'word-search', language, mutate(files) {
        change(files, language === 'c' ? 'exercise.c' : 'exercise.cpp', text => text.replace('if (!dr && !dc)', 'if ((!dr && !dc) || (dr == 1 && dc == -1))'));
    }})),
    {id: 'zig-wordsearch-missing-diagonal', slug: 'word-search', language: 'zig', mutate(files) {
        change(files, 'word_search.zig', text => text.replace('if (dx == 1 and dy == 1)', 'if ((dx == 1 and dy == 1) or (dx == 0 and dy == 2))'));
    }},
    ...['c', 'cpp'].map(language => ({id: language + '-wordsearch-ignores-case', slug: 'word-search', language, mutate(files) {
        change(files, language === 'c' ? 'exercise.c' : 'exercise.cpp', text => text.replace('g[rr][cc] != w[k]', 'tolower((unsigned char)g[rr][cc]) != tolower((unsigned char)w[k])'));
    }})),
    {id: 'zig-wordsearch-ignores-case', slug: 'word-search', language: 'zig', mutate(files) {
        change(files, 'word_search.zig', text => text.replace('grid[@intCast(yy)][@intCast(xx)] != c', '@import("std").ascii.toLower(grid[@intCast(yy)][@intCast(xx)]) != @import("std").ascii.toLower(c)'));
    }},
    ...['c', 'cpp'].map(language => ({id: language + '-scale-forces-tonic', slug: 'scale-generator', language, mutate(files) {
        change(files, language === 'c' ? 'exercise.c' : 'exercise.cpp', text => text.replace('strcpy(out[n++], s[index % 12]);', 'strcpy(out[n++], tonic);'));
    }})),
    {id: 'zig-poker-loses-five-of-a-kind', slug: 'poker', language: 'zig', mutate(files) {
        change(files, 'poker.zig', text => text.replace('if (groups[0].count == 5) 9 else ', ''));
    }},
    {id: 'zig-sgf-duplicate-and-borrowed-identifier', slug: 'sgf-parsing', language: 'zig', mutate(files) {
        restoreFixture(files, 'zig-sgf-duplicate-and-borrowed-identifier');
    }},
    ...['c', 'cpp'].map(language => ({id: language + '-react-old-repeated-input-ownership', slug: 'react', language, mutate(files) {
        restoreFixture(files, language + '-react-old-repeated-input-ownership');
    }})),

    ...['wordy', 'variable-length-quantity', 'resistor-color-trio'].flatMap(slug => ['c', 'cpp'].map(language => ({
        id: language + '-' + slug + '-old-semantic-boundary', slug, language, mutate(files) {
            restoreFixture(files, language + '-' + slug + '-old-semantic-boundary');
        }
    }))),
    ...['c', 'cpp'].map(language => ({id: language + '-satellite-unchecked-lengths', slug: 'satellite', language, mutate(files) {
        change(files, language === 'c' ? 'exercise.c' : 'exercise.cpp', text => text.replace('if (pn != in)', 'if (false)'));
    }})),
];
function execute(fixture, mutant) {
    const bundle = JSON.parse(fs.readFileSync(path.join(catalog, fixture.slug + '-' + fixture.language + '.json')));
    const support = JSON.parse(fs.readFileSync(path.join(catalog, 'support', bundle.support + '.json')));
    const files = {...bundle.solution, ...bundle.tests, ...support};
    if (mutant) fixture.mutate(files);
    const work = path.join(temporary, fixture.id + (mutant ? '-mutant' : '-reference'));
    fs.mkdirSync(work, {recursive: true});
    for (const [filename, code] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(work, filename)), {recursive: true});
        fs.writeFileSync(path.join(work, filename), code);
    }
    let run;
    if (fixture.language === 'zig') {
        const test = Object.keys(bundle.tests).find(f => f.endsWith('.zig'));
        run = spawnSync(zig, ['test', test, '--cache-dir', path.join(temporary, 'zig-cache'), '--global-cache-dir', path.join(temporary, 'zig-global')], {cwd: work, encoding: 'utf8', timeout: 180000});
        if (/\.zig:\d+:\d+: error:/.test(run.stderr || '')) throw new Error('Mutant compile failure is not semantic evidence: ' + fixture.id + '\n' + run.stderr);
    } else {
        const extension = fixture.language === 'c' ? '.c' : '.cpp';
        const compile = spawnSync(fixture.language === 'c' ? (process.env.CC || 'cc') : (process.env.CXX || 'c++'), [fixture.language === 'c' ? '-std=c17' : '-std=c++20', '-pthread', '-O0', '-DEXERCISM_RUN_ALL_TESTS', '-DUNITY_INCLUDE_DOUBLE', '-DCATCH_CONFIG_NO_POSIX_SIGNALS', ...Object.keys(files).filter(f => f.endsWith(extension)), '-lm', '-o', 'tests'], {cwd: work, encoding: 'utf8', timeout: 180000});
        if (compile.status !== 0) throw new Error('Mutant compile failure is not semantic evidence: ' + fixture.id + '\n' + compile.stderr);
        run = spawnSync('bash', ['-c', 'ulimit -c 0; exec "$@"', 'contract-tests', path.join(work, 'tests')], {cwd: work, encoding: 'utf8', timeout: 60000});
    }
    return {status: run.status, signal: run.signal, detail: (run.stderr || run.stdout || '').trim().slice(-500)};
}
const results = [];
try {
    for (const fixture of fixtures) {
        const reference = execute(fixture, false);
        if (reference.status !== 0) throw new Error('Reference failed ' + fixture.id + '\n' + reference.detail);
        const mutant = execute(fixture, true);
        if (mutant.status === 0) throw new Error('Regression did not reject ' + fixture.id);
        results.push({id: fixture.id, slug: fixture.slug, language: fixture.language, reference: 'pass', mutant: 'rejected', evidence: mutant.detail || ('Runtime terminated with ' + (mutant.signal || 'exit ' + mutant.status))});
        console.log('PASS reference / REJECT mutant: ' + fixture.id);
    }
    const output = path.join(root, 'docs/native-contract-regressions.json');
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.writeFileSync(output, JSON.stringify({command: 'node scripts/native/contract-regressions.mjs', results}, null, 2) + '\n');
} finally { fs.rmSync(temporary, {recursive: true, force: true}); }
