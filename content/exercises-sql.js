/* SQL exercises. They run on SQLite inside the same Python runtime (no server needed).
   kind 'sql': the user's single query is compared with the reference `solution` on the visible data and on a second dataset.
   kind 'ddl': the user's script runs, then `verify` (Python tests; `conn`, `query(sql)`, `plan(sql)` in scope) checks the result.
   `expect` is the reference result on the visible data, checked in CI so a wrong reference solution cannot slip through. */
(function () {
  const LEDGER_SCHEMA = String.raw`CREATE TABLE accounts (id INTEGER PRIMARY KEY, owner TEXT NOT NULL, currency TEXT NOT NULL, opened_on TEXT NOT NULL);
CREATE TABLE transactions (id INTEGER PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, memo TEXT);
CREATE TABLE entries (id INTEGER PRIMARY KEY, transaction_id INTEGER NOT NULL REFERENCES transactions(id), account_id INTEGER NOT NULL REFERENCES accounts(id), amount_minor INTEGER NOT NULL);`;
  const LEDGER_SEED = String.raw`INSERT INTO accounts VALUES (1,'alice','EUR','2024-01-02'),(2,'bob','EUR','2024-01-05'),(3,'shop','EUR','2024-01-07'),(4,'fees','EUR','2024-01-01'),(5,'carol','EUR','2024-05-20'),(6,'bank','EUR','2024-01-01');
INSERT INTO transactions VALUES (1,'k1','2024-06-01 10:00:00','top up alice'),(2,'k2','2024-06-02 09:00:00','alice pays shop'),(3,'k3','2024-06-03 12:00:00','top up bob'),(4,'k4','2024-06-04 15:30:00','bob pays shop'),(5,'k5','2024-06-05 08:15:00','alice pays shop'),(6,'k6','2024-06-06 18:00:00','bad fee posting'),(7,'k7','2024-06-07 11:00:00','shop payout');
INSERT INTO entries (transaction_id, account_id, amount_minor) VALUES
 (1,6,-10000),(1,1,10000),
 (2,1,-2500),(2,3,2400),(2,4,100),
 (3,6,-5000),(3,2,5000),
 (4,2,-1200),(4,3,1150),(4,4,50),
 (5,1,-4000),(5,3,3900),(5,4,100),
 (6,1,-500),(6,4,400),
 (7,3,-6000),(7,6,6000);`;
  const LEDGER_HIDDEN = String.raw`INSERT INTO transactions VALUES (8,'k8','2024-06-08 09:00:00','top up carol'),(9,'k9','2024-06-09 10:00:00','bad posting 2'),(10,'k10','2024-06-09 10:00:00','same-second posting');
INSERT INTO entries (transaction_id, account_id, amount_minor) VALUES (8,6,-2000),(8,5,2000),(9,2,-300),(9,4,200),(10,5,-700),(10,3,700);`;

  const PAY_SCHEMA = String.raw`CREATE TABLE payments (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, merchant_id INTEGER NOT NULL, amount_minor INTEGER NOT NULL, created_at TEXT NOT NULL);`;
  const PAY_SEED = String.raw`INSERT INTO payments VALUES
 (1,1,1,1999,'2024-06-01 10:00:00'),(2,1,1,1999,'2024-06-01 10:03:00'),(3,1,1,1999,'2024-06-01 11:00:00'),
 (4,2,1,1999,'2024-06-01 10:01:00'),(5,1,2,1999,'2024-06-01 10:02:00'),(6,1,1,2999,'2024-06-01 10:04:00'),
 (7,3,3,500,'2024-06-02 09:00:00'),(8,3,3,500,'2024-06-02 09:09:59'),(9,3,3,500,'2024-06-02 09:20:00');`;
  const PAY_HIDDEN = String.raw`INSERT INTO payments VALUES (10,4,4,750,'2024-06-03 10:00:00'),(11,4,4,750,'2024-06-03 10:05:00'),(12,4,4,750,'2024-06-03 10:08:00'),(13,5,5,100,'2024-06-03 10:00:00'),(14,5,5,100,'2024-06-03 10:10:00');`;

  const BIG_SCHEMA = String.raw`CREATE TABLE payments (id INTEGER PRIMARY KEY, merchant_id INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, amount_minor INTEGER NOT NULL);`;
  const BIG_SEED = String.raw`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 6000)
INSERT INTO payments SELECT i, (i % 50) + 1, CASE WHEN i % 25 = 0 THEN 'failed' ELSE 'settled' END, date('2024-01-01', '+' || (i % 200) || ' days') || ' 12:00:00', 100 + (i % 977) FROM n;`;

  Object.assign(window.EXERCISES, {

    sql_balances: { kind: 'sql', title: 'Balance per account', minutes: 10, level: 'easy',
      prompt: `<p>The ledger stores every money movement as <code>entries</code> (positive or negative <code>amount_minor</code>, in cents). Write a query returning <b>one row per account</b>: <code>owner</code> and <code>balance_minor</code>, the sum of that account's entries. Accounts with no entries must still appear, with a balance of <code>0</code>.</p>`,
      schema: LEDGER_SCHEMA, seed: LEDGER_SEED, hidden: LEDGER_HIDDEN,
      starter: `-- owner, balance_minor  (every account, 0 when it has no entries)\nSELECT\n`,
      solution: `SELECT a.owner, COALESCE(SUM(e.amount_minor), 0) AS balance_minor\nFROM accounts a\nLEFT JOIN entries e ON e.account_id = a.id\nGROUP BY a.id, a.owner`,
      expect: [['alice', 3000], ['bank', -9000], ['bob', 3800], ['carol', 0], ['fees', 650], ['shop', 1450]],
      hint: 'You need every account, so start from accounts and LEFT JOIN entries. SUM over zero rows is NULL, not 0: wrap it in COALESCE.',
      notes: 'An INNER JOIN silently drops accounts without entries, a classic reporting bug. In production the balance is usually a maintained column checked against SUM(entries), never recomputed on every read of a hot account.' },

    sql_unbalanced: { kind: 'sql', title: 'Find unbalanced transactions', minutes: 10, level: 'easy',
      prompt: `<p>The ledger invariant: <b>the entries of every transaction sum to zero</b>. Write a query returning <code>id</code> and <code>imbalance</code> (the non-zero sum) for each transaction that violates it. This is the kind of check you run continuously in production.</p>`,
      schema: LEDGER_SCHEMA, seed: LEDGER_SEED, hidden: LEDGER_HIDDEN,
      starter: `-- id, imbalance  (only transactions whose entries do not sum to zero)\nSELECT\n`,
      solution: `SELECT transaction_id AS id, SUM(amount_minor) AS imbalance\nFROM entries\nGROUP BY transaction_id\nHAVING SUM(amount_minor) <> 0`,
      expect: [[6, -100]],
      hint: 'Filtering on an aggregate needs HAVING, not WHERE (WHERE runs before grouping).',
      notes: 'Enforcing this inside the database is hard: a CHECK constraint sees one row at a time. Options are a deferred constraint trigger, posting through one function that validates, or a reconciliation job that runs this exact query and alerts on any row.' },

    sql_latest: { kind: 'sql', title: 'Latest entry per account (window function)', minutes: 15, level: 'medium',
      prompt: `<p>For every account that has entries, return <code>owner</code>, <code>tx_id</code> and <code>amount_minor</code> of its <b>most recent</b> entry, where recent means the transaction's <code>created_at</code> (break ties by the higher transaction id). One row per account.</p>`,
      schema: LEDGER_SCHEMA, seed: LEDGER_SEED, hidden: LEDGER_HIDDEN,
      starter: `-- owner, tx_id, amount_minor of each account's latest entry\nSELECT\n`,
      solution: `WITH ranked AS (\n  SELECT a.owner, t.id AS tx_id, e.amount_minor,\n         ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY t.created_at DESC, t.id DESC) AS rn\n  FROM accounts a\n  JOIN entries e ON e.account_id = a.id\n  JOIN transactions t ON t.id = e.transaction_id\n)\nSELECT owner, tx_id, amount_minor FROM ranked WHERE rn = 1`,
      expect: [['alice', 6, -500], ['bank', 7, 6000], ['bob', 4, -1200], ['fees', 6, 400], ['shop', 7, -6000]],
      hint: 'ROW_NUMBER() OVER (PARTITION BY account ORDER BY created_at DESC, id DESC) numbers each account\'s entries newest first. Wrap it in a CTE and keep rn = 1. (In Postgres, DISTINCT ON does this in one line.)',
      notes: 'The alternative is a correlated subquery or a self-join on MAX(created_at), which breaks on ties. Window functions are the standard answer for "top N per group".' },

    sql_running: { kind: 'sql', title: 'Running balance', minutes: 15, level: 'medium', ordered: true,
      prompt: `<p>Produce an account statement: for every entry return <code>owner</code>, <code>created_at</code>, <code>amount_minor</code> and <code>running_balance</code> (the cumulative sum of that account's entries up to and including this one, in time order). Order the result by <code>owner</code>, then <code>created_at</code>, then transaction id.</p>`,
      schema: LEDGER_SCHEMA, seed: LEDGER_SEED, hidden: LEDGER_HIDDEN,
      starter: `-- owner, created_at, amount_minor, running_balance  ORDER BY owner, created_at, transaction id\nSELECT\n`,
      solution: `SELECT a.owner, t.created_at, e.amount_minor,\n       SUM(e.amount_minor) OVER (PARTITION BY a.id ORDER BY t.created_at, t.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_balance\nFROM entries e\nJOIN accounts a ON a.id = e.account_id\nJOIN transactions t ON t.id = e.transaction_id\nORDER BY a.owner, t.created_at, t.id`,
      expect: [['alice', '2024-06-01 10:00:00', 10000, 10000], ['alice', '2024-06-02 09:00:00', -2500, 7500], ['alice', '2024-06-05 08:15:00', -4000, 3500], ['alice', '2024-06-06 18:00:00', -500, 3000], ['bank', '2024-06-01 10:00:00', -10000, -10000], ['bank', '2024-06-03 12:00:00', -5000, -15000], ['bank', '2024-06-07 11:00:00', 6000, -9000], ['bob', '2024-06-03 12:00:00', 5000, 5000], ['bob', '2024-06-04 15:30:00', -1200, 3800], ['fees', '2024-06-02 09:00:00', 100, 100], ['fees', '2024-06-04 15:30:00', 50, 150], ['fees', '2024-06-05 08:15:00', 100, 250], ['fees', '2024-06-06 18:00:00', 400, 650], ['shop', '2024-06-02 09:00:00', 2400, 2400], ['shop', '2024-06-04 15:30:00', 1150, 3550], ['shop', '2024-06-05 08:15:00', 3900, 7450], ['shop', '2024-06-07 11:00:00', -6000, 1450]],
      hint: 'SUM(...) OVER (PARTITION BY account ORDER BY time, id). Always include a unique tiebreaker in the window ORDER BY, otherwise rows with equal timestamps get an arbitrary order. The final ORDER BY is separate from the window ORDER BY.',
      notes: 'The default frame with an ORDER BY is RANGE, which treats rows with equal sort keys as peers and can surprise you. Spell out ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW for a running total.' },

    sql_inactive: { kind: 'sql', title: 'Accounts with no recent activity (anti-join)', minutes: 15, level: 'medium',
      prompt: `<p>Return the <code>owner</code> of every account that has <b>no entry in any transaction created on or after <code>'2024-06-05'</code></b>. Accounts that never had entries count as inactive too.</p>`,
      schema: LEDGER_SCHEMA, seed: LEDGER_SEED, hidden: LEDGER_HIDDEN,
      starter: `-- owner of accounts with no activity since 2024-06-05\nSELECT\n`,
      solution: `SELECT a.owner\nFROM accounts a\nWHERE NOT EXISTS (\n  SELECT 1 FROM entries e\n  JOIN transactions t ON t.id = e.transaction_id\n  WHERE e.account_id = a.id AND t.created_at >= '2024-06-05'\n)`,
      expect: [['bob'], ['carol']],
      hint: '"No matching rows" is an anti-join: NOT EXISTS (correlated subquery) or LEFT JOIN ... WHERE right.id IS NULL. Prefer NOT EXISTS over NOT IN: if the subquery can return a NULL, NOT IN returns no rows at all.',
      notes: 'NOT IN (subquery containing NULL) evaluates to UNKNOWN for every row, a classic silent bug. The next predict question shows it.' },

    sql_double: { kind: 'sql', title: 'Find double charges (self-join)', minutes: 20, level: 'hard',
      prompt: `<p>Customers sometimes get charged twice by a retry. Find every pair of payments by the <b>same customer</b>, to the <b>same merchant</b>, for the <b>same amount</b>, created at most <b>10 minutes</b> apart. Return <code>first_id</code> and <code>second_id</code> with <code>first_id &lt; second_id</code>, each pair once. (SQLite: use <code>julianday()</code> for time arithmetic. In Postgres you would compare timestamps with an interval.)</p>`,
      schema: PAY_SCHEMA, seed: PAY_SEED, hidden: PAY_HIDDEN,
      starter: `-- first_id, second_id  (same customer + merchant + amount, within 10 minutes)\nSELECT\n`,
      solution: `SELECT a.id AS first_id, b.id AS second_id\nFROM payments a\nJOIN payments b\n  ON a.customer_id = b.customer_id\n AND a.merchant_id = b.merchant_id\n AND a.amount_minor = b.amount_minor\n AND a.id < b.id\n AND (julianday(b.created_at) - julianday(a.created_at)) * 1440 BETWEEN 0 AND 10`,
      expect: [[1, 2], [7, 8]],
      hint: 'Join the table to itself. a.id < b.id stops you matching a row with itself and listing every pair twice. Convert the time difference into minutes and check it is between 0 and 10.',
      notes: 'The proper fix is prevention: an idempotency key with a unique constraint. This query is the detective control that finds what slipped through. At scale you would self-join within a time window using an index on (customer_id, merchant_id, amount_minor, created_at).' },

    idx_hot: { kind: 'ddl', title: 'Index the hot query', minutes: 15, level: 'medium',
      prompt: `<p>This query is slow on a table of millions of rows, and the plan shows a full scan:</p><pre><code>SELECT id, amount_minor FROM payments
WHERE merchant_id = 42 AND created_at >= '2024-03-01'
ORDER BY created_at</code></pre><p>Write the <b>one</b> <code>CREATE INDEX</code> statement that lets the database find the rows <b>and</b> return them already sorted, with no separate sort step. Think about column order: equality column first, then the range/sort column. Then press Run: it checks the actual query plan.</p>`,
      schema: BIG_SCHEMA, seed: BIG_SEED,
      starter: `-- one CREATE INDEX statement\n`,
      solution: `CREATE INDEX idx_payments_merchant_created ON payments (merchant_id, created_at);`,
      verify: String.raw`Q = "SELECT id, amount_minor FROM payments WHERE merchant_id = 42 AND created_at >= '2024-03-01' ORDER BY created_at"

def user_indexes():
    return [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_autoindex%'")]

test('creates exactly one index', lambda: eq(len(user_indexes()), 1))
test('the query SEARCHes using the index instead of scanning', lambda: eq('SEARCH' in plan(Q) and 'USING' in plan(Q) and 'INDEX' in plan(Q), True, plan(Q)))
test('the equality column leads the index (merchant_id first)', lambda: eq('(merchant_id=?' in plan(Q), True, plan(Q)))
test('no separate sort step (rows come out of the index in order)', lambda: eq('TEMP B-TREE' in plan(Q), False, plan(Q)))
test('the data is untouched', lambda: eq(conn.execute('SELECT COUNT(*) FROM payments').fetchone()[0], 6000))
`,
      hint: 'A composite index is sorted by its first column, then by the second within each first value. Put the column you compare with = first (merchant_id) and the one you range over and sort by second (created_at). Then rows for one merchant are already in created_at order.',
      notes: 'Rule of thumb for composite indexes: equality columns, then the sort/range column. An index on (created_at, merchant_id) can also avoid the sort, but it walks the rows of every merchant in the date range and filters afterwards, which is far more work on a big table. Separate single-column indexes would force a sort or a bitmap merge. Every index also slows writes and costs disk, so add them deliberately.' },

    idx_covering: { kind: 'ddl', title: 'A covering index', minutes: 15, level: 'medium',
      prompt: `<p>This dashboard query only reads three columns:</p><pre><code>SELECT created_at, amount_minor FROM payments
WHERE merchant_id = 7 AND created_at >= '2024-04-01'</code></pre><p>Write one <code>CREATE INDEX</code> so the database can answer it <b>from the index alone</b>, without visiting the table (a <i>covering</i> index; Postgres calls it an index-only scan). The plan must say <code>COVERING INDEX</code>.</p>`,
      schema: BIG_SCHEMA, seed: BIG_SEED,
      starter: `-- one CREATE INDEX statement\n`,
      solution: `CREATE INDEX idx_payments_cover ON payments (merchant_id, created_at, amount_minor);`,
      verify: String.raw`Q = "SELECT created_at, amount_minor FROM payments WHERE merchant_id = 7 AND created_at >= '2024-04-01'"

test('the plan uses a COVERING INDEX', lambda: eq('COVERING INDEX' in plan(Q), True, plan(Q)))
test('it still searches by merchant first (not a full index scan)', lambda: eq('(merchant_id=?' in plan(Q), True, plan(Q)))
test('the data is untouched', lambda: eq(conn.execute('SELECT COUNT(*) FROM payments').fetchone()[0], 6000))
`,
      hint: 'Searching and sorting columns first (merchant_id, created_at), then append every other column the query needs to return (amount_minor). In Postgres you can use INCLUDE (amount_minor) to add it without making it part of the sort key.',
      notes: 'Covering indexes trade write cost and size for avoiding table lookups. In Postgres, index-only scans also need the visibility map to be fresh, so VACUUM matters.' },

    idx_partial: { kind: 'ddl', title: 'A partial index', minutes: 15, level: 'hard',
      prompt: `<p>Only 4% of payments are <code>'failed'</code>, but support looks at them constantly:</p><pre><code>SELECT id, created_at FROM payments
WHERE status = 'failed' AND merchant_id = 9
ORDER BY created_at</code></pre><p>Write one <code>CREATE INDEX</code> that is <b>partial</b> (contains only the failed rows, using a <code>WHERE</code> clause), is used by this query, and returns rows already sorted. A partial index is much smaller and cheaper to maintain than an index over every row.</p>`,
      schema: BIG_SCHEMA, seed: BIG_SEED,
      starter: `-- one CREATE INDEX ... WHERE ... statement\n`,
      solution: `CREATE INDEX idx_payments_failed ON payments (merchant_id, created_at) WHERE status = 'failed';`,
      verify: String.raw`Q = "SELECT id, created_at FROM payments WHERE status = 'failed' AND merchant_id = 9 ORDER BY created_at"

def defs():
    return [r[0] for r in conn.execute("SELECT sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL")]

test('the index is partial (has a WHERE clause)', lambda: eq(any(' WHERE ' in d.upper().replace('\n', ' ') for d in defs()), True, defs()))
test('the query uses the index', lambda: eq('USING INDEX' in plan(Q) or 'USING COVERING INDEX' in plan(Q), True, plan(Q)))
test('no separate sort step', lambda: eq('TEMP B-TREE' in plan(Q), False, plan(Q)))
test('the index only holds failed rows', lambda: eq(conn.execute("SELECT COUNT(*) FROM payments WHERE status = 'failed'").fetchone()[0], 240))
`,
      hint: 'CREATE INDEX name ON payments (columns) WHERE status = \'failed\'. The query\'s own WHERE clause must imply the index predicate for the planner to use it. Index merchant_id then created_at, as before.',
      notes: 'Partial indexes shine for skewed data (failed, pending, unprocessed, soft-deleted rows) and for partial UNIQUE constraints such as "one active subscription per customer". Postgres supports the same syntax.' },
  });
  window.resolveExercises();
})();
