TRACKS.push({
  id: 'design', icon: '🏗️', title: 'System Design',
  blurb: 'A repeatable framework, the building blocks, and worked designs with trade-offs, including a consistent-hashing exercise.',
  lessons: [
    {
      id: 'design-framework', title: 'A framework you can run under pressure', minutes: 12,
      summary: 'Requirements → estimates → API → data → architecture → deep dives → failure.',
      checks: [
        { q: 'You have five minutes left in a design round and jumped straight to boxes and a database choice. What did the framework say to do first?',
          options: ['Pick the database first, since everything else follows from it', 'Clarify the 3-4 must-do functional requirements plus what is out of scope, then set numbers (availability, latency, rps, storage)', 'Draw as many boxes as possible to show breadth', 'Memorise a reference architecture and reproduce it'],
          answer: 1, explain: 'The framework runs clarify-and-scope before architecture: must-do requirements, out-of-scope, then non-functionals and back-of-envelope numbers.' },
        { q: 'Why does the framework ask you to state the read/write ratio before choosing storage and caching?',
          options: ['Because interviewers like arithmetic', 'Because writes are always more important than reads', 'Because the ratio drives storage and caching choices, such as read replicas or denormalisation for read-heavy loads', 'Because it determines the programming language'],
          answer: 2, explain: 'Read/write ratio is a design input, not trivia: it decides whether reads scale via replicas and caches or writes scale via sharding.' },
      ],
      sections: [
        { type: 'text', html: `<p>Interviewers do not want your memorised architecture. They want to watch you <b>structure an open problem</b>. Step through the framework below, then see it applied end to end in the <a href="#/lesson/design-webhooks">webhook worked design</a> and practise it on the <a href="#/design">Design lab</a> reps.</p>` },
        { type: 'steps', steps: [
          { title: '1. Clarify & scope (3-5 min)', html: `<p>Functional requirements (the 3-4 things the system <i>must</i> do) and what is explicitly out of scope. Ask who the users are and what “correct” means. Money? Then correctness beats latency.</p>` },
          { title: '2. Non-functional & numbers', html: `<p>Availability target, latency target (p50/p99), consistency needs, durability, data retention, regulatory limits. Back-of-envelope: requests/sec = users × actions/day ÷ 86,400, peak ≈ 3-10× average. Storage = items × size × retention.</p><pre><code>10M users × 5 actions/day = 50M/day ≈ 580 rps average, ~3k rps peak</code></pre>` },
          { title: '3. API & data model', html: `<p>Sketch 3-5 endpoints (with idempotency on writes), and the core entities with their keys. State your read/write ratio: it drives storage and caching choices.</p>` },
          { title: '4. High-level design', html: `<p>Client → edge/LB → stateless services → data stores, plus async paths (queues, workers). Keep boxes few and each one justified by a requirement.</p>` },
          { title: '5. Deep dives', html: `<p>Pick the 1-2 hardest parts (the interviewer will nudge you). Typical: data partitioning, hot keys, exactly-once effects, fan-out, ranking, consistency between stores.</p>` },
          { title: '6. Failure, scale, operate', html: `<p>What breaks first? Retries, timeouts, backpressure, degradation modes, observability (RED/USE metrics, traces), rollout/rollback, cost. This step is what separates senior from mid.</p>` },
        ] },
        { pid: 'design-clock', type: 'text', html: `
<h3>Running the clock (45-minute round)</h3>
<table><tr><th>Minutes</th><th>Phase</th><th>You are done when…</th></tr>
<tr><td>0-5</td><td>Clarify &amp; scope</td><td>3-4 functional requirements written down, out-of-scope list said out loud</td></tr>
<tr><td>5-10</td><td>Numbers &amp; API</td><td>rps (average and peak), storage, read/write ratio, 3-5 endpoints</td></tr>
<tr><td>10-20</td><td>High-level design</td><td>one diagram that serves every requirement, each box justified</td></tr>
<tr><td>20-38</td><td>Deep dives</td><td>1-2 hard parts taken to the level of data layout, failure and trade-off</td></tr>
<tr><td>38-45</td><td>Operate &amp; wrap up</td><td>what breaks first, how you would know, what you would build next</td></tr></table>
<p>The deep dive is where the hire/no-hire signal lives, so protect those 18 minutes. Candidates who spend 25 minutes on requirements and boxes never get there.</p>
<h3>Reading the interviewer</h3>
<ul>
<li><b>A question is usually a steer, not a challenge.</b> “What happens if this queue backs up?” means “go deeper here”. Follow it, then come back to your plan.</li>
<li><b>“Is that the only option?”</b> means name an alternative and the trade-off. It rarely means you are wrong.</li>
<li><b>Silence after an answer</b> means they want the next level: numbers, a failure case, or how you would operate it.</li>
<li><b>Ask to choose</b> when time is short: “I can go deep on partitioning or on exactly-once delivery. Which is more useful to you?” Asking is a senior move; waiting is not.</li>
</ul>
<h3>When you are behind</h3>
<p>Say so and cut explicitly: “I will skip detailed API shapes and come back if we have time.” A named cut reads as prioritisation; a silent one reads as a gap.</p>
<h3>How design rounds are usually lost</h3>
<ul>
<li><b>Gold-plating:</b> Kafka, Kubernetes and three caches for 50 requests per second. Every box must answer a requirement or a number.</li>
<li><b>No numbers:</b> “It needs to scale” without rps or storage makes every later choice unjustified.</li>
<li><b>Breadth with no depth:</b> twelve boxes, none explained to the level of keys, indexes or failure behaviour.</li>
<li><b>The happy path only:</b> no timeouts, retries, duplicates or what the user sees when a dependency is down.</li>
<li><b>Defending instead of updating:</b> when the interviewer adds a constraint, change the design and say why. Changing your mind with a reason is a strength.</li>
</ul>
<div class="callout"><b>Practise it timed:</b> the <a href="#/design">Design lab</a> has 10 reps that walk these six steps with a clock, hints and a reference to compare against. Start with the warm-up (URL shortener), then the rate limiter and webhooks, then the hard ones (ledger, pay by bank, offline sync).</div>` },
        { pid: 'q-steer', type: 'quiz', q: 'Minute 22. You have a clean high-level diagram. The interviewer asks: “What happens when one merchant sends 50× normal traffic?” What is the best response?',
          options: ['Finish explaining the rest of the diagram first, then come back to it', 'Treat it as a steer: go deep on hot keys and per-tenant limits (rate limiting, partitioning, isolation), then return to your plan', 'Say it is an edge case outside the requirements', 'Add an autoscaling group and move on'],
          answer: 1, explain: 'A question in the middle of a design round is usually the interviewer pointing at the deep dive they want. Following it is how you show depth.' },
        { type: 'quiz', q: 'You are at minute 10 and have only drawn boxes. The interviewer asks “what about a bank that is down?”. Best response?',
          options: ['That is out of scope', 'Explain per-dependency timeouts, a circuit breaker, a degraded mode (cached/stale data with a clear flag), retries with backoff, and alerting', 'Add more servers', 'Promise 100% availability'],
          answer: 1, explain: 'Failure handling is the senior differentiator. Be concrete: timeouts, breakers, degradation, and how users and operators find out.' },
      ],
    },
    {
      id: 'building-blocks', title: 'Building blocks & their trade-offs', minutes: 15,
      summary: 'Caching, queues, partitioning, replication, consistency.',
      checks: [
        { q: 'A hot key expires and thousands of requests hit the database simultaneously. Which fix actually addresses this thundering herd?',
          options: ['Delete the cache so every request goes to the database evenly', 'Single-flight request coalescing with jittered TTLs or serving stale while revalidating', 'Add more cache replicas with the same fixed TTL', 'Route all traffic to the primary database'],
          answer: 1, explain: 'That collapse is a cache stampede. The mitigations are coalescing concurrent misses, jittered TTLs, early refresh, or stale-while-revalidate.' },
        { q: 'During a network partition you must choose: show a possibly stale balance, or reject the request. What principle guides you?',
          options: ['Always choose availability, because uptime beats everything', 'Always choose consistency, because partitions never happen', 'It depends on the operation: a balance display can be stale, but double-spending money cannot', 'Pick whichever is cheaper to implement'],
          answer: 2, explain: 'During a partition you pick consistency or availability per operation (PACELC beyond that: latency vs consistency). Correctness requirements decide.' },
      ],
      sections: [
        { type: 'text', html: `
<table>
<tr><th>Block</th><th>Buys you</th><th>Costs you</th></tr>
<tr><td>Cache (Redis/CDN)</td><td>Latency, lower DB load</td><td>Staleness, invalidation bugs, cold-start stampedes</td></tr>
<tr><td>Queue / log (SQS, Kafka)</td><td>Decoupling, burst absorption, retries</td><td>Async complexity, ordering and duplicate delivery</td></tr>
<tr><td>Read replicas</td><td>Read scaling</td><td>Replication lag → read-your-writes bugs</td></tr>
<tr><td>Sharding</td><td>Write/storage scaling</td><td>Cross-shard queries and transactions, rebalancing</td></tr>
<tr><td>Denormalisation</td><td>Fast reads</td><td>Write amplification, consistency work</td></tr>
</table>
<h3>CAP, said usefully</h3>
<p>During a network <b>P</b>artition you pick <b>C</b>onsistency (reject some requests) or <b>A</b>vailability (answer, maybe stale). Outside partitions the real trade is latency vs consistency (PACELC). “It depends on the operation” is the right answer: balance display can be stale; double-spending cannot.</p>
<h3>Consistency models, by name</h3>
<p>“Strong” and “eventual” are the two ends. Senior answers name the guarantee a feature actually needs, because the cheaper ones are often enough:</p>
<table><tr><th>Guarantee</th><th>What the user sees</th><th>Typical way to get it</th></tr>
<tr><td>Linearizable</td><td>Every read sees the latest committed write, as if there were one copy</td><td>Single leader/primary reads, consensus (etcd, Spanner), conditional writes</td></tr>
<tr><td>Read-your-writes</td><td>You always see your own changes; others may lag</td><td>Read from the primary for a short window, or carry a version/LSN token</td></tr>
<tr><td>Monotonic reads</td><td>You never see time go backwards between reads</td><td>Pin a session to one replica, or reject replicas older than the last version seen</td></tr>
<tr><td>Causal</td><td>A reply is never visible before the message it answers</td><td>Track dependencies (version vectors), or route causally related data together</td></tr>
<tr><td>Eventual</td><td>Replicas converge if writes stop; any read may be stale</td><td>Async replication, caches, CDNs</td></tr></table>
<p>Map features to guarantees: a balance check before a withdrawal needs <b>linearizable</b> (or a conditional write that enforces it); “I just edited my profile” needs <b>read-your-writes</b>; a feed that flickers between replicas needs <b>monotonic reads</b>; a like counter is fine <b>eventual</b>.</p>` },
        { pid: 'q-monotonic', type: 'quiz', q: 'A user refreshes their transaction list and sees a payment, refreshes again and it is gone, then it reappears. Reads are load-balanced across async replicas. Which guarantee is missing?',
          options: ['Linearizability for all writes', 'Monotonic reads: successive reads hit replicas at different lag, so time appears to go backwards', 'Causal consistency between users', 'Durability of the primary'],
          answer: 1, explain: 'Each replica is internally consistent; the problem is jumping between them. Pin the session to one replica or carry the last-seen version so lagging replicas are skipped.' },
        { type: 'quiz', q: 'A user updates their profile, then immediately reloads and sees old data. You use read replicas. What is the most likely cause and the lightest fix?',
          options: ['Cache TTL too long; remove the cache', 'Replication lag; route the user’s reads to the primary for a short window after a write (read-your-writes)', 'The database is corrupt', 'Use a bigger instance'],
          answer: 1, explain: 'Classic replication lag. Common fixes: sticky reads to the primary after writes, or pass a version/LSN token and read from a replica that has caught up.' },
        { type: 'quiz', q: 'Your cache entry for a hot key expires and 5,000 requests hit the database at once. This is called…',
          options: ['Cache penetration', 'Cache stampede (thundering herd)', 'Split brain', 'Write skew'],
          answer: 1, explain: 'Mitigations: request coalescing (single flight), early/probabilistic refresh, jittered TTLs, serving stale while revalidating.' },
        { type: 'reveal', title: 'Quick estimation drill', html: `<p>Stream of 2,000 events/s, each 1 KB, retained 30 days. Storage? <code>2,000 × 1KB = 2 MB/s ≈ 173 GB/day ≈ 5.2 TB/30d</code>, ×3 replicas ≈ 15.6 TB. Say the number, then say what you would do (tiering, compression, shorter hot retention).</p>` },
      ],
    },
    {
      id: 'consistent-hashing', title: 'Deep dive: consistent hashing', minutes: 20,
      summary: 'How to spread keys over nodes without reshuffling everything. Implement it.',
      checks: [
        { q: 'Your cache uses hash(key) % N. You add one node and nearly every key misses at once. Why?',
          options: ['The hash function is too slow for the new size', 'Modulo-N remaps almost every key when N changes; consistent hashing moves only about 1/N of keys', 'Virtual nodes were missing from the client library version', 'Caches must be cleared whenever topology changes'],
          answer: 1, explain: 'Modulo hashing couples every key to N, so a membership change reshuffles nearly everything. The ring assigns each key to the first node clockwise, so only neighbours of the change move.' },
        { q: 'One node on the ring holds far more keys than the rest. What is the standard fix, and what bonus does it give?',
          options: ['Add many virtual nodes per physical node to even out load, and weight bigger machines with more of them', 'Rehash every key with a stronger algorithm', 'Reduce the ring to a single node per machine', 'Disable hashing and assign keys round-robin'],
          answer: 0, explain: 'Virtual nodes spread each physical node around the ring, evening out load and letting heavier machines carry proportionally more keys.' },
      ],
      sections: [
        { type: 'text', html: `
<p>With <code>hash(key) % N</code>, adding a node remaps almost every key, which is a cache disaster. <b>Consistent hashing</b> places nodes (and many <i>virtual nodes</i> per node) on a ring; a key belongs to the first node clockwise from its hash. Adding or removing a node moves only ~1/N of the keys.</p>
<ul><li><b>Virtual nodes</b> even out load and let you weight bigger machines.</li><li>Used by Dynamo-style stores, memcached clients, and many load balancers.</li></ul>` },
        { type: 'code', ref: 'hash_ring' },
      ],
    },
    {
      id: 'design-webhooks', title: 'Worked design: webhook delivery platform', minutes: 15,
      summary: 'At-least-once delivery, retries, signing, ordering, and customer pain.',
      checks: [
        { q: 'A consumer receives the same webhook event_id twice. What must it do, and why is this expected?',
          options: ['Alert on a bug; webhooks guarantee exactly-once', 'Dedupe on event_id and process once, because retries make at-least-once the only honest guarantee', 'Refund the customer for the duplicate', 'Switch delivery to exactly-once by adding a second queue'],
          answer: 1, explain: 'Exactly-once over HTTP is impossible, so the design promises at-least-once with unique event_ids and pushes dedupe to the consumer.' },
        { q: 'One customer endpoint gets slow and delivery workers pile up on it, delaying everyone else. What is the fix?',
          options: ['Remove timeouts so the slow endpoint can finish', 'Give all endpoints one shared queue for fairness', 'Stop signing payloads to speed up delivery', 'Isolate per-endpoint queues and concurrency limits with short timeouts and a circuit breaker that pauses the failing endpoint'],
          answer: 3, explain: 'Noisy neighbours need isolation: per-endpoint queues and limits, short timeouts, a breaker that pauses a failing endpoint, and autodisable after days of failure.' },
      ],
      sections: [
        { type: 'text', html: `<p>Prompt: <i>“Design a system that notifies customers’ HTTP endpoints when events happen (e.g. a payment status changes).”</i> It is a favourite because it is small but full of real trade-offs, and it is exactly what a payments / open-banking platform ships.</p>` },
        { type: 'steps', steps: [
          { title: 'Requirements', html: `<ul><li>Customers register endpoint URLs and event types.</li><li>Deliver each event <b>at least once</b>; retry on failure for ~24-72h.</li><li>Customers can verify authenticity; can replay events.</li><li>Not needed: exactly-once (impossible over HTTP; push dedupe to the consumer with event ids).</li></ul>` },
          { title: 'Core flow', html: `<pre><code>Domain service --(same DB txn)--> outbox table
outbox relay --> queue (partition by endpoint)
delivery workers: POST signed payload, timeout 5-10s
  2xx -> mark delivered    else -> schedule retry (backoff + jitter)
exhausted -> dead-letter + alert + dashboard "replay"</code></pre><p>The <b>transactional outbox</b> ensures an event exists if and only if the business change committed.</p><p>Two ways to run the relay: <b>poll</b> the outbox table (simple, adds a little latency and DB load), or use <b>change data capture</b> (CDC: a tool such as Debezium tails the database’s write-ahead log and publishes new outbox rows). CDC has lower latency and no polling queries, but it is one more system to operate and it is coupled to the database’s replication internals. Either way, delivery to the queue is at-least-once.</p>` },
          { title: 'Security', html: `<p>Sign the body with an HMAC and a timestamp: <code>sig = HMAC_SHA256(secret, timestamp + "." + body)</code>. Receivers reject old timestamps (replay protection) and compare in constant time. Support secret rotation (two active secrets). Block SSRF: resolve and refuse private IP ranges for customer URLs.</p>` },
          { title: 'Ordering & duplicates', html: `<p>Global ordering is expensive; offer <b>per-entity ordering</b> by partitioning on entity id, and include a monotonically increasing version so consumers can ignore stale events. Always include a unique <code>event_id</code>, because duplicates will happen.</p>` },
          { title: 'Noisy neighbours & failure', html: `<p>One slow customer endpoint must not block others: per-endpoint queues/concurrency limits, short timeouts, and a circuit breaker that pauses a failing endpoint (and emails the customer). Autodisable after N days of failures. Metrics: delivery latency p99, success rate by endpoint, retry depth, DLQ size.</p>` },
        ] },
        { type: 'quiz', q: 'Why use the transactional outbox instead of “commit to DB, then publish to the queue” in the same function?',
          options: ['It is faster', 'Because a crash between the commit and the publish loses the event (or publishing first can announce something that never committed)', 'Queues cannot be used with databases', 'It gives exactly-once delivery'],
          answer: 1, explain: 'You cannot atomically write to two systems. The outbox makes the DB the source of truth; a relay publishes at-least-once, and consumers dedupe.' },
        { pid: 'your-turn', type: 'text', html: `<div class="callout"><b>Your turn:</b> run the same six steps on a clock in the <a href="#/design">Design lab</a>. The webhooks rep checks you against this design; the rate limiter, notifications and job scheduler reps reuse the same building blocks in new combinations.</div>` },
      ],
    },
  ],
});
