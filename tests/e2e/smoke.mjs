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
  ok(nav.length === 8 && nav.includes('katas'), 'main navigation has 8 entries: ' + nav.join(' '));


  /* the interview-date picker must survive typing a year (it used to re-render on every digit and lose focus) */
  await page.go(url, '#/plan', 600);
  const goal = page.locator('#goal');
  await goal.focus(); await page.keyboard.type('10102030'); await page.waitForTimeout(200);
  ok((await goal.inputValue()) === '2030-10-10', 'typing a full date into the interview date works (' + await goal.inputValue() + ')');
  ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'goal'), 'the date input keeps focus while typing');
  ok((await page.locator('#daysleft').innerText()).includes('to your interview') && (await page.evaluate(() => localStorage.getItem('sil:goalDate'))).includes('2030-10-10'), 'it is saved and the countdown appears without a re-render');
  await goal.fill(''); ok((await page.locator('#daysleft').innerText()) === '', 'clearing it removes the countdown');

  /* the header must never overflow: every control stays on screen at common widths */
  for (const w of [1000, 1280, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 800 }); await page.goto(url + '#/'); await page.waitForTimeout(400);
    const r = await page.evaluate(() => { const t = document.querySelector('.top-in'); return { fits: t.scrollWidth <= t.clientWidth + 1, themeRight: document.querySelector('#themeBtn').getBoundingClientRect().right, vw: innerWidth }; });
    ok(r.fits && r.themeRight <= r.vw, `header controls fit at ${w}px wide (theme button right edge ${Math.round(r.themeRight)})`);
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.close();
}
