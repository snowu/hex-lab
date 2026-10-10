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
await t('sends the key as a bearer token to the configured model only', async () => {
  let seen;
  await handle(req(ok), { ...env, LAB_MODEL: 'glm-5.3-flash' }, async (u, init) => { seen = { u, init }; return new Response(JSON.stringify({ choices: [{ message: { content: GOOD } }] })); });
  assert.equal(seen.init.headers.authorization, 'Bearer k'); assert.equal(seen.init.headers['x-opencode-session'], 'interview-lab'); assert.equal(JSON.parse(seen.init.body).model, 'glm-5.3-flash');
  assert.match(seen.u, /^https:\/\/opencode\.ai\/zen\/go\/v1\/chat\/completions$/);
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
