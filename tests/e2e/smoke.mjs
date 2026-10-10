import { newPage } from './helpers.mjs';
// Every route renders something, with no uncaught errors.
export default async function ({ url, browser, ok }) {
  const page = await newPage(browser);
  await page.goto(url + '#/'); await page.waitForTimeout(700);
  const ids = await page.evaluate(() => ({ tracks: TRACKS.map((t) => t.id), lessons: TRACKS.flatMap((t) => t.lessons.map((l) => l.id)), designs: DESIGNS.map((d) => d.id) }));
  const routes = ['#/', '#/plan', '#/design', '#/stories', '#/review', '#/mock', '#/resources', ...ids.tracks.map((i) => '#/track/' + i), ...ids.lessons.map((i) => '#/lesson/' + i), ...ids.designs.map((i) => '#/design/' + i)];
  let thin = [];
  for (const r of routes) { await page.go(url, r, 120); const n = await page.evaluate(() => document.querySelector('#app').innerText.length); if (n < 100) thin.push(r); }
  ok(thin.length === 0, `${routes.length} routes render content` + (thin.length ? ' (thin: ' + thin.join(', ') + ')' : ''));
  ok(page.errors.length === 0, 'no uncaught errors while visiting every route ' + JSON.stringify(page.errors.slice(0, 2)));
  const nav = await page.evaluate(() => [...document.querySelectorAll('.top nav a')].map((a) => a.textContent.trim()));
  ok(nav.length === 7, 'main navigation has 7 entries: ' + nav.join(' '));
  await page.close();
}
