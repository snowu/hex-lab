/* Full-stack track: browser, edge, API, Postgres. Backend-first, grounded in a real stack
   (static page on GitHub Pages -> Cloudflare Worker -> Supabase auth + Postgres with row-level security). */
TRACKS.splice(5, 0, {
  id: 'fullstack', icon: '🌐', title: 'Full-Stack: Browser to Edge to Postgres',
  blurb: 'How a request really travels: HTTP caching and CORS, auth and row-level security, API design, edge/serverless (Cloudflare Workers), local-first sync, and the frontend topics a backend engineer must be fluent in.',
  lessons: [
    {
      id: 'fs-web-basics', title: 'HTTP, caching, CORS and cookies', minutes: 40,
      summary: 'What the browser, the CDN and your server each decide.',
      sections: [
        { type: 'text', html: `
<h3>A request, end to end</h3>
<pre><code>browser cache → (DNS, TCP, TLS) → CDN / edge cache → your app → database
     each layer can answer instead of the next one</code></pre>
<p>Most performance and many bugs come from not knowing <b>which layer answered</b>. Your tools: <code>Cache-Control</code>, validators (<code>ETag</code>), <code>Vary</code>, and the status code.</p>
<h3>Cache-Control in one table</h3>
<table><tr><th>Directive</th><th>Meaning</th></tr>
<tr><td><code>max-age=N</code></td><td>fresh for N seconds in any cache</td></tr>
<tr><td><code>s-maxage=N</code></td><td>same, but only for shared caches (CDNs); overrides max-age there</td></tr>
<tr><td><code>no-store</code></td><td>never keep a copy (sensitive data)</td></tr>
<tr><td><code>no-cache</code></td><td>may be kept, but <b>must revalidate</b> before every reuse (not “do not cache”)</td></tr>
<tr><td><code>private</code> / <code>public</code></td><td>only the user's browser vs also shared caches</td></tr>
<tr><td><code>immutable</code></td><td>never changes: skip revalidation (use with hashed file names)</td></tr>
<tr><td><code>stale-while-revalidate=N</code></td><td>serve stale for N more seconds while refreshing in the background</td></tr>
<tr><td><code>stale-if-error=N</code></td><td>serve stale if the origin is failing</td></tr></table>
<ul>
<li><b>Validators:</b> <code>ETag</code> + <code>If-None-Match</code> returns <code>304 Not Modified</code> with no body, so revalidation is cheap.</li>
<li><b>Vary:</b> lists request headers that change the response (<code>Accept-Encoding</code>, <code>Origin</code>). A cache keys on them. Never publicly cache a response that depends on <code>Authorization</code> or a cookie.</li>
<li><b>Cache busting:</b> a static host that serves <code>max-age=600</code> keeps yesterday's script on phones. Put a version in the URL (<code>app.js?v=&lt;commit&gt;</code> or a content hash in the file name) so every deploy is a new URL no cache can hold.</li>
<li><b>Version your cache keys</b> when the shape of a cached payload changes, or old objects will be served to new code.</li>
</ul>
<h3>CORS: what it is and is not</h3>
<p>The <b>same-origin policy</b> stops a page on origin A from reading responses from origin B. <b>CORS</b> is how B opts in. It protects the <b>user's browser</b>, not your server: curl ignores it. That is also why a public page cannot call a third-party API directly (it has no CORS headers and you cannot hide a secret in a page): a small backend does the call.</p>
<ul>
<li><b>Simple requests</b> (GET/HEAD/POST with plain content types, no custom headers) are sent directly; the browser then checks <code>Access-Control-Allow-Origin</code>.</li>
<li><b>Preflighted requests</b> (<code>PUT/DELETE</code>, <code>Authorization</code>, <code>Content-Type: application/json</code>) first send <code>OPTIONS</code> with <code>Access-Control-Request-Method/Headers</code>. Answer with allowed methods/headers and <code>Access-Control-Max-Age</code>.</li>
<li><b>Credentials:</b> cookies need <code>Access-Control-Allow-Credentials: true</code> and an <b>explicit</b> origin (never <code>*</code>). Never reflect any <code>Origin</code> back with credentials: any website could then read your users' private data.</li>
<li>Add <code>Vary: Origin</code> whenever the allowed origin varies.</li>
</ul>
<h3>Cookies and CSRF</h3>
<ul><li><code>HttpOnly</code> (JavaScript cannot read it, limiting XSS damage), <code>Secure</code> (HTTPS only), <code>SameSite=Lax|Strict|None</code> (cross-site sending), the <code>__Host-</code> prefix.</li><li><b>CSRF</b> exists because browsers attach cookies automatically. Defences: <code>SameSite</code>, anti-CSRF tokens, checking <code>Origin</code>. A bearer token in the <code>Authorization</code> header is not attached automatically, so it is not CSRF-prone (but it is exposed to XSS if kept in <code>localStorage</code>).</li></ul>
<h3>Status codes people mix up</h3>
<table><tr><th>Code</th><th>Use</th></tr>
<tr><td>401</td><td>not authenticated (no/invalid credentials)</td></tr><tr><td>403</td><td>authenticated but not allowed</td></tr>
<tr><td>404 / 410</td><td>not found / gone for good</td></tr><tr><td>409</td><td>conflict with current state (version mismatch, duplicate)</td></tr>
<tr><td>412</td><td>precondition failed (<code>If-Match</code> did not match)</td></tr><tr><td>422</td><td>well-formed but semantically invalid</td></tr>
<tr><td>429</td><td>rate limited; send <code>Retry-After</code></td></tr><tr><td>502 / 503 / 504</td><td>bad upstream / unavailable / upstream timeout</td></tr></table>` },
        { type: 'code', ref: 'cache_control' },
        { type: 'code', ref: 'cors' },
        { type: 'bug', pid: 'bug-cookie-cors', title: 'Spot the session and CORS mistakes', prompt: '<p>This endpoint logs a user in for a single-page app on another origin. Click the <b>2</b> lines that create a security hole.</p>',
          code: String.raw`def login(request, user):
    resp = jsonify({'ok': True})
    resp.set_cookie('session', create_session(user))
    resp.headers['Access-Control-Allow-Origin'] = request.headers['Origin']
    resp.headers['Access-Control-Allow-Credentials'] = 'true'
    return resp`,
          bugs: [{ line: 3, why: 'The session cookie has no <code>HttpOnly</code>, <code>Secure</code> or <code>SameSite</code> attributes: scripts can read it (XSS steals the session), it can travel over HTTP, and it is attached to cross-site requests (CSRF).' },
                 { line: 4, why: 'Reflecting <b>whatever Origin the request sent</b> is the same as allowing every website. Combined with credentials (next line) any malicious page can make the victim’s browser call this API with their cookie and <b>read the response</b>. Allow-list exact origins.' }],
          ok: [5], hint: 'One line is about how the cookie is protected. The other is about who may read authenticated responses.' },
        { type: 'quiz', q: 'A response has Cache-Control: no-cache. What does the browser do?',
          options: ['Never stores it', 'May store it, but must revalidate with the server (for example with an ETag) before reusing it', 'Stores it for one hour', 'Ignores the header unless it is HTTPS'],
          answer: 1, explain: 'no-store forbids keeping a copy. no-cache allows a copy but forces revalidation on every use, which is cheap with a 304 Not Modified.' },
        { type: 'quiz', q: 'A teammate says “we enabled CORS so the API is now secure against other sites”. What is wrong with that?',
          options: ['Nothing, CORS is an authentication mechanism', 'CORS only tells browsers which origins may read responses; it is not authentication and does not stop curl or a server-side attacker. You still need real auth and authorisation', 'CORS only applies to GET', 'CORS makes requests slower but safer'],
          answer: 1, explain: 'CORS relaxes the browser’s same-origin policy for specific origins. It is not an access control mechanism for the server.' },
        { type: 'quiz', q: 'Your single-page app stores its API bearer token in localStorage. What is the main risk compared with an HttpOnly cookie?',
          options: ['localStorage is slower', 'Any XSS (including a compromised third-party script) can read the token and exfiltrate it', 'Bearer tokens cannot be sent cross-origin', 'localStorage is cleared on refresh'],
          answer: 1, explain: 'HttpOnly cookies are invisible to JavaScript, while anything in localStorage is readable by every script on the page. The trade-off: cookies need CSRF protection. Short-lived tokens and a strict CSP reduce the risk either way.' },
      ],
    },
    {
      id: 'fs-auth', title: 'Auth: sessions, JWTs, OAuth and row-level security', minutes: 45,
      summary: 'Authentication vs authorisation, verifying tokens correctly, and letting the database enforce tenancy.',
      sections: [
        { type: 'text', html: `
<p><b>Authentication</b> answers “who are you?”; <b>authorisation</b> answers “what may you do?”. Most real breaches are authorisation bugs (the BOLA/IDOR from the code-review lesson), not broken login.</p>
<h3>Sessions vs tokens</h3>
<table><tr><th></th><th>Server session (cookie id)</th><th>Signed token (JWT)</th></tr>
<tr><td>State</td><td>stored on the server</td><td>self-contained, stateless to verify</td></tr>
<tr><td>Revocation</td><td>delete the session: instant</td><td>hard: valid until it expires</td></tr>
<tr><td>Scaling</td><td>needs a shared session store</td><td>any service with the key can verify</td></tr>
<tr><td>Typical fit</td><td>one web app and its backend</td><td>many services, mobile, third-party APIs</td></tr></table>
<h3>Verifying a JWT correctly</h3>
<ol>
<li>Parse the three parts: <code>header.payload.signature</code> (base64url JSON).</li>
<li><b>Choose the algorithm yourself</b>: never trust the header's <code>alg</code> (the <code>none</code> and algorithm-confusion attacks).</li>
<li>Verify the signature (HMAC with a shared secret, or RSA/ECDSA with the issuer's public key from its <b>JWKS</b>, handling key rotation).</li>
<li>Check the claims: <code>exp</code> (required), <code>nbf</code>, <code>iss</code>, <code>aud</code>, and a little clock skew.</li>
<li>Only then read <code>sub</code>.</li>
</ol>
<p>Because a JWT cannot be revoked, keep access tokens <b>short-lived</b> and use a refresh token (stored more carefully, rotated on use) to get new ones.</p>
<h3>OAuth 2.0 / OpenID Connect in one paragraph</h3>
<p>For browser and mobile apps use the <b>authorization code flow with PKCE</b>: the app sends the user to the identity provider with a hashed <code>code_challenge</code>; after login the provider redirects back with a one-time <code>code</code>; the app exchanges it, proving possession with the original <code>code_verifier</code>, for tokens. PKCE means an intercepted code is useless. OIDC adds an <b>ID token</b> (who the user is) on top of OAuth's <b>access token</b> (what the app may call). Do not use the implicit flow.</p>
<h3>Passwordless: email code vs magic link</h3>
<p>A magic link with PKCE depends on a verifier stored in the browser that <i>requested</i> it, so opening the email on a different device fails. A <b>typed one-time code</b> works on whichever device you are on. (This is the reason a cross-device cloud save should sign in with a code.) Rate-limit code attempts and keep codes short-lived.</p>
<h3>Row-level security: the database as the tenant boundary</h3>
<p>With Supabase the browser holds a <b>publishable (anon) key</b> that only identifies the project, plus the user's own JWT. PostgREST sets the JWT claims for the query, and <b>RLS policies</b> decide which rows are visible:</p>
<pre><code>alter table notes enable row level security;
create policy "own rows" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);</code></pre>
<ul>
<li>Even if an API route forgets a <code>WHERE user_id = ...</code>, the database still refuses other tenants' rows. Defence in depth for BOLA.</li>
<li>The <b>service-role key bypasses RLS</b>: never ship it to a browser or commit it. Only a trusted server may hold it.</li>
<li>A common pattern: a thin backend (a Worker) that holds secrets and <b>forwards the user's JWT</b> to the database, so RLS still applies instead of the backend acting as an all-powerful user.</li>
<li>Write functions as <code>security invoker</code> so they run with the caller's permissions, and <code>revoke execute ... from public, anon</code>.</li>
</ul>` },
        { type: 'code', ref: 'jwt' },
        { type: 'bug', pid: 'bug-jwt', title: 'Spot the token-handling mistakes', prompt: '<p>An assistant wrote this user lookup for a JWT bearer token. Click the <b>2</b> lines an attacker can abuse.</p>',
          code: String.raw`def current_user(token):
    header = json.loads(b64d(token.split('.')[0]))
    claims = json.loads(b64d(token.split('.')[1]))
    if header['alg'] != 'none' and not verify(token, SECRET, header['alg']):
        raise Unauthorized()
    return claims['sub']`,
          bugs: [{ line: 4, why: 'The <b>token chooses its own algorithm</b>: <code>alg: none</code> skips verification entirely, and a forged header can steer you into a weaker or confused algorithm. The server must decide the algorithm (and the key) itself.' },
                 { line: 6, why: 'Returns <code>sub</code> without checking <code>exp</code>, <code>nbf</code>, <code>iss</code> or <code>aud</code>: expired tokens and tokens issued for another service are accepted forever.' }],
          ok: [2, 3], hint: 'One line trusts the attacker for how verification works. The other trusts a token that may be stale or meant for someone else.' },
        { type: 'quiz', q: 'A user’s laptop is stolen. Their access token is a JWT valid for 24 hours and there is no server-side session list. What is the best mitigation going forward?',
          options: ['Nothing can be done', 'Use short-lived access tokens (minutes) plus revocable refresh tokens, so a stolen session expires quickly and can be cut off', 'Make the JWT secret longer', 'Store JWTs in localStorage'],
          answer: 1, explain: 'Stateless tokens cannot be revoked individually. Short lifetimes bound the damage, and the refresh token (server-tracked) is the revocation point.' },
        { type: 'quiz', q: 'Your Worker needs to read the signed-in user’s saved items from Postgres. Which design best contains a bug in your route code?',
          options: ['Use the service-role key and filter by user_id in code', 'Forward the user’s JWT to the database with the anon key so row-level security enforces user_id = auth.uid() even if the route forgets a filter', 'Make the table public and hide the URL', 'Read all rows and filter in the browser'],
          answer: 1, explain: 'With the service-role key one missed WHERE clause leaks every tenant’s data. With the user’s JWT plus RLS the database refuses other tenants’ rows regardless of the route.' },
        { type: 'quiz', q: 'Why is the Supabase “anon / publishable” key safe to put in a public web page, while the service-role key is not?',
          options: ['The anon key is encrypted', 'The anon key only identifies the project and grants whatever RLS allows an unauthenticated or signed-in user; the service-role key bypasses RLS entirely', 'The service-role key expires daily', 'There is no difference'],
          answer: 1, explain: 'Security comes from RLS policies, not from hiding the project key. The service-role key skips RLS, so leaking it hands over every row.' },
      ],
    },
    {
      id: 'fs-api-design', title: 'API design that survives its clients', minutes: 35,
      summary: 'Pagination, idempotency, errors, versioning, and the backend-for-frontend pattern.',
      sections: [
        { type: 'text', html: `
<h3>Resources and verbs</h3>
<p>Model nouns, not actions: <code>POST /payments</code>, <code>GET /payments/{id}</code>, <code>PATCH /payments/{id}</code>. Use verbs for the HTTP method, status codes for the outcome, and keep responses consistent. <b>PUT</b> (full replace) and <b>DELETE</b> are naturally idempotent; <b>POST</b> is not, so accept an <code>Idempotency-Key</code> (see the Reliability track).</p>
<h3>Pagination</h3>
<ul><li><b>Offset</b> (<code>?page=500</code>) gets slower as pages get deeper and skips or repeats rows when data changes.</li><li><b>Keyset / cursor</b>: <code>?after=&lt;opaque cursor&gt;</code> with a stable sort (including a unique tiebreaker). Fast on any page, stable under inserts. Make the cursor opaque and signed so you can change internals and clients cannot forge it.</li></ul>
<h3>Errors</h3>
<p>One predictable shape, such as <code>{ "error": "kind", "message": "..." }</code> or RFC 9457 <code>application/problem+json</code>. Classify them for callers (<code>user_auth</code>, <code>forbidden</code>, <code>not_found</code>, <code>quota</code>, <code>upstream</code>) so a client knows whether to re-login, retry or give up, and map upstream failures to 502/503 instead of leaking them.</p>
<h3>Concurrency control over HTTP</h3>
<p>Return an <code>ETag</code>; the client sends <code>If-Match</code> on update; a mismatch returns <b>412</b>. This is optimistic locking for APIs, the same idea as a <code>version</code> or <code>generation</code> column.</p>
<h3>Evolving an API</h3>
<ul><li>Additive changes (new optional fields) are safe. Removing or renaming a field is breaking.</li><li>Clients must ignore unknown fields. Servers should tolerate old clients for a while.</li><li>Version when you must (<code>/v2</code> or a header) and deprecate with dates and metrics on who still uses the old one.</li><li>Document with OpenAPI, and test the contract.</li></ul>
<h3>Backend for frontend</h3>
<p>A small server-side layer that exists to serve one frontend: it <b>holds secrets</b>, <b>works around CORS</b> to third-party APIs, <b>aggregates</b> several calls into one, <b>caches</b> shared data, and shapes responses for the UI. A serverless function at the edge is a natural fit. Keep it thin: it should not become a second monolith.</p>
<p><b>REST vs GraphQL vs RPC:</b> REST is simple, cacheable and ubiquitous; GraphQL lets clients ask for exactly what they need (at the cost of caching, N+1 and query-cost control); RPC (gRPC) is efficient between services.</p>` },
        { type: 'code', ref: 'paginate' },
        { type: 'quiz', q: 'A client updates a record with PUT, but another user changed it a minute ago and the client had the old copy. Which mechanism prevents silently overwriting?',
          options: ['Rate limiting', 'An ETag/version: the client sends If-Match, and the server returns 412 Precondition Failed when it no longer matches', 'Using POST instead of PUT', 'A longer timeout'],
          answer: 1, explain: 'Optimistic concurrency: the update is conditional on the version the client last saw. The same idea as compare-and-swap with a generation number.' },
        { type: 'quiz', q: 'Which response code best fits “you sent valid JSON, but the end date is before the start date”?',
          options: ['400 or 422 with a clear field-level error (422 if you separate syntax from semantics)', '500', '404', '401'],
          answer: 0, explain: 'It is the client’s mistake, not the server’s. Return a 4xx with a machine-readable error naming the field.' },
        { type: 'quiz', q: 'Why make a pagination cursor opaque and signed?',
          options: ['It is shorter', 'So you can change the underlying sort/keys later without breaking clients, and so clients cannot forge positions to probe data', 'Browsers require it', 'It makes responses cacheable forever'],
          answer: 1, explain: 'Clients should treat the cursor as a black box. A signature (HMAC) stops tampering and enumeration tricks.' },
      ],
    },
    {
      id: 'fs-edge', title: 'Edge and serverless: Cloudflare Workers, KV, Durable Objects', minutes: 45,
      summary: 'What runs where, which storage to pick, and how to protect an upstream with caching and coalescing.',
      sections: [
        { type: 'text', html: `
<h3>How Workers run</h3>
<p>A Cloudflare Worker is JavaScript/WASM running in a lightweight <b>V8 isolate</b> in a data centre near the user: very small cold starts, no servers to manage, billed per request and CPU time. The trade-offs: <b>tight CPU-time and memory limits</b> (check the plan's numbers), no guarantee that in-memory state survives between requests, and you reach everything else through <b>bindings</b>.</p>
<h3>Choosing the right primitive</h3>
<table><tr><th>Need</th><th>Use</th><th>Why / watch out</th></tr>
<tr><td>Cache public HTTP responses</td><td><b>Cache API</b></td><td>Per-data-centre cache of whole responses with TTLs; does not consume KV operations</td></tr>
<tr><td>Read-heavy config, credentials, small lookups</td><td><b>KV</b></td><td>Globally distributed but <b>eventually consistent</b>; great for reads, wrong for counters or coordination</td></tr>
<tr><td>Coordination, per-user/per-room state, rate limiters, WebSockets, scheduled work</td><td><b>Durable Objects</b></td><td>One instance per id, single-threaded, <b>strongly consistent</b> storage, alarms. The “single writer” answer</td></tr>
<tr><td>Relational data at the edge</td><td><b>D1</b> (SQLite)</td><td>Serverless SQL; mind write location and replication</td></tr>
<tr><td>Files and blobs</td><td><b>R2</b></td><td>S3-compatible object storage</td></tr>
<tr><td>Async work, retries, fan-out</td><td><b>Queues</b></td><td>At-least-once delivery: idempotent consumers</td></tr>
<tr><td>Periodic jobs</td><td><b>Cron Triggers</b></td><td>Good for polling, cleanup, keep-alive pings</td></tr>
<tr><td>Metrics at high volume</td><td><b>Analytics Engine</b></td><td>Cheap write-only datapoints you query with SQL</td></tr></table>
<h3>Patterns you can name in an interview</h3>
<ul>
<li><b>Shared cache with explicit TTLs</b> per payload: seconds for live data (arrivals), minutes for a whole-city feed, days for data that barely changes. Put a <b>version in the cache key</b> and bump it when the parsed shape changes.</li>
<li><b>Fan-in polling:</b> instead of N users each calling an upstream API, route them to one Durable Object per resource that polls once and shares the result (single-flight at global scale). The upstream sees one caller.</li>
<li><b>Per-user background jobs</b> as a Durable Object with an alarm (for example “check every two minutes and push a notification”). Alarms are <b>best effort</b>, not exact clocks: design for late or retried runs and expire stale pushes.</li>
<li><b>Credentials in KV with an expiry shorter than the token’s</b> (login expiry minus a minute) plus isolate memory, so one login serves everyone.</li>
<li><b>JWT passthrough:</b> verify nothing yourself where the database can do it; forward the user’s token so row-level security applies.</li>
<li><b>Keep-alive cron</b> for free-tier databases that pause when idle.</li>
<li><b>Budget and quota awareness:</b> an upstream with a daily quota is protected by caching and coalescing, and a plan that rejects instead of billing at the limit caps cost.</li>
</ul>
<div class="callout"><b>Interview framing:</b> “The Worker exists because a public page cannot hold credentials and cannot call the upstream directly (CORS). It stays thin: auth check, cache lookup, upstream call, shape the response. State that must be correct lives in Postgres or a Durable Object, not in the isolate’s memory.”</div>` },
        { type: 'sim', pid: 'sim-edgecache', id: 'edgecache', title: 'Many viewers, one upstream', intro: '<p>Hundreds of phones refresh the same live data. Compare four strategies and watch how many calls reach the upstream API, and what users experience. The chart shows upstream calls per second for one simulated minute.</p>',
          try: ['<b>no cache</b>: every poll becomes an upstream call. Raise the viewers and watch the quota burn.', '<b>TTL cache</b>: most requests are cache hits, but look for spikes when the entry expires: all the viewers who arrive during the refresh each trigger a call (a stampede).', '<b>+ single-flight</b>: exactly one call per refresh, but the unlucky viewers wait for it.', '<b>stale-while-revalidate</b>: nobody waits after the first request, because old data is served instantly while one refresh runs in the background. Compare the data age.', 'Make the upstream slow (2000 ms) and see which strategies hurt users.'] },
        { type: 'code', ref: 'single_flight' },
        { type: 'code', ref: 'swr_cache' },
        { type: 'quiz', q: 'You need a global rate limiter that must never allow more than 100 requests per minute per API key, even across edge locations. Which primitive fits?',
          options: ['KV, because it is globally replicated', 'A Durable Object per API key: one single-threaded, strongly consistent counter all requests are routed through', 'The Cache API', 'Isolate memory'],
          answer: 1, explain: 'KV is eventually consistent, so concurrent requests would each read a stale count. A Durable Object serialises access to one instance per key, giving a correct counter at the cost of routing to that object.' },
        { type: 'quiz', q: 'A Durable Object alarm is scheduled every 2 minutes to check bus arrivals and push a notification. What should the design assume?',
          options: ['It fires at exactly the scheduled instant', 'Alarms are best effort: runs can be late or retried, so each push should expire quickly and processing must be idempotent', 'It never fails', 'It runs only while the user’s page is open'],
          answer: 1, explain: 'Scheduling guarantees are “at least once, roughly on time”. Alert content that is stale after a couple of minutes should carry a short expiry, and repeated runs must not duplicate effects.' },
        { type: 'quiz', q: 'You cache a parsed upstream response in the Cache API. A later deploy changes the shape of the parsed object. What prevents new code from reading old cached objects?',
          options: ['Nothing, flush manually', 'Include a cache version in the key and bump it when the shape changes', 'Shorter TTLs everywhere', 'Disable the cache'],
          answer: 1, explain: 'Versioned keys make old entries unreachable by new code, and they expire on their own.' },
      ],
    },
    {
      id: 'fs-offline-sync', title: 'Local-first apps and cross-device sync', minutes: 45,
      summary: 'Save locally first, sync with compare-and-swap, never silently overwrite.',
      sections: [
        { type: 'text', html: `
<p><b>Local-first</b> means the app works fully offline, writes to local storage immediately, and treats the cloud as optional sync. It is faster, more resilient, and the user never loses progress to a network error.</p>
<h3>The coordinator pattern</h3>
<ol>
<li><b>Save locally, synchronously</b> at every save point. This must never depend on the network.</li>
<li>Mark the snapshot <b>dirty</b>; <b>debounce</b> an upload (seconds), and flush at reliable checkpoints. Do not rely on <code>beforeunload</code> for network calls.</li>
<li>Hash the serialised snapshot and <b>skip uploads that changed nothing</b>.</li>
<li>Retry with backoff when offline; show a quiet status (“Saved on this device”, “Synced”).</li>
</ol>
<h3>Ordering with a server-side generation</h3>
<p>Every cloud row has a <b>monotonic generation</b> controlled by the server. An upload says <i>“I am replacing generation N”</i>. The database applies it only if N is still current (<code>UPDATE ... WHERE generation = N</code>), otherwise it reports a <b>conflict</b>. The server, not a device clock, decides the order, and a stale device is told rather than allowed to overwrite newer data. This is compare-and-swap, the same idea as <code>If-Match</code>.</p>
<h3>Conflicts</h3>
<ul>
<li><b>Last write wins</b> by timestamp loses data and trusts clocks that disagree. Avoid it for anything valuable.</li>
<li><b>Never auto-pick “the bigger one”</b> (more XP, higher level, later day): any of those can legitimately go backwards.</li>
<li>When both sides changed since the last sync, <b>show both and let the person choose</b> (continue this device / use the cloud / keep offline).</li>
<li>Field-level <b>merge</b> or <b>CRDTs</b> work when data has no cross-field invariants (collaborative text, counters). For a snapshot with invariants, merge only if you can prove they hold.</li>
<li>Never replace state that is in active use (mid-game, mid-edit). Resolve at a safe point.</li>
</ul>
<h3>Details that bite</h3>
<ul>
<li><b>Resetting</b> must also go through the sync path, or an older cloud snapshot comes back on the next load.</li>
<li>A <b>stale client</b> (older format) must not overwrite a newer format: store a format/schema version and enforce it server-side.</li>
<li>Persist a random <b>device id</b> separately from the data. Reconcile on account switch rather than uploading the previous account’s data.</li>
<li><b>Be careful with strict constraints</b> on columns clients write (an over-tight regex on a hash broke real installs once). Keep integrity limits to what you must enforce, such as a payload size cap.</li>
<li>Installed web apps (PWAs) keep running old code: keep a compatibility shim for the previous API shape until old clients are gone.</li>
<li>Passwordless sign-in by typed email code works across devices; magic links may not.</li>
</ul>
<h3>Service workers and storage</h3>
<p>A service worker intercepts fetches to serve cached assets offline (cache-first for static files, network-first or stale-while-revalidate for data). <code>localStorage</code> is synchronous and small (a few MB); use IndexedDB for larger data. Browsers may evict storage under pressure unless you request persistence.</p>` },
        { type: 'code', ref: 'cas_store' },
        { type: 'code', ref: 'decide_sync' },
        { type: 'bug', pid: 'bug-sync', title: 'Spot the sync bugs', prompt: '<p>This is a first draft of a sync routine. Click the <b>2</b> lines that can silently destroy a user’s progress.</p>',
          code: String.raw`def sync(local, cloud):
    remote = cloud.fetch()
    if remote.updated_at > local.updated_at:
        local.replace(remote.state)
    else:
        cloud.upload(local.state, expected=remote.generation)`,
          bugs: [{ line: 3, why: 'Decides by comparing <b>wall-clock timestamps from different devices</b>. Clocks disagree, and a newer timestamp does not mean more or better progress. Compare content hashes and generations, and only the server’s generation orders writes.' },
                 { line: 4, why: 'Overwrites local state <b>silently</b>, even if it has unsynced changes (and possibly while it is in use). If both sides changed, this destroys the local progress. A real conflict needs an explicit choice at a safe moment.' }],
          ok: [6], hint: 'One line trusts something that cannot be trusted to order events. The other replaces data nobody agreed to replace.' },
        { type: 'quiz', q: 'Two devices both edited offline and then reconnect. The cloud row has a newer generation than device A last saw, and A also has local edits. What should A do?',
          options: ['Upload anyway: the latest device wins', 'Report a conflict and let the user choose between this device and the cloud copy (never overwrite automatically)', 'Download the cloud copy and discard local edits', 'Merge the numbers field by field and upload'],
          answer: 1, explain: 'Both sides changed, so neither automatic choice is safe. Compare hashes, detect the conflict with the generation, and ask. Merge only when you can prove the invariants.' },
        { type: 'quiz', q: 'A player resets their game on device A while signed in. Later device B (still holding the old cloud snapshot in its cache) syncs. What must the reset have done so the old data does not come back?',
          options: ['Nothing, deleting local data is enough', 'Written the new empty state through the compare-and-swap path (or a tombstone), so the cloud generation moved on', 'Cleared the browser cache on device B', 'Waited one hour'],
          answer: 1, explain: 'If the reset is only local, the unchanged cloud snapshot is still the newest thing the server knows and reappears. Reset must be a normal, ordered write.' },
        { type: 'quiz', q: 'Why hash the snapshot and skip the upload when the hash has not changed?',
          options: ['Hashes are encrypted', 'UI-only changes often hit the same save path; skipping identical uploads saves generations, bandwidth and battery, and avoids pointless conflicts', 'The database cannot store duplicates', 'It makes uploads atomic'],
          answer: 1, explain: 'Idempotent, content-addressed uploads are cheap to retry and keep the server’s generation meaningful.' },
      ],
    },
    {
      id: 'fs-frontend', title: 'Frontend fundamentals for backend engineers', minutes: 40,
      summary: 'Rendering models, Core Web Vitals, state, accessibility and the security basics.',
      sections: [
        { type: 'text', html: `
<h3>Rendering models</h3>
<table><tr><th>Model</th><th>HTML comes from</th><th>Good for</th><th>Cost</th></tr>
<tr><td><b>CSR</b> (client-side)</td><td>JavaScript builds the page in the browser</td><td>app-like UIs behind a login</td><td>slow first paint, SEO needs care</td></tr>
<tr><td><b>SSR</b> (server-side)</td><td>server renders each request</td><td>fresh, personalised, SEO</td><td>server work per request; hydration</td></tr>
<tr><td><b>SSG</b> (static)</td><td>built ahead of time, served from a CDN</td><td>docs, marketing, blogs</td><td>rebuild to change</td></tr>
<tr><td><b>ISR / edge rendering</b></td><td>static plus background regeneration, or rendered at the edge</td><td>mostly static with some freshness</td><td>more moving parts</td></tr></table>
<p><b>Hydration</b> attaches JavaScript to server-rendered HTML so it becomes interactive; it costs bytes and CPU. A no-framework page with one ES module and CDN scripts is perfectly valid for small tools: fewer moving parts, trivial deploys.</p>
<h3>Performance: what users feel</h3>
<ul><li><b>Core Web Vitals:</b> <b>LCP</b> (largest content shown, good ≤ 2.5 s), <b>INP</b> (responsiveness to interactions, good ≤ 200 ms), <b>CLS</b> (layout shift, good ≤ 0.1).</li><li>Ship less JavaScript: code-split, lazy-load rarely used libraries (load the auth/sync SDK only when someone signs in), compress, cache hashed assets for a year.</li><li>Avoid layout shift: reserve space for images and embeds. Avoid long main-thread tasks: chunk or move work to a Web Worker (as this site does for Python).</li><li>Measure with real-user data and Lighthouse, not guesses.</li></ul>
<h3>State</h3>
<ul><li><b>Server state</b> (data that lives on the backend and goes stale) is different from <b>UI state</b> (an open menu). Use a cache layer with invalidation for the first (stale-while-revalidate again), plain local state for the second.</li><li><b>Optimistic updates:</b> update the UI immediately, send the request, roll back on failure. Pair with idempotent endpoints.</li><li>Handle all four states in every view: loading, empty, error, success. Handle out-of-order responses (cancel the old request with <code>AbortController</code>).</li></ul>
<h3>Accessibility essentials</h3>
<ul><li>Semantic HTML first (<code>button</code>, <code>a</code>, <code>label</code>, headings). ARIA only to fill gaps.</li><li>Everything reachable and usable by keyboard with a visible focus. Sufficient colour contrast. Alt text. Respect <code>prefers-reduced-motion</code> and <code>prefers-color-scheme</code>.</li></ul>
<h3>Security basics</h3>
<ul>
<li><b>XSS:</b> never put untrusted data into HTML with <code>innerHTML</code>; use <code>textContent</code> or a framework’s escaping, and sanitise if you must render HTML. Add a <b>Content-Security-Policy</b> to limit what scripts may run.</li>
<li>Third-party scripts have full access to the page: pin versions, use Subresource Integrity, keep them few.</li>
<li><b>CSRF</b> applies to cookie auth (see the HTTP lesson). Validate input on the server; client checks are only UX.</li>
<li>Never put secrets in frontend code: it is public by definition. Public project keys are fine if authorisation is enforced server-side.</li>
</ul>
<h3>Testing and delivery</h3>
<p>Many fast unit tests, some component tests, a few end-to-end tests with a real browser (Playwright) for the critical flows. Treat the build, the cache-busting strategy and the deployment as part of the product.</p>` },
        { type: 'bug', pid: 'bug-xss', title: 'Spot the frontend bugs', prompt: '<p>A search box calls an API and renders the results. This is JavaScript (frontend code). Click the <b>2</b> lines that are wrong.</p>',
          code: String.raw`async function onSearch(q) {
  const res = await fetch('/api/search?q=' + q);
  const data = await res.json();
  results.innerHTML = data.items.map((i) => '<li>' + i.title + '</li>').join('');
}`,
          bugs: [{ line: 2, why: 'The query is concatenated into the URL without <code>encodeURIComponent(q)</code>: characters like <code>&amp;</code>, <code>#</code> or spaces change the request and can inject extra parameters.' },
                 { line: 4, why: '<code>innerHTML</code> with untrusted titles is <b>stored/reflected XSS</b>: a title containing <code>&lt;img onerror=…&gt;</code> runs script as your site. Build elements with <code>textContent</code> (or escape/sanitise).' }],
          ok: [3], hint: 'One line builds a URL from user input; the other builds HTML from server data. (A third problem, out-of-order responses, is a good extra to mention: cancel old requests with AbortController.)' },
        { type: 'quiz', q: 'A marketing page rarely changes and must load instantly worldwide with good SEO. Which rendering approach fits best?',
          options: ['Client-side rendering with a large bundle', 'Static generation (SSG) served from a CDN', 'Server-side rendering on every request from one region', 'A WebSocket per visitor'],
          answer: 1, explain: 'Pre-built HTML from a CDN has the lowest latency and no server work. Rebuild when content changes.' },
        { type: 'quiz', q: 'Users report the page “jumps” as images load and the Cumulative Layout Shift score is poor. What is the usual fix?',
          options: ['Use a faster server', 'Reserve space (width/height or aspect-ratio) for images, embeds and late-loading content', 'Disable caching', 'Convert images to PNG'],
          answer: 1, explain: 'CLS measures unexpected movement. If the browser knows the size up front, nothing shifts when the content arrives.' },
        { type: 'quiz', q: 'You fire search requests on every keystroke and sometimes an older response arrives after a newer one and overwrites the results. What fixes it?',
          options: ['Add a sleep', 'Cancel the previous request with AbortController (and ignore stale responses), optionally debouncing input', 'Use POST instead of GET', 'Increase the server timeout'],
          answer: 1, explain: 'Responses can arrive out of order. Abort the superseded request or tag each request and ignore the outdated one.' },
        { type: 'quiz', q: 'Which statement about secrets in frontend code is correct?',
          options: ['Minified code hides them well enough', 'Anything shipped to the browser is public; keep secrets on a server, and rely on server-side authorisation for public keys', 'Environment variables in the build keep them private', 'Base64 encoding protects them'],
          answer: 1, explain: 'Build-time variables end up in the bundle. A public project identifier is fine only because authorisation is enforced elsewhere.' },
        { type: 'reveal', title: 'Questions to practise out loud', html: `<ul><li>“Walk me through what happens when I type a URL and press enter.” (DNS, TLS, HTTP caching layers, rendering, then what changes with a CDN and with SSR)</li><li>“How would you design authentication for a single-page app with a serverless backend?” (code flow with PKCE or passwordless code, short-lived tokens, where tokens live, RLS or server-side authorisation)</li><li>“Your page is slow on phones. How do you investigate?” (field data vs lab, bundle, main thread, images, caching)</li><li>“A user sees another user’s data. What do you check first?” (cache key and Vary, shared cache with private data, missing tenant filter/RLS, session handling)</li><li>“Design an offline-first notes app that syncs.” (see the sync lesson and the design lab)</li></ul>` },
      ],
    },
  ],
});
