TRACKS.push({
  id: 'cloud', icon: '☁️', title: 'Scale, Kafka, AWS & Terraform',
  blurb: 'Scalability reasoning, Kafka internals, AWS building blocks and infrastructure-as-code: the platform half of a senior interview.',
  lessons: [
    {
      id: 'scalability', title: 'Scalability fundamentals', minutes: 15,
      summary: 'Find the bottleneck, scale statelessly, shed load, and do the maths.',
      sections: [
        { type: 'text', html: `
<h3>The scaling playbook (in the order you should reach for it)</h3>
<ol>
<li><b>Measure first.</b> Profile, find the real bottleneck (CPU, DB, network, a lock, one hot partition). Scaling the wrong tier wastes money.</li>
<li><b>Make services stateless</b> (state in DB/cache/queue) so you can add instances behind a load balancer.</li>
<li><b>Cache</b> reads, <b>batch</b> writes, add <b>indexes</b>, fix N+1 queries.</li>
<li><b>Go async:</b> move slow or bursty work behind a queue; absorb spikes instead of provisioning for them.</li>
<li><b>Scale data:</b> read replicas → partition/shard → purpose-built stores (search, time series, KV).</li>
<li><b>Protect yourself:</b> rate limits, backpressure, load shedding, timeouts, bulkheads.</li>
</ol>
<h3>Useful laws</h3>
<ul>
<li><b>Little’s Law:</b> <code>concurrency = arrival rate × latency</code>. 200 req/s at 0.5 s average needs ~100 requests in flight. If latency doubles, so does the concurrency you need, which is how a slow dependency exhausts your pool.</li>
<li><b>Amdahl’s Law:</b> the serial fraction caps speed-up. If 10% is serial, the maximum speed-up is 10× however many nodes you add.</li>
<li><b>Tail latency:</b> with fan-out to N backends, the chance at least one is slow rises fast. Watch p99, use hedged requests and timeouts.</li>
<li><b>Utilisation vs queueing:</b> latency explodes as utilisation nears 100%. Keep headroom (about 60-70% target) and autoscale on a leading signal.</li>
</ul>
<div class="callout"><b>Say this in interviews:</b> “What is the bottleneck, how will we know, what is the cheapest change that moves it, and what breaks next?”</div>` },
        { type: 'quiz', q: 'Your API averages 400 ms latency at 500 req/s. A dependency slows it to 800 ms. Roughly how many concurrent requests are now in flight, assuming no load shedding?',
          options: ['200', '400', '500', '1,000'], answer: 1, explain: 'Little’s law: 500 × 0.8 = 400 (it was 200). Without limits or timeouts you will run out of threads, connections or memory. This is why timeouts and bulkheads matter.' },
        { type: 'quiz', q: 'CPU on your service is 30%, yet p99 latency is terrible and the database shows 95% CPU. What do you scale?',
          options: ['More app instances', 'The database tier or its access pattern (indexes, caching, replicas, query fixes)', 'Nothing', 'The load balancer'],
          answer: 1, explain: 'Adding app instances would increase DB pressure further. Always scale or fix the actual bottleneck.' },
        { type: 'quiz', q: 'Which is the best way to survive a 10× traffic spike that lasts 3 minutes (e.g. a marketing push)?',
          options: ['Permanently provision for 10×', 'Queue non-urgent work, cache, rate-limit/shed low-priority traffic, and autoscale with pre-warmed capacity', 'Hope', 'Restart servers'],
          answer: 1, explain: 'Provisioning for peak is expensive. Combine buffering, degradation and elasticity, and load-test the plan beforehand.' },
        { type: 'code', title: 'Autoscaling calculation', prompt: `<p>A Kafka consumer group must drain its backlog. Implement <code>desiredReplicas({lag, ratePerConsumer, drainSeconds, partitions, min = 1})</code>: the number of consumers needed to clear <code>lag</code> messages in <code>drainSeconds</code> if each processes <code>ratePerConsumer</code> msg/s, rounded <b>up</b>, never below <code>min</code>, and never above <code>partitions</code> (extra consumers would sit idle).</p>`,
          starter: `function desiredReplicas({ lag, ratePerConsumer, drainSeconds, partitions, min = 1 }) {
}
`,
          tests: `
test('rounds up', () => eq(desiredReplicas({lag:100000, ratePerConsumer:500, drainSeconds:60, partitions:12}), 4));
test('capped at partitions', () => eq(desiredReplicas({lag:100000, ratePerConsumer:500, drainSeconds:60, partitions:3}), 3));
test('min applies when no lag', () => eq(desiredReplicas({lag:0, ratePerConsumer:500, drainSeconds:60, partitions:12}), 1));
test('custom min', () => eq(desiredReplicas({lag:10, ratePerConsumer:500, drainSeconds:60, partitions:12, min:2}), 2));
test('exact fit does not over-provision', () => eq(desiredReplicas({lag:60000, ratePerConsumer:500, drainSeconds:60, partitions:12}), 2));
test('min cannot exceed partitions', () => eq(desiredReplicas({lag:0, ratePerConsumer:1, drainSeconds:1, partitions:2, min:5}), 2));`,
          hint: 'need = ceil(lag / (rate * drain)); then clamp: max(min, need), then min(partitions, ...). Clamp to partitions last.',
          solution: `function desiredReplicas({ lag, ratePerConsumer, drainSeconds, partitions, min = 1 }) {
  const need = Math.ceil(lag / (ratePerConsumer * drainSeconds));
  return Math.min(partitions, Math.max(min, need));
}`, notes: 'The cap by partitions is the key insight: in Kafka, parallelism within a group is bounded by partition count, so plan partitions for peak parallelism up front (increasing later breaks key ordering).' },
      ],
    },
    {
      id: 'kafka', title: 'Kafka: partitions, groups, delivery guarantees', minutes: 25,
      summary: 'What you must be able to explain, plus partitioner and assignment code.',
      sections: [
        { type: 'text', html: `
<h3>Mental model</h3>
<p>Kafka is a <b>distributed, partitioned, replicated commit log</b>. A <b>topic</b> is split into <b>partitions</b>; each partition is an ordered, append-only log with a <b>leader</b> and follower replicas. Messages keep their position (<b>offset</b>), and consumers track their own offsets, so reading does not delete data (retention is time/size based; <i>compacted</i> topics keep the latest value per key).</p>
<table>
<tr><th>Concept</th><th>Why it matters</th></tr>
<tr><td>Key → partition</td><td><code>hash(key) mod partitions</code> keeps all events of one entity (e.g. a payment id) in one partition, so they stay <b>ordered</b>. Ordering is guaranteed <b>only within a partition</b>.</td></tr>
<tr><td>Consumer group</td><td>Partitions are divided among the group’s consumers; each partition is read by <b>one consumer per group</b>. More consumers than partitions → idle ones. Different groups each get all messages.</td></tr>
<tr><td>Rebalance</td><td>When members join/leave, partitions are reassigned and processing pauses. Prefer cooperative/sticky assignors, static membership, and short, idempotent processing.</td></tr>
<tr><td>Replication</td><td><code>replication.factor=3</code>, <code>min.insync.replicas=2</code>, producer <code>acks=all</code>: survives a broker loss without losing acknowledged writes (at the cost of latency).</td></tr>
<tr><td>Producer idempotence</td><td><code>enable.idempotence=true</code> dedupes producer retries inside a partition.</td></tr>
</table>
<h3>Delivery semantics</h3>
<ul>
<li><b>At-most-once:</b> commit offset <i>before</i> processing; a crash loses messages.</li>
<li><b>At-least-once</b> (the usual default): process, <i>then</i> commit; a crash causes redelivery, so <b>consumers must be idempotent</b>.</li>
<li><b>Exactly-once</b> exists inside Kafka (idempotent producer + transactions, read-process-write between topics), but not for external side effects such as calling a bank. For those: at-least-once + idempotency keys / dedupe table / outbox.</li>
</ul>
<h3>Operational realities</h3>
<ul><li><b>Poison messages:</b> retry with backoff topics, then a <b>dead-letter topic</b>, never block a partition forever or silently skip.</li>
<li><b>Hot partitions:</b> a skewed key (one huge merchant) overloads one partition. Salt the key if ordering allows.</li>
<li><b>Consumer lag</b> is the key health metric. Alert on lag growth rate and age of the oldest unprocessed message.</li>
<li><b>Schemas:</b> use a schema registry (Avro/Protobuf/JSON Schema) with compatibility rules so producers cannot break consumers.</li>
<li><b>Partition count</b> is hard to change safely (it remaps keys), so size it for the future.</li></ul>` },
        { type: 'code', title: 'Keyed partitioner', prompt: `<p>Implement <code>partitionFor(key, numPartitions)</code> using the provided <code>hash</code>: deterministic, always in <code>[0, numPartitions)</code>, and throwing a <code>RangeError</code> if <code>numPartitions</code> is not a positive integer.</p>`,
          starter: `function hash(str) { // FNV-1a, 32-bit
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function partitionFor(key, numPartitions) {
}
`,
          tests: `
test('in range', () => { for (let i=0;i<500;i++) { const p=partitionFor('k'+i,7); assert(Number.isInteger(p)&&p>=0&&p<7, 'out of range: '+p); } });
test('deterministic', () => eq(partitionFor('payment-42',12), partitionFor('payment-42',12)));
test('spreads keys', () => { const s=new Set(); for (let i=0;i<200;i++) s.add(partitionFor('k'+i,8)); assert(s.size>=6, 'only '+s.size+' partitions used'); });
test('single partition', () => eq(partitionFor('x',1), 0));
test('invalid count throws', async () => { await throws(() => partitionFor('x',0)); await throws(() => partitionFor('x',-3)); await throws(() => partitionFor('x',2.5)); });`,
          hint: 'hash(String(key)) % numPartitions after validating the count. Hash is already unsigned, so no negative modulo.',
          solution: `function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function partitionFor(key, numPartitions) {
  if (!Number.isInteger(numPartitions) || numPartitions <= 0) throw new RangeError('numPartitions must be a positive integer');
  return hash(String(key)) % numPartitions;
}`, notes: 'Kafka’s default partitioner uses murmur2 on the key bytes. Follow-up: what happens to ordering if you increase the partition count? (Keys remap; old and new messages for a key can land in different partitions.)' },
        { type: 'code', title: 'Range assignment for a consumer group', prompt: `<p>Implement <code>assignRange(numPartitions, consumers)</code> mimicking Kafka’s range assignor for a single topic. Sort consumer ids; each gets <code>floor(n/c)</code> <b>contiguous</b> partitions, and the first <code>n mod c</code> consumers get one extra. Return an object <code>{consumerId: [partitions]}</code> including consumers with an empty list. No consumers → <code>{}</code>.</p>`,
          starter: `function assignRange(numPartitions, consumers) {
}
`,
          tests: `
test('even', () => eq(assignRange(6,['b','a']), {a:[0,1,2], b:[3,4,5]}));
test('remainder to first consumers', () => eq(assignRange(7,['a','b','c']), {a:[0,1,2], b:[3,4], c:[5,6]}));
test('more consumers than partitions', () => eq(assignRange(2,['a','b','c']), {a:[0], b:[1], c:[]}));
test('no consumers', () => eq(assignRange(4,[]), {}));
test('every partition assigned exactly once', () => { const r=assignRange(13,['x','y','z','w']); const all=Object.values(r).flat().sort((a,b)=>a-b); eq(all, Array.from({length:13},(_,i)=>i)); });
test('does not mutate input', () => { const c=['b','a']; assignRange(4,c); eq(c,['b','a']); });`,
          hint: 'Copy and sort consumers. base = floor(n/c), extra = n % c. For consumer i: count = base + (i < extra ? 1 : 0); start = running offset.',
          solution: `function assignRange(numPartitions, consumers) {
  const sorted = [...consumers].sort();
  const out = {};
  if (!sorted.length) return out;
  const base = Math.floor(numPartitions / sorted.length), extra = numPartitions % sorted.length;
  let next = 0;
  sorted.forEach((c, i) => {
    const count = base + (i < extra ? 1 : 0);
    out[c] = Array.from({ length: count }, (_, k) => next + k);
    next += count;
  });
  return out;
}`, notes: 'Compare with round-robin (spreads evenly across topics), sticky (minimises movement on rebalance) and cooperative-sticky (incremental rebalance without stop-the-world).' },
        { type: 'quiz', q: 'Payment events for the same payment id must be processed in order. Which design guarantees it?',
          options: ['Many partitions with random keys', 'Use the payment id as the message key so they hash to one partition, and process each partition sequentially', 'One topic per consumer', 'Timestamps on messages'],
          answer: 1, explain: 'Per-key ordering comes from keyed partitioning plus sequential processing per partition. Parallelise <i>across</i> keys, not within one.' },
        { type: 'quiz', q: 'Your consumer does: poll → write to DB → commit offset. It crashes after the DB write, before the commit. What happens, and what must be true?',
          options: ['Message lost; nothing to do', 'The message is redelivered (at-least-once), so the DB write must be idempotent (upsert by event id / unique constraint)', 'Kafka rolls back the DB', 'Exactly-once is guaranteed automatically'],
          answer: 1, explain: 'Kafka’s transactional exactly-once does not extend to your database. Make handlers idempotent or use the transactional outbox/inbox pattern.' },
        { type: 'quiz', q: 'A group has 12 partitions and 20 consumers. What is true?',
          options: ['All 20 consume in parallel', '8 consumers are idle; parallelism is capped by the partition count', 'Kafka creates more partitions', 'Messages are duplicated to all consumers'],
          answer: 1, explain: 'Within a group, one partition → one consumer. Extra members are standby for failover only.' },
        { type: 'reveal', title: 'Kafka vs SQS/RabbitMQ: how to answer', html: `<ul><li><b>Kafka:</b> replayable log, high throughput, ordering per key, multiple independent consumer groups, stream processing. You manage partitions/ordering; heavier to operate (or use MSK/Confluent).</li><li><b>SQS:</b> fully managed queue, per-message ack, visibility timeout, DLQ built in, effectively unlimited scale; no replay, no ordering unless FIFO queues (with throughput limits).</li><li><b>RabbitMQ:</b> rich routing (exchanges), per-message ack, good for task queues and complex routing; lower throughput than Kafka.</li><li>Pick by need: replay/fan-out/stream processing → Kafka; simple decoupled jobs → SQS; routing flexibility → RabbitMQ.</li></ul>` },
      ],
    },
    {
      id: 'aws', title: 'AWS building blocks for senior engineers', minutes: 25,
      summary: 'Compute, data, messaging, networking, security and how to choose.',
      sections: [
        { type: 'text', html: `
<p>You are not expected to know every service. You are expected to <b>pick appropriately, explain the trade-off, and design for failure</b>.</p>
<table>
<tr><th>Need</th><th>Typical choices</th><th>Trade-off to mention</th></tr>
<tr><td>Compute</td><td>Lambda · ECS/Fargate · EKS · EC2</td><td>Lambda: no servers, cold starts, 15-min limit, concurrency limits. Fargate: simple containers. EKS: max flexibility and most operational burden. EC2: full control, you patch.</td></tr>
<tr><td>Relational data</td><td>RDS · Aurora (Multi-AZ, read replicas)</td><td>Multi-AZ = <i>availability</i> (sync standby, failover). Read replicas = <i>read scaling</i> (async, lag). Different problems.</td></tr>
<tr><td>Key-value at scale</td><td>DynamoDB</td><td>Predictable single-digit-ms at any scale; you must design around access patterns and partition keys; no ad-hoc joins. Hot partitions.</td></tr>
<tr><td>Cache</td><td>ElastiCache (Redis/Valkey)</td><td>Invalidation and stampedes; not a source of truth.</td></tr>
<tr><td>Queue / pub-sub</td><td>SQS · SNS · EventBridge · Kinesis · MSK</td><td>SNS fan-out → SQS per consumer is a common pattern. EventBridge for routing between services/SaaS. Kinesis/MSK for ordered replayable streams.</td></tr>
<tr><td>Object storage</td><td>S3</td><td>11 nines durability, strong read-after-write consistency, lifecycle tiers; not a file system.</td></tr>
<tr><td>Edge &amp; ingress</td><td>CloudFront · ALB/NLB · API Gateway · WAF</td><td>Cache and absorb attacks at the edge; ALB for HTTP routing, NLB for L4/static IPs.</td></tr>
<tr><td>Secrets &amp; keys</td><td>KMS · Secrets Manager · Parameter Store · CloudHSM</td><td>Envelope encryption, key policies and rotation; CloudHSM when you need dedicated, single-tenant HSMs.</td></tr>
</table>
<h3>Design for failure</h3>
<ul>
<li><b>Region → AZ:</b> spread across ≥ 2-3 AZs. Multi-region only when RTO/RPO or regulation demands it (cost and complexity jump: data replication, failover, testing).</li>
<li><b>RTO/RPO:</b> how long can we be down, how much data can we lose? Backup &amp; restore → pilot light → warm standby → active/active, rising in cost.</li>
<li><b>Shared responsibility:</b> AWS secures the cloud; you secure what you put in it (IAM, data, config).</li>
<li><b>Well-Architected pillars:</b> operational excellence, security, reliability, performance, cost, sustainability.</li>
</ul>
<h3>Security fundamentals</h3>
<ul>
<li><b>IAM:</b> least privilege, roles over long-lived keys, no wildcards on resources you can name, separate accounts per environment (AWS Organizations + SCPs). Evaluation logic: <b>explicit Deny wins, otherwise an Allow is needed, otherwise implicit deny.</b></li>
<li>Private subnets for data/compute, <b>VPC endpoints</b> to reach AWS services without the internet, security groups as the main firewall.</li>
<li>Encrypt at rest (KMS) and in transit; CloudTrail + GuardDuty + Config for audit and detection. Particularly relevant in regulated finance.</li>
</ul>` },
        { type: 'code', title: 'Evaluate IAM-style policies', prompt: `<p>Implement <code>evaluate(statements, action, resource)</code> returning <code>'ALLOW'</code> or <code>'DENY'</code>. Each statement is <code>{effect: 'Allow'|'Deny', actions: [...], resources: [...]}</code>. Patterns may contain <code>*</code> (matches any characters, including none; every other character is literal). Rules: if any matching <b>Deny</b> exists → DENY; else if any matching <b>Allow</b> exists → ALLOW; else DENY (implicit). A statement matches only if <b>both</b> an action pattern and a resource pattern match. Actions compare case-insensitively; resources are case-sensitive.</p>`,
          starter: `function evaluate(statements, action, resource) {
}
`,
          tests: `
const S = [
  { effect:'Allow', actions:['s3:GetObject','s3:ListBucket'], resources:['arn:aws:s3:::reports/*','arn:aws:s3:::reports'] },
  { effect:'Deny',  actions:['s3:*'], resources:['arn:aws:s3:::reports/secret/*'] },
];
test('allowed read', () => eq(evaluate(S,'s3:GetObject','arn:aws:s3:::reports/q1.csv'),'ALLOW'));
test('explicit deny beats allow', () => eq(evaluate(S,'s3:GetObject','arn:aws:s3:::reports/secret/keys.txt'),'DENY'));
test('implicit deny', () => eq(evaluate(S,'s3:PutObject','arn:aws:s3:::reports/q1.csv'),'DENY'));
test('other resource denied', () => eq(evaluate(S,'s3:GetObject','arn:aws:s3:::other/x'),'DENY'));
test('action is case-insensitive', () => eq(evaluate(S,'S3:getobject','arn:aws:s3:::reports/a'),'ALLOW'));
test('resource is case-sensitive', () => eq(evaluate(S,'s3:GetObject','arn:aws:s3:::REPORTS/a'),'DENY'));
test('regex chars are literal', () => eq(evaluate([{effect:'Allow',actions:['a:b'],resources:['x.y+(z)']}],'a:b','xzy+(z)'),'DENY'));
test('star matches everything', () => eq(evaluate([{effect:'Allow',actions:['*'],resources:['*']}],'any:thing','whatever'),'ALLOW'));
test('empty policy', () => eq(evaluate([],'a:b','c'),'DENY'));
test('needs both action and resource to match', () => eq(evaluate([{effect:'Deny',actions:['s3:Delete*'],resources:['arn:aws:s3:::reports/*']},{effect:'Allow',actions:['s3:*'],resources:['*']}],'s3:GetObject','arn:aws:s3:::reports/a'),'ALLOW'));`,
          hint: 'Write glob(pattern, caseInsensitive) that escapes regex special chars, then turns \\* into .*, anchored with ^ and $.',
          solution: `function glob(pattern, ci) {
  const re = '^' + pattern.split('*').map((p) => p.replace(/[.+?^\${}()|[\\]\\\\]/g, '\\\\$&')).join('.*') + '$';
  return new RegExp(re, ci ? 'i' : '');
}
function evaluate(statements, action, resource) {
  const matches = (s) => s.actions.some((a) => glob(a, true).test(action)) && s.resources.some((r) => glob(r, false).test(resource));
  const hit = statements.filter(matches);
  if (hit.some((s) => s.effect === 'Deny')) return 'DENY';
  return hit.some((s) => s.effect === 'Allow') ? 'ALLOW' : 'DENY';
}`, notes: 'Real IAM also has principals, conditions, permission boundaries, SCPs and session policies; all must allow, and any explicit deny at any layer wins.' },
        { type: 'quiz', q: 'You need to absorb bursty payment-status events from many producers, and three independent services must each process every event. Best AWS-native pattern?',
          options: ['One SQS queue read by three services', 'SNS topic (or EventBridge) fanning out to one SQS queue per service, each with a DLQ', 'Direct HTTP calls to all three', 'Write to S3 and poll'],
          answer: 1, explain: 'A single queue would split messages among consumers (competing consumers). Fan-out to a queue per subscriber gives each its own copy, retries and DLQ. Kinesis/MSK is the alternative if you need ordered replay.' },
        { type: 'quiz', q: 'RDS “Multi-AZ” is enabled. A teammate says reads are now scaled. Correct response?',
          options: ['Yes, standby serves reads', 'No: Multi-AZ gives failover availability (standby is not readable in the classic setup); scale reads with read replicas or caching', 'Yes, but only on Tuesdays', 'Multi-AZ replaces backups'],
          answer: 1, explain: 'Availability vs read scaling are different mechanisms. (Aurora and newer RDS Multi-AZ cluster options have readable standbys, so be precise about which product and mode.) Multi-AZ also is not a backup.' },
        { type: 'quiz', q: 'A Lambda behind SQS is overwhelming a downstream bank API during a backlog. What control fits best?',
          options: ['Increase memory', 'Set a maximum concurrency on the event source mapping / function (reserved concurrency) to cap parallel calls, plus retries with backoff and a DLQ', 'Delete the queue', 'Use bigger instances'],
          answer: 1, explain: 'Queues + concurrency caps turn a spike into a controlled drain. Pair with a per-dependency rate limiter and circuit breaker.' },
        { type: 'reveal', title: 'Prompt: “Design deployments across two AZs with zero-downtime releases”', html: `<ul><li>ALB across 2-3 AZs → ECS/Fargate or EKS services with ≥ 2 tasks per AZ; health checks with sensible grace periods.</li><li>Rolling or blue/green (CodeDeploy / weighted target groups) with automatic rollback on alarm; canary a small % first.</li><li>DB migrations backward compatible (expand → migrate → contract) so old and new code can run together.</li><li>Aurora/RDS Multi-AZ; Secrets Manager; autoscaling on a leading metric (queue depth/requests per target).</li><li>Observability tied to the release: dashboards and SLO alarms that gate the rollout.</li></ul>` },
      ],
    },
    {
      id: 'terraform', title: 'Terraform & infrastructure as code', minutes: 22,
      summary: 'State, plan/apply, modules, drift, safety. Implement plan diffing and dependency order.',
      sections: [
        { type: 'text', html: `
<p><b>Terraform</b> (or the open-source fork <b>OpenTofu</b>) is <b>declarative</b>: you describe the desired infrastructure, it compares that with the recorded <b>state</b> and the real world, and produces a <b>plan</b> of creates, updates and destroys. It builds a <b>dependency graph</b> from references between resources and applies independent resources in parallel.</p>
<pre><code>resource "aws_sqs_queue" "payments_dlq" { name = "payments-dlq" }

resource "aws_sqs_queue" "payments" {
  name = "payments"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payments_dlq.arn   # implicit dependency
    maxReceiveCount     = 5
  })
}</code></pre>
<h3>Things seniors are asked</h3>
<ul>
<li><b>State:</b> maps config to real resources and may contain <b>secrets in plain text</b>. Use a <b>remote backend</b> (e.g. S3, encrypted, versioned) with <b>locking</b> so two applies cannot race (DynamoDB table historically, S3 native lockfile in newer versions), restricted access, and never commit state.</li>
<li><b>Drift:</b> reality differs from state (console clicks). <code>plan</code> reveals it; fix by reapplying, importing, or updating the config. Prevent with restricted console access and drift-detection CI.</li>
<li><b>Safe delivery:</b> PR → <code>fmt/validate/lint/security scan</code> → <code>plan</code> posted for review → approved <code>apply</code> from CI with least-privilege role. Apply the <b>saved plan file</b> so what was reviewed is what runs.</li>
<li><b>Modules:</b> reusable, versioned, small interfaces. Don’t over-abstract; prefer composition. Pin provider and module versions.</li>
<li><b>Environments:</b> separate state per environment/account (directories or workspaces with care). Blast-radius control: split state by lifecycle and ownership, not one giant state.</li>
<li><b><code>count</code> vs <code>for_each</code>:</b> with <code>count</code>, removing a middle element shifts indexes and may destroy/recreate resources. <code>for_each</code> with stable keys avoids that.</li>
<li><b>Refactoring:</b> <code>moved</code> blocks rename without recreating; <code>import</code> adopts existing resources; <code>lifecycle { prevent_destroy = true }</code> guards stateful resources; <code>create_before_destroy</code> for zero-downtime replacement.</li>
<li><b>Danger:</b> a plan that shows <code>-/+ destroy and then create replacement</code> on a database. Read plans carefully; <code>-target</code> is an escape hatch, not a workflow.</li>
<li><b>Secrets:</b> don’t put them in variables with defaults or in state if avoidable; reference Secrets Manager/SSM, mark outputs <code>sensitive</code> (which only hides display, not state).</li>
</ul>` },
        { type: 'code', title: 'Compute a plan (create / update / delete)', prompt: `<p>Implement <code>plan(desired, current)</code>. Both are objects mapping a resource name to its config object. Return <code>{create, update, delete}</code>, each an <b>alphabetically sorted</b> array of names: <code>create</code> = only in desired; <code>delete</code> = only in current; <code>update</code> = in both but with <b>deeply different</b> configs (key order must not matter, nested objects and arrays compared by value).</p>`,
          starter: `function plan(desired, current) {
}
`,
          tests: `
test('create/delete/update', () => eq(plan({a:{x:1}, b:{x:2}}, {b:{x:3}, c:{x:1}}), {create:['a'], update:['b'], delete:['c']}));
test('no changes', () => eq(plan({a:{x:1,y:[1,2]}}, {a:{y:[1,2],x:1}}), {create:[], update:[], delete:[]}));
test('nested change detected', () => eq(plan({a:{t:{k:1}}}, {a:{t:{k:2}}}).update, ['a']));
test('array order matters', () => eq(plan({a:{l:[1,2]}}, {a:{l:[2,1]}}).update, ['a']));
test('sorted output', () => eq(plan({z:{},m:{},a:{}}, {}).create, ['a','m','z']));
test('empty both', () => eq(plan({}, {}), {create:[], update:[], delete:[]}));
test('null vs missing key differ', () => eq(plan({a:{x:null}}, {a:{}}).update, ['a']));`,
          hint: 'Write a stable stringify (sort object keys recursively) and compare strings. Or write deepEqual. Take care that null and a missing key are not equal.',
          solution: `function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
function plan(desired, current) {
  const d = Object.keys(desired), c = Object.keys(current);
  return {
    create: d.filter((k) => !(k in current)).sort(),
    update: d.filter((k) => k in current && stable(desired[k]) !== stable(current[k])).sort(),
    delete: c.filter((k) => !(k in desired)).sort(),
  };
}`, notes: 'Real Terraform also distinguishes in-place updates from forced replacement (certain attributes are immutable) and computes values that are only known after apply.' },
        { type: 'code', title: 'Apply order from a dependency graph', prompt: `<p>Implement <code>applyOrder(graph)</code> where <code>graph</code> maps each resource to an array of resources it <b>depends on</b>. Return an array where every resource appears <b>after</b> its dependencies. Among resources that are ready at the same time, choose <b>alphabetically</b> for determinism. Throw <code>Error('cycle')</code> if there is a cycle and <code>Error('unknown dependency: X')</code> if a dependency is not a key of the graph.</p>`,
          starter: `function applyOrder(graph) {
}
`,
          tests: `
test('simple chain', () => eq(applyOrder({app:['db'], db:['vpc'], vpc:[]}), ['vpc','db','app']));
test('alphabetical among ready', () => eq(applyOrder({c:[], a:[], b:[]}), ['a','b','c']));
test('diamond', () => eq(applyOrder({vpc:[], sg:['vpc'], subnet:['vpc'], ec2:['sg','subnet']}), ['vpc','sg','subnet','ec2']));
test('empty', () => eq(applyOrder({}), []));
test('cycle throws', async () => { const e = await throws(() => applyOrder({a:['b'], b:['a']})); eq(e.message,'cycle'); });
test('self cycle throws', async () => { const e = await throws(() => applyOrder({a:['a']})); eq(e.message,'cycle'); });
test('unknown dependency', async () => { const e = await throws(() => applyOrder({a:['nope']})); eq(e.message,'unknown dependency: nope'); });`,
          hint: 'Kahn’s algorithm: count unmet dependencies per node, repeatedly take the alphabetically-first node with zero, then decrement its dependants. If you cannot place all nodes, there is a cycle.',
          solution: `function applyOrder(graph) {
  const names = Object.keys(graph);
  const remaining = new Map(), dependants = new Map(names.map((n) => [n, []]));
  for (const n of names) {
    for (const d of graph[n]) if (!(d in graph)) throw new Error('unknown dependency: ' + d);
    remaining.set(n, graph[n].length);
    for (const d of graph[n]) dependants.get(d).push(n);
  }
  const ready = names.filter((n) => remaining.get(n) === 0).sort();
  const order = [];
  while (ready.length) {
    const n = ready.shift();
    order.push(n);
    for (const m of dependants.get(n)) {
      remaining.set(m, remaining.get(m) - 1);
      if (remaining.get(m) === 0) { ready.push(m); ready.sort(); }
    }
  }
  if (order.length !== names.length) throw new Error('cycle');
  return order;
}`, notes: 'Terraform walks the same kind of DAG but runs independent nodes in parallel (default 10 at a time), and applies destroys in reverse dependency order.' },
        { type: 'quiz', q: 'A teammate changed a security group in the AWS console. Your next <code>terraform plan</code>…',
          options: ['Shows no changes', 'Detects the drift (refreshes real state) and proposes to revert it to match your code', 'Fails', 'Updates your code automatically'],
          answer: 1, explain: 'Plan compares code with refreshed real-world state. Decide per change: revert (apply) or codify it in config. Better: remove console write access and run scheduled drift detection.' },
        { type: 'quiz', q: 'A <code>plan</code> in CI shows “forces replacement” on the production RDS instance. What should you do?',
          options: ['Apply anyway, CI is green', 'Stop. Find which attribute forces replacement, avoid it (or plan a migration/snapshot), and protect the resource with <code>prevent_destroy</code>', 'Use -target to skip it', 'Delete the state'],
          answer: 1, explain: 'Replacement of a stateful resource means data loss or downtime. Plan review is the safety net, and lifecycle guards back it up.' },
        { type: 'quiz', q: 'You use <code>count = length(var.names)</code> to create buckets and remove the first name from the list. What happens?',
          options: ['Only the first bucket is destroyed', 'Indexes shift, so many buckets are modified or destroyed and recreated; use <code>for_each</code> keyed by name', 'Nothing', 'Terraform refuses'],
          answer: 1, explain: 'count identifies instances by position. for_each identifies them by a stable key, so removing one entry only affects that resource.' },
      ],
    },
  ],
});
