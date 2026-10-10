/* All coding exercises (Python, run in-browser with Pyodide; CI runs the same code under CPython).
   Lesson files reference them with { type: 'code', ref: '<id>' }; resolved at the bottom of this file.
   Tests use: test(name, fn) / @test(name), eq(actual, expected), raises(Exc), close(a, b). Both sync and async tests work. */
window.EXERCISES = {

  chunk: {
    title: 'Spot and fix the AI bug',
    prompt: `<p>An assistant produced this “split a list into pages” helper. It passes the happy path but is wrong on edge cases. Fix it so all tests pass. <code>chunk([1, 2, 3, 4, 5], 2)</code> should be <code>[[1, 2], [3, 4], [5]]</code>.</p>`,
    starter: String.raw`def chunk(items, size):
    out = []
    for i in range(0, len(items) - size, size):
        out.append(items[i:i + size])
    return out
`,
    tests: String.raw`test('even split', lambda: eq(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]))
test('remainder kept', lambda: eq(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]))
test('size larger than the list', lambda: eq(chunk([1, 2], 5), [[1, 2]]))
test('empty list', lambda: eq(chunk([], 3), []))

@test('invalid size raises ValueError')
def _():
    for bad in (0, -1):
        with raises(ValueError):
            chunk([1], bad)

@test('does not mutate the input')
def _():
    data = [1, 2, 3]
    chunk(data, 2)
    eq(data, [1, 2, 3])
`,
    hint: 'The range stops one page too early (len(items) - size). And decide what a size of 0 or a negative number should do: slicing is forgiving, so bad input silently returns garbage unless you check it.',
    solution: String.raw`def chunk(items, size):
    if not isinstance(size, int) or size <= 0:
        raise ValueError('size must be a positive integer')
    return [items[i:i + size] for i in range(0, len(items), size)]`,
    notes: 'Generated code looked right. Boundaries (off-by-one, empty input, invalid input) are exactly where it fails, so test them first. Python is forgiving (slices never raise), which makes silent wrong answers easy.',
  },

  latest_by_id: {
    title: 'Latest record wins',
    prompt: `<p>Write <code>latest_by_id(events)</code>. Each event is a dict <code>{'id', 'ts', 'value'}</code>. Return a list with <b>one event per id</b>, the one with the highest <code>ts</code>, ordered by <b>first appearance of the id</b>. Ties on <code>ts</code>: keep the later one in the input. Do it in O(n).</p>`,
    starter: String.raw`def latest_by_id(events):
    # your code
    pass
`,
    tests: String.raw`def E(i, ts, value):
    return {'id': i, 'ts': ts, 'value': value}

test('basic', lambda: eq(latest_by_id([E('a', 1, 1), E('b', 1, 2), E('a', 2, 3)]), [E('a', 2, 3), E('b', 1, 2)]))
test('older ignored', lambda: eq(latest_by_id([E('a', 5, 1), E('a', 2, 9)]), [E('a', 5, 1)]))
test('tie keeps later input', lambda: eq(latest_by_id([E('a', 5, 1), E('a', 5, 2)]), [E('a', 5, 2)]))
test('empty', lambda: eq(latest_by_id([]), []))
test('order by first appearance', lambda: eq([e['id'] for e in latest_by_id([E('z', 1, 0), E('y', 1, 0), E('z', 3, 1)])], ['z', 'y']))

@test('does not mutate the input')
def _():
    events = [E('a', 1, 1), E('a', 2, 2)]
    latest_by_id(events)
    eq(events, [E('a', 1, 1), E('a', 2, 2)])
`,
    hint: 'A dict keeps insertion order, and assigning to an existing key keeps its original position.',
    solution: String.raw`def latest_by_id(events):
    best = {}
    for e in events:
        cur = best.get(e['id'])
        if cur is None or e['ts'] >= cur['ts']:
            best[e['id']] = e
    return list(best.values())`,
    notes: 'Dicts preserve insertion order (3.7+), and re-assigning an existing key keeps its original position, which gives the ordering for free.',
  },

  top_k: {
    title: 'Group and count',
    prompt: `<p>Write <code>top_k(words, k)</code> returning the <code>k</code> most frequent words as a list, sorted by count descending, ties broken alphabetically.</p>`,
    starter: String.raw`def top_k(words, k):
    # your code
    pass
`,
    tests: String.raw`test('basic', lambda: eq(top_k(['a', 'b', 'a', 'c', 'b', 'a'], 2), ['a', 'b']))
test('tie alphabetical', lambda: eq(top_k(['b', 'a', 'c'], 2), ['a', 'b']))
test('k bigger than distinct', lambda: eq(top_k(['x', 'x', 'y'], 5), ['x', 'y']))
test('empty', lambda: eq(top_k([], 3), []))
test('k is zero', lambda: eq(top_k(['a'], 0), []))
`,
    hint: 'collections.Counter counts for you. Counter.most_common breaks ties by first-seen order, not alphabetically, so sort yourself with a (−count, word) key.',
    solution: String.raw`from collections import Counter

def top_k(words, k):
    counts = Counter(words)
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [word for word, _ in ranked[:k]]`,
    notes: 'When n is huge and k is small, heapq.nsmallest(k, ..., key=...) is O(n log k) instead of sorting everything.',
  },

  lru: {
    title: 'LRU cache',
    prompt: `<p>Implement <code>class LRUCache</code> with <code>__init__(capacity)</code>, <code>get(key)</code> (returns the value or <code>None</code>, and marks the key as recently used) and <code>put(key, value)</code> (evicts the least recently used entry when over capacity). All operations O(1).</p>`,
    starter: String.raw`class LRUCache:
    def __init__(self, capacity):
        pass

    def get(self, key):
        pass

    def put(self, key, value):
        pass
`,
    tests: String.raw`@test('basic get/put')
def _():
    c = LRUCache(2)
    c.put('a', 1); c.put('b', 2)
    eq(c.get('a'), 1); eq(c.get('b'), 2)

@test('evicts the least recently used')
def _():
    c = LRUCache(2)
    c.put('a', 1); c.put('b', 2); c.put('c', 3)
    eq(c.get('a'), None); eq(c.get('b'), 2); eq(c.get('c'), 3)

@test('get refreshes recency')
def _():
    c = LRUCache(2)
    c.put('a', 1); c.put('b', 2)
    c.get('a')
    c.put('c', 3)
    eq(c.get('b'), None); eq(c.get('a'), 1)

@test('put on an existing key refreshes and updates')
def _():
    c = LRUCache(2)
    c.put('a', 1); c.put('b', 2); c.put('a', 10); c.put('c', 3)
    eq(c.get('a'), 10); eq(c.get('b'), None)

@test('falsy values are real values')
def _():
    c = LRUCache(1)
    c.put('z', 0)
    eq(c.get('z'), 0)

@test('capacity 1')
def _():
    c = LRUCache(1)
    c.put('a', 1); c.put('b', 2)
    eq(c.get('a'), None); eq(c.get('b'), 2)
`,
    hint: 'collections.OrderedDict has move_to_end(key) and popitem(last=False). Careful with “if not self.d.get(key)”: it treats 0 as a miss. Use “in”.',
    solution: String.raw`from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return None
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)`,
    notes: 'Be ready to explain the classic hash map + doubly linked list version too (OrderedDict is exactly that under the hood), and what changes for thread-safety.',
  },

  limiter: {
    title: 'Token-bucket rate limiter',
    prompt: `<p>Implement <code>class RateLimiter</code> with <code>__init__(capacity, refill_per_sec, now=time.monotonic)</code>. <code>now()</code> returns seconds (injected so tests control time). <code>try_acquire(n=1)</code> returns <code>True</code> and consumes tokens if enough are available, otherwise <code>False</code>. The bucket starts full; tokens refill continuously and never exceed capacity.</p>
<p>Why this matters for open banking: banks throttle aggregators hard, so a per-bank limiter in front of outgoing calls is real code.</p>`,
    starter: String.raw`import time

class RateLimiter:
    def __init__(self, capacity, refill_per_sec, now=time.monotonic):
        pass

    def try_acquire(self, n=1):
        pass
`,
    tests: String.raw`def make(capacity, rate):
    clock = [0.0]
    limiter = RateLimiter(capacity, rate, now=lambda: clock[0])
    def advance(seconds):
        clock[0] += seconds
    return limiter, advance

@test('starts full')
def _():
    rl, _ = make(3, 1)
    eq([rl.try_acquire() for _ in range(4)], [True, True, True, False])

@test('refills over time')
def _():
    rl, advance = make(2, 1)
    rl.try_acquire(); rl.try_acquire()
    eq(rl.try_acquire(), False)
    advance(1)
    eq(rl.try_acquire(), True)
    eq(rl.try_acquire(), False)

@test('fractional refill accumulates')
def _():
    rl, advance = make(1, 1)
    rl.try_acquire()
    advance(0.5)
    eq(rl.try_acquire(), False)
    advance(0.5)
    eq(rl.try_acquire(), True)

@test('never exceeds capacity')
def _():
    rl, advance = make(2, 10)
    advance(60)
    eq([rl.try_acquire() for _ in range(3)], [True, True, False])

@test('acquire n')
def _():
    rl, _ = make(5, 1)
    eq(rl.try_acquire(5), True)
    eq(rl.try_acquire(1), False)

@test('a rejected acquire does not consume')
def _():
    rl, _ = make(3, 1)
    eq(rl.try_acquire(4), False)
    eq(rl.try_acquire(3), True)
`,
    hint: 'Do not use a timer. Refill lazily on every call: tokens = min(capacity, tokens + elapsed * rate).',
    solution: String.raw`import time

class RateLimiter:
    def __init__(self, capacity, refill_per_sec, now=time.monotonic):
        self.capacity = capacity
        self.rate = refill_per_sec
        self.now = now
        self.tokens = float(capacity)
        self.last = now()

    def _refill(self):
        t = self.now()
        self.tokens = min(self.capacity, self.tokens + (t - self.last) * self.rate)
        self.last = t

    def try_acquire(self, n=1):
        self._refill()
        if self.tokens >= n:
            self.tokens -= n
            return True
        return False`,
    notes: 'Follow-ups to be ready for: distributed limiting (Redis + a Lua script for atomicity), sliding window vs token bucket, fairness per tenant, returning Retry-After. Use time.monotonic, never time.time, for intervals.',
  },

  map_limit: {
    title: 'map_limit',
    prompt: `<p>Implement <code>async def map_limit(items, limit, fn)</code>. Call <code>await fn(item, index)</code> for every item with <b>at most <code>limit</code> running at once</b>. Return the results <b>in input order</b>. If any call raises, the exception propagates.</p>`,
    starter: String.raw`import asyncio

async def map_limit(items, limit, fn):
    pass
`,
    tests: String.raw`import asyncio

@test('results come back in input order')
async def _():
    async def job(ms, i):
        await asyncio.sleep(ms / 1000)
        return i
    eq(await map_limit([30, 10, 20], 2, job), [0, 1, 2])

@test('respects the limit')
async def _():
    running = peak = 0
    async def job(x, i):
        nonlocal running, peak
        running += 1
        peak = max(peak, running)
        await asyncio.sleep(0.005)
        running -= 1
    await map_limit([0] * 8, 3, job)
    eq(peak, 3)

@test('empty input')
async def _():
    async def job(x, i):
        return x
    eq(await map_limit([], 3, job), [])

@test('limit larger than the item count')
async def _():
    async def job(x, i):
        return x * 2
    eq(await map_limit([1, 2], 10, job), [2, 4])

@test('an exception propagates')
async def _():
    async def job(x, i):
        if x == 2:
            raise RuntimeError('boom')
        return x
    with raises(RuntimeError) as r:
        await map_limit([1, 2, 3], 2, job)
    eq(str(r.value), 'boom')
`,
    hint: 'asyncio.Semaphore(limit) as an async context manager around each call, then asyncio.gather the wrapped coroutines (gather keeps input order).',
    solution: String.raw`import asyncio

async def map_limit(items, limit, fn):
    sem = asyncio.Semaphore(limit)

    async def run(i, item):
        async with sem:
            return await fn(item, i)

    return await asyncio.gather(*(run(i, x) for i, x in enumerate(items)))`,
    notes: 'This creates one task per item, which is fine for thousands but not millions: for huge inputs start “limit” worker tasks that pull from an asyncio.Queue instead. asyncio.TaskGroup (3.11+) gives structured cancellation if one job fails.',
  },

  retry: {
    title: 'Retry with exponential backoff',
    prompt: `<p>Implement <code>async def retry(fn, *, retries=3, base_ms=100, sleep=default_sleep, should_retry=lambda e: True)</code>. Call <code>await fn(attempt)</code> (attempt starts at 0). On failure, if retries remain <b>and</b> <code>should_retry(error)</code>, wait <code>base_ms * 2**attempt</code> via the injected <code>await sleep(ms)</code>, then try again. After the last failure, re-raise the last error. (In production you would add jitter; leave it out so the test stays deterministic.)</p>`,
    starter: String.raw`import asyncio

async def default_sleep(ms):
    await asyncio.sleep(ms / 1000)

async def retry(fn, *, retries=3, base_ms=100, sleep=default_sleep, should_retry=lambda e: True):
    pass
`,
    tests: String.raw`async def no_sleep(ms):
    pass

@test('returns on first success')
async def _():
    async def ok(attempt):
        return 'ok'
    eq(await retry(ok, sleep=no_sleep), 'ok')

@test('retries then succeeds, with exponential backoff')
async def _():
    waits, calls = [], 0
    async def fake_sleep(ms):
        waits.append(ms)
    async def flaky(attempt):
        nonlocal calls
        calls += 1
        if calls < 3:
            raise RuntimeError('x')
        return 'ok'
    eq(await retry(flaky, retries=3, base_ms=100, sleep=fake_sleep), 'ok')
    eq(waits, [100, 200])

@test('raises the last error after exhausting retries')
async def _():
    n = 0
    async def always(attempt):
        nonlocal n
        n += 1
        raise RuntimeError(f'e{n - 1}')
    with raises(RuntimeError) as r:
        await retry(always, retries=2, base_ms=1, sleep=no_sleep)
    eq(str(r.value), 'e2')
    eq(n, 3)

@test('does not retry non-retryable errors')
async def _():
    n = 0
    async def bad(attempt):
        nonlocal n
        n += 1
        raise ValueError('4xx')
    with raises(ValueError):
        await retry(bad, retries=5, sleep=no_sleep, should_retry=lambda e: not isinstance(e, ValueError))
    eq(n, 1)

@test('passes the attempt number')
async def _():
    seen = []
    async def fn(attempt):
        seen.append(attempt)
        if attempt < 1:
            raise RuntimeError('x')
    await retry(fn, sleep=no_sleep)
    eq(seen, [0, 1])
`,
    hint: 'A loop over attempt numbers. In the except branch: re-raise if this was the last attempt or the error is not retryable; otherwise sleep and continue. A bare “raise” keeps the original traceback.',
    solution: String.raw`import asyncio

async def default_sleep(ms):
    await asyncio.sleep(ms / 1000)

async def retry(fn, *, retries=3, base_ms=100, sleep=default_sleep, should_retry=lambda e: True):
    attempt = 0
    while True:
        try:
            return await fn(attempt)
        except Exception as e:
            if attempt >= retries or not should_retry(e):
                raise
            await sleep(base_ms * 2 ** attempt)
            attempt += 1`,
    notes: 'Talking points: full jitter, a retry budget, honouring Retry-After, and only retrying idempotent operations (or those with idempotency keys). Catch Exception, never BaseException: you do not want to swallow cancellation.',
  },

  hash_ring: {
    title: 'Implement a hash ring',
    prompt: `<p>Implement <code>class HashRing</code> with <code>__init__(vnodes=50)</code>, <code>add_node(name)</code>, <code>remove_node(name)</code> and <code>get_node(key)</code> (returns <code>None</code> if the ring is empty). A simple hash function <code>fnv1a</code> is provided. Keep the ring points sorted and use <code>bisect</code> to find the owner.</p>`,
    starter: String.raw`import bisect

def fnv1a(text):  # 32-bit FNV-1a
    h = 2166136261
    for ch in text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h

class HashRing:
    def __init__(self, vnodes=50):
        pass

    def add_node(self, name):
        pass

    def remove_node(self, name):
        pass

    def get_node(self, key):
        pass
`,
    tests: String.raw`KEYS = [f'key-{i}' for i in range(2000)]

def ring_of(*names, vnodes=50):
    r = HashRing(vnodes)
    for n in names:
        r.add_node(n)
    return r

test('empty ring', lambda: eq(HashRing().get_node('x'), None))
test('a single node owns everything', lambda: eq({ring_of('A').get_node(k) for k in KEYS}, {'A'}))

@test('deterministic')
def _():
    r = ring_of('A', 'B', 'C')
    eq([r.get_node(k) for k in KEYS], [r.get_node(k) for k in KEYS])

@test('roughly balanced')
def _():
    r = ring_of('A', 'B', 'C', 'D', vnodes=100)
    counts = {}
    for k in KEYS:
        counts[r.get_node(k)] = counts.get(r.get_node(k), 0) + 1
    eq(len(counts), 4)
    assert min(counts.values()) > 2000 / 4 * 0.5, f'a node is badly underloaded: {counts}'

@test('adding a node moves few keys, and only to the new node')
def _():
    r = ring_of('A', 'B', 'C', 'D', vnodes=100)
    before = {k: r.get_node(k) for k in KEYS}
    r.add_node('E')
    moved = [k for k in KEYS if r.get_node(k) != before[k]]
    assert len(moved) < 2000 * 0.35, f'moved {len(moved)} keys'
    assert all(r.get_node(k) == 'E' for k in moved), 'keys may only move to the new node'

@test('removing a node only moves its own keys')
def _():
    r = ring_of('A', 'B', 'C', vnodes=100)
    before = {k: r.get_node(k) for k in KEYS}
    r.remove_node('B')
    for k in KEYS:
        if before[k] != 'B':
            eq(r.get_node(k), before[k])
        else:
            assert r.get_node(k) != 'B'
`,
    hint: 'Keep self.points as a sorted list of (hash, node) tuples. get_node: bisect_left for (fnv1a(key),), wrapping to index 0 when you run off the end. Virtual node i of a node hashes the string f"{name}#{i}".',
    solution: String.raw`import bisect

def fnv1a(text):  # 32-bit FNV-1a
    h = 2166136261
    for ch in text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h

class HashRing:
    def __init__(self, vnodes=50):
        self.vnodes = vnodes
        self.points = []  # sorted list of (hash, node)

    def add_node(self, name):
        for i in range(self.vnodes):
            bisect.insort(self.points, (fnv1a(f'{name}#{i}'), name))

    def remove_node(self, name):
        self.points = [p for p in self.points if p[1] != name]

    def get_node(self, key):
        if not self.points:
            return None
        i = bisect.bisect_left(self.points, (fnv1a(str(key)),))
        return self.points[i % len(self.points)][1]`,
    notes: 'Follow-ups: replication (the next N distinct nodes clockwise), weighted nodes (more vnodes), hot keys (consistent hashing balances keys, not load), and rendezvous hashing as an alternative. Plain FNV clusters similar strings; production rings use a better mixer (murmur3, xxhash).',
  },

  idempotent: {
    title: 'Idempotent handler wrapper',
    prompt: `<p>Implement <code>make_idempotent(handler)</code> returning an async function <code>call(key, payload)</code> (the handler is <code>async def handler(payload)</code>):</p>
<ul><li>The first call with a key runs the handler and caches the result.</li><li>A repeat with the same key and an <b>equal payload</b> returns the cached result without calling the handler again.</li><li>Same key but a different payload: raise <code>ValueError('key reused with different payload')</code>.</li><li>Concurrent duplicates (the first still running) must share the same in-flight work, so the handler runs once.</li><li>If the handler raises, do <b>not</b> cache the failure: a later retry with the same key may run again.</li></ul>`,
    starter: String.raw`import asyncio
import json

def make_idempotent(handler):
    async def call(key, payload):
        pass
    return call
`,
    tests: String.raw`import asyncio

@test('runs once for repeats')
async def _():
    n = 0
    async def handler(p):
        nonlocal n
        n += 1
        return {'id': n}
    call = make_idempotent(handler)
    a = await call('k', {'amt': 1})
    b = await call('k', {'amt': 1})
    eq(a, b)
    eq(n, 1)

@test('different keys run separately')
async def _():
    n = 0
    async def handler(p):
        nonlocal n
        n += 1
        return n
    call = make_idempotent(handler)
    await call('a', {})
    await call('b', {})
    eq(n, 2)

@test('same key, different payload is rejected')
async def _():
    async def handler(p):
        return 1
    call = make_idempotent(handler)
    await call('k', {'a': 1})
    with raises(ValueError) as r:
        await call('k', {'a': 2})
    eq(str(r.value), 'key reused with different payload')

@test('concurrent duplicates share the work')
async def _():
    n = 0
    async def handler(p):
        nonlocal n
        n += 1
        await asyncio.sleep(0.02)
        return 'done'
    call = make_idempotent(handler)
    results = await asyncio.gather(call('k', {}), call('k', {}), call('k', {}))
    eq(results, ['done', 'done', 'done'])
    eq(n, 1)

@test('a failure is not cached')
async def _():
    n = 0
    async def handler(p):
        nonlocal n
        n += 1
        if n == 1:
            raise RuntimeError('transient')
        return 'ok'
    call = make_idempotent(handler)
    with raises(RuntimeError):
        await call('k', {})
    eq(await call('k', {}), 'ok')
    eq(n, 2)
`,
    hint: 'Register the key synchronously BEFORE awaiting anything, so a concurrent caller sees it: store (fingerprint, task) with asyncio.ensure_future(handler(payload)). Fingerprint the payload with json.dumps(payload, sort_keys=True). On failure, pop the key.',
    solution: String.raw`import asyncio
import json

def make_idempotent(handler):
    seen = {}  # key -> (payload fingerprint, task)

    async def call(key, payload):
        fingerprint = json.dumps(payload, sort_keys=True)
        hit = seen.get(key)
        if hit is not None:
            if hit[0] != fingerprint:
                raise ValueError('key reused with different payload')
            return await hit[1]
        task = asyncio.ensure_future(handler(payload))
        seen[key] = (fingerprint, task)
        try:
            return await task
        except Exception:
            seen.pop(key, None)
            raise

    return call`,
    notes: 'Real implementations persist this in a database: a unique constraint on (customer, key), a status (in_progress / completed), a lock timeout for crashed workers, and a TTL (for example 24h). The in-memory version only works inside one process.',
  },

  breaker: {
    title: 'Circuit breaker',
    prompt: `<p>Implement <code>class CircuitBreaker</code> with <code>__init__(failure_threshold=3, cooldown=1.0, now=time.monotonic)</code> and <code>async def call(fn)</code> (<code>fn</code> is an async function with no arguments).</p>
<ul><li><b>Closed</b>: run <code>fn</code>. Count <b>consecutive</b> failures; a success resets the count. At <code>failure_threshold</code> failures → open.</li><li><b>Open</b>: raise <code>CircuitOpenError('circuit open')</code> immediately, without calling <code>fn</code>, until <code>cooldown</code> seconds have passed.</li><li>After the cooldown: <b>half-open</b>. Allow one trial call: success → closed, failure → open again (cooldown restarts).</li></ul>`,
    starter: String.raw`import time

class CircuitOpenError(Exception):
    pass

class CircuitBreaker:
    def __init__(self, failure_threshold=3, cooldown=1.0, now=time.monotonic):
        pass

    async def call(self, fn):
        pass
`,
    tests: String.raw`def make(threshold=2, cooldown=1.0):
    clock = [0.0]
    cb = CircuitBreaker(failure_threshold=threshold, cooldown=cooldown, now=lambda: clock[0])
    def advance(seconds):
        clock[0] += seconds
    return cb, advance

async def fail():
    raise RuntimeError('down')

async def succeed():
    return 'ok'

@test('passes success through')
async def _():
    cb, _ = make()
    eq(await cb.call(succeed), 'ok')

@test('opens after the threshold and stops calling')
async def _():
    cb, _ = make(2)
    for _ in range(2):
        with raises(RuntimeError):
            await cb.call(fail)
    called = False
    async def probe():
        nonlocal called
        called = True
    with raises(CircuitOpenError) as r:
        await cb.call(probe)
    eq(str(r.value), 'circuit open')
    eq(called, False)

@test('a success resets the failure count')
async def _():
    cb, _ = make(2)
    with raises(RuntimeError):
        await cb.call(fail)
    await cb.call(succeed)
    with raises(RuntimeError):
        await cb.call(fail)
    eq(await cb.call(succeed), 'ok')

@test('half-open success closes the breaker')
async def _():
    cb, advance = make(1, 1.0)
    with raises(RuntimeError):
        await cb.call(fail)
    advance(1.0)
    eq(await cb.call(succeed), 'ok')
    eq(await cb.call(succeed), 'ok')

@test('half-open failure re-opens it, restarting the cooldown')
async def _():
    cb, advance = make(1, 1.0)
    with raises(RuntimeError):
        await cb.call(fail)
    advance(1.0)
    with raises(RuntimeError):
        await cb.call(fail)
    with raises(CircuitOpenError):
        await cb.call(succeed)
    advance(1.0)
    eq(await cb.call(succeed), 'ok')

@test('stays open before the cooldown ends')
async def _():
    cb, advance = make(1, 1.0)
    with raises(RuntimeError):
        await cb.call(fail)
    advance(0.999)
    with raises(CircuitOpenError):
        await cb.call(succeed)
`,
    hint: 'Track a state ("closed" / "open" / "half"), the consecutive failure count, and the time it opened. In call(): if open and the cooldown has passed, move to half. In half-open, a failure opens the breaker immediately. Catch Exception, record, then re-raise.',
    solution: String.raw`import time

class CircuitOpenError(Exception):
    pass

class CircuitBreaker:
    def __init__(self, failure_threshold=3, cooldown=1.0, now=time.monotonic):
        self.failure_threshold = failure_threshold
        self.cooldown = cooldown
        self.now = now
        self.state = 'closed'
        self.failures = 0
        self.opened_at = 0.0

    async def call(self, fn):
        if self.state == 'open':
            if self.now() - self.opened_at < self.cooldown:
                raise CircuitOpenError('circuit open')
            self.state = 'half'
        try:
            result = await fn()
        except Exception:
            self.failures += 1
            if self.state == 'half' or self.failures >= self.failure_threshold:
                self.state = 'open'
                self.opened_at = self.now()
            raise
        self.state = 'closed'
        self.failures = 0
        return result`,
    notes: 'Production breakers add: a single probe in half-open (limit concurrency), failure-rate windows instead of consecutive counts, slow-call thresholds, per-dependency instances (per bank!), and metrics on state changes.',
  },

  cosine: {
    title: 'Cosine similarity & top-k retrieval',
    prompt: `<p>Implement <code>cosine(a, b)</code> (return <code>0.0</code> if either vector has zero length) and <code>top_k_docs(query_vec, docs, k)</code> where each doc is a dict <code>{'id', 'vec'}</code>. Return the ids of the <code>k</code> most similar docs, best first.</p>`,
    starter: String.raw`import math

def cosine(a, b):
    pass

def top_k_docs(query_vec, docs, k):
    pass
`,
    tests: String.raw`test('identical vectors = 1', lambda: eq(close(cosine([1, 2, 3], [1, 2, 3]), 1), True))
test('orthogonal = 0', lambda: eq(close(cosine([1, 0], [0, 1]), 0), True))
test('opposite = -1', lambda: eq(close(cosine([1, 1], [-1, -1]), -1), True))
test('scale invariant', lambda: eq(close(cosine([1, 2], [10, 20]), 1), True))
test('zero vector is 0, not an error', lambda: eq(cosine([0, 0], [1, 2]), 0))

@test('top_k_docs order')
def _():
    docs = [{'id': 'a', 'vec': [0, 1]}, {'id': 'b', 'vec': [1, 0.1]}, {'id': 'c', 'vec': [1, 1]}]
    eq(top_k_docs([1, 0], docs, 2), ['b', 'c'])

test('k larger than the corpus', lambda: eq(top_k_docs([1, 0], [{'id': 'a', 'vec': [1, 0]}], 5), ['a']))
`,
    hint: 'dot / (|a| * |b|) with math.sqrt, guarding the zero case. Then sort the docs by similarity, descending, and slice k. (At scale: approximate nearest-neighbour indexes such as HNSW.)',
    solution: String.raw`import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)

def top_k_docs(query_vec, docs, k):
    ranked = sorted(docs, key=lambda d: cosine(query_vec, d['vec']), reverse=True)
    return [d['id'] for d in ranked[:k]]`,
    notes: 'In production you would use numpy and normalise vectors once so similarity becomes a dot product. For millions of vectors use an ANN index (HNSW, IVF) rather than a full scan.',
  },

  chunk_text: {
    title: 'Chunk text with overlap',
    prompt: `<p>Implement <code>chunk_text(text, size, overlap)</code> returning chunks of at most <code>size</code> characters, where each chunk starts <code>size - overlap</code> characters after the previous one. Stop once a chunk reaches the end of the text. Raise <code>ValueError</code> if <code>overlap &gt;= size</code>.</p>`,
    starter: String.raw`def chunk_text(text, size, overlap):
    pass
`,
    tests: String.raw`test('no overlap', lambda: eq(chunk_text('abcdefgh', 4, 0), ['abcd', 'efgh']))
test('overlap', lambda: eq(chunk_text('abcdefgh', 4, 2), ['abcd', 'cdef', 'efgh']))
test('short text', lambda: eq(chunk_text('abc', 10, 2), ['abc']))
test('empty text', lambda: eq(chunk_text('', 4, 1), []))
test('remainder', lambda: eq(chunk_text('abcdefg', 4, 1), ['abcd', 'defg']))

@test('invalid overlap raises ValueError')
def _():
    with raises(ValueError):
        chunk_text('abc', 2, 2)
`,
    hint: 'step = size - overlap. Walk i in steps, take text[i:i + size], and stop as soon as i + size >= len(text).',
    solution: String.raw`def chunk_text(text, size, overlap):
    if overlap >= size:
        raise ValueError('overlap must be smaller than size')
    step = size - overlap
    chunks = []
    for i in range(0, len(text), step):
        chunks.append(text[i:i + size])
        if i + size >= len(text):
            break
    return chunks`,
    notes: 'In practice split on semantic boundaries (headings, paragraphs) first, keep metadata (source, section) with each chunk, and test the chunk size against your retrieval evals rather than guessing.',
  },

  tool_guard: {
    title: 'Guard a tool call',
    prompt: `<p>Implement <code>validate_tool_call(call, registry)</code>. <code>call</code> is a dict <code>{'tool', 'args'}</code> coming from a model; <code>registry</code> maps tool names to <code>{'args': {name: 'string' | 'number'}, 'max_amount': optional}</code>. Return <code>{'ok': True}</code> if the tool exists, the args have <b>exactly</b> the declared keys with the declared types, and, if <code>max_amount</code> is set, <code>args['amount']</code> is a finite number between 0 (exclusive) and <code>max_amount</code> (inclusive). Otherwise return <code>{'ok': False, 'reason': '...'}</code> with any non-empty reason. Never raise: the input is untrusted.</p>`,
    starter: String.raw`def validate_tool_call(call, registry):
    pass
`,
    tests: String.raw`REG = {
    'get_balance': {'args': {'account_id': 'string'}},
    'pay': {'args': {'to': 'string', 'amount': 'number'}, 'max_amount': 100},
}

def ok(call):
    return validate_tool_call(call, REG)['ok']

test('valid read', lambda: eq(ok({'tool': 'get_balance', 'args': {'account_id': 'a1'}}), True))
test('valid payment', lambda: eq(ok({'tool': 'pay', 'args': {'to': 'x', 'amount': 50}}), True))
test('unknown tool', lambda: eq(ok({'tool': 'drop_db', 'args': {}}), False))
test('tool name that is not a string', lambda: eq(ok({'tool': ['pay'], 'args': {}}), False))
test('extra argument rejected', lambda: eq(ok({'tool': 'get_balance', 'args': {'account_id': 'a', 'admin': True}}), False))
test('missing argument rejected', lambda: eq(ok({'tool': 'pay', 'args': {'to': 'x'}}), False))
test('wrong type rejected', lambda: eq(ok({'tool': 'pay', 'args': {'to': 'x', 'amount': '50'}}), False))
test('bool is not a number', lambda: eq(ok({'tool': 'pay', 'args': {'to': 'x', 'amount': True}}), False))
test('over the maximum rejected', lambda: eq(ok({'tool': 'pay', 'args': {'to': 'x', 'amount': 101}}), False))

@test('zero, negative, NaN and infinity rejected')
def _():
    for amount in (0, -5, float('nan'), float('inf')):
        eq(ok({'tool': 'pay', 'args': {'to': 'x', 'amount': amount}}), False, repr(amount))

test('null args rejected', lambda: eq(ok({'tool': 'pay', 'args': None}), False))
test('a reason is provided', lambda: assert_reason())

def assert_reason():
    r = validate_tool_call({'tool': 'nope', 'args': {}}, REG)
    assert isinstance(r.get('reason'), str) and r['reason'], 'expected a non-empty reason'
`,
    hint: 'Check isinstance(tool, str) before using it as a dict key (a list would raise TypeError). bool is a subclass of int in Python, so exclude it explicitly. math.isfinite handles NaN and infinity.',
    solution: String.raw`import math

def validate_tool_call(call, registry):
    def no(reason):
        return {'ok': False, 'reason': reason}

    tool = call.get('tool') if isinstance(call, dict) else None
    if not isinstance(tool, str) or tool not in registry:
        return no('unknown tool')
    spec, args = registry[tool], call.get('args')
    if not isinstance(args, dict):
        return no('args must be an object')
    if set(args) != set(spec['args']):
        return no('args must be exactly: ' + ', '.join(sorted(spec['args'])))
    for name, kind in spec['args'].items():
        v = args[name]
        if kind == 'string' and not isinstance(v, str):
            return no(f'{name} must be a string')
        if kind == 'number' and (isinstance(v, bool) or not isinstance(v, (int, float))):
            return no(f'{name} must be a number')
    if 'max_amount' in spec:
        amount = args.get('amount')
        if not math.isfinite(amount) or amount <= 0 or amount > spec['max_amount']:
            return no('amount out of range')
    return {'ok': True}`,
    notes: 'Real systems also check authorisation (can THIS user act on THIS account?), rate limits, and require human confirmation for money movement. Pydantic or JSON Schema do the shape checks for you; the point is that you validate on the server, not trust the model.',
  },

  discount: {
    title: 'Fix the AI-written discount function',
    prompt: `<p>This was generated for “apply a percentage discount to a price in cents”. Make it correct: result as an <b>int</b> of cents rounded <b>half up</b>, reject percentages outside 0–100 (and NaN), reject prices that are not non-negative ints. Example: <code>apply_discount(1999, 15)</code> → <code>1699</code> (1999 × 0.85 = 1699.15 → 1699). Careful: Python's built-in <code>round()</code> uses banker's rounding.</p>`,
    starter: String.raw`def apply_discount(price_cents, percent):
    return price_cents - price_cents * (percent / 100)
`,
    tests: String.raw`test('basic', lambda: eq(apply_discount(1999, 15), 1699))
test('the result is an int', lambda: eq(type(apply_discount(999, 33)), int))
test('half rounds up', lambda: eq(apply_discount(105, 50), 53))

@test('0% and 100%')
def _():
    eq(apply_discount(500, 0), 500)
    eq(apply_discount(500, 100), 0)

@test('invalid percent raises ValueError')
def _():
    for bad in (-1, 101, float('nan')):
        with raises(ValueError):
            apply_discount(100, bad)

@test('invalid price raises ValueError')
def _():
    for bad in (10.5, -1):
        with raises(ValueError):
            apply_discount(bad, 10)
`,
    hint: 'Use decimal.Decimal and quantize(Decimal(1), rounding=ROUND_HALF_UP). Build the Decimal from str(percent) so 33.5 does not carry binary-float noise.',
    solution: String.raw`import math
from decimal import Decimal, ROUND_HALF_UP

def apply_discount(price_cents, percent):
    if not isinstance(price_cents, int) or isinstance(price_cents, bool) or price_cents < 0:
        raise ValueError('price must be a non-negative integer number of cents')
    if not isinstance(percent, (int, float)) or not math.isfinite(percent) or not 0 <= percent <= 100:
        raise ValueError('percent must be between 0 and 100')
    result = Decimal(price_cents) * (100 - Decimal(str(percent))) / 100
    return int(result.quantize(Decimal(1), rounding=ROUND_HALF_UP))`,
    notes: 'round(52.5) is 52 in Python (round-half-to-even), which is a classic money bug. Use Decimal with an explicit rounding mode, or integer arithmetic, and agree the rule with finance.',
  },

  iban: {
    title: 'IBAN validation (mod 97)',
    prompt: `<p>Implement <code>is_valid_iban(iban)</code>. Steps: remove spaces and uppercase; the format is <code>2 letters + 2 digits + 11–30 alphanumerics</code>; check the country length for <code>NO</code>=15, <code>DE</code>=22, <code>SE</code>=24, <code>DK</code>=18, <code>FI</code>=18, <code>GB</code>=22 (other countries: skip the length check); move the first 4 characters to the end; replace letters with numbers (A=10 … Z=35); the resulting big number mod 97 must equal 1. (Python ints have arbitrary precision, so no overflow tricks needed. In many languages you would compute the remainder piecewise.) Return <code>False</code> for anything that is not a string.</p>`,
    starter: String.raw`def is_valid_iban(iban):
    pass
`,
    tests: String.raw`test('valid NO', lambda: eq(is_valid_iban('NO93 8601 1117 947'), True))
test('valid GB', lambda: eq(is_valid_iban('GB82 WEST 1234 5698 7654 32'), True))
test('valid DE, lowercase', lambda: eq(is_valid_iban('de89370400440532013000'), True))
test('bad checksum', lambda: eq(is_valid_iban('NO94 8601 1117 947'), False))
test('wrong length for the country', lambda: eq(is_valid_iban('NO93 8601 1117 9470'), False))

@test('garbage')
def _():
    for bad in ('', 'hello', 'NO93-8601-1117-947'):
        eq(is_valid_iban(bad), False, repr(bad))

@test('non-strings')
def _():
    for bad in (None, 12345):
        eq(is_valid_iban(bad), False, repr(bad))
`,
    hint: 'int(ch, 36) turns "0"-"9" and "A"-"Z" into 0–35, which is exactly the IBAN letter mapping. Join them into one string and take int(...) % 97. Use re.fullmatch with [0-9] (the \\d class also matches non-ASCII digits).',
    solution: String.raw`import re

LENGTHS = {'NO': 15, 'DE': 22, 'SE': 24, 'DK': 18, 'FI': 18, 'GB': 22}

def is_valid_iban(iban):
    if not isinstance(iban, str):
        return False
    s = iban.replace(' ', '').upper()
    if not re.fullmatch(r'[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}', s):
        return False
    if LENGTHS.get(s[:2], len(s)) != len(s):
        return False
    rearranged = s[4:] + s[:4]
    digits = ''.join(str(int(ch, 36)) for ch in rearranged)
    return int(digits) % 97 == 1`,
    notes: 'Validating the checksum proves the IBAN is well-formed, not that the account exists or belongs to the person. That is what an account-verification endpoint is for.',
  },

  split_amount: {
    title: 'Split money without losing a cent',
    prompt: `<p>Implement <code>split_amount(total_minor, weights)</code> returning int parts proportional to <code>weights</code> that <b>sum exactly to total_minor</b>. Use the largest-remainder method: floor each share, then give the leftover units one by one to the shares with the largest fractional remainders (ties: lower index first). Raise <code>ValueError</code> for empty, negative or all-zero weights.</p>`,
    starter: String.raw`def split_amount(total_minor, weights):
    pass
`,
    tests: String.raw`test('even thirds', lambda: eq(split_amount(100, [1, 1, 1]), [34, 33, 33]))
test('exact halves', lambda: eq(split_amount(10, [1, 1]), [5, 5]))
test('one cent over three', lambda: eq(split_amount(1, [1, 1, 1]), [1, 0, 0]))
test('the biggest fraction gets the leftover', lambda: eq(split_amount(101, [70, 30]), [71, 30]))
test('zero total', lambda: eq(split_amount(0, [1, 2]), [0, 0]))

@test('always sums to the total')
def _():
    for total in (0, 1, 7, 99, 1000, 12345):
        for weights in ([1], [1, 2, 3], [5] * 7, [0.3, 0.3, 0.4]):
            eq(sum(split_amount(total, weights)), total, f'{total} {weights}')

@test('invalid weights raise ValueError')
def _():
    for bad in ([], [0, 0], [-1, 2]):
        with raises(ValueError):
            split_amount(10, bad)
`,
    hint: 'Use fractions.Fraction so the shares are exact: Fraction(total) * Fraction(w) / Fraction(sum). int() floors a non-negative Fraction. Then sort indexes by (-remainder, index) and add 1 to the first `leftover` of them.',
    solution: String.raw`from fractions import Fraction

def split_amount(total_minor, weights):
    if not weights or any(w < 0 for w in weights) or sum(weights) <= 0:
        raise ValueError('invalid weights')
    ws = [Fraction(w) for w in weights]
    total_weight = sum(ws)
    exact = [Fraction(total_minor) * w / total_weight for w in ws]
    parts = [int(x) for x in exact]
    leftover = total_minor - sum(parts)
    order = sorted(range(len(parts)), key=lambda i: (-(exact[i] - parts[i]), i))
    for k in range(leftover):
        parts[order[k % len(parts)]] += 1
    return parts`,
    notes: 'Money is integer minor units plus a currency code. Keep the allocation rule in the spec (for example fees go to the platform) and always test the invariant “parts sum to the total”.',
  },

  payment_status: {
    title: 'Merge payment status updates safely',
    prompt: `<p>Implement <code>apply_status(current, incoming)</code> returning the new status, with these simplified rules (ranks: RCVD 0, PDNG 1, ACTC 2, ACCP 3, ACSP 4, ACSC 5, ACCC 6):</p>
<ul><li>If <code>current</code> is terminal (<code>ACCC</code>, <code>RJCT</code>, <code>CANC</code>) → unchanged.</li><li><code>RJCT</code> is accepted unless current rank ≥ 5 (already settled).</li><li><code>CANC</code> is accepted only if current rank ≤ 2.</li><li>Otherwise move forward only: accept <code>incoming</code> if its rank is higher (skipping is fine); ignore same or lower rank (stale or duplicate).</li><li>Unknown status → raise <code>ValueError('unknown status')</code>.</li></ul>`,
    starter: String.raw`def apply_status(current, incoming):
    pass
`,
    tests: String.raw`test('forward', lambda: eq(apply_status('RCVD', 'ACTC'), 'ACTC'))
test('skipping is allowed', lambda: eq(apply_status('PDNG', 'ACSC'), 'ACSC'))
test('duplicate ignored', lambda: eq(apply_status('ACSP', 'ACSP'), 'ACSP'))
test('stale update ignored', lambda: eq(apply_status('ACSC', 'PDNG'), 'ACSC'))

@test('terminal states stick')
def _():
    eq(apply_status('ACCC', 'RJCT'), 'ACCC')
    eq(apply_status('RJCT', 'ACSP'), 'RJCT')
    eq(apply_status('CANC', 'ACTC'), 'CANC')

@test('reject early and mid-flight')
def _():
    eq(apply_status('RCVD', 'RJCT'), 'RJCT')
    eq(apply_status('ACSP', 'RJCT'), 'RJCT')

test('reject after settlement is refused', lambda: eq(apply_status('ACSC', 'RJCT'), 'ACSC'))

@test('cancel only early')
def _():
    eq(apply_status('PDNG', 'CANC'), 'CANC')
    eq(apply_status('ACCP', 'CANC'), 'ACCP')

@test('unknown statuses raise ValueError')
def _():
    for current, incoming in (('RCVD', 'WAT'), ('NOPE', 'ACTC')):
        with raises(ValueError):
            apply_status(current, incoming)
`,
    hint: 'A RANK dict and a TERMINAL set. Handle RJCT and CANC before the generic “higher rank wins” comparison.',
    solution: String.raw`RANK = {'RCVD': 0, 'PDNG': 1, 'ACTC': 2, 'ACCP': 3, 'ACSP': 4, 'ACSC': 5, 'ACCC': 6}
TERMINAL = {'ACCC', 'RJCT', 'CANC'}

def apply_status(current, incoming):
    known = set(RANK) | {'RJCT', 'CANC'}
    if current not in known or incoming not in known:
        raise ValueError('unknown status')
    if current in TERMINAL:
        return current
    if incoming == 'RJCT':
        return current if RANK[current] >= 5 else 'RJCT'
    if incoming == 'CANC':
        return 'CANC' if RANK[current] <= 2 else current
    return incoming if RANK[incoming] > RANK[current] else current`,
    notes: 'The design principle: status handling must be idempotent and monotonic, so replays, retries and out-of-order webhooks converge to the same state. Store the raw bank statuses too, for audit and debugging.',
  },

  normalize: {
    title: 'Normalise two banks’ transactions',
    prompt: `<p>Implement <code>normalize(bank, raw)</code> returning <code>{'id', 'date', 'amount_minor', 'currency', 'description', 'counterparty'}</code> where <code>date</code> is <code>YYYY-MM-DD</code> and <code>amount_minor</code> is a signed <b>int</b> of minor units (2 decimals assumed). Two formats:</p>
<pre><code>bank 'A' (Berlin-Group-like):
  {'transactionId', 'bookingDate': '2024-03-01', 'transactionAmount': {'amount': '-12.50', 'currency': 'EUR'},
   'creditorName', 'remittanceInformationUnstructured'}
bank 'B':
  {'id', 'date': '01.03.2024', 'amountMinor': -1250, 'ccy': 'NOK', 'text', 'counterparty'}</code></pre>
<p>Parse A’s decimal <b>string</b> exactly (never via float): <code>'-0.10'</code> must give <code>-10</code>, <code>'7'</code> gives <code>700</code>, <code>'1.5'</code> gives <code>150</code>. Missing optional text fields become <code>''</code>. Unknown bank → <code>ValueError</code>.</p>`,
    starter: String.raw`def normalize(bank, raw):
    pass
`,
    tests: String.raw`A = {'transactionId': 'a1', 'bookingDate': '2024-03-01', 'transactionAmount': {'amount': '-12.50', 'currency': 'EUR'},
     'creditorName': 'Shop', 'remittanceInformationUnstructured': 'Groceries'}
B = {'id': 'b1', 'date': '01.03.2024', 'amountMinor': -1250, 'ccy': 'NOK', 'text': 'Coffee', 'counterparty': 'Cafe'}

test('bank A', lambda: eq(normalize('A', A), {'id': 'a1', 'date': '2024-03-01', 'amount_minor': -1250, 'currency': 'EUR', 'description': 'Groceries', 'counterparty': 'Shop'}))
test('bank B', lambda: eq(normalize('B', B), {'id': 'b1', 'date': '2024-03-01', 'amount_minor': -1250, 'currency': 'NOK', 'description': 'Coffee', 'counterparty': 'Cafe'}))

@test('decimal strings are parsed exactly')
def _():
    def minor(amount):
        return normalize('A', {**A, 'transactionAmount': {'amount': amount, 'currency': 'EUR'}})['amount_minor']
    for text, expected in (('-0.10', -10), ('7', 700), ('1.5', 150), ('0.07', 7), ('+3.00', 300), ('19.99', 1999)):
        eq(minor(text), expected, text)

@test('missing optional fields become empty strings')
def _():
    sparse = {k: v for k, v in A.items() if k not in ('creditorName', 'remittanceInformationUnstructured')}
    n = normalize('A', sparse)
    eq(n['description'], '')
    eq(n['counterparty'], '')

test('amount_minor is an int', lambda: eq(type(normalize('A', A)['amount_minor']), int))

@test('unknown bank raises ValueError')
def _():
    with raises(ValueError):
        normalize('Z', A)
`,
    hint: 'decimal.Decimal(text) * 100 is exact. Check that it is a whole number before int(...) so extra decimals fail loudly instead of truncating. dict.get(key, "") handles missing fields.',
    solution: String.raw`from decimal import Decimal

def parse_minor(text):
    value = Decimal(text.strip()) * 100
    if value != value.to_integral_value():
        raise ValueError('more than 2 decimals: ' + text)
    return int(value)

def normalize(bank, raw):
    if bank == 'A':
        amount = raw['transactionAmount']
        return {
            'id': raw['transactionId'],
            'date': raw['bookingDate'],
            'amount_minor': parse_minor(amount['amount']),
            'currency': amount['currency'],
            'description': raw.get('remittanceInformationUnstructured', ''),
            'counterparty': raw.get('creditorName', ''),
        }
    if bank == 'B':
        day, month, year = raw['date'].split('.')
        return {
            'id': raw['id'],
            'date': f'{year}-{month}-{day}',
            'amount_minor': raw['amountMinor'],
            'currency': raw['ccy'],
            'description': raw.get('text', ''),
            'counterparty': raw.get('counterparty', ''),
        }
    raise ValueError('unknown bank: ' + str(bank))`,
    notes: 'Real mapping also handles debtor vs creditor naming by sign, booked vs pending, value date vs booking date, timezones, duplicates across pages, and banks that omit stable ids (derive a deterministic hash). Keep the raw payload next to the normalised one.',
  },

  replicas: {
    title: 'Autoscaling calculation',
    prompt: `<p>A Kafka consumer group must drain its backlog. Implement <code>desired_replicas(lag, rate_per_consumer, drain_seconds, partitions, min_replicas=1)</code>: the number of consumers needed to clear <code>lag</code> messages in <code>drain_seconds</code> if each processes <code>rate_per_consumer</code> messages per second, rounded <b>up</b>, never below <code>min_replicas</code>, and never above <code>partitions</code> (extra consumers would sit idle).</p>`,
    starter: String.raw`def desired_replicas(lag, rate_per_consumer, drain_seconds, partitions, min_replicas=1):
    pass
`,
    tests: String.raw`test('rounds up', lambda: eq(desired_replicas(100000, 500, 60, 12), 4))
test('capped at the partition count', lambda: eq(desired_replicas(100000, 500, 60, 3), 3))
test('the minimum applies when there is no lag', lambda: eq(desired_replicas(0, 500, 60, 12), 1))
test('custom minimum', lambda: eq(desired_replicas(10, 500, 60, 12, min_replicas=2), 2))
test('an exact fit does not over-provision', lambda: eq(desired_replicas(60000, 500, 60, 12), 2))
test('the minimum cannot exceed the partitions', lambda: eq(desired_replicas(0, 1, 1, 2, min_replicas=5), 2))
`,
    hint: 'need = math.ceil(lag / (rate * drain)). Then clamp: max with the minimum first, min with the partition count last.',
    solution: String.raw`import math

def desired_replicas(lag, rate_per_consumer, drain_seconds, partitions, min_replicas=1):
    needed = math.ceil(lag / (rate_per_consumer * drain_seconds))
    return min(partitions, max(min_replicas, needed))`,
    notes: 'The cap by partitions is the key insight: in Kafka, parallelism within a group is bounded by the partition count, so plan partitions for peak parallelism up front (increasing them later breaks key ordering).',
  },

  partition_for: {
    title: 'Keyed partitioner',
    prompt: `<p>Implement <code>partition_for(key, num_partitions)</code> using the provided <code>fnv1a</code>: deterministic, always in <code>[0, num_partitions)</code>, and raising <code>ValueError</code> if <code>num_partitions</code> is not a positive int.</p>`,
    starter: String.raw`def fnv1a(text):  # 32-bit FNV-1a
    h = 2166136261
    for ch in text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h

def partition_for(key, num_partitions):
    pass
`,
    tests: String.raw`@test('always in range')
def _():
    for i in range(500):
        p = partition_for(f'k{i}', 7)
        assert isinstance(p, int) and 0 <= p < 7, f'out of range: {p!r}'

test('deterministic', lambda: eq(partition_for('payment-42', 12), partition_for('payment-42', 12)))

@test('spreads keys')
def _():
    used = {partition_for(f'k{i}', 8) for i in range(200)}
    assert len(used) >= 6, f'only {len(used)} partitions used'

test('single partition', lambda: eq(partition_for('x', 1), 0))

@test('invalid counts raise ValueError')
def _():
    for bad in (0, -3, 2.5, True):
        with raises(ValueError):
            partition_for('x', bad)
`,
    hint: 'Validate first (bool is an int subclass, so rule it out), then fnv1a(str(key)) % num_partitions. Python’s % is already non-negative for a positive modulus.',
    solution: String.raw`def fnv1a(text):  # 32-bit FNV-1a
    h = 2166136261
    for ch in text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h

def partition_for(key, num_partitions):
    if not isinstance(num_partitions, int) or isinstance(num_partitions, bool) or num_partitions <= 0:
        raise ValueError('num_partitions must be a positive integer')
    return fnv1a(str(key)) % num_partitions`,
    notes: 'Kafka’s default partitioner uses murmur2 on the key bytes. Never use Python’s built-in hash() for this: string hashing is randomised per process (PYTHONHASHSEED), so different producers would disagree. Follow-up: what happens to ordering if you increase the partition count?',
  },

  assign_range: {
    title: 'Range assignment for a consumer group',
    prompt: `<p>Implement <code>assign_range(num_partitions, consumers)</code> mimicking Kafka’s range assignor for a single topic. Sort the consumer ids; each gets <code>n // c</code> <b>contiguous</b> partitions, and the first <code>n % c</code> consumers get one extra. Return a dict <code>{consumer_id: [partitions]}</code> including consumers with an empty list. No consumers → <code>{}</code>. Do not mutate the input list.</p>`,
    starter: String.raw`def assign_range(num_partitions, consumers):
    pass
`,
    tests: String.raw`test('even', lambda: eq(assign_range(6, ['b', 'a']), {'a': [0, 1, 2], 'b': [3, 4, 5]}))
test('the remainder goes to the first consumers', lambda: eq(assign_range(7, ['a', 'b', 'c']), {'a': [0, 1, 2], 'b': [3, 4], 'c': [5, 6]}))
test('more consumers than partitions', lambda: eq(assign_range(2, ['a', 'b', 'c']), {'a': [0], 'b': [1], 'c': []}))
test('no consumers', lambda: eq(assign_range(4, []), {}))

@test('every partition is assigned exactly once')
def _():
    r = assign_range(13, ['x', 'y', 'z', 'w'])
    eq(sorted(p for ps in r.values() for p in ps), list(range(13)))

@test('does not mutate the input')
def _():
    consumers = ['b', 'a']
    assign_range(4, consumers)
    eq(consumers, ['b', 'a'])
`,
    hint: 'divmod(num_partitions, len(consumers)) gives the base size and the remainder. Walk the sorted consumers with a running start offset.',
    solution: String.raw`def assign_range(num_partitions, consumers):
    ordered = sorted(consumers)
    if not ordered:
        return {}
    base, extra = divmod(num_partitions, len(ordered))
    out, start = {}, 0
    for i, consumer in enumerate(ordered):
        count = base + (1 if i < extra else 0)
        out[consumer] = list(range(start, start + count))
        start += count
    return out`,
    notes: 'Compare with round-robin (spreads evenly across topics), sticky (minimises movement on a rebalance) and cooperative-sticky (incremental rebalance without stopping the world).',
  },

  iam: {
    title: 'Evaluate IAM-style policies',
    prompt: `<p>Implement <code>evaluate(statements, action, resource)</code> returning <code>'ALLOW'</code> or <code>'DENY'</code>. Each statement is a dict <code>{'effect': 'Allow' | 'Deny', 'actions': [...], 'resources': [...]}</code>. Patterns may contain <code>*</code> (matches any characters, including none; every other character is literal). Rules: if any matching <b>Deny</b> exists → DENY; else if any matching <b>Allow</b> exists → ALLOW; else DENY (implicit). A statement matches only if <b>both</b> an action pattern and a resource pattern match. Actions compare case-insensitively; resources are case-sensitive.</p>`,
    starter: String.raw`def evaluate(statements, action, resource):
    pass
`,
    tests: String.raw`S = [
    {'effect': 'Allow', 'actions': ['s3:GetObject', 's3:ListBucket'], 'resources': ['arn:aws:s3:::reports/*', 'arn:aws:s3:::reports']},
    {'effect': 'Deny', 'actions': ['s3:*'], 'resources': ['arn:aws:s3:::reports/secret/*']},
]

test('allowed read', lambda: eq(evaluate(S, 's3:GetObject', 'arn:aws:s3:::reports/q1.csv'), 'ALLOW'))
test('an explicit deny beats an allow', lambda: eq(evaluate(S, 's3:GetObject', 'arn:aws:s3:::reports/secret/keys.txt'), 'DENY'))
test('implicit deny', lambda: eq(evaluate(S, 's3:PutObject', 'arn:aws:s3:::reports/q1.csv'), 'DENY'))
test('other resource denied', lambda: eq(evaluate(S, 's3:GetObject', 'arn:aws:s3:::other/x'), 'DENY'))
test('actions are case-insensitive', lambda: eq(evaluate(S, 'S3:getobject', 'arn:aws:s3:::reports/a'), 'ALLOW'))
test('resources are case-sensitive', lambda: eq(evaluate(S, 's3:GetObject', 'arn:aws:s3:::REPORTS/a'), 'DENY'))

@test('regex characters in patterns are literal')
def _():
    policy = [{'effect': 'Allow', 'actions': ['a:b'], 'resources': ['x.y+(z)']}]
    eq(evaluate(policy, 'a:b', 'xzy+(z)'), 'DENY')
    eq(evaluate(policy, 'a:b', 'x.y+(z)'), 'ALLOW')

test('star matches everything', lambda: eq(evaluate([{'effect': 'Allow', 'actions': ['*'], 'resources': ['*']}], 'any:thing', 'whatever'), 'ALLOW'))
test('an empty policy denies', lambda: eq(evaluate([], 'a:b', 'c'), 'DENY'))

@test('a statement needs both the action and the resource to match')
def _():
    policy = [
        {'effect': 'Deny', 'actions': ['s3:Delete*'], 'resources': ['arn:aws:s3:::reports/*']},
        {'effect': 'Allow', 'actions': ['s3:*'], 'resources': ['*']},
    ]
    eq(evaluate(policy, 's3:GetObject', 'arn:aws:s3:::reports/a'), 'ALLOW')
`,
    hint: 'Turn a pattern into a regex: split on "*", re.escape each piece, join with ".*", and use re.fullmatch (with re.IGNORECASE for actions). fnmatch is tempting but treats [] and ? as special.',
    solution: String.raw`import re

def glob(pattern, ignore_case=False):
    regex = '.*'.join(re.escape(part) for part in pattern.split('*'))
    return re.compile(regex, re.IGNORECASE if ignore_case else 0)

def evaluate(statements, action, resource):
    def matches(s):
        return (any(glob(a, True).fullmatch(action) for a in s['actions'])
                and any(glob(r).fullmatch(resource) for r in s['resources']))

    hits = [s for s in statements if matches(s)]
    if any(s['effect'] == 'Deny' for s in hits):
        return 'DENY'
    return 'ALLOW' if any(s['effect'] == 'Allow' for s in hits) else 'DENY'`,
    notes: 'Real IAM also has principals, conditions, permission boundaries, SCPs and session policies. All layers must allow, and an explicit deny at any layer wins.',
  },

  tf_plan: {
    title: 'Compute a plan (create / update / replace / delete)',
    prompt: `<p>Implement <code>plan(desired, current, immutable=frozenset())</code>. <code>desired</code> and <code>current</code> map a resource name to its config dict. Return <code>{'create', 'update', 'replace', 'delete'}</code>, each an <b>alphabetically sorted</b> list of names:</p>
<ul><li><code>create</code>: only in desired; <code>delete</code>: only in current.</li><li>In both with equal configs: nothing. Key order never matters; nested dicts and lists compare by value; <code>None</code> and a missing key are different.</li><li>In both but different: <code>replace</code> if any attribute named in <code>immutable</code> differs (Terraform’s “forces replacement”), otherwise <code>update</code>.</li></ul>`,
    starter: String.raw`def plan(desired, current, immutable=frozenset()):
    pass
`,
    tests: String.raw`EMPTY = {'create': [], 'update': [], 'replace': [], 'delete': []}

def expect(**kw):
    return {**EMPTY, **kw}

test('create / update / delete', lambda: eq(plan({'a': {'x': 1}, 'b': {'x': 2}}, {'b': {'x': 3}, 'c': {'x': 1}}), expect(create=['a'], update=['b'], delete=['c'])))
test('no changes, regardless of key order', lambda: eq(plan({'a': {'x': 1, 'y': [1, 2]}}, {'a': {'y': [1, 2], 'x': 1}}), EMPTY))
test('nested change detected', lambda: eq(plan({'a': {'t': {'k': 1}}}, {'a': {'t': {'k': 2}}})['update'], ['a']))
test('list order matters', lambda: eq(plan({'a': {'l': [1, 2]}}, {'a': {'l': [2, 1]}})['update'], ['a']))
test('sorted output', lambda: eq(plan({'z': {}, 'm': {}, 'a': {}}, {})['create'], ['a', 'm', 'z']))
test('empty', lambda: eq(plan({}, {}), EMPTY))
test('null differs from missing', lambda: eq(plan({'a': {'x': None}}, {'a': {}})['update'], ['a']))
test('an immutable attribute forces replacement', lambda: eq(plan({'db': {'engine': 'postgres', 'size': 2}}, {'db': {'engine': 'mysql', 'size': 2}}, immutable={'engine'}), expect(replace=['db'])))
test('a mutable change is only an update', lambda: eq(plan({'db': {'engine': 'postgres', 'size': 4}}, {'db': {'engine': 'postgres', 'size': 2}}, immutable={'engine'}), expect(update=['db'])))
test('replacement wins over update', lambda: eq(plan({'db': {'engine': 'postgres', 'size': 4}}, {'db': {'engine': 'mysql', 'size': 2}}, immutable={'engine'}), expect(replace=['db'])))
`,
    hint: 'Python’s == on dicts and lists is already a deep, key-order-insensitive comparison. The interesting part is deciding replace vs update: compare only the immutable attributes, using .get and “in” so a missing key counts as different from None.',
    solution: String.raw`def plan(desired, current, immutable=frozenset()):
    out = {'create': [], 'update': [], 'replace': [], 'delete': []}
    for name in sorted(desired):
        if name not in current:
            out['create'].append(name)
            continue
        want, have = desired[name], current[name]
        if want == have:
            continue
        forced = any((k in want) != (k in have) or want.get(k) != have.get(k) for k in immutable)
        out['replace' if forced else 'update'].append(name)
    out['delete'] = sorted(name for name in current if name not in desired)
    return out`,
    notes: 'Real Terraform also computes values that are only known after apply, plans destroys in reverse dependency order, and shows a diff per attribute. Reading the plan for “forces replacement” on stateful resources is a core safety habit.',
  },

  tf_order: {
    title: 'Apply order from a dependency graph',
    prompt: `<p>Implement <code>apply_order(graph)</code> where <code>graph</code> maps each resource to a list of resources it <b>depends on</b>. Return a list where every resource appears <b>after</b> its dependencies. Among resources that are ready at the same time, choose <b>alphabetically</b> for determinism. Raise <code>ValueError('cycle')</code> if there is a cycle and <code>ValueError('unknown dependency: X')</code> if a dependency is not a key of the graph.</p>`,
    starter: String.raw`def apply_order(graph):
    pass
`,
    tests: String.raw`test('a simple chain', lambda: eq(apply_order({'app': ['db'], 'db': ['vpc'], 'vpc': []}), ['vpc', 'db', 'app']))
test('alphabetical among the ready', lambda: eq(apply_order({'c': [], 'a': [], 'b': []}), ['a', 'b', 'c']))
test('a diamond', lambda: eq(apply_order({'vpc': [], 'sg': ['vpc'], 'subnet': ['vpc'], 'ec2': ['sg', 'subnet']}), ['vpc', 'sg', 'subnet', 'ec2']))
test('empty', lambda: eq(apply_order({}), []))

@test('a cycle raises ValueError')
def _():
    with raises(ValueError) as r:
        apply_order({'a': ['b'], 'b': ['a']})
    eq(str(r.value), 'cycle')

@test('a self-dependency is a cycle')
def _():
    with raises(ValueError) as r:
        apply_order({'a': ['a']})
    eq(str(r.value), 'cycle')

@test('an unknown dependency raises ValueError')
def _():
    with raises(ValueError) as r:
        apply_order({'a': ['nope']})
    eq(str(r.value), 'unknown dependency: nope')
`,
    hint: 'Kahn’s algorithm: count unmet dependencies per node, keep the ready ones in a heap (heapq) so you always take the alphabetically first, and decrement the dependants of each node you place. If you cannot place everything, there is a cycle.',
    solution: String.raw`import heapq

def apply_order(graph):
    remaining, dependants = {}, {name: [] for name in graph}
    for name, deps in graph.items():
        for dep in deps:
            if dep not in graph:
                raise ValueError('unknown dependency: ' + dep)
            dependants[dep].append(name)
        remaining[name] = len(deps)
    ready = [name for name, n in remaining.items() if n == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        name = heapq.heappop(ready)
        order.append(name)
        for nxt in dependants[name]:
            remaining[nxt] -= 1
            if remaining[nxt] == 0:
                heapq.heappush(ready, nxt)
    if len(order) != len(graph):
        raise ValueError('cycle')
    return order`,
    notes: 'The standard library has graphlib.TopologicalSorter (it raises graphlib.CycleError), but it does not guarantee a deterministic order among ready nodes. Terraform walks the same kind of DAG but runs independent nodes in parallel and applies destroys in reverse order.',
  },
};

/* Resolve { type: 'code', ref } stubs in the lesson files into full exercise sections.
   Other exercise files add to window.EXERCISES and call window.resolveExercises() again. */
window.resolveExercises = function () {
  for (const t of TRACKS) for (const l of t.lessons) for (const s of l.sections) {
    if (s.type === 'code' && s.ref) {
      const ex = window.EXERCISES[s.ref];
      if (!ex) throw new Error('exercises: unknown exercise ref "' + s.ref + '" in lesson ' + l.id);
      Object.assign(s, ex); s.id = s.ref; delete s.ref;
    }
  }
};
window.resolveExercises();
