# 🧗 Senior Interview Lab

Interactive prep for **senior engineering interviews in the AI era**, with a dedicated **Neonomics / open banking** track.
Pure static site (no build step), hosted on GitHub Pages.

## What's inside
- **7 tracks, 26 lessons**: Senior Playbook, Coding Fluency, System Design, Distributed Systems & Reliability, AI-Era Engineering, Neonomics & Open Banking, Scale/Kafka/AWS/Terraform
- **24 Python coding exercises** with a CodeMirror editor. Python runs in your browser via [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly, loaded from a CDN on first use, about 10 MB, then cached) in a Web Worker with a timeout, with hints and reference solutions
- **Interactive lessons**: quizzes, step-through walkthroughs, reveal-and-self-check blocks
- **5 live simulations**: Kafka partitions/consumer groups, circuit breaker, consistent-hash ring, token bucket, and a bank-outage simulator with production-like numbers (log-normal latencies, p50/p95/p99, a healthy baseline, then a scripted incident; shared pool vs timeout / bulkhead / breaker)
- **6 bug hunts** (click the buggy lines) and **4 predict-the-output** snippets that you can then run for real (all Python)
- **Every lesson works as text, as practice, or both** (switch at the top of a lesson)
- **Vim motions** in the editor (toggle, remembered), with `:run` / `:w` to run the tests
- **Reset all progress** from the footer
- **56 flashcards** with Leitner spaced repetition
- **Mock interview**: random question, timer, rubric
- **36 curated free resources** and full-text search (press `/`)
- Progress and drafts stay in your browser's localStorage

## Develop
```sh
python3 -m http.server 8000   # any static server; workers need http(s), not file://
node scripts/validate.mjs     # needs node + python3: every Python solution must pass its tests, every starter must fail
```

## Add content
Lessons live in `content/t*.js` as plain objects (`text`, `quiz`, `reveal`, `steps`, `code` sections).
Interactive sections (`sim`, `bug`, `predict`) are added with `INSERT(lessonId, position, section)` in `content/t8-interactive.js`, each with a unique `pid`; simulations are implemented in `assets/sims.js`.
Code exercises live in `content/exercises-py.js` (lessons reference them with `{ type: 'code', ref: 'id' }`). An exercise needs `starter`, `tests` (Python: `test(name, fn)` or `@test(name)`, `eq`, `raises`, `close`; sync or async) and `solution`. The same `assets/harness.py` runs them in the browser (Pyodide) and in CI (CPython). A `predict` section declares its expected `output`. CI (`scripts/validate.mjs`) runs all of them for real.

## Accuracy note
Neonomics details come from their public docs and general PSD2 knowledge, not insider information. Verify against <https://docs.neonomics.io>.
