import { newPage } from './helpers.mjs';
export default async function ({ url, browser, ok }) {
  const page = await newPage(browser);
  await page.goto(url + '#/'); await page.waitForTimeout(700);
  const fs = await page.evaluate(() => { const t = TRACKS.find((x) => x.id === 'fullstack'); return t && { n: t.lessons.length, ex: t.lessons.flatMap((l) => l.sections.filter((s) => s.type === 'code').map((s) => s.id)) }; });
  ok(fs && fs.n === 6 && fs.ex.length === 8, 'full-stack track: 6 lessons, 8 exercises ' + JSON.stringify(fs && fs.ex));

  await page.go(url, '#/lesson/fs-edge', 400);
  const sim = page.locator('.simbox').first();
  const calls = async () => parseInt((await sim.locator('.ecs > div').nth(1).locator('b').innerText()).replace(/\D/g, ''), 10);
  const peak = async () => parseInt(await sim.locator('.ecs > div').nth(2).locator('b').innerText(), 10);
  const p95 = async () => parseInt(await sim.locator('.ecs > div').nth(3).locator('b').innerText(), 10);
  await sim.locator('[data-s="none"]').click(); const none = await calls();
  await sim.locator('[data-s="ttl"]').click(); const ttl = await calls(), ttlPeak = await peak();
  await sim.locator('[data-s="sf"]').click(); const sf = await calls(), sfPeak = await peak();
  await sim.locator('[data-s="swr"]').click(); const swr = await calls(), swrP95 = await p95();
  ok(none > ttl && ttl > sf, `upstream calls: none ${none} > ttl ${ttl} > single-flight ${sf}`);
  ok(ttlPeak > sfPeak, `TTL alone stampedes (peak ${ttlPeak}/s) while single-flight stays flat (peak ${sfPeak}/s)`);
  ok(swrP95 <= 10, `stale-while-revalidate keeps viewer latency tiny after the first fill (p95 ${swrP95} ms)`);
  ok(swr <= sf + 2, `stale-while-revalidate costs about the same upstream calls as single-flight (${swr} vs ${sf})`);

  await page.go(url, '#/lesson/fs-web-basics', 300);
  const bug = page.locator('.bug-code').first(); await bug.locator('[data-n="3"]').click(); await bug.locator('[data-n="4"]').click(); await page.locator('.bcheck').click();
  await page.waitForSelector('.allpass'); ok(true, 'cookie/CORS bug hunt accepts the two real bugs');
  await page.go(url, '#/design', 300);
  const titles = await page.locator('.dcard h3').allInnerTexts();
  ok(titles.length === 10 && titles.some((t) => /Live arrivals/.test(t)) && titles.some((t) => /sync/i.test(t)), `design lab lists ${titles.length} reps including the new full-stack ones`);
  ok(page.errors.length === 0, 'no uncaught errors ' + JSON.stringify(page.errors.slice(0, 2)));
  await page.close();
}
