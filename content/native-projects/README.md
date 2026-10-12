# Playable native learning projects

These are original terminal games in C17, Zig 0.17.0 and C++20. They do not use SDL, external graphics, or a JavaScript copy of their mechanics.

**Tile Runner** asks the learner to implement movement, bounds/wall collision, idempotent pickups and an exit condition. **Wave Arena** asks the learner to implement player movement, a firing cooldown, nearest-target selection, enemy movement/damage, scheduled spawns and win/loss conditions.

Each project/language JSON bundle contains:

- `starter` and `solution`: the editable `mechanics` file, with a deliberately broken starter and a working reference.
- `files`: the shared state header/module, the native terminal main, named tests, a learner README and the MIT license.
- `commands`: native build, test, interactive play and deterministic replay export commands.
- `packageConfig`: editable/test/support file lists used by the local test runner. The playable main is fingerprinted support but is excluded from test compilation, which has its own main.
- `explanation`: an explanation of the reference's state changes and update order.

The browser downloads the learner's edited files with `lab-test.mjs` and `lab-manifest.json`. After extraction, `node lab-test.mjs` compiles the actual local files, runs native tests and writes `lab-results.json`. Importing checks the project/language, source snapshot and test/support fingerprints. A recorded pass is an imported local receipt supplied by the learner, rather than an independent remote execution claim.

`main` calls the same learner mechanics in interactive play and `--replay ACTIONS` mode. The latter emits one NDJSON header followed by native-computed state snapshots. The browser checks project/version/language and frame structure, then displays those snapshots. It never applies input, collision, cooldown, spawning or enemy movement rules.

## Maintainer checks

Run from the repository root:

```sh
ZIG=/path/to/zig-0.17.0 node scripts/validate-native-projects.mjs
```

The validator compiles starter/reference tests and playable games, supplies keyboard input to reach native wins, checks losses, compares outcomes across languages, and changes editable collision/cooldown code to prove gameplay and exported frames change. It also tests replay import rejection.

To keep native-produced replay fixtures for browser inspection:

```sh
ZIG=/path/to/zig-0.17.0 node scripts/validate-native-projects.mjs --replay-dir=/path/to/output
```

The `native-projects` browser suite downloads/extracts complete projects, executes the local runner and native main, imports their reports/replays, and checks that changed learner mechanics appear in the rendered native output:

```sh
cd tests
ZIG=/path/to/zig-0.17.0 node e2e/run.mjs native-projects
```

The browser suite requires Node.js 22+, Python 3, all three compilers and the normal Playwright/browser setup. Override compilers with `CC`, `CXX` or `ZIG`. Test directories include spaces to exercise downloaded-project path handling.

On Windows, use `game.exe`/`project-tests.exe` instead of the Unix executable names and an appropriate C17/C++20 toolchain. Games use standard terminal input/output. Zig gameplay links the system C library with `-lc`; its mechanics tests do not require libc.
