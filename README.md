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
