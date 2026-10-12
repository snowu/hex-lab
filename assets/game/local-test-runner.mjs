#!/usr/bin/env node
// Included in native exercise downloads. Runs the learner's files on their machine.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = fs.realpathSync(directory);
const reportPath = path.join(root, 'lab-results.json');
const hash = files => createHash('sha256').update(JSON.stringify(Object.keys(files).sort().map(name => [name, files[name]]))).digest('hex');
const safeName = name => typeof name === 'string' && name.length > 0 && !path.isAbsolute(name) && !name.includes('\\') && !name.split('/').some(part => part === '..' || part === '');
let temporary;

function readFiles(names) {
  if (!Array.isArray(names) || names.length === 0 || names.some(name => !safeName(name))) throw Error('Invalid file list in lab-manifest.json.');
  const files = {};
  for (const name of names) {
    const file = fs.realpathSync(path.join(root, name));
    if (!file.startsWith(root + path.sep)) throw Error('A project file points outside this download.');
    files[name] = fs.readFileSync(file, 'utf8');
  }
  return files;
}

function casesFrom(output, passed) {
  const cases = [];
  for (const line of output.split('\n')) {
    const unity = line.match(/^(.+?):(\d+):([^:]+):(PASS|FAIL|IGNORE)(?::(.*))?$/);
    if (unity) cases.push({name: unity[3], status: {PASS: 'passed', FAIL: 'failed', IGNORE: 'skipped'}[unity[4]], location: `${unity[1]}:${unity[2]}`, message: unity[5] || ''});
    const named = line.match(/^(PASS|FAIL)\s+(.+)$/);
    if (named) cases.push({name: named[2], status: named[1] === 'PASS' ? 'passed' : 'failed'});
    const zig = line.match(/^\d+\/\d+\s+(.+?)\.\.\.(OK|FAIL.*)$/);
    if (zig) cases.push({name: zig[1], status: zig[2] === 'OK' ? 'passed' : 'failed'});
  }
  const assertion = output.match(/(?:Assertion\s+[`'](.+?)['`]\s+failed|assertion failed:\s*(.+))/i);
  if (assertion) cases.push({name: 'Assertion: ' + (assertion[1] || assertion[2]), status: 'failed', expected: 'condition is true', actual: 'condition was false'});
  if (!cases.length) cases.push({name: 'Native test program', status: passed ? 'passed' : 'failed'});
  return cases;
}

function execute(command, args, timeout) {
  const result = spawnSync(command, args, {cwd: root, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024});
  return {passed: result.status === 0 && !result.error, output: (result.stdout || '') + (result.stderr || ''), error: result.error?.code || '', signal: result.signal || ''};
}

try {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'lab-manifest.json'), 'utf8'));
  if (manifest.schema !== 'game-dev-lab/native-package@1' || !['c', 'cpp', 'zig'].includes(manifest.language) || !/^[\w-]+$/.test(manifest.exerciseId)) throw Error('Unsupported exercise manifest.');
  const sources = readFiles(manifest.sourceNames);
  const tests = readFiles(manifest.testNames);
  const support = manifest.supportNames?.length ? readFiles(manifest.supportNames) : {};
  const report = {schema: 'game-dev-lab/local-results@1', exerciseId: manifest.exerciseId, language: manifest.language, timestamp: new Date().toISOString(), sourceHash: hash(sources), testHash: hash({...tests, ...support}), sources, status: 'failed', stage: 'compile', cases: [], output: ''};
  const compiler = process.env[{c: 'CC', cpp: 'CXX', zig: 'ZIG'}[manifest.language]] || {c: 'cc', cpp: 'c++', zig: 'zig'}[manifest.language];
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'game-dev-test-'));
  let result;
  const extension = {c: '.c', cpp: '.cpp', zig: '.zig'}[manifest.language];
  const combined = path.join(temporary, 'exercise' + extension);
  if (manifest.combine) {
    const pieces = [...Object.entries(sources), ...Object.entries(tests)].map(([name, text]) => manifest.language === 'zig' ? text : `#line 1 ${JSON.stringify(name)}\n${text}`);
    fs.writeFileSync(combined, pieces.join('\n\n') + '\n');
  }
  if (manifest.language === 'zig') {
    if (!manifest.testNames.includes(manifest.testEntry)) throw Error('Invalid Zig test entry.');
    result = execute(compiler, ['test', manifest.combine ? combined : manifest.testEntry, ...(manifest.zigArgs || []), '--cache-dir', path.join(temporary, 'cache'), '--global-cache-dir', path.join(temporary, 'global')], 180000);
    report.stage = /\.zig:\d+:\d+: error:/.test(result.output) || result.error ? 'compile' : 'test';
  } else {
    const executable = path.join(temporary, process.platform === 'win32' ? 'tests.exe' : 'tests');
    const allNames = [...manifest.sourceNames, ...manifest.testNames, ...(manifest.supportNames || [])];
    if (manifest.compileNames && (!Array.isArray(manifest.compileNames) || manifest.compileNames.some(name => !allNames.includes(name)))) throw Error('Invalid native compile file list.');
    const names = manifest.combine ? [combined] : (manifest.compileNames || allNames).filter(name => name.endsWith(extension));
    const flags = [manifest.language === 'c' ? '-std=c17' : '-std=c++20', '-DEXERCISM_RUN_ALL_TESTS', '-DUNITY_INCLUDE_DOUBLE', '-DCATCH_CONFIG_NO_POSIX_SIGNALS', '-O0', '-g', '-pthread'];
    result = execute(compiler, [...flags, '-I', root, ...names, ...(manifest.compileArgs || []), '-lm', '-o', executable], 180000);
    const timeout = Number.isInteger(manifest.runTimeoutMs) && manifest.runTimeoutMs >= 100 && manifest.runTimeoutMs <= 30000 ? manifest.runTimeoutMs : 15000;
    if (result.passed) {report.stage = 'test'; result = execute(executable, [], timeout);}
  }
  report.status = result.passed ? 'passed' : 'failed';
  report.output = result.output.slice(0, 100000);
  report.cases = report.stage === 'test' ? casesFrom(report.output, result.passed) : [{name: 'Compile native source', status: 'failed'}];
  const passed = result.passed && report.cases.some(test => test.status === 'passed') && !report.cases.some(test => test.status === 'failed');
  report.status = passed ? 'passed' : 'failed';
  report.error = result.error;
  report.signal = result.signal;
  report.guidance = passed ? 'The downloaded native test program passed. Import lab-results.json to record this result and load the tested source.' : result.error === 'ENOENT' ? 'Install the selected native compiler, or set CC, CXX or ZIG to its executable path, then run this command again.' : result.error === 'ETIMEDOUT' ? 'The program did not finish within the time limit. Check loops, recursion and blocking input in the test path.' : report.stage === 'compile' ? 'Check the first compiler diagnostic below. Compare your function names, parameter types and includes with the declared API. A declarations-only starter needs implementation before it links.' : result.signal && !report.output ? `The test program stopped with ${result.signal}. Implement any remaining TODO/abort functions, then check invalid memory access and zero divisors in your source.` : 'Start with the first failing case below. Compare its input and expected result with the exercise contract, then rerun after changing your source.';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.status === 'passed' ? 'PASS' : 'FAIL'} ${manifest.exerciseId} (${manifest.language}) — ${report.stage}`);
  for (const test of report.cases) console.log(`  ${test.status.toUpperCase()} ${test.name}${test.location ? ' · ' + test.location : ''}`);
  console.log(report.guidance);
  if (!passed) console.log(report.output);
  console.log('Result saved to lab-results.json.');
  process.exitCode = passed ? 0 : 1;
} catch (error) {
  console.error('Could not run this download: ' + error.message);
  process.exitCode = 1;
} finally {
  if (temporary) fs.rmSync(temporary, {recursive: true, force: true});
}
