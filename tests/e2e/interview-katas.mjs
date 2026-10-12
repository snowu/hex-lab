// Pattern selection, progressive coaching and personal debrief persistence.
import { newPage } from './helpers.mjs';
export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  section('guided interview coding practice');
  await page.goto(url + '#/katas');
  await page.waitForSelector('[data-path]');
  ok(await page.locator('[data-path]').count() === 5, 'five curated interview pattern paths');
  await page.locator('[data-path="collections"]').click();
  ok(await page.locator('.krow').count() === 6, 'collection path contains six ordered exercises');
  ok((await page.locator('.krow').first().getAttribute('href')).endsWith('/word-count'), 'path starts with dictionary counting');
  ok(await page.locator('[data-path="collections"]').getAttribute('aria-pressed') === 'true', 'path selection exposed to assistive technology');
  await page.go(url, '#/kata/binary-search', 1000);
  await page.locator('#kcode .hint').click();
  ok((await page.locator('#kcode .out').innerText()).includes('Hint 1 of 3'), 'first hint reveals only the invariant');
  ok(!(await page.locator('#kcode .out').innerText()).includes('Return the original index'), 'later hints stay hidden');
  await page.locator('#kcode .hint').click(); await page.locator('#kcode .hint').click();
  ok((await page.locator('#kcode .out').innerText()).includes('Return the original index'), 'third hint adds boundary guidance');
  await page.locator('#kcode .sol').click();
  ok((await page.locator('#kcode .out').innerText()).includes('O(log n)'), 'reference includes complexity reasoning');
  await page.locator('.ikpractice summary').click();
  await page.locator('#kreflection').fill('Sorted precondition; log comparisons; constant auxiliary space.');
  await page.locator('.kother summary').click();
  await page.locator('#ktrack').selectOption('rust');
  await page.locator('#kpaste').fill('my locally tested implementation');
  await page.reload(); await page.waitForSelector('#kreflection', { state: 'attached' });
  ok(await page.locator('#kreflection').inputValue() === 'Sorted precondition; log comparisons; constant auxiliary space.', 'interview debrief survives reload');
  ok(await page.locator('#ktrack').inputValue() === 'rust', 'local language preference survives reload');
  ok(await page.locator('#kpaste').inputValue() === 'my locally tested implementation', 'local solution survives reload');
  await page.locator('#kbackpath').click(); await page.waitForSelector('.krow');
  ok(await page.locator('.krow').count() === 6, 'exercise link restores the associated pattern path');
  await page.setViewportSize({ width: 390, height: 844 });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'pattern cards fit phone viewport');
  await page.go(url, '#/kata/binary-search', 500);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'coaching workspace fits phone viewport');
  ok(page.errors.length === 0, 'no uncaught browser errors');
  await page.context().close();
}
