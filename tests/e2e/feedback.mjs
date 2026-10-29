// The AI-feedback widget against a fake Worker (request interception): hidden when unconfigured,
// sends the right payload, renders replies as text (never HTML), surfaces errors.
import { newPage } from './helpers.mjs';
const FAKE = 'https://fake-feedback.example';
const U = { model: 'deepseek-v4.1-flash', in: 1000, out: 500 };
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
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ usage: U, verdict: 'partial', strengths: ['clear names'], issues: ['<img src=x onerror=window.__pwned=1> misses the last window'], next_step: 'test the edges' }) });
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
    if (/^Flashcard/.test(body.messages.at(-1).content)) return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ usage: U, reply: '## Why it works\n\n- first **point**\n- second point\n\n1. step one\n2. step two' }) });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ usage: U, reply: 'Try a `set`.\n\n```python\nseen = set()\n```\n<img src=x onerror=window.__pwned2=1>' }) });
  });
  await page.go(url, '#/lesson/' + lessonId, 700);
  await page.evaluate(() => { const cm = document.querySelector('#app .CodeMirror'); if (cm) cm.CodeMirror.setValue('def my_unique_draft(): pass'); });
  ok(await page.locator('#chatBtn').isVisible(), 'the chat button is in the header when the Worker is configured');
  await page.locator('#chatBtn').click();
  await page.waitForFunction(() => document.querySelector('#chatSt').dataset.ok === '1');
  ok((await page.locator('#chatSt').innerText()).includes('fake-model'), 'the panel shows the connection test result (model name)');
  ok(await page.evaluate(() => { const ys = new Set([...document.querySelectorAll('.top nav a')].map((a) => Math.round(a.getBoundingClientRect().top))); return ys.size === 1; }), 'with the chat open the header nav stays on one row');
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


  const ivReqs = [];
  await page.route(FAKE + '/interview', async (route) => {
    const body = JSON.parse(route.request().postData()); ivReqs.push(body);
    const h = { 'access-control-allow-origin': '*' };
    if (body.mode === 'grade') return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify({ usage: U, hits: body.rubric.map((_, i) => i === 0), summary: 'Solid start, thin on failure modes.', strengths: ['Named the key idea'], gaps: ['No failure modes <b>x</b>'], next_step: 'Practise failure modes' }) });
    const n = body.transcript.filter((m) => m.role === 'candidate').length;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify({ usage: U, reply: n >= 2 && body.maxTurns === 4 && body.transcript.length >= 3 && /finish-me/.test(body.transcript.at(-1).content) ? 'Thanks, that is the end of the interview.' : 'And what happens when that call times out?', done: /finish-me/.test(body.transcript.at(-1).content), answers: n }) });
  });

  section('AI mock interviewer');
  await page.go(url, '#/mock', 500);
  await page.locator('#go').click(); await page.waitForSelector('#aibtn');
  const qText = await page.locator('.qq').first().innerText();
  await page.locator('#aibtn').click();
  ok((await page.locator('#aiint .chat-msg.assistant').first().innerText()).trim().length > 10, 'the interviewer opens with the question');
  await page.locator('#aiin').fill('I would use an idempotency key stored with a unique constraint.');
  await page.locator('#aisend').click();
  await page.waitForFunction(() => document.querySelectorAll('#aiint .chat-msg.assistant').length >= 2 && !document.querySelector('#aiint .wait'));
  ok(ivReqs[0].mode === 'turn' && ivReqs[0].transcript.length === 1 && ivReqs[0].transcript[0].role === 'candidate' && ivReqs[0].rubric.length >= 3 && ivReqs[0].question.length > 10, 'sends the question, the rubric and a transcript that starts with the candidate');
  ok((await page.locator('#aiint .chat-msg.assistant').nth(1).innerText()).includes('times out'), 'shows the interviewer follow-up');
  await page.locator('#aifin').click();
  await page.waitForSelector('.ai-grade');
  ok((await page.locator('.ai-grade').innerText()).includes('thin on failure modes') && (await page.locator('.ai-grade').innerText()).includes('<b>x</b>') && !(await page.locator('.ai-grade li b').count()), 'shows the verdict as text, not HTML');
  ok(await page.locator('.rubric li.hit').count() === 1 && await page.locator('.rubric li').first().evaluate((e) => e.classList.contains('hit')), 'the rubric is pre-ticked from the AI grade');
  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem('sil:mockhist')).at(-1));
  ok(rec.hit === 1 && rec.ai === true, 'the attempt is saved to mock history with the AI-graded score');
  await page.locator('.rubric li').nth(1).click();
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem('sil:mockhist')).at(-1).hit)) === 2, 'you can correct a tick afterwards');
  await page.locator('#skip').click(); await page.waitForSelector('#aibtn');
  ok(await page.locator('#aiint').innerText() === '', 'another question starts a clean interview');
  await page.locator('#aibtn').click();
  await page.locator('#aiin').fill('first answer here'); await page.locator('#aisend').click();
  await page.waitForFunction(() => document.querySelectorAll('#aiint .chat-msg.assistant').length >= 2 && !document.querySelector('#aiint .wait'));
  await page.locator('#aiin').fill('finish-me please'); await page.locator('#aisend').click();
  await page.waitForSelector('.ai-grade', { timeout: 15000 });
  ok(ivReqs.some((r) => r.mode === 'grade' && r.transcript.length === 4 && r.transcript[3].role === 'interviewer'), 'when the interviewer ends the interview, grading starts automatically');


  section('AI interviewer entry points');
  await page.go(url, '#/', 500);
  ok(await page.locator('a.tool[href="#/mock/ai"]').count() === 1, 'the home page has an AI interviewer tile');
  await page.go(url, '#/mock', 500);
  ok(await page.locator('#goai').count() === 1, 'the mock landing page has a "Start an AI interview" button');
  await page.locator('#goai').click(); await page.waitForSelector('#aiin');
  ok(await page.locator('.qq').count() === 1 && (await page.locator('#aiint .chat-msg.assistant').first().innerText()).length > 10, 'it picks a question and starts the interview');
  await page.go(url, '#/mock/ai', 700);
  ok(await page.locator('#aiin').isVisible() && await page.locator('nav a[data-nav="mock"].on').count() === 1, '#/mock/ai opens straight into an interview');

  section('Ask AI buttons');
  await page.locator('#chatX').click();
  await page.go(url, '#/review', 600);
  const ask = page.locator('.fc-wrap .ask-mini');
  ok(await ask.count() === 1, 'a flashcard has a small corner Ask AI button');
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
  ok(await page.locator('.lhead .ask-mini').count() === 1 && await page.locator('.ex .ask-mini').count() >= 1, 'lesson header and code challenges have Ask AI buttons');
  await page.go(url, '#/mock', 400); await page.locator('.fchip').first().click().catch(() => {});


  section('usage counter');
  const used = await page.evaluate(() => FEEDBACK.usage());
  ok(used.today.calls >= 8 && used.today.tin === used.today.calls * 1000 && used.today.tout === used.today.calls * 500, `every successful call is counted with its tokens (${used.today.calls} calls, ${used.today.tin} in / ${used.today.tout} out)`);
  const perCall = [(1000 * 0.15 + 500 * 0.6) / 1e6, (1000 * 0.3 + 500 * 1.2) / 1e6];
  ok(perCall.some((c) => Math.abs(used.today.cost - c * used.today.calls) < 1e-9), `the cost estimate uses the model's list price (${used.today.cost.toFixed(5)})`);
  ok(used.today.byFeature.chat >= 3 && used.today.byFeature.interview >= 3 && used.today.byFeature.review >= 1, 'broken down by chat, interviews and reviews ' + JSON.stringify(used.today.byFeature));
  ok(await page.evaluate(() => !Object.keys(SyncCore.snapshot(localStorage)).some((k) => k.startsWith('silu:'))), 'the counter is not part of synced progress');
  await page.go(url, '#/plan', 700);
  ok((await page.locator('#aiusage').innerText()).includes('deepseek-v4.1-flash') && (await page.locator('#aiusage .utile').first().innerText()).includes(String(used.today.calls)), 'the Plan page shows today, this month and a per-model table');
  ok((await page.locator('#aiusage .utable').innerText()).includes('% of $30'), 'with the share of the plan cap');
  await page.locator('#chatBtn').click();
  ok((await page.locator('#chatUse').innerText()).includes('today:'), 'the chat footer shows today\'s usage');
  await page.locator('#chatX').click();
  page.once('dialog', (d) => d.accept());
  await page.locator('#ureset').click();
  ok((await page.evaluate(() => FEEDBACK.usage().all.calls)) === 0, 'reset clears the counter');

  section('story and design hooks');
  await page.go(url, '#/stories', 400);
  await page.locator('#snew, [id*="new"]').first().click().catch(() => {});
  await page.waitForTimeout(300);
  ok((await page.locator('#sfbk button').count()) === 1, 'story editor has a feedback button');
  ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
  await page.context().close();
}
