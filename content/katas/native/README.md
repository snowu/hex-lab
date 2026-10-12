# Native exercises

This catalog covers every exercise in `content/katas/index.js` in C17, C++20 and Zig 0.17.0. The browser loads each language bundle on demand. Each bundle includes starter files, test files, reference files, instructions, attribution and a pinned source revision. Shared test frameworks live in `support/` under a content hash.

Upstream files come from the MIT-licensed Exercism C, C++ and Zig tracks. Exercises unavailable in a native track have original ports of the existing exercise specification. Some C++ ports use portable C implementations compiled as C++20; others use native C++ APIs. The headers and tests define each port's API, memory ownership and input contract. Track licenses are included in every downloaded project, alongside the original exercise attribution.

Run from the repository root:

```sh
node scripts/native/check-coverage.mjs
node scripts/native/test-zip.mjs
node scripts/native/validate.mjs --require-all
```

Set `CC`, `CXX` and `ZIG` to select compilers. Set `TMPDIR` to a directory with several gigabytes of disk space when validating the full catalog. The compiler checks execute every reference and ensure starters do not already pass. Original ports must compile before failing their tests; imported upstream skeletons can be declarations that need implementation before linking.

`scripts/native/import.mjs` imports local upstream checkouts selected by `EXERCISM_C`, `EXERCISM_CPP` and `EXERCISM_ZIG`. It replaces imported bundles, so preserve locally adapted C++ bundles before reimporting. `ports-c.mjs` generates original C ports and validates each reference; `derive-cpp.mjs` generates portable C++ counterparts while preserving bundles marked `cppAdapted`. `index.mjs` refreshes the browser metadata and coverage manifest. Original Zig ports are stored directly in their bundles.
