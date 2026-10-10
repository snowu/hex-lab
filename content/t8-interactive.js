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
    intro: '<p>Three banks share one pool of workers (each square is a worker). Bank C turns slow. Step through the scenarios to see which protection contains the damage. The breaker treats errors and calls slower than 2s as failures.</p>',
    try: ['<b>no protection</b>: bank C holds every worker, and healthy banks A and B start failing.', '<b>+ timeout</b>: C is cut off at 1s, which helps but C still takes a big share of the pool.', '<b>+ bulkhead</b>: each bank gets its own workers, so A and B stay healthy even though C is slow.', '<b>+ breaker</b>: C is failed instantly after repeated slow calls, freeing the pool without any bulkhead.', 'Raise the <b>error rate</b> of C and compare how the breaker behaves with errors versus slowness.'] });

  /* ---------- bug hunts ---------- */
  INSERT('async-patterns', -1, { pid: 'bug-async', type: 'bug', title: 'Spot the concurrency bugs',
    prompt: '<p>An assistant wrote this transaction sync for a bank aggregator. It works in the demo. Click the <b>2</b> lines that will cause trouble in production.</p>',
    code: `async function syncAll(accountIds) {
  const results = [];
  await Promise.all(accountIds.map(async (id) => {
    const res = await fetchTransactions(id);
    results.push(...res);
  }));
  accountIds.forEach(async (id) => {
    await markSynced(id);
  });
  return results;
}`,
    bugs: [{ line: 3, why: 'Unbounded concurrency: <code>Promise.all</code> over every account fires all bank calls at once. With 5,000 accounts that hits bank rate limits and exhausts sockets. Use a pool such as <code>mapLimit</code>.' },
           { line: 7, why: '<code>forEach</code> ignores the promises returned by an <code>async</code> callback. The function returns before <code>markSynced</code> finishes, and any rejection becomes an unhandled promise rejection. Use <code>await Promise.all(...)</code> or a <code>for...of</code> loop.' }],
    hint: 'One line starts too much work at once; the other starts work nobody waits for.' });

  INSERT('ob-payments-money', -1, { pid: 'bug-money', type: 'bug', title: 'Spot the money bugs',
    prompt: '<p>This is part of a fee calculator. Click the <b>2</b> lines that are wrong for a payments system.</p>',
    code: `function chargeWithFee(amountEur, feePercent) {
  const fee = amountEur * (feePercent / 100);
  return { total: amountEur + fee, currency: 'EUR' };
}

function splitEqually(totalCents, n) {
  return Array(n).fill(totalCents / n);
}`,
    bugs: [{ line: 2, why: 'Money as floating-point euros. <code>19.99 * 0.15</code> is not exactly representable, so totals drift by fractions of a cent. Store integer minor units (cents) and apply one documented rounding rule.' },
           { line: 7, why: '<code>totalCents / n</code> produces fractional cents (100 / 3 = 33.333…) and the parts do not add up to the total. Use the largest-remainder method: floor each share and hand the leftover cents out one at a time.' }],
    ok: [3], hint: 'Both bugs are about numbers that cannot be represented as whole cents.' });

  INSERT('idempotency', -1, { pid: 'bug-idem', type: 'bug', title: 'This payment endpoint is idempotent. Is it?',
    prompt: '<p>The team claims this handler is safe to retry because it checks the idempotency key. Click the <b>2</b> lines that break that guarantee under concurrency or crashes.</p>',
    code: `async function createPayment(key, payload) {
  const existing = await db.findByKey(key);
  if (existing) return existing.result;
  const result = await bank.initiate(payload);
  await db.save({ key, result });
  return result;
}`,
    bugs: [{ line: 2, why: 'Check-then-act is not atomic. Two concurrent requests with the same key both see "no existing record" and both reach the bank. Claim the key first with an atomic insert guarded by a unique constraint.' },
           { line: 5, why: 'The key is recorded only after the side effect. If the process crashes between the bank call and this write, the retry will initiate the payment again. Record the key as <i>in progress</i> before calling the bank, then complete it afterwards.' }],
    ok: [4], hint: 'Ask what happens if two identical requests arrive together, and what happens if the server dies between two lines.' });

  INSERT('kafka', -1, { pid: 'bug-kafka', type: 'bug', title: 'Spot the Kafka consumer bugs',
    prompt: '<p>This consumer processes payment instructions. Click the <b>2</b> lines that will cost money or lose messages.</p>',
    code: `consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    await consumer.commitOffsets([{ topic, partition, offset: String(Number(message.offset) + 1) }]);
    await chargeCustomer(JSON.parse(message.value));
  },
});`,
    bugs: [{ line: 3, why: 'The offset is committed <i>before</i> the work is done, which is at-most-once. If the process crashes after the commit and before the charge, that payment is lost forever. Commit after processing (at-least-once).' },
           { line: 4, why: '<code>chargeCustomer</code> has no idempotency key, so once you fix the ordering and get redelivery, a retry double-charges. Also a malformed payload makes <code>JSON.parse</code> throw and blocks the partition. Use an idempotency key (for example topic-partition-offset), and send poison messages to a dead-letter topic.' }],
    hint: 'One line is about ordering of commit vs work. The other is about what happens when the same message arrives twice.' });

  INSERT('review-ai-code', -1, { pid: 'bug-sec', type: 'bug', title: 'Review this AI-written endpoint',
    prompt: '<p>An assistant generated this route. It passes the happy-path test. Click the <b>2</b> lines a security review would reject.</p>',
    code: `app.get('/accounts/:id/transactions', auth, async (req, res) => {
  const sql = "SELECT * FROM transactions WHERE account_id = '" + req.params.id + "'";
  const rows = await db.query(sql);
  console.log('fetched', rows.length, 'rows for', req.headers.authorization);
  res.json(rows);
});`,
    bugs: [{ line: 2, why: 'String-built SQL is injectable. It also queries by whatever id the caller supplies, with no check that the authenticated user owns that account, which is broken object-level authorisation (BOLA/IDOR). Use parameterised queries and filter by the caller\'s accounts.' },
           { line: 4, why: 'Logs the Authorization header, so bearer tokens end up in log storage. Never log credentials or tokens, and keep PII out of application logs.' }],
    ok: [3], hint: 'One line builds a query from user input. The other writes something secret to the logs.' });

  INSERT('review-ai-code', -1, { pid: 'bug-sort', type: 'bug', title: 'Plausible but wrong helpers',
    prompt: '<p>Two small helpers an assistant wrote for a dashboard. Click the <b>2</b> lines that fail on realistic input.</p>',
    code: `function top3(scores) {
  scores.sort();
  return scores.slice(-3).reverse();
}

const average = (xs) => xs.reduce((a, b) => a + b) / xs.length;`,
    bugs: [{ line: 2, why: 'Array.prototype.sort() with no comparator sorts as strings: [10, 9, 100] becomes [10, 100, 9]. It also mutates the caller\'s array. Copy first and pass <code>(a, b) =&gt; a - b</code>.' },
           { line: 6, why: '<code>reduce</code> without an initial value throws a TypeError on an empty array. Pass <code>0</code> as the initial value and decide what the average of nothing should be.' }],
    hint: 'Think about how JavaScript sorts numbers by default, and what reduce does on an empty array.' });

  /* ---------- predict the output ---------- */
  INSERT('async-patterns', 1, { pid: 'pred-loop', type: 'predict', title: 'Event loop order',
    intro: '<p>A classic senior JavaScript question: microtasks vs timers.</p>',
    code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
(async () => { console.log('D'); await null; console.log('E'); })();
console.log('F');`,
    question: 'In what order are the letters printed?',
    options: ['A B C D E F', 'A D F C E B', 'A F D C E B', 'A D F B C E'], answer: 1,
    explain: 'Synchronous code runs first: <code>A</code>, then the async function body up to its first <code>await</code> (<code>D</code>), then <code>F</code>. Promise callbacks are <b>microtasks</b> and run before the next <b>macrotask</b>: <code>C</code>, then the continuation after <code>await</code> (<code>E</code>). The <code>setTimeout</code> callback is a macrotask, so <code>B</code> is last.',
    output: ['A', 'D', 'F', 'C', 'E', 'B'] });

  INSERT('idempotency', 1, { pid: 'pred-retry', type: 'predict', title: 'Retrying a charge',
    intro: '<p>The server applies the charge, but the response is lost on the first attempt. The client retries without an idempotency key.</p>',
    code: `let balance = 100;
let calls = 0;
async function charge(amount) {
  balance -= amount;                  // the server applies the charge...
  calls++;
  if (calls === 1) throw new Error('timeout'); // ...but the response is lost
  return balance;
}
async function withRetry(fn) {
  try { return await fn(); } catch { return await fn(); }
}
console.log(await withRetry(() => charge(30)));
console.log('balance:', balance);`,
    question: 'What is printed?',
    options: ['70 then "balance: 70"', '40 then "balance: 40"', '70 then "balance: 40"', '100 then "balance: 100"'], answer: 1,
    explain: 'The first call charged 30 (balance 70) but timed out, so the client retried and charged another 30. The customer paid 60 for a 30 purchase. An idempotency key lets the server recognise the retry and return the first result instead of applying it again.',
    output: ['40', 'balance: 40'] });

  INSERT('ob-payments-money', 1, { pid: 'pred-float', type: 'predict', title: 'Floating-point money',
    intro: '<p>Why seniors insist on integer minor units for currency.</p>',
    code: `console.log(0.1 + 0.2);
console.log(19.99 * 100);
console.log(Math.round(19.99 * 100));
console.log((1999 * 15) / 100);`,
    question: 'Which is the exact output, line by line?',
    options: ['0.3, 1999, 1999, 299.85', '0.30000000000000004, 1998.9999999999998, 1999, 299.85', '0.30000000000000004, 1999, 1999, 299.85', '0.3, 1998.9999999999998, 1998, 299.85'], answer: 1,
    explain: 'Binary floating point cannot represent most decimal fractions exactly. <code>19.99 * 100</code> is <code>1998.9999999999998</code>, so truncating it would lose a cent, and rounding hides the problem rather than fixing it. Integer cents stay exact, and you choose the rounding rule explicitly instead of inheriting whatever the float happens to do.',
    output: ['0.30000000000000004', '1998.9999999999998', '1999', '299.85'] });

  INSERT('kafka', 4, { pid: 'pred-redeliver', type: 'predict', title: 'What does a crash before the commit cause?',
    intro: '<p>A tiny at-least-once consumer: process, then commit. It crashes while handling the second message, then restarts.</p>',
    code: `const log = ['pay-1', 'pay-2', 'pay-3'];
let committed = 0;                 // next offset to read
const processed = [];
function consume(crashAfter) {
  for (let i = committed; i < log.length; i++) {
    processed.push(log[i]);        // side effect
    if (i + 1 === crashAfter) return; // crash before the commit below
    committed = i + 1;             // commit after processing
  }
}
consume(2);   // crashes while handling pay-2
consume(99);  // restart
console.log(processed.join(','));
console.log('committed', committed);`,
    question: 'What is printed?',
    options: ['pay-1,pay-2,pay-3 then "committed 3"', 'pay-1,pay-2,pay-2,pay-3 then "committed 3"', 'pay-1,pay-3 then "committed 3"', 'pay-1,pay-2,pay-2,pay-3 then "committed 2"'], answer: 1,
    explain: '<code>pay-2</code> was processed but never committed, so after the restart it is read again: the side effect runs twice. That is at-least-once delivery. The fix is not to avoid it but to make the handler idempotent.',
    output: ['pay-1,pay-2,pay-2,pay-3', 'committed 3'] });
})();
