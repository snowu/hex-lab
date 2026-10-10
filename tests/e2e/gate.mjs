// The owner gate: the focus track is hidden unless the stored sign-in session belongs to the owner email.
import { newPage } from './helpers.mjs';
export default async function ({ url, browser, ok }) {
  const SDK = `export function createClient(u, k, o) { const SK = o.auth.storageKey; return { auth: { async getSession() { try { return { data: { session: JSON.parse(localStorage.getItem(SK)) }, error: null }; } catch { return { data: { session: null }, error: null }; } }, onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; } }, from() { return { select() { return { async maybeSingle() { return { data: null, error: null }; } }; } }; } }; }`;
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await context.route(/@supabase\/supabase-js@.*\/\+esm/, (route) => route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: SDK }));
  const page = await newPage(context);
  const state = () => page.evaluate(() => ({ track: TRACKS.some((t) => t.id === 'openbanking'), mock: MOCK.some((q) => /^Neonomics/.test(q.kind)), cards: CARDS.some((c) => c.track === 'Open Banking'), res: RESOURCES.some((r) => /^Neonomics/.test(r.cat)), text: document.body.innerText.includes('Neonomics & Open Banking') }));
  const withUser = async (email) => { await page.evaluate((e) => { if (e) localStorage.setItem('sil-auth', JSON.stringify({ access_token: 'x', user: { email: e } })); else localStorage.removeItem('sil-auth'); }, email); await page.reload(); await page.waitForTimeout(500); };
  await page.goto(url + '#/'); await page.waitForTimeout(500);
  let s = await state();
  ok(!s.track && !s.mock && !s.cards && !s.res && !s.text, 'signed out: track, mock questions, cards and resources are all hidden ' + JSON.stringify(s));
  await withUser('someone.else@example.com'); s = await state();
  ok(!s.track && !s.mock && !s.cards && !s.res, 'another account does not see them');
  await withUser('Zancato.T@gmail.com'); s = await state();
  ok(s.track && s.mock && s.cards && s.res, 'the owner email (any letter case) sees all of it ' + JSON.stringify(s));
  await page.go(url, '#/lesson/ob-landscape', 500);
  ok((await page.locator('body').innerText()).length > 500 && !page.errors.length, 'and the lesson opens');
  await withUser(null); s = await state();
  ok(!s.track, 'removing the session hides it again');
  ok(page.errors.length === 0, 'no page errors ' + page.errors.join('|'));
  await page.context().close();
}
