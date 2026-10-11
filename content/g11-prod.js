/* Game dev section: the craft around the code: debugging, testing, repositories and pipelines, shipping. Code blocks marked data-check are compiled by scripts/validate-snippets.mjs. */
TRACKS.push({
  id: 'gdprod', domain: 'gamedev', icon: '🚀', title: 'Production & Tooling',
  blurb: 'Debugging games, testing what is testable, keeping a repository of code and art healthy, and shipping and operating a game.',
  lessons: [
    {
      id: 'prod-debug', title: 'Debugging and profiling games', minutes: 30,
      summary: 'Make the invisible visible: debug drawing, in-game tools, time control, reproducible bugs and finding the real bottleneck.',
      sections: [
        { type: 'text', html: `
<h3>Games are hard to debug</h3>
<p>A game is a real-time, stateful, visual, often random system. A breakpoint freezes time, so you lose the thing you were looking at; the bug appears once an hour; the cause is a frame ago and three systems away. The answer is not a cleverer debugger, it is <b>building the game so it can be observed and replayed</b>.</p>
<h3>1. Make things visible: debug drawing</h3>
<p>Numbers in a console are poor at describing space. Draw them: collision shapes, velocities, paths, targets, perception cones, spatial grid cells, camera bounds, the current state name above each character. Provide a <b>toggle per category</b> (physics, AI, navigation, audio) so you can see one thing at a time. Most engines have built-in versions (Godot: Debug → Visible Collision Shapes, Visible Navigation); add your own as soon as you write a system, not after the first bug.</p>
<h3>2. Build tools into the game</h3>
<ul><li><b>Debug overlay</b>: FPS, frame time graph, entity counts, memory, draw calls. A frame-time <i>graph</i> shows spikes an average hides.</li><li><b>Console / cheat commands</b>: <code>god</code>, <code>spawn goblin 5</code>, <code>teleport boss_room</code>, <code>set time 0.2</code>, <code>give sword</code>. They turn a 10-minute walk to the bug into one line, and the same commands serve testers.</li><li><b>Time control</b>: pause, <b>single-step one frame</b>, slow motion, fast forward. Stepping frame by frame through a jump is the way to see that the coyote timer is off by one.</li><li><b>Inspector</b>: click an entity in the running game to see and edit its state and components (Godot's remote scene tree does this).</li><li><b>State dump and load</b>: save the whole game state to a file at the moment of the bug and load it later.</li></ul>
<h3>3. Make bugs reproducible</h3>
<p>The single biggest debugging investment is <b>determinism</b> (game loop and patterns tracks): a fixed timestep, one seeded random generator, and all input going through commands that can be recorded. Then <i>"it happened once during a playtest"</i> becomes <i>"here is the replay file, it fails on frame 4,812"</i> every time. Add: a <b>seed printed on the screen</b> (or in the log) for any procedural level, an <b>automatic recording</b> of the last N seconds kept in memory and written out when an assertion fails or the player presses a "report bug" key.</p>
<h3>4. Assertions and logging</h3>
<ul><li><b>Assert invariants</b> where they must hold ("health is never negative", "this id exists"), loudly in development builds. A crash at the point of corruption is far better than weird behaviour ten seconds later.</li><li><b>Log levels</b> (error, warning, info, debug) and <b>categories</b> (ai, net, audio) so you can turn on only what you need. Logging every frame buries the signal: log <b>events and changes</b>, not state.</li><li>Include the <b>frame number and timestamp</b> in log lines so logs from different systems line up.</li><li>Print values where you suspect the bug, but also <b>print what you assumed</b>: "assumed target is not null".</li></ul>
<h3>5. A method for hard bugs</h3>
<ol><li><b>Reproduce</b> it (or get closer): minimal steps, seed, replay.</li><li><b>Bisect</b>: turn systems off (AI, physics, audio) until it stops; or bisect the version history with <code>git bisect</code> using the replay as the test.</li><li><b>Form a hypothesis and test it</b>; change one thing at a time.</li><li><b>Fix the cause, not the symptom</b>; if you clamped a value to hide a negative, find out who made it negative.</li><li><b>Add a test or an assertion</b> so it cannot return silently.</li></ol>
<h3>Profiling: measure, do not guess</h3>
<ul><li>Use the profiler to find <b>where frame time goes</b> (CPU functions, GPU passes, draw calls, memory allocation). Look at the <b>worst frames</b>, not the mean: players feel hitches.</li><li>Tools: the engine's profiler (Godot Debugger → Profiler and Monitors), <b>Tracy</b> (real-time frame profiler with a C and C++ API and community bindings for other languages), <code>perf</code> and flame graphs on Linux, RenderDoc for GPU frames.</li><li>Is it <b>CPU-bound</b> (game logic, physics, too many draw calls) or <b>GPU-bound</b> (fill rate, shaders)? Cheap test: halve the resolution. If the frame time drops a lot, it is GPU-bound.</li><li><b>Allocation spikes</b> and garbage collection explain "random" hitches: count allocations per frame.</li><li>Profile <b>release/export builds on target hardware</b>. The editor, a debug build, or your fast desktop tell you little about a mid-range phone.</li><li>Set <b>budgets</b> up front (16.6 ms frame, N draw calls, M MB) and watch them in CI so regressions are caught early.</li></ul>
<h3>Crashes in the wild</h3>
<p>Ship builds with symbols you keep (so a crash address maps to a function), add a crash handler that saves a log and last-state dump and offers to send it (with consent), and keep a breadcrumb trail of the last events. A reproducible report from a player is worth a hundred "it crashed".</p>` },
        { pid: 'bug-prod-debug', type: 'bug', title: 'Spot the debuggability problems',
          prompt: '<p>A GDScript enemy. Click the <b>3</b> lines that will make the next bug harder to find.</p>',
          code: String.raw`func _physics_process(delta):
    print("enemy ", name, " hp=", hp, " pos=", position)
    if randf() < 0.01:
        state = "stunned"
    if hp < 0:
        hp = 0
    var target = get_node("../Player")
    move_toward_target(target)`,
          bugs: [{ line: 2, why: 'Printing per frame per enemy floods the log so the one useful line is buried. Log changes and events (state transitions, damage taken), behind a debug category switch.' },
                 { line: 3, why: 'Unseeded global randomness in the simulation: the stun happens at random frames, so a bug that follows it cannot be reproduced. Use a seeded generator owned by the simulation (and record the seed).' },
                 { line: 6, why: 'Clamping hp to zero hides the real bug: something made it negative. Assert the invariant (<code>assert(hp >= 0)</code>) where damage is applied so you find who overdamaged.' }],
          ok: [4, 8], hint: 'One is noise, one is non-reproducibility, one hides the cause.' },
        { pid: 'q-prod1-1', type: 'quiz', q: 'A bug appears roughly once every 20 minutes of play and nobody can reproduce it. Which investment has the best payoff?',
          options: ['Play for hours hoping to see it', 'Make the game deterministic and record inputs and the seed, so the next occurrence arrives as a replay', 'Add more print statements', 'Ship and see'], answer: 1, explain: 'A deterministic recording turns intermittent bugs into reproducible ones and makes them testable.' },
        { pid: 'q-prod1-2', type: 'quiz', q: 'How do you quickly find out whether a game is CPU-bound or GPU-bound?',
          options: ['Look at the monitor size', 'Lower the render resolution: if frame time drops a lot it is GPU-bound (fill rate), if not it is probably CPU-bound', 'Add more sprites', 'Check the file size'], answer: 1, explain: 'Resolution only changes pixel work. If the frame time does not move, the bottleneck is elsewhere (logic, draw calls).' },
        { pid: 'q-prod1-3', type: 'quiz', q: 'Why look at the slowest frames instead of the average frame time?',
          options: ['They are easier to read', 'Players notice hitches, and an average of 60 fps can hide a 200 ms spike every few seconds', 'Averages are wrong', 'The profiler only shows slow frames'], answer: 1, explain: 'Stutter is about the tail of the distribution (99th percentile), not the mean.' },
      ],
    },
    {
      id: 'prod-testing', title: 'Testing a game', minutes: 35,
      summary: 'What is worth automating in a game, how to keep logic testable, golden replays, bots and fuzzing.',
      sections: [
        { type: 'text', html: `
<h3>"You cannot test games" is half true</h3>
<p>Feel, fun and visuals need people. But a surprising amount of a game is ordinary logic that tests well: rules, damage and economy calculations, inventory, parsing of data and saves, pathfinding, AI decisions, save migrations, network message handling. Automated tests catch regressions in those while you work on the parts that need human judgement.</p>
<h3>Make the code testable: separate simulation from presentation</h3>
<p>The most important design rule: keep the <b>game logic free of engine types</b> (no nodes, no rendering, no audio calls, no wall-clock time). Logic takes inputs and a time step and produces a new state plus events; a thin layer turns state into pixels and sounds. Then a test can create a world in one line, feed commands, and check the state, in milliseconds, without a window. This is also what makes determinism, replays and rollback possible: the same design pays three times.</p>
<h3>Kinds of automated tests that work for games</h3>
<ul><li><b>Unit tests</b>: pure functions and small modules: damage formula, cost curve, pity timer, A* on a tiny map. Fast; written like the drills in this lab (Zig and C++ have tests built in or one framework away; Godot has GUT and gdUnit).</li><li><b>Golden-replay tests</b>: record a list of commands and a seed once, then assert that replaying them produces the same final state checksum. Any unintended change in behaviour trips the test. When you <i>meant</i> to change behaviour, regenerate the golden value deliberately and review the diff (the sample below).</li><li><b>Property tests and invariants</b>: generate many random situations and assert rules that must always hold ("health never exceeds max", "total items are conserved by a trade", "a path never crosses a wall"). They find the case you did not think of.</li><li><b>Fuzzing</b>: feed random and mutated bytes to the parsers (save files, network packets, level files) and make sure they fail gracefully and never crash or hang.</li><li><b>Headless simulation and bots</b>: run thousands of automated playthroughs or encounters without rendering, and measure win rates, time to kill, economy balance, deadlocks. This is the "balance benchmarks" idea: a script that plays the game faster than a human.</li><li><b>Smoke tests</b>: launch the exported game, load each level, check it does not crash or log errors in 30 seconds. Cheap and catches broken builds.</li><li><b>Screenshot tests</b>: render a known scene and compare images; useful for UI and shaders, brittle across GPUs, so use tolerance and one reference machine.</li><li><b>Performance tests</b>: run a standard scene and assert frame time, allocations and memory stay within budget.</li></ul>
<pre><code data-check="zig">const std = @import("std");

/// A small deterministic simulation: a seeded random generator, a position, and commands that change it.
const Sim = struct {
    rng: u64,
    x: i32 = 0,
    hp: i32 = 100,
    frame: u32 = 0,

    fn init(seed: u64) Sim {
        return .{ .rng = seed };
    }

    fn nextRand(self: *Sim) u32 {
        self.rng = self.rng *% 6364136223846793005 +% 1442695040888963407;
        return @intCast(self.rng &gt;&gt; 33);
    }

    fn step(self: *Sim, cmd: u8) void {
        switch (cmd) {
            'L' =&gt; self.x -= 1,
            'R' =&gt; self.x += 1,
            'H' =&gt; self.hp = @min(100, self.hp + 5),
            else =&gt; {},
        }
        if (self.nextRand() % 10 == 0) self.hp -= 7; // a random hazard: deterministic because the generator is seeded
        self.frame += 1;
    }

    /// A summary of the whole state: if any field changes, the checksum changes.
    fn checksum(self: *const Sim) u64 {
        var h: u64 = 1469598103934665603; // FNV-1a
        inline for (.{ @as(u64, @bitCast(@as(i64, self.x))), @as(u64, @bitCast(@as(i64, self.hp))), @as(u64, self.frame) }) |v| {
            h = (h ^ v) *% 1099511628211;
        }
        return h;
    }
};

fn run(seed: u64, commands: []const u8) u64 {
    var sim = Sim.init(seed);
    for (commands) |c| sim.step(c);
    return sim.checksum();
}

const recorded = "RRRLRHRRLLLRRRHRLRRRRHLLRR"; // the recorded command stream, as it would be loaded from a replay file

test "the same replay always reproduces the same checksum" {
    try std.testing.expectEqual(run(42, recorded), run(42, recorded));
}

test "a different seed or a different command changes the outcome, so the test is sensitive" {
    try std.testing.expect(run(42, recorded) != run(43, recorded));
    try std.testing.expect(run(42, recorded) != run(42, "RRRLRHRRLLLRRRHRLRRRRHLLRL"));
}

test "golden value: if you change game rules on purpose, regenerate this number and review the change" {
    try std.testing.expectEqual(@as(u64, 16487696168835199546), run(42, recorded));
}</code></pre>
<h3>What not to automate</h3>
<ul><li>"Is it fun", "does it feel responsive", "is this readable" are playtest questions.</li><li>Pixel-exact visuals on many GPUs: too brittle for the value.</li><li>Anything you would rewrite next week: wait until a prototype becomes a design.</li></ul>
<h3>Manual and playtest discipline</h3>
<ul><li>Keep a short <b>regression checklist</b> for each release (menus, save and load, each level start, pause, quit, input devices, settings persistence).</li><li>Test on the <b>lowest-end device you support</b> and on a clean machine without your dev tools.</li><li>Watch real players (the design lesson): record sessions, note where they hesitate.</li><li>Keep a bug tracker with reproduction steps, build number and the replay or seed attached.</li></ul>
<h3>Where to start</h3>
<ol><li>Separate the simulation from the engine for <i>new</i> code.</li><li>Write unit tests for formulas and parsers first (cheap, high value).</li><li>Add a golden replay of one complete level.</li><li>Fuzz your save loader.</li><li>Add a headless bot once you have balance questions.</li></ol>` },
        { pid: 'q-prod2-1', type: 'quiz', q: 'You refactor the damage system "without changing behaviour" and a golden-replay test fails. What should you do first?',
          options: ['Update the golden value so the test passes', 'Investigate: the checksum changed, so behaviour changed. Find the first frame where state differs, then decide whether it is a bug or an intended change (and only then regenerate the golden value)', 'Delete the test', 'Ignore it, replays are flaky'], answer: 1, explain: 'A golden test exists to flag unintended changes. Refreshing it blindly defeats the purpose.' },
        { pid: 'q-prod2-2', type: 'quiz', q: 'Which design makes a game <i>easy</i> to unit test?',
          options: ['Game rules written inside rendering nodes', 'Pure logic that takes state, input and a time step and returns new state, with the engine layer only presenting it', 'A global singleton for everything', 'Reading the clock directly in rules'], answer: 1, explain: 'No engine, no wall-clock, no globals in the logic: that is also what determinism needs.' },
        { pid: 'q-prod2-3', type: 'quiz', q: 'Which testing technique best finds a crash when a corrupted save file is loaded?',
          options: ['A screenshot test', 'Fuzzing the save parser with random and mutated files', 'A performance test', 'More playtesters'], answer: 1, explain: 'Fuzzing explores malformed inputs far beyond what a human would think to try.' },
      ],
    },
    {
      id: 'prod-repo', title: 'Repositories, assets and pipelines', minutes: 30,
      summary: 'Version control for code and art, build automation, asset checks, and how artists can contribute without breaking things.',
      sections: [
        { type: 'text', html: `
<h3>Games are code plus big binary files</h3>
<p>Version control (Git) was designed for text. A game repository holds code, text assets (scenes, resources, JSON), and large binaries (images, audio, models, fonts). Binaries cannot be merged line by line, bloat the history if they change often, and make clones slow. A small amount of structure keeps all of that healthy.</p>
<h3>Repository hygiene</h3>
<ul><li><b>.gitignore</b> the generated and local files: engine caches (Godot 4: ignore <code>.godot/</code>, but commit the <code>.import</code> files that sit next to your assets, they hold the import settings), build outputs, editor settings with personal paths, logs, <code>node_modules</code>, <code>zig-out</code> and <code>.zig-cache</code>.</li><li><b>Commit the lock files and the engine version</b> (a <code>.godot-version</code> file or README line). "It works on my Godot" is a classic.</li><li><b>Small commits with real messages</b> ("enemy: fix stuck on corners") beat "wip". Art commits too ("slime: add hurt frame").</li><li><b>Branches</b>: short-lived feature branches and a stable main, or trunk-based development with feature flags for a small team. Whatever you choose, keep main <b>always playable</b>.</li></ul>
<h3>Large files: Git LFS</h3>
<p>Git LFS stores large binaries outside the normal history and keeps pointers in the repository. Use it for audio, large textures, videos and models. Pixel art PNGs are small and fine in plain Git. Decide before the first commit, because moving existing files into LFS later rewrites history.</p>
<h3>Merging scenes and resources</h3>
<ul><li>Text formats (Godot <code>.tscn</code>/<code>.tres</code>, Unity YAML) merge reasonably, but two people editing the same scene often conflict. <b>Own your files</b>: agree who edits which scenes, and split big scenes into small ones (one per entity) so people rarely touch the same file.</li><li>Binary assets cannot merge at all: only one person should change a given sprite at a time. Lock files (Git LFS locking) or a simple convention in the team does that.</li><li>Keep <b>layered source files</b> (<code>.aseprite</code>, <code>.kra</code>, <code>.blend</code>) in the repository next to the exported files, or the layers are lost forever.</li></ul>
<h3>The asset pipeline</h3>
<p>The path from an artist's source file to what the game loads should be <b>automatic, documented and checked</b>:</p>
<ol><li><b>Source</b> (layered, editable) → <b>export</b> (PNG, WAV, glTF) → <b>import</b> (engine settings: filter nearest, no mipmaps for pixel art, loop points) → <b>runtime</b>.</li><li><b>Conventions</b>: folder structure, <code>snake_case</code> names, sizes (tile 16×16, sprite 32×32), palettes. Put them in the README and in <b>automated checks</b>.</li><li><b>Lint the assets in CI</b>: dimensions match the manifest, PNG has no unexpected colour profile, colours are inside the project palette, no file larger than a budget, names follow the pattern, audio is at the target loudness. A failing check on the pull request is much cheaper than discovering it in the build.</li><li><b>Generate</b> what can be generated (atlases, sprite sheets, localisation tables, manifests) by scripts that run in CI and locally, so nobody edits derived files by hand.</li></ol>
<h3>Art without git: pull requests from the editor</h3>
<p>Artists should not have to learn branches to contribute. Tools like the <b>spritewright</b> editor (the project that goes with the pixel art track) open the sprites straight from a repository, let the artist draw, and send a <b>pull request</b> through the GitHub API. Reviewers see the before/after images in the pull request's "Files changed" tab (2-up, swipe and onion-skin views), CI runs the asset checks, and the artist never touches a command line. If your artist already knows git, the same flow works with a normal branch.</p>
<h3>Continuous integration for games</h3>
<ul><li>On every push: run the unit tests and replay tests, lint the assets, build the game headless (or export the web build) to prove it still compiles.</li><li>On main or tags: export for each target platform and upload the builds as artifacts. A downloadable build per commit turns "can someone test this?" into a link.</li><li>Keep it <b>fast</b> (minutes). Slow CI stops being used.</li><li>Cache engine downloads and export templates.</li></ul>
<h3>Code review for a game</h3>
<ul><li>Review <b>behaviour</b> by running the branch, not only the diff.</li><li>Check data changes (balance numbers, level files) for intent; ask for a screenshot or short video for visual changes.</li><li>Look for the things in this track: hidden globals, per-frame allocation, update-order assumptions, missing dirty flags, magic numbers that should be data.</li></ul>
<h3>Documentation that pays</h3>
<p>A README with how to run, test and export; one page of architecture (the loop order, the main systems and who owns what); a style guide for art and naming; a changelog. Future you is the main reader.</p>` },
        { type: 'reveal', title: 'Checklist: starting a game repository', html: `<ol><li><code>.gitignore</code> from your engine's template, plus build output folders.</li><li>README: engine version, how to run, test, export.</li><li>Folder layout agreed: <code>scenes/</code>, <code>scripts/</code>, <code>assets/art|audio|fonts</code>, <code>data/</code>, <code>tests/</code>, <code>tools/</code>.</li><li>Large binaries in Git LFS from the first commit (if you use any).</li><li>A CI workflow that runs the tests and an export.</li><li>An asset lint (sizes, names, palette) wired into CI.</li><li>A <code>CONTRIBUTING.md</code> for artists: the folder for each kind of file, naming, size and palette rules, and how to propose a change (pull request or the editor).</li><li>A pinned engine version and a license file; a list of third-party assets and their licenses.</li></ol>` },
        { pid: 'q-prod3-1', type: 'quiz', q: 'Two people edited the same PNG on different branches and git reports a conflict you cannot resolve with a text merge. What prevents this class of problem?',
          options: ['Larger images', 'Agree ownership of binary files (or use Git LFS file locking) so only one person changes a given sprite at a time', 'Compress the PNG', 'Rename the file'], answer: 1, explain: 'Binary files cannot be merged. Process (ownership, locks) is the only fix.' },
        { pid: 'q-prod3-2', type: 'quiz', q: 'Why keep the layered source files (.aseprite, .kra, .blend) in the repository next to the exports?',
          options: ['They load faster', 'Layers, palettes and animation data cannot be recovered from the flattened export, so future edits and re-exports need the source', 'Git requires it', 'The engine imports them directly'], answer: 1, explain: 'A flattened PNG is a lossy product. The source is the real asset.' },
        { pid: 'q-prod3-3', type: 'quiz', q: 'Which CI check on art pull requests gives the most value with the least effort?',
          options: ['Manual review of every file by the lead', 'An automatic lint: dimensions, naming, colours inside the palette, file size budget', 'Rendering every sprite 100 times', 'None'], answer: 1, explain: 'Cheap, objective rules catch most mistakes before a human has to look, and give artists immediate feedback.' },
      ],
    },
    {
      id: 'prod-release', title: 'Shipping and operating a game', minutes: 35,
      summary: 'Build targets, stores, saves across versions, telemetry and crash reports, community, and what to do after launch.',
      sections: [
        { type: 'text', html: `
<h3>Shipping is a feature</h3>
<p>A game is finished when someone else can run it. Getting there involves a surprising amount of work that is not gameplay, and it is cheaper if you do a little of it from the first week: <b>export a build early and often</b> (the checklist in the practice lesson), test it on a machine that is not yours, and treat "does the exported build work" as a daily check, not a final step.</p>
<h3>Targets</h3>
<ul><li><b>Web</b> (HTML5/WebAssembly): zero install, perfect for jams and portfolios; hosted on itch.io, GitHub Pages or your own site. Watch download size (compress, strip unused), audio autoplay rules, threading needs (some engines need special HTTP headers for threads), mobile browser performance.</li><li><b>Desktop</b> (Windows, Linux, macOS): an executable plus data. Windows and macOS warn about unsigned programs; code signing and notarisation avoid it (and cost money and effort). Test on a clean user account.</li><li><b>Mobile</b>: store requirements, touch controls, battery and thermal limits, many screen sizes, background/foreground transitions (save when the app is paused).</li><li><b>Consoles</b>: platform holder programs, development kits, certification requirements. Plan months, not days, and consider a porting partner.</li></ul>
<h3>Distribution</h3>
<ul><li><b>itch.io</b>: the easiest place to publish: free or paid, web and downloads, jams, pay-what-you-want, a page and devlog. A great first release venue.</li><li><b>Steam</b> and other stores: a bigger audience and more requirements: store page assets (capsule art, screenshots, trailer), a fee, reviews and a wishlist system that matters a lot. Build a wishlist audience before launch.</li><li><b>Your own site</b> with a download or a web build is always an option.</li></ul>
<h3>The things a store page needs</h3>
<p>A clear one-sentence pitch, 4 to 6 good screenshots that show <i>gameplay</i> (not menus), a short trailer or GIFs of the core loop in the first seconds, an honest description with controls, system requirements, and a content/age note. You will spend as long on this as on a feature.</p>
<h3>Saves across versions</h3>
<p>Once players have saves, you are bound to them (the save-file lesson): a version number, migrations that are only ever appended, tests with old save fixtures, backups before migrating, and never crash on a newer-version save (tell the player to update). A broken save after an update is the fastest way to lose trust. For web builds, saves in the browser's storage can be cleared by the player or the browser: offer export/import.</p>
<h3>Telemetry and crash reports (respect the player)</h3>
<ul><li><b>Crash reports</b>: capture a stack trace, build number, platform and a few breadcrumbs. Ask consent. Services exist (Sentry and others), and a simple "send log" button works for a small game.</li><li><b>Telemetry</b>: anonymous, minimal and optional events answer design questions: where do players quit, which level has the most deaths, what do they buy. Decide the questions first, collect the least data that answers them, document it in a privacy policy, and obey the law that applies (GDPR, consent for children).</li><li><b>Never collect</b> what you do not need, and never log secrets or personal data in crash reports.</li></ul>
<h3>Versioning and patching</h3>
<ul><li>Version builds (<code>1.2.3</code> or a date) and show the version in the game, so bug reports name it.</li><li>Keep a <b>changelog</b> and patch notes players can read.</li><li>For web builds, cache busting and an "update available" notice avoid players running an old cached build.</li><li>Keep old builds available for reproducing bugs and rolling back.</li></ul>
<h3>Community and feedback</h3>
<p>A place to talk (Discord, forums), a bug report path with a template (version, steps, a replay or log), and a habit of replying. Players who report bugs are your best testers: make it easy and thank them. Be honest about what you will and will not change.</p>
<h3>After launch</h3>
<ul><li>The first days decide most: fix the crash and progression-blocking bugs immediately.</li><li>Retention (do they come back on day 1, day 7) matters more than downloads; look at where players leave.</li><li>Do a <b>postmortem</b>: what went right, what went wrong, what you would do differently, with numbers (time per feature, estimates vs actuals, wishlists, sales). Write it down, even privately.</li></ul>
<h3>Legal and ethical basics</h3>
<ul><li><b>Licenses of everything you ship</b>: code, art, fonts, sound, music, engine. Keep a credits file. Check what "free" assets allow (commercial use, attribution, modification).</li><li><b>Privacy policy</b> if you collect any data; age ratings where stores need them.</li><li><b>Paid random rewards</b> (loot boxes) are regulated or banned in some countries and need disclosed odds on most platforms; design monetisation you would defend to a player.</li><li><b>Accessibility</b> options (remapping, text size, colour-blind modes, reduced motion) are both good design and increasingly expected.</li></ul>` },
        { pid: 'q-prod4-1', type: 'quiz', q: 'You release an update that changes the save format. What protects existing players?',
          options: ['Nothing, they can start again', 'A save version number with an appended migration step, a backup of the old file, tests with old fixtures, and a graceful message for saves from a newer build', 'Encrypting the save', 'Deleting old saves'], answer: 1, explain: 'Players\' progress is the most valuable data you hold. Migrations must be tested and non-destructive.' },
        { pid: 'q-prod4-2', type: 'quiz', q: 'You want to know where players quit your tutorial. What is the most respectful way to find out?',
          options: ['Record everything players do, with their names', 'Anonymous, optional events such as "tutorial step reached" and "quit at step", documented in a privacy policy', 'Guess', 'Ask nobody'], answer: 1, explain: 'Collect the least data that answers a specific question, anonymously, with consent where required.' },
        { pid: 'q-prod4-3', type: 'quiz', q: 'Which habit most reduces nasty surprises at release time?',
          options: ['Exporting only at the end', 'Exporting a build early and often, and testing it on a clean machine', 'Adding features until launch day', 'Skipping store page work'], answer: 1, explain: 'Export problems (missing files, paths, performance) only appear in real builds. Finding them early makes them cheap.' },
        { type: 'reveal', title: 'Exercise: a one-page launch plan for a jam game', html: `<ol><li><b>Target</b>: web build on itch.io plus a Windows/Linux download.</li><li><b>Page</b>: one-line pitch, 4 screenshots, a 15-second GIF of the core loop, controls, credits and licenses.</li><li><b>Safety</b>: version in the corner, a "send log" or report link, save export/import.</li><li><b>Checks</b>: run the exported build on a clean browser profile and another computer; test audio start after the first click; resize the window; play on a laptop trackpad.</li><li><b>After</b>: reply to the first ten comments, fix the top two bugs, write a short postmortem.</li></ol>` },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
