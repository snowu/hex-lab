TRACKS.push({
  id: 'playbook', icon: '🧭', title: 'Senior Playbook',
  blurb: 'What interviewers actually look for at senior level, how to tell your stories, and how to interview well when everyone has AI.',
  lessons: [
    {
      id: 'senior-signals', title: 'What “senior” means in an interview', minutes: 8,
      summary: 'Scope, ambiguity, trade-offs, ownership, multiplying others.',
      checks: [
        { q: 'You can only ask one question before a vague design prompt, then you must proceed. What shows you can drive under ambiguity?',
          options: ['Wait for the interviewer to volunteer the missing requirements', 'State your assumptions out loud, pick sensible defaults, and move on', 'Pick the most familiar architecture so you cannot go wrong', 'Solve the smallest slice you are sure about and stop there'],
          answer: 1, explain: 'The ambiguity signal is stating assumptions and committing to defaults instead of waiting to be told.' },
        { q: '“We used Kafka because it is the industry standard.” What is missing from this answer?',
          options: ['The version number of Kafka that was used', 'The trade-off: what the choice costs and what it buys, plus when you would revisit it', 'A comparison with every alternative message broker', 'An apology for not using a newer system'],
          answer: 1, explain: 'Senior answers name the cost of the choice and the revisit condition. “Industry standard” is not a reason.' },
      ],
      sections: [
        { type: 'text', html: `
<p>Mid-level engineers are evaluated on <b>whether they can solve the problem</b>. Senior engineers are evaluated on <b>whether they pick the right problem, solve it in a way the team can live with, and leave others better off</b>. Interviewers listen for five signals:</p>
<table><tr><th>Signal</th><th>What it sounds like</th></tr>
<tr><td>Scope</td><td>“Before I design anything, who are the users and what happens if this is down for an hour?”</td></tr>
<tr><td>Ambiguity</td><td>You state assumptions out loud, pick defaults, and move on instead of waiting to be told.</td></tr>
<tr><td>Trade-offs</td><td>Every decision has a “because” and a “this costs us…”. No silver bullets.</td></tr>
<tr><td>Ownership</td><td>You talk about operating it: on-call, rollouts, metrics, incidents, cost.</td></tr>
<tr><td>Multiplying</td><td>Mentoring, writing design docs, unblocking, raising the bar in review.</td></tr></table>
<div class="callout"><b>Rule of thumb:</b> if you answer in the form <i>“Option A is X, option B is Y, I would choose A because Z, and I would revisit if W”</i>, you already sound senior.</div>` },
        { type: 'quiz', q: 'An interviewer gives you a vague design prompt: “Build a notification system.” What is the strongest first move?',
          options: ['Start drawing boxes for Kafka and Redis', 'Ask clarifying questions, then state assumptions and a rough scale', 'Ask the interviewer to give the full requirements', 'Describe the tech stack you used last time'],
          answer: 1, explain: 'Clarifying <i>and then committing to explicit assumptions</i> shows you can drive under ambiguity. Handing the problem back (option 3) is the classic mid-level tell.' },
        { type: 'quiz', q: 'Which statement signals seniority the most?',
          options: ['“I used the latest framework so it scales.”', '“We chose a queue here; it adds operational cost and makes debugging harder, but it protects the bank API from our burst traffic.”', '“I can build anything given enough time.”', '“I always follow best practices.”'],
          answer: 1, explain: 'Naming the cost of your choice, and what it buys you, is the core senior skill.' },
        { type: 'reveal', title: 'Self-check: your five stories', html: `<p>Prepare <b>five</b> real stories you can bend to many questions: (1) a technical decision with trade-offs, (2) a production incident you owned, (3) a conflict or disagreement, (4) a time you raised the bar for others, (5) a failure. Write each as: <i>context → your decision → result with a number → what you would do differently</i>.</p>` },
      ],
    },
    {
      id: 'behavioral', title: 'Behavioral answers that land', minutes: 8,
      summary: 'STAR+ with impact and reflection.',
      checks: [
        { q: 'What does the “+” add to a STAR answer?',
          options: ['A second result in case the first one is weak', 'Reflection: what you learned or changed afterwards', 'Praise for the teammates who helped you', 'A question back to the interviewer'],
          answer: 1, explain: 'The + is the learning loop: what you changed in a system or habit, not just how you felt.' },
        { q: 'Your draft answer ends with “and it got much faster.” What is the single most important fix?',
          options: ['Make it shorter so it fits in one minute', 'Add a number: the before/after measurement and the business effect', 'Add more technical detail about the implementation', 'Name the framework version you used'],
          answer: 1, explain: 'Results need numbers (p99 4.2s → 900ms, ~3% of carts). “Much faster” is not a result.' },
      ],
      sections: [
        { type: 'text', html: `
<p>Use <b>STAR+</b>: <b>S</b>ituation (1 sentence), <b>T</b>ask (what <i>you</i> owned), <b>A</b>ction (the bulk, in “I” not “we”), <b>R</b>esult (with a number), <b>+</b> Reflection (what you learned or changed).</p>
<h3>Weak vs strong</h3>
<pre><code>Weak:   "We had performance problems, so we added caching and it got faster."
Strong: "Checkout p99 was 4.2s and we were losing ~3% of carts. I profiled it, found 60% of the
         time was repeated currency lookups, proposed a 5-minute cache with explicit invalidation,
         wrote the design doc, and got buy-in despite the team preferring a rewrite. p99 dropped to
         900ms. I'd now add a metric for cache hit rate from day one; we discovered a stale-rate bug late."</code></pre>
<p>Keep each answer around <b>2 minutes</b>. Practice with the <a href="#/mock">mock interview</a> page, and record yourself once. It is uncomfortable and very effective.</p>` },
        { type: 'quiz', q: 'In a conflict story, which ending is strongest?',
          options: ['“In the end I was proven right.”', '“We compromised.”', '“I understood their constraint, proposed an experiment, and we both changed our view based on the data. We kept the working agreement afterwards.”', '“I escalated to my manager who decided.”'],
          answer: 2, explain: 'Strong conflict stories show empathy, evidence, and a durable outcome, not winning.' },
        { type: 'quiz', q: '“Tell me about a failure.” Which is the best choice?',
          options: ['A fake failure that is secretly a strength', 'A real failure with real cost, your part in it, and a concrete system or habit you changed afterwards', 'Blame an unclear spec', 'Say you do not have major failures'],
          answer: 1, explain: 'Interviewers are looking for honesty and learning loops. A good failure story ends with a changed system, not a changed mood.' },
      ],
    },
    {
      id: 'ai-era-interviews', title: 'Interviewing in the AI era', minutes: 10,
      summary: 'What changed, how to use AI honestly, and how to show judgment.',
      checks: [
        { q: 'Why are interviews shifting toward design discussions and review-the-diff rounds?',
          options: ['Because whiteboard coding is too expensive to run', 'Because code generation is cheap, so judgment and verification are what is scarce', 'Because AI cannot write any code at all', 'Because candidates asked for easier formats'],
          answer: 1, explain: 'When generation is free, interviews probe what is still scarce: judgment, verification, system thinking.' },
        { q: 'Before you prompt an assistant in an AI-allowed round, what must you do first?',
          options: ['State your approach and the edge cases you will check', 'Clear the chat history so the model starts fresh', 'Ask the interviewer which model to use', 'Write the full solution by hand as a backup'],
          answer: 0, explain: 'Think first, then prompt. Narrating the approach and edge cases up front is part of what is evaluated.' },
      ],
      sections: [
        { type: 'text', html: `
<p>Code generation is cheap now, so interviews are shifting toward what is still scarce: <b>judgment, verification, system thinking, and communication</b>. Expect any of:</p>
<ul>
<li><b>AI-allowed coding rounds</b>: you use an assistant; they watch how you prompt, review, and test.</li>
<li><b>Review-the-diff rounds</b>: find the bug in plausible-looking (often AI-written) code.</li>
<li><b>Deeper “why” follow-ups</b> on solutions you wrote, to check you understand them.</li>
<li><b>Design and incident discussions</b> that are hard to fake.</li>
</ul>
<h3>The rules for using AI in an interview</h3>
<ol>
<li><b>Follow the stated policy.</b> If it is unclear, ask. Never use hidden tools.</li>
<li><b>Think first, then prompt.</b> State the approach and edge cases before generating code.</li>
<li><b>Treat output as a junior PR.</b> Read every line, run it, test the boundaries.</li>
<li><b>Narrate verification:</b> “It handles the happy path. Let me check empty input, duplicates, and concurrent calls.”</li>
<li><b>Own the result.</b> You must be able to explain every line.</li>
</ol>` },
        { type: 'code', ref: 'chunk' },
        { type: 'quiz', q: 'In an AI-allowed round the assistant generates a working solution in 20 seconds. What should you do next?',
          options: ['Submit immediately to save time', 'Walk through it, state edge cases, run targeted tests, and explain the complexity', 'Rewrite it by hand to prove you can', 'Ask the assistant to explain it to the interviewer'],
          answer: 1, explain: 'The evaluation is on verification and understanding. Speed of generation is no longer a differentiator.' },
      ],
    },
  ],
});
