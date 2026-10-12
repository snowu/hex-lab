// Compile real learner files and exercise the browser's report validation contract.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const runner = fs.readFileSync(path.join(root, 'assets/game/local-test-runner.mjs'), 'utf8');
const browser = vm.createContext({window: {crypto: webcrypto}, crypto: webcrypto, TextEncoder, fetch: async () => ({ok: true, text: async () => runner})});
vm.runInContext(fs.readFileSync(path.join(root, 'assets/game/native-practice.js'), 'utf8'), browser);
const practice = browser.window.NativePractice;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-local-report-'));
let checks = 0;
const check = (condition, name) => {assert(condition, name); checks++; console.log('PASS ' + name);};

async function run(language, source, tests, config = {}) {
  const extension = {c: 'c', cpp: 'cpp', zig: 'zig'}[language];
  const name = `learner.${extension}`, test = `tests.${extension}`;
  const files = {[name]: source, [test]: tests};
  const packaged = await practice.makePackage({id: 'report-fixture', language, files, sourceNames: [name], testNames: [test], supportNames: [], combine: true, ...config});
  const directory = fs.mkdtempSync(path.join(temporary, 'folder with spaces '));
  for (const [filename, text] of Object.entries(packaged)) fs.writeFileSync(path.join(directory, filename), text);
  const env = {...process.env};
  const result = spawnSync(process.execPath, [path.join(directory, 'lab-test.mjs')], {cwd: directory, env, encoding: 'utf8', timeout: 200000});
  assert(!result.error, result.error?.message);
  const report = JSON.parse(fs.readFileSync(path.join(directory, 'lab-results.json'), 'utf8'));
  return {result, report, sourceName: name, testName: test, files, config: {exerciseId: 'report-fixture', language, getFiles: () => ({[name]: source}), testFiles: {[test]: tests}}};
}

try {
  const c = await run('c', '#include <assert.h>\nint answer(void) {return 42;}\n', 'int main(void) {assert(answer()==42);return 0;}\n');
  check(c.result.status === 0 && c.report.status === 'passed' && c.report.stage === 'test', 'actual C source compiles/runs from a folder containing spaces');
  check((await practice.validateReport(c.report, c.config)).sourceMatches, 'browser fingerprint matches source and immutable tests from actual local execution');
  const edited = {...c.config, getFiles: () => ({[c.sourceName]: 'int answer(void) {return 7;}\n'})};
  check(!(await practice.validateReport(c.report, edited)).sourceMatches, 'a passing old source is distinguished from the current edited draft');
  await assert.rejects(() => practice.validateReport({...c.report, language: 'zig'}, c.config), /another language/); checks++;
  await assert.rejects(() => practice.validateReport({...c.report, exerciseId: 'another'}, c.config), /another exercise/); checks++;
  await assert.rejects(() => practice.validateReport(c.report, {...c.config, testFiles: {[c.testName]: 'changed tests'}}), /tests have changed/); checks++;
  await assert.rejects(() => practice.validateReport({...c.report, sources: {[c.sourceName]: 'tampered'}}, c.config), /fingerprint/); checks++;
  await assert.rejects(() => practice.validateReport({...c.report, cases: [{name: 'skipped', status: 'skipped'}]}, c.config), /completed passing/); checks++;
  check(true, 'foreign exercise/language, changed tests, tampered sources and all-skipped results cannot be recorded as passing');
  const bad = await run('c', '#include <assert.h>\nint answer(void) {return 0;}\n', 'int main(void) {assert(answer()==42);return 0;}\n');
  check(bad.result.status !== 0 && bad.report.status === 'failed' && bad.report.cases.some(test => test.name.includes('answer()')), 'failing C assertions produce named condition feedback');
  check(bad.report.output.includes('tests.c') && !bad.report.output.includes('game-dev-test-'), 'combined C diagnostics point to the learner/test filenames, not a deleted temp file');
  const compile = await run('c', 'int answer(void) {syntax is not C;}\n', 'int main(void) {return answer();}\n');
  check(compile.report.status === 'failed' && compile.report.stage === 'compile' && compile.report.guidance.includes('compiler diagnostic'), 'compiler failure has separate actionable guidance');
  const cpp = await run('cpp', '#include <cassert>\n#include <cstdio>\nint answer() {return 42;}\n', 'int main() {assert(answer()==42);puts("PASS computes expected answer");}\n');
  check(cpp.report.status === 'passed' && cpp.report.cases[0].name === 'computes expected answer', 'C++ native named test cases survive the receipt');
  const zig = await run('zig', 'const std = @import("std");\nfn answer() i32 {return 42;}\n', 'test "computes expected answer" {try std.testing.expectEqual(@as(i32,42),answer());}\n');
  check(zig.report.status === 'passed' && zig.report.cases.some(test => test.name.includes('computes expected answer')), 'Zig native test names and passing status survive the receipt');
  const falseSuccess = await run('c', '#include <stdio.h>\n', 'int main(void) {puts("FAIL score matches");return 0;}\n');
  check(falseSuccess.result.status !== 0 && falseSuccess.report.status === 'failed', 'named failing cases override a misleading successful process exit');
  const ignored = await run('c', '#include <stdio.h>\n', 'int main(void) {puts("tests.c:1:score:IGNORE:disabled");return 0;}\n');
  check(ignored.result.status !== 0 && ignored.report.status === 'failed', 'all-skipped native tests cannot produce a passing receipt');
  const timeout = await run('c', 'int wait(void) {while(1) {} return 0;}\n', 'int main(void) {return wait();}\n', {runTimeoutMs: 100});
  check(timeout.report.status === 'failed' && timeout.report.error === 'ETIMEDOUT' && timeout.report.guidance.includes('time limit'), 'a hung learner program cannot become a passing result');
} finally {fs.rmSync(temporary, {recursive: true, force: true});}
console.log(`${checks} local runner and result-import contract checks passed.`);
