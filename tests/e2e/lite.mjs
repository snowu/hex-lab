import { newPage } from './helpers.mjs';
// Lite version: e-readers and engines that cannot run the app land on the static lite/ copy; everyone else stays in the app.
const KINDLE = 'Mozilla/5.0 (X11; U; Linux armv7l like Android; en-us) AppleWebKit/531.2+ (KHTML, like Gecko) Version/5.0 Safari/533.2+ Kindle/3.0+';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
export default async function ({ url, browser, ok, section }) {
  const base = url.replace(/index\.html$/, '');

  section('normal browsers stay in the app');
  for (const [name, opts] of [['desktop', {}], ['phone', { viewport: { width: 390, height: 844 }, userAgent: IPHONE, isMobile: true, hasTouch: true }]]) {
    const page = await newPage(browser, opts);
    await page.goto(url + '#/'); await page.waitForTimeout(800);
    ok(!page.url().includes('/lite/'), `${name}: not redirected`);
    ok((await page.locator('#app .hero, #app h1').count()) > 0, `${name}: the app renders`);
    ok(page.errors.length === 0, `${name}: no page errors ` + JSON.stringify(page.errors.slice(0, 2)));
    await page.context().close();
  }

  section('Kindle and old engines go to lite/');
  {
    const page = await newPage(browser, { userAgent: KINDLE, viewport: { width: 600, height: 800 } });
    await page.goto(url + '#/'); await page.waitForURL(/\/lite\/index\.html/, { timeout: 5000 }).catch(() => {});
    ok(page.url().endsWith('/lite/index.html'), 'Kindle user agent is sent to lite/');
    await page.goto(url + '?full#/'); await page.waitForTimeout(800);
    ok(!page.url().includes('/lite/'), '?full opts out of the redirect');
    await page.context().close();
  }
  {
    const page = await newPage(browser);
    await page.addInitScript(() => { window.Function = function () { throw new SyntaxError('Unexpected token'); }; });
    await page.goto(url + '#/'); await page.waitForURL(/\/lite\/index\.html/, { timeout: 5000 }).catch(() => {});
    ok(page.url().endsWith('/lite/index.html'), 'an engine without ES2021 syntax is sent to lite/');
    await page.context().close();
  }

  section('lite pages are static and linked');
  {
    const page = await newPage(browser, { javaScriptEnabled: false, viewport: { width: 600, height: 800 } });
    await page.goto(base + 'lite/index.html');
    const links = await page.$$eval('ol a[href$=".html"]', (as) => as.map((a) => a.href));
    ok(links.length > 50, `index lists the lessons (${links.length})`);
    const quiz = links.find((h) => /senior-signals/.test(h)) || links[0];
    await page.goto(quiz);
    ok((await page.locator('h1').innerText()).length > 0, 'a lesson page renders without JavaScript');
    ok((await page.locator('script').count()) === 0, 'lesson page has no scripts');
    const firstAns = await page.locator('.tolink a').first().getAttribute('href');
    ok(firstAns === '#a1' && (await page.locator('#a1').count()) === 1, 'questions link to the answer key');
    const wide = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    ok(wide, 'no horizontal scroll at e-reader width');
    for (const p of ['cards.html', 'mock.html', 'links.html']) { const r = await page.goto(base + 'lite/' + p); ok(r.ok(), p + ' loads'); }
    await page.context().close();
  }
}
