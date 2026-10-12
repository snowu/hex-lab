// Skills: per-track mastery from lessons, practice and recall, weakest first.
import { newPage } from './helpers.mjs';
export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  await page.goto(url + '#/', { waitUntil: 'domcontentloaded' });
  ok(await page.locator('.tool[href="#/skills"]').count() === 1, 'home toolkit links to Skills');

  section('fresh profile shows every track at zero');
  await page.go(url, '#/skills', 800);
  await page.waitForSelector('.sk-card');
  const nTracks = await page.evaluate(() => TRACKS.length);
  ok(await page.locator('.sk-card').count() === nTracks, `all ${nTracks} tracks render`);
  ok((await page.locator('.sk-card .pct b').first().textContent()) === '0%', 'fresh profile starts at 0% mastery');

  section('progress moves the map');
  await page.evaluate(() => {
    const t = TRACKS[0], l0 = t.lessons[0], l1 = t.lessons[1] || t.lessons[0];
    const keys = {};
    for (const { k } of LAB.itemsOf(l0)) keys[k] = true;
    const progress = JSON.parse(localStorage.getItem('sil:progress') || '{}');
    progress[l0.id] = keys;
    localStorage.setItem('sil:progress', JSON.stringify(progress));
    const checks = JSON.parse(localStorage.getItem('sil:lessonChecks') || '{}');
    checks[l1.id] = { box: 0, due: Date.now() - 1000, last: Date.now() - 864e5, n: 1 };
    localStorage.setItem('sil:lessonChecks', JSON.stringify(checks));
  });
  const firstId = await page.evaluate(() => TRACKS[0].lessons[0].id);
  const secondId = await page.evaluate(() => (TRACKS[0].lessons[1] || TRACKS[0].lessons[0]).id);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('.sk-card');
  const pcts = await page.locator('.sk-card .pct b').evaluateAll((els) => els.map((e) => parseInt(e.textContent, 10)));
  ok(Math.max(...pcts) > 0, 'completed lesson work raises a track above 0%');
  ok(pcts[0] <= pcts[pcts.length - 1], 'weakest track sorts first');
  ok(await page.locator('.sk-due', { hasText: 'recall review' }).count() >= 1, 'a due recall review is flagged on its track');
  const action = await page.locator(`.sk-card a[href="#/lesson/${secondId}"]`).count();
  ok(action >= 1, 'the due review becomes the track next action');
  const cont = await page.locator(`.sk-card a[href="#/lesson/${firstId}"]`).count();
  ok(cont >= 1 || action >= 1, 'tracks link to their next action');

  section('phone layout');
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mastery cards fit a phone width');
  ok(page.errors.length === 0, 'no browser errors: ' + page.errors.join('; '));
  await page.context().close();
};
