// My cards (made from mistakes, chat answers and by hand) and spaced repetition for katas.
import fs from 'node:fs';
import path from 'node:path';
import { newPage, root } from './helpers.mjs';
const FAKE = 'https://fake-feedback.example';
export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  await page.route('**/assets/feedback-config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: `window.FEEDBACK_CONFIG={url:'${FAKE}'}` }));
  await page.route(FAKE + '/health', (r) => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"configured":true,"model":"m"}' }));
  const chatReqs = [];
  let chatMode = 'json';
  await page.route(FAKE + '/chat', (r) => {
    const body = JSON.parse(r.request().postData()); chatReqs.push(body);
    const last = body.messages.at(-1).content;
    const reply = /flashcard/i.test(last) ? (chatMode === 'json' ? '```json\n{"q":"Why does a ring limit key movement?","a":"Only the arc next to a new node moves, about `1/N` of keys."}\n```' : 'sorry, no json here') : 'A ring keeps most keys in place when nodes change.';
    return r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ reply, usage: { model: 'deepseek-v4-flash', in: 10, out: 10 } }) });
  });
  const mine = () => page.evaluate(() => JSON.parse(localStorage.getItem('sil:mycards') || '[]'));
  await page.goto(url + '#/'); await page.waitForTimeout(800);

  section('from a quick check');
  const lid = await page.evaluate(() => TRACKS.flatMap((t) => t.lessons).find((l) => l.sections.some((s) => s.type === 'quiz')).id);
  await page.go(url, '#/lesson/' + lid, 800);
  const opts = page.locator('.quiz .opt').first();
  for (let i = 0; i < 4; i++) { if (await page.locator('.quiz .explain.ok').first().count()) break; await page.locator('.quiz').first().locator('.opt').nth(i).click(); await page.waitForTimeout(150); }
  ok(await page.locator('.quiz .explain.ok .addcard').first().isVisible(), 'after answering, "Add to my cards" appears under the explanation');
  await page.locator('.quiz .addcard').first().click();
  let cards = await mine();
  ok(cards.length === 1 && cards[0].track === 'My cards' && cards[0].custom && cards[0].q.length > 5 && cards[0].a.length > 5, 'it creates a card with the question and the correct answer + explanation');
  ok(await page.locator('.quiz .addcard').first().isDisabled(), 'the button flips to "In My cards"');
  await page.evaluate(() => { document.querySelector('.addcard').disabled = false; }); await page.locator('.quiz .addcard').first().click();
  ok((await mine()).length === 1, 'adding the same card twice does not duplicate it');

  section('on the flashcards page');
  await page.go(url, '#/review', 700);
  ok(await page.locator('.fchip', { hasText: 'My cards' }).count() === 1, 'a "My cards" filter appears');
  await page.locator('#newcard').click();
  await page.locator('#cfq').fill('What is <img src=x onerror=window.__pwnedcard=1> idempotency?');
  await page.locator('#cfa').fill('Same request, same effect.\n\n```python\nkey = uuid4()\n```\nUse `Idempotency-Key`.');
  await page.locator('#cfsave').click(); await page.waitForTimeout(300);
  cards = await mine();
  ok(cards.length === 2, 'a hand-written card is saved');
  ok(await page.evaluate(() => !window.__pwnedcard && !document.querySelector('.qq img')), 'card text is escaped, never executed');
  ok(await page.locator('.fchip.on', { hasText: 'My cards' }).count() === 1, 'the deck switches to My cards');
  const back = await page.evaluate(() => CARDS.find((c) => c.custom && c.src === 'manual').a); /* the deck is shuffled, so inspect the stored card */
  ok(back.includes('<pre><code>') && back.includes('<code>Idempotency-Key</code>'), 'code fences and `inline code` render on the back');
  await page.locator('#fc').click();
  ok(await page.locator('.delcard').isVisible(), 'custom cards can be deleted');
  page.once('dialog', (d) => d.accept());
  await page.locator('.delcard').click(); await page.waitForTimeout(200);
  ok((await mine()).length === 1, 'deleting removes it');

  section('from the tutor chat');
  await page.go(url, '#/lesson/' + lid, 600);
  await page.locator('#chatBtn').click(); await page.waitForFunction(() => document.querySelector('#chatSt').dataset.ok === '1');
  await page.locator('#chatIn').fill('why a ring for consistent hashing?'); await page.keyboard.press('Enter');
  await page.waitForSelector('.chat-msg.assistant .chat-card');
  await page.locator('.chat-card').click();
  await page.waitForSelector('.chat-cardedit .cq');
  const edit = await page.locator('.chat-cardedit .cq').inputValue();
  ok(edit.startsWith('Why does a ring') && (await page.locator('.chat-cardedit .ca').inputValue()).includes('1/N'), 'the tutor condenses the reply into an editable card');
  ok(/flashcard/i.test(chatReqs.at(-1).messages.at(-1).content) && chatReqs.at(-1).context === '', 'the request is a card-making prompt with no page context');
  await page.locator('.chat-cardedit .ca').fill('Edited answer about `1/N` keys.');
  await page.locator('.chat-cardedit .sv').click();
  cards = await mine();
  ok(cards.length === 2 && cards.at(-1).a.includes('Edited answer') && cards.at(-1).src === 'chat', 'saving stores your edited version');
  chatMode = 'junk';
  await page.locator('#chatIn').fill('and virtual nodes?'); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.chat-card').length >= 1 && document.querySelectorAll('.chat-msg.assistant:not(.wait)').length >= 2);
  await page.locator('.chat-card').last().click(); await page.waitForSelector('.chat-cardedit .cq');
  ok((await page.locator('.chat-cardedit .cq').inputValue()).includes('virtual nodes'), 'if the tutor does not return JSON, the card falls back to the question and answer');
  await page.locator('.chat-cardedit .cx').click();
  await page.locator('#chatX').click();

  section('spaced repetition for katas');
  const kata = JSON.parse(fs.readFileSync(path.join(root, 'content/katas/python/two-fer.json'), 'utf8'));
  await page.go(url, '#/kata/two-fer', 1200);
  await page.evaluate((code) => document.querySelector('.CodeMirror').CodeMirror.setValue(code), kata.example);
  await page.locator('.run').click(); await page.waitForSelector('.allpass', { timeout: 90000 });
  let sr = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:kreview') || '{}')['two-fer']);
  const days = sr ? (sr.due - Date.now()) / 864e5 : 0;
  ok(sr && sr.box === 0 && days > 1.9 && days < 2.1, `solving a kata schedules a review in 2 days (${days.toFixed(2)})`);
  ok((await page.locator('#ksr').innerText()).includes('Review scheduled'), 'and the page says so');
  await page.locator('.run').click(); await page.waitForTimeout(1500);
  sr = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:kreview'))['two-fer']);
  ok(sr.box === 0, 'passing again before it is due does not change the schedule');
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('sil:kreview')); r['two-fer'].due = Date.now() - 1000; localStorage.setItem('sil:kreview', JSON.stringify(r)); });
  await page.go(url, '#/katas', 500);
  ok((await page.locator('.kstats').innerText()).includes('1 due for review') && await page.locator('.krow .chip.hot', { hasText: 'due' }).count() === 1, 'a due kata shows up in the list and the stats');
  ok(/^review:/i.test((await page.locator('.kstats .btn.primary').innerText()).trim()), 'the main button becomes "Review: …"');
  await page.go(url, '#/plan', 700);
  ok((await page.locator('.plan').innerText()).includes('Kata review: Two Fer'), 'the daily plan includes the kata review');
  await page.go(url, '#/kata/two-fer', 1200);
  ok((await page.locator('#ksr').innerText()).includes('Due for review now'), 'the kata page says it is due');
  await page.evaluate((code) => document.querySelector('.CodeMirror').CodeMirror.setValue(code), kata.example);
  await page.locator('.run').click(); await page.waitForSelector('.allpass', { timeout: 90000 }); await page.waitForTimeout(300);
  sr = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:kreview'))['two-fer']);
  const d2 = (sr.due - Date.now()) / 864e5;
  ok(sr.box === 1 && d2 > 4.9 && d2 < 5.1, `re-solving a due kata moves it up a box and out to 5 days (box ${sr.box}, ${d2.toFixed(2)} days)`);
  await page.locator('#kshakybtn').click();
  sr = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:kreview'))['two-fer']);
  ok(sr.box === 0 && (sr.due - Date.now()) / 864e5 < 1.05, '"Mark as shaky" resets it to review tomorrow');
  const synced = await page.evaluate(() => Object.keys(SyncCore.snapshot(localStorage)));
  ok(synced.includes('sil:kreview') && synced.includes('sil:mycards'), 'cards and review schedule are part of synced progress');
  ok(page.errors.length === 0, 'no page errors ' + page.errors.slice(0, 2).join(' | '));
  await page.context().close();
}
