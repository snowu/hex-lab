// Katas: the Exercism import, filters, and running a real unittest suite in the in-browser Python.
import fs from 'node:fs';
import path from 'node:path';
import { newPage, root } from './helpers.mjs';
export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  await page.goto(url + '#/katas'); await page.waitForTimeout(800);
  const total = await page.locator('.krow').count();
  ok(total >= 130, `the kata list shows the imported exercises (${total})`);
  ok(await page.locator('nav a[data-nav="kata"].on').count() === 1, 'the Katas nav link is highlighted');
  await page.locator('#kq').fill('two fer'.replace(' ', '-')); await page.waitForTimeout(200);
  ok(await page.locator('.krow').count() === 1, 'search narrows the list');
  await page.locator('#kq').fill('');
  await page.locator('[data-b="hard"]').click(); await page.waitForTimeout(200);
  const hard = await page.locator('.krow').count();
  ok(hard > 0 && hard < total, `the difficulty filter works (${hard} hard)`);
  await page.locator('[data-b="all"]').click(); await page.locator('#kpicks').click();
  const picks = await page.locator('.krow').count();
  ok(picks > 10 && picks < 60, `interview picks is a curated subset (${picks})`);

  section('running a kata');
  await page.go(url, '#/kata/two-fer', 1200);
  ok((await page.locator('.kd-body').innerText()).includes('One for you, one for me'), 'the exercise instructions are shown');
  ok(await page.locator('.CodeMirror').count() === 1, 'the editor is there');
  const box = await page.evaluate(() => { const d = document.querySelector('.kata-desc').getBoundingClientRect(), e = document.querySelector('.kata-work .CodeMirror').getBoundingClientRect(); return { dRight: d.right, eLeft: e.left, dTop: d.top, eTop: e.top, eBottom: e.bottom, vh: innerHeight }; });
  ok(box.dRight <= box.eLeft + 1 && Math.abs(box.dTop - box.eTop) < 400 && box.eTop < box.vh - 150, `desktop layout: description left, editor right, editor visible without scrolling (editor top ${Math.round(box.eTop)}px of ${box.vh})`);
  const narrow = await page.evaluate(() => getComputedStyle(document.querySelector('.kata-split')).gridTemplateColumns.split(' ').length);
  ok(narrow === 2, 'two columns on a wide screen');
  await page.locator('.run').click();
  await page.waitForSelector('.res', { timeout: 90000 });
  const failing = await page.locator('.res.fail').count();
  ok(failing >= 2, `the starter fails its unittest cases (${failing} failing)`);
  ok((await page.locator('.res.fail').first().innerText()).toLowerCase().includes('no name given'), 'test names come from the unittest methods');
  const kata = JSON.parse(fs.readFileSync(path.join(root, 'content/katas/python/two-fer.json'), 'utf8'));
  await page.evaluate((code) => document.querySelector('.CodeMirror').CodeMirror.setValue(code), kata.example);
  await page.locator('.run').click();
  await page.waitForSelector('.allpass', { timeout: 90000 });
  ok(true, 'the reference solution passes every test');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:progress') || '{}')['kata-two-fer']);
  ok(progress && progress.c0 === true, 'solving it is recorded in the normal progress store');
  await page.go(url, '#/katas', 500);
  await page.locator('#kpicks').click(); /* picks was left on above */
  ok(await page.locator('.krow.done').count() === 1 && (await page.locator('.kstats b').innerText()) === '1', 'the list and stats show it as solved');

  section('other languages');
  await page.go(url, '#/kata/two-fer', 800);
  await page.locator('.kother summary').click();
  await page.locator('#ktrack').selectOption('go');
  ok((await page.locator('#kcmd').innerText()).startsWith('exercism download --track=go --exercise=two-fer'), 'shows the Exercism CLI command for the chosen language');
  ok((await page.locator('#klink').getAttribute('href')) === 'https://exercism.org/tracks/go/exercises/two-fer', 'links to the exercise on exercism.org');
  await page.go(url, '#/kata/bob', 1000);
  ok(await page.locator('.kd-body a[href*="collinsdictionary"]').count() === 1 && !(await page.locator('.kd-body').innerText()).includes('[lackadaisical]'), 'reference-style links in instructions become real links');
  await page.go(url, '#/kata/armstrong-numbers', 1200);
  const sb = await page.evaluate(() => { const card = document.querySelector('.kata-desc'), inner = document.querySelector('.kd-scroll'); return { cardY: card.scrollHeight > card.clientHeight, cardX: card.scrollWidth > card.clientWidth, innerY: inner.scrollHeight > inner.clientHeight + 1, innerX: inner.scrollWidth > inner.clientWidth + 1, ov: getComputedStyle(card).overflow }; });
  ok(sb.ov === 'visible' && !sb.innerY && !sb.innerX, 'a short kata description shows no scrollbars (the card itself never scrolls; its inner pane only when needed) ' + JSON.stringify(sb));
  await page.go(url, '#/kata/ledger', 1200);
  ok((await page.locator('.kata-desc').innerText()).includes('Refactoring kata'), 'a refactoring kata says so');
  ok(page.errors.length === 0, 'no page errors ' + page.errors.slice(0, 2).join(' | '));
  await page.context().close();
}
