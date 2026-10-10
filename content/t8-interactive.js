/* Interactive sections (simulations, bug hunts, predict-the-output) added alongside the existing lesson text.
   INSERT(lessonId, position, section): position is an index into the lesson's current sections (negative = from the end).
   Every added section carries a unique `pid` so saved progress for the original sections keeps working. */
(function () {
  function INSERT(lessonId, at, section) {
    for (const t of TRACKS) for (const l of t.lessons) if (l.id === lessonId) {
      const i = at < 0 ? l.sections.length + at : at;
      l.sections.splice(i, 0, section); return;
    }
    throw new Error('t8-interactive: unknown lesson ' + lessonId);
  }

  /* ---------- simulations ---------- */
  INSERT('kafka', 1, { pid: 'sim-kafka', type: 'sim', id: 'kafka', title: 'Partitions, keys and consumer groups',
    intro: '<p>Send messages and watch how the key decides the partition, how partitions are divided between consumers, and what breaks when you change the numbers.</p>',
    try: ['Click <b>pay-1</b> several times: it always lands on the same partition, which is why per-key ordering works.', 'Add consumers until one shows <b>IDLE</b>: parallelism is capped by the partition count.', 'Press <b>+ partition</b> and keep sending <b>pay-1</b>: the key now spans two partitions and ordering is lost.', 'Tick <b>hot key</b>, send <b>random ×10</b> a few times and see one partition take most of the backlog.', 'Remove a consumer and watch the partitions get reassigned (a rebalance).'] });
  INSERT('sagas-breakers', 1, { pid: 'sim-breaker', type: 'sim', id: 'breaker', title: 'Circuit breaker state machine',
    intro: '<p>A real breaker, running live. Break the dependency, watch it trip, then let it recover.</p>',
    try: ['Set the dependency to <b>DOWN</b> and press <b>Send request</b> until the breaker opens.', 'While it is <b>OPEN</b> keep sending: requests are rejected instantly and the dependency is never touched.', 'Wait for the cooldown, bring the dependency <b>UP</b> and send once: the probe succeeds and the breaker closes.', 'Repeat, but leave the dependency down during the probe: it goes straight back to OPEN.'] });
  INSERT('consistent-hashing', 1, { pid: 'sim-ring', type: 'sim', id: 'ring', title: 'The hash ring',
    intro: '<p>Dots are keys and coloured ticks are virtual nodes. Add or remove a node and compare how many keys must move with the naive <code>hash(key) mod N</code> approach.</p>',
    try: ['Press <b>+ add node</b>: consistent hashing moves roughly 1/N of the keys, while mod N moves most of them.', 'Set virtual nodes to <b>1</b> and look at the spread: some nodes get far more keys than others.', 'Raise virtual nodes to <b>100</b> and the load evens out.'] });
  INSERT('stateful-classes', 2, { pid: 'sim-bucket', type: 'sim', id: 'bucket', title: 'Token bucket rate limiter',
    intro: '<p>Each request spends one token. Tokens refill continuously up to the capacity. Capacity is your burst tolerance, refill rate is your sustained throughput.</p>',
    try: ['Press <b>Burst ×10</b> with capacity 5: the first 5 pass, the rest are rejected.', 'Wait a few seconds and burst again: the bucket has refilled.', 'Turn on <b>auto traffic</b> at 8/s with a refill of 2/s: roughly three quarters of requests are rejected in steady state.', 'Raise capacity but not the refill rate: bigger bursts, same long-run rate.'] });
  INSERT('ob-aggregator-eng', 1, { pid: 'sim-outage', type: 'sim', id: 'outage', title: 'One slow bank vs your worker pool',
    intro: '<p>An aggregator serves three banks (illustrative names) from one pool of 64 workers at 30 requests/s each. For the first 20 seconds everything is healthy: ~99.7% success, p95 under half a second. Then <b>Havn Bank</b> degrades: calls take about 9 seconds and 10% fail. Step through the scenarios and watch which protection contains the damage. The breaker counts errors and calls slower than 2s as failures.</p>',
    try: ['<b>no protection</b>: after the incident Havn Bank holds the workers, queues build, and the <i>healthy</i> banks fail too. Look at the timeline.', '<b>+ timeout</b>: Havn Bank is cut off at 2s, which helps a lot but it still consumes a large share of the pool.', '<b>+ bulkhead</b>: each bank gets its own workers, so the healthy banks stay at baseline however slow Havn Bank is.', '<b>+ breaker</b>: after a few slow or failed calls Havn Bank is failed instantly, so no workers are wasted on it.', 'Raise the load to 60 req/s or shrink the pool, and see how much headroom each setup really has.', 'Drop the incident latency to 1s and raise the error rate instead: compare how the breaker reacts to errors versus slowness.'] });

  /* ---------- bug hunts (Python) ---------- */
  INSERT('async-patterns', -1, { pid: 'bug-async', type: 'bug', title: 'Spot the concurrency bugs',
    prompt: '<p>An assistant wrote this transaction sync for a bank aggregator. It works in the demo. Click the <b>2</b> lines that will cause trouble in production.</p>',
    code: String.raw`async def sync_all(account_ids):
    results = []
    async def one(account_id):
        res = await fetch_transactions(account_id)
        results.extend(res)
    await asyncio.gather(*(one(a) for a in account_ids))
    for account_id in account_ids:
        asyncio.create_task(mark_synced(account_id))
    return results`,
    bugs: [{ line: 6, why: 'Unbounded concurrency: <code>asyncio.gather</code> over every account starts every bank call at once. With 5,000 accounts that hits bank rate limits and exhausts sockets. Bound it with an <code>asyncio.Semaphore</code> (the <code>map_limit</code> pattern).' },
           { line: 8, why: '<code>asyncio.create_task</code> without keeping or awaiting the task is fire-and-forget. <code>sync_all</code> returns before <code>mark_synced</code> finishes, exceptions are only logged as "Task exception was never retrieved", and the event loop holds only a weak reference, so the task can even be garbage-collected mid-flight. Await it (gather) or use <code>asyncio.TaskGroup</code>.' }],
    ok: [7], hint: 'One line starts too much work at once; the other starts work nobody waits for.' });

  INSERT('ob-payments-money', -1, { pid: 'bug-money', type: 'bug', title: 'Spot the money bugs',
    prompt: '<p>This is part of a fee calculator. Click the <b>2</b> lines that are wrong for a payments system.</p>',
    code: String.raw`def charge_with_fee(amount_eur, fee_percent):
    fee = amount_eur * (fee_percent / 100)
    return {'total': amount_eur + fee, 'currency': 'EUR'}

def split_equally(total_cents, n):
    return [total_cents / n] * n`,
    bugs: [{ line: 2, why: 'Money as floating-point euros. <code>19.99 * 0.15</code> is not exactly representable, so totals drift by fractions of a cent. Use integer minor units (cents) or <code>decimal.Decimal</code>, and one documented rounding rule.' },
           { line: 6, why: '<code>/</code> is true division in Python 3, so <code>100 / 3</code> gives <code>33.333…</code>: fractional cents, and the parts do not add up to the total. Use <code>divmod</code> and hand the leftover cents out one at a time (largest remainder).' }],
    ok: [3], hint: 'Both bugs are about numbers that cannot be represented as whole cents.' });

  INSERT('idempotency', -1, { pid: 'bug-idem', type: 'bug', title: 'This payment endpoint is idempotent. Is it?',
    prompt: '<p>The team claims this handler is safe to retry because it checks the idempotency key. Click the <b>2</b> lines that break that guarantee under concurrency or crashes.</p>',
    code: String.raw`async def create_payment(key, payload):
    existing = await db.find_by_key(key)
    if existing:
        return existing.result
    result = await bank.initiate(payload)
    await db.save(key=key, result=result)
    return result`,
    bugs: [{ line: 2, why: 'Check-then-act is not atomic. Two concurrent requests with the same key both see "no existing record" and both reach the bank. Claim the key first with an atomic insert guarded by a unique constraint.' },
           { line: 6, why: 'The key is recorded only after the side effect. If the process crashes between the bank call and this write, the retry will initiate the payment again. Record the key as <i>in progress</i> before calling the bank, then complete it afterwards.' }],
    ok: [5], hint: 'Ask what happens if two identical requests arrive together, and what happens if the server dies between two lines.' });

  INSERT('kafka', -1, { pid: 'bug-kafka', type: 'bug', title: 'Spot the Kafka consumer bugs',
    prompt: '<p>This consumer processes payment instructions. Click the <b>2</b> lines that will cost money or lose messages.</p>',
    code: String.raw`consumer = KafkaConsumer('payments', group_id='billing', enable_auto_commit=False)
for msg in consumer:
    consumer.commit()
    charge_customer(json.loads(msg.value))`,
    bugs: [{ line: 3, why: 'The offset is committed <i>before</i> the work is done, which is at-most-once. If the process crashes after the commit and before the charge, that payment is lost forever. Commit after processing (at-least-once).' },
           { line: 4, why: '<code>charge_customer</code> has no idempotency key, so once you fix the ordering and get redelivery, a retry double-charges. Also a malformed payload makes <code>json.loads</code> raise and blocks the partition. Use an idempotency key (for example topic-partition-offset), and send poison messages to a dead-letter topic.' }],
    hint: 'One line is about ordering of commit vs work. The other is about what happens when the same message arrives twice.' });

  INSERT('review-ai-code', -1, { pid: 'bug-sec', type: 'bug', title: 'Review this AI-written endpoint',
    prompt: '<p>An assistant generated this Flask route. It passes the happy-path test. Click the <b>2</b> lines a security review would reject.</p>',
    code: String.raw`@app.get('/accounts/<account_id>/transactions')
@login_required
def transactions(account_id):
    rows = db.execute(f"SELECT * FROM transactions WHERE account_id = '{account_id}'")
    app.logger.info('fetched %d rows for %s', len(rows), request.headers['Authorization'])
    return jsonify(rows)`,
    bugs: [{ line: 4, why: 'An f-string builds the SQL, so it is injectable. It also queries by whatever id the caller supplies, with no check that the logged-in user owns that account, which is broken object-level authorisation (BOLA/IDOR). Use parameterised queries and filter by the caller\'s accounts.' },
           { line: 5, why: 'Logs the Authorization header, so bearer tokens end up in log storage. Never log credentials or tokens, and keep PII out of application logs.' }],
    ok: [6], hint: 'One line builds a query from user input. The other writes something secret to the logs.' });

  INSERT('review-ai-code', -1, { pid: 'bug-defaults', type: 'bug', title: 'Plausible but wrong helpers',
    prompt: '<p>Two small helpers an assistant wrote for a dashboard. Click the <b>2</b> lines that fail on realistic use.</p>',
    code: String.raw`def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

def average(xs):
    return sum(xs) / len(xs)`,
    bugs: [{ line: 1, why: 'A mutable default argument is created once, when the function is defined, and shared by every call: <code>add_tag("a")</code> then <code>add_tag("b")</code> returns <code>["a", "b"]</code>. Use <code>tags=None</code> and create the list inside the function.' },
           { line: 6, why: 'Raises <code>ZeroDivisionError</code> on an empty list. Decide what the average of nothing should be (<code>None</code>, <code>0</code>, or a clear error) and handle it explicitly.' }],
    hint: 'Think about when Python evaluates default argument values, and what an empty list does to the division.' });

  /* ---------- predict the output (Python) ---------- */
  INSERT('async-patterns', 1, { pid: 'pred-gather', type: 'predict', title: 'gather: completion order vs result order',
    intro: '<p>Three coroutines finish at different times. What does <code>asyncio.gather</code> give back, and in which order do they print?</p>',
    code: String.raw`import asyncio

async def work(name, delay):
    await asyncio.sleep(delay)
    print('done', name)
    return name

results = await asyncio.gather(work('a', 0.06), work('b', 0.02), work('c', 0.04))
print(results)`,
    question: 'What is printed?',
    options: ['done a, done b, done c, then [a, b, c]', 'done b, done c, done a, then [a, b, c]', 'done b, done c, done a, then [b, c, a]', 'done a, done b, done c, then [b, c, a]'], answer: 1,
    explain: 'The coroutines run concurrently, so they <b>finish</b> in order of their delays: b (20ms), c (40ms), a (60ms). But <code>gather</code> returns results in the order the awaitables were <b>passed in</b>, not the order they completed. If you need completion order, use <code>asyncio.as_completed</code>.',
    output: ['done b', 'done c', 'done a', "['a', 'b', 'c']"] });

  INSERT('idempotency', 1, { pid: 'pred-retry', type: 'predict', title: 'Retrying a charge',
    intro: '<p>The server applies the charge, but the response is lost on the first attempt. The client retries without an idempotency key.</p>',
    code: String.raw`balance = 100
calls = 0

async def charge(amount):
    global balance, calls
    balance -= amount                  # the server applies the charge...
    calls += 1
    if calls == 1:
        raise TimeoutError('timeout')  # ...but the response is lost
    return balance

async def with_retry(fn):
    try:
        return await fn()
    except TimeoutError:
        return await fn()

print(await with_retry(lambda: charge(30)))
print('balance:', balance)`,
    question: 'What is printed?',
    options: ['70 then "balance: 70"', '40 then "balance: 40"', '70 then "balance: 40"', '100 then "balance: 100"'], answer: 1,
    explain: 'The first call charged 30 (balance 70) but timed out, so the client retried and charged another 30. The customer paid 60 for a 30 purchase. An idempotency key lets the server recognise the retry and return the first result instead of applying it again.',
    output: ['40', 'balance: 40'] });

  INSERT('ob-payments-money', 1, { pid: 'pred-float', type: 'predict', title: 'Floats and rounding in money code',
    intro: '<p>Two reasons seniors insist on integer minor units or <code>Decimal</code> for currency.</p>',
    code: String.raw`print(0.1 + 0.2)
print(19.99 * 100)
print(round(19.99 * 100))
print(round(2.5), round(3.5))`,
    question: 'Which is the exact output, line by line?',
    options: ['0.3, 1999.0, 1999, 3 4', '0.30000000000000004, 1998.9999999999998, 1999, 2 4', '0.30000000000000004, 1999.0, 1999, 3 4', '0.3, 1998.9999999999998, 1998, 2 4'], answer: 1,
    explain: 'Binary floating point cannot represent most decimal fractions exactly, so <code>19.99 * 100</code> is <code>1998.9999999999998</code>. And Python&#39;s <code>round()</code> uses <b>banker&#39;s rounding</b> (round half to even): <code>round(2.5)</code> is 2 and <code>round(3.5)</code> is 4, which silently shifts money by a cent. Use integer cents or <code>Decimal</code> with an explicit rounding mode.',
    output: ['0.30000000000000004', '1998.9999999999998', '1999', '2 4'] });

  INSERT('kafka', 4, { pid: 'pred-redeliver', type: 'predict', title: 'What does a crash before the commit cause?',
    intro: '<p>A tiny at-least-once consumer: process, then commit. It crashes while handling the second message, then restarts.</p>',
    code: String.raw`log = ['pay-1', 'pay-2', 'pay-3']
committed = 0                      # next offset to read
processed = []

def consume(crash_after):
    global committed
    for i in range(committed, len(log)):
        processed.append(log[i])           # side effect
        if i + 1 == crash_after:
            return                         # crash before the commit below
        committed = i + 1                  # commit after processing

consume(2)    # crashes while handling pay-2
consume(99)   # restart
print(','.join(processed))
print('committed', committed)`,
    question: 'What is printed?',
    options: ['pay-1,pay-2,pay-3 then "committed 3"', 'pay-1,pay-2,pay-2,pay-3 then "committed 3"', 'pay-1,pay-3 then "committed 3"', 'pay-1,pay-2,pay-2,pay-3 then "committed 2"'], answer: 1,
    explain: '<code>pay-2</code> was processed but never committed, so after the restart it is read again: the side effect runs twice. That is at-least-once delivery. The fix is not to avoid it but to make the handler idempotent.',
    output: ['pay-1,pay-2,pay-2,pay-3', 'committed 3'] });
})();
