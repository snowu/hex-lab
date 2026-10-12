import { newPage } from './helpers.mjs';
// Timed mode, shuffled quizzes, bug hunts, predict, read/practice modes, vim, plan + diagnostic, design lab, stories, backup.
export default async function ({ url, browser, ok, section }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: 'dark', acceptDownloads: true });
  const page = await newPage(ctx);
  await page.goto(url + '#/'); await page.waitForTimeout(700);

  section('timed mode');
  await page.go(url, '#/lesson/pat-window', 300);
  const ex = page.locator('.ex').first();
  await ex.locator('.timed').click(); await ex.locator('.tclock').waitFor({ state: 'visible', timeout: 60000 });
  ok(await ex.locator('.hint').isDisabled() && await ex.locator('.sol').isDisabled(), 'hints and solution are locked during a timed attempt');
  const sol = await page.evaluate(() => TRACKS.find((t) => t.id === 'patterns').lessons.find((l) => l.id === 'pat-window').sections.find((s) => s.type === 'code').solution);
  await page.evaluate((s) => document.querySelector('.CodeMirror').CodeMirror.setValue(s), sol);
  await ex.locator('.run').click(); await ex.locator('.out .allpass').first().waitFor({ timeout: 60000 });
  const att = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:attempts')));
  ok(att.length === 1 && att[0].ok && /Solved in/.test(await ex.locator('.out').innerText()), 'a timed solve is recorded and announced');

  section('quizzes are shuffled, wrong answers flagged');
  await page.go(url, '#/lesson/senior-signals', 300);
  const qz = page.locator('.quiz').first(); let wrong = 0;
  for (let i = 0; i < 4; i++) { await qz.locator('.opt').nth(i).click(); if (await qz.locator('.opt.right').count()) break; wrong++; }
  ok(await qz.locator('.opt.right').count() === 1 && await qz.locator('.opt.wrong').count() === wrong, `correct option found after ${wrong} wrong pick(s)`);
  const positions = await page.evaluate(() => { const c = [0, 0, 0, 0]; for (const t of TRACKS) for (const l of t.lessons) for (const s of l.sections) if (s.type === 'quiz') c[s.answer]++; return c; });
  ok(Math.max(...positions) > 0, 'authored answer positions are only the source order (rendering shuffles them): ' + JSON.stringify(positions));

  section('bug hunt and predict');
  await page.go(url, '#/lesson/async-patterns', 300);
  const bug = page.locator('.bug-code').first(), bex = page.locator('.ex').filter({ has: page.locator('.bug-code') });
  await bug.locator('[data-n="1"]').click(); await page.locator('.bcheck').click();
  ok((await bex.locator('.out').innerText()).includes('0/2'), 'a wrong line scores 0/2');
  await bug.locator('[data-n="1"]').click(); await bug.locator('[data-n="6"]').click(); await bug.locator('[data-n="8"]').click(); await page.locator('.bcheck').click();
  await page.waitForSelector('.allpass'); ok(true, 'the right lines are accepted with explanations');
  const pred = page.locator('.quiz').filter({ hasText: 'completion order vs result order' });
  await pred.locator('.run').click(); await page.waitForSelector('.logs.actual', { timeout: 90000 });
  ok((await pred.locator('.logs.actual').innerText()).replace(/\s+/g, ' ') === "done b done c done a ['a', 'b', 'c']", 'predict runs the snippet for real');

  section('read / practice modes');
  await page.go(url, '#/lesson/design-framework', 300);
  await page.locator('.seg [data-m="read"]').click();
  ok(await page.locator('.quiz:visible').count() === 0 && await page.locator('.stepper').count() === 0, 'read mode hides practice and flattens walkthroughs');
  await page.locator('.seg [data-m="practice"]').click();
  ok(await page.locator('.sec.read:visible').count() === 0, 'practice mode hides the text');
  await page.locator('.seg [data-m="all"]').click();

  section('vim');
  await page.go(url, '#/lesson/maps-complexity', 300);
  await page.locator('.vimbtn').first().click();
  await page.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.setValue('one\ntwo\nthree'));
  await page.locator('.CodeMirror').first().click(); await page.keyboard.press('Escape'); await page.keyboard.type('ggdd');
  ok(await page.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.getValue()) === 'two\nthree', 'gg dd works');
  await page.locator('.vimbtn').first().click();

  section('plan and diagnostic');
  await page.go(url, '#/plan', 300);
  ok(await page.locator('.ptask').count() >= 3, 'a daily plan is generated');
  await page.locator('#dgo').click(); await page.locator('#dbegin').click();
  let n = 0; while (await page.locator('.opt').count()) { await page.locator('.opt').first().click(); n++; await page.waitForTimeout(40); if (n > 80) break; }
  const tracks = await page.evaluate(() => TRACKS.length);
  await page.waitForSelector('.diag .rrow');
  const dg = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:diag')));
  const right = Object.values(dg.tracks).reduce((a, v) => a + v.right, 0);
  ok(Object.keys(dg.tracks).length === tracks, `diagnostic scores all ${tracks} tracks (${n} questions)`);
  ok(right < n * 0.6, `always clicking the first option does not score well (${right}/${n})`);

  section('design lab, stories, backup');
  await page.go(url, '#/design/url-shortener', 300);
  await page.locator('#dstart').click(); await page.locator('textarea[data-s="scope"]').fill('must: create + redirect');
  await page.locator('#dhint').click(); await page.locator('#dfinish').click();
  ok(await page.locator('.cmp .col.ref').count() === 6, 'the reference design is shown beside your notes');
  await page.locator('#drub li').nth(0).click(); await page.locator('#dsave').click(); await page.waitForTimeout(300);
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem('sil:designhist')))).length === 1, 'a design rep is saved');
  await page.go(url, '#/stories', 300); await page.locator('#snew').click(); await page.locator('#stitle').fill('Test'); await page.locator('textarea[data-k="r"]').fill('cut p99 from 4s to 0.9s');
  ok(/^[0-5]\/5$/.test(await page.locator('.cscore b').innerText()), 'the story coach scores a draft');
  await page.go(url, '#/plan', 300);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#bexp').click()]);
  const text = await (await import('node:fs/promises')).readFile(await dl.path(), 'utf8');
  ok(JSON.parse(text).app === 'hex-lab', 'progress export produces a valid file');
  const fsp = await import('node:fs/promises'), osp = await import('node:os'), pathm = await import('node:path');
  const legacy = pathm.join(osp.tmpdir(), 'hex-legacy-export.json');
  await fsp.writeFile(legacy, JSON.stringify({ app: 'senior-interview-lab', version: 1, exported: new Date().toISOString(), data: { 'sil:xp': '42' } }));
  page.once('dialog', (d) => d.accept());
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.locator('#bimp').setInputFiles(legacy)]);
  ok(await page.evaluate(() => { try { return localStorage.getItem('sil:xp'); } catch { return null; } }) === '42', 'exports tagged with the old app name still import');
  ok(page.errors.length === 0, 'no uncaught errors ' + JSON.stringify(page.errors.slice(0, 2)));
  await ctx.close();
}
