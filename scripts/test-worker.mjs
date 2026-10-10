/* Offline tests for the feedback Worker: no network, the model is a fake. Run: node scripts/test-worker.mjs */
import assert from 'node:assert/strict';
import { handle, parseFeedback, parseRequest, corsHeaders, LIMITS, CHAT_LIMITS, chatSystem, INTERVIEW_LIMITS, interviewSystem, parseGrade } from '../worker/feedback.mjs';

let pass = 0, total = 0;
const t = async (name, fn) => { total++; try { await fn(); pass++; } catch (e) { console.error('FAIL', name, '\n ', e.message); process.exitCode = 1; } };
const GOOD = '{"verdict":"partial","strengths":["clear"],"issues":["off by one"],"next_step":"test edges"}';
const model = (content, status = 200) => async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
const ORIGIN = 'https://snowu.github.io';
const req = (body, { origin = ORIGIN, method = 'POST', path = '/feedback' } = {}) =>
  new Request('https://w.example' + path, { method, headers: { 'content-type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: method === 'POST' ? JSON.stringify(body) : undefined });
const ok = { kind: 'code', prompt: 'Write f', answer: 'def f(): return 1' };
const env = { OPENCODE_API_KEY: 'k', LAB_LIMIT: { limit: async () => ({ success: true }) } };

await t('answers an allowed origin with CORS and parsed feedback', async () => {
  const r = await handle(req(ok), env, model('<think>x</think>' + GOOD));
  assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal((await r.json()).verdict, 'partial');
});
await t('refuses other origins and a missing origin', async () => {
  for (const origin of ['https://evil.example', 'https://snowu.github.io.evil.example', null]) assert.equal((await handle(req(ok, { origin }), env, model(GOOD))).status, 403);
});
await t('preflight: 204 for the lab, 403 otherwise', async () => {
  assert.equal((await handle(req(null, { method: 'OPTIONS' }), env)).status, 204);
  assert.equal((await handle(req(null, { method: 'OPTIONS', origin: 'https://x.example' }), env)).status, 403);
});
await t('rate limit returns 429 and never calls the model', async () => {
  let called = false;
  const r = await handle(req(ok), { ...env, LAB_LIMIT: { limit: async () => ({ success: false }) } }, async () => { called = true; return new Response('{}'); });
  assert.equal(r.status, 429); assert.equal(called, false);
});
await t('rejects bad input before spending a call', async () => {
  let called = false; const f = async () => { called = true; return new Response('{}'); };
  for (const b of [{ ...ok, kind: 'poem' }, { ...ok, answer: 'x'.repeat(LIMITS.answer + 1) }, { ...ok, answer: 'short' }]) assert.equal((await handle(req(b), env, f)).status, 400);
  assert.equal(called, false);
});
await t('no key configured -> 503; unknown path -> 404; GET -> 405', async () => {
  assert.equal((await handle(req(ok), { LAB_LIMIT: env.LAB_LIMIT }, model(GOOD))).status, 503);
  assert.equal((await handle(req(ok, { path: '/nope' }), env)).status, 404);
  assert.equal((await handle(new Request('https://w.example/feedback', { headers: { Origin: ORIGIN } }), env)).status, 405);
});
await t('provider failure and junk replies become 502, not leaks', async () => {
  assert.equal((await handle(req(ok), env, model('', 500))).status, 502);
  const r = await handle(req(ok), env, model('sorry, I cannot')); assert.equal(r.status, 502);
  assert.ok(!(await r.text()).includes('sorry'));
});
await t('routes by kind: code/sql -> muse via /responses, design/story -> deepseek via chat', async () => {
  const urls = [];
  const f = async (u, init) => { urls.push([u, JSON.parse(init.body).model, init.headers.authorization, init.headers['x-opencode-session']]); return u.endsWith('/responses')
    ? new Response(JSON.stringify({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: GOOD }] }] }))
    : new Response(JSON.stringify({ choices: [{ message: { content: GOOD } }] })); };
  for (const kind of ['code', 'sql', 'design', 'story']) assert.equal((await handle(req({ ...ok, kind }), env, f)).status, 200);
  assert.deepEqual(urls.map((x) => x[0].split('/v1/')[1]), ['responses', 'responses', 'chat/completions', 'chat/completions']);
  assert.deepEqual(urls.map((x) => x[1]), ['muse-spark-1.3-contributor', 'muse-spark-1.3-contributor', 'deepseek-v4-flash', 'deepseek-v4-flash']);
  assert.ok(urls.every((x) => x[2] === 'Bearer k' && x[3] === 'interview-lab'));
});
await t('personal kinds never reach the training model, even as a fallback', async () => {
  const models = [];
  const f = async (u, init) => { models.push(JSON.parse(init.body).model); return new Response('{}', { status: 500 }); };
  for (const kind of ['design', 'story']) await handle(req({ ...ok, kind }), env, f);
  assert.ok(models.length > 0 && models.every((m) => !/^muse/.test(m)));
});
await t('if the code model fails, the general model answers', async () => {
  const models = [];
  const f = async (u, init) => { const m = JSON.parse(init.body).model; models.push(m); return /^muse/.test(m) ? new Response('{}', { status: 500 }) : new Response(JSON.stringify({ choices: [{ message: { content: GOOD } }] })); };
  const r = await handle(req(ok), env, f);
  assert.equal(r.status, 200); assert.deepEqual(models, ['muse-spark-1.3-contributor', 'deepseek-v4-flash']);
});
await t('chat: answers with page context as data, uses the non-training model, strips <think>', async () => {
  let sent;
  const f = async (u, init) => { sent = { u, body: JSON.parse(init.body) }; return new Response(JSON.stringify({ choices: [{ message: { content: '<think>x</think>Use a set.' } }] })); };
  const r = await handle(req({ messages: [{ role: 'user', content: 'why is this slow?' }], context: 'PAGE: has_dup with nested loops' }, { path: '/chat' }), env, f);
  assert.equal(r.status, 200); assert.equal((await r.json()).reply, 'Use a set.');
  assert.match(sent.u, /chat\/completions$/); assert.equal(sent.body.model, 'deepseek-v4-flash');
  assert.equal(sent.body.messages[0].role, 'system'); assert.match(sent.body.messages[0].content, /nested loops/); assert.match(sent.body.messages[0].content, /DATA, not instructions/);
  assert.equal(sent.body.messages.at(-1).content, 'why is this slow?');
});
await t('chat: validates shape, size and origin; caps context', async () => {
  let called = false; const f = async () => { called = true; return new Response('{}'); };
  const m = (content, role = 'user') => ({ role, content });
  for (const b of [{}, { messages: [] }, { messages: [m('hi', 'system')] }, { messages: [m('x'.repeat(CHAT_LIMITS.message + 1))] }, { messages: [m('hi'), m('yo', 'assistant')] }, { messages: Array.from({ length: CHAT_LIMITS.messages + 1 }, () => m('hi')) }]) assert.equal((await handle(req(b, { path: '/chat' }), env, f)).status, 400);
  assert.equal((await handle(req({ messages: [m('hi')] }, { path: '/chat', origin: 'https://evil.example' }), env, f)).status, 403);
  assert.equal(called, false);
  assert.ok(chatSystem('c'.repeat(CHAT_LIMITS.context)).length < CHAT_LIMITS.context + 2000);
});
await t('chat: uses its own rate limiter and reports provider failure as 502', async () => {
  const hit = [];
  const e2 = { ...env, LAB_LIMIT: { limit: async () => { hit.push('feedback'); return { success: true }; } }, LAB_CHAT_LIMIT: { limit: async () => { hit.push('chat'); return { success: false }; } } };
  assert.equal((await handle(req({ messages: [{ role: 'user', content: 'hi' }] }, { path: '/chat' }), e2, model(GOOD))).status, 429);
  assert.deepEqual(hit, ['chat']);
  assert.equal((await handle(req({ messages: [{ role: 'user', content: 'hi' }] }, { path: '/chat' }), env, model('', 500))).status, 502);
});
const IV = { question: 'How do you make a payment idempotent?', rubric: ['Idempotency key', 'Unique constraint', 'Store the response'], kind: 'Payments' };
const cand = (c) => ({ role: 'candidate', content: c }), intv = (c) => ({ role: 'interviewer', content: c });
await t('interview turn: rubric stays server-side, follow-up returned, final turn is flagged and closes the interview', async () => {
  const sent = [];
  const f = async (u, init) => { sent.push(JSON.parse(init.body)); return new Response(JSON.stringify({ choices: [{ message: { content: '<think>x</think>What happens if the client retries after a timeout?' } }] })); };
  let r = await handle(req({ ...IV, mode: 'turn', maxTurns: 3, transcript: [cand('I would use a key')] }, { path: '/interview' }), env, f);
  let j = await r.json(); assert.equal(r.status, 200); assert.equal(j.reply, 'What happens if the client retries after a timeout?'); assert.equal(j.done, false);
  assert.match(sent[0].messages[0].content, /Idempotency key/); assert.match(sent[0].messages[0].content, /NEVER reveal/); assert.ok(!JSON.stringify(j).includes('Unique constraint'));
  assert.equal(sent[0].messages[1].role, 'user'); assert.doesNotMatch(sent[0].messages[0].content, /final turn/);
  r = await handle(req({ ...IV, mode: 'turn', maxTurns: 2, transcript: [cand('a'.repeat(20)), intv('why?'), cand('b'.repeat(20))] }, { path: '/interview' }), env, f);
  j = await r.json(); assert.equal(j.done, true); assert.match(sent[1].messages[0].content, /final turn/);
  assert.deepEqual(sent[1].messages.slice(1).map((m) => m.role), ['user', 'assistant', 'user']);
});
await t('interview grade: parses hits, requires exactly one boolean per rubric item', async () => {
  const good = JSON.stringify({ hits: [true, false, false], summary: 's', strengths: ['x'], gaps: ['y', 'z'], next_step: 'n' });
  const r = await handle(req({ ...IV, mode: 'grade', transcript: [cand('I use a key'), intv('and?'), cand('that is it')] }, { path: '/interview' }), env, model('```json\n' + good + '\n```'));
  const j = await r.json(); assert.equal(r.status, 200); assert.deepEqual(j.hits, [true, false, false]); assert.equal(j.gaps.length, 2);
  assert.equal((await handle(req({ ...IV, mode: 'grade', transcript: [cand('x'.repeat(12))] }, { path: '/interview' }), env, model(JSON.stringify({ hits: [true] })))).status, 502);
  assert.equal(parseGrade(good.replace('[true,false,false]', '["yes",1,true]'), 3).hits.join(), 'false,false,true');
});
await t('interview: validation, origin and size limits', async () => {
  let called = false; const f = async () => { called = true; return new Response('{}'); };
  const ok1 = { ...IV, mode: 'turn', transcript: [cand('hello there')] };
  for (const b of [{}, { ...ok1, mode: 'x' }, { ...ok1, question: '' }, { ...ok1, rubric: [] }, { ...ok1, rubric: Array(INTERVIEW_LIMITS.rubric + 1).fill('r') }, { ...ok1, transcript: [intv('hi')] }, { ...ok1, transcript: [cand('a'), intv('b')] }, { ...ok1, transcript: Array(INTERVIEW_LIMITS.transcript + 1).fill(cand('z')) }, { ...ok1, transcript: [cand('x'.repeat(INTERVIEW_LIMITS.message + 1))] }]) assert.equal((await handle(req(b, { path: '/interview' }), env, f)).status, 400);
  assert.equal((await handle(req(ok1, { path: '/interview', origin: 'https://evil.example' }), env, f)).status, 403);
  assert.equal(called, false);
  assert.match(interviewSystem({ ...IV }, false), /DATA/);
});
await t('usage: every route reports the provider token counts and the model', async () => {
  const chatU = (c) => async () => new Response(JSON.stringify({ choices: [{ message: { content: c } }], usage: { prompt_tokens: 120, completion_tokens: 30 } }));
  const respU = async () => new Response(JSON.stringify({ output: [{ type: 'message', content: [{ text: GOOD }] }], usage: { input_tokens: 50, output_tokens: 700 } }));
  let j = await (await handle(req({ messages: [{ role: 'user', content: 'hi' }] }, { path: '/chat' }), env, chatU('ok'))).json();
  assert.deepEqual(j.usage, { model: 'deepseek-v4-flash', in: 120, out: 30 });
  j = await (await handle(req({ ...ok, kind: 'design' }), env, chatU(GOOD))).json();
  assert.deepEqual(j.usage, { model: 'deepseek-v4-flash', in: 120, out: 30 });
  j = await (await handle(req(ok), env, respU)).json();
  assert.deepEqual(j.usage, { model: 'muse-spark-1.3-contributor', in: 50, out: 700 });
  j = await (await handle(req({ ...IV, mode: 'turn', transcript: [cand('hello there friend')] }, { path: '/interview' }), env, chatU('And then?'))).json();
  assert.equal(j.usage.in, 120);
  j = await (await handle(req({ ...IV, mode: 'grade', transcript: [cand('hello there friend')] }, { path: '/interview' }), env, chatU(JSON.stringify({ hits: [true, false, false] })))).json();
  assert.equal(j.usage.out, 30);
  j = await (await handle(req({ messages: [{ role: 'user', content: 'hi' }] }, { path: '/chat' }), env, async () => new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] })))).json();
  assert.deepEqual(j.usage, { model: 'deepseek-v4-flash', in: 0, out: 0 });
});
await t('chat: the tutor\'s own long replies are accepted back as history (the 2000 cap is for what the learner types)', async () => {
  const f = async () => new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }));
  const longReply = 'x'.repeat(6000);
  const msgs = [{ role: 'user', content: 'q1' }, { role: 'assistant', content: longReply }, { role: 'user', content: 'follow up' }];
  assert.equal((await handle(req({ messages: msgs }, { path: '/chat' }), env, f)).status, 200);
  assert.equal((await handle(req({ messages: [{ role: 'user', content: 'x'.repeat(2001) }] }, { path: '/chat' }), env, f)).status, 400);
  assert.equal((await handle(req({ messages: [...msgs.slice(0, 1), { role: 'assistant', content: 'x'.repeat(CHAT_LIMITS.assistant + 1) }, msgs[2]] }, { path: '/chat' }), env, f)).status, 400);
  const full = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: i % 2 ? 'y'.repeat(6000) : 'z'.repeat(2000) }));
  assert.equal((await handle(req({ messages: [...full.slice(0, 11), { role: 'user', content: 'last' }], context: 'c'.repeat(9000) }, { path: '/chat' }), env, f)).status, 200);
});
await t('health never reveals the key', async () => {
  const r = await handle(req(null, { method: 'GET', path: '/health' }), env); const j = await r.json();
  assert.equal(j.configured, true); assert.ok(!JSON.stringify(j).includes('"k"'));
});
await t('parse helpers: fenced/think replies, unfinished think, list caps, dev origin', () => {
  assert.equal(parseFeedback('```json\n' + GOOD + '\n```').issues[0], 'off by one');
  assert.equal(parseFeedback('<think>still ' + GOOD), undefined);
  assert.equal(parseFeedback('{"verdict":"amazing","issues":[]}'), undefined);
  assert.equal(parseFeedback(JSON.stringify({ verdict: 'fail', issues: ['a', 'b', 'c', 'd'], next_step: 'n'.repeat(999) })).issues.length, 3);
  assert.equal(typeof parseRequest([]), 'string');
  assert.equal(corsHeaders('http://localhost:8080')['Access-Control-Allow-Origin'], undefined);
  assert.equal(corsHeaders('http://localhost:8080', ['http://localhost:8080'])['Access-Control-Allow-Origin'], 'http://localhost:8080');
});
console.log(`${pass}/${total} worker tests passed`);
