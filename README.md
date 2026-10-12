# 🧗 Senior Interview Lab

Interactive prep for **senior engineering interviews in the AI era**, with a dedicated **Neonomics / open banking** track.
Pure static site (no build step), hosted on GitHub Pages.

## What's inside
- **10 tracks, 44 lessons**: Senior Playbook, Coding Fluency, **Coding Patterns**, System Design, **Databases & SQL**, **Full-Stack (browser, edge, auth, API, sync)**, Distributed Systems & Reliability, AI-Era Engineering, Neonomics & Open Banking, Scale/Kafka/AWS/Terraform
- **53 coding exercises**: 44 Python (12 are timed pattern drills, 8 are full-stack: cache-control, CORS, JWT, signed cursors, single-flight, stale-while-revalidate, compare-and-swap saves, sync decisions) and 9 SQL with a CodeMirror editor. Python runs in your browser via [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly, loaded from a CDN on first use, about 10 MB, then cached) in a Web Worker with a timeout, with hints and reference solutions
- **Interactive lessons**: quizzes, step-through walkthroughs, reveal-and-self-check blocks
- **SQL exercises run in the browser** on SQLite inside the same Python runtime: queries are checked against a reference on a visible and a hidden dataset (so hard-coding fails), and index exercises are verified through the real query plan
- **6 live simulations**: Kafka partitions/consumer groups, circuit breaker, consistent-hash ring, token bucket, a transaction-isolation simulator (lost update, write skew, phantoms under Read committed / Repeatable read / Serializable), and a bank-outage simulator with production-like numbers (log-normal latencies, p50/p95/p99, a healthy baseline, then a scripted incident; shared pool vs timeout / bulkhead / breaker)
- **6 bug hunts** (click the buggy lines) and **4 predict-the-output** snippets that you can then run for real (all Python)
- **Every lesson works as text, as practice, or both** (switch at the top of a lesson)
- **Vim motions** in the editor (toggle, remembered), with `:run` / `:w` to run the tests
- **Timed mode** on every exercise: a countdown with hints locked, attempts and best times recorded
- **Design lab**: 8 backend design reps (clock, six structured steps, hints, side-by-side comparison with a reference, rubric self-score), an estimation trainer with generated scenarios, numbers to know
- **Plan**: a daily session (15/30/60 min) built from your due cards, unsolved drills, design reps and weakest track; a 20-question diagnostic with a self-rating; readiness bars and an activity heatmap
- **Story bank**: STAR stories with a rule-based coach, competency coverage gaps and a timed out-loud practice mode
- **Backup**: export and import all progress as JSON
- **Optional cloud sync** (Supabase email-code sign-in, compare-and-swap, explicit conflict choice): see below
- **Reset all progress** from the footer
- **78 flashcards** with Leitner spaced repetition
- **Mock interview**: random question, timer, rubric
- **43 curated free resources** and full-text search (press `/`)
- Progress and drafts stay in your browser's localStorage

## Cloud sync (optional)
Progress lives in the browser. If you want it on several devices, the Plan page has a **Cloud sync** panel: sign in with an emailed one-time code and progress syncs through one row in Supabase.

Design (the same shape as a compare-and-swap cloud save): local data is always authoritative and saved first; the server's `generation` orders writes (never a device clock); identical snapshots are never re-uploaded; if both sides changed since the last sync you are shown both and **choose**, nothing is overwritten automatically; an empty device downloads automatically, a device with data never silently replaces itself; reset can also delete the cloud copy so old progress cannot come back. The logic lives in `assets/sync-core.js` (pure, unit-tested); `assets/cloud.js` is only the Supabase + UI wiring.

Setup, once:
1. In the Supabase SQL editor of the project in `assets/cloud-config.js`, run [`supabase/lab_progress.sql`](supabase/lab_progress.sql). It is idempotent and adds one table plus one function with row-level security.
2. Auth must send a **code** in the email (template variable `{{ .Token }}`). A typed code works on any device, unlike a magic link.
3. Open the Plan page, sign in, done. To switch it off, empty the values in `assets/cloud-config.js`.

Notes: the URL and *publishable* key in `cloud-config.js` are public by design (authorisation is the signed-in user's JWT plus RLS); never put a service-role key in this repo. Every project on `<user>.github.io` shares one browser origin, so this app uses its own `sil:` storage keys and its own auth storage key (`sil-auth`). On Supabase's free tier a project pauses when idle (sync reports "offline" until it wakes) and the default email sender is heavily rate limited, so configure custom SMTP for regular use.

## Develop
```sh
python3 -m http.server 8000   # any static server; workers need http(s), not file://
node scripts/test-sync.mjs    # sync engine against simulated devices + server (no network)
node scripts/validate.mjs     # needs node + python3: every Python/SQL solution must pass, every starter must fail, SQL reference results must match their declared rows
```

## Add content
Lessons live in `content/t*.js` as plain objects (`text`, `quiz`, `reveal`, `steps`, `code` sections).
Interactive sections (`sim`, `bug`, `predict`) are added with `INSERT(lessonId, position, section)` in `content/t8-interactive.js`, each with a unique `pid`; simulations are implemented in `assets/sims.js`.
Code exercises live in `content/exercises-py.js` (lessons reference them with `{ type: 'code', ref: 'id' }`). An exercise needs `starter`, `tests` (Python: `test(name, fn)` or `@test(name)`, `eq`, `raises`, `close`; sync or async) and `solution`. The same `assets/harness.py` runs them in the browser (Pyodide) and in CI (CPython). A `predict` section declares its expected `output`. CI (`scripts/validate.mjs`) runs all of them for real.

## Accuracy note
Neonomics details come from their public docs and general PSD2 knowledge, not insider information. Verify against <https://docs.neonomics.io>.

## Browser tests
`tests/` holds a Playwright suite (smoke over every route, all 53 reference solutions through the real editor and runtime, interactive features, full-stack simulators, and the whole cloud-sync flow against a fake Supabase SDK, so no real project is touched).

```sh
cd tests && npm ci && npx playwright install chromium
./setup-sandbox-libs.sh      # only on a minimal Linux/WSL image missing system libraries (no root needed)
node e2e/run.mjs             # or: node e2e/run.mjs cloud smoke
LAB_URL=https://snowu.github.io/senior-interview-lab/index.html node e2e/run.mjs smoke fullstack cloud   # against the live site
```

## AI feedback (optional)

A "Get AI feedback" button on coding challenges, design reps and the story editor sends your answer to a tiny
Cloudflare Worker (`worker/`), which asks a cheap model on OpenCode Go and returns a verdict, what works, what to
fix and one thing to practise. The model key lives only in the Worker. The button is hidden until
`assets/feedback-config.js` has a URL.

- Benchmark candidate models first (key in a gitignored repo-root `.env` as `OPENCODE_API_KEY=...`): `node ai/bench/bench.mjs --runs=2` (5 seeded-flaw answers per model).
- Deploy (the key never touches the terminal): `cd worker && npx wrangler login && grep '^OPENCODE_API_KEY=' ../.env | cut -d= -f2- | npx wrangler secret put OPENCODE_API_KEY && npx wrangler deploy`,
  then put the printed `*.workers.dev` URL in `assets/feedback-config.js`.
- Change the model with `LAB_MODEL` in `worker/wrangler.jsonc` (default is a placeholder until benchmarked).
- Chat: a side panel (header icon or Ctrl+J) answers questions with the open page and your editor contents as context (non-training model). It has a connection test.
- Protection: CORS only for `https://snowu.github.io`, 10 reviews/min/IP, 6000-char answer cap, JSON-only output.
  `node scripts/test-worker.mjs` runs the Worker's tests offline.

## Owner-only track

The open-banking focus track (plus its mock questions, cards and resources) is shown only when the stored sign-in session belongs to the owner email (`assets/owner-gate.js`). It is a cosmetic JS check, not access control: the content is in the public files.

## Katas

`#/katas` lists Exercism's Python practice exercises (139 imported, MIT licence, authors credited per exercise). They run in
the browser against their own `unittest` suites (harness mode `#!unittest:<module>`), with the same editor, vim mode,
timer, hints and AI help as the other challenges, and progress counts like everything else. Other languages: each kata shows
the matching `exercism download` command plus a paste box for AI feedback.

- Import / refresh: `node scripts/import-exercism.mjs [--ref=<sha>]` (pinned commit recorded in `content/katas/index.js`).
- `node scripts/validate-katas.mjs` checks every reference solution passes and every starter fails (CI runs it).
- Excluded because they cannot run in one browser worker: `paasio`, `error-handling`, `parallel-letter-frequency`.

## Ask AI buttons

Flashcards, quick checks, predict-the-output, bug hunts, code challenges, mock questions, design reps, lessons and katas have an
"Ask AI" button. It opens the tutor chat and sends a prepared question; the chat adds the open page and your editor as context.
`⇔` in the chat header makes the panel wider.

## AI mock interviewer and usage counter

On the mock page, **Interview me (AI)** turns a question into a conversation: the interviewer asks follow-ups (up to 4 answers, probing gaps
in a hidden rubric), then grades the transcript and pre-ticks the rubric, which you can correct. Results save to the normal mock history.
Worker route `/interview` (modes `turn` and `grade`), general model only.

Every Worker response reports provider token counts; the browser keeps a per-day counter (`silu:usage`, device-local, not synced) and the
Plan page shows today / this month / 60 days, per model, with the share of the OpenCode Go monthly cap. Prices are list prices (DeepSeek doubles at peak hours), so
it is headroom, not a bill.

## Mobile

Phones are a first-class target, reading and interactive lessons first. At <=760px the header is one short row that scrolls away and the
section nav becomes a bottom tab bar; on touch devices buttons and bug-hunt lines are 36-42px tall, inputs are 16px (no iOS focus zoom),
keyboard hints are hidden, flashcards say "tap", and the tutor chat is full-screen (Enter = newline, Send button sends).
`tests/e2e/mobile.mjs` (390x844, touch) guards all of it, including "no sideways scrolling on any page".

## My cards and kata reviews

- **My cards** (stored in `sil:mycards`, so they sync and export with progress): "Add to my cards" under every quick-check, predict-the-output and
  bug-hunt explanation; "+ card" on tutor replies (the tutor condenses the answer into a card you can edit before saving); and a "New card" form on the
  flashcards page. They join the normal spaced-repetition deck under the "My cards" filter. Text is escaped; `code` and fenced blocks render.
- **Kata reviews** (`sil:kreview`): solving a kata schedules a review after 2, 5, 14, 30 and 60 days. Passing the tests again once it is due moves it up a box;
  "Mark as shaky" brings it back tomorrow. Due katas show in the list, on the Katas button ("Review: ...") and in the daily plan.

## Game dev section

A second section on the same site, for **learning game development** (it is not interview prep: there are no mock interviews or behavioral stories there). Switch with the arrows button in the header or the tile on the home page; the choice is remembered per device. It has its own violet theme and reuses everything else (lessons, progress, XP, flashcards, links, search).

- **11 tracks, 61 lessons** in a learning order: game loop and architecture, game math, **game programming patterns** (12 lessons: sequencing, command, observer and event queue, state, pool/flyweight/data locality, type object, dirty flag, component and service locator, spatial partitioning, bytecode, singletons and other traps, a worked architecture), simulation and physics, game design theory, graphics/UI/audio, game AI, multiplayer networking, techniques (procedural generation, noise and WFC, cameras, saves, a Godot field guide, Zig for games, C++ for games, a practice ladder), production and tooling, and pixel art.
- **16 interactive simulations** (timestep, tunneling, easing, juice, event queue, integrators, raycasting, transforms, flocking, netcode prediction and interpolation, caves, noise, and a pixel editor, colour ramps, dithering, animation).
- **33 coding drills in C, Zig and C++** (no Python). Native languages compile locally, so each drill shows the prompt, starter, tests, hint and reference solution, gives you the single file to download, and you run it locally (`cc -std=c17 x.c -lm`, `zig test x.zig`, `g++ -std=c++20 x.cpp`). The same files live in `drills/c`, `drills/zig` and `drills/cpp`. You can paste your solution for AI feedback and tick the drill off yourself. Zig drills target **Zig 0.17.0**.
- **Everything is compiled in CI.** `node scripts/validate-drills.mjs` compiles every reference solution (C and C++ with AddressSanitizer and UBSan) and checks every starter fails its tests. `node scripts/validate-snippets.mjs` compiles and runs the complete code samples embedded in lessons (marked `data-check`). Both need Zig 0.17.0, a C compiler and g++ (`ZIG=/path/to/zig`). After editing `content/drills-*.js` run `node scripts/gen-drills.mjs` (`--check` fails when `drills/` is stale). `node scripts/validate.mjs` also checks that lesson HTML tags are balanced.
- The pixel art track points to **spritewright**, a reusable editor that lives in its own project: usable by itself in a browser (open a GitHub repo or a local folder) or as a dependency of a game repository.

## Dev Lab learning tools

Game Dev Lab includes a learning plan with 15/30/60-minute sessions, game-specific diagnostics and self ratings, learning progress, activity history, backup, cloud sync and AI usage. Its assessment and session settings are separate from interview prep. Katas and their spaced reviews are available in both sections.

The Design lab has three game architecture exercises: a platformer controller, a sprite/save pipeline and a wave arena. Game estimation practice covers frame budgets, texture memory and collision pairs. Each design exercise supports saved drafts, optional timing, hints, reference comparisons, rubric self review and a learning note. Pixel Forge is available from the header and home toolkit: open spritewright, try the teaching editor, or follow the pixel-art workflow and asset-pipeline exercise.

## Build & play (Game Dev Lab)

Open **play** in the game-dev navigation or use the home toolkit. All workspaces run on the static site:

- **Mechanics lab:** a playable platformer with acceleration, braking, jump impulse, gravity, coyote time, input buffering and camera tuning. Pause, single-step, slow down, change the rendering cap/interpolation, inspect contacts and velocity, record/replay tick inputs, and compare saved A/B controller presets.
- **Debug playground:** reproduce and repair render-dependent simulation, repeated jumps, tunneling and moving-platform problems. Three native code-repair exercises in C, Zig and C++ cover duplicate damage, enemies stuck behind walls, and old/corrupted saves.
- **Art to game:** import a PNG from spritewright, configure sheet frames, frame rate and pivots, and test it in the controller. Saved art can also appear in the platformer and arena projects.
- **Level sandbox:** paint solid tiles, enemies, pickups, a spawn and a goal; switch directly to play. Fall/contact locations appear on the map and can be saved with the experiment.
- **Pathfinding workbench:** paint walls and weighted terrain, step through search expansion, and compare BFS, Dijkstra and A* by visited cells, path length and terrain cost.
- **AI workbench:** edit a small state machine's thresholds or a priority behaviour tree's condition/action branches. Drag the target and change health while inspecting active decisions.
- **Shader playground:** edit real GLSL fragment shaders, adjust uniforms, pause time and see compiler errors while the previous working effect keeps rendering. WebGL is required for rendering; unsupported devices can still edit and save source.
- **Performance playground:** measure collision time and candidate pairs for naive all-pairs and a spatial grid. Compare the same snapshot, change object count/cell size, and inspect clustered worst cases and recent timing samples. Measurements depend on the device.
- **Game katas:** eight original mechanics exercises and three repair exercises in C, Zig and C++, with a visible language selector, syntax highlighting for editable code, tests and references, separate drafts, downloadable single-file starters/tests, references and spaced reviews. Compile and run locally, then record that your tests pass. Zig targets 0.17.0. All 139 Exercism exercises also have C, Zig and C++ starters, tests and references, downloadable as complete project ZIPs. Game Dev Lab routes use this native catalog; Interview Lab retains its Python catalog.
- **Build-along games:** Pong → Breakout → a platformer room → a wave arena, each with three playable checkpoints, linked code exercises, tuning and learning notes. A checkpoint requires its playable target, a solved linked kata and a note. Export a standalone, editable HTML game that runs locally without a server or external dependencies; the runtime source is available in the workspace.
- **Project notebook:** saved experiments, screenshots, predictions, observations, decisions, bugs and next attempts; restore workbench settings, review demonstrated outcomes, or export the notebook. Up to 40 entries, subject to browser storage capacity. Normal progress backup and cloud sync include the notebook, project checkpoints, art and game-kata reviews.

Seven guided paths connect the 150 native katas by topic and prerequisite, with progress tracked separately for C, Zig and C++. Every kata includes staged hints, game context and a reference explanation. Lesson-drill drafts also survive language changes, completion, navigation and reload.

**Native mini-projects:** Tile runner and Wave arena provide editable mechanics, terminal keyboard play, regression tests and references in all three languages. Compile your downloaded project locally; export its native frames with `--replay ACTIONS > replay.ndjson` and import them into the app's replay viewer. The viewer displays the executable's output.

**Local test feedback:** Download the test runner ZIP, install Node.js 22 and the selected native compiler, and run `node lab-test.mjs`. Import `lab-results.json` to inspect named failures and compiler diagnostics, load the exact tested source, and record an imported local pass. Reports bind editable source and supplied tests with hashes; changing the editor requires a fresh run. Imported local results and self-reported completion are displayed separately.

Game-specific kata reviews and the next unfinished project appear in the learning plan. Progress is still local first.

Verification:

```sh
node scripts/test-game.mjs               # deterministic simulation, collision/search, project runtime
node tests/e2e/run.mjs playgrounds       # real browser interactions, native kata downloads, mobile controls and standalone export
node tests/e2e/run.mjs shaders           # requires a browser with working WebGL
```

For software WebGL browser tests, set `LAB_SOFTWARE_GL=1`; `LAB_BROWSER_PATH=/path/to/chrome` selects a different installed Chromium executable if needed. The existing test dependency setup still applies.

Native kata checks: `node scripts/validate-native-katas.mjs --require` compiles all eleven mechanics/repair starters and references in all three languages; references must pass and starters must compile but fail. Set `CC`, `CXX` or `ZIG` to select a compiler.

Full native catalog checks: `node scripts/native/validate.mjs --require-all` checks all 417 language variants against their tests and rejects already-passing starters. Imported upstream skeletons may require implementation before they link; original ports compile before their failing tests run. Set `TMPDIR` to a disk-backed directory when checking the full catalog.

Native code highlighting uses pinned local Prism grammars for C, C++ and Zig, with the same colors as the existing editor theme. Browser checks: `node tests/e2e/run.mjs native-highlighting`.

Learning and project checks:

```sh
node scripts/test-local-runner.mjs
node scripts/validate-native-projects.mjs
node tests/e2e/run.mjs game-learning native-projects learning-drafts
```

The learning and native-project browser suites compile downloaded packages and require C17, C++20 and Zig 0.17 compilers in `PATH` (or selected with `CC`, `CXX` and `ZIG`).

The native contract review and regression evidence are documented in [docs/native-contract-matrix.md](docs/native-contract-matrix.md).
