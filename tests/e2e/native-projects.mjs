// Download real native games, run their learner code, then import source-bound reports/replays.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { newPage, root } from './helpers.mjs';

const compilers = {
  c: process.env.CC || 'cc',
  cpp: process.env.CXX || 'c++',
  zig: process.env.ZIG || (fs.existsSync('/tmp/native-zig/zig') ? '/tmp/native-zig/zig' : 'zig'),
};
function run(command, args, directory, input) {
  const result = spawnSync(command, args, { cwd: directory, input, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, ZIG: compilers.zig } });
  assert(!result.error, `${command}: ${result.error?.message}`);
  assert.equal(result.status, 0, result.stderr + '\n' + result.stdout);
  return result;
}
function build(bundle, directory) {
  if (bundle.language === 'zig') run(compilers.zig, ['build-exe', 'main.zig', '-lc', '-femit-bin=game'], directory);
  else run(compilers[bundle.language], [bundle.language === 'c' ? '-std=c17' : '-std=c++20', ...bundle.learnerFiles, bundle.language === 'c' ? 'main.c' : 'main.cpp', '-o', 'game'], directory);
  return path.join(directory, process.platform === 'win32' ? 'game.exe' : 'game');
}
async function lastFrame(page) {
  await page.locator('#npframe').evaluate(range => { range.value = range.max; range.dispatchEvent(new Event('input')); });
  return JSON.parse(await page.locator('#npraw').textContent());
}
async function selectLanguage(page, language) {
  await page.locator('#nplanguage').selectOption(language);
  await page.waitForFunction(language => document.querySelector('#nplanguage')?.value === language && document.querySelector('#npcode'), language);
}

export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'native project browser '));
  try {
    await page.addInitScript(() => localStorage.setItem('sil:mode', JSON.stringify('gamedev')));
    await page.goto(url + '#/native-projects');
    await page.waitForFunction(() => window.NativePractice && window.NativeProjectReplay && document.querySelector('a[href^="#/native-project/"]'));
    ok(await page.locator('a[href^="#/native-project/"]').count() === 2, 'both playable native projects are offered through the normal integrated routes');
    const cases = [];
    for (const id of ['tile-runner', 'wave-arena']) {
      section(id + ': real native play and local receipts');
      await page.go(url, '#/native-project/' + id); await page.locator('#npcode').waitFor();
      const project = await page.evaluate(id => window.NATIVE_PROJECTS.items.find(project => project.id === id), id);
      for (const language of ['c', 'zig', 'cpp']) {
        await selectLanguage(page, language);
        const bundle = JSON.parse(fs.readFileSync(path.join(root, 'content/native-projects', `${id}-${language}.json`), 'utf8'));
        const learner = bundle.learnerFiles[0], reference = bundle.solution[learner];
        await page.locator('#npcode').fill(reference);
        ok(await page.locator('.native-editor .token').count() > 0, id + '/' + language + ' editable mechanics is highlighted');
        const pending = page.waitForEvent('download'); await page.locator('#npdownload').click();
        const download = await pending, directory = path.join(temporary, id, language); fs.mkdirSync(directory, { recursive: true });
        run('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])', await download.path(), directory]);
        const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'lab-manifest.json')));
        ok(download.suggestedFilename() === `${id}-${language}.zip` && manifest.exerciseId === 'native-project-' + id && manifest.sourceNames.includes(learner) && manifest.supportNames.some(name => name.startsWith('main.')), id + '/' + language + ' complete ZIP includes real native harness and source-bound tests');
        run(process.execPath, ['lab-test.mjs'], directory);
        const reportPath = path.join(directory, 'lab-results.json'), report = JSON.parse(fs.readFileSync(reportPath));
        ok(report.status === 'passed' && report.cases.length >= 6, id + '/' + language + ' local compiler runs multiple named mechanic scenarios');
        await page.locator('#npresults input[type=file]').setInputFiles(reportPath); await page.locator('.native-record-result').waitFor();
        ok(await page.locator('.native-source-status').innerText() === 'The tested source matches the current editor.', id + '/' + language + ' actual local report matches the edited source');
        await page.locator('.native-record-result').click();
        await page.waitForFunction(() => document.querySelector('.native-source-status')?.textContent.includes('recorded'));
        ok(await page.evaluate(({ id, language }) => JSON.parse(localStorage.getItem('sil:gd:nativeProjectPasses'))?.[id]?.[language]?.evidence === 'local-report', { id, language }), id + '/' + language + ' imported local receipt records completion');
        await page.locator('#npcode').fill(reference + '\n// edited after receipt');
        ok(await page.locator('.native-record-result').isDisabled() && (await page.locator('.native-source-status').textContent()).includes('Source edited'), id + '/' + language + ' editing after import invalidates the displayed receipt');
        await page.locator('#npcode').fill(reference);
        const executable = build(bundle, directory);
        const produced = run(executable, ['--replay', project.winningReplay], directory).stdout;
        const replayPath = path.join(directory, 'reference.ndjson'); fs.writeFileSync(replayPath, produced);
        await page.locator('#npreplay').setInputFiles(replayPath); await page.locator('#npreplayview').waitFor({ state: 'visible' });
        const nativeFrame = JSON.parse(produced.trim().split('\n').at(-1)), displayed = await lastFrame(page);
        ok((await page.locator('#npstats').textContent()).includes('WIN'), id + '/' + language + ' native executable produces a playable win shown in the browser');
        ok(JSON.stringify(displayed) === JSON.stringify(nativeFrame), id + '/' + language + ' displayed frame equals actual producer output without simulation');
        const interactive = run(executable, [], directory, project.winningReplay + '\nq\n');
        ok(interactive.stdout.includes('YOU WIN'), id + '/' + language + ' terminal keyboard input plays the same native game');
        cases.push({ id, language, project, replayPath, produced });

        // Change only learner-owned mechanics, leaving the native main and renderer untouched.
        const changedSource = id === 'tile-runner' ? reference.replaceAll("'#'", "'?'") : reference.replace(/cooldown\s*=\s*3/g, 'cooldown = 0');
        assert.notEqual(changedSource, reference, 'The fixture must change editable mechanics.');
        fs.writeFileSync(path.join(directory, learner), changedSource);
        const changedOutput = run(build(bundle, directory), ['--replay', id === 'tile-runner' ? 'a' : 'ff'], directory).stdout;
        const changedPath = replayPath; // Rebuild and reselect the same export filename.
        fs.writeFileSync(changedPath, changedOutput);
        await page.locator('#npreplay').setInputFiles(changedPath);
        const frameCount = changedOutput.trim().split('\n').length - 1;
        await page.waitForFunction(max => document.querySelector('#npframe')?.max === String(max), frameCount - 1);
        const changedFrame = await lastFrame(page);
        ok(id === 'tile-runner' ? changedFrame.x === 0 && (await page.locator('#npboard').textContent()).split('\n')[1][0] === '@' : changedFrame.fired && changedFrame.cooldown === 0, id + '/' + language + ' reimporting the same filename preserves changed learner collision/cooldown output');
        fs.writeFileSync(replayPath, produced); // Keep the reference fixture for restoration checks.
      }
    }

    section('replay boundaries, restoration and mobile rendering');
    const selected = cases.at(-1), lines = selected.produced.trim().split('\n'), header = JSON.parse(lines[0]);
    for (const [field, value] of [['version', 2], ['language', 'c'], ['project', 'tile-runner']]) {
      const wrong = path.join(temporary, 'wrong-' + field + '.ndjson');
      fs.writeFileSync(wrong, JSON.stringify({ ...header, [field]: value }) + '\n' + lines.slice(1).join('\n'));
      await page.locator('#npreplay').setInputFiles(wrong);
      await page.waitForFunction(() => document.querySelector('#npreplaystatus')?.textContent.includes('another project, version or language'));
      ok(await page.locator('#npreplayview').isHidden(), 'mismatched replay ' + field + ' is rejected before rendering');
    }
    await page.locator('#npreplay').setInputFiles(selected.replayPath); await page.locator('#npreplayview').waitFor({ state: 'visible' });
    await page.reload(); await page.locator('#npcode').waitFor(); await page.locator('#npreplayview').waitFor({ state: 'visible' });
    ok((await page.locator('#npreplaystatus').textContent()).startsWith('Restored native output') && JSON.stringify(await lastFrame(page)) === JSON.stringify(JSON.parse(lines.at(-1))), 'validated native replay survives reload in its project/language namespace');
    await selectLanguage(page, 'c'); await page.locator('#npreplayview').waitFor({ state: 'visible' });
    ok((await page.locator('#npreplaystatus').textContent()).includes('C17'), 'language switch restores its own native replay rather than displaying another language output');
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#npboard').scrollIntoViewIfNeeded();
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'native project source, commands and replay board fit the mobile page');
    ok(await page.evaluate(() => {
      const player = document.querySelector('#npboard .np-cell-player'), floor = document.querySelector('#npboard .np-cell-floor');
      return player && floor && getComputedStyle(player).color !== getComputedStyle(floor).color;
    }), 'native replay player and floor glyphs have distinct readable styling');
    ok(page.errors.length === 0, 'native project pages have no browser errors ' + page.errors.slice(0, 3).join(' | '));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
    await page.context().close();
  }
}
