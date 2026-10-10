TRACKS.push({
  id: 'coding', icon: '⌨️', title: 'Coding Fluency',
  blurb: 'Senior-flavoured coding problems in JavaScript: real-world shaped, with edge cases, concurrency and clean APIs, not only puzzles.',
  lessons: [
    {
      id: 'maps-complexity', title: 'Hash maps & complexity talk', minutes: 15,
      summary: 'Most practical problems are a hash map plus a clear invariant.',
      sections: [
        { type: 'text', html: `
<p>Always say the complexity out loud and what you trade for it. The 80% pattern: <b>replace a nested loop with a Map lookup</b> → O(n²) becomes O(n) time at O(n) space.</p>
<pre><code>// O(n^2)                                  // O(n) time, O(n) space
for (a of xs) for (b of xs) ...            const seen = new Map(); for (x of xs) { seen.get(...)... }</code></pre>
<p>Use <code>Map</code>, not plain objects, when keys are not trusted strings (<code>__proto__</code>!), when you need insertion order, or when keys are non-strings.</p>` },
        { type: 'quiz', q: 'You must find the first duplicate in a stream of N ids, memory is plentiful. Best approach?',
          options: ['Sort then scan: O(n log n)', 'Nested loops: O(n²)', 'Set of seen ids: O(n) time, O(n) space', 'Binary search on the ids'],
          answer: 2, explain: 'A Set gives O(1) average membership. Mention the memory trade-off, and that with tight memory you might sort or use a Bloom filter (accepting false positives).' },
        { type: 'code', title: 'Latest record wins', prompt: `<p>Write <code>latestById(events)</code>. Each event is <code>{id, ts, value}</code>. Return an array with <b>one event per id</b>, the one with the highest <code>ts</code>, ordered by <b>first appearance of the id</b>. Ties on <code>ts</code>: keep the later one in the input. Do it in O(n).</p>`,
          starter: `function latestById(events) {
  // your code
}
`,
          tests: `
test('basic', () => eq(latestById([{id:'a',ts:1,value:1},{id:'b',ts:1,value:2},{id:'a',ts:2,value:3}]), [{id:'a',ts:2,value:3},{id:'b',ts:1,value:2}]));
test('older ignored', () => eq(latestById([{id:'a',ts:5,value:1},{id:'a',ts:2,value:9}]), [{id:'a',ts:5,value:1}]));
test('tie keeps later input', () => eq(latestById([{id:'a',ts:5,value:1},{id:'a',ts:5,value:2}]), [{id:'a',ts:5,value:2}]));
test('empty', () => eq(latestById([]), []));
test('order by first appearance', () => eq(latestById([{id:'z',ts:1,value:0},{id:'y',ts:1,value:0},{id:'z',ts:3,value:1}]).map(e=>e.id), ['z','y']));
test('prototype-ish key', () => eq(latestById([{id:'__proto__',ts:1,value:1}]).length, 1));`,
          hint: 'A Map preserves insertion order and re-setting an existing key keeps its original position.',
          solution: `function latestById(events) {
  const best = new Map();
  for (const e of events) {
    const cur = best.get(e.id);
    if (!cur || e.ts >= cur.ts) best.set(e.id, e);
  }
  return [...best.values()];
}`, notes: 'Map.set on an existing key keeps the original insertion position, which gives the ordering for free.' },
        { type: 'code', title: 'Group and count', prompt: `<p>Write <code>topK(words, k)</code> returning the <code>k</code> most frequent words as an array, sorted by count descending, ties broken alphabetically.</p>`,
          starter: `function topK(words, k) {
  // your code
}
`,
          tests: `
test('basic', () => eq(topK(['a','b','a','c','b','a'], 2), ['a','b']));
test('tie alphabetical', () => eq(topK(['b','a','c'], 2), ['a','b']));
test('k bigger than distinct', () => eq(topK(['x','x','y'], 5), ['x','y']));
test('empty', () => eq(topK([], 3), []));`,
          hint: 'Count with a Map, then sort entries. Mention that a heap makes it O(n log k) when n is huge and k is small.',
          solution: `function topK(words, k) {
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, k)
    .map(([w]) => w);
}` },
      ],
    },
    {
      id: 'stateful-classes', title: 'Design-a-class problems', minutes: 20,
      summary: 'LRU cache and rate limiter: clean APIs, injectable clocks, invariants.',
      sections: [
        { type: 'text', html: `
<p>These problems test whether you can maintain <b>invariants</b> across operations. Senior moves: inject dependencies (a clock!) so the code is testable, define behavior at edges up front, and keep the public surface tiny.</p>
<div class="callout tip">JS <code>Map</code> iterates in insertion order, so you can implement an LRU with a <code>Map</code> by deleting and re-inserting on access. In interviews, also be ready to explain the classic hash map + doubly linked list version (O(1) get/put with no reliance on Map's ordering).</div>` },
        { type: 'code', title: 'LRU cache', prompt: `<p>Implement <code>class LRUCache</code> with <code>constructor(capacity)</code>, <code>get(key)</code> (returns value or <code>undefined</code>, marks as recently used) and <code>put(key, value)</code> (evicts the least recently used when over capacity). All operations O(1).</p>`,
          starter: `class LRUCache {
  constructor(capacity) {
  }
  get(key) {
  }
  put(key, value) {
  }
}
`,
          tests: `
test('basic get/put', () => { const c=new LRUCache(2); c.put('a',1); c.put('b',2); eq(c.get('a'),1); eq(c.get('b'),2); });
test('evicts LRU', () => { const c=new LRUCache(2); c.put('a',1); c.put('b',2); c.put('c',3); eq(c.get('a'),undefined); eq(c.get('b'),2); eq(c.get('c'),3); });
test('get refreshes', () => { const c=new LRUCache(2); c.put('a',1); c.put('b',2); c.get('a'); c.put('c',3); eq(c.get('b'),undefined); eq(c.get('a'),1); });
test('put existing refreshes and updates', () => { const c=new LRUCache(2); c.put('a',1); c.put('b',2); c.put('a',10); c.put('c',3); eq(c.get('a'),10); eq(c.get('b'),undefined); });
test('falsy values are real values', () => { const c=new LRUCache(1); c.put('z',0); eq(c.get('z'),0); });
test('capacity 1', () => { const c=new LRUCache(1); c.put('a',1); c.put('b',2); eq(c.get('a'),undefined); eq(c.get('b'),2); });`,
          hint: 'Careful: `if (!this.map.get(key))` breaks on falsy values. Use `has`.',
          solution: `class LRUCache {
  constructor(capacity) { this.capacity = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const v = this.map.get(key);
    this.map.delete(key); this.map.set(key, v);
    return v;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value);
  }
}` },
        { type: 'code', title: 'Token-bucket rate limiter', prompt: `<p>Implement <code>class RateLimiter</code> with <code>constructor({capacity, refillPerSec, now})</code> where <code>now()</code> returns milliseconds (injected so it is testable). <code>tryAcquire(n = 1)</code> returns <code>true</code> and consumes tokens if enough are available, otherwise <code>false</code>. The bucket starts full; tokens refill continuously and never exceed capacity.</p>
<p>Why this matters for open banking: banks throttle aggregators hard, so a per-bank limiter in front of outgoing calls is real code.</p>`,
          starter: `class RateLimiter {
  constructor({ capacity, refillPerSec, now = Date.now }) {
  }
  tryAcquire(n = 1) {
  }
}
`,
          tests: `
function mk(cap, rate){ let t=0; const rl=new RateLimiter({capacity:cap, refillPerSec:rate, now:()=>t}); return {rl, adv:(ms)=>{t+=ms;}}; }
test('starts full', () => { const {rl}=mk(3,1); eq([rl.tryAcquire(),rl.tryAcquire(),rl.tryAcquire(),rl.tryAcquire()],[true,true,true,false]); });
test('refills over time', () => { const {rl,adv}=mk(2,1); rl.tryAcquire(); rl.tryAcquire(); eq(rl.tryAcquire(),false); adv(1000); eq(rl.tryAcquire(),true); eq(rl.tryAcquire(),false); });
test('fractional refill accumulates', () => { const {rl,adv}=mk(1,1); rl.tryAcquire(); adv(500); eq(rl.tryAcquire(),false); adv(500); eq(rl.tryAcquire(),true); });
test('never exceeds capacity', () => { const {rl,adv}=mk(2,10); adv(60000); eq([rl.tryAcquire(),rl.tryAcquire(),rl.tryAcquire()],[true,true,false]); });
test('acquire n', () => { const {rl}=mk(5,1); eq(rl.tryAcquire(5),true); eq(rl.tryAcquire(1),false); });
test('rejected acquire does not consume', () => { const {rl}=mk(3,1); eq(rl.tryAcquire(4),false); eq(rl.tryAcquire(3),true); });`,
          hint: 'Do not use a timer. Lazily refill on each call: tokens = min(capacity, tokens + elapsedSec * rate).',
          solution: `class RateLimiter {
  constructor({ capacity, refillPerSec, now = Date.now }) {
    this.capacity = capacity; this.rate = refillPerSec; this.now = now;
    this.tokens = capacity; this.last = now();
  }
  _refill() {
    const t = this.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((t - this.last) / 1000) * this.rate);
    this.last = t;
  }
  tryAcquire(n = 1) {
    this._refill();
    if (this.tokens >= n) { this.tokens -= n; return true; }
    return false;
  }
}`, notes: 'Follow-ups to be ready for: distributed limiting (Redis + Lua for atomicity), sliding window vs token bucket, fairness per tenant, returning Retry-After.' },
      ],
    },
    {
      id: 'async-patterns', title: 'Async patterns: pools, retries, timeouts', minutes: 20,
      summary: 'Concurrency control and resilience in plain JS.',
      sections: [
        { type: 'text', html: `
<p>Real services spend their lives waiting on other services. Three utilities show up constantly: <b>bounded concurrency</b>, <b>retry with backoff + jitter</b>, and <b>timeouts</b>. Be able to write each from scratch.</p>
<div class="callout warn"><b>Classic traps:</b> <code>Promise.all</code> on 10,000 items fires 10,000 requests at once. Retrying non-idempotent calls can double-charge. Retrying without jitter makes a thundering herd.</div>` },
        { type: 'code', title: 'mapLimit', prompt: `<p>Implement <code>async function mapLimit(items, limit, fn)</code>. Call <code>fn(item, index)</code> for every item with <b>at most <code>limit</code> running at once</b>. Return results <b>in input order</b>. If any call rejects, reject with that error.</p>`,
          starter: `async function mapLimit(items, limit, fn) {
}
`,
          tests: `
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
test('results in order', async () => eq(await mapLimit([30,10,20], 2, async (ms,i)=>{ await sleep(ms); return i; }), [0,1,2]));
test('respects limit', async () => { let run=0,max=0; await mapLimit(Array(8).fill(0), 3, async()=>{ run++; max=Math.max(max,run); await sleep(5); run--; }); eq(max,3); });
test('empty input', async () => eq(await mapLimit([], 3, async x=>x), []));
test('limit larger than items', async () => eq(await mapLimit([1,2], 10, async x=>x*2), [2,4]));
test('rejects on error', async () => { const e = await throws(() => mapLimit([1,2,3], 2, async x=>{ if(x===2) throw new Error('boom'); return x; })); eq(e.message,'boom'); });`,
          hint: 'Start `limit` workers. Each worker loops: take the next index from a shared counter, await fn, store result.',
          solution: `async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}` },
        { type: 'code', title: 'Retry with exponential backoff', prompt: `<p>Implement <code>async function retry(fn, {retries, baseMs, sleep, shouldRetry})</code>. Call <code>fn(attempt)</code> (attempt starts at 0). On failure, if retries remain <b>and</b> <code>shouldRetry(err)</code> (default: always true), wait <code>baseMs * 2^attempt</code> via the injected <code>sleep(ms)</code>, then try again. After the last failure, throw the last error. (In production you would add jitter; leave it out so the test stays deterministic.)</p>`,
          starter: `async function retry(fn, { retries = 3, baseMs = 100, sleep = (ms) => new Promise(r => setTimeout(r, ms)), shouldRetry = () => true } = {}) {
}
`,
          tests: `
test('returns on first success', async () => eq(await retry(async()=> 'ok'), 'ok'));
test('retries then succeeds with backoff', async () => { const waits=[]; let n=0; const r = await retry(async()=>{ if(n++<2) throw new Error('x'); return 'ok'; }, {retries:3, baseMs:100, sleep: async ms=>waits.push(ms)}); eq(r,'ok'); eq(waits,[100,200]); });
test('throws last error after exhausting', async () => { let n=0; const e = await throws(()=>retry(async()=>{ throw new Error('e'+(n++)); }, {retries:2, baseMs:1, sleep: async()=>{}})); eq(e.message,'e2'); eq(n,3); });
test('does not retry non-retryable', async () => { let n=0; await throws(()=>retry(async()=>{ n++; throw new Error('4xx'); }, {retries:5, sleep: async()=>{}, shouldRetry: e=>e.message!=='4xx'})); eq(n,1); });
test('passes attempt number', async () => { const seen=[]; await retry(async a=>{ seen.push(a); if(a<1) throw new Error('x'); }, {sleep: async()=>{}}); eq(seen,[0,1]); });`,
          hint: 'A for-loop from attempt 0 to retries. In the catch: rethrow if last attempt or not retryable; otherwise sleep.',
          solution: `async function retry(fn, { retries = 3, baseMs = 100, sleep = (ms) => new Promise(r => setTimeout(r, ms)), shouldRetry = () => true } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      await sleep(baseMs * 2 ** attempt);
    }
  }
}`, notes: 'Talking points: full jitter, a retry budget, honoring Retry-After, and only retrying idempotent operations (or those with idempotency keys).' },
        { type: 'quiz', q: 'A downstream bank API returns 429 with <code>Retry-After: 30</code>. Your retry helper uses exponential backoff starting at 100ms. What is wrong?',
          options: ['Nothing, backoff is always right', 'You should respect Retry-After; hammering earlier wastes budget and may get you blocked', 'You should retry immediately once', 'You should switch to a different bank'],
          answer: 1, explain: 'The server told you exactly when to come back. Respect it (and cap it), and consider a per-bank circuit breaker so one throttled bank does not consume your worker pool.' },
      ],
    },
  ],
});
