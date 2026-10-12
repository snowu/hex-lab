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
}
