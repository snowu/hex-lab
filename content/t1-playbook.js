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
<p>Keep each answer around <b>2 minutes</b>. Practice with the <a href="#/mock">mock interview</a> page, and record yourself once. It is uncomfortable and very effective.</p>
<h3>What senior behavioural rounds actually score</h3>
<p>The questions sound generic; the rubric is not. Each one probes a specific senior competency, and a story that is fine for a mid-level role (“I implemented X”) scores low because the scope is too small.</p>
<table><tr><th>Competency</th><th>Typical question</th><th>What a strong answer contains</th></tr>
<tr><td>Influence without authority</td><td>“How did you get buy-in for a change others resisted?”</td><td>Whose constraint you understood first, the evidence you brought (a prototype, numbers, a pilot), how you made it cheap to say yes</td></tr>
<tr><td>Prioritisation</td><td>“Everything is urgent. What do you do?”</td><td>An explicit rule (customer impact, risk, reversibility), what you said <i>no</i> to and how you told people</td></tr>
<tr><td>Disagree and commit</td><td>“Tell me about a decision you disagreed with.”</td><td>You argued with data, the decision went the other way, you committed fully and set a check to revisit it</td></tr>
<tr><td>Mentoring / multiplying</td><td>“How have you grown other engineers?”</td><td>A named person or practice, what changed in <i>their</i> output, and that it outlasted you</td></tr>
<tr><td>Ambiguity</td><td>“Tell me about a project with unclear requirements.”</td><td>How you created clarity: the question you asked, the assumption you wrote down, the smallest slice you shipped to learn</td></tr>
<tr><td>Ownership</td><td>“Tell me about something outside your remit.”</td><td>You noticed it, nobody asked, you fixed the system and not only the symptom</td></tr></table>
<h3>The senior traps</h3>
<ul>
<li><b>“We” all the way through.</b> Interviewers cannot hire your team. Say “we” for context, “I” for your decisions.</li>
<li><b>Too small.</b> A bug you fixed alone is a mid-level story. Senior stories cross team boundaries or change how people work.</li>
<li><b>No tension.</b> A story where everyone agreed and nothing went wrong shows nothing. Pick ones with a real trade-off or a real opponent.</li>
<li><b>Villains.</b> Never make a colleague the bad guy. Describe their constraint fairly; that <i>is</i> the signal.</li>
<li><b>Rehearsed and rigid.</b> Expect “what would you do differently?” and “what did the other person think?” after every story. Prepare the follow-ups, not a script.</li>
</ul>
<h3>“Why are you leaving?” and “Why us?”</h3>
<p>Answer toward something, not away from something: what you want to work on next and why this team has it. One honest sentence about what is missing now is fine; criticism of your current employer is not. For “why us”, name something specific you read (their API docs, an engineering post, a product decision) and connect it to your experience.</p>
<div class="callout"><b>Build the bank:</b> the <a href="#/stories">Story bank</a> tags each story with these competencies and shows the gaps. Aim for at least one story per row of the table above, and two for the ones the role emphasises.</div>` },
        { pid: 'q-buyin', type: 'quiz', q: 'Interviewer: “Tell me about a time you got buy-in for a change others resisted.” Which opening sets up the strongest answer?',
          options: ['“I was the most senior person, so I made the call.”', '“The on-call team was against moving to the new queue because they would carry the pager. I started by asking what would make it safe for them.”', '“Everyone agreed after I explained it clearly.”', '“My manager backed me, so the team followed.”'],
          answer: 1, explain: 'Influence without authority starts from the other side’s constraint. Authority, a manager’s backing, or “everyone agreed” all skip the skill being tested.' },
        { type: 'quiz', q: 'In a conflict story, which ending is strongest?',
          options: ['“In the end I was proven right.”', '“We compromised.”', '“I understood their constraint, proposed an experiment, and we both changed our view based on the data. We kept the working agreement afterwards.”', '“I escalated to my manager who decided.”'],
          answer: 2, explain: 'Strong conflict stories show empathy, evidence, and a durable outcome, not winning.' },
        { type: 'quiz', q: '“Tell me about a failure.” Which is the best choice?',
          options: ['A fake failure that is secretly a strength', 'A real failure with real cost, your part in it, and a concrete system or habit you changed afterwards', 'Blame an unclear spec', 'Say you do not have major failures'],
          answer: 1, explain: 'Interviewers are looking for honesty and learning loops. A good failure story ends with a changed system, not a changed mood.' },
      ],
    },
    {
      id: 'project-deep-dive', title: 'The project deep dive', minutes: 15,
      summary: 'Walk through your strongest project and survive the drill-down.',
      checks: [
        { q: 'Ten minutes into your project deep dive the interviewer asks: “Why Postgres and not DynamoDB?” You did not make that choice; it predates you. Best answer?',
          options: ['Defend Postgres as if you had chosen it', 'Say it was before your time and move on', 'Say it predates you, then give your own view of the trade-off for this workload and whether you would choose it again', 'Say the team lead decided, so ask them'],
          answer: 2, explain: 'Honesty about who decided, plus your own reasoning about the trade-off, shows judgment. Pretending or deflecting both fail the probe.' },
        { q: 'Which choice of project gives the deep dive the most room to show senior signals?',
          options: ['The largest system your company runs, even though you worked on one small part', 'A project where you made the key design decisions, it had real trade-offs and constraints, and you can give numbers from production', 'The newest project, because it uses the most modern technology', 'A side project, because you know every line'],
          answer: 1, explain: 'The round scores your decisions and your depth. Pick the project where you owned the hard choices and can go three levels down, not the most impressive logo.' },
      ],
      sections: [
        { type: 'text', html: `
<p>“Walk me through the most technically complex project you have worked on.” At senior level this is often the round that decides the loop, because it is the hardest to fake: the interviewer keeps drilling until they find the edge of what you actually know.</p>
<h3>Pick the right project</h3>
<ul>
<li><b>You made the key decisions</b>, not just implemented them.</li>
<li><b>Real constraints and trade-offs</b>: scale, money, latency, a legacy system, a deadline, a regulator.</li>
<li><b>Something went wrong</b> and you changed course. Projects with no surprises have nothing to dig into.</li>
<li><b>You can give numbers</b>: traffic, latency, error rates, cost, team size, timeline.</li>
<li>Ideally <b>recent</b> (last 2-3 years) and relevant to the role.</li>
</ul>
<h3>The structure (about 10 minutes before questions)</h3>
<ol>
<li><b>One-minute pitch:</b> the problem, who it was for, why it mattered (in money, users or risk), and your role.</li>
<li><b>The system in one picture:</b> draw it. Five to seven boxes, data flow, where the hard part lives.</li>
<li><b>Two or three decisions you made:</b> the options, what each cost, why you chose, and what you would revisit.</li>
<li><b>What went wrong:</b> the incident, the wrong assumption, the migration that fought back, and what you changed.</li>
<li><b>Results with numbers</b>, then what you would do differently today.</li>
</ol>
<h3>How the interviewer drills</h3>
<table><tr><th>Probe</th><th>What they are checking</th></tr>
<tr><td>“Why X and not Y?”</td><td>You considered alternatives and know their costs</td></tr>
<tr><td>“How exactly does that part work?”</td><td>Depth: keys, schemas, failure handling, not just box names</td></tr>
<tr><td>“What happens at 10× traffic?”</td><td>You know where your own system breaks first</td></tr>
<tr><td>“What was your part, specifically?”</td><td>Ownership versus proximity</td></tr>
<tr><td>“What would you change?”</td><td>Reflection; “nothing” is a red flag</td></tr>
<tr><td>“How did you know it worked?”</td><td>Metrics, tests, rollout, observability</td></tr></table>
<p>Expect them to go three levels down on one decision. Prepare that depth for each decision you mention, and do not mention decisions you cannot defend.</p>
<h3>When you reach the edge of what you know</h3>
<p>Say so, then reason: “I did not own the replication setup. My understanding is it was async with a ~1s lag, which is why we read balances from the primary. If I were designing it I would check…” Honest edges plus reasoning score well. Bluffing is the fastest way to fail this round, because the interviewer keeps digging until the bluff shows.</p>
<h3>Confidentiality</h3>
<p>You can describe architecture and trade-offs without customer names, internal code names or exact revenue. Say “a large Nordic bank” and “low millions of requests per day”. Interviewers expect this and respect it.</p>` },
        { type: 'quiz', q: 'You describe a cache you added. The interviewer asks how you handled invalidation, and the honest answer is a 5-minute TTL with no explicit invalidation. Best response?',
          options: ['Describe event-driven invalidation as if you had built it', 'Explain the TTL, why staleness up to 5 minutes was acceptable for that data, what broke or could break, and what you would add if it were not acceptable', 'Say invalidation is not important for most caches', 'Change the subject to the database design'],
          answer: 1, explain: 'A simple choice with a stated reason and known limits is a good answer. Inventing a more impressive design fails at the next follow-up question.' },
        { type: 'quiz', q: 'Interviewer: “What would you do differently?” Which answer is strongest?',
          options: ['“Honestly, I think we got it right.”', '“Use a newer framework.”', '“Ship the reconciliation job in the first release instead of the third. We found a status drift bug in production that it would have caught in week one, and I now put reconciliation into the first milestone of any money-moving system.”', '“Have more people on the team.”'],
          answer: 2, explain: 'A specific change, the evidence that motivated it, and a habit you carry forward. “Nothing” or generic wishes show no reflection.' },
        { type: 'reveal', title: 'Worksheet: prepare your deep dive', html: `<ol>
<li>Write the one-minute pitch. Read it aloud and time it.</li>
<li>Draw the architecture from memory in under two minutes.</li>
<li>List three decisions. For each: two alternatives, the cost of your choice, the revisit condition.</li>
<li>For each decision, write the answer to “how exactly does that work?” two levels further down (schema, keys, failure behaviour).</li>
<li>Write the numbers: traffic, latency, error rate, cost, timeline, team size. Mark which ones you are sure of.</li>
<li>Write the “what went wrong” story in STAR+ form.</li>
<li>Answer “what breaks at 10×?” and “what would you change?” in one sentence each.</li>
<li>Rehearse it on the <a href="#/mock">mock interview</a> page (Project deep dive), or with the <a href="#/mock/ai">AI interviewer</a>, which asks follow-ups.</li>
</ol>` },
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
</ol>
<h3>AI-assisted take-homes</h3>
<p>Many companies now allow, or assume, AI on take-home tasks. That raises the bar on everything around the code:</p>
<ul>
<li><b>Disclose how you used it</b> in the README: what you generated, what you rewrote, what you verified. Hidden use that surfaces in the follow-up call ends the process.</li>
<li><b>Show the process</b> with small, meaningful commits instead of one “initial commit” of 3,000 lines.</li>
<li><b>Write the decisions down:</b> the trade-offs, what you left out on purpose, what you would do with more time. This is the part AI cannot do for you and the part reviewers read most closely.</li>
<li><b>Tests that matter:</b> edge cases and failure paths, not a wall of generated happy-path tests.</li>
<li><b>Expect a live extension:</b> “add pagination to your solution, now, while we watch”. If you cannot change your own code without the assistant, it shows.</li>
</ul>
<h3>Agentic tools in a live round</h3>
<p>If the round allows a coding agent that edits files and runs commands, the evaluation moves further toward <b>direction and review</b>: how precisely you describe the task, whether you give it the tests first, whether you read the diff before accepting it, and how fast you notice when it has gone the wrong way. Keep the agent on small steps you can verify, and say what you are checking as you go.</p>` },
        { type: 'code', ref: 'chunk' },
        { type: 'quiz', q: 'In an AI-allowed round the assistant generates a working solution in 20 seconds. What should you do next?',
          options: ['Submit immediately to save time', 'Walk through it, state edge cases, run targeted tests, and explain the complexity', 'Rewrite it by hand to prove you can', 'Ask the assistant to explain it to the interviewer'],
          answer: 1, explain: 'The evaluation is on verification and understanding. Speed of generation is no longer a differentiator.' },
      ],
    },
  ],
});
