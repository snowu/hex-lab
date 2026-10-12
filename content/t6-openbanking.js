TRACKS.push({
  id: 'openbanking', icon: '🏦', title: 'Neonomics & Open Banking', hot: true,
  blurb: 'PSD2, consent and SCA, payments and money handling, and the engineering of a multi-bank aggregator, tuned to a Neonomics-style interview.',
  lessons: [
    {
      id: 'ob-landscape', title: 'The open banking landscape', minutes: 12,
      summary: 'PSD2, the players, and the end-to-end account-data flow.',
      checks: [
        { q: 'A merchant wants “pay by bank” at checkout: move money out of the shopper’s account. Which role covers that, and how does an aggregator help?',
          options: ['CBPII, which moves money directly', 'ASPSP, which is the shopper themselves', 'PISP, which initiates payments; the aggregator holds the licence and exposes one API over many banks', 'SCA, which is a licence type for moving money'],
          answer: 2, explain: 'Starting a payment from the user account is the PISP role. An aggregator carries the licence once so customers integrate a single API.' },
        { q: 'Two banks report “pending” transactions with different meanings, and paginate differently. Your aggregator dashboard must combine them. What is the correct approach?',
          options: ['Normalise into one canonical model (keeping the raw payload for debugging) and document what booked versus pending means per bank', 'Pick one bank’s definition and silently apply it to all banks', 'Show whichever bank responds first and drop the other', 'Store the amounts as floats and merge the pages by timestamp alone'],
          answer: 0, explain: 'Banks differ in formats, pagination, and field semantics. Normalise above an adapter layer but keep the original payload.' },
      ],
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
      checks: [
        { q: 'A signed payment request passes through two proxies before reaching the bank. Why is the QSeal signature still verifiable while the TLS session is not?',
          options: ['TLS sessions are stored in the database and expire', 'QSeal certificates are self-signed so proxies skip them', 'Signatures are slower and therefore more secure than encryption', 'The signature proves that exact message was unaltered by the key holder end to end, while mTLS only secures each channel hop and identifies the party'],
          answer: 3, explain: 'mTLS secures the channel and authenticates the party; a QSealC signature gives message-level integrity and non-repudiation through intermediaries.' },
        { q: 'Your nightly job refreshes every consented account once an hour with no user present, and logs full IBANs for debugging. What are the two violations?',
          options: ['The job runs at night instead of during business hours, and logs are too verbose', 'Hourly unattended refreshes exceed the roughly 4-requests-per-24h limit, and full IBANs in plain logs breach data minimisation', 'OAuth tokens expire too fast, and IBANs should be uppercase', 'QWAC and QSealC are swapped, and the job needs more CPU'],
          answer: 1, explain: 'Unattended AIS access is quota-limited, so cache, batch, and design a reconnect UX; financial data is GDPR personal data, so minimise logging.' },
      ],
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
      checks: [
        { q: 'A teammate stores a 19.99 EUR charge as the float 19.99 with no currency field. What is wrong and what is the fix?',
          options: ['Store integer minor units (1999) plus the ISO 4217 currency, define one rounding rule, and never mix currencies', 'Floats are fine as long as you round on display', 'Store the amount as a string with the currency symbol attached', 'Multiply by 100 only for Japanese yen'],
          answer: 0, explain: 'Floats cannot represent most decimals exactly and drop the currency. Minor units plus ISO code plus a single rounding rule is the money rule.' },
        { q: 'A duplicate webhook replays a settled transfer and your handler inserts a second ledger row for it. What is the correct ledger discipline?',
          options: ['Delete the older row so only the newest remains', 'Update the old row in place with the new status', 'Keep the ledger append-only: deduplicate with idempotency keys and fix mistakes with reversing entries, never edits or deletes', 'Ignore all webhooks after the first one'],
          answer: 2, explain: 'Ledger entries are append-only and payment creation uses idempotency keys, so replays are deduped and corrections are traceable reversals.' },
      ],
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
        { type: 'code', ref: 'iban' },
        { type: 'code', ref: 'split_amount' },
        { type: 'text', html: `
<h3>Payment status lifecycle</h3>
<p>Berlin Group / ISO 20022-style statuses include <code>RCVD</code> (received), <code>PDNG</code> (pending), <code>ACTC</code> (technically accepted), <code>ACCP</code> (accepted for customer profile), <code>ACSP</code> (settlement in process), <code>ACSC</code> (settlement completed), <code>ACCC</code> (credit account completed), <code>RJCT</code> (rejected), <code>CANC</code> (cancelled). Banks report these <b>late, duplicated, skipped, or out of order</b>, and your system must still end in a correct state.</p>` },
        { type: 'code', ref: 'payment_status' },
        { type: 'quiz', q: 'The same payment’s status webhooks arrive as ACSC, then (late) ACSP. A naive “last write wins” handler does what, and why does it matter?',
          options: ['Nothing, ACSP is fine', 'Regresses a settled payment to “in process”, which could trigger a duplicate payout or confusing notifications', 'Crashes', 'Deletes the payment'],
          answer: 1, explain: 'Out-of-order delivery is normal. Use monotonic state rules (or event versions) so late events cannot move state backwards.' },
      ],
    },
    {
      id: 'ob-aggregator-eng', title: 'Engineering a multi-bank aggregator', minutes: 22,
      summary: 'Heterogeneity, normalisation, throttling, outages and reconciliation.',
      checks: [
        { q: 'A bank adds a new fee field your adapter does not map yet, and support needs it to debug a complaint today. What design choice saves you?',
          options: ['Dropping unmapped fields keeps the model clean, so wait for the next schema release', 'Rewriting the adapter per complaint is fastest', 'Keeping the raw bank payload alongside the canonical model, so unmapped fields stay available for debugging and later mapping', 'Asking the bank to remove the new field'],
          answer: 2, explain: 'Normalise into a canonical model but retain the original payload. Heterogeneous banks change faster than your mappings.' },
        { q: 'A bank is down during the morning dashboard rush. What is the right degraded behaviour?',
          options: ['Fail the whole dashboard for all banks so the outage is visible', 'Retry the bank in a tight loop until it recovers', 'Invent a plausible balance from last week’s average', 'Serve clearly flagged cached data with its as-of timestamp, then reconcile against the bank when it recovers'],
          answer: 3, explain: 'Data freshness is a product feature: degrade to labelled cached data with as-of timestamps, and assume drift that reconciliation must detect.' },
      ],
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
        { type: 'code', ref: 'normalize' },
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
      checks: [
        { q: 'You have one evening before the interview. Which preparation gives the strongest signal?',
          options: ['Reading the aggregator API docs on consent, SCA, and errors, then drawing the flow from memory and trying a sandbox redirect', 'Memorising the founding year and office locations only', 'Re-reading your own CV with no reference to their API or strategy', 'Learning a new frontend framework overnight'],
          answer: 0, explain: 'Discussing their actual API flow from memory, plus sandbox experience, shows role-relevant preparation beyond generic company facts.' },
        { q: 'You once owned an integration over many flaky third-party partners. How should you pitch that story here?',
          options: ['As a story about writing the most lines of code in a sprint', 'As a story about tabs versus spaces in code review', 'As a story about office relocation logistics', 'As evidence for aggregator themes: per-partner isolation, contract tests and probes, idempotent effects, and reconciliation'],
          answer: 3, explain: 'Map each past story to their likely themes: unreliable banks, money correctness, security, heterogeneous modelling, and async status handling.' },
      ],
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
