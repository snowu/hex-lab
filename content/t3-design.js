TRACKS.push({
  id: 'design', icon: '🏗️', title: 'System Design',
  blurb: 'A repeatable framework, the building blocks, and worked designs with trade-offs, including a consistent-hashing exercise.',
  lessons: [
    {
      id: 'design-framework', title: 'A framework you can run under pressure', minutes: 12,
      summary: 'Requirements → estimates → API → data → architecture → deep dives → failure.',
      sections: [
        { type: 'text', html: `<p>Interviewers do not want your memorised architecture. They want to watch you <b>structure an open problem</b>. Step through the framework below, then practise it on the worked design in the next lessons.</p>` },
        { type: 'steps', steps: [
          { title: '1. Clarify & scope (3-5 min)', html: `<p>Functional requirements (the 3-4 things the system <i>must</i> do) and what is explicitly out of scope. Ask who the users are and what “correct” means. Money? Then correctness beats latency.</p>` },
          { title: '2. Non-functional & numbers', html: `<p>Availability target, latency target (p50/p99), consistency needs, durability, data retention, regulatory limits. Back-of-envelope: requests/sec = users × actions/day ÷ 86,400, peak ≈ 3-10× average. Storage = items × size × retention.</p><pre><code>10M users × 5 actions/day = 50M/day ≈ 580 rps average, ~3k rps peak</code></pre>` },
          { title: '3. API & data model', html: `<p>Sketch 3-5 endpoints (with idempotency on writes), and the core entities with their keys. State your read/write ratio: it drives storage and caching choices.</p>` },
          { title: '4. High-level design', html: `<p>Client → edge/LB → stateless services → data stores, plus async paths (queues, workers). Keep boxes few and each one justified by a requirement.</p>` },
          { title: '5. Deep dives', html: `<p>Pick the 1-2 hardest parts (the interviewer will nudge you). Typical: data partitioning, hot keys, exactly-once effects, fan-out, ranking, consistency between stores.</p>` },
          { title: '6. Failure, scale, operate', html: `<p>What breaks first? Retries, timeouts, backpressure, degradation modes, observability (RED/USE metrics, traces), rollout/rollback, cost. This step is what separates senior from mid.</p>` },
        ] },
        { type: 'quiz', q: 'You are at minute 10 and have only drawn boxes. The interviewer asks “what about a bank that is down?”. Best response?',
          options: ['That is out of scope', 'Explain per-dependency timeouts, a circuit breaker, a degraded mode (cached/stale data with a clear flag), retries with backoff, and alerting', 'Add more servers', 'Promise 100% availability'],
          answer: 1, explain: 'Failure handling is the senior differentiator. Be concrete: timeouts, breakers, degradation, and how users and operators find out.' },
      ],
    },
    {
      id: 'building-blocks', title: 'Building blocks & their trade-offs', minutes: 15,
      summary: 'Caching, queues, partitioning, replication, consistency.',
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
<p>During a network <b>P</b>artition you pick <b>C</b>onsistency (reject some requests) or <b>A</b>vailability (answer, maybe stale). Outside partitions the real trade is latency vs consistency (PACELC). “It depends on the operation” is the right answer: balance display can be stale; double-spending cannot.</p>` },
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
      sections: [
        { type: 'text', html: `<p>Prompt: <i>“Design a system that notifies customers’ HTTP endpoints when events happen (e.g. a payment status changes).”</i> It is a favourite because it is small but full of real trade-offs, and it is exactly what a payments / open-banking platform ships.</p>` },
        { type: 'steps', steps: [
          { title: 'Requirements', html: `<ul><li>Customers register endpoint URLs and event types.</li><li>Deliver each event <b>at least once</b>; retry on failure for ~24-72h.</li><li>Customers can verify authenticity; can replay events.</li><li>Not needed: exactly-once (impossible over HTTP; push dedupe to the consumer with event ids).</li></ul>` },
          { title: 'Core flow', html: `<pre><code>Domain service --(same DB txn)--> outbox table
outbox relay --> queue (partition by endpoint)
delivery workers: POST signed payload, timeout 5-10s
  2xx -> mark delivered    else -> schedule retry (backoff + jitter)
exhausted -> dead-letter + alert + dashboard "replay"</code></pre><p>The <b>transactional outbox</b> ensures an event exists if and only if the business change committed.</p>` },
          { title: 'Security', html: `<p>Sign the body with an HMAC and a timestamp: <code>sig = HMAC_SHA256(secret, timestamp + "." + body)</code>. Receivers reject old timestamps (replay protection) and compare in constant time. Support secret rotation (two active secrets). Block SSRF: resolve and refuse private IP ranges for customer URLs.</p>` },
          { title: 'Ordering & duplicates', html: `<p>Global ordering is expensive; offer <b>per-entity ordering</b> by partitioning on entity id, and include a monotonically increasing version so consumers can ignore stale events. Always include a unique <code>event_id</code>, because duplicates will happen.</p>` },
          { title: 'Noisy neighbours & failure', html: `<p>One slow customer endpoint must not block others: per-endpoint queues/concurrency limits, short timeouts, and a circuit breaker that pauses a failing endpoint (and emails the customer). Autodisable after N days of failures. Metrics: delivery latency p99, success rate by endpoint, retry depth, DLQ size.</p>` },
        ] },
        { type: 'quiz', q: 'Why use the transactional outbox instead of “commit to DB, then publish to the queue” in the same function?',
          options: ['It is faster', 'Because a crash between the commit and the publish loses the event (or publishing first can announce something that never committed)', 'Queues cannot be used with databases', 'It gives exactly-once delivery'],
          answer: 1, explain: 'You cannot atomically write to two systems. The outbox makes the DB the source of truth; a relay publishes at-least-once, and consumers dedupe.' },
      ],
    },
  ],
});
