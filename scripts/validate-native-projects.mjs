// Compile actual games/tests, then prove learner mechanics alter native gameplay output.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const context = vm.createContext({ window: { LAB_VIEWS: [] } });
vm.runInContext(fs.readFileSync(path.join(root, 'content/native-projects.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/game/native-projects.js'), 'utf8'), context);
const projects = context.window.NATIVE_PROJECTS.items;
const replayDirectory = process.argv.find(argument => argument.startsWith('--replay-dir='))?.slice('--replay-dir='.length);
if (replayDirectory) fs.mkdirSync(replayDirectory, { recursive: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'native-playable-projects-'));
const compilers = { c: process.env.CC || 'cc', cpp: process.env.CXX || 'c++', zig: process.env.ZIG || (fs.existsSync('/tmp/native-zig/zig') ? '/tmp/native-zig/zig' : 'zig') };
let checks = 0;
const check = (condition, message) => { assert(condition, message); checks++; console.log('PASS ' + message); };
function execute(command, args, cwd, input) {
  const result = spawnSync(command, args, { cwd, input, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
  assert(!result.error, `${command} ${args.join(' ')}: ${result.error?.message}`);
  return result;
}
function compileGame(bundle, directory) {
  const args = bundle.language === 'zig' ? ['build-exe', 'main.zig', '-lc', '-femit-bin=game'] : [bundle.language === 'c' ? '-std=c17' : '-std=c++20', ...bundle.learnerFiles, bundle.language === 'c' ? 'main.c' : 'main.cpp', '-o', 'game'];
  const result = execute(compilers[bundle.language], args, directory);
  check(result.status === 0, `${bundle.id}/${bundle.language} native game compiles\n${result.status === 0 ? '' : result.stderr}`);
  return path.join(directory, process.platform === 'win32' ? 'game.exe' : 'game');
}
function runTests(bundle, directory) {
  if (bundle.language === 'zig') return execute(compilers.zig, ['test', bundle.packageConfig.testEntry], directory);
  const build = execute(compilers[bundle.language], [bundle.language === 'c' ? '-std=c17' : '-std=c++20', ...bundle.packageConfig.compileNames, '-o', 'project-tests'], directory);
  check(build.status === 0, `${bundle.id}/${bundle.language} test source compiles\n${build.status === 0 ? '' : build.stderr}`);
  return execute(path.join(directory, process.platform === 'win32' ? 'project-tests.exe' : 'project-tests'), [], directory);
}
function replay(project, bundle, executable, actions, directory, label) {
  const result = execute(executable, ['--replay', actions], directory);
  check(result.status === 0, `${project.id}/${bundle.language}/${label} native replay command succeeds`);
  const parsed = context.window.NativeProjectReplay.parse(project, bundle.language, result.stdout);
  check(parsed.frames.length > 1, `${project.id}/${bundle.language}/${label} exports actual native state frames`);
  if (replayDirectory) fs.writeFileSync(path.join(replayDirectory, `${project.id}-${bundle.language}-${label}.ndjson`), result.stdout);
  return { text: result.stdout, parsed };
}

try {
  const languageFrames = new Map();
  for (const project of projects) for (const language of ['c', 'zig', 'cpp']) {
    const bundle = JSON.parse(fs.readFileSync(path.join(root, 'content/native-projects', `${project.id}-${language}.json`), 'utf8'));
    const directory = path.join(temporary, project.id, language); fs.mkdirSync(directory, { recursive: true });
    for (const [name, content] of Object.entries(bundle.files)) fs.writeFileSync(path.join(directory, name), content);
    for (const [name, content] of Object.entries(bundle.solution)) fs.writeFileSync(path.join(directory, name), content);
    const referenceTests = runTests(bundle, directory);
    check(referenceTests.status === 0, `${project.id}/${language} reference passes named scenarios\n${referenceTests.status === 0 ? '' : referenceTests.stderr + referenceTests.stdout}`);
    const executable = compileGame(bundle, directory);
    const reference = replay(project, bundle, executable, project.winningReplay, directory, 'reference');
    check(reference.parsed.frames.at(-1).won === true, `${project.id}/${language} actual native replay reaches a win`);
    const interactive = execute(executable, [], directory, project.winningReplay + '\nq\n');
    check(interactive.status === 0 && interactive.stdout.includes('YOU WIN') && interactive.stdout.includes(project.kind === 'runner' ? '#########' : '|.........|'), `${project.id}/${language} terminal keyboard input plays the real rendered game`);
    const comparable = JSON.stringify(reference.parsed.frames);
    if (languageFrames.has(project.id)) check(languageFrames.get(project.id) === comparable, `${project.id}/${language} gameplay/replay behavior matches the other native language`);
    else languageFrames.set(project.id, comparable);
    if (project.kind === 'arena') {
      const loss = replay(project, bundle, executable, '.'.repeat(16), directory, 'loss');
      check(loss.parsed.frames.at(-1).health === 0 && !loss.parsed.frames.at(-1).won, `${project.id}/${language} ignored enemies really end the game`);
    }
    for (const [name, content] of Object.entries(bundle.starter)) fs.writeFileSync(path.join(directory, name), content);
    const starterTests = runTests(bundle, directory);
    check(starterTests.status !== 0 && (language !== 'zig' || /failed\./.test(starterTests.stderr)), `${project.id}/${language} starter compiles and fails a named mechanic test`);
    const brokenExecutable = compileGame(bundle, directory);
    const broken = replay(project, bundle, brokenExecutable, project.winningReplay, directory, 'starter');
    check(!broken.parsed.frames.at(-1).won && broken.text !== reference.text, `${project.id}/${language} broken learner code changes playable state and cannot win the reference route`);

    // A focused learner-code mutation changes native frames even with the identical harness.
    for (const [name, source] of Object.entries(bundle.solution)) {
      const changed = project.kind === 'runner' ? source.replaceAll("'#'", "'?'") : source.replace(/cooldown\s*=\s*3/g, 'cooldown = 0');
      check(changed !== source, `${project.id}/${language} validator changes only an editable mechanic`);
      fs.writeFileSync(path.join(directory, name), changed);
    }
    const mutatedExecutable = compileGame(bundle, directory);
    const actions = project.kind === 'runner' ? 'a' : 'ff';
    const changed = replay(project, bundle, mutatedExecutable, actions, directory, 'changed-mechanic');
    for (const [name, source] of Object.entries(bundle.solution)) fs.writeFileSync(path.join(directory, name), source);
    const unchangedExecutable = compileGame(bundle, directory);
    const unchanged = replay(project, bundle, unchangedExecutable, actions, directory, 'original-mechanic');
    check(changed.text !== unchanged.text, `${project.id}/${language} changing the callback changes the real native game output`);
    if (project.kind === 'runner') check(changed.parsed.frames.at(-1).x === 0 && unchanged.parsed.frames.at(-1).x === 1, `${project.id}/${language} renderer receives the learner's collision outcome, not a browser recomputation`);
    else check(changed.parsed.frames.at(-1).fired && !unchanged.parsed.frames.at(-1).fired, `${project.id}/${language} renderer receives the learner's cooldown outcome, not a browser recomputation`);

    // Replay imports are tied to the selected project/version/language and validate structure.
    const firstLine = reference.text.indexOf('\n'), header = JSON.parse(reference.text.slice(0, firstLine));
    for (const bad of [{ ...header, project: 'another-project' }, { ...header, version: 2 }, { ...header, language: language === 'c' ? 'zig' : 'c' }]) assert.throws(() => context.window.NativeProjectReplay.parse(project, language, JSON.stringify(bad) + reference.text.slice(firstLine)), /another project, version or language/);
    assert.throws(() => context.window.NativeProjectReplay.parse(project, language, '{broken'), /header|JSON/);
    assert.throws(() => context.window.NativeProjectReplay.parse(project, language, JSON.stringify(header) + '\n{"type":"frame","tick":0,"won":false}'), /invalid fields/);
    check(true, `${project.id}/${language} replay importer rejects foreign or malformed native output`);
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
console.log(`${checks} native playable project checks passed across C17, Zig 0.17 and C++20.`);
