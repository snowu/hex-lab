/* Offline tests for the feedback Worker: no network, the model is a fake. Run: node scripts/test-worker.mjs */
import assert from 'node:assert/strict';
import { handle, parseFeedback, parseRequest, corsHeaders, LIMITS } from '../worker/feedback.mjs';

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
