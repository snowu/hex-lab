// Phone-sized checks: reading and interactive lessons come first. Touch + 390x844.
import { newPage } from './helpers.mjs';
export default async function ({ url, browser, ok, section }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await newPage(context);
  await page.route('**/assets/feedback-config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.FEEDBACK_CONFIG={url:'https://fake-feedback.example'}" }));
  await page.route('https://fake-feedback.example/health', (r) => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"configured":true,"model":"m"}' }));
  await page.goto(url + '#/'); await page.waitForTimeout(900);
  const ids = await page.evaluate(() => { const L = TRACKS.flatMap((t) => t.lessons); const pick = (type) => L.find((l) => l.sections.some((x) => x.type === type)).id; return { quiz: pick('quiz'), code: pick('code'), bug: pick('bug'), predict: pick('predict'), sim: pick('sim') }; });
  const routes = [['home', '#/'], ['track', '#/track/playbook'], ...Object.entries(ids).map(([k, v]) => ['lesson ' + k, '#/lesson/' + v]), ['flashcards', '#/review'], ['mock', '#/mock'], ['plan', '#/plan'], ['design', '#/design'], ['stories', '#/stories'], ['katas', '#/katas'], ['kata', '#/kata/bob'], ['links', '#/resources']];

  section('no sideways scrolling on any page');
  for (const [name, h] of routes) {
    await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(900);
    const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth }));
    ok(w.sw <= w.vw, `${name}: page fits the screen (${w.sw} <= ${w.vw})`);
  }

  section('chrome');
  await page.go(url, '#/lesson/' + ids.quiz, 800);
  const chrome = await page.evaluate(() => { const top = document.querySelector('.top'), nav = document.querySelector('.top nav'), nb = nav.getBoundingClientRect(); return { headerH: Math.round(top.getBoundingClientRect().height), headerPos: getComputedStyle(top).position, navPos: getComputedStyle(nav).position, navBottom: Math.round(nb.bottom), vh: innerHeight, navItems: nav.querySelectorAll('a').length, bodyPad: parseInt(getComputedStyle(document.body).paddingBottom) }; });
  ok(chrome.headerH < 80 && chrome.headerPos === 'static', `the header is one short row that scrolls away (${chrome.headerH}px, ${chrome.headerPos})`);
  ok(chrome.navPos === 'fixed' && chrome.navBottom === chrome.vh && chrome.navItems === 8, 'the section nav is a bottom tab bar with all 8 sections');
  ok(chrome.bodyPad >= 50, 'content is padded so the tab bar never covers it');
  await page.evaluate(() => window.scrollTo(0, 1500)); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.querySelector('.top').getBoundingClientRect().bottom <= 0), 'scrolling down moves the header out of the way');
  await page.locator('.top nav a[data-nav="review"]').tap(); await page.waitForTimeout(500);
  ok((await page.evaluate(() => location.hash)) === '#/review', 'the bottom tab bar navigates');

  section('touch targets and keyboard hints');
  await page.go(url, '#/lesson/' + ids.code, 900);
  const t = await page.evaluate(() => { const h = (q) => Math.round(document.querySelector(q).getBoundingClientRect().height); return { run: h('.run'), hint: h('.hint'), kbdShown: [...document.querySelectorAll('kbd')].filter((k) => k.getBoundingClientRect().width > 0).length, hintLabel: !!document.querySelector('.ex-tab > span:last-child') && document.querySelector('.ex-tab > span:last-child').getBoundingClientRect().width > 0 }; });
  ok(t.run >= 40 && t.hint >= 40, `code buttons are easy to tap (run ${t.run}px, hint ${t.hint}px)`);
  ok(t.kbdShown === 0 && !t.hintLabel, 'no "Ctrl Enter" keyboard hints on a touch screen');
  await page.go(url, '#/lesson/' + ids.bug, 900);
  const bl = await page.evaluate(() => { const b = document.querySelector('.bl'), code = b.querySelector('code'); return { h: Math.round(b.getBoundingClientRect().height), wraps: getComputedStyle(code).whiteSpace }; });
  ok(bl.h >= 34 && bl.wraps === 'pre-wrap', `bug-hunt lines are tappable and wrap instead of being cut off (${bl.h}px, ${bl.wraps})`);
  const fonts = await page.evaluate(() => [...document.querySelectorAll('textarea, input:not([type=checkbox]):not([type=radio]):not([type=range])')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => parseFloat(getComputedStyle(e).fontSize)));
  ok(fonts.every((f) => f >= 16), `inputs are 16px+ so iOS does not zoom on focus (${fonts.join(',')})`);
  await page.go(url, '#/review', 700);
  ok((await page.locator('.face.front .hint').innerText()).toLowerCase().includes('tap'), 'flashcards say "tap" on a touch screen');

  section('tutor chat on a phone');
  await page.go(url, '#/lesson/' + ids.quiz, 700);
  await page.locator('#chatBtn').tap(); await page.waitForTimeout(500);
  const chat = await page.evaluate(() => { const c = document.querySelector('#chat').getBoundingClientRect(); return { w: Math.round(c.width), h: Math.round(c.height), vw: innerWidth, vh: innerHeight, lock: getComputedStyle(document.body).overflow, ph: document.querySelector('#chatIn').placeholder }; });
  ok(chat.w === chat.vw && Math.abs(chat.h - chat.vh) <= 2, 'the chat takes the whole screen');
  ok(chat.lock === 'hidden', 'the page behind does not scroll');
  ok(!/Enter/.test(chat.ph), 'no desktop keyboard instructions in the chat box');
  await page.locator('#chatIn').fill('line one'); await page.locator('#chatIn').press('Enter');
  ok((await page.locator('#chatIn').inputValue()).includes('line one\n'), 'Enter adds a new line (sending is the Send button)');
  ok(page.errors.length === 0, 'no page errors ' + page.errors.slice(0, 2).join(' | '));
  await context.close();
}
