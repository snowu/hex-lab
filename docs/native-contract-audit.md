# Native contract review and validation

The review covers all 149 original native ports: 55 C17, 54 C++20 and 40 Zig, spanning 70 exercise contracts. The [matrix](native-contract-matrix.md) lists the actual behaviors reviewed per exercise; the [machine-readable manifest](native-semantic-audit.json) records source/test/instruction hashes and native test files. All 417 catalog bundles retain their original instruction text, author/contributor lists, license, source/ref and support hash. A tracked metadata baseline makes that check independent of Git history.

This review compares instruction requirements with public APIs, reference behavior and native tests. It includes state transitions, failure paths, output order, ownership, numeric representations and thread safety. The assertion counts describe evidence size; they are not an exhaustive correctness proof. Existing Python examples can themselves be narrower than the instructions: for example, the old scale example appended the tonic even for a partial interval pattern, and the old zipper example mutated its input. The corrected native behavior follows the stated contract.

## Corrections and regressions

| Area | Previous behavior | Corrected behavior and evidence |
| --- | --- | --- |
| Bank account | C transactions raced; C++ open/close omitted locks and accepted zero amounts. | C serializes every lifecycle/read/mutation operation with C17 atomics. C++ locks lifecycle operations, rejects zero and checks overflow. C/C++/Zig run matching 8-thread, 20,000-operation deposit/withdraw phases and lifecycle checks. |
| Robot name | C assigned a deterministic constant-step permutation. | Random identifiers, collision rejection, retained/retired-name uniqueness, reset checks and a 2,000-name regression against the predictable permutation. |
| Zipper | C/C++ navigation and edits changed shared input state. | Pure operations return independent owned snapshots, with clone/free guidance and lifetime tests. A C++20 alternative uses immutable `shared_ptr` nodes, `optional` navigation and RAII; it preserves old versions while sharing unchanged subtrees. |
| Word search | C/C++ only tested three directions and used a different coordinate base. | All eight directions and exact case are checked across all three tracks. Zero-based coordinates, ragged boundaries, no wrapping, absence, empty words and single characters are explicit. |
| Scale generator | C/C++ unconditionally appended the tonic. | N+1 pitches follow every supplied interval; partial `M` and `m` patterns end at the actual next note. |
| Poker | Zig omitted five-of-a-kind across multiple decks; malformed faces/suits could pass or cause unsafe C parsing. | Correct category ordering, invalid-card checks and existing category/tie/ace-low cases. |
| SGF | Zig kept duplicate property IDs separate and borrowed identifier bytes from the input. | Property values merge, identifiers are owned, and an input-mutation regression verifies lifetime independence. |
| React | Repeated input edges could double-free a compute cell during destruction. | C registers a repeated dependency once. C++ uses a reactor-owned `vector<unique_ptr<cell>>`, topological settling and once-only callbacks. Regression checks both destruction and callback counts. |
| Wordy | Division by zero and signed overflow could crash or silently misbehave. | Checked left-to-right arithmetic rejects these inputs while preserving the supported grammar. |
| VLQ | Decoding a value above uint32 silently truncated high bits. | Overflow returns the existing error status, alongside incomplete-sequence tests. |
| Resistor trio | Integral C/C++ scaling truncated 1500 ohms into 1 kiloohm. | The integral API chooses a unit that preserves the exact value: 1500 ohms, with the existing whole kilo/mega/giga cases unchanged. |
| Satellite | A shared-length C/C++ signature could not express unequal traversal lengths. | A checked constructor accepts separate lengths and rejects mismatches; the existing equal-length API remains available. |
| Sudoku / conversion | Empty cage combinations were omitted; C positional conversion could wrap. | The empty combination is represented explicitly and fixed-width conversion reports overflow instead of wrapping. |

[Regression results](native-contract-regressions.json) prove that current references pass and deliberately restored old bugs fail at runtime. Fixtures retain their upstream license and attribution. They are tracked, self-contained inputs; the runner never calls `git show`, so the checks work after commits, merges and shallow CI checkouts. Compilation failures do not count as semantic regression evidence. Expected assertion failures run with core dumps disabled.

## Reproduce

Use Node 22+, C17/C++20 compilers and the repository's Zig 0.17.0 toolchain. Thread tests explicitly compile with `-pthread`. Put temporary validation files on a disk-backed volume when running the full catalog:

```sh
export TMPDIR="$HOME/.cache/native-validation"
mkdir -p "$TMPDIR"
export ZIG=/path/to/zig
node scripts/native/semantic-audit.mjs
node scripts/native/contract-regressions.mjs
node scripts/native/validate.mjs --require-all
```

The shared CI workflow runs the metadata/semantic manifest check and regression rejection after the existing full native validation. The manifest compares fixed metadata hashes rather than the current Git commit; intentional upstream metadata updates need an explicit baseline review.

## Generation, formatting and ownership

C ports are reproduced by `scripts/native/ports-c.mjs`; readable contract replacements live under `scripts/native/ports-c-overrides/`. Imported/native track corrections live under `scripts/native/contracts/` and are applied by `apply-contracts.mjs`, the upstream importer and C++ derivation. C++ derivation also includes the tested RAII zipper alternative under `cpp-alternatives/zipper/`. Existing original Zig bundles remain their versioned source records; their corrections and formatting are reproducible through the same contract/formatting tools.

```sh
node scripts/native/ports-c.mjs
node scripts/native/derive-cpp.mjs
node scripts/native/apply-contracts.mjs
node scripts/native/format-native.mjs
# Verify formatting without writing catalog files:
node scripts/native/format-native.mjs --check
```

C/C++ starters, references and tests are formatted with clang-format (the recorded pass used 23.1.3, LLVM style, four spaces, 88 columns). Zig sources use `zig fmt`. Set `CLANG_FORMAT` and `ZIG` to installed executables; otherwise discovery uses PATH and portable per-user cache locations based on `os.homedir()`. Formatting checks metadata before/after and changes only code sections. Generators use the same formatting functions, so regenerated exercises remain readable.

Native APIs document their scalar domains, caller buffer capacity, coordinate convention and ownership. C's zipper deliberately uses full snapshot copying for simple lifetime rules: returned snapshots are independently freed; a plain struct assignment transfers ownership, while `zipper_clone` creates a true owned copy. The C++ alternative makes ordinary copies safe through shared immutable nodes and RAII. Other retained C-compatible C++ APIs expose the constraints of that interface; the semantic matrix makes those representations explicit instead of implying Python's arbitrary-precision scalar model.
