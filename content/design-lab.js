/* Design lab content: reference designs, estimation scenarios and numbers to know. */
window.DESIGN_STEPS = [
  { id: 'scope', title: '1. Scope & requirements', ask: 'Functional requirements (3-4 things it must do), what is out of scope, non-functional goals (availability, latency, consistency, durability). Questions you would ask.' },
  { id: 'numbers', title: '2. Numbers & estimates', ask: 'Users, requests per second (average and peak), data size per item, storage over the retention period. Show the arithmetic.' },
  { id: 'api', title: '3. API & data model', ask: 'The 3-5 endpoints (note idempotency on writes), the core entities with keys, and the read/write ratio.' },
  { id: 'arch', title: '4. High-level design', ask: 'Boxes and arrows: clients, edge, services, stores, queues. Each box justified by a requirement.' },
  { id: 'deep', title: '5. Deep dive', ask: 'The one or two hardest parts: partitioning, hot keys, consistency, exactly-once effects, ordering.' },
  { id: 'ops', title: '6. Failure, scale & operations', ask: 'What breaks first, retries and timeouts, degradation, metrics and alerts, rollout, cost.' },
];

window.DESIGNS = [
  /* ------------------------------------------------------------------ */
  { id: 'url-shortener', title: 'URL shortener', level: 'warm-up', minutes: 30,
    prompt: 'Design a URL shortening service. About 100 million new links a month, reads are ten times writes.',
    ref: {
      scope: `<ul><li><b>Must:</b> create a short link for a long URL, redirect from the short link, optional custom alias and expiry.</li><li><b>Out of scope (say so):</b> user accounts, full analytics UI.</li><li><b>Non-functional:</b> redirects are the hot path: low latency (&lt;50 ms server-side), highly available. Creation can be slightly slower. Links are durable.</li><li><b>Ask:</b> can links be deleted or edited? Is the short code guessable-is-OK or must it be unguessable? Abuse/malware checks? 301 or 302?</li></ul>`,
      numbers: `<pre><code>writes: 100M / month = 100e6 / (30 × 86,400) ≈ 40 /s average
reads : 10 × writes ≈ 400 /s average, peak ×3-5 ≈ 1.2-2k /s
storage: ~500 B per link (url + metadata) × 100M = 50 GB / month, ~3 TB over 5 years
key space: 7 base62 chars = 62^7 ≈ 3.5 trillion; 5 years ≈ 6 billion links (0.2% used)</code></pre><p>This is a <b>small</b> system: one well-indexed database handles it. Say that out loud, then design for growth anyway.</p>`,
      api: `<pre><code>POST /v1/links   { url, alias?, expires_at? }  -> 201 { code, short_url }   (Idempotency-Key header)
GET  /{code}                                     -> 302 Location: long_url   (404 / 410 if missing / expired)
DELETE /v1/links/{code}                          -> 204

links(code PK, url, owner_id, created_at, expires_at, is_blocked)
clicks (stream, not in the hot DB): code, ts, ua, ip_prefix, referrer</code></pre>`,
      arch: `<ul><li>Clients → CDN/edge (cache popular redirects) → load balancer → <b>stateless redirect service</b>.</li><li>Redirect path: cache (Redis) lookup by code → on miss read the primary store → fill cache.</li><li>Create path: a small <b>ID allocation</b> step, write to the store, return.</li><li>Store: key-value access pattern (get by code), so a KV store (DynamoDB, Cassandra) or Postgres partitioned by code both work.</li><li>Click analytics are published to a queue (Kafka) <b>asynchronously</b>, never on the redirect path.</li></ul>`,
      deep: `<h3>Generating the code</h3><ul><li><b>Counter ranges:</b> each app node leases a block (for example 1M ids) from a coordinator, then encodes the counter in base62. No per-request coordination. Sequential codes are enumerable: if that matters, scramble with a keyed permutation.</li><li><b>Random 7 chars + unique constraint:</b> simple, unguessable, retry on the rare collision (about 0.2% at the end of life).</li><li><b>Hash of the URL:</b> same URL gives the same code (dedupe) but collisions need handling and it leaks equality.</li></ul><h3>301 vs 302</h3><p>301 is cached by browsers (fewer hits) but you lose analytics and cannot change or expire the target. Default to 302 unless you explicitly want permanence.</p><h3>Hot links</h3><p>A viral link is one hot key: serve it from CDN and in-process cache; a single cache key is trivially absorbed.</p>`,
      ops: `<ul><li>Cache down: the DB can serve ~2k reads/s, so degrade rather than fail. Protect against a stampede with request coalescing.</li><li>ID coordinator down: nodes keep serving from their leased range; alert when ranges run low.</li><li>Abuse: rate limit creation per IP/key, scan target URLs, a block list that the redirect path honours (and purge caches on block).</li><li>Metrics: redirect p99, cache hit ratio, 5xx, creation errors, ID-range headroom. Expired link cleanup as a background job.</li></ul>` },
    tradeoffs: ['Random codes are unguessable but need collision handling; counters are collision-free but enumerable.', '302 keeps flexibility and analytics; 301 saves traffic but is effectively permanent.', 'A KV store scales further; Postgres is simpler to operate and plenty at this size.'],
    followups: ['Traffic grows 100x. What changes first?', 'Support custom domains per customer.', 'How do you delete a link everywhere (CDN, caches) quickly?', 'Make creation multi-region without ID collisions.'],
    rubric: ['Clarified scope (custom alias, expiry, delete, abuse) before drawing', 'Did the estimates and concluded the system is small', 'Chose an ID strategy and named its trade-off', 'Kept analytics off the redirect path', 'Cache layer with a hit-ratio argument and hot-key handling', 'Discussed 301 vs 302', 'Covered abuse / malicious URLs', 'Named metrics and a failure mode (cache or ID service down)'],
    hints: ['Do the numbers first: how many requests per second is this really?', 'What is the one operation that must be fast, and what does it need to touch?', 'How do two app servers hand out ids without asking a central service every time?'] },

  /* ------------------------------------------------------------------ */
  { id: 'rate-limiter', title: 'Distributed rate limiter', level: 'core', minutes: 35,
    prompt: 'Design a rate limiting service used by an API gateway. About 50,000 requests per second across many tenants.',
    ref: {
      scope: `<ul><li><b>Must:</b> limit requests per key (API key / tenant / IP) with configurable limits, return 429 with <code>Retry-After</code>, enforce across many gateway nodes.</li><li><b>Non-functional:</b> adds &lt;2 ms to a request; the limiter must never become the outage; limits are approximately right, not perfectly right.</li><li><b>Ask:</b> burst allowed? per-endpoint limits? fail-open or fail-closed when the limiter is unavailable? multi-region?</li></ul>`,
      numbers: `<pre><code>50k req/s at the gateway
one counter op per request: 50k ops/s (Redis handles ~100k+/s per shard, so 1-3 shards)
active keys: 1M × ~100 B = ~100 MB of state (tiny)
latency: in-region Redis round trip ≈ 0.3-1 ms, which fits the 2 ms budget</code></pre>`,
      api: `<pre><code>internal: allow(key, cost=1) -> { allowed, remaining, retry_after }
headers : X-RateLimit-Limit / -Remaining / -Reset, Retry-After on 429
config  : limits(tenant, route, rate, burst, algorithm)  (served by a config service, cached, hot-reloaded)</code></pre>`,
      arch: `<ul><li>Gateway middleware calls the limiter library. Fast path: a <b>local token bucket</b> per key for coarse protection.</li><li>Authoritative counters in <b>Redis</b>, sharded by key hash, updated by an atomic <b>Lua script</b> (read, refill, decrement in one step).</li><li>Config service pushes limits to gateways; changes apply without redeploy.</li><li>Metrics: allowed/denied per tenant, limiter latency, fail-open count.</li></ul>`,
      deep: `<h3>Algorithms</h3><ul><li><b>Fixed window</b>: simple, but allows 2× bursts at the boundary.</li><li><b>Sliding window log</b>: exact, memory-heavy.</li><li><b>Sliding window counter</b>: weighted blend of two windows, cheap and close.</li><li><b>Token bucket</b>: allows controlled bursts, two fields per key (tokens, last refill). Usual default.</li></ul><h3>Correctness</h3><p>Check-then-set across the network races. Use one atomic Lua script and use Redis's clock, not each gateway's, to avoid skew.</p><h3>Scale and hot keys</h3><p>One huge tenant is one hot key: allow local pre-aggregation (each gateway takes a batch of tokens and refills periodically), accepting small overshoot.</p>`,
      ops: `<ul><li><b>Redis unavailable:</b> decide explicitly. Usually <b>fail open</b> with a conservative local limiter, and alert, because blocking all traffic is worse than briefly over-admitting.</li><li>Multi-region: per-region limits plus a slow global budget sync (approximate), because a synchronous global counter adds cross-region latency.</li><li>Watch: p99 limiter latency, deny ratio per tenant (a spike can mean a client bug), fail-open rate, Redis CPU and memory.</li></ul>` },
    tradeoffs: ['Exactness vs latency: local approximate buckets are fast, a central counter is exact.', 'Fail-open protects availability, fail-closed protects the backend. Decide per route.', 'Token bucket allows bursts; sliding window is stricter.'],
    followups: ['A tenant complains they are limited too early. How do you debug it?', 'Different limits per plan and per endpoint.', 'Add a daily quota on top of the per-second limit.', 'Make it work across two regions.'],
    rubric: ['Stated where it runs and the latency budget', 'Compared at least two algorithms with the boundary-burst issue', 'Atomicity (Lua / single operation) addressed', 'Clock skew handled', 'Explicit fail-open or fail-closed decision with reasoning', 'Hot key / large tenant handled', 'Standard response headers and 429 behaviour', 'Observability and config hot-reload'],
    hints: ['What is the cheapest data you need per key?', 'Two gateways read the counter at the same moment: what goes wrong?', 'The limiter store dies. What should happen to user traffic?'] },

  /* ------------------------------------------------------------------ */
  { id: 'webhooks', title: 'Webhook delivery platform', level: 'core', minutes: 35,
    prompt: 'Design a system that notifies customers’ HTTP endpoints when events happen, for example a payment status change.',
    ref: {
      scope: `<ul><li><b>Must:</b> customers register endpoints and event types; at-least-once delivery with retries for up to ~72 h; signed payloads; replay of past events.</li><li><b>Out of scope:</b> exactly-once (impossible over HTTP; consumers dedupe by event id).</li><li><b>Ask:</b> ordering guarantees? event volume? payload size? per-customer rate limits? how long to keep events?</li></ul>`,
      numbers: `<pre><code>10M events/day ≈ 115 /s average, peak ×10 ≈ 1.2k /s
fan-out: each event goes to ~2 endpoints on average → ~2.5k delivery attempts/s at peak, plus retries
payload ~2 KB → 20 GB/day of events; keep 30 days ≈ 600 GB</code></pre>`,
      api: `<pre><code>POST /v1/endpoints { url, events[], secret }      GET/DELETE /v1/endpoints/{id}
GET  /v1/events?since=...                         POST /v1/events/{id}/replay
delivered request: POST customer_url
  headers: X-Event-Id, X-Timestamp, X-Signature = HMAC_SHA256(secret, timestamp + "." + body)

events(id, type, entity_id, version, payload, created_at)
endpoints(id, customer_id, url, secrets[], status, failure_streak)
deliveries(id, event_id, endpoint_id, attempt, status, next_attempt_at, last_error)</code></pre>`,
      arch: `<ul><li>Domain service writes the event to an <b>outbox table in the same transaction</b> as the business change.</li><li>A relay publishes outbox rows to a queue, partitioned by <b>endpoint id</b>.</li><li>Delivery workers POST with a short timeout; 2xx marks delivered, anything else schedules a retry with exponential backoff and jitter.</li><li>Exhausted retries go to a dead-letter store and a dashboard with replay.</li></ul>`,
      deep: `<h3>Ordering and duplicates</h3><p>Global ordering is too expensive. Offer per-entity ordering by partitioning on entity id and include a monotonically increasing <code>version</code> so consumers can ignore stale events. Always include a unique <code>event_id</code>: duplicates will happen.</p><h3>Security</h3><p>HMAC signature plus timestamp (replay protection), constant-time compare, secret rotation with two active secrets. Block SSRF: resolve the URL and refuse private address ranges.</p><h3>Noisy neighbours</h3><p>A slow customer must not block others: per-endpoint concurrency limits and queues, short timeouts, and a circuit breaker that pauses a failing endpoint (and notifies the customer).</p>`,
      ops: `<ul><li>Retries: exponential backoff with jitter over ~72 h; honour <code>Retry-After</code>; auto-disable an endpoint after N days of failures.</li><li>Metrics: delivery latency p99, success rate by endpoint, retry depth, DLQ size, oldest undelivered event age.</li><li>Capacity: queue depth drives autoscaling of workers; cap per-endpoint concurrency so one customer cannot consume the fleet.</li></ul>` },
    tradeoffs: ['At-least-once with consumer dedupe is practical; exactly-once is not available over HTTP.', 'Per-entity ordering is cheap; total ordering is not.', 'Push is simple for you but unreliable for slow consumers; offer a pull API as a fallback.'],
    followups: ['A customer is down for 2 days. What happens when they recover?', 'Support a customer who wants strict ordering.', 'How do you rotate a signing secret without breaking deliveries?', 'Add a test-event button in the dashboard.'],
    rubric: ['Chose at-least-once and explained why', 'Transactional outbox (no dual write)', 'Signing with timestamp and rotation', 'Retries: backoff, jitter, max age, DLQ, replay', 'Isolation between customers (per-endpoint queue/limits/breaker)', 'Ordering story (per entity + version)', 'SSRF protection', 'Metrics including oldest undelivered age'],
    hints: ['How do you make sure an event exists if and only if the business change committed?', 'One customer endpoint hangs for 30 s. What happens to everyone else?', 'How can a receiver know a message is genuine and not a replay?'] },

  /* ------------------------------------------------------------------ */
  { id: 'notifications', title: 'Notification system', level: 'core', minutes: 35,
    prompt: 'Design a notification system that sends email, SMS and push to millions of users, with user preferences.',
    ref: {
      scope: `<ul><li><b>Must:</b> send transactional (OTP, payment alerts) and marketing notifications over email/SMS/push; respect user preferences and quiet hours; templates and localisation; delivery tracking.</li><li><b>Non-functional:</b> OTP-class messages in seconds; marketing can be slower; never send twice by accident; survive provider outages.</li><li><b>Ask:</b> peak campaign size? regulatory constraints (consent, opt-out, GDPR)? ordering? analytics needs?</li></ul>`,
      numbers: `<pre><code>10M users × 5 notifications/day = 50M/day ≈ 580 /s average
a marketing blast of 5M in 10 minutes ≈ 8k /s
split by channel, e.g. push 70% / email 25% / SMS 5% (SMS is the costly one)</code></pre>`,
      api: `<pre><code>POST /v1/notifications { user_id, template, params, channels?, priority, idempotency_key }
GET  /v1/notifications/{id}   (status per channel)
PUT  /v1/users/{id}/preferences { channels, quiet_hours, categories }

notifications(id, user_id, template, priority, idempotency_key UNIQUE, created_at)
deliveries(id, notification_id, channel, provider, status, attempts, provider_msg_id)
preferences(user_id, category, channel, enabled, quiet_hours)</code></pre>`,
      arch: `<ul><li>API validates and writes the notification (unique idempotency key), then enqueues.</li><li><b>Router</b>: applies preferences, quiet hours, dedupe and per-user rate limits; renders the template; fans out to <b>per-channel, per-priority queues</b>.</li><li>Channel workers call providers (APNs/FCM, email provider, SMS gateways) and record the result.</li><li>Provider webhooks (delivered / bounced / opt-out) update delivery status and the suppression list.</li></ul>`,
      deep: `<h3>Priority isolation</h3><p>Separate queues and worker pools for transactional vs marketing so a campaign can never delay an OTP.</p><h3>Duplicates</h3><p>Idempotency key on creation, and a per-delivery idempotency key to the provider where supported. At-least-once plus dedupe beats trying for exactly-once.</p><h3>Provider failure</h3><p>Circuit breaker per provider and a fallback provider for SMS; retries with backoff; messages that exhaust retries go to a DLQ with alerting.</p>`,
      ops: `<ul><li>Cost control: SMS is expensive, so prefer push where allowed and cap per-user SMS.</li><li>Compliance: honour opt-outs immediately, keep an audit trail, store consent.</li><li>Metrics: queue age by priority, success rate per provider, bounce rate, send latency p99, cost per channel.</li></ul>` },
    tradeoffs: ['Strict priority queues protect OTPs but can starve marketing: set a minimum throughput.', 'Rendering at send time keeps data fresh; pre-rendering is faster to send.', 'Multiple providers add resilience and cost integration effort.'],
    followups: ['A provider is down for an hour. What happens to queued messages?', 'Add “digest” (batch many events into one email).', 'How do you stop a bug from sending a million wrong notifications?', 'Per-user rate limiting across channels.'],
    rubric: ['Separated transactional from marketing paths', 'Idempotency / dedupe described', 'Preferences, quiet hours and opt-out respected centrally', 'Per-channel queues and workers', 'Provider failure handling (breaker, fallback, retries, DLQ)', 'Delivery status via provider webhooks', 'Cost awareness (SMS)', 'A kill switch / safeguards against mass mis-sends'],
    hints: ['What must never be delayed by a big campaign?', 'How do you avoid sending the same alert twice when a worker retries?', 'What happens when the SMS provider returns errors for ten minutes?'] },

  /* ------------------------------------------------------------------ */
  { id: 'ledger', title: 'Payment ledger', level: 'hard', minutes: 40,
    prompt: 'Design the ledger for a payments company: record money movements between accounts, never lose or invent a cent, and let auditors reconstruct any balance.',
    ref: {
      scope: `<ul><li><b>Must:</b> post transactions (multiple debits/credits that balance), query balances and history, handle reversals, support multiple currencies, be fully auditable.</li><li><b>Non-functional:</b> correctness above all (no double spend, no lost writes), durable, strongly consistent per account, idempotent.</li><li><b>Ask:</b> holds/authorisations (pending vs posted)? throughput? how fresh must balances be? regulatory retention?</li></ul>`,
      numbers: `<pre><code>peak 1k transactions/s, each 2-4 entries → ~3k entries/s at peak
entry row ~100 B → 300 KB/s at peak. If the sustained average is ~25% of peak:
  ≈ 2.4 TB/year of entries → partition by month, archive cold partitions
account count: millions; a few "hot" accounts (platform fee account) take disproportionate writes</code></pre>`,
      api: `<pre><code>POST /v1/transactions { idempotency_key, entries:[{account, amount_minor, currency}], metadata }
     invariant: entries sum to 0 per currency
GET  /v1/accounts/{id}/balance        GET /v1/accounts/{id}/entries?cursor=
POST /v1/transactions/{id}/reverse    (creates NEW compensating entries)

accounts(id, currency, type)
transactions(id, idempotency_key UNIQUE, created_at, metadata)
entries(id, transaction_id, account_id, amount_minor BIGINT signed, currency, seq, created_at)   -- append-only
balances(account_id, balance_minor, version)    -- derived, updated in the same DB transaction</code></pre>`,
      arch: `<ul><li>One <b>relational database</b> (Postgres) as the source of truth: ACID transactions give atomic multi-entry posting.</li><li>A posting service validates the invariant (sum is zero, same currency), inserts the transaction and entries and updates balances in <b>one database transaction</b>.</li><li>Events are written to an <b>outbox</b> in the same transaction and published for downstream consumers (notifications, reporting).</li><li>Read replicas for history queries; balance reads that must be exact go to the primary.</li></ul>`,
      deep: `<h3>Invariants</h3><p>Money is integer minor units plus currency. Entries are <b>immutable</b>: a mistake is fixed with a reversing transaction, never an UPDATE. The balance is a cache of <code>SUM(entries)</code> and can always be recomputed and checked.</p><h3>Concurrency</h3><p>Two postings on one account must not both spend the same funds. Options: row lock on the balance (<code>SELECT … FOR UPDATE</code>) with a consistent lock order to avoid deadlocks; optimistic <code>version</code> check with retry; or route all writes for an account through one partition/writer (Kafka key = account id).</p><h3>Hot accounts</h3><p>The fee account serialises every transaction. Split it into N sub-accounts and sum when reading.</p><h3>Idempotency</h3><p>Unique constraint on <code>idempotency_key</code>: a retry returns the original result instead of posting twice.</p>`,
      ops: `<ul><li><b>Reconciliation:</b> compare ledger totals to bank statements and to the sum of entries daily; alert on any difference.</li><li>Sum of all entries per currency must be zero: a cheap global invariant check.</li><li>Cross-system steps (calling a bank) use a saga with compensating postings; the ledger itself never does distributed transactions.</li><li>Backups with point-in-time recovery, tested restores, audit log of who posted what.</li></ul>` },
    tradeoffs: ['Derived balance table is fast but must stay consistent with entries; recomputing from entries is always possible.', 'Row locks are simple but serialise hot accounts; single-writer partitions scale but add infrastructure.', 'Strong consistency costs availability in a partition: for money that is the right trade.'],
    followups: ['Support authorisation holds that expire.', 'Shard the ledger across databases: what breaks?', 'An auditor asks for the balance of account X at 14:03 last Tuesday.', 'Multi-currency transfers with FX.'],
    rubric: ['Double-entry with the sum-to-zero invariant', 'Integer minor units, never floats', 'Immutable entries; corrections via reversal', 'Atomic posting in one DB transaction', 'Idempotency key with unique constraint', 'Concurrency strategy for the same account, with deadlock avoidance', 'Hot account mitigation', 'Reconciliation and audit'],
    hints: ['What would an auditor need to prove a balance is right?', 'Two withdrawals hit the same account at the same time. What stops an overdraft?', 'You find a wrong entry from last week. What do you do?'] },

  /* ------------------------------------------------------------------ */
  { id: 'aggregator-refresh', title: 'Account data aggregator: refresh scheduler', level: 'hard', minutes: 40,
    prompt: 'You aggregate bank account data for 500,000 consented users across hundreds of banks. Design the system that keeps balances and transactions fresh within the limits banks and PSD2 impose.',
    ref: {
      scope: `<ul><li><b>Must:</b> fetch balances and transactions per consent on a schedule and on demand, normalise them, expose them via an API and webhooks, handle consent expiry and re-authentication.</li><li><b>Constraints:</b> PSD2 limits unattended access (about 4 calls per 24 h per account); banks throttle and have outages and different formats; each consent expires and needs the user to re-authenticate.</li><li><b>Ask:</b> freshness target? how many accounts per consent? what do customers do with the data (lending vs PFM)?</li></ul>`,
      numbers: `<pre><code>500k users × ~2 accounts = 1M accounts
unattended budget 4/day → at most 4M refresh calls/day ≈ 46 /s average (plan for ~150 /s peak)
user-present refreshes are on top and must jump the queue
per-bank limits are the real ceiling: e.g. one bank with 100k accounts at 5 req/s needs ~5.5 h to refresh everyone</code></pre>`,
      api: `<pre><code>GET  /v1/accounts, /v1/accounts/{id}/transactions?cursor=   (always return "as_of")
POST /v1/accounts/{id}/refresh        (user-present, high priority)
webhooks: data.updated, consent.needs_reauth, consent.expired

consents(id, user_id, bank_id, status, expires_at, last_sca_at)
accounts(id, consent_id, external_id, last_refresh_at, next_refresh_at, failures)
transactions(account_id, external_id UNIQUE per account, booked_date, amount_minor, currency, raw JSONB)</code></pre>`,
      arch: `<ul><li><b>Scheduler</b> picks due accounts (ordered by <code>next_refresh_at</code>) and enqueues refresh jobs onto <b>per-bank queues</b>.</li><li>Per-bank <b>workers</b> sit behind a token-bucket rate limiter and a circuit breaker; they call the bank adapter and write results.</li><li><b>Adapter / anti-corruption layer</b> per bank (or bank standard) maps to the canonical model, keeping the raw payload.</li><li>Writes are idempotent upserts keyed by transaction id; changes emit <code>data.updated</code> via an outbox.</li><li>User-present refreshes use a separate high-priority queue.</li></ul>`,
      deep: `<h3>Budgeting calls</h3><p>Track calls per account per day. Spread them with jitter (never "every hour on the hour"). Spend the budget where it matters: users who opened the app recently get refreshed more.</p><h3>Isolation per bank</h3><p>Separate worker pools and breakers per bank (bulkheads) so one slow bank cannot starve the others. Breaker counts errors and slow calls.</p><h3>Consent lifecycle</h3><p>A state machine (active, needs re-auth, expired, revoked). Warn the user before expiry through the customer's webhook; stop refreshing immediately on revoke and delete data per policy.</p><h3>Correct data</h3><p>Pagination watermarks per account, dedupe overlapping windows by id, handle pending to booked transitions, banks without stable ids (derive a deterministic key).</p>`,
      ops: `<ul><li><b>Freshness SLO</b> (for example 95% of active accounts refreshed within 6 h) is the headline metric, plus success rate and p95 latency per bank, quota utilisation and breaker state.</li><li>Synthetic probes per bank to catch format changes before customers do; contract tests against sandboxes.</li><li>Degrade by serving cached data flagged with <code>as_of</code> when a bank is down.</li><li>Certificates (QWAC/QSeal) are a shared single point of failure: alert on expiry weeks ahead.</li></ul>` },
    tradeoffs: ['Fresher data costs call budget and risks hitting limits; stale-but-labelled data is acceptable.', 'One adapter per bank is flexible but expensive to maintain; group by standard where possible.', 'Per-bank isolation uses more resources but contains failures.'],
    followups: ['Bank X changes its response format at 02:00. How do you find out?', 'A customer wants real-time balance for a payment decision.', 'Add a second data source for the same bank.', 'How do you test against 300 banks?'],
    rubric: ['Used the PSD2 / per-bank limits to size and shape the scheduler', 'Per-bank queues, rate limits and breakers (bulkheads)', 'Priority lane for user-present refresh', 'Adapter layer with canonical model and raw payload', 'Idempotent upserts and pagination watermarks', 'Consent lifecycle and revoke handling', 'Freshness SLO with as_of exposed to clients', 'Probes, contract tests and certificate monitoring'],
    hints: ['What is the real bottleneck: your servers or the banks?', 'One bank starts timing out. How do you keep the others fast?', 'What should the API return if the last successful refresh was 20 hours ago?'] },

  /* ------------------------------------------------------------------ */
  { id: 'pay-by-bank', title: 'Pay-by-bank payment initiation API', level: 'hard', minutes: 40,
    prompt: 'Design the API and backend that lets merchants take payments directly from customers’ bank accounts (open banking payment initiation).',
    ref: {
      scope: `<ul><li><b>Must:</b> merchant creates a payment, the payer authenticates with their bank (SCA) and approves, the merchant learns the final status reliably, refunds/reconciliation supported.</li><li><b>Non-functional:</b> never initiate twice, never lose track of money in flight, clear status for the merchant, secure (signing, least privilege).</li><li><b>Ask:</b> single vs scheduled vs batch payments? which banks/countries? instant rails? who holds the funds?</li></ul>`,
      numbers: `<pre><code>1M payments/day ≈ 12 /s average, peak ×10 ≈ 120 /s: low rate, high stakes
status polling: each payment polled ~10 times until final → ~1.2k poll calls/s at peak if naive; prefer bank callbacks + backoff polling
state storage: 1M × ~2 KB = 2 GB/day including raw bank payloads</code></pre>`,
      api: `<pre><code>POST /v1/payments  (Idempotency-Key)  { amount_minor, currency, creditor_iban, reference, bank_id, redirect_url }
     -> 201 { id, status: "created", authorize_url }
GET  /v1/payments/{id}               -> { status, bank_status, updated_at }
POST /v1/payments/{id}/cancel
webhooks: payment.pending / settled / rejected

payments(id, merchant_id, idempotency_key UNIQUE, amount_minor, currency, status, bank_payment_id, consent_id, created_at)
payment_events(payment_id, status, raw_bank_status, at)   -- append-only history</code></pre>`,
      arch: `<ul><li>API creates the payment (idempotent) and a bank-side payment through the <b>bank adapter</b>, returning the bank's authorisation URL.</li><li>The payer is redirected to the bank for <b>SCA</b>, then back to the merchant, who calls the completion step <b>promptly</b> (bank authorisations expire quickly).</li><li>A <b>status tracker</b> follows the payment: bank callbacks where available, otherwise polling with backoff, applying only forward status transitions.</li><li>Outbox publishes merchant webhooks; a reconciliation job compares our records with bank statements.</li></ul>`,
      deep: `<h3>The unknown outcome</h3><p>The call to the bank times out. Did it create the payment? <b>Never blindly retry.</b> Use a deterministic end-to-end reference, first query the bank for a payment with that reference, and only create if none exists. Mark the payment <code>unknown</code> and resolve it by reconciliation if the bank cannot be reached.</p><h3>Status machine</h3><p>Banks report ISO 20022-style statuses (received, pending, accepted, settlement in process, settled, rejected) late, duplicated, skipped or out of order. Rank them and accept only forward moves; terminal states are sticky; rejection after settlement is refused and alerted.</p><h3>Security</h3><p>Request signing with a QSeal certificate, mTLS with the transport certificate, keys in an HSM/KMS, per-merchant scoping, and never logging account numbers or tokens.</p>`,
      ops: `<ul><li>Per-bank breakers and rate limits; show the merchant a clear “bank unavailable” instead of a hang.</li><li>Reconciliation daily: every payment ends in a known final state or is escalated.</li><li>Metrics: conversion funnel (created → authorised → settled), time to final status, unknown-outcome count, error rate per bank.</li><li>Money in flight must be visible on a dashboard and alert when it ages.</li></ul>` },
    tradeoffs: ['Webhooks from banks are faster but not universally available; polling is universal but costly.', 'Showing “pending” honestly beats guessing success.', 'Per-bank adapters give coverage at the cost of maintenance.'],
    followups: ['The merchant never receives the redirect back. How do you still learn the outcome?', 'Add scheduled and recurring payments.', 'A bank reports "settled" then "rejected" later.', 'Add refunds.'],
    rubric: ['Idempotency key on creation with a unique constraint', 'Handled the unknown outcome (query by reference before retry)', 'Explicit status machine with monotonic, idempotent transitions', 'SCA redirect flow and the prompt completion constraint', 'Reconciliation against bank data', 'Signing, certificates and key handling', 'Per-bank breakers / limits', 'Funnel and in-flight-money metrics'],
    hints: ['The bank call times out. What are the two things that might have happened?', 'Status updates can arrive late and out of order. How do you stay correct?', 'Where do the signing keys live and who can use them?'] },

  /* ------------------------------------------------------------------ */
  { id: 'job-scheduler', title: 'Distributed job scheduler', level: 'core', minutes: 35,
    prompt: 'Design a scheduler that runs delayed and recurring jobs (like cron as a service) for many teams, with millions of scheduled jobs.',
    ref: {
      scope: `<ul><li><b>Must:</b> schedule one-off and recurring (cron-like) jobs, run them on time on a worker fleet, retry failures, cancel/update, show status and history.</li><li><b>Non-functional:</b> jobs run <b>at least once</b> within seconds of due time; survive node crashes; scale to millions of jobs; multi-tenant fairness.</li><li><b>Ask:</b> timing precision? job duration and payload size? what to do about missed runs? timezones/DST for cron?</li></ul>`,
      numbers: `<pre><code>10M scheduled jobs; 5k jobs/s fire at the busiest second
job row ~500 B → 5 GB of schedule state: fits one database, partition for throughput
a poller fetching 500 due jobs per query every 500 ms handles ~1k/s per poller; shard to scale</code></pre>`,
      api: `<pre><code>POST /v1/jobs { tenant, run_at | cron+tz, payload, retry_policy, idempotency_key }
DELETE /v1/jobs/{id}     GET /v1/jobs/{id}/runs

jobs(id, tenant, schedule, next_run_at, payload, status, version)   INDEX (status, next_run_at)
runs(id, job_id, scheduled_for, started_at, finished_at, status, attempt, worker)</code></pre>`,
      arch: `<ul><li>Jobs live in a database with an index on <code>(status, next_run_at)</code>.</li><li><b>Pollers</b> claim due jobs with <code>SELECT … WHERE next_run_at &lt;= now() ORDER BY next_run_at LIMIT n FOR UPDATE SKIP LOCKED</code>, set a lease, and push them onto a work queue; recurring jobs compute and store their next run in the same transaction.</li><li><b>Workers</b> execute, heartbeat while running and report the result; a reaper re-queues jobs whose lease expired.</li><li>An in-memory <b>timing wheel</b> for the next few seconds avoids hitting the database for near-term jobs.</li></ul>`,
      deep: `<h3>No double firing, no lost firing</h3><p><code>SKIP LOCKED</code> lets many pollers claim distinct rows without blocking each other. A lease plus heartbeat means a crashed worker's job is re-run: that is <b>at-least-once</b>, so jobs must be idempotent (the run carries a deterministic id).</p><h3>Scaling the pollers</h3><p>Shard jobs by <code>hash(job_id) % N</code> and give each poller a shard, or use consistent hashing so adding a poller moves few shards.</p><h3>Cron semantics</h3><p>Decide the missed-run policy (run once on recovery, run all, or skip). Store schedules with timezone and test DST transitions; compute next run in UTC.</p>`,
      ops: `<ul><li>Metrics: scheduling lag (actual minus due time), queue depth, run failure rate, jobs per tenant.</li><li>Fairness: per-tenant concurrency limits and weighted queues so one tenant's flood does not delay others.</li><li>Poison jobs: retry limit with backoff then park for inspection; alerts on repeated failure.</li><li>Clock: pollers use the database clock, not their own.</li></ul>` },
    tradeoffs: ['Database polling is simple and durable; a pure in-memory wheel is faster but needs rebuild after a crash.', 'At-least-once is achievable; exactly-once needs idempotent jobs.', 'Strict ordering across jobs is expensive and rarely required.'],
    followups: ['The database is down for 5 minutes. What happens on recovery?', 'Add dependencies between jobs (DAG).', 'A tenant schedules 10M jobs for the same second.', 'Support millisecond precision.'],
    rubric: ['Chose at-least-once and made jobs idempotent', 'Claiming strategy that avoids double processing (SKIP LOCKED / leases)', 'Heartbeats and reaper for crashed workers', 'Index and polling design with a scaling path (sharding)', 'Cron / timezone / DST and missed-run policy', 'Tenant fairness and limits', 'Scheduling-lag metric', 'Retry policy with backoff and dead-letter'],
    hints: ['Two pollers wake up at the same instant. How do they avoid taking the same job?', 'A worker dies halfway through a job. What happens next?', 'It is the daylight-saving switch night. What does "daily at 02:30" mean?'] },
];

/* ---------------- estimation trainer ---------------- */
(function () {
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const fmt = (x) => (x >= 1e9 ? (x / 1e9).toFixed(1) + 'B' : x >= 1e6 ? (x / 1e6).toFixed(1) + 'M' : x >= 1e3 ? (x / 1e3).toFixed(1) + 'k' : x >= 10 ? Math.round(x).toString() : x.toFixed(1));
  window.ESTIMATE_FMT = fmt;
  window.ESTIMATES = [
    { id: 'qps', title: 'Peak requests per second', gen(r) {
      const u = pick(r, [5, 10, 20, 50]), a = pick(r, [3, 5, 8, 12, 20]), k = pick(r, [2, 3, 5]);
      const avg = (u * 1e6 * a) / 86400, ans = avg * k;
      return { q: `${u}M daily active users each make ${a} requests a day. Peak traffic is ${k}× the average. What is the peak load?`, unit: 'req/s', answer: ans,
        steps: [`${u}M × ${a} = ${u * a}M requests/day`, `÷ 86,400 s/day ≈ ${fmt(avg)} req/s average`, `× ${k} peak factor ≈ ${fmt(ans)} req/s`], tip: 'Round a day to 10^5 seconds for quick mental maths (about 15% off).' };
    } },
    { id: 'storage', title: 'Storage over a retention period', gen(r) {
      const e = pick(r, [500, 1000, 2000, 5000]), b = pick(r, [200, 500, 1000, 2000]), d = pick(r, [7, 30, 90]), rep = pick(r, [1, 3]);
      const tb = (e * b * 86400 * d * rep) / 1e12;
      return { q: `A service ingests ${e} events per second, each ${b} bytes. You keep ${d} days of data${rep > 1 ? ' with 3 replicas' : ''}. How much storage in terabytes?`, unit: 'TB', answer: tb,
        steps: [`${e} × ${b} B = ${fmt(e * b)} B/s`, `× 86,400 s/day = ${(e * b * 86400 / 1e9).toFixed(1)} GB/day`, `× ${d} days${rep > 1 ? ' × 3 replicas' : ''} ≈ ${tb.toFixed(1)} TB`], tip: 'Do not forget replication, indexes (often +30-100%) and headroom.' };
    } },
    { id: 'bandwidth', title: 'Network bandwidth', gen(r) {
      const q = pick(r, [1000, 2000, 5000, 10000, 20000]), kb = pick(r, [10, 25, 50, 100, 200]);
      const mbps = (q * kb * 8) / 1000;
      return { q: `An API serves ${q} requests per second with ${kb} KB responses on average. What outbound bandwidth do you need, in megabits per second?`, unit: 'Mbit/s', answer: mbps,
        steps: [`${q} × ${kb} KB = ${fmt(q * kb)} KB/s`, `× 8 bits = ${fmt(q * kb * 8)} kbit/s`, `≈ ${fmt(mbps)} Mbit/s (${(mbps / 1000).toFixed(2)} Gbit/s)`], tip: 'Remember bits vs bytes (×8). Compression and CDNs change this a lot.' };
    } },
    { id: 'cache', title: 'Cache memory', gen(r) {
      const n = pick(r, [1, 5, 10, 20, 50]), b = pick(r, [100, 500, 1000, 2000]), hot = pick(r, [10, 20, 30]);
      const gb = (n * 1e6 * b * (hot / 100)) / 1e9;
      return { q: `You have ${n}M items of ${b} bytes each. You want to cache the hottest ${hot}% of them. How much cache memory, in gigabytes (ignore overhead)?`, unit: 'GB', answer: gb,
        steps: [`${n}M × ${b} B = ${fmt(n * 1e6 * b / 1e6)} MB total`, `× ${hot}% = ${fmt(n * 1e6 * b * hot / 100 / 1e6)} MB`, `≈ ${gb.toFixed(2)} GB`], tip: 'Real caches add per-key overhead (often 50-100 bytes). Say that you would add it.' };
    } },
    { id: 'littles', title: 'Concurrency (Little’s law)', gen(r) {
      const rps = pick(r, [200, 500, 1000, 3000]), ms = pick(r, [50, 100, 250, 500, 800]);
      const c = (rps * ms) / 1000;
      return { q: `A service handles ${rps} requests per second and each takes ${ms} ms on average. How many requests are in flight at any moment?`, unit: 'requests', answer: c,
        steps: [`Little's law: concurrency = rate × latency`, `${rps}/s × ${ms / 1000} s = ${fmt(c)}`], tip: 'If latency doubles because a dependency is slow, so does the concurrency you must support. That is how pools exhaust.' };
    } },
    { id: 'partitions', title: 'Kafka partitions', gen(r) {
      const mb = pick(r, [20, 50, 100, 200, 400]), per = pick(r, [5, 10]);
      const p = Math.ceil(mb / per);
      return { q: `A topic must sustain ${mb} MB/s. A single partition handles about ${per} MB/s comfortably. How many partitions do you need (round up, before adding headroom)?`, unit: 'partitions', answer: p,
        steps: [`${mb} ÷ ${per} = ${mb / per}`, `round up → ${p}`], tip: 'Then size for the consumer parallelism you will want later, because adding partitions later breaks key ordering.' };
    } },
    { id: 'budget', title: 'Error budget', gen(r) {
      const nines = pick(r, [99, 99.5, 99.9, 99.95, 99.99]);
      const mins = (30 * 24 * 60) * (1 - nines / 100);
      return { q: `Your SLO is ${nines}% availability over a 30-day month. How many minutes of downtime does the error budget allow?`, unit: 'minutes', answer: mins,
        steps: [`30 days × 24 h × 60 min = 43,200 min`, `× (1 − ${nines / 100}) = ${mins.toFixed(1)} min`], tip: '99.9% ≈ 43 min a month, 99.99% ≈ 4.3 min. Deploys and dependencies spend this budget too.' };
    } },
  ];
})();

/* ---------------- numbers to know ---------------- */
window.NUMBERS = [
  ['Main memory reference', '~100 ns'], ['SSD random read', '~100 µs (0.1 ms)'], ['Round trip inside a data centre / same region', '~0.5 ms'],
  ['Redis GET in the same region', '~0.2-1 ms'], ['Postgres indexed primary-key lookup (warm)', '~1 ms'], ['Spinning disk seek', '~10 ms'],
  ['Cross-continent round trip (EU to US east)', '~80-100 ms'], ['TLS handshake from scratch (cross-region)', '~100-300 ms'],
  ['One SSD / network node, sustained throughput', '~0.5-3 GB/s (SSD), ~1-10 Gbit/s (network)'], ['A decent single Kafka partition', '~5-10 MB/s sustained'],
  ['One Postgres primary, simple OLTP', '~5-20k simple queries/s (hardware dependent)'], ['Seconds in a day', '86,400 (round to 10^5 for mental math)'],
  ['Availability 99.9% / 99.99%', '~43 min / ~4.3 min downtime per 30 days'], ['1 million requests per day', '~12 requests per second'],
];
