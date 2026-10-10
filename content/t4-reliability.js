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
        { type: 'code', ref: 'idempotent' },
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
        { type: 'code', ref: 'breaker' },
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
