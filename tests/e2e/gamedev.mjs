// The game dev section: the mode switch, filtering of content, every route/lesson/sim, drills, the pixel editor, mobile layout.
import { newPage } from './helpers.mjs';
export default async function ({ url, browser, ok, section }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: 'dark', acceptDownloads: true });
  const page = await newPage(ctx);

  section('switching sections');
  await page.goto(url + '#/'); await page.waitForTimeout(500);
  let s = await page.evaluate(() => ({ mode: window.MODE, tracks: TRACKS.map((t) => t.id), game: TRACKS.some((t) => t.domain === 'gamedev') }));
  ok(s.mode === 'interview' && !s.game, 'default is the interview section with no game dev tracks');
  ok(await page.locator('#swMode').count() === 1 && (await page.locator('#modeBtn').count()) === 1, 'home has a game dev tile and the header has the switch');
  await page.locator('#modeBtn').click(); await page.waitForTimeout(700);
  s = await page.evaluate(() => ({ mode: window.MODE, tracks: TRACKS.map((t) => t.id), cards: CARDS.every((c) => c.domain === 'gamedev') && CARDS.length > 40, mock: MOCK.every((m) => m.domain === 'gamedev') && MOCK.length >= 10, res: RESOURCES.every((r) => r.domain === 'gamedev') && RESOURCES.length >= 20, theme: document.documentElement.dataset.mode, title: document.title, brand: document.querySelector('.brand-t').textContent }));
  ok(s.mode === 'gamedev' && s.tracks.join() === 'gdloop,gdmath,gddesign,gdcraft,gdpixel', 'the switch shows only the five game dev tracks ' + s.tracks.join());
  ok(s.cards && s.mock && s.res, 'cards, mock questions and links are filtered too');
  ok(s.theme === 'gamedev' && s.brand.startsWith('gamedev') && s.title === 'Game Dev Lab', 'branding and theme attribute change');
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  ok(accent === '#b98cff', 'dark theme uses the violet accent (' + accent + ')');
  const nav = await page.evaluate(() => [...document.querySelectorAll('.top nav a')].map((a) => a.textContent.trim()));
  ok(nav.join(' ') === 'learn plan cards mock links', 'nav drops design, katas and stories: ' + nav.join(' '));
  await page.go(url, '#/katas', 300); ok(await page.evaluate(() => location.hash) === '#/', 'interview-only pages redirect home in this section');
  const h1 = await page.locator('h1').first().innerText();
  ok(/Learn to make games/.test(h1), 'game dev hero copy: ' + h1.replace(/\n/g, ' '));
  ok(/Zig and C\+\+ drills/.test(await page.locator('.lead').first().innerText()), 'the hero counts drills');

  section('every route and lesson renders');
  const ids = await page.evaluate(() => ({ tracks: TRACKS.map((t) => t.id), lessons: TRACKS.flatMap((t) => t.lessons.map((l) => l.id)) }));
  const routes = ['#/', '#/plan', '#/review', '#/mock', '#/resources', ...ids.tracks.map((i) => '#/track/' + i), ...ids.lessons.map((i) => '#/lesson/' + i)];
  const thin = [];
  for (const r of routes) { await page.go(url, r, 150); if ((await page.evaluate(() => document.querySelector('#app').innerText.length)) < 100) thin.push(r); }
  ok(thin.length === 0, `${routes.length} routes render` + (thin.length ? ' (thin: ' + thin.join(', ') + ')' : ''));
  ok(page.errors.length === 0, 'no uncaught errors ' + JSON.stringify(page.errors.slice(0, 3)));

  section('colour ramp direction');
  await page.go(url, '#/lesson/px-color', 400);
  const rampHex = await page.evaluate(() => [...document.querySelectorAll('.ramp')].map((r) => [...r.querySelectorAll('i')].map((i) => getComputedStyle(i).backgroundColor.match(/\d+/g).map(Number))));
  const warmth = (c) => c[0] - c[2]; // red minus blue: higher is warmer
  ok(warmth(rampHex[1].at(-1)) > warmth(rampHex[0].at(-1)), 'with hue shift the highlight is warmer than the plain lightness ramp');
  ok(warmth(rampHex[1][0]) < warmth(rampHex[0][0]), 'and the shadow is cooler');

  section('simulations');
  const sims = await page.evaluate(() => TRACKS.flatMap((t) => t.lessons.flatMap((l) => l.sections.filter((x) => x.type === 'sim').map((x) => ({ l: l.id, id: x.id })))));
  ok(sims.length === 9, 'nine game simulations: ' + sims.map((x) => x.id).join(' '));
  for (const sm of sims) {
    await page.go(url, '#/lesson/' + sm.l, 250);
    const info = await page.evaluate((id) => { const box = [...document.querySelectorAll('.simroot')].find((r) => r.closest('.sec') && r.innerHTML.length > 50); return { n: document.querySelectorAll('.simroot').length, html: box ? box.innerHTML.length : 0, canvas: !!document.querySelector('.simroot canvas') }; }, sm.id);
    ok(info.html > 50 && info.canvas, `sim ${sm.id} renders a canvas in ${sm.l}`);
  }
  ok(page.errors.length === 0, 'no errors from the sims ' + JSON.stringify(page.errors.slice(0, 3)));

  section('simulation behaviour');
  await page.go(url, '#/lesson/gd-loop', 350);
  const apex = async () => page.locator('#tab').first().innerText();
  const before = await apex(); await page.locator('#fps').first().fill('10'); await page.locator('#fps').first().dispatchEvent('input'); await page.waitForTimeout(100);
  const after = await apex(); ok(before !== after && /10 fps/.test(after), 'the timestep sim reacts to the frame rate slider');
  await page.go(url, '#/lesson/gd-collision', 350);
  await page.locator('#spd').first().fill('6000'); await page.locator('#spd').first().dispatchEvent('input'); await page.waitForTimeout(80);
  ok(/Tunneled/.test(await page.locator('#out').first().innerText()), 'at high speed the discrete test tunnels');
  await page.locator('#sw').first().check(); await page.waitForTimeout(80);
  ok(/Hit\./.test(await page.locator('#out').first().innerText()), 'the swept test fixes it');
  await page.go(url, '#/lesson/gd-procgen', 350);
  const caveBefore = await page.locator('#stat').first().innerText();
  for (let i = 0; i < 4; i++) await page.locator('#step').first().click();
  const caveAfter = await page.locator('#stat').first().innerText();
  ok(caveBefore !== caveAfter && /4 smoothing steps/.test(caveAfter), 'cave smoothing steps run: ' + caveAfter.slice(0, 60));

  section('pixel editor');
  await page.evaluate(() => localStorage.removeItem('sil:pxart'));
  await page.go(url, '#/lesson/px-basics', 400);
  const ed = page.locator('#ed');
  await ed.scrollIntoViewIfNeeded();
  const box = await ed.boundingBox();
  const cell = box.width / 16;
  const at = (x, y) => ({ x: box.x + (x + 0.5) * cell, y: box.y + (y + 0.5) * cell });
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('sil:pxart')));
  await page.locator('[data-t="erase"]').first().click();
  for (let y = 0; y < 16; y++) { const p = at(7, y); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); }
  await page.locator('[data-t="pen"]').first().click();
  await page.locator('#sw button[data-c="10"]').click();
  const a = at(2, 2), b = at(6, 2);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 6 }); await page.mouse.up();
  let st = await state();
  ok(st.px[2].slice(2, 7).every((v) => v === 10), 'dragging draws an unbroken line of the chosen colour');
  await page.locator('#mir').check();
  const c = at(1, 9); await page.mouse.click(c.x, c.y);
  st = await state(); ok(st.px[9][1] === 10 && st.px[9][14] === 10, 'mirror mode paints the opposite pixel too');
  await page.locator('#undo').click(); st = await state(); ok(st.px[9][1] === 0 && st.px[9][14] === 0, 'undo reverts the stroke');
  await page.locator('#mir').uncheck();
  await page.locator('[data-t="fill"]').first().click();
  const f = at(12, 12); await page.mouse.click(f.x, f.y);
  st = await state(); ok(st.px[15][15] === 10 && st.px[2][3] === 10, 'fill floods the empty area');
  const dl = page.waitForEvent('download');
  await page.locator('#png').click(); const d = await dl;
  ok(/^sprite-16x16\.png$/.test(d.suggestedFilename()), 'save PNG downloads ' + d.suggestedFilename());
  await page.locator('[data-n="32"]').click(); st = await state(); ok(st.n === 32 && st.px.length === 32 && st.px[2][3] === 10, 'resizing to 32 keeps the drawing');
  await page.reload(); await page.waitForTimeout(500);
  st = await state(); ok(st.n === 32, 'the drawing survives a reload');
  ok(page.errors.length === 0, 'no errors in the editor ' + JSON.stringify(page.errors.slice(0, 3)));

  section('drills (Zig and C++)');
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('sil:progress') || '{}'); delete p['gd-loop']; localStorage.setItem('sil:progress', JSON.stringify(p)); });
  await page.go(url, '#/lesson/gd-loop', 400);
  ok(await page.locator('.dr-body').count() === 1, 'the drill shows');
  ok((await page.locator('.dr-code').innerText()).includes('fixedSteps'), 'Zig is the default language');
  await page.locator('[data-lang="cpp"]').click();
  ok((await page.locator('.dr-code').innerText()).includes('fixed_steps'), 'the C++ tab shows the C++ starter');
  ok(/g\+\+ -std=c\+\+20/.test(await page.locator('.dr-body').innerText()), 'it shows the compile command');
  await page.reload(); await page.waitForTimeout(500);
  ok((await page.locator('.dr-code').innerText()).includes('fixed_steps'), 'the language choice is remembered');
  const dl2 = page.waitForEvent('download');
  await page.locator('.ddl').click(); const d2 = await dl2;
  ok(d2.suggestedFilename() === 'fixed_steps.cpp', 'download gives ' + d2.suggestedFilename());
  await page.locator('.dsol').click(); ok(await page.locator('.dsolbox').isVisible(), 'the solution can be revealed');
  await page.locator('.hint').first().click(); ok(await page.locator('.dhint').isVisible(), 'and the hint');
  const xp0 = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:xp') || '0'));
  await page.locator('.dpass').click(); await page.waitForTimeout(300);
  const xp1 = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:xp') || '0'));
  ok(xp1 > xp0 && (await page.locator('.dpass').isDisabled()), 'marking a drill as passed awards XP and locks the button');
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem('sil:progress'))['gd-loop'])) && Object.keys(await page.evaluate(() => JSON.parse(localStorage.getItem('sil:progress'))['gd-loop'])).some((k) => k.startsWith('x:drill-fixed')), 'progress is stored under the drill\'s pid');

  section('mobile layout');
  await page.setViewportSize({ width: 390, height: 800 });
  const wide = [];
  for (const r of ['#/', '#/track/gdpixel', '#/lesson/px-basics', '#/lesson/px-color', '#/lesson/px-shading', '#/lesson/px-anim', '#/lesson/gd-loop', '#/lesson/gd-collision', '#/lesson/gd-smoothing', '#/lesson/gd-juice', '#/lesson/gd-procgen', '#/lesson/gd-zig', '#/lesson/gd-cpp']) {
    await page.go(url, r, 350);
    const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth }));
    if (w.sw > w.vw + 1) wide.push(r + ' ' + w.sw);
  }
  ok(wide.length === 0, 'no sideways scroll at 390px' + (wide.length ? ': ' + wide.join(', ') : ''));
  const hdr = await page.evaluate(() => { const t = document.querySelector('.top-in'); return t.scrollWidth <= t.clientWidth + 1; });
  ok(hdr, 'the header fits on a phone');
  await page.setViewportSize({ width: 1280, height: 1000 });

  section('back to interview prep');
  await page.go(url, '#/', 300);
  await page.locator('#modeBtn').click(); await page.waitForTimeout(700);
  s = await page.evaluate(() => ({ mode: window.MODE, game: TRACKS.some((t) => t.domain === 'gamedev'), n: TRACKS.length, theme: document.documentElement.dataset.mode || null, accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() }));
  ok(s.mode === 'interview' && !s.game && s.n >= 9 && s.theme === null && s.accent === '#39ff7a', JSON.stringify(s) + ' switching back restores the original section and its green theme');
  ok(page.errors.length === 0, 'no errors overall ' + JSON.stringify(page.errors.slice(0, 3)));
  await ctx.close();
}
