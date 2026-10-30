TRACKS.push({
  id: 'reliability', icon: '🛡️', title: 'Distributed Systems & Reliability',
  blurb: 'Idempotency, sagas, circuit breakers, observability and incidents: the things that happen at 3am in a payments company.',
  lessons: [
    {
      id: 'idempotency', title: 'Idempotency & exactly-once effects', minutes: 18,
      summary: 'Make retries safe. Implement an idempotency-key store.',
      checks: [
        { q: 'A client retries "pay 100" with the same Idempotency-Key but a changed body (amount 200). How must the server respond?',
          options: ['Charge 200; the latest body wins', 'Charge both and refund one later', 'Reject with 422/409, because same key with different payload is a client bug', 'Ignore the key and process it as a new payment'],
          answer: 2, explain: 'The key binds one logical operation to one payload. Same key with a different body must be rejected, not executed twice.' },
        { q: 'Two requests with the same Idempotency-Key arrive at once while the first is still being processed. What is correct?',
          options: ['Run both and return both results', 'Return 409 or wait on the in-flight request; never run the effect twice', 'Delete the key so the second becomes a fresh request', 'Keep whichever finishes last'],
          answer: 1, explain: 'Concurrent duplicates must not execute twice. Claim the key atomically (unique constraint in one transaction) and make the second waiter fail fast or wait.' },
      ],
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
      checks: [
        { q: 'Your team debates saga styles for a checkout flow that must be easy to observe and reason about. Which do you pick and why?',
          options: ['Choreography, because implicit event flows are easier to debug', 'A two-phase commit across all services for atomicity', 'Orchestration, where a coordinator drives the steps, because the flow is explicit and observable', 'No coordinator and no events; hope each service guesses correctly'],
          answer: 2, explain: 'Orchestration centralises the flow in a coordinator, which is easier to reason about and observe; choreography is loosely coupled but the flow is implicit.' },
        { q: 'The breaker for a slow bank dependency is open. A new payment request arrives. What happens, and what happens next?',
          options: ['It queues behind the slow calls until a thread frees up', 'It fails fast without calling the bank, and after a cooldown one probe goes through half-open to test recovery', 'It bypasses the breaker for VIP customers', 'It retries the bank immediately ten times'],
          answer: 1, explain: 'An open breaker fails fast so threads stop piling up against a dead dependency, then half-open lets one probe through; success closes it, failure re-opens it.' },
      ],
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
      checks: [
        { q: 'Which alert best catches a real user-facing problem before customers complain?',
          options: ['CPU above 80% on one host', 'Disk usage trending up over a week', 'SLO burn rate: error rate and latency against the objective, such as 99.9% under 2s', 'Number of deploys per day'],
          answer: 2, explain: 'Alert on symptoms (SLO burn rate), not causes (CPU). RED metrics for services and USE for resources keep the signal on what users feel.' },
        { q: 'Your incident review draft says: "We diagnosed the bug, then rolled back, then told support." What is wrong with that order?',
          options: ['Nothing; diagnosis must always come first', 'Mitigation comes first: roll back or flag off to restore service, then diagnose with data and narrate detect, mitigate, diagnose, fix, learn', 'Support should never be told about incidents', 'Rollbacks are too risky to do early'],
          answer: 1, explain: 'Senior incident order is mitigate first, diagnose second. Rollback is cheap and reversible, and the story runs detect, mitigate, diagnose, fix, learn.' },
      ],
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
    {
      id: 'coordination', title: 'Coordination: leaders, leases, quorums and clocks', minutes: 25,
      summary: 'Exactly one worker, fencing tokens, quorums, consensus and why wall clocks lie.',
      checks: [
        { q: 'Worker A holds a 10-second lease, then pauses for 30 seconds in a GC pause. Worker B takes the lease and writes. A wakes up and writes too. What prevents A’s write from landing?',
          options: ['A shorter lease, such as 1 second', 'A fencing token: the storage rejects writes carrying a token smaller than the largest it has seen', 'Checking the lease again just before writing', 'Synchronising the clocks with NTP'],
          answer: 1, explain: 'A paused process cannot know its lease expired, and any check-then-write has a gap. Only the resource enforcing a monotonically increasing token closes it.' },
        { q: 'A replicated store has N = 3 replicas. Which read/write quorum setting guarantees that every read overlaps the latest successful write?',
          options: ['W = 1, R = 1', 'W = 2, R = 1', 'W = 2, R = 2', 'W = 1, R = 2'],
          answer: 2, explain: 'Reads see the latest write when R + W > N. With N = 3, W = 2 and R = 2 gives 4 > 3, so at least one replica in every read quorum has the write.' },
      ],
      sections: [
        { type: 'text', html: `
<p>Designs regularly need “exactly one of these at a time”: one scheduler firing the nightly batch, one consumer per partition, one worker refreshing a bank’s token. That is coordination, and it is where confident designs quietly break.</p>
<h3>Leader election with leases</h3>
<p>A <b>lease</b> is a lock with an expiry: the holder must renew it before the time-to-live runs out, or someone else may take it. Leases are how you survive a holder that crashes. They are usually provided by a coordination service built on consensus (etcd, ZooKeeper, Consul), by a database (a row with an expiry, Postgres advisory locks), or by a managed primitive (a DynamoDB conditional write, a Durable Object).</p>
<h3>The paused-process problem and fencing tokens</h3>
<pre><code>A acquires lease (token 33) ── GC pause 30s ────────────────── wakes, writes with 33 ✗
                     lease expires ── B acquires (token 34), writes with 34 ✓</code></pre>
<p>A cannot know it was paused. Checking the lease right before the write does not help: the pause can happen between the check and the write. The fix lives in the <b>resource</b>: every lease grant comes with a <b>fencing token</b> that only grows, and the storage rejects any write carrying a token lower than one it has already accepted. In SQL that is a conditional write: <code>UPDATE jobs SET ... WHERE id = :id AND fence &lt;= :token</code>.</p>
<p>Rule: <b>a lock tells you who should act; only the resource can enforce it.</b> Locks that only aim to save duplicate work (two workers sending the same reminder email) can skip fencing if duplicates are harmless. Locks that protect correctness (money, state transitions) cannot.</p>
<h3>Quorums</h3>
<p>With <b>N</b> replicas, a write waits for <b>W</b> acknowledgements and a read asks <b>R</b> replicas. If <code>R + W &gt; N</code>, every read set overlaps every write set, so a read can find the latest value (by version). Typical: N = 3, W = 2, R = 2. Lower W or R buys latency and availability and gives up that overlap. Quorums are also why clusters have odd sizes: 3 nodes tolerate 1 failure, 5 tolerate 2, and 4 still tolerate only 1.</p>
<h3>Consensus, in one paragraph</h3>
<p>Consensus (Raft, Paxos) lets a group agree on one ordered log despite crashes. Raft in brief: nodes elect a leader for a numbered <b>term</b> with a majority vote; the leader appends entries and commits each one once a majority has stored it; a new leader must hold every committed entry. You almost never implement it. You <b>use</b> it via etcd, ZooKeeper, a consensus-backed database (Spanner, CockroachDB) or Kafka’s controller quorum (KRaft), and you should know what it costs: a majority round trip on every write, and no progress without a majority.</p>
<h3>Clocks lie</h3>
<ul>
<li><b>Wall clocks</b> drift and jump (NTP corrections, leap seconds, VM pauses). Never order events across machines by wall-clock timestamps, and never measure durations with them. Use a monotonic clock for timeouts.</li>
<li><b>Lamport clocks</b>: each node keeps a counter, increments it on every event, and on receiving a message sets it to <code>max(local, received) + 1</code>. If A happened before B, A’s number is smaller. The reverse is not guaranteed.</li>
<li><b>Vector clocks</b> keep one counter per node, so you can tell “happened before” apart from “concurrent” and detect conflicts.</li>
<li><b>Hybrid logical clocks</b> combine a wall-clock part with a logical counter: close to real time, but still ordered. CockroachDB and others use them.</li>
<li>In practice the simplest ordering is often a <b>sequence from one authority</b>: a database sequence, a Kafka partition offset, a version column. Prefer that when you can.</li>
</ul>
<h3>Saying it in an interview</h3>
<p>“I need one scheduler. I would take a lease in etcd or a Postgres row with an expiry, renew it at a third of the TTL, and carry the lease revision as a fencing token on every write the scheduler makes, so a paused old leader cannot double-fire. I would not build my own election.”</p>` },
        { type: 'code', ref: 'fencing' },
        { type: 'quiz', q: 'Two services stamp events with their own wall-clock time and you merge the streams by timestamp. Sometimes a “refund” appears before the “payment” it refunds. Why, and what is the fix?',
          options: ['The database is losing events; add replication', 'Clock skew between machines; order by a logical or authoritative sequence (a per-payment version, a Lamport counter, or a single log’s offsets) instead of wall-clock time', 'The events are too frequent; add batching', 'Timezones; store everything in UTC'],
          answer: 1, explain: 'UTC removes timezone confusion but not skew. Machines disagree on “now” by milliseconds or more, so causally related events need a logical order from one authority or a logical clock.' },
        { type: 'quiz', q: 'Your team proposes a 4-node etcd cluster “for extra safety” instead of 3 nodes. What do you say?',
          options: ['Good idea: 4 nodes tolerate 2 failures', 'It tolerates the same single failure as 3 nodes (a majority of 4 is 3) while adding write latency and cost; use 3, or 5 to tolerate 2 failures', 'etcd only supports 4 nodes', 'More nodes always means more availability'],
          answer: 1, explain: 'A majority of 4 is 3, so only one node can fail, the same as with 3 nodes. Odd sizes give the best fault tolerance per node.' },
      ],
    },
    {
      id: 'overload', title: 'Overload, backpressure and safe rollouts', minutes: 22,
      summary: 'Shed load before it sheds you, bound every queue, and ship changes gradually.',
      checks: [
        { q: 'At 2× normal traffic your service’s latency climbs until every request times out, so goodput drops to zero. What is the core fix?',
          options: ['Increase every timeout so requests can finish', 'Admission control: bound concurrency and queue length and reject excess work fast (429/503), ideally lowest priority first', 'Retry failed requests more aggressively', 'Add an unbounded queue in front of the service'],
          answer: 1, explain: 'Without a bound, every request waits behind every other one and all of them time out. Rejecting some quickly keeps the rest fast; that is load shedding.' },
        { q: 'What is the main reason to release a risky change as a canary at 1% instead of to everyone at once?',
          options: ['It makes the deploy faster', 'It limits the blast radius: bad versions hurt 1% of traffic, and automated checks against the baseline can stop the rollout', 'Canary releases avoid the need for tests', 'It is required by Kubernetes'],
          answer: 1, explain: 'Progressive delivery turns a bad deploy from an outage into a small, measured experiment that rolls back on its own.' },
      ],
      sections: [
        { type: 'text', html: `
<p>Most outages at scale are not a component dying. They are a component <b>overloaded</b>: it slows down, callers retry, it slows down further, and a small surge becomes a total outage. Senior designs plan for the surge.</p>
<h3>Why overload collapses</h3>
<ul>
<li><b>Queues hide overload until it is too late.</b> An unbounded queue turns “too much traffic” into “every request is 40 seconds old”, and requests whose callers have already given up still get processed.</li>
<li><b>Retries multiply load.</b> Three layers that each retry three times turn one failing request into 27 calls at the bottom.</li>
<li><b>Latency eats capacity.</b> By Little’s law, requests in flight = arrival rate × latency. If latency goes from 100ms to 2s, you need 20× the connections and threads for the same traffic.</li>
</ul>
<h3>The toolbox</h3>
<table><tr><th>Tool</th><th>What it does</th></tr>
<tr><td>Bounded queues and concurrency limits</td><td>Cap work in flight; anything over the cap is rejected immediately</td></tr>
<tr><td>Load shedding</td><td>Return 429/503 fast when over capacity. Shed the cheapest work first: background refreshes before user-facing reads, reads before payments</td></tr>
<tr><td>Backpressure</td><td>Tell the producer to slow down instead of buffering: a consumer pulls at its own pace (Kafka), a bounded channel blocks the writer, a 429 with <code>Retry-After</code></td></tr>
<tr><td>Deadline propagation</td><td>Pass the remaining time budget downstream; drop work whose deadline has already passed</td></tr>
<tr><td>Retry budgets</td><td>Retry at most ~10% extra traffic per client, retry only at one layer, always with backoff and jitter</td></tr>
<tr><td>Graceful degradation</td><td>Serve cached or partial results with a flag, turn off expensive features (recommendations, search suggestions) first</td></tr>
<tr><td>Adaptive concurrency</td><td>Lower the concurrency limit automatically when latency rises (as TCP congestion control does)</td></tr></table>
<h3>Safe rollouts</h3>
<p>Many incidents come from changes, so the cheapest reliability work is making changes small and reversible:</p>
<ul>
<li><b>Canary:</b> send 1% → 10% → 50% → 100% of traffic to the new version, comparing error rate and latency against the old one at each step, and roll back automatically if it is worse.</li>
<li><b>Blue/green:</b> run the new version alongside the old one and switch traffic at once; rollback is switching back. Simple, but every user moves at the same moment.</li>
<li><b>Feature flags:</b> deploy the code dark, then turn the behaviour on per tenant or per percentage. This separates deploying from releasing, and a kill switch is faster than any redeploy.</li>
<li><b>Expand/contract migrations:</b> add the new column or table, write to both, backfill, switch reads, then remove the old one, so every step can be rolled back on its own.</li>
<li><b>Bake time and change freezes</b> around peak periods (month-end for payments).</li>
</ul>
<div class="callout"><b>In a design round:</b> “Each bank adapter has a concurrency limit and a bounded queue. Over the limit we shed background refreshes first and return 503 with Retry-After to API clients, while user-present requests keep a reserved slice of capacity. New adapter versions go out behind a per-bank flag and a 1% canary.”</div>` },
        { type: 'quiz', q: 'A downstream service is struggling. Your service, its caller, and the API gateway in front each retry failed calls 3 times. What happens during the incident?',
          options: ['Each layer protects the next, so the downstream recovers faster', 'Load on the downstream can grow up to 27× (3 × 3 × 3) exactly when it is weakest; retry at one layer only, with a retry budget, backoff and jitter', 'Retries are harmless because the requests are idempotent', 'Only the gateway’s retries count'],
          answer: 1, explain: 'Retries multiply across layers. Idempotency makes them safe for correctness, not for load. Retry in one place and cap the retry rate.' },
        { type: 'quiz', q: 'Your payment API is over capacity. What should it shed first?',
          options: ['Payment initiations, because they are the slowest', 'Background account refreshes and other deferrable work, keeping capacity for user-present payments and status checks', 'Requests from the largest customers, because they generate the most load', 'Requests at random, so it is fair'],
          answer: 1, explain: 'Shed by priority: deferrable and background work first, protect the money-moving and user-present paths. Shedding randomly treats a cron job like a customer at checkout.' },
        { type: 'reveal', title: 'Self-check: your service at 3× traffic', html: `<ol>
<li>Where is the first bounded resource (DB connections, threads, a bank’s rate limit)? What happens when it fills?</li>
<li>Is any queue unbounded? What is the oldest request it could hold?</li>
<li>How many layers retry? What is the worst-case multiplier?</li>
<li>What do you shed first, and what does the client see?</li>
<li>Which feature would you turn off first, and is there a flag for it today?</li>
</ol>` },
      ],
    },
  ],
});
