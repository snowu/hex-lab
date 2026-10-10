TRACKS.push({
  id: 'coding', icon: '⌨️', title: 'Coding Fluency',
  blurb: 'Senior-flavoured coding problems in Python: real-world shaped, with edge cases, asyncio concurrency and clean APIs, not only puzzles.',
  lessons: [
    {
      id: 'maps-complexity', title: 'Hash maps & complexity talk', minutes: 15,
      summary: 'Most practical problems are a hash map plus a clear invariant.',
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
