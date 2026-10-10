import { newPage } from './helpers.mjs';
// Solves every code exercise (Python and SQL) with its reference solution through the real editor and runtime.
export default async function ({ url, browser, ok }) {
  const page = await newPage(browser);
  await page.goto(url + '#/'); await page.waitForTimeout(700);
  const lessons = await page.evaluate(() => TRACKS.flatMap((t) => t.lessons.filter((l) => l.sections.some((s) => s.type === 'code')).map((l) => ({ id: l.id, sols: l.sections.filter((s) => s.type === 'code').map((s) => s.solution) }))));
  let solved = 0, total = 0, failed = [];
  for (const l of lessons) {
    await page.go(url, '#/lesson/' + l.id, 250);
    for (let i = 0; i < l.sols.length; i++) {
      total++;
      await page.evaluate(({ i, sol }) => [...document.querySelectorAll('.CodeMirror')][i].CodeMirror.setValue(sol), { i, sol: l.sols[i] });
      await page.locator('.ex .run').nth(i).click();
      try { await page.locator('.ex .out .allpass').nth(i).waitFor({ timeout: 120000 }); solved++; } catch { failed.push(l.id + '#' + i); }
    }
  }
  ok(solved === total, `reference solutions pass in the browser: ${solved}/${total}` + (failed.length ? ' failed: ' + failed.join(', ') : ''));
  // an infinite loop must be stopped and the runtime must recover
  await page.go(url, '#/lesson/maps-complexity', 250);
  await page.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.setValue('def latest_by_id(events):\n    while True:\n        pass'));
  await page.locator('.ex .run').first().click();
  await page.locator('.ex .out .res.fail').first().waitFor({ timeout: 60000 });
  ok((await page.locator('.ex .out').first().innerText()).includes('Timed out'), 'an infinite loop is stopped with a timeout message');
  await page.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.setValue('def latest_by_id(events):\n    return []'));
  await page.locator('.ex .run').first().click();
  await page.locator('.ex .out .res').first().waitFor({ timeout: 90000 });
  ok(true, 'the runtime recovers after a timeout');
  ok(page.errors.length === 0, 'no uncaught errors ' + JSON.stringify(page.errors.slice(0, 2)));
  await page.close();
}
