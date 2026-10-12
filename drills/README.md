# Game dev drills (C, Zig and C++)

Generated from `content/drills-game.js` by `node scripts/gen-drills.mjs`. Each file holds a starter with stubs followed by tests. Edit the part above the tests marker until they pass.

```sh
cc -std=c17 -Wall drills/c/fixed_steps.c -lm -o /tmp/d && /tmp/d # C17
zig test drills/zig/fixed_steps.zig                                  # Zig (written against 0.17)
g++ -std=c++20 -Wall -o /tmp/d drills/cpp/fixed_steps.cpp && /tmp/d   # C++20
```

The same prompts, hints and reference solutions are in the lab (game dev section). CI compiles every reference solution and checks every starter fails.
