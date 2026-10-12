import { newPage } from './helpers.mjs';
export default async ({ browser, url, ok, section }) => {
  section('kata editor controls with and without the tutor');
  for (const width of [320, 390, 768, 1280]) for (const tutor of [false, true]) {
    const page = await newPage(browser, { viewport: { width, height: 900 }, isMobile: width < 520, hasTouch: width < 520 });
    await page.route('**/assets/feedback-config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: tutor ? "window.FEEDBACK_CONFIG={url:'https://fake-feedback.example'}" : 'window.FEEDBACK_CONFIG={}' }));
    await page.route('https://fake-feedback.example/health', (r) => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"configured":true,"model":"m"}' }));
    await page.addInitScript(() => localStorage.setItem('sil:attempts', JSON.stringify([{ id: 'kata-binary-search', ok: true, secs: 42, limit: 720, ts: Date.now() }])));
    await page.goto(url + '#/kata/binary-search', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#kcode .ex-actions');
    const layout = await page.evaluate(() => {
      const ex = document.querySelector('#kcode .ex'), ai = ex.querySelector(':scope > .ask-mini');
      const visible = el => el.getBoundingClientRect().width > 0;
      const rect = el => el.getBoundingClientRect();
      const overlap = (a, b) => { a = rect(a); b = rect(b); return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; };
      const chips = [...ex.querySelectorAll('.ex-head > *')].filter(visible), buttons = [...ex.querySelectorAll('.ex-actions .btn')].filter(visible);
      return { ai: !!ai, clear: !ai || chips.every(el => !overlap(el, ai)), controls: buttons.every((a, i) => buttons.slice(i + 1).every(b => !overlap(a, b))), fits: document.documentElement.scrollWidth <= innerWidth, aligned: Math.abs(rect(ex.querySelector('.ex-win')).left - rect(buttons[0]).left) < 2, feedback: !ai || Math.abs(rect(ex.querySelector('.fbk > .btn')).left - rect(buttons[0]).left) < 2, best: visible(ex.querySelector('.best')) };
    });
    ok(layout.ai === tutor && layout.clear, width + 'px: tutor has its own space (' + tutor + ')');
    ok(layout.controls && layout.fits && layout.aligned && layout.feedback && layout.best, width + 'px: buttons do not overlap, padding aligns and best-time chip fits (' + tutor + ')');
    ok(page.errors.length === 0, width + 'px: no browser errors (' + tutor + ')');
    await page.context().close();
  }
};
