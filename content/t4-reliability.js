TRACKS.push({
  id: 'reliability', icon: '🛡️', title: 'Distributed Systems & Reliability',
  blurb: 'Idempotency, sagas, circuit breakers, observability and incidents: the things that happen at 3am in a payments company.',
  lessons: [
    {
      id: 'idempotency', title: 'Idempotency & exactly-once effects', minutes: 18,
      summary: 'Make retries safe. Implement an idempotency-key store.',
      sections: [
        { type: 'text', html: `
<p>Networks fail <i>after</i> the server did the work. The client cannot tell, so it retries. Without idempotency a retried “pay €100” pays twice. The standard solution: the client sends an <b>Idempotency-Key</b> (UUID) per logical operation; the server stores the result under that key and returns it on repeats.</p>
<h3>The details that get asked</h3>
<ul>
<li><b>Same key, different payload</b> → reject (422/409), it is a client bug.</li>
<li><b>Concurrent duplicate while the first is in flight</b> → return 409 / wait; never run twice.</li>
<li><b>Failure semantics:</b> store the outcome only when it is deterministic; allow retry after transient failure.</li>
<li><b>Scope</b> keys per customer; <b>expire</b> them (e.g. 24h) and say so in the API docs.</li>
<li>Atomicity: claim the key and perform the effect in one DB transaction (unique constraint on key), or use the outbox.</li>
</ul>` },
        { type: 'code', title: 'Idempotent handler wrapper', prompt: `<p>Implement <code>makeIdempotent(handler)</code> returning an async function <code>(key, payload)</code>:</p>
<ul><li>First call with a key runs <code>handler(payload)</code> and caches the result.</li><li>A repeat with the same key and <b>deep-equal payload</b> returns the cached result without calling the handler.</li><li>Same key but different payload → throw an Error with message <code>'key reused with different payload'</code>.</li><li>Concurrent duplicates (first still pending) must share the same in-flight promise, so the handler runs once.</li><li>If the handler throws, do <b>not</b> cache the failure: a later retry with the same key may run again.</li></ul>`,
          starter: `function makeIdempotent(handler) {
  return async function (key, payload) {
  };
}
`,
          tests: `
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
test('runs once for repeats', async () => { let n=0; const f=makeIdempotent(async p=>{ n++; return {id:n}; }); const a=await f('k',{amt:1}); const b=await f('k',{amt:1}); eq(a,b); eq(n,1); });
test('different keys run separately', async () => { let n=0; const f=makeIdempotent(async()=>++n); await f('a',{}); await f('b',{}); eq(n,2); });
test('payload mismatch throws', async () => { const f=makeIdempotent(async()=>1); await f('k',{a:1}); const e=await throws(()=>f('k',{a:2})); eq(e.message,'key reused with different payload'); });
test('concurrent duplicates share work', async () => { let n=0; const f=makeIdempotent(async()=>{ n++; await sleep(20); return 'done'; }); const r=await Promise.all([f('k',{}),f('k',{}),f('k',{})]); eq(r,['done','done','done']); eq(n,1); });
test('failure is not cached', async () => { let n=0; const f=makeIdempotent(async()=>{ if(++n===1) throw new Error('transient'); return 'ok'; }); await throws(()=>f('k',{})); eq(await f('k',{}),'ok'); eq(n,2); });`,
          hint: 'Store { payload (as JSON string), promise } per key synchronously BEFORE awaiting, so concurrent callers see it. On rejection, delete the entry.',
          solution: `function makeIdempotent(handler) {
  const seen = new Map();
  return async function (key, payload) {
    const fp = JSON.stringify(payload);
    const hit = seen.get(key);
    if (hit) {
      if (hit.fp !== fp) throw new Error('key reused with different payload');
      return hit.promise;
    }
    const promise = Promise.resolve().then(() => handler(payload));
    seen.set(key, { fp, promise });
    try { return await promise; }
    catch (e) { seen.delete(key); throw e; }
  };
}`, notes: 'JSON.stringify is order-sensitive; in production hash a canonical form. Real implementations persist in a DB with a unique key, a status (in_progress/completed), and a lock timeout.' },
        { type: 'quiz', q: 'Which operation is naturally idempotent?',
          options: ['POST /payments', 'PUT /customers/42 with the full document', 'Incrementing a counter', 'Appending a log line'],
          answer: 1, explain: 'PUT with a full replacement yields the same state however many times it is applied. POST/increment/append need an idempotency key or dedupe.' },
      ],
    },
    {
      id: 'sagas-breakers', title: 'Sagas, circuit breakers, timeouts', minutes: 20,
      summary: 'Coordinating steps across services, and protecting yourself from slow dependencies.',
      sections: [
        { type: 'text', html: `
<h3>Sagas</h3>
<p>No distributed transaction? Model a business process as a series of local transactions, each with a <b>compensating action</b>. <i>Orchestration</i> (a coordinator drives the steps, easier to reason about and observe) vs <i>choreography</i> (services react to events, loosely coupled but the flow is implicit).</p>
<pre><code>reserve funds -> initiate payment -> await bank status -> book ledger
        on failure: release funds <- cancel payment <- ...</code></pre>
<p>Compensation is <b>semantic</b>, not a rollback: you cannot unsend an email, you send a correction.</p>
<h3>Circuit breaker</h3>
<p>States: <b>closed</b> (normal) → after N failures → <b>open</b> (fail fast for a cooldown) → <b>half-open</b> (let one probe through; success closes, failure re-opens). It stops you from queueing up threads against a dead dependency and gives it room to recover.</p>
<div class="callout"><b>Timeouts are the foundation.</b> Every outbound call needs one, shorter than your caller’s timeout (deadline propagation), or one slow bank will exhaust your connection pool.</div>` },
        { type: 'code', title: 'Circuit breaker', prompt: `<p>Implement <code>class CircuitBreaker</code> with <code>constructor({failureThreshold, cooldownMs, now})</code> and <code>async call(fn)</code>.</p>
<ul><li>Closed: run <code>fn</code>. Count <b>consecutive</b> failures; a success resets the count. At <code>failureThreshold</code> failures → open.</li><li>Open: throw <code>Error('circuit open')</code> immediately, without calling <code>fn</code>, until <code>cooldownMs</code> has passed.</li><li>After the cooldown: half-open. Allow one trial call; success → closed, failure → open again (cooldown restarts).</li></ul>`,
          starter: `class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 1000, now = Date.now } = {}) {
  }
  async call(fn) {
  }
}
`,
          tests: `
function mk(th=2, cd=1000){ let t=0; const cb=new CircuitBreaker({failureThreshold:th, cooldownMs:cd, now:()=>t}); return {cb, adv:ms=>{t+=ms;}}; }
const fail = async () => { throw new Error('down'); };
test('passes through success', async () => { const {cb}=mk(); eq(await cb.call(async()=>5),5); });
test('opens after threshold', async () => { const {cb}=mk(2); await throws(()=>cb.call(fail)); await throws(()=>cb.call(fail)); let called=false; const e=await throws(()=>cb.call(async()=>{called=true;})); eq(e.message,'circuit open'); eq(called,false); });
test('success resets failure count', async () => { const {cb}=mk(2); await throws(()=>cb.call(fail)); await cb.call(async()=>1); await throws(()=>cb.call(fail)); eq(await cb.call(async()=>'still closed'),'still closed'); });
test('half-open success closes', async () => { const {cb,adv}=mk(1,1000); await throws(()=>cb.call(fail)); adv(1000); eq(await cb.call(async()=>'ok'),'ok'); eq(await cb.call(async()=>'ok2'),'ok2'); });
test('half-open failure reopens', async () => { const {cb,adv}=mk(1,1000); await throws(()=>cb.call(fail)); adv(1000); await throws(()=>cb.call(fail)); const e=await throws(()=>cb.call(async()=>1)); eq(e.message,'circuit open'); adv(1000); eq(await cb.call(async()=>1),1); });
test('still open before cooldown', async () => { const {cb,adv}=mk(1,1000); await throws(()=>cb.call(fail)); adv(999); const e=await throws(()=>cb.call(async()=>1)); eq(e.message,'circuit open'); });`,
          hint: 'Track state ("closed" | "open" | "half"), failures, and openedAt. In call(): if open and now - openedAt >= cooldown, move to half. In half-open a failure opens immediately.',
          solution: `class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 1000, now = Date.now } = {}) {
    Object.assign(this, { failureThreshold, cooldownMs, now });
    this.state = 'closed'; this.failures = 0; this.openedAt = 0;
  }
  async call(fn) {
    if (this.state === 'open') {
      if (this.now() - this.openedAt < this.cooldownMs) throw new Error('circuit open');
      this.state = 'half';
    }
    try {
      const r = await fn();
      this.state = 'closed'; this.failures = 0;
      return r;
    } catch (e) {
      this.failures++;
      if (this.state === 'half' || this.failures >= this.failureThreshold) { this.state = 'open'; this.openedAt = this.now(); }
      throw e;
    }
  }
}`, notes: 'Production breakers add: a single probe in half-open (limit concurrency), failure-rate windows instead of consecutive counts, per-dependency instances (per bank!), and metrics on state changes.' },
        { type: 'quiz', q: 'A saga step 3 of 5 fails permanently. What do you do?',
          options: ['Roll back the database transaction', 'Run compensating actions for steps 2 and 1 in reverse order, and make those compensations themselves idempotent and retryable', 'Ignore it and alert', 'Retry step 3 forever'],
          answer: 1, explain: 'Compensations run in reverse, must be idempotent (they may be retried), and the saga state must be persisted so it survives crashes.' },
      ],
    },
    {
      id: 'observability-incidents', title: 'Observability & incident stories', minutes: 12,
      summary: 'What to measure, and how to narrate an incident like a senior.',
      sections: [
        { type: 'text', html: `
<h3>The three pillars, pragmatically</h3>
<ul><li><b>Metrics</b>: RED for services (Rate, Errors, Duration), USE for resources (Utilisation, Saturation, Errors). Alert on <b>symptoms</b> (SLO burn rate), not causes (CPU).</li>
<li><b>Logs</b>: structured, with a correlation/trace id. Never log secrets, tokens, or full account numbers / PII.</li>
<li><b>Traces</b>: show which dependency made the request slow. Propagate context across queues too.</li></ul>
<p><b>SLO example:</b> “99.9% of balance requests succeed in &lt; 2s over 30 days” → error budget = 43 minutes of badness/month. Spending the budget deliberately (risky rollouts) is a feature, burning it silently is an alert.</p>
<h3>Narrating an incident (use this order)</h3>
<ol><li><b>Detect</b>: how did we find out (alert vs customer)?</li><li><b>Mitigate first</b>: rollback, feature flag, fail over. Diagnose second.</li><li><b>Diagnose</b> with data: what you ruled out and why.</li><li><b>Fix & verify</b>.</li><li><b>Learn</b>: blameless review, the systemic fix, a follow-up that actually shipped.</li></ol>` },
        { type: 'quiz', q: 'Error rate on checkout jumps to 20% right after a deploy. What is the first move?',
          options: ['Read the logs until you find the root cause', 'Roll back (or flag off) to restore service, then investigate', 'Scale up the servers', 'Wait five minutes to see if it settles'],
          answer: 1, explain: 'Mitigate before diagnosing. Rollback is cheap and reversible, so make it the default after a fresh deploy.' },
        { type: 'reveal', title: 'Template: incident story', html: `<p><i>“On [date] our [service] started returning [symptom] for [N]% of [users]. We detected it via [alert/customer] after [X] min. I [role], we rolled back / flagged off within [Y] min. Root cause was [cause], which we proved by [evidence]. The systemic fix was [change to design/process/test], and I owned [follow-up] which reduced [metric] by [number].”</i></p>` },
      ],
    },
  ],
});
