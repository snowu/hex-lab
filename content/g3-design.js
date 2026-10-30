/* Game dev section, track 3: game design theory. */
TRACKS.push({
  id: 'gddesign', domain: 'gamedev', icon: '🎮', title: 'Game Design Theory',
  blurb: 'Core loops and pillars, flow and difficulty, game feel and juice, economies and randomness, and shipping something small.',
  lessons: [
    {
      id: 'gd-core-loop', title: 'Core loop, verbs and pillars', minutes: 20,
      summary: 'How to describe what a game actually is, so you can tell whether a feature belongs.',
      checks: [
        { q: 'A cool feature idea arrives that fights one of your three design pillars. What do the pillars tell you to do?',
          options: ['Prototype it anyway, since cool features always earn their place', 'Cut it: pillars exist to say no, however cool the feature is', 'Add it as an option so nobody is disappointed', 'Rewrite the pillars around the feature'],
          answer: 1, explain: 'Pillars are the cheapest scope tool: a feature that fights them gets cut rather than diluting the game.' },
        { q: 'Playtesters call your game boring but cannot say why. In MDA terms, where do you look for the cause?',
          options: ['At the aesthetics report first, then trace down into the dynamics and mechanics below it', 'At the marketing, since boredom is a trailer problem', 'At the graphics settings, since feel is resolution', 'Nowhere: aesthetics reports carry no design information'],
          answer: 0, explain: 'Players experience aesthetics downward while designers build mechanics upward, so boredom is traced from the feeling to the rules.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>The core loop</h3>
<p>The <b>core loop</b> is the smallest cycle the player repeats: <i>do something → get a result → that changes what you do next</i>. If this loop is not fun in isolation, no amount of content saves it. Examples:</p>
<ul><li><b>Tetris</b>: see piece → place it → clear lines (or stack higher) → see next piece.</li><li><b>Hades</b>: enter room → fight → pick a reward → stronger next room. Around it sits a longer loop: die → return to the hub → spend meta currency → try again.</li><li><b>A farming sim</b>: plant → wait → harvest → sell → buy better seeds.</li></ul>
<p>Games stack loops at different timescales. A common frame is <b>seconds</b> (a single action, the feel), <b>minutes</b> (a fight, a level) and <b>hours</b> (progression, story). Each layer should give a reason to continue the next.</p>
<h3>Verbs</h3>
<p>List the player's <b>verbs</b> (jump, shoot, build, trade, hide). Good small games have a few verbs with depth rather than many shallow ones, and the interesting part is how verbs <i>combine</i> with the world (jump onto enemies, shoot to open doors). Before adding a feature, ask whether it adds a verb, deepens a verb, or only adds content.</p>
<h3>Pillars</h3>
<p>Design <b>pillars</b> are 3 or 4 short statements of what the game is, used to say no. “Fast, readable combat.” “Every run feels different.” “Cozy, never punishing.” A feature that fights a pillar gets cut, however cool it is. Write them on day one; they are the cheapest tool for keeping scope under control.</p>
<h3>MDA: mechanics, dynamics, aesthetics</h3>
<p>The MDA framework (Hunicke, LeBlanc, Zubek) separates what you build from what players experience:</p>
<ul><li><b>Mechanics</b>: rules and data you author (jump height, spawn rates).</li><li><b>Dynamics</b>: behaviour that emerges when players interact with the rules (camping, rushing, hoarding).</li><li><b>Aesthetics</b>: the emotional result (challenge, discovery, fellowship, expression, narrative, sensation...).</li></ul>
<p>Designers work from mechanics upward, but players experience it from aesthetics downward. When a playtester says “this is boring” that is an aesthetics report, and the cause is several steps below it, in the rules.</p>` },
        { pid: 'q-core-1', type: 'quiz', q: 'Your prototype has 12 mechanics but playtesters stop after 5 minutes. What is the most useful first step?',
          options: ['Add more content', 'Strip back to the smallest loop and make that satisfying to repeat before adding anything', 'Improve the graphics', 'Add a tutorial'], answer: 1, explain: 'If the core loop is not fun when you strip everything else away, extra systems only hide the problem.' },
        { pid: 'q-core-2', type: 'quiz', q: 'In MDA terms, “players hoard consumables and never use them” is a…',
          options: ['Mechanic', 'Dynamic', 'Aesthetic', 'Pillar'], answer: 1, explain: 'It is behaviour that emerges from the rules (probably from scarcity plus fear of waste). The fix is in the mechanics: make consumables renewable, or reward using them.' },
        { type: 'reveal', title: 'Exercise: describe a game you love in verbs, loops and pillars', html: `<p>Pick one game and write, in five lines each:</p><ol><li>The 10-second loop (what the hands do).</li><li>The 10-minute loop (what the brain plans).</li><li>The 10-hour loop (what keeps you coming back).</li><li>The verbs, and two ways they combine.</li><li>Three pillars you would guess the designers used, and one feature that clearly would have violated them.</li></ol><p>If you cannot name the pillars, the game may not have had any, which also tells you something.</p>` },
      ],
    },
    {
      id: 'gd-flow', title: 'Flow, difficulty and teaching without text', minutes: 25,
      summary: 'Keeping players between bored and overwhelmed, and the level-design pattern behind the best tutorials.',
      checks: [
        { q: 'Your difficulty curve is a steady straight ramp and players burn out halfway. Which shape fits the lesson, and why?',
          options: ['A sawtooth with rest beats: tension, release, then slightly higher tension', 'A steeper straight ramp, so skilled players stay engaged', 'A flat line, so nobody ever fails', 'Random spikes, so every session surprises'],
          answer: 0, explain: 'Challenge must grow with skill along the flow channel, with recovery beats between peaks instead of a monotone climb.' },
        { q: 'Players call a new boss unfair. The attacks are dodgeable but come with no wind-up, and dying sends them back ten minutes. What is the readability fix?',
          options: ['Halve the boss damage so the unfairness matters less', 'Telegraph attacks before they land, keep danger cues consistent, and make retries fast with a nearby checkpoint', 'Hide the boss tells to raise the challenge', 'Add a lore popup explaining the boss motives'],
          answer: 1, explain: 'Unfair almost always means unread: telegraph before punishing and make failure fast to understand and recover from.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>The flow channel</h3>
<p>Csikszentmihalyi\'s <b>flow</b> is the state of being absorbed when challenge roughly matches skill. Too easy and the player is bored, too hard and they are anxious. As skill grows, the challenge has to grow with it, or the player falls out of the channel. Level and difficulty design is mostly about moving the player along that channel, with <b>rest</b> beats between peaks so they can recover.</p>
<h3>Difficulty curves</h3>
<ul><li>Not a straight ramp: a <b>sawtooth</b> (tension, release, a bit higher tension) feels better than a monotone climb.</li><li>Difficulty has several independent axes: execution (reflexes), knowledge (what to do), decision complexity and resource pressure. Raise one at a time.</li><li><b>Dynamic difficulty</b> (quietly adjusting) can help, but players hate being rubber-banded when they notice. Offering a visible difficulty choice, or assist options, respects them.</li><li>Fail states: make failing <b>fast to recover from</b>. Short respawn and a checkpoint just before the hard part beat a punishing penalty. Celeste lets you retry in a fraction of a second.</li></ul>
<h3>Teach by doing</h3>
<p>Players skip text. Good games teach through the level itself, commonly with a four-beat structure (often called Nintendo\'s level design approach, from the Japanese <i>ki-shō-ten-ketsu</i>):</p>
<ol><li><b>Introduce</b> a mechanic in a safe place where failing costs nothing.</li><li><b>Develop</b> it: use it with small variations and mild risk.</li><li><b>Twist</b>: combine it with something unexpected or flip the context.</li><li><b>Conclude</b>: a final test that pays off the idea, then move on without ever repeating it.</li></ol>
<p>The opening of <i>Super Mario Bros.</i> level 1-1 is the famous example: a lone goomba you cannot avoid teaches stomping in a safe space; a block row teaches jumping into blocks and mushrooms; a pit-free start lets you experiment before it adds gaps.</p>
<h3>Readability and feedback</h3>
<ul><li>Telegraph before you punish: the enemy winds up, the floor glows, a sound plays.</li><li>Be consistent: if red means danger, never use red for a safe thing.</li><li>The player should always know <i>why</i> they died. “Unfair” almost always means “I did not understand what happened.”</li></ul>` },
        { pid: 'q-flow-1', type: 'quiz', q: 'Players keep dying at the first boss and quitting. Which change targets the right problem?',
          options: ['Lower the boss HP by 50%, always', 'Telegraph attacks, add a checkpoint right before the boss, and shorten the retry time', 'Remove the boss', 'Add a text tutorial before the boss'], answer: 1, explain: 'Legibility (telegraphing) plus fast recovery fixes the cause of frustration. Pure HP tuning may make the boss trivial for others without making failure understandable.' },
        { pid: 'q-flow-2', type: 'quiz', q: 'You introduce a new enemy. What does the “introduce, develop, twist, conclude” pattern say to do first?',
          options: ['Put it in the hardest arena', 'Show it in a safe spot where the player can observe it and fail cheaply', 'Explain it in a popup', 'Combine it with three other enemies'], answer: 1, explain: 'The first beat is safe exposure. Complexity and risk come in the following beats.' },
        { pid: 'go-deeper', type: 'text', html: `<div class="callout tip"><b>Go deeper:</b><ul><li><a href="#/lesson/ai-fun">AI that is fun: fairness, directors and testing</a>: AI that is fun: fairness, directors and pacing difficulty.</li></ul></div>` },
      ],
    },
    {
      id: 'gd-juice', title: 'Game feel and juice', minutes: 25,
      summary: 'Why two games with identical rules can feel completely different, and the small tools that make an action satisfying.',
      checks: [
        { q: 'Two prototypes share identical rules but one feels dead and the other feels great. Which layer differs, in Swink terms?',
          options: ['The rules layer: identical rules cannot feel different', 'Real-time control, simulated space and polish: responsiveness, weight and feedback sell the same rules', 'The business model behind each prototype', 'The programming language used'],
          answer: 1, explain: 'Game feel comes from immediate control, a world with weight, and redundant polish feedback, not from the rules alone.' },
        { q: 'A designer wires damage numbers and particles into the same code that decides whether a hit lands. What rule does this break?',
          options: ['Juice must live in a separate layer so effects never change gameplay results', 'Every hit needs screen shake to feel fair', 'Hit stop should pause rendering instead of logic', 'Particles must be simulated on the GPU'],
          answer: 0, explain: 'Effects sell the action but must not move hitboxes or decide outcomes; hit stop pausing logic is fine, effects altering results are not.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Game feel</h3>
<p>Steve Swink (<i>Game Feel</i>) splits it into: <b>real-time control</b> (input is immediate and responsive), <b>simulated space</b> (the world has weight and collision that makes sense) and <b>polish</b> (effects that sell the action). The first two are design and engineering; the third is “juice”.</p>
<h3>Juice</h3>
<p><b>Juice</b> is abundant, redundant feedback to an action: the player did something, so the whole game reacts. The two talks to watch are <i>Juice it or lose it</i> (Jonasson and Purho) and <i>The art of screenshake</i> (Nijman, Vlambeer). Common tools:</p>
<ul><li><b>Screen shake</b>, short and decaying, scaled with the impact. Always give players a setting to reduce or disable it.</li><li><b>Hit stop</b> (a few frames of freeze on contact): the single cheapest way to make a hit feel heavy.</li><li><b>Squash and stretch</b> on landing and jumping, and a quick scale pulse on pickups.</li><li><b>Particles</b>: dust on landing, sparks on hits.</li><li><b>Flash</b> the sprite white for a frame on damage.</li><li><b>Sound</b>: a punchy layered sound with a little random pitch variation so repeated sounds do not fatigue. Audio is half of the feel.</li><li><b>Anticipation and follow-through</b> in animation: wind up, strike, recover.</li><li><b>Camera</b>: slight lead in the move direction, zoom punch on big events.</li></ul>
<h3>Rules of thumb</h3>
<ul><li>Juice multiplies a good loop. It does not rescue a bad one.</li><li>Scale feedback to importance: a coin pickup should not shake the screen like a boss death.</li><li>Keep the effects <b>readable</b>: do not hide gameplay information under particles.</li><li>Respect accessibility: flashing, shake and motion options.</li><li>Do the sim and effects in separate layers so juice never changes gameplay results (hit stop that pauses the game logic is fine; effects that move hitboxes are not).</li></ul>` },
        { pid: 'sim-juice', type: 'sim', id: 'gdjuice', title: 'The same click, with and without juice',
          intro: '<p>Click or tap the green block. Underneath, the game only adds 1 to a counter. Turn the feedback layers on one by one.</p>',
          try: ['With everything <b>off</b>, click a few times. Technically correct, emotionally dead.', 'Turn on <b>hitstop</b> only: the click feels heavier even though nothing visible was added.', 'Add <b>squash</b> and <b>flash</b>, then <b>particles</b>.', 'Turn on <b>sound</b> (a synthesized blip). Notice how much of the impression comes from audio.', 'Press <b>all on</b> and reflect: would this be too much for a coin pickup?'] },
        { pid: 'q-juice-1', type: 'quiz', q: 'Which single effect most cheaply makes melee hits feel powerful?',
          options: ['A longer cooldown', 'Hit stop (freezing a few frames on contact) combined with a short sound and flash', 'A bigger sprite', 'Slower walking'], answer: 1, explain: 'A few frames of freeze communicates mass and impact. It is a standard in fighting and action games.' },
        { pid: 'q-juice-2', type: 'quiz', q: 'A game adds screen shake on every footstep and players complain of nausea. What is the lesson?',
          options: ['Remove all juice', 'Scale feedback to the importance of the event and offer options to reduce shake', 'Make the shake faster', 'Players should adapt'], answer: 1, explain: 'Juice should be proportional and optional. Reserve strong effects for big moments.' },
        { pid: 'go-deeper', type: 'text', html: `<div class="callout tip"><b>Go deeper:</b><ul><li><a href="#/lesson/gfx-audio">Audio as a system</a>: audio as a system: variation, mixing and ducking, half of the feel.</li><li><a href="#/lesson/gfx-animation">Animation systems in code</a>: anticipation, hit frames and cancel windows in animation code.</li></ul></div>` },
      ],
    },
    {
      id: 'gd-economy', title: 'Progression, economies and randomness', minutes: 30,
      summary: 'Sinks and faucets, exponential cost curves, why random rewards work, and pity timers.',
      checks: [
        { q: 'The next upgrade price follows cost = base times growth to the level, with growth around 1.1, while income grows roughly linearly. Why that shape?',
          options: ['So the time between upgrades keeps growing and forces meaningful choices or a reset', 'So every upgrade arrives faster than the last', 'So income and cost stay exactly equal forever', 'So the first upgrade is the hardest to earn'],
          answer: 0, explain: 'Exponential costs against slower income growth stretch the wait between purchases, which is what keeps choices meaningful.' },
        { q: 'Playtesters love finding random loot layouts but hate missing attacks to a hit-chance roll. Which distinction explains the reaction?',
          options: ['Loot is graphics randomness while hit chance is audio randomness', 'Input randomness (what you are dealt) creates variety; output randomness (whether your action works) feels unfair', 'Players prefer any randomness hidden in menus', 'Loot uses seeds while combat cannot be seeded'],
          answer: 1, explain: 'Variety before the decision delights; randomness that vetoes the decision after it frustrates.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Progression types</h3>
<ul><li><b>Power progression</b>: you get stronger (levels, gear). Risks trivialising content, so the world must scale with you.</li><li><b>Knowledge/skill progression</b>: you get better (Dark Souls, roguelikes). Power barely changes, the player does.</li><li><b>Content progression</b>: new places, abilities that unlock routes (metroidvanias).</li><li><b>Meta progression</b>: persistent upgrades between runs (Hades mirror, roguelite unlocks).</li></ul>
<h3>Economies: sources and sinks</h3>
<p>Any currency has <b>faucets</b> (ways to earn) and <b>sinks</b> (ways to spend). If faucets outpace sinks the currency inflates and loses meaning; if sinks dominate the game feels like a grind. Track flows in a spreadsheet before building: income per minute, price of the next upgrade, and the time between purchases. You want the player to make a <i>meaningful choice</i> every few minutes, not wait.</p>
<h3>Cost curves</h3>
<p>Costs usually grow exponentially (<code>cost = base × growth^level</code>), while income grows linearly or slower. That keeps the time between upgrades growing and eventually forces a reset or a new system (prestige). A growth factor of roughly 1.07 to 1.15 per level is typical for idle games. You implement the curve in the drill.</p>
<h3>Randomness</h3>
<ul><li><b>Input randomness</b> (what you get dealt, loot, level layout) creates variety and stories. <b>Output randomness</b> (does my attack hit?) can feel unfair.</li><li>Humans are poor at probability: they expect streaks to end. Pure independent rolls produce long droughts that feel broken. Designers use <b>pseudo-random distribution</b> (the chance rises after each failure), <b>bad-luck protection</b> and <b>shuffle bags</b> (draw without replacement, so every item shows up regularly).</li><li><b>Pity timers</b> guarantee a reward after N misses, bounding the worst case. You implement one below.</li><li>Expected value: an event with chance p takes 1/p tries on average, but the median is shorter and the tail is long (with p = 1%, 37% of players have no drop after 100 tries).</li></ul>
<div class="callout warn"><b>Ethics and law:</b> variable rewards plus spending is the loot-box problem. Several countries regulate or ban paid random boxes and platforms require disclosed odds. Design retention around skill and content, not around exploiting the way brains react to random reward.</div>` },
        { pid: 'drill-pity', type: 'drill', ref: 'pity' },
        { pid: 'drill-cost', type: 'drill', ref: 'upgrade_cost' },
        { pid: 'q-eco-1', type: 'quiz', q: 'Players have 10 million gold and nothing to buy. This is a…',
          options: ['Pacing problem: faucets outrun sinks (inflation)', 'Graphics problem', 'Bug in the shop UI', 'Good sign'], answer: 0, explain: 'Add meaningful sinks (cosmetics, upgrades with steep curves, repair costs) or slow the faucets. Check every currency flow.' },
        { pid: 'q-eco-2', type: 'quiz', q: 'A 5% drop chance per kill. About how many kills are needed on average, and why is that still a bad promise to players?',
          options: ['5; luck decides', '20 on average, but a meaningful fraction of players need 40 or more (bad luck is common), so add pity', '100', 'Exactly 20 for everyone'], answer: 1, explain: 'Mean = 1/p = 20. With independent rolls 0.95^40 is about 13% still without it. Pity timers or a shuffle bag bound the bad cases.' },
      ],
    },
    {
      id: 'gd-scope', title: 'Scope, prototyping and playtesting', minutes: 20,
      summary: 'How small games actually get finished: prototypes that answer questions, vertical slices, and watching people play.',
      checks: [
        { q: 'You are unsure whether grapple movement is readable. What is the cheapest prototype that answers it?',
          options: ['One grey-box room with the grapple and a target, built to test only that question', 'A full vertical slice with final art and sound', 'A survey asking players if they like grapples', 'Three extra movement systems for comparison'],
          answer: 0, explain: 'A prototype is an experiment, not a small game: build the cheapest thing that answers the question and keep the learning.' },
        { q: 'Observers keep explaining the controls during playtests and players then do fine. What should change about the test?',
          options: ['Explain louder so every tester hears', 'Stay silent and watch where they hesitate or repeat mistakes, then ask what they were trying to do', 'Only test with players who already know the game', 'Skip testing until the tutorial text is final'],
          answer: 1, explain: 'Watching silently reveals where the design is unclear; explaining hides exactly the problems testing must find.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Prototype to answer a question</h3>
<p>A prototype is not a smaller version of the game, it is an experiment: <i>“Is dodging this attack fun?”</i>, <i>“Is grapple movement readable?”</i> Build the cheapest thing that can answer it: grey boxes, placeholder sounds, one room. Throw it away if it fails; keep the learning.</p>
<h3>Scope is the main killer</h3>
<p>Most solo projects die by scope, not by skill. Habits that work:</p>
<ul><li>Write a <b>one-page design</b>: pitch, loop, pillars, and a <b>cut list</b> ordered from “must ship” to “nice to have”. Cut from the bottom without guilt.</li><li>Build a <b>vertical slice</b>: one level at final quality with all main systems, to prove the loop and surface cost early.</li><li>Estimate honestly and multiply by 2 or 3. Content (levels, art, sound) is far more work than code.</li><li>Prefer systems that generate depth from few assets (combinable rules, procedural variation) over hand-made content.</li><li>Ship something tiny first. A finished 2-hour game teaches more than an unfinished epic.</li><li>Use jam constraints (48 hours, a theme, a limit like “one button”) to practise finishing.</li></ul>
<h3>Playtesting</h3>
<ul><li>Watch, do not explain. Sit behind the player and stay silent. Where they hesitate or repeat a mistake is where the design is unclear.</li><li>Ask about what they did and felt (“What were you trying to do there?”), not “did you like it?”.</li><li>Test early with ugly builds. Test with people who have never seen the game, five at a time, then fix the problems all five hit.</li><li>Record sessions (with permission) and log telemetry such as deaths per room and quit points.</li><li>Distinguish <b>problem</b> from <b>solution</b>: players are great at reporting problems and terrible at proposing fixes.</li></ul>` },
        { pid: 'q-scope-1', type: 'quiz', q: 'You have a two-week game jam. Which plan finishes?',
          options: ['Build all systems, then add content in the last two days', 'Get a playable loop in the first day, then iterate, with a cut list and a stable build at every end of day', 'Spend week one on custom engine tech', 'Wait for the perfect idea'], answer: 1, explain: 'Always have a playable build, grow outward from it, and cut from a prepared list.' },
        { pid: 'q-scope-2', type: 'quiz', q: 'During a playtest the player walks into a dead end and says “I think there should be a map.” What do you do?',
          options: ['Add a map', 'Note the problem (they got lost) and look for causes: landmarks, signage, level shape, before choosing a fix', 'Ignore it', 'Add a tutorial popup'], answer: 1, explain: 'Players report real problems but not necessarily the right solution. A readable level might fix it more cheaply than a map system.' },
        { type: 'reveal', title: 'Template: a one-page cut list', html: `<ol><li><b>Must ship:</b> core loop, 3 enemy types, 5 levels, save, pause, sound.</li><li><b>Should ship:</b> 2 extra weapons, boss, polished menu, settings (volume, shake, rebind).</li><li><b>Nice to have:</b> secrets, leaderboard, achievements, extra biome.</li><li><b>Not now (write it down so you can stop thinking about it):</b> online, level editor, mod support.</li></ol><p>Review weekly. Anything in “must ship” that is not playable by the halfway point is a risk to tackle first.</p>` },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
