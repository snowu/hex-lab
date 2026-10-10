window.RESOURCES = [
  // Open banking & Neonomics
  { cat: 'Neonomics & Open Banking', title: 'Neonomics developer docs', url: 'https://docs.neonomics.io', note: 'Primary source: UAPI guides, consent/SCA, QSeal signatures, payments. Read this before the interview.' },
  { cat: 'Neonomics & Open Banking', title: 'Neonomics: About us', url: 'https://neonomics.io/about-us', note: 'Mission, history and footprint of the company.' },
  { cat: 'Neonomics & Open Banking', title: 'Neonomics blog: Open Banking is evolving', url: 'https://neonomics.io/blog/open-banking-is-evolving-and-so-are-we', note: 'Product direction and open banking commentary.' },
  { cat: 'Neonomics & Open Banking', title: 'Berlin Group: Open Finance & NextGenPSD2', url: 'https://www.berlin-group.org/open-finance', note: 'Home of the openFinance / NextGenPSD2 API specs used by many European banks (find the downloads from here).' },
  { cat: 'Neonomics & Open Banking', title: 'EBA: PSD2 and RTS on SCA', url: 'https://www.eba.europa.eu/regulation-and-policy/payment-services-and-electronic-money', note: 'Regulatory background: strong customer authentication and secure communication.' },
  { cat: 'Neonomics & Open Banking', title: 'Open Banking Tracker', url: 'https://www.openbankingtracker.com', note: 'Directory of banks, aggregators and TPPs, useful for market context.' },
  { cat: 'Neonomics & Open Banking', title: 'ISO 20022 for developers', url: 'https://www.iso20022.org/', note: 'The messaging standard behind payment status codes.' },
  // System design
  { cat: 'System Design', title: 'The System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', note: 'Huge free repo with concepts, trade-offs and practice questions.' },
  { cat: 'System Design', title: 'AWS Builders’ Library', url: 'https://aws.amazon.com/builders-library/', note: 'Deep articles on timeouts, retries with jitter, load shedding, idempotent APIs.' },
  { cat: 'System Design', title: 'Azure Cloud Design Patterns', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/', note: 'Circuit breaker, outbox, saga, bulkhead, CQRS: vendor-neutral write-ups.' },
  { cat: 'System Design', title: 'Martin Fowler’s bliki', url: 'https://martinfowler.com/', note: 'Authoritative essays on architecture, patterns and refactoring.' },
  { cat: 'System Design', title: 'Jepsen: consistency models map', url: 'https://jepsen.io/consistency', note: 'Precise definitions of consistency models, with a hierarchy diagram.' },
  { cat: 'System Design', title: 'Google SRE books (free)', url: 'https://sre.google/books/', note: 'SLOs, error budgets, incident response, monitoring.' },
  { cat: 'System Design', title: 'MIT 6.824 / 6.5840 Distributed Systems', url: 'https://pdos.csail.mit.edu/6.824/', note: 'Free lectures, papers and labs (Raft, MapReduce).' },
  // Kafka
  { cat: 'Kafka', title: 'Apache Kafka documentation', url: 'https://kafka.apache.org/documentation/', note: 'The design section explains the log, replication and delivery semantics.' },
  { cat: 'Kafka', title: 'Confluent Developer: Kafka 101', url: 'https://developer.confluent.io/courses/apache-kafka/events/', note: 'Free short video course on topics, partitions and consumers.' },
  { cat: 'Kafka', title: 'Confluent: Exactly-once semantics', url: 'https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/', note: 'How idempotent producers and transactions work.' },
  // AWS
  { cat: 'AWS', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html', note: 'The six pillars: the vocabulary interviewers expect.' },
  { cat: 'AWS', title: 'AWS Skill Builder (free tier)', url: 'https://skillbuilder.aws/', note: 'Free digital courses and learning plans, including Cloud Practitioner prep.' },
  { cat: 'AWS', title: 'AWS IAM policy evaluation logic', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html', note: 'Exactly how Allow/Deny are combined across policy types.' },
  { cat: 'AWS', title: 'Disaster recovery of workloads on AWS', url: 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html', note: 'RTO/RPO strategies: backup & restore to multi-site active/active.' },
  // Terraform
  { cat: 'Terraform', title: 'Terraform documentation', url: 'https://developer.hashicorp.com/terraform/docs', note: 'Language, state, backends, modules.' },
  { cat: 'Terraform', title: 'HashiCorp Terraform tutorials', url: 'https://developer.hashicorp.com/terraform/tutorials', note: 'Free hands-on tutorials (AWS track included).' },
  { cat: 'Terraform', title: 'OpenTofu', url: 'https://opentofu.org/docs/', note: 'Open-source fork. Knowing both is a plus.' },
  // Coding
  { cat: 'Coding Practice', title: 'NeetCode roadmap', url: 'https://neetcode.io/roadmap', note: 'Free curated problem roadmap with explanations.' },
  { cat: 'Coding Practice', title: 'Exercism: JavaScript track', url: 'https://exercism.org/tracks/javascript', note: 'Free, mentored practice with tests.' },
  { cat: 'Coding Practice', title: 'MDN: JavaScript guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', note: 'Language reference for async, Map/Set, modules.' },
  { cat: 'Coding Practice', title: 'Big-O cheat sheet', url: 'https://www.bigocheatsheet.com/', note: 'Quick complexity reference for data structures and sorts.' },
  // AI
  { cat: 'AI Engineering', title: 'Anthropic: prompt engineering overview', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview', note: 'Practical prompting techniques from the model vendor.' },
  { cat: 'AI Engineering', title: 'Anthropic: Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents', note: 'Patterns for workflows vs agents, tools and evaluation.' },
  { cat: 'AI Engineering', title: 'Hugging Face LLM course', url: 'https://huggingface.co/learn/llm-course', note: 'Free course on transformers and using LLMs.' },
  { cat: 'AI Engineering', title: 'OWASP Top 10 for LLM applications', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', note: 'Prompt injection, insecure output handling and more.' },
  { cat: 'AI Engineering', title: 'Andrej Karpathy: Intro to LLMs (video)', url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g', note: 'One-hour mental model of how LLMs work.' },
  // Security & career
  { cat: 'Security & Career', title: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/', note: 'BOLA/IDOR and other API risks you should spot in code review.' },
  { cat: 'Security & Career', title: 'The Pragmatic Engineer: senior+ levels', url: 'https://blog.pragmaticengineer.com/', note: 'Industry perspective on levels, expectations and interviews.' },
  { cat: 'Security & Career', title: 'Stripe: Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests', note: 'Reference design for idempotency keys in a payments API.' },
];
