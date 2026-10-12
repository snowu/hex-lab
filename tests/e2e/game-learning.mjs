import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {newPage, root} from './helpers.mjs';

export default async function ({url, browser, ok, section}) {
  const page = await newPage(browser);
  await page.goto(url);
  await page.evaluate(() => {
    localStorage.setItem('sil:mode', '"gamedev"');
    localStorage.setItem('sil:gd:kataLanguage', '"c"');
    localStorage.setItem('sil:gd:kataPasses', '{}');
  });
  await page.reload();
  await page.go(url, '#/game-katas');
  await page.locator('#gklist .dcard').first().waitFor();

  section('Complete curated curriculum');
  const coverage = await page.evaluate(() => {
    const ui = GAME_LEARNING_UI, known = new Set(ui.items.map(item => item.id));
    const records = ui.items.map(item => ui.metadata(item));
    function cyclic(id, ancestors = new Set()) {
      if (ancestors.has(id)) return true;
      const next = new Set([...ancestors, id]);
      return (ui.metadata(ui.items.find(item => item.id === id)).prereqs || []).some(pre => cyclic(pre, next));
    }
    return {
      items: ui.items.length,
      records: Object.keys(GAME_LEARNING.exercises).length,
      hints: records.every(meta => meta.hints?.length === 3 && meta.hints.every(hint => hint.length > 20)),
      contexts: new Set(records.map(meta => meta.gameContext)).size,
      reference: records.every(meta => meta.explanation?.length > 40 && meta.complexity?.length >= 8 && meta.tradeoffs?.length > 30),
      examples: records.every(meta => meta.examples?.length && meta.examples.every(example => example.input && example.output)),
      prerequisites: records.every(meta => (meta.prereqs || []).every(id => known.has(id))),
      cycles: ui.items.some(item => cyclic(item.id)),
      paths: ui.paths.length,
      validSteps: ui.paths.every(path => path.steps.length >= 5 && path.steps.every(id => known.has(id))),
      wordSearch: GAME_LEARNING.exercises['word-search'].examples[0].output,
    };
  });
  ok(coverage.items === 150 && coverage.records === 150, 'all 150 original/catalog exercises have teaching metadata');
  ok(coverage.hints && coverage.contexts === 150, 'every exercise has three substantial hints and a distinct game context');
  ok(coverage.reference && coverage.examples, 'every exercise has explained complexity/tradeoffs and visible behavior examples');
  ok(coverage.prerequisites && !coverage.cycles, 'suggested prerequisites resolve and do not form cycles');
  ok(coverage.paths >= 6 && coverage.validSteps, 'ordered learning paths reference real exercises');
  ok(/zero-based/.test(coverage.wordSearch), 'word-search teaching example follows the native zero-based contract');
  ok(await page.locator('#gklist .dcard').count() === 150, 'full catalog remains accessible');

  section('Topic, difficulty, collection and preparation filters');
  await page.locator('#gkgroup').selectOption('catalog');
  ok(await page.locator('#gklist .dcard').count() === 139, 'collection filter keeps all139catalog exercises');
  await page.locator('#gktopic').selectOption('memory');
  const memory = await page.evaluate(() => [...document.querySelectorAll('#gklist [data-kata-id]')].map(node => GAME_LEARNING_UI.metadata(GAME_LEARNING_UI.items.find(item => item.id === node.dataset.kataId)).topics.includes('memory')));
  ok(memory.length > 5 && memory.every(Boolean), 'topic filter matches actual per-exercise concepts');
  await page.locator('#gkclear').click();
  await page.locator('#gkdifficulty').selectOption('advanced');
  ok(await page.locator('#gklist [data-difficulty="beginner"]').count() === 0 && await page.locator('#gklist [data-kata-id="exercism-book-store"]').count() === 1, 'difficulty filter selects advanced work');
  await page.locator('#gkclear').click();
  await page.locator('#gkreadiness').selectOption('practice');
  ok(await page.locator('#gklist [data-kata-id="exercism-react"]').count() === 1, 'unpracticed prerequisites can be discovered');
  await page.go(url, '#/game-kata/exercism-react');
  await page.locator('#gkcode').waitFor();
  ok(await page.locator('h1').textContent() === 'React' && await page.locator('.gk-preparation').innerText().then(text => text.includes('Every exercise remains open')), 'prerequisites are guidance and do not block the editor');
  await page.go(url, '#/game-katas');
  await page.locator('#gkclear').click();
  await page.locator('#gkfilter').fill('Alphametics');
  ok(await page.locator('#gklist .dcard').count() === 1, 'catalog search continues to find individual exercises');
  await page.locator('#gkclear').click();

  section('Ordered paths and language-specific progress');
  await page.evaluate(() => localStorage.setItem('sil:gd:kataPasses', JSON.stringify({
    'exercism-hello-world': {c: Date.now(), zig: Date.now()},
    'exercism-two-fer': {c: Date.now()},
  })));
  await page.go(url, '#/game-path/native-basics');
  ok((await page.locator('#gkpathprogress').innerText()).includes('2/7'), 'path progress counts only current-language passes');
  await page.locator('#gkpathlanguage').selectOption('zig');
  ok((await page.locator('#gkpathprogress').innerText()).includes('1/7') && (await page.locator('#gkpathprogress').innerText()).includes('Zig'), 'changing language changes path progress independently');
  await page.locator('#gkpathlanguage').selectOption('c');
  await page.go(url, '#/game-path/movement-pong');
  ok(await page.locator('a[href="#/native-project/tile-runner"]').count() === 1 && await page.locator('a[href="#/native-project/wave-arena"]').count() === 1, 'movement path leads to the real native game projects');
  await page.go(url, '#/game-kata/cooldown');
  await page.locator('#gkcode').waitFor();
  ok(await page.locator('#gknext').getAttribute('href') === '#/game-kata/movement', 'next exercise follows the chosen path order');

  section('Examples, expected failures and progressive hints');
  ok(await page.locator('.gk-examples tbody tr').count() >= 3 && /1.75 seconds/.test(await page.locator('.gk-examples').innerText()), 'simple mechanics show concrete inputs and expected results before editing');
  ok(/intentionally incomplete/.test(await page.locator('.gk-expected-failure').innerText()), 'starter failure is explained before running native tests');
  ok(!(await page.locator('#gkhintout').isVisible()) && !(await page.locator('#gkref').isVisible()), 'hints and full reference start hidden');
  await page.locator('#gkhint').click();
  ok(await page.locator('#gkhintsteps > li').count() === 1, 'first reveal gives the conceptual hint only');
  await page.locator('#gkhintnext').click();
  ok(await page.locator('#gkhintsteps > li').count() === 2, 'second reveal introduces implementation strategy');
  await page.locator('#gkhintnext').click();
  ok(await page.locator('#gkhintsteps > li').count() === 3 && /API and edge cases/.test(await page.locator('#gkhintsteps').innerText()), 'third reveal covers native API and boundary cases');
  await page.locator('#gkhint').click();
  ok(!(await page.locator('#gkhintout').isVisible()), 'existing Hint control still toggles the panel');
  await page.locator('#gksolution').click();
  const reference = await page.locator('#gkref').innerText();
  ok(reference.includes('Ownership in C') && reference.includes('Complexity') && reference.includes('Tradeoff to discuss'), 'reference explains reasoning and ownership alongside code');
  ok(await page.locator('#gkextensions .native-results').count() === 1, 'local runner/results extension mounts inside the new UI');

  section('Drafts, imported evidence and manual completion');
  await page.locator('#gkcode').fill('// independent C learning draft\n');
  await page.locator('#gklanguage').selectOption('zig');
  await page.waitForFunction(() => document.querySelector('#gklanguage')?.value === 'zig' && document.querySelector('#gkcode'));
  await page.locator('#gkcode').fill('// independent Zig learning draft\n');
  await page.locator('#gklanguage').selectOption('c');
  await page.waitForFunction(() => document.querySelector('#gklanguage')?.value === 'c' && document.querySelector('#gkcode'));
  ok(await page.locator('#gkcode').inputValue() === '// independent C learning draft\n', 'curriculum repaint preserves language-specific editor drafts');
  await page.evaluate(() => localStorage.setItem('sil:gd:kataEvidence', JSON.stringify({cooldown: {c: {status: 'passed', sourceHash: 'prior-local-source', testHash: 'test-fixture', timestamp: 'fixture'}}})));
  await page.reload();
  await page.locator('#gkcode').waitFor();
  await page.locator('#gkpass').click();
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('sil:gd:kataEvidence')).cooldown.c.sourceHash) === 'prior-local-source', 'self-report does not overwrite previously imported evidence');
  ok(/Local results imported/.test(await page.locator('#gkevidence').innerText()), 'imported results remain distinguished from self-reported completion');
  await page.go(url, '#/game-kata/exercism-hamming');
  await page.locator('#gkfile').waitFor();
  const names = await page.locator('#gkfile option').evaluateAll(nodes => nodes.map(node => node.value));
  const header = names.find(name => name.endsWith('.h'));
  if (header) {
    await page.locator('#gkfile').selectOption(header);
    await page.locator('#gkcode').fill('// selected header draft\n');
    await page.reload();
    await page.locator('#gkcode').waitFor();
    ok(await page.locator('#gkfile').inputValue() === header && await page.locator('#gkcode').inputValue() === '// selected header draft\n', 'selected native file and its draft survive reload');
  } else ok(false, 'catalog header fixture exists');

  section('Real kata packages and source-bound local receipts');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kata learning browser '));
  const screenshotDirectory = path.join(root, 'docs/screenshots/learning-quality');
  fs.mkdirSync(screenshotDirectory, {recursive: true});
  const execute = (command, args, directory, expected) => {
    const result = spawnSync(command, args, {cwd: directory, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024, env: {...process.env, ZIG: process.env.ZIG || '/tmp/native-zig/zig'}});
    if (result.error) throw result.error;
    if (expected !== undefined && result.status !== expected) throw Error(result.stderr + '\n' + result.stdout);
    return result;
  };
  try {
    for (const id of ['cooldown', 'exercism-hamming']) {
      await page.go(url, '#/game-kata/' + id);
      await page.locator('#gkcode').waitFor();
      for (const language of ['c', 'cpp', 'zig']) {
        await page.locator('#gklanguage').selectOption(language);
        await page.waitForFunction(language => document.querySelector('#gklanguage')?.value === language && document.querySelector('#gkcode'), language);
        const bundle = id === 'cooldown'
          ? await page.evaluate(language => {
            const native = GAME_KATAS.find(item => item.id === 'cooldown').native[language], filename = 'cooldown.' + (language === 'cpp' ? 'cpp' : language);
            return {starter: {[filename]: native.starter}, solution: {[filename]: native.solution}};
          }, language)
          : JSON.parse(fs.readFileSync(path.join(root, 'content/katas/native', 'hamming-' + language + '.json')));
        for (const [filename, source] of Object.entries(bundle.starter)) {
          await page.locator('#gkfile').selectOption(filename);
          await page.locator('#gkcode').fill(source);
        }
        const pending = page.waitForEvent('download');
        await page.locator('#gkextensions .native-runner-download').click();
        const download = await pending, directory = path.join(temporary, id, language);
        fs.mkdirSync(directory, {recursive: true});
        execute('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])', await download.path(), directory], temporary, 0);
        const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'lab-manifest.json')));
        ok(manifest.exerciseId === id && manifest.language === language && manifest.combine === (id === 'cooldown'), id + '/' + language + ' ZIP uses the correct single-file/catalog compile configuration');
        ok(manifest.sourceNames.every(filename => fs.readFileSync(path.join(directory, filename), 'utf8') === bundle.starter[filename]) && manifest.testNames.length > 0 && manifest.testNames.every(filename => fs.existsSync(path.join(directory, filename))), id + '/' + language + ' package retains exact learner source and immutable native tests');
        if (id !== 'cooldown') ok(fs.readFileSync(path.join(directory, 'LICENSE'), 'utf8').includes('Permission is hereby granted') && fs.readFileSync(path.join(directory, 'README.md'), 'utf8').includes('Authors:'), id + '/' + language + ' catalog runner ZIP preserves license and attribution');
        const starter = execute(process.execPath, ['lab-test.mjs'], directory);
        const reportPath = path.join(directory, 'lab-results.json');
        const failure = JSON.parse(fs.readFileSync(reportPath));
        ok(starter.status !== 0 && failure.status === 'failed' && failure.cases.some(test => test.status === 'failed'), id + '/' + language + ' actual starter compilation/tests produce a failing local receipt');
        await page.locator('#gkextensions input[type=file]').setInputFiles(reportPath);
        await page.waitForFunction(() => document.querySelector('.native-report-summary')?.textContent.includes('failed'));
        ok(await page.locator('.native-record-result').count() === 0, id + '/' + language + ' failing local tests cannot record a pass');
        const immutable = Object.fromEntries([...manifest.testNames, ...manifest.supportNames].map(filename => [filename, fs.readFileSync(path.join(directory, filename), 'utf8')]));
        for (const [filename, source] of Object.entries(bundle.solution)) fs.writeFileSync(path.join(directory, filename), source);
        execute(process.execPath, ['lab-test.mjs'], directory, 0);
        const success = JSON.parse(fs.readFileSync(reportPath));
        ok(success.status === 'passed' && Object.entries(immutable).every(([filename, text]) => fs.readFileSync(path.join(directory, filename), 'utf8') === text), id + '/' + language + ' reference passes the unchanged downloaded tests');
        await page.locator('#gkextensions input[type=file]').setInputFiles(reportPath);
        await page.locator('.native-load-source').waitFor({timeout:5000}).catch(async error => { throw Error(error.message + ' Feedback: ' + await page.locator('#gkextensions .native-report').innerText()); });
        ok(await page.locator('.native-record-result').isDisabled(), id + '/' + language + ' locally edited source must be reviewed/loaded before recording');
        await page.locator('.native-load-source').click();
        const filename = await page.locator('#gkfile').inputValue();
        ok(await page.locator('#gkcode').inputValue() === bundle.solution[filename], id + '/' + language + ' source import updates the actual editor with the tested file');
        await page.locator('.native-record-result').click();
        await page.waitForFunction(() => document.querySelector('.native-source-status')?.textContent.includes('recorded'));
        ok(await page.evaluate(({id, language}) => {
          const evidence = JSON.parse(localStorage.getItem('sil:gd:kataEvidence'))?.[id]?.[language];
          return Boolean(JSON.parse(localStorage.getItem('sil:gd:kataPasses'))?.[id]?.[language]) && evidence?.status === 'passed' && /^[a-f0-9]{64}$/.test(evidence.sourceHash);
        }, {id, language}), id + '/' + language + ' completion stores genuine source-bound local evidence');
        if (id === 'exercism-hamming' && language === 'zig') await page.locator('#gkextensions .native-results').screenshot({path: path.join(screenshotDirectory, 'imported-kata-local-results.png')});
        await page.locator('#gkcode').fill(bundle.solution[filename] + '\n// modified after the tested run\n');
        ok(await page.locator('.native-record-result').isDisabled() && /Source edited/.test(await page.locator('.native-source-status').textContent()), id + '/' + language + ' editing after an imported run invalidates fresh-pass recording');
        // Re-import mismatched metadata, then edit: rejected imports must not leave stale event listeners crashing.
        const wrongPath = path.join(directory, 'wrong-language.json');
        fs.writeFileSync(wrongPath, JSON.stringify({...success, language: language === 'c' ? 'cpp' : 'c'}));
        await page.locator('#gkextensions input[type=file]').setInputFiles(wrongPath);
        await page.waitForFunction(() => document.querySelector('.native-report-error')?.textContent.includes('another language'));
        await page.locator('#gkcode').fill(bundle.solution[filename] + '\n// editing after a rejected import\n');
        ok(page.errors.length === 0 && await page.locator('.native-record-result').count() === 0, id + '/' + language + ' wrong-language receipts are rejected and subsequent typing stays safe');
        if (language === 'c') {
          fs.appendFileSync(path.join(directory, manifest.testNames[0]), '\n// changed test fixture fingerprint\n');
          execute(process.execPath, ['lab-test.mjs'], directory, 0);
          await page.locator('#gkextensions input[type=file]').setInputFiles(reportPath);
          await page.waitForFunction(() => document.querySelector('.native-report-error')?.textContent.includes('tests have changed'));
          ok(await page.locator('.native-record-result').count() === 0, id + ' receipt from altered test files is rejected');
        }
      }
    }
    await page.go(url, '#/game-katas');
    await page.locator('#gkclear').click();
    await page.locator('#gklist .dcard').first().waitFor({state:'visible'});
    await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0,0); });
    await page.locator('h1').scrollIntoViewIfNeeded();
    await page.screenshot({path: path.join(screenshotDirectory, 'guided-kata-catalog.png'), fullPage: false, animations:'disabled'});
    await page.go(url, '#/game-kata/cooldown');
    await page.locator('#gkcode').waitFor();
    await page.locator('#gkhint').click();
    await page.locator('#gkhintnext').click();
    await page.locator('#gkhintnext').click();
    await page.locator('#gkhintout').screenshot({path: path.join(screenshotDirectory, 'progressive-kata-hints.png')});
    await page.locator('#gksolution').click();
    await page.locator('#gkref').screenshot({path: path.join(screenshotDirectory, 'explained-kata-reference.png')});
    await page.setViewportSize({width: 390, height: 844});
    await page.evaluate(() => window.scrollTo(0,0));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path: path.join(screenshotDirectory, 'mobile-exercise-header.png'), animations:'disabled'});
    await page.setViewportSize({width: 1280, height: 1000});
  } finally {fs.rmSync(temporary, {recursive: true, force: true});}

  section('Mobile paths and exercise access');
  await page.setViewportSize({width: 390, height: 844});
  await page.go(url, '#/game-kata/cooldown');
  await page.locator('#gklanguage').waitFor();
  await page.evaluate(() => window.scrollTo(0,0));
  const selectorY = await page.locator('#gklanguage').boundingBox();
  ok(selectorY.y < 650, 'language selector stays near the top of the mobile exercise');
  await page.setViewportSize({width: 390, height: 844});
  await page.go(url, '#/game-katas');
  await page.locator('#gkclear').click();
  const dimensions = await page.evaluate(() => ({width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth}));
  ok(dimensions.scroll <= dimensions.width + 1, 'learning paths and filters fit a mobile viewport');
  await page.locator('[data-learning-path="native-basics"]').click();
  ok(await page.locator('[data-path-step]').count() === 7, 'ordered curriculum remains usable on mobile');
  ok(page.errors.length === 0, 'no browser errors from curriculum or extension lifecycle: ' + JSON.stringify(page.errors));
  await page.close();
}
