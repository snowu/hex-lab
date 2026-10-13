import { newPage } from './helpers.mjs';
// Install banner: hidden by default, appears on beforeinstallprompt, dismiss sticks for the cooldown.
export default async function ({ url, browser, ok, section }) {
  section('hidden without the event');
  const page = await newPage(browser);
  await page.goto(url + '#/'); await page.waitForTimeout(2200);
  ok((await page.locator('#installBanner').count()) === 0, 'no install banner without beforeinstallprompt');
  ok(page.errors.length === 0, 'no page errors on load ' + JSON.stringify(page.errors.slice(0, 2)));

  section('appears on beforeinstallprompt, dismiss sticks');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeinstallprompt')));
  await page.waitForSelector('#installBanner', { timeout: 8000 });
  ok(true, 'banner appears after beforeinstallprompt');
  ok(await page.locator('#installBanner .btn.primary').isVisible(), 'banner has an Install action');
  await page.locator('#installBanner [data-dismiss]').click();
  ok((await page.locator('#installBanner').count()) === 0, 'dismiss removes the banner');
  const stamped = await page.evaluate(() => localStorage.getItem('sil:installDismiss'));
  ok(stamped != null && Number(JSON.parse(stamped)) > 0, 'dismissal is remembered');
  await page.goto(url + '#/'); await page.waitForTimeout(2200);
  await page.evaluate(() => window.dispatchEvent(new Event('beforeinstallprompt')));
  await page.waitForTimeout(2200);
  ok((await page.locator('#installBanner').count()) === 0, 'no banner again within the cooldown');
  await page.close();

  section('service worker serves new deploys');
  {
    const page = await newPage(browser);
    await page.goto(url + '#/');
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 10000 });
    await page.reload(); await page.waitForTimeout(500); // index.html is now cached by the worker
    await page.context().route(/index\.html/, async (r) => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace('<title>Hex Lab</title>', '<title>Hex Lab</title><meta name="deploy" content="new">') }); });
    await page.reload(); await page.waitForTimeout(500);
    ok((await page.locator('meta[name=deploy]').count()) === 1, 'a reload gets the newly deployed index.html, not the cached one');
    await page.context().unroute(/index\.html/);
    await page.context().setOffline(true);
    await page.reload().catch(() => {}); await page.waitForTimeout(500);
    ok((await page.locator('header.top').count()) === 1, 'offline still loads the cached page');
    await page.context().close();
  }
}
