// End-of-lesson retrieval checks and their spaced-repetition scheduling.
import { newPage } from './helpers.mjs';
export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  await page.goto(url + '#/', { waitUntil: 'domcontentloaded' });
  const lid = await page.evaluate(() => TRACKS.flatMap((t) => t.lessons).find((l) => (l.checks || []).length >= 2).id);
  ok(!!lid, 'at least one lesson authors end-of-lesson checks');
  const answerAll = async () => {
    const n = await page.locator('#schecks [data-check]').count();
    for (let c = 0; c < n; c++) {
      const box = page.locator(`#schecks [data-check="${c}"]`);
      for (let i = 0; i < 4; i++) { if (await box.locator('.explain.ok').count()) break; await box.locator('.opt').nth(i).click(); await page.waitForTimeout(120); }
      ok(await box.locator('.explain.ok').count() === 1, `check ${c + 1}/${n} shows the explanation after the right answer`);
    }
    return n;
  };

  section('answering the checks');
  await page.go(url, '#/lesson/' + lid, 800);
  await page.waitForSelector('#schecks');
  const n = await page.locator('#schecks [data-check]').count();
  ok(n >= 2, 'the lesson ends with at least two retrieval checks');
  ok(await page.locator('.outline button[data-t="schecks"]').count() === 1, 'the lesson outline links to the checks');
  await answerAll();
  ok(await page.evaluate((id) => { const r = JSON.parse(localStorage.getItem('sil:lessonChecks') || '{}')[id]; return !!r && r.due > Date.now() && r.box === 0; }, lid), 'completing every check schedules a spaced review');
  ok(await page.evaluate((id) => (JSON.parse(localStorage.getItem('sil:progress') || '{}')[id] || {}).h0 === true, lid), 'check progress is saved per lesson');
  ok((await page.locator('#lsrchip').innerText()).includes('Recall scheduled'), 'the header shows the scheduled recall');

  section('reload keeps answers');
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('#schecks');
  ok(await page.locator('#schecks .explain.ok').count() === n, 'reload restores answered checks without inventing progress');

  section('due review re-opens the checks');
  await page.evaluate((id) => { const all = JSON.parse(localStorage.getItem('sil:lessonChecks')); all[id].due = Date.now() - 1000; localStorage.setItem('sil:lessonChecks', JSON.stringify(all)); }, lid);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('#schecks');
  ok(await page.locator('#schecks .callout.warn').count() === 1, 'a due review shows a retake banner instead of the answers');
  ok((await page.locator('#lsrchip').innerText()).includes('Review due'), 'the header chip flags the due review');
  await answerAll();
  ok(await page.evaluate((id) => JSON.parse(localStorage.getItem('sil:lessonChecks'))[id].box === 1, lid), 're-answering a due review advances the schedule');

  section('plan and sync');
  await page.go(url, '#/plan', 800);
  await page.evaluate((id) => { const all = JSON.parse(localStorage.getItem('sil:lessonChecks')); all[id].due = Date.now() - 1000; localStorage.setItem('sil:lessonChecks', JSON.stringify(all)); }, lid);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(800);
  ok(await page.locator('.ptask b', { hasText: 'Lesson review:' }).count() >= 1, 'a due lesson review appears in the daily plan');
  ok(await page.evaluate(() => !!SyncCore.snapshot(localStorage)['sil:lessonChecks']), 'the recall schedule participates in progress sync');

  section('phone layout');
  await page.go(url, '#/lesson/' + lid, 800); await page.waitForSelector('#schecks');
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'checks fit a phone width');
  ok(page.errors.length === 0, 'no browser errors: ' + page.errors.join('; '));
  await page.context().close();
};
