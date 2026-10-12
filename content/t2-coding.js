TRACKS.push({
  id: 'coding', icon: '⌨️', title: 'Coding Fluency',
  blurb: 'Senior-flavoured coding problems in Python: real-world shaped, with edge cases, asyncio concurrency and clean APIs, not only puzzles.',
  lessons: [
    {
      id: 'maps-complexity', title: 'Hash maps & complexity talk', minutes: 15,
      summary: 'Most practical problems are a hash map plus a clear invariant.',
      checks: [
        { q: 'A reviewer flags this loop over 100k users as too slow: "for u in users: if u in banned_list: ...". What is the problem and the fix?',
          options: ['Sorting is missing; sort both lists first', 'String comparison is slow; hash the usernames manually', 'Membership on a list is O(n), making the loop quadratic; build a set of banned ids first for O(1) lookups', 'The loop variable name is too short; rename it'],
          answer: 2, explain: 'The lesson warns x in some_list is O(n), the most common accidental quadratic. A set turns the lookup into O(1) average.' },
        { q: 'You want to group events by a composite key of (user_id, day). Which key choice works in a dict, and why?',
          options: ['A tuple (user_id, day), because tuples are hashable', 'A list [user_id, day], because lists preserve order', 'A dict {user: user_id, day: day}, because it is self-describing', 'A set {user_id, day}, because sets are fastest'],
          answer: 0, explain: 'Dict and set keys must be hashable: tuples are, lists/dicts/sets are not. Say the complexity trade out loud: O(n) time for O(n) space.' },
      ],
      sections: [
        { type: 'text', html: `
<p>Always say the complexity out loud and what you trade for it. The 80% pattern: <b>replace a nested loop with a dict or set lookup</b> → O(n²) becomes O(n) time at O(n) space.</p>
<pre><code># O(n^2): "in" on a list is a linear scan
for a in xs:
    for b in xs:
        ...

# O(n) time, O(n) space
seen = set()
for x in xs:
    if x in seen:
        ...
    seen.add(x)</code></pre>
<p>Know your standard library: <code>dict</code> and <code>set</code> (hash tables; dicts keep insertion order since 3.7), <code>collections.Counter</code>, <code>defaultdict</code> and <code>deque</code>, and <code>heapq</code>. Keys must be hashable: tuples are, lists and dicts are not. And <code>x in some_list</code> is O(n), the most common accidental quadratic.</p>` },
        { type: 'quiz', q: 'You must find the first duplicate in a stream of N ids, memory is plentiful. Best approach?',
          options: ['Sort then scan: O(n log n)', 'Nested loops: O(n²)', 'Set of seen ids: O(n) time, O(n) space', 'Binary search on the ids'],
          answer: 2, explain: 'A Set gives O(1) average membership. Mention the memory trade-off, and that with tight memory you might sort or use a Bloom filter (accepting false positives).' },
        { type: 'code', ref: 'latest_by_id' },
        { type: 'code', ref: 'top_k' },
      ],
    },
    {
      id: 'stateful-classes', title: 'Design-a-class problems', minutes: 20,
      summary: 'LRU cache and rate limiter: clean APIs, injectable clocks, invariants.',
      checks: [
        { q: 'Your rate limiter calls time.time() directly, and tests must sleep for real seconds. What is the senior fix?',
          options: ['Inject the clock (default time.time) so tests can pass a fake clock and advance time deterministically', 'Make the limit higher so tests never hit it', 'Catch all exceptions so sleeps never fail', 'Store timestamps as strings for readability'],
          answer: 0, explain: 'Injecting dependencies like a clock keeps the public surface tiny and the invariant testable; define edge behavior up front instead of sleeping in tests.' },
        { q: 'In your LRU cache, get(k) returns the value but hit rates are mysteriously low. What invariant did you break?',
          options: ['Keys must be sorted before every access', 'The cache must be cleared on every read to stay fresh', 'A get must mark the key most-recently-used (move_to_end) so eviction drops the truly least-used entry', 'Capacity should grow by one on every get'],
          answer: 2, explain: 'The LRU invariant is maintained across operations: every get and put refreshes recency, and eviction removes the least-recently-used entry in O(1).' },
      ],
      sections: [
        { type: 'text', html: `
<p>These problems test whether you can maintain <b>invariants</b> across operations. Senior moves: inject dependencies (a clock!) so the code is testable, define behavior at edges up front, and keep the public surface tiny.</p>
<div class="callout tip">In Python an <code>OrderedDict</code> (<code>move_to_end</code>, <code>popitem(last=False)</code>) gives you an LRU in a few lines. In interviews, also be ready to explain the classic hash map + doubly linked list version (O(1) get/put, which is what <code>OrderedDict</code> is underneath) and the thread-safety follow-ups.</div>` },
        { type: 'code', ref: 'lru' },
        { type: 'code', ref: 'limiter' },
      ],
    },
    {
      id: 'async-patterns', title: 'Async patterns: pools, retries, timeouts', minutes: 20,
      summary: 'Concurrency control and resilience with asyncio.',
      checks: [
        { q: 'You run asyncio.gather over 10,000 URL fetches and the downstream service falls over. What is the fix?',
          options: ['Add more retries so failed ones eventually succeed', 'Remove the timeout so slow requests can finish', 'Bound concurrency with a semaphore or worker pool so only N requests are in flight at once', 'Switch to threads because asyncio cannot do I/O'],
          answer: 2, explain: 'Unbounded gather starts 10,000 requests at once. Bounded concurrency is the control that protects both your pool and the downstream service.' },
        { q: 'Your retry helper re-sends a "charge card" POST instantly on every failure, with no jitter. What two traps did you hit?',
          options: ['None; fast retries always improve success rates', 'Retrying a non-idempotent call can double-charge, and retrying without jitter causes a thundering herd', 'Backoff is illegal for payment APIs', 'Timeouts should be removed during retries'],
          answer: 1, explain: 'The lesson warns retrying non-idempotent calls can double-charge and retrying without jitter makes a thundering herd. Use backoff plus jitter and make the operation safe to repeat.' },
      ],
      sections: [
        { type: 'text', html: `
<p>Real services spend their lives waiting on other services. Three utilities show up constantly: <b>bounded concurrency</b>, <b>retry with backoff + jitter</b>, and <b>timeouts</b>. Be able to write each from scratch.</p>
<div class="callout warn"><b>Classic traps:</b> <code>asyncio.gather</code> over 10,000 coroutines starts 10,000 requests at once. Retrying non-idempotent calls can double-charge. Retrying without jitter makes a thundering herd.</div>` },
        { type: 'code', ref: 'map_limit' },
        { type: 'code', ref: 'retry' },
        { type: 'quiz', q: 'A downstream bank API returns 429 with <code>Retry-After: 30</code>. Your retry helper uses exponential backoff starting at 100ms. What is wrong?',
          options: ['Nothing, backoff is always right', 'You should respect Retry-After; hammering earlier wastes budget and may get you blocked', 'You should retry immediately once', 'You should switch to a different bank'],
          answer: 1, explain: 'The server told you exactly when to come back. Respect it (and cap it), and consider a per-bank circuit breaker so one throttled bank does not consume your worker pool.' },
      ],
    },
  ],
});
