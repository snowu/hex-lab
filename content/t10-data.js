/* Databases & SQL track (Postgres-flavoured). SQL exercises run on SQLite in the browser; differences are called out. */
TRACKS.splice(4, 0, {
  id: 'data', icon: '🗄️', title: 'Databases & SQL',
  blurb: 'Modelling money, writing real SQL, indexes and query plans, transactions and isolation, and running Postgres in production. Runnable SQL, no server needed.',
  lessons: [
    {
      id: 'db-ledger-model', title: 'Modelling money in a relational database', minutes: 25,
      summary: 'Accounts, transactions, entries: invariants as constraints.',
      sections: [
        { type: 'text', html: `
<p>For money you want a database that enforces rules for you: <b>ACID transactions</b>, <b>constraints</b> and <b>joins</b>. The classic model is a <b>double-entry ledger</b>:</p>
<pre><code>accounts      (id, owner, currency, ...)
transactions  (id, idempotency_key UNIQUE, created_at, memo)
entries       (id, transaction_id → transactions, account_id → accounts, amount_minor BIGINT, currency)
              -- every transaction's entries sum to zero; entries are never updated or deleted</code></pre>
<h3>Rules a senior engineer states unprompted</h3>
<ul>
<li><b>Integer minor units</b> (<code>BIGINT</code> cents) or <code>NUMERIC(19,4)</code>, never <code>FLOAT</code>/<code>DOUBLE</code>. Avoid Postgres's <code>money</code> type (locale-dependent). Store the currency next to the amount.</li>
<li><b>Append-only.</b> A mistake is corrected with a <i>reversing transaction</i>, never an <code>UPDATE</code>. History stays auditable.</li>
<li><b>Idempotency key with a UNIQUE constraint</b>, so a retried request cannot post twice.</li>
<li><b>Constraints over application checks:</b> <code>NOT NULL</code>, foreign keys (<code>ON DELETE RESTRICT</code>), <code>CHECK (amount_minor &lt;&gt; 0)</code>, <code>CHECK (length(currency) = 3)</code>.</li>
<li><b>Timestamps:</b> <code>timestamptz</code> stored in UTC. Never store local times.</li>
<li><b>The balance is derived</b> (<code>SUM(entries)</code>). If you keep a cached balance column, update it in the same transaction and reconcile against the sum regularly.</li>
<li><b>NULL means unknown</b>, not zero. Prefer <code>NOT NULL DEFAULT 0</code> where zero is what you mean.</li>
</ul>
<div class="callout"><b>The data below</b> is a tiny ledger you will query in the exercises: accounts <code>alice, bob, shop, fees, carol, bank</code>, seven transactions, one of which is deliberately wrong. Use the schema panel on each exercise.</div>` },
        { type: 'code', ref: 'sql_balances' },
        { type: 'code', ref: 'sql_unbalanced' },
        { type: 'quiz', q: 'A transaction posted last week had the wrong amount. What is the correct way to fix a double-entry ledger?',
          options: ['UPDATE the entry to the right amount, then log who did it', 'Post a new reversing transaction (and then the corrected one), leaving the original entries untouched', 'DELETE the transaction and re-insert it', 'Edit the balance column directly and leave the entries'],
          answer: 1, explain: 'Entries are immutable so that any past state can be reconstructed and audited. Corrections are new, visible transactions.' },
        { type: 'quiz', q: 'Why do payments systems store amounts as integer minor units (or NUMERIC) rather than FLOAT?',
          options: ['Integers are smaller on disk', 'Binary floating point cannot represent most decimal fractions exactly, so sums drift and equality checks fail', 'Floats are slower to index', 'SQL does not support FLOAT arithmetic'],
          answer: 1, explain: '0.1 + 0.2 is not 0.3 in binary floating point. Integer cents (or an exact decimal type) make sums exact, and the invariant "entries sum to zero" is only checkable if arithmetic is exact.' },
        { type: 'reveal', title: 'Interview prompt: “model payments with refunds and partial captures”', html: `<ul><li>A <code>payments</code> table with a state machine (created, authorised, captured, refunded, failed) and an append-only <code>payment_events</code> history.</li><li>Money movement lives in the ledger. A capture posts entries; a refund posts <b>new</b> entries, linked by <code>original_payment_id</code>, never editing the capture.</li><li>Partial capture and refund amounts are constrained: <code>SUM(captures) &lt;= authorised</code> and <code>SUM(refunds) &lt;= SUM(captures)</code>, checked in the same transaction under a row lock on the payment.</li><li>Idempotency keys on every write endpoint, with unique indexes.</li></ul>` },
      ],
    },
    {
      id: 'db-sql-fluency', title: 'SQL fluency: joins, windows, anti-joins', minutes: 40,
      summary: 'The queries senior interviews actually ask, and the NULL traps.',
      sections: [
        { type: 'text', html: `
<h3>Mental model</h3>
<p>A query logically runs: <code>FROM/JOIN → WHERE → GROUP BY → HAVING → window functions → SELECT → DISTINCT → ORDER BY → LIMIT</code>. That is why <code>WHERE</code> cannot see aggregates (use <code>HAVING</code>) and why you cannot filter on a window function directly (wrap it in a CTE).</p>
<h3>Joins</h3>
<table><tr><th>Need</th><th>Use</th></tr>
<tr><td>Rows that match on both sides</td><td><code>INNER JOIN</code></td></tr>
<tr><td>Everything from the left, matched where possible</td><td><code>LEFT JOIN</code> (right columns are NULL when no match)</td></tr>
<tr><td>Rows with <b>no</b> match (anti-join)</td><td><code>NOT EXISTS (...)</code> or <code>LEFT JOIN ... WHERE right.id IS NULL</code></td></tr>
<tr><td>Compare rows of one table with each other</td><td>self-join, or a window function</td></tr></table>
<h3>NULL: three-valued logic</h3>
<ul><li><code>NULL = NULL</code> is not true; use <code>IS NULL</code>. <code>x &lt;&gt; 1</code> is not true when x is NULL, so those rows disappear.</li><li><code>COUNT(*)</code> counts rows, <code>COUNT(col)</code> ignores NULLs, <code>SUM</code> of nothing is NULL (wrap in <code>COALESCE</code>).</li><li><code>x NOT IN (subquery)</code> returns <b>no rows at all</b> if the subquery yields any NULL. Prefer <code>NOT EXISTS</code>.</li></ul>
<h3>Window functions</h3>
<table><tr><th>Function</th><th>Use</th></tr>
<tr><td><code>ROW_NUMBER() OVER (PARTITION BY g ORDER BY t DESC)</code></td><td>top-1 / top-N per group, dedupe</td></tr>
<tr><td><code>RANK()</code> / <code>DENSE_RANK()</code></td><td>ranking with ties</td></tr>
<tr><td><code>SUM(x) OVER (PARTITION BY g ORDER BY t)</code></td><td>running totals</td></tr>
<tr><td><code>LAG(x) / LEAD(x)</code></td><td>compare with previous/next row (gaps, deltas)</td></tr></table>
<div class="callout warn"><b>SQLite vs Postgres.</b> The exercises run on SQLite so they work in your browser. Window functions, CTEs and <code>NOT EXISTS</code> are identical. Differences you should know: Postgres has <code>DISTINCT ON</code>, <code>LATERAL</code>, <code>FILTER</code> on aggregates (SQLite has it too), real <code>timestamptz</code> and interval arithmetic (we use <code>julianday</code> here), and <code>RETURNING</code> on every DML statement.</div>` },
        { type: 'predict', pid: 'pred-nulls', title: 'NULL semantics in SQL', intro: '<p>A tiny table with one NULL, queried three ways. Run it for real after you answer.</p>',
          code: String.raw`import sqlite3

db = sqlite3.connect(':memory:')
db.executescript("CREATE TABLE t (x INTEGER); INSERT INTO t VALUES (1), (2), (NULL);")
print(db.execute("SELECT COUNT(*), COUNT(x) FROM t").fetchone())
print(db.execute("SELECT x FROM t WHERE x NOT IN (SELECT 1 UNION SELECT NULL)").fetchall())
print(db.execute("SELECT x FROM t WHERE x <> 1").fetchall())`,
          question: 'What is printed (one line per print)?',
          options: ['(3, 3), then [(2,)], then [(2,), (None,)]', '(3, 2), then [], then [(2,)]', '(3, 2), then [(2,)], then [(2,), (None,)]', '(2, 2), then [], then [(2,)]'], answer: 1,
          explain: '<code>COUNT(*)</code> counts all 3 rows but <code>COUNT(x)</code> skips the NULL, so (3, 2). <code>NOT IN</code> against a list that contains NULL makes every comparison UNKNOWN, so no rows are returned. And <code>x &lt;&gt; 1</code> is UNKNOWN for the NULL row, so only 2 comes back. Three-valued logic bites in production queries.',
          output: ['(3, 2)', '[]', '[(2,)]'] },
        { type: 'code', ref: 'sql_latest' },
        { type: 'code', ref: 'sql_running' },
        { type: 'code', ref: 'sql_inactive' },
        { type: 'code', ref: 'sql_double' },
        { type: 'quiz', q: 'You need the list of customers who have never placed an order. Which is the safest query shape?',
          options: ['SELECT * FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)', 'SELECT * FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)', 'SELECT * FROM customers c JOIN orders o ON o.customer_id = c.id', 'SELECT DISTINCT customer_id FROM orders'],
          answer: 1, explain: 'NOT EXISTS is correct even if orders.customer_id contains NULLs, and the planner turns it into an efficient anti-join. NOT IN silently returns nothing if the subquery has a NULL.' },
      ],
    },
    {
      id: 'db-indexes', title: 'Indexes and query plans', minutes: 35,
      summary: 'Composite order, covering and partial indexes, and reading EXPLAIN.',
      sections: [
        { type: 'text', html: `
<p>An index is a sorted copy of some columns (usually a <b>B-tree</b>) that lets the database jump to rows instead of scanning the table. It speeds reads and <b>slows writes</b>, costs disk and memory, and only helps if the planner can use it.</p>
<h3>Choosing the columns</h3>
<ul>
<li><b>Composite order:</b> equality columns first, then the range/sort column. An index on <code>(a, b)</code> helps queries on <code>a</code>, or <code>a</code> and <code>b</code>, but not <code>b</code> alone (the <i>leftmost prefix</i> rule).</li>
<li><b>Selectivity:</b> an index on a column with two values (boolean) rarely helps. High-cardinality columns do.</li>
<li><b>Covering index</b> (Postgres <code>INCLUDE</code>): holds every column the query needs, so the table is never touched (index-only scan).</li>
<li><b>Partial index:</b> <code>... WHERE status = 'failed'</code> indexes only the interesting rows. Small and fast. Also enables partial UNIQUE constraints.</li>
<li><b>Expression index:</b> <code>(lower(email))</code> to support case-insensitive lookups.</li>
</ul>
<h3>Why the planner ignores your index</h3>
<ul><li>A function on the column: <code>WHERE date(created_at) = ...</code> (index the expression, or rewrite as a range).</li><li>Leading wildcard: <code>LIKE '%abc'</code>.</li><li>Implicit type cast, or a mismatched collation.</li><li>Low selectivity: reading most of the table by index is slower than a sequential scan, so the planner chooses the scan, correctly.</li><li>Stale statistics: run <code>ANALYZE</code>.</li></ul>
<h3>Reading a plan</h3>
<p>In Postgres use <code>EXPLAIN (ANALYZE, BUFFERS)</code> and compare <b>estimated vs actual rows</b>: large gaps mean bad statistics. <code>Seq Scan</code> reads the table, <code>Index Scan</code> follows the index to the table, <code>Index Only Scan</code> never touches the table, <code>Bitmap Heap Scan</code> combines index results. In the exercises below you will see SQLite's version, <code>EXPLAIN QUERY PLAN</code>.</p>
<div class="callout tip"><b>In production:</b> create indexes with <code>CREATE INDEX CONCURRENTLY</code> (does not block writes, cannot run inside a transaction, leaves an INVALID index if it fails), and drop unused indexes found via <code>pg_stat_user_indexes</code>.</div>` },
        { type: 'code', ref: 'idx_hot' },
        { type: 'code', ref: 'idx_covering' },
        { type: 'code', ref: 'idx_partial' },
        { type: 'quiz', q: 'You have an index on (merchant_id, created_at). Which query can use it efficiently?',
          options: ['WHERE created_at >= ? (only the second column)', 'WHERE merchant_id = ? AND created_at >= ?', 'WHERE created_at >= ? AND merchant_id <> ?', 'WHERE lower(merchant_id::text) = ?'],
          answer: 1, explain: 'A composite index is usable from its leftmost column onward. Querying only the second column cannot jump into the tree, and a function on the column defeats the index.' },
        { type: 'quiz', q: 'A table has a boolean column is_active, 95% true. Is an index on is_active a good idea for WHERE is_active = true?',
          options: ['Yes, indexes always speed up WHERE clauses', 'No: 95% of rows match, so a scan is cheaper. (A partial index on the rare value, WHERE is_active = false, can be great.)', 'Yes, but only on Postgres', 'No, boolean columns cannot be indexed'],
          answer: 1, explain: 'Low selectivity means the index would point at nearly the whole table. The planner will choose a sequential scan. Index the rare value instead.' },
      ],
    },
    {
      id: 'db-transactions', title: 'Transactions, isolation and locking', minutes: 40,
      summary: 'Anomalies, isolation levels in Postgres, and the right tool for each race.',
      sections: [
        { type: 'text', html: `
<p><b>ACID</b> in one line each: <b>A</b>tomic (all or nothing), <b>C</b>onsistent (constraints hold), <b>I</b>solated (concurrent transactions do not see each other's mess), <b>D</b>urable (committed means safe after a crash). Postgres uses <b>MVCC</b>: each transaction works on a snapshot, so readers do not block writers and writers do not block readers.</p>
<h3>Isolation levels in Postgres</h3>
<table><tr><th>Level</th><th>What you get</th><th>Still possible</th></tr>
<tr><td><b>Read committed</b> (default)</td><td>each statement sees data committed before it started</td><td>non-repeatable reads, phantoms, lost updates, write skew</td></tr>
<tr><td><b>Repeatable read</b></td><td>one snapshot for the whole transaction (snapshot isolation; also prevents phantoms in Postgres)</td><td>write skew. A concurrent update to a row you also change raises <code>40001</code> and you must retry</td></tr>
<tr><td><b>Serializable</b></td><td>behaves as if transactions ran one at a time (SSI)</td><td>nothing, but any transaction can fail with <code>40001</code>: retry loops are mandatory</td></tr></table>
<h3>The anomalies, plainly</h3>
<ul><li><b>Lost update:</b> two transactions read the same value, both write a result computed from it; one overwrite wins.</li><li><b>Non-repeatable read:</b> the same row read twice in one transaction gives two values.</li><li><b>Phantom:</b> the same query run twice returns a different set of rows.</li><li><b>Write skew:</b> two transactions each read an overlapping set, then write <i>different</i> rows, and together break a rule (two doctors both go off call).</li></ul>
<h3>Which tool for which race</h3>
<table><tr><th>Problem</th><th>Fix</th></tr>
<tr><td>Read-modify-write on one row</td><td>Atomic <code>UPDATE ... SET balance = balance - $1 WHERE id = $2 AND balance &gt;= $1</code> and check the row count; or <code>SELECT ... FOR UPDATE</code></td></tr>
<tr><td>Work queue with many workers</td><td><code>SELECT ... FOR UPDATE SKIP LOCKED LIMIT n</code></td></tr>
<tr><td>Duplicate creation</td><td><code>UNIQUE</code> constraint + <code>INSERT ... ON CONFLICT DO NOTHING</code></td></tr>
<tr><td>Invariant across rows (write skew)</td><td>Serializable + retry, or lock the rows you read, or encode the rule as a constraint</td></tr>
<tr><td>Update without holding a lock across user think time</td><td>Optimistic locking: a <code>version</code> column and <code>WHERE version = $old</code></td></tr>
<tr><td>Deadlocks</td><td>Always lock rows in the same order (for example by id). Retry on <code>40P01</code></td></tr></table>
<div class="callout warn"><b>Rules of thumb:</b> keep transactions short; never call an external API (a bank!) while holding row locks or an open transaction; always code a retry loop for <code>40001</code> and <code>40P01</code>.</div>` },
        { type: 'sim', id: 'isolation', pid: 'sim-isolation', title: 'Two transactions, three isolation levels', intro: '<p>Pick a scenario and an isolation level, then step through the timeline. These follow Postgres semantics.</p>',
          try: ['<b>Lost update</b> at Read committed with the plain approach: the final balance is wrong.', 'Switch to <b>Repeatable read</b>: the database refuses the second write, and the retry makes it correct.', 'Switch the approach to <b>atomic UPDATE</b> or <b>FOR UPDATE</b> and see why they work even at Read committed.', '<b>Write skew</b>: it survives Repeatable read. Only Serializable (or locking the rows) stops it.'] },
        { type: 'bug', pid: 'bug-withdraw', title: 'This withdrawal is not safe', prompt: '<p>The balance is checked before spending, so it must be safe, right? Click the <b>2</b> lines that break under concurrency.</p>',
          code: String.raw`def withdraw(db, account_id, amount):
    balance = db.execute("SELECT balance FROM accounts WHERE id = %s", (account_id,)).scalar()
    if balance < amount:
        raise InsufficientFunds()
    db.execute("UPDATE accounts SET balance = %s WHERE id = %s", (balance - amount, account_id))
    db.commit()`,
          bugs: [{ line: 2, why: 'A plain SELECT takes no lock, so two requests can both read the same balance. Lock the row (<code>SELECT ... FOR UPDATE</code>) or do the check inside the UPDATE.' },
                 { line: 5, why: 'It writes a value computed from a stale read, so the second writer overwrites the first (lost update). Use <code>UPDATE accounts SET balance = balance - %s WHERE id = %s AND balance &gt;= %s</code> and treat <code>rowcount == 0</code> as insufficient funds.' }],
          ok: [3], hint: 'Two requests run this function at the same moment. Where can they both be past the same check?' },
        { type: 'quiz', q: 'Two workers must claim jobs from a table without picking the same job and without blocking each other. What should the claim query use?',
          options: ['SELECT * FROM jobs WHERE status = \'new\' LIMIT 1, then UPDATE it', 'SELECT ... WHERE status = \'new\' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED, then mark it in the same transaction', 'LOCK TABLE jobs IN ACCESS EXCLUSIVE MODE', 'A random sleep before each query'],
          answer: 1, explain: 'SKIP LOCKED skips rows another transaction already locked instead of waiting, so workers take different jobs concurrently. The plain SELECT-then-UPDATE races, and a table lock serialises everything.' },
        { type: 'quiz', q: 'Your code runs at REPEATABLE READ and sometimes fails with “could not serialize access due to concurrent update”. What is the right response?',
          options: ['Catch it and ignore it', 'Lower the isolation level to avoid the error', 'Roll back and retry the whole transaction (with a retry limit and backoff)', 'Add a sleep(1) before every transaction'],
          answer: 2, explain: 'The database is protecting you from a lost update. The transaction must be retried from the start, since its snapshot is stale. Design every transaction to be safe to retry.' },
        { type: 'quiz', q: 'Why is calling a payment provider’s API inside an open database transaction a bad idea?',
          options: ['The driver does not allow it', 'It holds locks and a connection for as long as the network call takes, and the call cannot be rolled back if the transaction later aborts', 'It makes the SQL slower', 'Postgres forbids network I/O in transactions'],
          answer: 1, explain: 'Slow external calls turn into lock contention and connection exhaustion, and the side effect is not atomic with the database. Use the outbox pattern: commit the intent, then perform the call from a worker.' },
      ],
    },
    {
      id: 'db-prod', title: 'Postgres in production', minutes: 35,
      summary: 'Pooling, replicas, migrations without downtime, pagination, N+1.',
      sections: [
        { type: 'text', html: `
<h3>Connections</h3>
<p>Each Postgres connection is a server process using several MB of memory, so thousands of direct connections fall over. Put a <b>pooler</b> (PgBouncer, RDS Proxy) in front. In <i>transaction pooling</i> mode a connection is lent for one transaction, so session state (<code>SET</code>, session-level advisory locks, historically prepared statements) is unreliable. Size the pool from the database's capacity, not from the number of app instances.</p>
<h3>Replicas and lag</h3>
<p>Streaming replicas serve reads, but replication is asynchronous: a user can write, then read stale data. Use <b>read-your-writes</b> routing (read from the primary for a short window after a write, or track the commit position), and monitor lag. Replicas also fail over, but promotion loses unreplicated writes unless you use synchronous replication.</p>
<h3>Zero-downtime migrations (expand / contract)</h3>
<ol>
<li><b>Expand:</b> add the new column as nullable (or with a constant default, which is instant since PG 11). Never a volatile default on a big table: it rewrites the whole table.</li>
<li><b>Backfill</b> in small batches with pauses, never in one giant transaction.</li>
<li>Deploy code that writes both, then reads the new one.</li>
<li><b>Contract:</b> add constraints safely (<code>ADD CONSTRAINT ... NOT VALID</code>, then <code>VALIDATE CONSTRAINT</code>), set <code>NOT NULL</code> once a validated check proves it, then drop the old column in a later release.</li>
</ol>
<ul><li><code>CREATE INDEX CONCURRENTLY</code> instead of a blocking build.</li><li>Set <code>lock_timeout</code> on migrations so a DDL statement waiting for a lock cannot queue behind a long transaction and block every query behind it.</li></ul>
<h3>Pagination and the N+1 trap</h3>
<ul><li><code>OFFSET 100000</code> reads and discards 100,000 rows, and shifts when rows are inserted. Use <b>keyset pagination</b>: <code>WHERE (created_at, id) &lt; ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20</code> with a matching index.</li><li><b>N+1:</b> one query for a list, then one per row. Fix with a join, <code>WHERE id = ANY($1)</code>, or the ORM's eager loading.</li></ul>
<h3>Other things worth naming</h3>
<ul><li><b>Autovacuum and bloat:</b> MVCC leaves dead rows; long-running transactions stop cleanup. Watch for idle-in-transaction sessions.</li><li><b>Partitioning</b> (by time) for huge tables: pruning speeds queries, and dropping an old partition is instant.</li><li><b>Backups:</b> base backup plus WAL archiving gives point-in-time recovery. A backup you have never restored is not a backup.</li><li><b>Observability:</b> <code>pg_stat_statements</code> for the slowest queries, plus locks, replication lag and connection saturation.</li></ul>` },
        { type: 'bug', pid: 'bug-nplus1', title: 'Spot the database anti-patterns', prompt: '<p>An assistant wrote this “list payments” endpoint. It works on the demo data. Click the <b>2</b> lines that will hurt in production.</p>',
          code: String.raw`def list_payments(db, page):
    rows = db.execute("SELECT * FROM payments ORDER BY created_at LIMIT 20 OFFSET %s", (page * 20,))
    for r in rows:
        r.merchant = db.execute("SELECT name FROM merchants WHERE id = %s", (r.merchant_id,)).one()
    return rows`,
          bugs: [{ line: 2, why: '<code>OFFSET</code> pagination reads and throws away every earlier row, so deep pages get slower and slower. And with a non-unique <code>created_at</code> as the only sort key, rows can repeat or vanish between pages. Use keyset pagination on <code>(created_at, id)</code>.' },
                 { line: 4, why: 'The classic N+1: one extra query per row (20 round trips for one page). Join the merchants table, or fetch all merchants with one <code>WHERE id = ANY(...)</code> query.' }],
          ok: [3], hint: 'One line gets slower the further you page. The other runs once per row.' },
        { type: 'quiz', q: 'You must add a NOT NULL column with a default to a 500-million-row table in Postgres 15 with no downtime. What is the safest approach?',
          options: ['ALTER TABLE ... ADD COLUMN x int NOT NULL DEFAULT 0 (a constant default is metadata-only since Postgres 11), after setting lock_timeout', 'Take the application offline and run the ALTER', 'Add a trigger that copies data row by row', 'Create a new table and rename it during peak hours'],
          answer: 0, explain: 'Adding a column with a constant default does not rewrite the table in modern Postgres, so it is near-instant. A volatile default (like random() or clock_timestamp()) would rewrite everything. Always set lock_timeout so the DDL cannot queue behind long transactions.' },
        { type: 'quiz', q: 'Users write a comment and immediately see it missing on reload, but it appears a second later. The app reads from a replica. What is the cause and the lightest fix?',
          options: ['The cache is corrupt', 'Replication lag: route reads to the primary for a short window after a write (or until the replica has caught up to the write’s position)', 'The database lost the write', 'The load balancer is broken'],
          answer: 1, explain: 'Asynchronous replication means a replica can briefly be behind. Read-your-writes routing is the standard fix.' },
        { type: 'quiz', q: 'Connections to Postgres spike to 2,000 after you scale the app to 200 instances, and the database slows to a crawl. What should you do?',
          options: ['Raise max_connections to 5,000', 'Put a connection pooler in front (PgBouncer/RDS Proxy) and cap pool sizes', 'Add more replicas only', 'Restart the database nightly'],
          answer: 1, explain: 'Each connection is a process with real memory and scheduling cost. A pooler multiplexes many app connections onto a small number of server connections.' },
        { type: 'reveal', title: 'Design prompts to practise out loud', html: `<ul><li>“Our <code>payments</code> table has 2 billion rows and queries are slowing down. What do you do?” (indexes, partitioning, archiving, query patterns, read replicas, only then sharding)</li><li>“How would you shard a ledger?” (shard by account, cross-shard transfers need a saga or a two-account design, hot accounts, re-sharding)</li><li>“Zero-downtime rename of a column used by 40 services.” (expand/contract, dual write, views, deprecation)</li><li>“Multi-tenant SaaS: schema per tenant, or row-level tenant_id?” (isolation vs operability, row-level security)</li></ul>` },
      ],
    },
  ],
});
