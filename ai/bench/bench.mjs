/* Benchmarks OpenCode Go models as interview-answer reviewers.
   Usage:  OPENCODE_API_KEY=... node ai/bench/bench.mjs [model ...] [--runs=2] [--out=results.json]
   The key is read from the environment only and is never printed or written. */
import { FIXTURES } from './fixtures.mjs';
import { writeFileSync } from 'node:fs';

const BASE = process.env.OPENCODE_BASE || 'https://opencode.ai/zen/go/v1';
const KEY = process.env.OPENCODE_API_KEY;
if (!KEY) { console.error('Set OPENCODE_API_KEY'); process.exit(2); }
const args = process.argv.slice(2);
const flag = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] ?? d;
const RUNS = Number(flag('runs', 1));
const OUT = flag('out', '');
const DEFAULTS = ['deepseek-v4-flash', 'glm-5.3-flash', 'qwen3.8-flash', 'mimo-v2.6-flash', 'minimax-m2.7', 'kimi-k2.6', 'hy3', 'claude-haiku-5-5'];
const models = args.filter((a) => !a.startsWith('--')); if (!models.length) models.push(...DEFAULTS);

export const SYSTEM = `You are a strict senior interviewer reviewing a candidate's answer. Be specific and honest; never flatter. If the answer is correct, say so briefly and name one real improvement (or none). Never invent bugs.
Reply with ONLY a JSON object, no markdown fence:
{"verdict":"pass"|"partial"|"fail","strengths":[string],"issues":[string],"next_step":string}
Max 3 items per list, each under 25 words.`;

const strip = (t) => t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
function parse(text) {
  const t = strip(text).replace(/^```(?:json)?|```$/gm, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { const o = JSON.parse(t.slice(a, b + 1)); return ['pass', 'partial', 'fail'].includes(o.verdict) && Array.isArray(o.issues) ? o : null; } catch { return null; }
}
function score(fx, obj, raw) {
  const flat = obj ? [...obj.strengths || [], ...obj.issues || [], obj.next_step || ''].join(' ') : strip(raw);
  const hit = fx.must.every((alts) => alts.some((re) => re.test(flat)));
  const bad = fx.mustNot.some((re) => re.test(flat));
  return { hit, bad };
}
async function call(model, fx) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model, max_tokens: 1200, temperature: 0.2, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: `Question:\n${fx.prompt}\n\nCandidate answer:\n${fx.answer}` }] }),
    signal: AbortSignal.timeout(90_000),
  });
  const ms = Date.now() - t0;
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: `${res.status} ${JSON.stringify(data).slice(0, 160)}`, ms };
  const raw = data?.choices?.[0]?.message?.content ?? '';
  return { raw, ms, usage: data.usage };
}

const results = [];
for (const model of models) {
  const rows = [];
  for (const fx of FIXTURES) for (let r = 0; r < RUNS; r++) {
    let out; try { out = await call(model, fx); } catch (e) { out = { error: String(e.message || e), ms: 0 }; }
    if (out.error) { rows.push({ fx: fx.id, error: out.error, ms: out.ms }); continue; }
    const obj = parse(out.raw), s = score(fx, obj, out.raw);
    rows.push({ fx: fx.id, json: !!obj, hit: s.hit, bad: s.bad, ms: out.ms, tokens: out.usage?.completion_tokens, verdict: obj?.verdict, raw: out.raw });
  }
  const ok = rows.filter((r) => !r.error);
  const sum = (f) => ok.reduce((a, r) => a + f(r), 0);
  const line = { model, n: rows.length, errors: rows.length - ok.length, json: sum((r) => +r.json), caught: sum((r) => +(r.hit && !r.bad)), avgMs: ok.length ? Math.round(sum((r) => r.ms) / ok.length) : null, avgTok: ok.length ? Math.round(sum((r) => r.tokens || 0) / ok.length) : null };
  console.log(`${model.padEnd(22)} ok ${line.caught}/${line.n}  json ${line.json}/${line.n}  err ${line.errors}  ${line.avgMs}ms  ~${line.avgTok}tok`);
  results.push({ ...line, rows });
}
if (OUT) writeFileSync(OUT, JSON.stringify(results, null, 1));
