/* Feedback fixtures: each has a seeded flaw the reviewer must catch (`must`, any-of regex groups) and
   something it must NOT claim (`mustNot`). Scoring is deliberately crude; read the raw replies too. */
export const FIXTURES = [
  {
    id: 'code-off-by-one', kind: 'code',
    prompt: 'Write moving_average(xs, k): return the list of averages of every window of k consecutive items.',
    answer: 'def moving_average(xs, k):\n    out = []\n    for i in range(len(xs) - k):\n        out.append(sum(xs[i:i+k]) / k)\n    return out',
    must: [[/off.by.one|last window|missing (the )?(last|final)|len\(xs\) ?- ?k ?\+ ?1|range\(len\(xs\) ?- ?k\)/i]],
    mustNot: [/looks (fully )?correct|no (bugs|issues)/i],
  },
  {
    id: 'code-quadratic', kind: 'code',
    prompt: 'Return True if the list has any duplicate. Input can have 10^6 items.',
    answer: 'def has_dup(xs):\n    for i in range(len(xs)):\n        for j in range(i+1, len(xs)):\n            if xs[i] == xs[j]:\n                return True\n    return False',
    must: [[/O\(n\^?2\)|quadratic|n\*\*2|n²/i], [/set|hash/i]],
    mustNot: [],
  },
  {
    id: 'code-correct', kind: 'code',
    prompt: 'Return True if the list has any duplicate. Input can have 10^6 items.',
    answer: 'def has_dup(xs):\n    seen = set()\n    for x in xs:\n        if x in seen:\n            return True\n        seen.add(x)\n    return False',
    must: [[/O\(n\)|linear/i]],
    mustNot: [/quadratic|O\(n\^?2\)|wrong|incorrect|bug/i],
  },
  {
    id: 'design-no-idempotency', kind: 'design',
    prompt: 'Design a payment initiation endpoint for a bank API that clients retry on timeouts.',
    answer: 'POST /payments takes amount, debtor, creditor and inserts a row, then calls the downstream scheme and returns 201. If it times out the client just retries. I would add a queue between the API and the scheme to scale.',
    must: [[/idempoten/i], [/duplicate|double|twice|retry/i]],
    mustNot: [],
  },
  {
    id: 'story-no-result', kind: 'story',
    prompt: 'Tell me about a time you handled a production incident.',
    answer: 'There was an outage once and we all jumped on a call. It was stressful but the team worked together a lot and everyone did their best. We eventually got it working again and I think we learned some things.',
    must: [[/\bI\b.*(specific|what (did )?you|your (own )?(role|action))|vague|specific|concrete/i], [/result|metric|number|impact|measur|root cause|learn/i]],
    mustNot: [/excellent|great answer|perfect/i],
  },
];
