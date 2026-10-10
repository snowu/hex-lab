/* Full-stack exercises (Python). Several mirror patterns from real projects: Worker caching and single-flight
   fan-in, JWT/RLS-style auth, and compare-and-swap cloud saves with a server-side generation. */
Object.assign(window.EXERCISES, {

  cache_control: {
    title: 'Parse a Cache-Control header', minutes: 15, level: 'easy',
    prompt: `<p>Write <code>parse_cache_control(header)</code> returning a dict of the directives it understands. Numeric directives (<code>max-age</code>, <code>s-maxage</code>, <code>stale-while-revalidate</code>, <code>stale-if-error</code>) become ints. Flag directives (<code>public</code>, <code>private</code>, <code>no-store</code>, <code>no-cache</code>, <code>immutable</code>, <code>must-revalidate</code>) become <code>True</code>. Rules: names are case-insensitive, whitespace is ignored, values may be quoted (<code>max-age="60"</code>), unknown directives and invalid numbers are ignored, and if a directive appears twice the first one wins. <code>None</code> or an empty header gives <code>{}</code>.</p>`,
    starter: String.raw`def parse_cache_control(header):
    pass
`,
    tests: String.raw`test('basic', lambda: eq(parse_cache_control('public, max-age=60'), {'public': True, 'max-age': 60}))
test('case and whitespace', lambda: eq(parse_cache_control('  Max-Age=30 ,  NO-STORE '), {'max-age': 30, 'no-store': True}))
test('quoted values', lambda: eq(parse_cache_control('max-age="60"'), {'max-age': 60}))
test('unknown directives are ignored', lambda: eq(parse_cache_control('foo=bar, max-age=5, community="UCI"'), {'max-age': 5}))
test('invalid numbers are ignored', lambda: eq(parse_cache_control('max-age=abc, s-maxage=-5, stale-if-error=10'), {'stale-if-error': 10}))
test('empty and None', lambda: eq((parse_cache_control(''), parse_cache_control(None), parse_cache_control(' , ,')), ({}, {}, {})))
test('the first duplicate wins', lambda: eq(parse_cache_control('max-age=10, max-age=20'), {'max-age': 10}))
test('a realistic CDN header', lambda: eq(parse_cache_control('public, max-age=0, s-maxage=300, stale-while-revalidate=30, stale-if-error=600, immutable'), {'public': True, 'max-age': 0, 's-maxage': 300, 'stale-while-revalidate': 30, 'stale-if-error': 600, 'immutable': True}))
`,
    hint: 'Split on commas, strip, then str.partition("=") into name and value. Lowercase the name, strip quotes from the value, and use str.isdigit() to accept only non-negative integers.',
    solution: String.raw`NUMERIC = {'max-age', 's-maxage', 'stale-while-revalidate', 'stale-if-error'}
FLAGS = {'public', 'private', 'no-store', 'no-cache', 'immutable', 'must-revalidate'}

def parse_cache_control(header):
    out = {}
    for part in (header or '').split(','):
        part = part.strip()
        if not part:
            continue
        name, _, value = part.partition('=')
        name, value = name.strip().lower(), value.strip().strip('"')
        if name in out:
            continue
        if name in NUMERIC:
            if value.isdigit():
                out[name] = int(value)
        elif name in FLAGS:
            out[name] = True
    return out`,
    notes: 'Remember the semantics too: no-store means never keep it; no-cache means keep it but revalidate every time; s-maxage applies only to shared caches (CDNs); immutable promises the URL never changes (use with hashed file names).',
  },

  cors: {
    title: 'CORS response headers', minutes: 25, level: 'medium',
    prompt: `<p>Write <code>cors_headers(method, request_headers, allowed_origins, allow_credentials=False, allowed_methods=('GET','POST','PUT','DELETE'), allowed_headers=('content-type','authorization'), max_age=600)</code> returning the CORS headers to add to the response (a dict, possibly empty). Rules:</p>
<ul><li>Header names in <code>request_headers</code> are case-insensitive. No <code>Origin</code> header, or an origin that is not allowed → <code>{}</code> (the browser will block it).</li><li>An allowed origin gets <code>Access-Control-Allow-Origin: &lt;that origin&gt;</code> and <code>Vary: Origin</code>. If <code>'*'</code> is in the allow list <b>and credentials are off</b>, any origin gets <code>Access-Control-Allow-Origin: *</code> (no Vary). A wildcard never works with credentials.</li><li>With credentials add <code>Access-Control-Allow-Credentials: true</code>.</li><li>A <b>preflight</b> is <code>OPTIONS</code> with <code>Access-Control-Request-Method</code>. The requested method and every requested header must be allowed, otherwise return <code>{}</code>. If allowed add <code>Access-Control-Allow-Methods</code> (all allowed methods, comma-joined), <code>Access-Control-Allow-Headers</code> (the requested headers, only if any were requested) and <code>Access-Control-Max-Age</code> (as a string).</li><li>Any other method is a normal request: no preflight headers.</li></ul>`,
    starter: String.raw`def cors_headers(method, request_headers, allowed_origins, allow_credentials=False,
                 allowed_methods=('GET', 'POST', 'PUT', 'DELETE'),
                 allowed_headers=('content-type', 'authorization'), max_age=600):
    pass
`,
    tests: String.raw`A = 'https://app.example'
OK = {'Access-Control-Allow-Origin': A, 'Vary': 'Origin'}

test('an allowed origin', lambda: eq(cors_headers('GET', {'Origin': A}, [A]), OK))
test('header names are case-insensitive', lambda: eq(cors_headers('GET', {'origin': A}, [A]), OK))
test('a disallowed origin gets nothing', lambda: eq(cors_headers('GET', {'Origin': 'https://evil.example'}, [A]), {}))
test('no Origin header: not a CORS request', lambda: eq(cors_headers('GET', {}, [A]), {}))
test('credentials', lambda: eq(cors_headers('GET', {'Origin': A}, [A], allow_credentials=True), {**OK, 'Access-Control-Allow-Credentials': 'true'}))
test('wildcard without credentials', lambda: eq(cors_headers('GET', {'Origin': 'https://x.example'}, ['*']), {'Access-Control-Allow-Origin': '*'}))
test('a wildcard is never used with credentials', lambda: eq(cors_headers('GET', {'Origin': 'https://x.example'}, ['*'], allow_credentials=True), {}))
test('explicit origin still works with credentials next to a wildcard', lambda: eq(cors_headers('GET', {'Origin': A}, ['*', A], allow_credentials=True)['Access-Control-Allow-Origin'], A))

@test('a valid preflight')
def _():
    req = {'Origin': A, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'Content-Type, Authorization'}
    eq(cors_headers('OPTIONS', req, [A]), {**OK, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '600'})

@test('a preflight with no requested headers')
def _():
    out = cors_headers('OPTIONS', {'Origin': A, 'Access-Control-Request-Method': 'GET'}, [A], max_age=60)
    eq('Access-Control-Allow-Headers' in out, False)
    eq(out['Access-Control-Max-Age'], '60')

test('a preflight for a disallowed method', lambda: eq(cors_headers('OPTIONS', {'Origin': A, 'Access-Control-Request-Method': 'PATCH'}, [A]), {}))
test('a preflight for a disallowed header', lambda: eq(cors_headers('OPTIONS', {'Origin': A, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-admin'}, [A]), {}))
test('a non-OPTIONS request never gets preflight headers', lambda: eq(cors_headers('GET', {'Origin': A, 'Access-Control-Request-Method': 'GET'}, [A]), OK))
`,
    hint: 'Lowercase the request header names first. Decide the origin headers, then (only for OPTIONS plus Access-Control-Request-Method) validate the requested method and every requested header against the allow lists, returning {} on any miss.',
    solution: String.raw`def cors_headers(method, request_headers, allowed_origins, allow_credentials=False,
                 allowed_methods=('GET', 'POST', 'PUT', 'DELETE'),
                 allowed_headers=('content-type', 'authorization'), max_age=600):
    req = {k.lower(): v for k, v in request_headers.items()}
    origin = req.get('origin')
    if not origin:
        return {}
    if origin in allowed_origins:
        out = {'Access-Control-Allow-Origin': origin, 'Vary': 'Origin'}
    elif '*' in allowed_origins and not allow_credentials:
        out = {'Access-Control-Allow-Origin': '*'}
    else:
        return {}
    if allow_credentials:
        out['Access-Control-Allow-Credentials'] = 'true'
    wanted = req.get('access-control-request-method')
    if method.upper() == 'OPTIONS' and wanted:
        if wanted.upper() not in {m.upper() for m in allowed_methods}:
            return {}
        asked = [h.strip() for h in req.get('access-control-request-headers', '').split(',') if h.strip()]
        permitted = {h.lower() for h in allowed_headers}
        if any(h.lower() not in permitted for h in asked):
            return {}
        out['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
        if asked:
            out['Access-Control-Allow-Headers'] = ', '.join(asked)
        out['Access-Control-Max-Age'] = str(max_age)
    return out`,
    notes: 'CORS protects the <b>user’s browser</b>, not your server: curl ignores it. Never reflect an arbitrary Origin together with credentials, because then any website can read the logged-in user’s data. Vary: Origin keeps shared caches from serving one origin’s headers to another. This is exactly why a public page cannot call an upstream API directly and a small backend (a Worker) does it.',
  },

  jwt: {
    title: 'Verify a JWT (HS256)', minutes: 25, level: 'medium',
    prompt: `<p>Write <code>verify_jwt(token, secret, *, now, issuer=None, audience=None, leeway=0)</code> for HS256 tokens. Return the claims dict, or raise <code>ValueError</code> with exactly one of these messages:</p>
<ul><li><code>'malformed token'</code>: not three dot-separated base64url parts holding JSON objects.</li><li><code>'unsupported alg'</code>: the header <code>alg</code> is anything but <code>HS256</code> (<b>including <code>none</code></b>: never let the token choose its own verification).</li><li><code>'bad signature'</code>: HMAC-SHA256 of <code>header.payload</code> does not match (compare in constant time).</li><li><code>'missing exp'</code>, <code>'token expired'</code> (when <code>now &gt;= exp + leeway</code>), <code>'token not yet valid'</code> (when <code>now &lt; nbf - leeway</code>).</li><li><code>'wrong issuer'</code> / <code>'wrong audience'</code> when you were given an expected value and the claim differs (<code>aud</code> may be a string or a list).</li></ul>
<p>Check in that order. Times are in seconds.</p>`,
    starter: String.raw`import base64
import hashlib
import hmac
import json

def verify_jwt(token, secret, *, now, issuer=None, audience=None, leeway=0):
    pass
`,
    tests: String.raw`import base64, hashlib, hmac, json

NOW = 1_700_000_000

def b64e(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode()

def make(claims, secret='s3cret', alg='HS256'):
    h = b64e(json.dumps({'alg': alg, 'typ': 'JWT'}).encode())
    p = b64e(json.dumps(claims).encode())
    sig = '' if alg == 'none' else b64e(hmac.new(secret.encode(), f'{h}.{p}'.encode(), hashlib.sha256).digest())
    return f'{h}.{p}.{sig}'

def fails(token, message, **kw):
    kw.setdefault('now', NOW)
    with raises(ValueError) as r:
        verify_jwt(token, 's3cret', **kw)
    eq(str(r.value), message)

GOOD = {'sub': 'user-1', 'exp': NOW + 60, 'iss': 'https://auth.example', 'aud': 'authenticated'}

test('a valid token returns its claims', lambda: eq(verify_jwt(make(GOOD), 's3cret', now=NOW), GOOD))
test('expired', lambda: fails(make({**GOOD, 'exp': NOW - 1}), 'token expired'))
test('expiry is exclusive', lambda: fails(make({**GOOD, 'exp': NOW}), 'token expired'))
test('leeway tolerates small clock skew', lambda: eq(verify_jwt(make({**GOOD, 'exp': NOW - 5}), 's3cret', now=NOW, leeway=10)['sub'], 'user-1'))
test('not yet valid', lambda: fails(make({**GOOD, 'nbf': NOW + 100}), 'token not yet valid'))
test('wrong secret', lambda: fails(make(GOOD, secret='other'), 'bad signature'))

@test('a tampered payload is rejected')
def _():
    h, p, s = make(GOOD).split('.')
    forged = b64e(json.dumps({**GOOD, 'sub': 'admin'}).encode())
    fails(f'{h}.{forged}.{s}', 'bad signature')

test('alg none is never accepted', lambda: fails(make(GOOD, alg='none'), 'unsupported alg'))
test('another alg is not accepted either', lambda: fails(make(GOOD, alg='HS512'), 'unsupported alg'))

@test('malformed tokens')
def _():
    for bad in ('', 'abc', 'a.b', 'a.b.c.d', None, '!!!.???.***'):
        fails(bad, 'malformed token')

test('exp is required', lambda: fails(make({'sub': 'u'}), 'missing exp'))
test('issuer must match when expected', lambda: fails(make(GOOD), 'wrong issuer', issuer='https://other.example'))
test('issuer ok', lambda: eq(verify_jwt(make(GOOD), 's3cret', now=NOW, issuer='https://auth.example')['sub'], 'user-1'))
test('audience must match when expected', lambda: fails(make(GOOD), 'wrong audience', audience='service'))
test('audience may be a list', lambda: eq(verify_jwt(make({**GOOD, 'aud': ['a', 'authenticated']}), 's3cret', now=NOW, audience='authenticated')['sub'], 'user-1'))
test('a missing aud fails when one is expected', lambda: fails(make({'sub': 'u', 'exp': NOW + 5}), 'wrong audience', audience='authenticated'))
`,
    hint: 'Split into three parts, base64url-decode with padding fixed (part + "=" * (-len(part) % 4)), json.loads, check header["alg"] first, then recompute hmac.new(secret, f"{h}.{p}", sha256).digest() and compare with hmac.compare_digest, then the time and identity claims in the stated order.',
    solution: String.raw`import base64
import hashlib
import hmac
import json

def _b64d(part):
    return base64.urlsafe_b64decode(part + '=' * (-len(part) % 4))

def verify_jwt(token, secret, *, now, issuer=None, audience=None, leeway=0):
    try:
        header_b64, payload_b64, sig_b64 = token.split('.')
        header = json.loads(_b64d(header_b64))
        claims = json.loads(_b64d(payload_b64))
        sig = _b64d(sig_b64)
    except (ValueError, AttributeError, TypeError):
        raise ValueError('malformed token')
    if not isinstance(header, dict) or not isinstance(claims, dict):
        raise ValueError('malformed token')
    if header.get('alg') != 'HS256':
        raise ValueError('unsupported alg')
    expected = hmac.new(secret.encode(), f'{header_b64}.{payload_b64}'.encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(sig, expected):
        raise ValueError('bad signature')
    exp = claims.get('exp')
    if not isinstance(exp, (int, float)):
        raise ValueError('missing exp')
    if now >= exp + leeway:
        raise ValueError('token expired')
    nbf = claims.get('nbf')
    if nbf is not None and now < nbf - leeway:
        raise ValueError('token not yet valid')
    if issuer is not None and claims.get('iss') != issuer:
        raise ValueError('wrong issuer')
    if audience is not None:
        aud = claims.get('aud')
        if audience not in (aud if isinstance(aud, list) else [aud]):
            raise ValueError('wrong audience')
    return claims`,
    notes: 'The attacks this blocks: alg=none, algorithm confusion (RS256 key used as an HS256 secret), tampered claims, replay after expiry, and tokens meant for another service. Real systems verify against the issuer’s public keys (JWKS) and handle key rotation. A JWT cannot be revoked before it expires, which is why access tokens are short-lived.',
  },

  paginate: {
    title: 'Keyset pagination with a signed cursor', minutes: 25, level: 'medium',
    prompt: `<p>Write <code>paginate(items, limit, cursor, secret)</code> for a feed. <code>items</code> are dicts with <code>id</code> and <code>created_at</code> (sortable) in any order. Return <code>{'items': [...], 'next_cursor': str | None}</code>, newest first (sort by <code>(created_at, id)</code> descending, so ties are stable). The <b>opaque cursor</b> encodes the last item's <code>(created_at, id)</code> plus an HMAC signature so clients cannot forge or edit it; the next page returns only items strictly <b>after</b> that position. <code>cursor=None</code> means the first page; <code>next_cursor</code> is <code>None</code> on the last page. Raise <code>ValueError('invalid cursor')</code> for a tampered, garbled or wrong-secret cursor and <code>ValueError('limit must be 1-100')</code> for a bad limit.</p>`,
    starter: String.raw`import base64
import hashlib
import hmac
import json

def paginate(items, limit, cursor, secret):
    pass
`,
    tests: String.raw`ITEMS = [{'id': i, 'created_at': i // 3} for i in range(1, 26)]
SECRET = 's3cret'

def walk(items, limit, secret=SECRET):
    ids, cursor, guard = [], None, 0
    while True:
        page = paginate(items, limit, cursor, secret)
        ids += [r['id'] for r in page['items']]
        cursor = page['next_cursor']
        guard += 1
        if cursor is None or guard > 50:
            return ids

@test('every item appears exactly once, newest first')
def _():
    ids = walk(ITEMS, 10)
    eq(len(ids), 25)
    eq(sorted(ids), list(range(1, 26)))
    eq(ids, sorted(ids, key=lambda i: (i // 3, i), reverse=True))

test('the first page is limit-sized with a cursor', lambda: eq((len(paginate(ITEMS, 10, None, SECRET)['items']), paginate(ITEMS, 10, None, SECRET)['next_cursor'] is not None), (10, True)))
test('the last page has no cursor', lambda: eq(paginate(ITEMS, 100, None, SECRET)['next_cursor'], None))
test('an exact multiple ends cleanly', lambda: eq(walk(ITEMS[:20], 10), sorted(range(1, 21), key=lambda i: (i // 3, i), reverse=True)))
test('empty input', lambda: eq(paginate([], 5, None, SECRET), {'items': [], 'next_cursor': None}))

@test('new items inserted at the top do not shift later pages (unlike OFFSET)')
def _():
    first = paginate(ITEMS, 10, None, SECRET)
    newer = ITEMS + [{'id': 99, 'created_at': 999}]
    second = paginate(newer, 10, first['next_cursor'], SECRET)
    seen = [r['id'] for r in first['items']] + [r['id'] for r in second['items']]
    eq(len(seen), len(set(seen)))
    eq(99 in seen, False)

@test('deleting the cursor item does not break the next page')
def _():
    first = paginate(ITEMS, 10, None, SECRET)
    last_id = first['items'][-1]['id']
    rest = paginate([r for r in ITEMS if r['id'] != last_id], 10, first['next_cursor'], SECRET)
    eq(last_id in [r['id'] for r in rest['items']], False)
    eq(len(rest['items']), 10)

@test('tampered, garbled and foreign cursors are rejected')
def _():
    cur = paginate(ITEMS, 10, None, SECRET)['next_cursor']
    payload, sig = cur.split('.')
    flipped = ('A' if payload[0] != 'A' else 'B') + payload[1:]
    for bad in (f'{flipped}.{sig}', cur[:-2] + ('00' if cur[-2:] != '00' else '11'), 'garbage', '', 'a.b', cur + '.x'):
        with raises(ValueError) as r:
            paginate(ITEMS, 10, bad, SECRET)
        eq(str(r.value), 'invalid cursor')
    with raises(ValueError):
        paginate(ITEMS, 10, cur, 'another-secret')

@test('limit is validated')
def _():
    for bad in (0, -1, 101, 'ten', None):
        with raises(ValueError) as r:
            paginate(ITEMS, bad, None, SECRET)
        eq(str(r.value), 'limit must be 1-100')
`,
    hint: 'Sort with key=(created_at, id), reverse=True. Cursor = base64url(json [created_at, id]) + "." + a truncated HMAC of that payload. To decode: split, recompute and compare_digest the signature, then keep only rows whose (created_at, id) tuple is less than the cursor tuple. next_cursor exists only if more rows remain after this page.',
    solution: String.raw`import base64
import hashlib
import hmac
import json

def _sign(payload, secret):
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()[:32]

def _encode(last, secret):
    payload = base64.urlsafe_b64encode(json.dumps([last['created_at'], last['id']]).encode()).decode().rstrip('=')
    return payload + '.' + _sign(payload, secret)

def _decode(cursor, secret):
    try:
        payload, sig = cursor.split('.')
        if not hmac.compare_digest(sig, _sign(payload, secret)):
            raise ValueError
        created_at, row_id = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
        return created_at, row_id
    except (ValueError, TypeError, AttributeError):
        raise ValueError('invalid cursor')

def paginate(items, limit, cursor, secret):
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 100:
        raise ValueError('limit must be 1-100')
    ordered = sorted(items, key=lambda r: (r['created_at'], r['id']), reverse=True)
    if cursor is not None:
        position = _decode(cursor, secret)
        ordered = [r for r in ordered if (r['created_at'], r['id']) < position]
    page = ordered[:limit]
    more = len(ordered) > limit
    return {'items': page, 'next_cursor': _encode(page[-1], secret) if more else None}`,
    notes: 'This is the API-level twin of the SQL keyset query: WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT n. Opaque, signed cursors let you change the internals later and stop clients from crafting positions. Include a tiebreaker (id) or rows with equal timestamps will be skipped or repeated.',
  },

  single_flight: {
    title: 'Single-flight: coalesce duplicate requests', minutes: 20, level: 'medium',
    prompt: `<p>Fifty phones ask for the same stop's arrivals in the same second. Calling the upstream 50 times wastes quota. Write <code>class SingleFlight</code> with <code>async do(key, fn)</code>: if a call for <code>key</code> is already running, wait for it and share its result; otherwise run <code>await fn()</code> (an async function with no arguments). When the call finishes the key is forgotten, so a later call runs again. Errors propagate to <b>every</b> waiter and are not cached. Different keys run independently.</p>`,
    starter: String.raw`import asyncio

class SingleFlight:
    def __init__(self):
        pass

    async def do(self, key, fn):
        pass
`,
    tests: String.raw`import asyncio

def counter():
    calls = []
    async def work():
        calls.append(1)
        await asyncio.sleep(0.01)
        return f'result-{len(calls)}'
    return work, calls

@test('concurrent calls share one execution')
async def _():
    sf, (work, calls) = SingleFlight(), counter()
    results = await asyncio.gather(*(sf.do('stop-42', work) for _ in range(10)))
    eq(results, ['result-1'] * 10)
    eq(len(calls), 1)

@test('a later call runs again')
async def _():
    sf, (work, calls) = SingleFlight(), counter()
    eq(await sf.do('k', work), 'result-1')
    eq(await sf.do('k', work), 'result-2')

@test('different keys are independent')
async def _():
    sf, (work, calls) = SingleFlight(), counter()
    await asyncio.gather(sf.do('a', work), sf.do('b', work))
    eq(len(calls), 2)

@test('an error reaches every waiter and is not cached')
async def _():
    sf, runs = SingleFlight(), []
    async def boom():
        runs.append(1)
        await asyncio.sleep(0.01)
        raise RuntimeError('upstream down')
    outcomes = await asyncio.gather(*(sf.do('k', boom) for _ in range(3)), return_exceptions=True)
    eq([type(o).__name__ for o in outcomes], ['RuntimeError'] * 3)
    eq(len(runs), 1)
    async def fine():
        return 'ok'
    eq(await sf.do('k', fine), 'ok')

@test('cancelling one waiter does not cancel the shared work')
async def _():
    sf, (work, calls) = SingleFlight(), counter()
    first = asyncio.ensure_future(sf.do('k', work))
    second = asyncio.ensure_future(sf.do('k', work))
    await asyncio.sleep(0)
    first.cancel()
    eq(await second, 'result-1')
    eq(len(calls), 1)
`,
    hint: 'Keep a dict of key → task. If there is none, create one with asyncio.ensure_future(run()) where run() awaits fn() and removes the key in a finally block. Every caller awaits the same task, wrapped in asyncio.shield so one cancelled waiter cannot cancel it for everybody.',
    solution: String.raw`import asyncio

class SingleFlight:
    def __init__(self):
        self.inflight = {}

    async def do(self, key, fn):
        task = self.inflight.get(key)
        if task is None:
            async def run():
                try:
                    return await fn()
                finally:
                    self.inflight.pop(key, None)
            task = self.inflight[key] = asyncio.ensure_future(run())
        return await asyncio.shield(task)`,
    notes: 'This is the pattern behind a shared poller: N clients, one upstream call. In a Cloudflare Worker the same idea is a Durable Object (one instance per key) that all requests are routed to. Go ships it as golang.org/x/sync/singleflight.',
  },

  swr_cache: {
    title: 'Stale-while-revalidate cache', minutes: 30, level: 'hard',
    prompt: `<p>Write <code>class SWRCache</code> with <code>__init__(ttl, swr, now)</code> (<code>now()</code> returns seconds), <code>async get(key, loader)</code> and <code>async idle()</code>. For each key:</p>
<ul><li><b>Fresh</b> (age &lt; <code>ttl</code>): return the cached value, no load.</li><li><b>Stale</b> (<code>ttl</code> ≤ age &lt; <code>ttl + swr</code>): return the cached value <b>immediately</b> and refresh it in the background. Many readers must trigger only <b>one</b> refresh.</li><li><b>Missing or expired</b>: await <code>loader()</code>, cache the result, return it. Concurrent callers share one load.</li><li>A failed background refresh keeps the old value (the next <code>get</code> tries again). A failed foreground load raises and caches nothing.</li><li><code>idle()</code> waits for any background refreshes to finish (so tests are deterministic).</li></ul>`,
    starter: String.raw`import asyncio

class SWRCache:
    def __init__(self, ttl, swr, now):
        pass

    async def get(self, key, loader):
        pass

    async def idle(self):
        pass
`,
    tests: String.raw`import asyncio

def setup(ttl=10, swr=30):
    clock = [0.0]
    cache = SWRCache(ttl, swr, now=lambda: clock[0])
    calls = []
    async def loader():
        calls.append(1)
        await asyncio.sleep(0)
        return f'v{len(calls)}'
    def advance(seconds):
        clock[0] += seconds
    return cache, loader, calls, advance

@test('a miss loads once, then it is fresh')
async def _():
    cache, loader, calls, _ = setup()
    eq(await cache.get('k', loader), 'v1')
    eq(await cache.get('k', loader), 'v1')
    eq(len(calls), 1)

@test('a stale entry is served immediately and refreshed in the background')
async def _():
    cache, loader, calls, advance = setup()
    await cache.get('k', loader)
    advance(15)
    eq(await cache.get('k', loader), 'v1')
    await cache.idle()
    eq(await cache.get('k', loader), 'v2')
    eq(len(calls), 2)

@test('many readers of a stale key trigger exactly one refresh')
async def _():
    cache, loader, calls, advance = setup()
    await cache.get('k', loader)
    advance(15)
    eq(await asyncio.gather(*(cache.get('k', loader) for _ in range(5))), ['v1'] * 5)
    await cache.idle()
    eq(len(calls), 2)

@test('an expired entry waits for a fresh load')
async def _():
    cache, loader, calls, advance = setup()
    await cache.get('k', loader)
    advance(100)
    eq(await cache.get('k', loader), 'v2')

@test('concurrent readers of an expired key share one load')
async def _():
    cache, loader, calls, advance = setup()
    await cache.get('k', loader)
    advance(100)
    eq(await asyncio.gather(*(cache.get('k', loader) for _ in range(4))), ['v2'] * 4)
    eq(len(calls), 2)

@test('a failed background refresh keeps serving the old value')
async def _():
    cache, _, _, advance = setup()
    state = {'fail': False, 'n': 0}
    async def loader():
        state['n'] += 1
        if state['fail']:
            raise RuntimeError('upstream down')
        return f"v{state['n']}"
    await cache.get('k', loader)
    advance(15)
    state['fail'] = True
    eq(await cache.get('k', loader), 'v1')
    await cache.idle()
    eq(await cache.get('k', loader), 'v1')
    await cache.idle()                         # the second refresh fails too
    state['fail'] = False
    eq(await cache.get('k', loader), 'v1')    # still stale: serves the old value and refreshes (this time it works)
    await cache.idle()
    eq(await cache.get('k', loader), 'v4')    # the fourth load succeeded

@test('a failed first load raises and caches nothing')
async def _():
    cache, _, _, _ = setup()
    state = {'n': 0}
    async def loader():
        state['n'] += 1
        if state['n'] == 1:
            raise RuntimeError('boom')
        return 'fine'
    with raises(RuntimeError):
        await cache.get('k', loader)
    eq(await cache.get('k', loader), 'fine')

@test('keys are independent')
async def _():
    cache, loader, calls, _ = setup()
    await cache.get('a', loader)
    await cache.get('b', loader)
    eq(len(calls), 2)
`,
    hint: 'Store (value, fetched_at) per key and a dict of in-flight tasks per key (the single-flight idea). Decide by age: fresh → return; stale → return the old value and start (or join) a background task you track in a set; otherwise await the shared load task. Entries are written only when a load succeeds, so failures leave the old value alone. Retrieve the background task’s exception so asyncio does not warn.',
    solution: String.raw`import asyncio

class SWRCache:
    def __init__(self, ttl, swr, now):
        self.ttl, self.swr, self.now = ttl, swr, now
        self.entries = {}      # key -> (value, fetched_at)
        self.inflight = {}     # key -> task
        self.background = set()

    def _load(self, key, loader):
        task = self.inflight.get(key)
        if task is None:
            async def run():
                try:
                    value = await loader()
                    self.entries[key] = (value, self.now())
                    return value
                finally:
                    self.inflight.pop(key, None)
            task = self.inflight[key] = asyncio.ensure_future(run())
        return task

    async def get(self, key, loader):
        entry = self.entries.get(key)
        if entry is not None:
            age = self.now() - entry[1]
            if age < self.ttl:
                return entry[0]
            if age < self.ttl + self.swr:
                task = self._load(key, loader)
                self.background.add(task)
                task.add_done_callback(self.background.discard)
                task.add_done_callback(lambda t: t.cancelled() or t.exception())
                return entry[0]
        return await asyncio.shield(self._load(key, loader))

    async def idle(self):
        await asyncio.gather(*list(self.background), return_exceptions=True)`,
    notes: 'This is Cache-Control: max-age=ttl, stale-while-revalidate=swr implemented in-process. It hides latency from users, absorbs upstream slowness, and (with the single-flight behaviour) prevents a stampede when a hot key expires. Add stale-if-error to serve old data during an upstream outage.',
  },

  cas_store: {
    title: 'Compare-and-swap cloud saves', minutes: 30, level: 'hard',
    prompt: `<p>A study app (or a game) keeps one progress snapshot per user in the cloud and syncs from several devices. The <b>server's generation counter</b> (never a device clock) decides ordering. Implement <code>class SaveStore</code> with <code>save(user, expected_generation, state, format_version, content_hash)</code> returning <code>{'status', 'generation'}</code>, and <code>load(user)</code> returning the stored state or <code>None</code>. Rules, in order:</p>
<ol><li>No row yet: if <code>expected_generation</code> is <code>None</code> insert at generation 1 → <code>'ok'</code>; otherwise <code>'conflict'</code> (generation <code>None</code>).</li><li>The caller's <code>format_version</code> is older than the row's → <code>'stale_client'</code> (the current generation; never overwrite a newer format).</li><li>The row already has the same <code>content_hash</code> → <code>'unchanged'</code> (nothing written, generation unchanged).</li><li><code>expected_generation</code> differs from the current generation → <code>'conflict'</code> with the <b>current</b> generation.</li><li>Otherwise store it, increment the generation → <code>'ok'</code> with the new generation.</li></ol><p>Users are fully isolated from each other.</p>`,
    starter: String.raw`class SaveStore:
    def __init__(self):
        pass

    def save(self, user, expected_generation, state, format_version, content_hash):
        pass

    def load(self, user):
        pass
`,
    tests: String.raw`def put(store, user, gen, state, h, fmt=1):
    return store.save(user, gen, state, fmt, h)

test('the first save inserts generation 1', lambda: eq(put(SaveStore(), 'u', None, {'xp': 1}, 'h1'), {'status': 'ok', 'generation': 1}))
test('a first save that expects a row is a conflict', lambda: eq(put(SaveStore(), 'u', 3, {'xp': 1}, 'h1'), {'status': 'conflict', 'generation': None}))

@test('sequential saves advance the generation')
def _():
    s = SaveStore()
    put(s, 'u', None, {'xp': 1}, 'h1')
    eq(put(s, 'u', 1, {'xp': 2}, 'h2'), {'status': 'ok', 'generation': 2})
    eq(s.load('u'), {'xp': 2})

@test('a stale writer gets a conflict and cannot overwrite')
def _():
    s = SaveStore()
    put(s, 'u', None, {'xp': 1}, 'h1')
    put(s, 'u', 1, {'xp': 5}, 'h5')                      # device A moves to generation 2
    eq(put(s, 'u', 1, {'xp': 9}, 'h9'), {'status': 'conflict', 'generation': 2})   # device B still thinks generation 1
    eq(s.load('u'), {'xp': 5})

@test('an identical snapshot is unchanged and costs no generation')
def _():
    s = SaveStore()
    put(s, 'u', None, {'xp': 1}, 'h1')
    eq(put(s, 'u', 1, {'xp': 1}, 'h1'), {'status': 'unchanged', 'generation': 1})
    eq(put(s, 'u', 1, {'xp': 2}, 'h2'), {'status': 'ok', 'generation': 2})

@test('unchanged is reported even if the caller is behind')
def _():
    s = SaveStore()
    put(s, 'u', None, {'xp': 1}, 'h1')
    put(s, 'u', 1, {'xp': 2}, 'h2')
    eq(put(s, 'u', 1, {'xp': 2}, 'h2'), {'status': 'unchanged', 'generation': 2})

@test('an older client cannot overwrite a newer format')
def _():
    s = SaveStore()
    put(s, 'u', None, {'xp': 1, 'new': True}, 'h1', fmt=2)
    eq(put(s, 'u', 1, {'xp': 7}, 'h7', fmt=1), {'status': 'stale_client', 'generation': 1})
    eq(s.load('u'), {'xp': 1, 'new': True})

@test('users are isolated')
def _():
    s = SaveStore()
    put(s, 'a', None, {'owner': 'a'}, 'ha')
    eq(put(s, 'b', None, {'owner': 'b'}, 'hb'), {'status': 'ok', 'generation': 1})
    eq((s.load('a'), s.load('b'), s.load('nobody')), ({'owner': 'a'}, {'owner': 'b'}, None))

@test('the stored state is not aliased to the caller\'s object')
def _():
    s = SaveStore()
    state = {'xp': 1}
    put(s, 'u', None, state, 'h1')
    state['xp'] = 999
    eq(s.load('u'), {'xp': 1})
`,
    hint: 'Keep rows = {user: {state, generation, format_version, content_hash}}. Follow the five rules in order: missing row first, then the format check, then the unchanged check, then the generation check, then the update. Deep-copy the state on the way in.',
    solution: String.raw`import copy

class SaveStore:
    def __init__(self):
        self.rows = {}

    def save(self, user, expected_generation, state, format_version, content_hash):
        row = self.rows.get(user)
        if row is None:
            if expected_generation is not None:
                return {'status': 'conflict', 'generation': None}
            self.rows[user] = {'state': copy.deepcopy(state), 'generation': 1, 'format_version': format_version, 'content_hash': content_hash}
            return {'status': 'ok', 'generation': 1}
        if format_version < row['format_version']:
            return {'status': 'stale_client', 'generation': row['generation']}
        if row['content_hash'] == content_hash:
            return {'status': 'unchanged', 'generation': row['generation']}
        if expected_generation != row['generation']:
            return {'status': 'conflict', 'generation': row['generation']}
        row.update(state=copy.deepcopy(state), generation=row['generation'] + 1, format_version=format_version, content_hash=content_hash)
        return {'status': 'ok', 'generation': row['generation']}

    def load(self, user):
        row = self.rows.get(user)
        return copy.deepcopy(row['state']) if row else None`,
    notes: 'In Postgres this is a function that does the same update with WHERE generation = $expected, so the check and the write are one atomic statement. The key properties: the server decides ordering, a stale device is told rather than allowed to flatten newer data, and identical uploads cost nothing. Do not resolve a real conflict automatically by timestamps or by "bigger number wins": let the person choose.',
  },

  decide_sync: {
    title: 'Decide what a sync should do', minutes: 20, level: 'medium',
    prompt: `<p>The client has a local snapshot hash (<code>None</code> if nothing is saved locally), the hash it last synced successfully (<code>last_synced_hash</code>), the cloud generation it last saw (<code>last_generation</code>, <code>None</code> on a first sign-in), and the current cloud row <code>cloud</code> (<code>None</code> if there is none, otherwise <code>{'generation': int, 'hash': str}</code>). Write <code>decide_sync(local_hash, last_synced_hash, last_generation, cloud)</code> returning one of <code>'none'</code>, <code>'upload'</code>, <code>'download'</code>, <code>'conflict'</code>:</p>
<ul><li>No cloud row: <code>'upload'</code> if there is local data, else <code>'none'</code>.</li><li>Cloud row but nothing local: <code>'download'</code>.</li><li>Local and cloud hashes equal: <code>'none'</code>.</li><li>Otherwise, local changed = <code>local_hash != last_synced_hash</code>; cloud changed = <code>last_generation is None</code> or the generation differs from <code>last_generation</code>. Both changed → <code>'conflict'</code> (never pick automatically); only local → <code>'upload'</code>; only cloud → <code>'download'</code>; neither → <code>'none'</code>.</li></ul>`,
    starter: String.raw`def decide_sync(local_hash, last_synced_hash, last_generation, cloud):
    pass
`,
    tests: String.raw`C = lambda gen, h: {'generation': gen, 'hash': h}

CASES = [
    ('nothing anywhere', (None, None, None, None), 'none'),
    ('local only, never synced', ('L1', None, None, None), 'upload'),
    ('cloud only, new device', (None, None, None, C(3, 'C3')), 'download'),
    ('identical content', ('X', None, None, C(2, 'X')), 'none'),
    ('first sign-in with different data on both sides', ('L1', None, None, C(2, 'C2')), 'conflict'),
    ('I changed it, nobody else did', ('L2', 'L1', 4, C(4, 'L1')), 'upload'),
    ('someone else changed it, I did not', ('L1', 'L1', 4, C(5, 'C5')), 'download'),
    ('both changed since the last sync', ('L2', 'L1', 4, C(5, 'C5')), 'conflict'),
    ('nothing changed anywhere', ('L1', 'L1', 4, C(4, 'L1')), 'none'),
    ('cloud was deleted but I have data', ('L2', 'L1', 4, None), 'upload'),
]
for name, args, expected in CASES:
    test(name, lambda args=args, expected=expected: eq(decide_sync(*args), expected))
`,
    hint: 'Handle the three easy cases first (no cloud, no local, equal hashes). Then compute the two booleans and return based on the four combinations. Note that the conflict case must never auto-resolve.',
    solution: String.raw`def decide_sync(local_hash, last_synced_hash, last_generation, cloud):
    if cloud is None:
        return 'none' if local_hash is None else 'upload'
    if local_hash is None:
        return 'download'
    if local_hash == cloud['hash']:
        return 'none'
    local_changed = local_hash != last_synced_hash
    cloud_changed = last_generation is None or cloud['generation'] != last_generation
    if local_changed and cloud_changed:
        return 'conflict'
    if local_changed:
        return 'upload'
    if cloud_changed:
        return 'download'
    return 'none'`,
    notes: 'This is the three-way comparison at the heart of every sync engine (git does the same with a merge base). Comparing hashes instead of timestamps avoids device clock skew. A real client also refuses to apply remote state during a critical section, and offers an explicit "keep this device / use the cloud" choice on conflict.',
  },
});
window.resolveExercises();
