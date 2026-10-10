# 🧗 Senior Interview Lab

Interactive prep for **senior engineering interviews in the AI era**, with a dedicated **Neonomics / open banking** track.
Pure static site (no build step), hosted on GitHub Pages.

## What's inside
- **7 tracks, 26 lessons**: Senior Playbook, Coding Fluency, System Design, Distributed Systems & Reliability, AI-Era Engineering, Neonomics & Open Banking, Scale/Kafka/AWS/Terraform
- **24 in-browser coding exercises** with a CodeMirror editor, tests running in a sandboxed Web Worker (with timeout), hints and reference solutions
- **Interactive lessons**: quizzes, step-through walkthroughs, reveal-and-self-check blocks
- **56 flashcards** with Leitner spaced repetition
- **Mock interview**: random question, timer, rubric
- **36 curated free resources** and full-text search (press `/`)
- Progress and drafts stay in your browser's localStorage

## Develop
```sh
python3 -m http.server 8000   # any static server; workers need http(s), not file://
node scripts/validate.mjs     # every exercise's solution must pass, every starter must fail
```

## Add content
Lessons live in `content/t*.js` as plain objects (`text`, `quiz`, `reveal`, `steps`, `code` sections).
A `code` section needs `starter`, `tests` (uses `test`, `eq`, `assert`, `throws`), and `solution`; CI checks them.

## Accuracy note
Neonomics details come from their public docs and general PSD2 knowledge, not insider information. Verify against <https://docs.neonomics.io>.
