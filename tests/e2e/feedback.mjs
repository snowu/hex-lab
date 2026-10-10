// The AI-feedback widget against a fake Worker (request interception): hidden when unconfigured,
// sends the right payload, renders replies as text (never HTML), surfaces errors.
import { newPage } from './helpers.mjs';
const FAKE = 'https://fake-feedback.example';
export default async function ({ url, browser, ok, section }) {
  section('unconfigured: no buttons');
  let page = await newPage(browser);
  await page.goto(url + '#/'); await page.waitForTimeout(500);
  await page.go(url, '#/lesson/py-arrays', 600);
  const lessonId = await page.evaluate(() => TRACKS.flatMap((t) => t.lessons).find((l) => l.sections.some((s) => s.type === 'code')).id);
  await page.go(url, '#/lesson/' + lessonId, 600);
  ok((await page.locator('.fbk button').count()) === 0, 'no "Get AI feedback" button while FEEDBACK_CONFIG.url is empty');
  await page.context().close();

  section('configured against a fake worker');
  page = await newPage(browser);
  const seen = [];
  let mode = 'ok';
  await page.route(FAKE + '/feedback', async (route) => {
    seen.push(JSON.parse(route.request().postData()));
    if (mode === 'err') return route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Slow down: a few reviews per minute.' }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ verdict: 'partial', strengths: ['clear names'], issues: ['<img src=x onerror=window.__pwned=1> misses the last window'], next_step: 'test the edges' }) });
  });
  await page.route('**/assets/feedback-config.js', (route) => route.fulfill({ contentType: 'text/javascript', body: `window.FEEDBACK_CONFIG={url:'${FAKE}'}` }));
  await page.goto(url + '#/'); await page.waitForTimeout(500);
  await page.go(url, '#/lesson/' + lessonId, 700);
  const btn = page.locator('.fbk button').first();
  ok(await btn.count() === 1, 'a feedback button appears on a coding challenge');
  await btn.click(); await page.waitForSelector('.fbk-verdict');
  ok(seen.length === 1 && seen[0].kind === 'code' && seen[0].prompt.length > 10 && seen[0].answer.length >= 10, 'sends kind, prompt and the editor contents: ' + JSON.stringify(Object.keys(seen[0] || {})));
  ok((await page.locator('.fbk-verdict').innerText()).toLowerCase().includes('partly'), 'renders the verdict');
  ok(await page.evaluate(() => !window.__pwned && !document.querySelector('.fbk-box img')), 'model output is rendered as text, not HTML');
  ok((await page.locator('.fbk-bad li').innerText()).includes('<img'), 'markup shows up literally');
  mode = 'err'; await page.waitForTimeout(4200); await btn.click(); await page.waitForFunction(() => /Slow down/.test(document.querySelector('.fbk-box').textContent));
  ok(true, 'worker error message is shown to the user');

  section('story and design hooks');
  await page.go(url, '#/stories', 400);
  await page.locator('#snew, [id*="new"]').first().click().catch(() => {});
  await page.waitForTimeout(300);
  ok((await page.locator('#sfbk button').count()) === 1, 'story editor has a feedback button');
  ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
  await page.context().close();
}
