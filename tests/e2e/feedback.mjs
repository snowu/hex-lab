// The AI-feedback widget against a fake Worker (request interception): hidden when unconfigured,
// sends the right payload, renders replies as text (never HTML), surfaces errors.
import { newPage } from './helpers.mjs';
const FAKE = 'https://fake-feedback.example';
export default async function ({ url, browser, ok, section }) {
  section('unconfigured: no buttons');
  let page = await newPage(browser);
  await page.route('**/assets/feedback-config.js', (route) => route.fulfill({ contentType: 'text/javascript', body: "window.FEEDBACK_CONFIG={url:''}" }));
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


  section('tutor chat panel');
  const chatReqs = [];
  await page.route(FAKE + '/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, configured: true, model: 'fake-model' }) }));
  await page.route(FAKE + '/chat', async (route) => {
    const body = JSON.parse(route.request().postData()); chatReqs.push(body);
    if (/boom/.test(body.messages.at(-1).content)) return route.fulfill({ status: 502, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'The tutor could not answer. Try again.' }) });
    if (/^Flashcard/.test(body.messages.at(-1).content)) return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ reply: '## Why it works\n\n- first **point**\n- second point\n\n1. step one\n2. step two' }) });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ reply: 'Try a `set`.\n\n```python\nseen = set()\n```\n<img src=x onerror=window.__pwned2=1>' }) });
  });
  await page.go(url, '#/lesson/' + lessonId, 700);
  await page.evaluate(() => { const cm = document.querySelector('#app .CodeMirror'); if (cm) cm.CodeMirror.setValue('def my_unique_draft(): pass'); });
  ok(await page.locator('#chatBtn').isVisible(), 'the chat button is in the header when the Worker is configured');
  await page.locator('#chatBtn').click();
  await page.waitForFunction(() => document.querySelector('#chatSt').dataset.ok === '1');
  ok((await page.locator('#chatSt').innerText()).includes('fake-model'), 'the panel shows the connection test result (model name)');
  await page.locator('#chatIn').fill('why is my code slow?'); await page.keyboard.press('Enter');
  await page.waitForSelector('.chat-msg.assistant:not(.wait)');
  const first = chatReqs[0];
  ok(first && first.messages.at(-1).content === 'why is my code slow?', 'sends the question');
  ok(first.context.includes('my_unique_draft') && first.context.includes('Route: #/lesson/') && first.context.length > 300, 'context carries the page text and the live editor contents');
  ok(await page.locator('.chat-msg.assistant pre code').first().innerText() === 'seen = set()', 'fenced code renders as a code block');
  ok(await page.evaluate(() => !window.__pwned2 && !document.querySelector('.chat-msg img')), 'reply markup is shown as text, not executed');
  await page.locator('#chatCtx').uncheck(); await page.locator('#chatIn').fill('second'); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.chat-msg.assistant:not(.wait)').length >= 2);
  ok(chatReqs[1].context === '' && chatReqs[1].messages.length === 3, 'with page context off nothing is attached, and the history is sent');
  await page.locator('#chatIn').fill('boom'); await page.keyboard.press('Enter');
  await page.waitForSelector('.chat-msg.err');
  ok((await page.locator('.chat-msg.err').innerText()).includes('could not answer') && (await page.locator('#chatIn').inputValue()) === 'boom', 'errors are shown and the message is kept for retry');
  await page.keyboard.press('Escape');
  ok(await page.locator('#chat').isHidden(), 'Escape closes the panel');
  await page.keyboard.press('Control+j');
  ok(await page.locator('#chat').isVisible() && (await page.locator('.chat-msg').count()) >= 4, 'Ctrl+J reopens it with the conversation kept');


  section('Ask AI buttons');
  await page.locator('#chatX').click();
  await page.go(url, '#/review', 600);
  const ask = page.locator('.fc-tools .ask').first();
  ok(await ask.count() === 1, 'a flashcard has an "Ask AI to explain this card" button');
  const before = chatReqs.length;
  await ask.click();
  await page.waitForFunction(() => document.querySelectorAll('.chat-msg.assistant h4').length > 0);
  const sent = chatReqs[before];
  ok(/^Flashcard \(/.test(sent.messages.at(-1).content) && sent.messages.at(-1).content.includes('Card answer:') && sent.messages.at(-1).content.includes('too terse'), 'clicking it opens the chat and sends the card question and answer');
  ok(sent.context.includes('Route: #/review'), 'with the page as context');
  ok(await page.locator('.chat-msg.assistant li').count() === 4 && await page.locator('.chat-msg.assistant strong').innerText() === 'point' && await page.locator('.chat-msg.assistant ol').count() === 1, 'replies render headings, lists and bold');
  const w1 = await page.locator('#chat').evaluate((e) => e.getBoundingClientRect().width);
  await page.locator('#chatWide').click();
  const w2 = await page.locator('#chat').evaluate((e) => e.getBoundingClientRect().width);
  ok(w2 > w1 + 100, `the width toggle makes the chat wider (${Math.round(w1)} -> ${Math.round(w2)}px)`);
  await page.locator('#chatWide').click();
  await page.locator('#chatX').click();
  await page.go(url, '#/lesson/' + lessonId, 600);
  ok(await page.locator('.lhead .ask').count() === 1 && await page.locator('.ex-actions .ask').count() >= 1, 'lesson header and code challenges have Ask AI buttons');
  await page.go(url, '#/mock', 400); await page.locator('.fchip').first().click().catch(() => {});

  section('story and design hooks');
  await page.go(url, '#/stories', 400);
  await page.locator('#snew, [id*="new"]').first().click().catch(() => {});
  await page.waitForTimeout(300);
  ok((await page.locator('#sfbk button').count()) === 1, 'story editor has a feedback button');
  ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
  await page.context().close();
}
