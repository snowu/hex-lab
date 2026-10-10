TRACKS.push({
  id: 'openbanking', icon: '🏦', title: 'Neonomics & Open Banking', hot: true,
  blurb: 'PSD2, consent and SCA, payments and money handling, and the engineering of a multi-bank aggregator, tuned to a Neonomics-style interview.',
  lessons: [
    {
      id: 'ob-landscape', title: 'The open banking landscape', minutes: 12,
      summary: 'PSD2, the players, and the end-to-end account-data flow.',
      sections: [
        { type: 'text', html: `
<div class="callout warn"><b>Source note:</b> this track combines general PSD2 knowledge with details from Neonomics’ <a href="https://docs.neonomics.io" target="_blank" rel="noopener">public developer docs</a> (UAPI v3.x at the time of writing). It is <b>not</b> insider knowledge of their internals. Read their docs yourself before the interview; being able to discuss their actual API is a strong signal.</div>
<p><b>PSD2</b> (EU Payment Services Directive 2) obliges banks to give licensed third parties access to customer accounts, with customer consent, via secure APIs. In Norway it applies through the EEA agreement and Norwegian law, with <b>Finanstilsynet</b> as the supervisor.</p>
<table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td><b>ASPSP</b></td><td>The bank (Account Servicing Payment Service Provider).</td></tr>
<tr><td><b>PSU</b></td><td>The end user (Payment Service User) who owns the account.</td></tr>
<tr><td><b>TPP</b></td><td>Third-Party Provider: regulated actor accessing bank APIs.</td></tr>
<tr><td><b>AISP</b></td><td>Account Information Service Provider: reads balances and transactions.</td></tr>
<tr><td><b>PISP</b></td><td>Payment Initiation Service Provider: starts payments from the user’s account (“pay by bank”).</td></tr>
<tr><td><b>CBPII</b></td><td>Card-based payment instrument issuer: funds-confirmation checks.</td></tr>
<tr><td><b>SCA</b></td><td>Strong Customer Authentication: two of knowledge/possession/inherence (e.g. BankID).</td></tr>
</table>
<p>An <b>aggregator</b> like Neonomics holds the TPP licence and certificates once, and exposes <b>one API</b> to its customers (fintechs, merchants, lenders) over many banks, each with its own quirks. The customer builds against one integration instead of thousands.</p>` },
        { type: 'text', html: `<h3>Account-data flow, as described in Neonomics’ public docs (simplified)</h3><p>Step through it:</p>` },
        { type: 'steps', steps: [
          { title: '1. Authenticate your application', html: `<p>Your backend gets an access (and refresh) token from the token endpoint using the <b>client id and secret</b> from the developer portal. Requests are additionally <b>signed (QSeal)</b>. See the signature-generation guide in their docs.</p>` },
          { title: '2. Create a session', html: `<p><code>POST /ics/v3/session</code> returns a <b>session id</b> tied to a bank. You then send the session id in a header on account and payment calls. Deleting the session invalidates it.</p>` },
          { title: '3. Call accounts, hit “consent required”', html: `<p>Listing accounts without consent yields an error <b>1426</b>. That error is the signal to start consent, you do not guess.</p>` },
          { title: '4. Initiate consent → user does SCA', html: `<p>The consent endpoint returns a <b>URL</b>. You redirect the PSU there; they authenticate with their bank (e.g. BankID) and approve access. Some banks (Swedish ones, Handelsbanken Finland per the docs) need the PSU’s IP in a header.</p>` },
          { title: '5. Fetch data', html: `<p>Now <code>GET /ics/v3/accounts</code>, then balances and transactions by <b>account id</b>. Remember normalisation: banks differ in formats, pagination, and what “booked” versus “pending” means.</p>` },
        ] },
        { type: 'quiz', q: 'Your product shows users their balances across banks, and never moves money. Which licence role do you need (directly or via an aggregator)?',
          options: ['PISP', 'AISP', 'CBPII', 'ASPSP'], answer: 1, explain: 'Read-only account data is the AISP role. Paying out of the user’s account is PISP. Aggregators let customers rely on the aggregator’s licence rather than obtaining their own.' },
        { type: 'quiz', q: 'The accounts call returns error 1426 (consent required). What should your integration do?',
          options: ['Retry in a loop until it works', 'Treat it as a normal state transition: start the consent flow, redirect the user to the returned URL, and resume after they return', 'Create a new session each time', 'Alert the on-call engineer'],
          answer: 1, explain: '“Consent required” is expected, not an incident. Model the integration as a state machine: no session → session → consented → data, and handle expiry of each state.' },
      ],
    },
    {
      id: 'ob-security', title: 'Consent, SCA & security model', minutes: 15,
      summary: 'SCA flavours, eIDAS certificates, signing, consent lifetime, GDPR.',
      sections: [
        { type: 'text', html: `
<h3>SCA flows</h3>
<ul>
<li><b>Redirect</b>: user is sent to the bank’s site/app to authenticate (most common).</li>
<li><b>Decoupled</b>: you start it, the user approves in their banking app (push), you poll or get a callback.</li>
<li><b>Embedded</b>: you collect credentials: rare and discouraged, security-heavy.</li>
</ul>
<h3>Certificates &amp; request security</h3>
<ul>
<li><b>eIDAS certificates</b> identify a TPP to banks. <b>QWAC</b> (website authentication certificate) is used for mutual TLS; <b>QSealC</b> (seal certificate) is used to <b>sign requests</b> (message-level integrity and non-repudiation). Neonomics’ docs refer to QSeal signature headers.</li>
<li>Know the difference: <b>mTLS</b> secures the channel and identifies the party; a <b>signature</b> proves a specific message was not altered and came from the key holder, even through proxies.</li>
<li><b>Private key handling</b>: HSM/KMS, no keys in repos or images, rotation plan, and monitoring on certificate expiry (an expired cert = every bank call fails).</li>
</ul>
<h3>Consent lifetime</h3>
<p>Under the PSD2 RTS, unattended AIS access (user not present) is limited to <b>4 requests per 24 hours</b> per account per TPP, and the SCA exemption for repeat account-information access was extended from 90 to <b>180 days</b> in 2023, so users must re-authenticate periodically. Product impact: cache sensibly, refresh in batches, and design a graceful “reconnect your bank” UX. Banks may implement the details differently, so verify per bank.</p>
<h3>Data protection</h3>
<p>Financial data is personal data (GDPR): purpose limitation, data minimisation, retention limits, encryption at rest and in transit, access logging, deletion on consent withdrawal. Never log tokens, full IBANs or transaction descriptions in plain application logs.</p>` },
        { type: 'quiz', q: 'Which certificate type would you use to <b>digitally sign API request bodies</b> in a PSD2 integration?',
          options: ['QWAC', 'QSealC', 'A self-signed TLS cert', 'An OAuth client secret'], answer: 1, explain: 'QSealC is for signing messages. QWAC authenticates the TLS connection (mTLS). Some banks and aggregators need both.' },
        { type: 'quiz', q: 'At 03:00 every call to every bank starts failing with TLS handshake errors. No deploy happened. What is a plausible common cause worth checking first?',
          options: ['Cosmic rays', 'Expired or revoked TPP certificate (or an intermediate CA change)', 'The banks all upgraded at once', 'The database is full'],
          answer: 1, explain: 'Simultaneous failure across independent banks points to something on your side shared by all of them: your certificate. That is why you alert on expiry weeks ahead and keep a renewal runbook.' },
        { type: 'reveal', title: 'Question to expect: “A user withdraws consent. What happens in your system?”', html: `<ul><li>Revoke on the bank side if an API exists; delete the session/consent record.</li><li>Stop all scheduled refreshes for that consent immediately (this is a correctness issue, not cleanup).</li><li>Delete or anonymise stored account data per policy, keeping only what law requires (audit trail).</li><li>Make deletion idempotent and observable (an audit event), and propagate to caches, backups policy, analytics and downstream customers.</li></ul>` },
      ],
    },
    {
      id: 'ob-payments-money', title: 'Payments & money handling', minutes: 25,
      summary: 'Minor units, IBAN validation, fair splitting, and the payment status lifecycle.',
      sections: [
        { type: 'text', html: `
<p>Neonomics’ docs list payment types such as <b>domestic</b>, <b>SEPA credit</b>, scheduled variants, and <b>batch</b> transfers. After the user completes SCA the payment must be <b>completed promptly</b> because bank authorisations expire fast, and status is polled (or pushed) by payment id.</p>
<h3>Money rules (memorise)</h3>
<ol>
<li>Store <b>integer minor units</b> (cents/øre) + <b>ISO 4217 currency</b>. Never floats. Beware currencies with 0 or 3 decimals (JPY, KWD).</li>
<li>Never add amounts of different currencies.</li>
<li>Define a <b>rounding rule</b> (half-up? banker’s?) and use it everywhere.</li>
<li>Use idempotency keys on every payment-creating request (see the Reliability track).</li>
<li>Ledger entries are <b>append-only</b>; fix mistakes with reversing entries.</li>
</ol>` },
        { type: 'code', title: 'IBAN validation (mod 97)', prompt: `<p>Implement <code>isValidIban(iban)</code>. Steps: remove spaces, uppercase; format <code>2 letters + 2 digits + 11-30 alphanumerics</code>; check country length for <code>NO</code>=15, <code>DE</code>=22, <code>SE</code>=24, <code>DK</code>=18, <code>FI</code>=18, <code>GB</code>=22 (other countries: skip length check); move the first 4 chars to the end; replace letters with numbers (A=10 … Z=35); the resulting big number mod 97 must equal 1. <b>Do not</b> parse it as a Number, it overflows; compute the remainder piecewise.</p>`,
          starter: `function isValidIban(iban) {
}
`,
          tests: `
test('valid NO', () => eq(isValidIban('NO93 8601 1117 947'), true));
test('valid GB', () => eq(isValidIban('GB82 WEST 1234 5698 7654 32'), true));
test('valid DE lowercase', () => eq(isValidIban('de89370400440532013000'), true));
test('bad checksum', () => eq(isValidIban('NO94 8601 1117 947'), false));
test('wrong length for country', () => eq(isValidIban('NO93 8601 1117 9470'), false));
test('garbage', () => { eq(isValidIban(''), false); eq(isValidIban('hello'), false); eq(isValidIban('NO93-8601-1117-947'), false); });
test('non-string', () => { eq(isValidIban(null), false); eq(isValidIban(12345), false); });`,
          hint: 'Piecewise mod: let rem = 0; for each digit char of the expanded string: rem = (rem * 10 + digit) % 97. Expand letters by charCode - 55 into one or two digits.',
          solution: `function isValidIban(iban) {
  if (typeof iban !== 'string') return false;
  const s = iban.replace(/ /g, '').toUpperCase();
  if (!/^[A-Z]{2}\\d{2}[A-Z0-9]{11,30}$/.test(s)) return false;
  const lengths = { NO: 15, DE: 22, SE: 24, DK: 18, FI: 18, GB: 22 };
  const cc = s.slice(0, 2);
  if (lengths[cc] && s.length !== lengths[cc]) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const v = ch >= 'A' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}`, notes: 'Validating the checksum proves the IBAN is well-formed, not that the account exists or belongs to a person. That is what an account-verification endpoint is for.' },
        { type: 'code', title: 'Split money without losing a cent', prompt: `<p>Implement <code>splitAmount(totalMinor, weights)</code> returning integer parts proportional to <code>weights</code> that <b>sum exactly to totalMinor</b>. Use the largest-remainder method: floor each share, then give the leftover units one by one to the shares with the largest fractional remainders (ties: lower index first).</p>`,
          starter: `function splitAmount(totalMinor, weights) {
}
`,
          tests: `
const sum = a => a.reduce((x,y)=>x+y,0);
test('even thirds', () => eq(splitAmount(100,[1,1,1]), [34,33,33]));
test('exact halves', () => eq(splitAmount(10,[1,1]), [5,5]));
test('one cent over three', () => eq(splitAmount(1,[1,1,1]), [1,0,0]));
test('weighted remainder goes to biggest fraction', () => eq(splitAmount(101,[70,30]), [71,30]));
test('always sums to total', () => { for (const t of [0,1,7,99,1000,12345]) for (const w of [[1],[1,2,3],[5,5,5,5,5,5,5],[0.3,0.3,0.4]]) eq(sum(splitAmount(t,w)), t, t+' '+w); });
test('zero total', () => eq(splitAmount(0,[1,2]), [0,0]));
test('invalid weights throw', async () => { await throws(() => splitAmount(10, [])); await throws(() => splitAmount(10, [0,0])); await throws(() => splitAmount(10, [-1,2])); });`,
          hint: 'shares[i] = total*w[i]/sumW. floor them, leftover = total - sum(floors), sort indexes by remainder desc then index asc, +1 to the first `leftover`.',
          solution: `function splitAmount(totalMinor, weights) {
  const sw = weights.reduce((a, b) => a + b, 0);
  if (!weights.length || weights.some((w) => w < 0) || sw <= 0) throw new RangeError('invalid weights');
  const exact = weights.map((w) => (totalMinor * w) / sw);
  const parts = exact.map(Math.floor);
  let left = totalMinor - parts.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; left > 0; k++, left--) parts[order[k % order.length].i]++;
  return parts;
}`, notes: 'Real systems use BigInt/decimal for large totals and keep the allocation rule in the spec (e.g. fees go to the platform). Always test the invariant “parts sum to total”.' },
        { type: 'text', html: `
<h3>Payment status lifecycle</h3>
<p>Berlin Group / ISO 20022-style statuses include <code>RCVD</code> (received), <code>PDNG</code> (pending), <code>ACTC</code> (technically accepted), <code>ACCP</code> (accepted for customer profile), <code>ACSP</code> (settlement in process), <code>ACSC</code> (settlement completed), <code>ACCC</code> (credit account completed), <code>RJCT</code> (rejected), <code>CANC</code> (cancelled). Banks report these <b>late, duplicated, skipped, or out of order</b>, and your system must still end in a correct state.</p>` },
        { type: 'code', title: 'Merge payment status updates safely', prompt: `<p>Implement <code>applyStatus(current, incoming)</code> returning the new status, with these simplified rules (ranks: RCVD 0, PDNG 1, ACTC 2, ACCP 3, ACSP 4, ACSC 5, ACCC 6):</p>
<ul><li>If <code>current</code> is terminal (<code>ACCC</code>, <code>RJCT</code>, <code>CANC</code>) → unchanged.</li><li><code>RJCT</code> is accepted unless current rank ≥ 5 (already settled).</li><li><code>CANC</code> is accepted only if current rank ≤ 2.</li><li>Otherwise move forward only: accept <code>incoming</code> if its rank is higher (skipping is fine); ignore same or lower rank (stale/duplicate).</li><li>Unknown status → throw <code>Error('unknown status')</code>.</li></ul>`,
          starter: `function applyStatus(current, incoming) {
}
`,
          tests: `
test('forward', () => eq(applyStatus('RCVD','ACTC'),'ACTC'));
test('skip allowed', () => eq(applyStatus('PDNG','ACSC'),'ACSC'));
test('duplicate ignored', () => eq(applyStatus('ACSP','ACSP'),'ACSP'));
test('stale ignored', () => eq(applyStatus('ACSC','PDNG'),'ACSC'));
test('terminal sticks', () => { eq(applyStatus('ACCC','RJCT'),'ACCC'); eq(applyStatus('RJCT','ACSP'),'RJCT'); eq(applyStatus('CANC','ACTC'),'CANC'); });
test('reject early and mid', () => { eq(applyStatus('RCVD','RJCT'),'RJCT'); eq(applyStatus('ACSP','RJCT'),'RJCT'); });
test('reject after settlement refused', () => eq(applyStatus('ACSC','RJCT'),'ACSC'));
test('cancel only early', () => { eq(applyStatus('PDNG','CANC'),'CANC'); eq(applyStatus('ACCP','CANC'),'ACCP'); });
test('unknown throws', async () => { await throws(() => applyStatus('RCVD','WAT')); await throws(() => applyStatus('NOPE','ACTC')); });`,
          hint: 'A RANK object and a TERMINAL set. Handle RJCT and CANC before the generic rank comparison.',
          solution: `const RANK = { RCVD: 0, PDNG: 1, ACTC: 2, ACCP: 3, ACSP: 4, ACSC: 5, ACCC: 6 };
const TERMINAL = new Set(['ACCC', 'RJCT', 'CANC']);
function applyStatus(current, incoming) {
  const known = (s) => s in RANK || s === 'RJCT' || s === 'CANC';
  if (!known(current) || !known(incoming)) throw new Error('unknown status');
  if (TERMINAL.has(current)) return current;
  if (incoming === 'RJCT') return RANK[current] >= 5 ? current : 'RJCT';
  if (incoming === 'CANC') return RANK[current] <= 2 ? 'CANC' : current;
  return RANK[incoming] > RANK[current] ? incoming : current;
}`, notes: 'The design principle: status handling must be commutative-ish and idempotent, so replays, retries and out-of-order webhooks converge to the same state. Store raw bank statuses too, for audit and debugging.' },
        { type: 'quiz', q: 'The same payment’s status webhooks arrive as ACSC, then (late) ACSP. A naive “last write wins” handler does what, and why does it matter?',
          options: ['Nothing, ACSP is fine', 'Regresses a settled payment to “in process”, which could trigger a duplicate payout or confusing notifications', 'Crashes', 'Deletes the payment'],
          answer: 1, explain: 'Out-of-order delivery is normal. Use monotonic state rules (or event versions) so late events cannot move state backwards.' },
      ],
    },
    {
      id: 'ob-aggregator-eng', title: 'Engineering a multi-bank aggregator', minutes: 22,
      summary: 'Heterogeneity, normalisation, throttling, outages and reconciliation.',
      sections: [
        { type: 'text', html: `
<p>The core engineering problem: <b>thousands of banks, one reliable API</b>. Each bank differs in formats, auth quirks, rate limits, uptime, field semantics and release schedule. Patterns that matter:</p>
<ul>
<li><b>Adapter / anti-corruption layer per bank</b> (or per bank-group/standard like Berlin Group, STET, UK OB). Everything above the adapter sees one canonical model.</li>
<li><b>Canonical model + raw payload.</b> Normalise, but keep the original for debugging and for fields you did not map yet.</li>
<li><b>Per-bank resilience:</b> timeouts, circuit breakers, rate limiters, bulkheads (separate pools), so one bad bank cannot sink others.</li>
<li><b>Contract tests &amp; sandboxes</b> per bank, plus synthetic probes in production that detect a bank changing behaviour before customers do.</li>
<li><b>Data freshness is a product feature:</b> expose “as of” timestamps and degrade to cached data with a clear flag when the bank is down.</li>
<li><b>Reconciliation:</b> regularly compare what you believe happened (payments, statuses) with what the bank reports. Money systems assume drift and detect it.</li>
</ul>` },
        { type: 'code', title: 'Normalise two banks’ transactions', prompt: `<p>Implement <code>normalize(bank, raw)</code> returning <code>{id, date, amountMinor, currency, description, counterparty}</code> where <code>date</code> is <code>YYYY-MM-DD</code> and <code>amountMinor</code> is a signed <b>integer</b> of minor units (2 decimals assumed). Two formats:</p>
<pre><code>bank 'A' (Berlin-Group-like):
  { transactionId, bookingDate: '2024-03-01', transactionAmount: { amount: '-12.50', currency: 'EUR' },
    creditorName, remittanceInformationUnstructured }
bank 'B':
  { id, date: '01.03.2024', amountMinor: -1250, ccy: 'NOK', text, counterparty }</code></pre>
<p>Parse A’s decimal <b>string</b> without floating point (<code>'-0.10'</code> must give <code>-10</code>; <code>'7'</code> gives <code>700</code>; <code>'1.5'</code> gives <code>150</code>). Missing optional text fields become <code>''</code>. Unknown bank → throw.</p>`,
          starter: `function normalize(bank, raw) {
}
`,
          tests: `
const A = { transactionId:'a1', bookingDate:'2024-03-01', transactionAmount:{amount:'-12.50',currency:'EUR'}, creditorName:'Shop', remittanceInformationUnstructured:'Groceries' };
const B = { id:'b1', date:'01.03.2024', amountMinor:-1250, ccy:'NOK', text:'Coffee', counterparty:'Cafe' };
test('bank A', () => eq(normalize('A',A), {id:'a1',date:'2024-03-01',amountMinor:-1250,currency:'EUR',description:'Groceries',counterparty:'Shop'}));
test('bank B', () => eq(normalize('B',B), {id:'b1',date:'2024-03-01',amountMinor:-1250,currency:'NOK',description:'Coffee',counterparty:'Cafe'}));
test('decimal strings exact', () => { const f=a=>normalize('A',{...A,transactionAmount:{amount:a,currency:'EUR'}}).amountMinor; eq(f('-0.10'),-10); eq(f('7'),700); eq(f('1.5'),150); eq(f('0.07'),7); eq(f('+3.00'),300); eq(f('19.99'),1999); });
test('missing optional fields', () => { const {creditorName, remittanceInformationUnstructured, ...rest}=A; const n=normalize('A',rest); eq(n.description,''); eq(n.counterparty,''); });
test('amount is integer', () => assert(Number.isInteger(normalize('A',A).amountMinor)));
test('unknown bank throws', async () => { await throws(() => normalize('Z',A)); });`,
          hint: 'For the string: capture sign, whole and fraction with a regex, pad the fraction to 2 digits, compute whole*100 + fraction, apply the sign. Beware that -0.10 has a whole part of "0": apply the sign at the end.',
          solution: `function parseMinor(str) {
  const m = /^([+-]?)(\\d+)(?:\\.(\\d{1,2}))?$/.exec(String(str).trim());
  if (!m) throw new Error('bad amount: ' + str);
  const minor = Number(m[2]) * 100 + Number((m[3] || '').padEnd(2, '0') || 0);
  return m[1] === '-' ? -minor : minor;
}
function normalize(bank, raw) {
  if (bank === 'A') {
    return {
      id: raw.transactionId, date: raw.bookingDate,
      amountMinor: parseMinor(raw.transactionAmount.amount), currency: raw.transactionAmount.currency,
      description: raw.remittanceInformationUnstructured || '', counterparty: raw.creditorName || '',
    };
  }
  if (bank === 'B') {
    const [d, mo, y] = raw.date.split('.');
    return { id: raw.id, date: y + '-' + mo + '-' + d, amountMinor: raw.amountMinor, currency: raw.ccy, description: raw.text || '', counterparty: raw.counterparty || '' };
  }
  throw new Error('unknown bank: ' + bank);
}`, notes: 'Real mapping also handles debtor vs creditor naming by sign, booked vs pending, value date vs booking date, timezones, duplicate transactions across pages, and banks that omit stable ids (derive a deterministic hash).' },
        { type: 'quiz', q: 'Bank X starts responding in 25 seconds instead of 300ms. Your workers share one pool across all banks. What happens, and what is the fix?',
          options: ['Nothing: other banks are unaffected', 'Workers pile up waiting on X and starve every other bank; fix with per-bank timeouts, concurrency limits (bulkheads) and a circuit breaker', 'Add more workers only', 'Cache everything forever'],
          answer: 1, explain: 'Classic head-of-line blocking. Isolate failure domains per dependency, and fail fast so healthy banks keep their capacity.' },
        { type: 'quiz', q: 'You call a bank’s account endpoint on a schedule for 50,000 consented users with no user present. What PSD2/operational constraint dominates the design?',
          options: ['None', 'Unattended access is limited (about 4 calls per 24h per account), banks also throttle aggregators, so you need a scheduler that budgets calls per account and per bank, staggers load, and favours on-demand refreshes when the user is present', 'Only CPU limits', 'Use webhooks from the banks'],
          answer: 1, explain: 'Plan a refresh budget: per-account daily quota, per-bank token buckets, jitter to avoid top-of-the-hour spikes, and prioritise refreshes triggered by an active user session.' },
        { type: 'reveal', title: 'Worked design prompt: “Design the data refresh scheduler”', html: `<ul><li><b>Inputs:</b> consents (user, bank, accounts, last refresh, status), per-bank limits, user activity signals.</li><li><b>Mechanics:</b> priority queue keyed by next-eligible time; a token bucket per bank and a daily budget per account; jittered schedule; user-present refreshes jump the queue.</li><li><b>Failure:</b> circuit breaker per bank, exponential backoff per consent, mark consent “needs reauth” on auth errors and notify the customer via webhook.</li><li><b>Correctness:</b> idempotent writes (upsert by transaction id), dedupe overlapping windows, store fetch watermarks.</li><li><b>Observability:</b> freshness SLO (e.g. 95% of active accounts &lt; 6h old), success rate per bank, quota utilisation.</li></ul>` },
      ],
    },
    {
      id: 'ob-interview-prep', title: 'Preparing for the Neonomics interview', minutes: 10,
      summary: 'Research checklist, questions to ask, and how to map your experience.',
      sections: [
        { type: 'text', html: `<p>Neonomics is an Oslo-based open banking company (founded 2017) with a licensed payment institution, an aggregator API covering many European banks, and a pay-by-bank product (<b>Nello Pay</b>). It has been growing via partnerships and acquisitions. Check their latest news; details change.</p>` },
        { type: 'reveal', title: '✅ Research checklist (do these before the interview)', html: `<ol>
<li>Read the <a href="https://docs.neonomics.io" target="_blank" rel="noopener">API docs</a>: Platform overview, Consent/Authorization/SCA, Error handling, Pay by Bank. Draw the flow from memory.</li>
<li>Skim the <a href="https://neonomics.io/blog/open-banking-is-evolving-and-so-are-we" target="_blank" rel="noopener">blog</a> and the About page for strategy: what are they pushing right now (pay by bank, data products, UK expansion)?</li>
<li>Look up their engineering job posts for the stack and the on-call/ownership language.</li>
<li>Read the Berlin Group NextGenPSD2 intro (free) and the EBA PSD2 RTS summary.</li>
<li>Try a sandbox for any open banking API to get a feel for consent redirects.</li></ol>` },
        { type: 'reveal', title: '🎯 Likely themes', html: `<ul>
<li>Reliability across flaky third-party banks (timeouts, breakers, bulkheads).</li>
<li>Idempotent payments and exactly-once <i>effects</i>.</li>
<li>Security: certificates, signing, secrets, least privilege, GDPR.</li>
<li>Data modelling for normalised accounts/transactions across banks.</li>
<li>Asynchronous status handling, webhooks, reconciliation.</li>
<li>Working in a regulated environment: auditability, change management, incident reports.</li>
<li>AI: where it helps (support triage, error-explanation, categorisation, dev productivity) and where it must not touch money flows without controls.</li></ul>` },
        { type: 'reveal', title: '❓ Good questions to ask them', html: `<ul>
<li>“What fails most often today: banks, our infra, or the integration with customers? How do you detect bank-side regressions?”</li>
<li>“How is on-call organised and what did your last significant incident teach you?”</li>
<li>“How do you test against hundreds of banks: contract tests, sandboxes, synthetic probes?”</li>
<li>“How do you balance building canonical models against exposing bank-specific features?”</li>
<li>“How do you use AI in engineering and what are the guardrails in a regulated setting?”</li>
<li>“What does a senior engineer own here in the first 6 months?”</li></ul>` },
        { type: 'reveal', title: '🧩 Map your experience', html: `<p>For each, prepare a story: (1) a third-party dependency that was unreliable, (2) a money or data-correctness bug, (3) a security/compliance requirement you implemented, (4) a migration or integration across many heterogeneous partners, (5) something you simplified. Tie each to a concept above.</p>` },
        { type: 'quiz', q: 'Interviewer: “How would you make sure our API never double-charges a customer?” Pick the strongest outline.',
          options: ['Check the database before inserting', 'Idempotency keys scoped per customer with a unique constraint, atomic claim+effect (or outbox), safe retries with backoff, status reconciliation against the bank, and monitoring for duplicates', 'Use a lock in memory', 'Tell customers not to retry'],
          answer: 1, explain: 'Layered defence: prevent duplicates (idempotency), make retries safe, and detect any that slip through (reconciliation, alerts).' },
      ],
    },
  ],
});
