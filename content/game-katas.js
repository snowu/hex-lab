/* Original native game mechanics katas. */
window.GAME_KATAS = [
  {
    "id": "cooldown",
    "title": "Cooldowns without frame counts",
    "prompt": "Subtract elapsed seconds and clamp at zero. A negative dt returns NaN.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-loop",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble cooldown(double remaining, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble cooldown(double remaining, double dt) {\n    return dt < 0 ? NAN : fmax(0, remaining - dt);\n}",
        "tests": "int main(void) {\n    assert(cooldown(2, .25) == 1.75);\n    assert(cooldown(.1, .2) == 0);\n    assert(isnan(cooldown(1, -1)));\n    assert(cooldown(-2, 0) == 0);\n    assert(cooldown(2, 0) == 2);\n    return 0;\n}"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble cooldown(double remaining, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble cooldown(double remaining, double dt) {\n    return dt < 0 ? NAN : fmax(0, remaining - dt);\n}",
        "tests": "int main(void) {\n    assert(cooldown(2, .25) == 1.75);\n    assert(cooldown(.1, .2) == 0);\n    assert(isnan(cooldown(1, -1)));\n    assert(cooldown(-2, 0) == 0);\n    assert(cooldown(2, 0) == 2);\n    return 0;\n}"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn cooldown(remaining: f64, dt: f64) f64 {\n    _ = remaining;\n    _ = dt;\n    return 0;\n}\n",
        "solution": "const std = @import(\"std\");\nfn cooldown(remaining: f64, dt: f64) f64 {\n    return if (dt < 0) std.math.nan(f64) else @max(0, remaining - dt);\n}\n",
        "tests": "test \"mechanic edge cases\" {\n    try std.testing.expectEqual(@as(f64, 1.75), cooldown(2, 0.25));\n    try std.testing.expectEqual(@as(f64, 0), cooldown(0.1, 0.2));\n    try std.testing.expect(std.math.isNan(cooldown(1, -1)));\n    try std.testing.expectEqual(@as(f64, 0), cooldown(-2, 0));\n    try std.testing.expectEqual(@as(f64, 2), cooldown(2, 0));\n}\n"
      }
    },
    "hints": [
      "Think in seconds: frame count is not elapsed time.",
      "Subtract dt from the remaining duration, then clamp to zero.",
      "A negative dt returns NaN; zero dt leaves a positive cooldown unchanged."
    ],
    "explanation": "One subtraction and a clamp keep the countdown bounded at zero, independently of how many frames elapse.",
    "difficulty": 1,
    "topics": [
      "time",
      "basics"
    ],
    "prereqs": [],
    "examples": [
      {
        "input": "remaining=2, dt=0.25",
        "output": "1.75 seconds"
      },
      {
        "input": "remaining=0.1, dt=0.2",
        "output": "0 seconds"
      },
      {
        "input": "remaining=1, dt=-1",
        "output": "NaN"
      }
    ]
  },
  {
    "id": "inventory",
    "title": "Inventory stacking",
    "prompt": "Mutate slot quantities: fill existing stacks first, then empty slots, up to max per slot. Return leftover items. Input quantities are between zero and max.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-data-saves",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) {\n    return 0;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) {\n    for (int empty = 0; empty < 2; empty++)\n        for (size_t i = 0; i < n; i++) {\n            if ((slots[i] == 0) != empty)\n                continue;\n            unsigned add = count < max - slots[i] ? count : max - slots[i];\n            slots[i] += add;\n            count -= add;\n        }\n    return count;\n}",
        "tests": "int main(void) {\n    unsigned s[] = {3, 0, 4};\n    assert(stack_items(s, 3, 5, 5) == 0);\n    assert(s[0] == 5 && s[1] == 2 && s[2] == 5);\n    unsigned full[] = {5};\n    assert(stack_items(full, 1, 3, 5) == 3);\n    assert(stack_items(full, 0, 2, 5) == 2);\n    unsigned e[] = {0, 2, 0};\n    assert(stack_items(e, 3, 5, 4) == 0);\n    assert(e[0] == 3 && e[1] == 4 && e[2] == 0);\n    assert(stack_items(e, 3, 0, 4) == 0);\n    assert(stack_items(NULL, 0, 7, 4) == 7);\n    return 0;\n}"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) {\n    return 0;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) {\n    for (int empty = 0; empty < 2; empty++)\n        for (size_t i = 0; i < n; i++) {\n            if ((slots[i] == 0) != empty)\n                continue;\n            unsigned add = count < max - slots[i] ? count : max - slots[i];\n            slots[i] += add;\n            count -= add;\n        }\n    return count;\n}",
        "tests": "int main(void) {\n    unsigned s[] = {3, 0, 4};\n    assert(stack_items(s, 3, 5, 5) == 0);\n    assert(s[0] == 5 && s[1] == 2 && s[2] == 5);\n    unsigned full[] = {5};\n    assert(stack_items(full, 1, 3, 5) == 3);\n    assert(stack_items(full, 0, 2, 5) == 2);\n    unsigned e[] = {0, 2, 0};\n    assert(stack_items(e, 3, 5, 4) == 0);\n    assert(e[0] == 3 && e[1] == 4 && e[2] == 0);\n    assert(stack_items(e, 3, 0, 4) == 0);\n    assert(stack_items(NULL, 0, 7, 4) == 7);\n    return 0;\n}"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn stack_items(slots: []u32, count: u32, max: u32) u32 {\n    _ = slots;\n    _ = count;\n    _ = max;\n    return 0;\n}\n",
        "solution": "const std = @import(\"std\");\nfn stack_items(slots: []u32, count: u32, max: u32) u32 {\n    var left = count;\n    for (0..2) |pass| {\n        for (slots) |*slot| {\n            if ((slot.* == 0) != (pass == 1)) continue;\n            const amount = @min(left, max - slot.*);\n            slot.* += amount;\n            left -= amount;\n        }\n    }\n    return left;\n}\n",
        "tests": "test \"mechanic edge cases\" {\n    var s = [_]u32{ 3, 0, 4 };\n    try std.testing.expectEqual(@as(u32, 0), stack_items(&s, 5, 5));\n    try std.testing.expectEqualSlices(u32, &.{ 5, 2, 5 }, &s);\n    var full = [_]u32{5};\n    try std.testing.expectEqual(@as(u32, 3), stack_items(&full, 3, 5));\n    var e = [_]u32{ 0, 2, 0 };\n    try std.testing.expectEqual(@as(u32, 0), stack_items(&e, 5, 4));\n    try std.testing.expectEqualSlices(u32, &.{ 3, 4, 0 }, &e);\n    try std.testing.expectEqual(@as(u32, 0), stack_items(&e, 0, 4));\n    try std.testing.expectEqual(@as(u32, 7), stack_items(e[0..0], 7, 4));\n}\n"
      }
    },
    "hints": [
      "Existing partial stacks have priority over empty slots.",
      "Use two passes: fill nonempty stacks first, then empty slots, reducing the remaining count.",
      "Mutate only the borrowed slots; return leftover items. Empty/full inventories and zero count matter."
    ],
    "explanation": "Each pass transfers the smaller of available stack capacity and remaining items. Two passes preserve the stated stacking priority.",
    "difficulty": 2,
    "topics": [
      "collections",
      "arrays"
    ],
    "prereqs": [
      "exercism-accumulate"
    ],
    "examples": [
      {
        "input": "slots=[3,0,4], add=5, max=5",
        "output": "slots=[5,2,5], leftover=0"
      },
      {
        "input": "slots=[5], add=3, max=5",
        "output": "slots=[5], leftover=3"
      }
    ]
  },
  {
    "id": "waves",
    "title": "Wave scheduling",
    "prompt": "Write count spawn times into out: start + index * interval. For a negative interval return false without writing. count zero succeeds.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-core-loop",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool spawn_times(double *out, size_t count, double start, double interval) {\n    return false;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool spawn_times(double *out, size_t count, double start, double interval) {\n    if (interval < 0)\n        return false;\n    for (size_t i = 0; i < count; i++)\n        out[i] = start + (double)i * interval;\n    return true;\n}",
        "tests": "int main(void) {\n    double out[4] = {0};\n    assert(spawn_times(out, 4, 2, .5));\n    assert(out[0] == 2 && out[3] == 3.5);\n    assert(!spawn_times(out, 4, 2, -1));\n    assert(spawn_times(out, 0, 0, 0));\n    double unchanged[] = {9, 8};\n    assert(!spawn_times(unchanged, 2, 0, -1));\n    assert(unchanged[0] == 9 && unchanged[1] == 8);\n    assert(spawn_times(unchanged, 2, 3, 0));\n    assert(unchanged[0] == 3 && unchanged[1] == 3);\n    return 0;\n}"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool spawn_times(double *out, size_t count, double start, double interval) {\n    return false;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool spawn_times(double *out, size_t count, double start, double interval) {\n    if (interval < 0)\n        return false;\n    for (size_t i = 0; i < count; i++)\n        out[i] = start + (double)i * interval;\n    return true;\n}",
        "tests": "int main(void) {\n    double out[4] = {0};\n    assert(spawn_times(out, 4, 2, .5));\n    assert(out[0] == 2 && out[3] == 3.5);\n    assert(!spawn_times(out, 4, 2, -1));\n    assert(spawn_times(out, 0, 0, 0));\n    double unchanged[] = {9, 8};\n    assert(!spawn_times(unchanged, 2, 0, -1));\n    assert(unchanged[0] == 9 && unchanged[1] == 8);\n    assert(spawn_times(unchanged, 2, 3, 0));\n    assert(unchanged[0] == 3 && unchanged[1] == 3);\n    return 0;\n}"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn spawn_times(out: []f64, start: f64, interval: f64) bool {\n    _ = out;\n    _ = start;\n    _ = interval;\n    return false;\n}\n",
        "solution": "const std = @import(\"std\");\nfn spawn_times(out: []f64, start: f64, interval: f64) bool {\n    if (interval < 0) return false;\n    for (out, 0..) |*v, i| v.* = start + @as(f64, @floatFromInt(i)) * interval;\n    return true;\n}\n",
        "tests": "test \"mechanic edge cases\" {\n    var out = [_]f64{ 0, 0, 0, 0 };\n    try std.testing.expect(spawn_times(&out, 2, 0.5));\n    try std.testing.expectEqual(@as(f64, 3.5), out[3]);\n    try std.testing.expect(!spawn_times(&out, 2, -1));\n    try std.testing.expect(spawn_times(out[0..0], 0, 0));\n    var unchanged = [_]f64{ 9, 8 };\n    try std.testing.expect(!spawn_times(&unchanged, 0, -1));\n    try std.testing.expectEqualSlices(f64, &.{ 9, 8 }, &unchanged);\n    try std.testing.expect(spawn_times(&unchanged, 3, 0));\n    try std.testing.expectEqualSlices(f64, &.{ 3, 3 }, &unchanged);\n}\n"
      }
    },
    "hints": [
      "Spawn times form an arithmetic progression on a timeline.",
      "Write start + index*interval into each output position.",
      "Negative interval fails without writing; zero count succeeds for a valid interval; zero interval spawns together."
    ],
    "explanation": "The output index supplies the offset directly, so there is no cumulative frame or rounding drift from repeatedly adding a delta.",
    "difficulty": 2,
    "topics": [
      "time",
      "simulation"
    ],
    "prereqs": [
      "cooldown"
    ],
    "examples": [
      {
        "input": "start=2, interval=0.5, count=4",
        "output": "[2,2.5,3,3.5]"
      },
      {
        "input": "out=[9,8], interval=-1",
        "output": "false; out remains [9,8]"
      }
    ]
  },
  {
    "id": "animation",
    "title": "Animation state transitions",
    "prompt": "Return 0=dead (health≤0), 1=hurt, 2=jump (not grounded), 3=run (absolute speed>0.1), otherwise 4=idle, in that priority.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "px-anim",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nint animation_state(int health, bool hit, bool grounded, double speed) { return 0; }",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nint animation_state(int health, bool hit, bool grounded, double speed) {\n    return health <= 0 ? 0 : hit ? 1 : !grounded ? 2 : fabs(speed) > .1 ? 3 : 4;\n}",
        "tests": "int main(void) {\n    assert(animation_state(0, true, false, 10) == 0);\n    assert(animation_state(10, true, false, 10) == 1);\n    assert(animation_state(10, false, false, 0) == 2);\n    assert(animation_state(10, false, true, -2) == 3);\n    assert(animation_state(10, false, true, .1) == 4);\n    assert(animation_state(-1, false, true, 0) == 0);\n    assert(animation_state(1, false, true, 0) == 4);\n    assert(animation_state(1, false, true, .1001) == 3);\n    return 0;\n}"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nint animation_state(int health, bool hit, bool grounded, double speed) { return 0; }",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nint animation_state(int health, bool hit, bool grounded, double speed) {\n    return health <= 0 ? 0 : hit ? 1 : !grounded ? 2 : fabs(speed) > .1 ? 3 : 4;\n}",
        "tests": "int main(void) {\n    assert(animation_state(0, true, false, 10) == 0);\n    assert(animation_state(10, true, false, 10) == 1);\n    assert(animation_state(10, false, false, 0) == 2);\n    assert(animation_state(10, false, true, -2) == 3);\n    assert(animation_state(10, false, true, .1) == 4);\n    assert(animation_state(-1, false, true, 0) == 0);\n    assert(animation_state(1, false, true, 0) == 4);\n    assert(animation_state(1, false, true, .1001) == 3);\n    return 0;\n}"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn animation_state(health: i32, hit: bool, grounded: bool, speed: f64) i32 {\n    _ = health;\n    _ = hit;\n    _ = grounded;\n    _ = speed;\n    return 0;\n}\n",
        "solution": "const std = @import(\"std\");\nfn animation_state(health: i32, hit: bool, grounded: bool, speed: f64) i32 {\n    return if (health <= 0) 0 else if (hit) 1 else if (!grounded) 2 else if (@abs(speed) > 0.1) 3 else 4;\n}\n",
        "tests": "test \"mechanic edge cases\" {\n    try std.testing.expectEqual(@as(i32, 0), animation_state(0, true, false, 10));\n    try std.testing.expectEqual(@as(i32, 1), animation_state(10, true, false, 10));\n    try std.testing.expectEqual(@as(i32, 2), animation_state(10, false, false, 0));\n    try std.testing.expectEqual(@as(i32, 3), animation_state(10, false, true, -2));\n    try std.testing.expectEqual(@as(i32, 4), animation_state(10, false, true, 0.1));\n    try std.testing.expectEqual(@as(i32, 0), animation_state(-1, false, true, 0));\n    try std.testing.expectEqual(@as(i32, 4), animation_state(1, false, true, 0));\n    try std.testing.expectEqual(@as(i32, 3), animation_state(1, false, true, 0.1001));\n}\n"
      }
    },
    "hints": [
      "Several conditions can be true, but one state wins by priority.",
      "Evaluate dead, hurt, airborne, running and idle in that order.",
      "Health≤0 wins over hit; the running threshold is strict abs(speed)>0.1."
    ],
    "explanation": "Ordered branches encode a priority table. Keeping this table separate from sprite playback avoids inconsistent transitions.",
    "difficulty": 2,
    "topics": [
      "state",
      "simulation"
    ],
    "prereqs": [
      "cooldown"
    ],
    "examples": [
      {
        "input": "health=0, hit=true, airborne, speed=10",
        "output": "0 (dead)"
      },
      {
        "input": "health=10, no hit, grounded, speed=0.1",
        "output": "4 (idle)"
      }
    ]
  },
  {
    "id": "tile-collision",
    "title": "Tile collision queries",
    "prompt": "Query solid tiles in an arbitrary rows × columns grid of row-major bytes (nonzero means solid). Tiles have side length size and the grid begins at (0,0). Write overlapping tile coordinates in row-major order, up to the output capacity, and return the total match count. Edge touching is not overlap. Empty grids, nonpositive rectangle dimensions or tile size, invalid grid dimensions, and nonfinite geometry return zero without writing.",
    "hint": "Compare strict rectangle bounds against each solid tile. Keep the total count separate from the number of coordinates that fit in the caller’s output buffer.",
    "lesson": "gd-collision",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdlib.h>\ntypedef struct {\n    size_t row, col;\n} Tile;\n/* Grid and output remain caller-owned. solid has cell_count bytes, and\n   out has capacity Tile entries (may be NULL when capacity is zero).\n   Return every match's count, writing only the first capacity coordinates. */\nsize_t solid_tiles(const unsigned char *solid, size_t cell_count, size_t rows,\n                   size_t cols, double x, double y, double w, double h, double size,\n                   Tile *out, size_t capacity) {\n    (void)solid;\n    (void)cell_count;\n    (void)rows;\n    (void)cols;\n    (void)x;\n    (void)y;\n    (void)w;\n    (void)h;\n    (void)size;\n    (void)out;\n    (void)capacity;\n    abort(); /* TODO */\n}\n",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdlib.h>\ntypedef struct {\n    size_t row, col;\n} Tile;\n/* Grid and output remain caller-owned. solid has cell_count bytes, and\n   out has capacity Tile entries (may be NULL when capacity is zero).\n   Return every match's count, writing only the first capacity coordinates. */\nsize_t solid_tiles(const unsigned char *solid, size_t cell_count, size_t rows,\n                   size_t cols, double x, double y, double w, double h, double size,\n                   Tile *out, size_t capacity) {\n    if (cols == 0 || rows == 0 || rows > SIZE_MAX / cols || rows * cols != cell_count ||\n        solid == NULL || w <= 0 || h <= 0 || size <= 0 || !isfinite(x) ||\n        !isfinite(y) || !isfinite(w) || !isfinite(h) || !isfinite(size))\n        return 0;\n    size_t matches = 0;\n    for (size_t row = 0; row < rows; ++row) {\n        for (size_t col = 0; col < cols; ++col) {\n            double tx = (double)col * size, ty = (double)row * size;\n            if (solid[row * cols + col] && x < tx + size && x + w > tx &&\n                y < ty + size && y + h > ty) {\n                if (matches < capacity) {\n                    out[matches].row = row;\n                    out[matches].col = col;\n                }\n                ++matches;\n            }\n        }\n    }\n    return matches;\n}\n",
        "tests": "static void tile_is(Tile tile, size_t row, size_t col) {\n    assert(tile.row == row && tile.col == col);\n}\nint main(void) {\n    Tile out[75];\n    const unsigned char small[] = {1, 1, 0, 1};\n    assert(solid_tiles(small, 4, 2, 2, 0, 0, 16, 16, 16, out, 75) == 1);\n    tile_is(out[0], 0, 0);\n    assert(solid_tiles(small, 4, 2, 2, 15, 15, 2, 2, 16, out, 75) == 3);\n    tile_is(out[0], 0, 0);\n    tile_is(out[1], 0, 1);\n    tile_is(out[2], 1, 1);\n    assert(solid_tiles(small, 4, 2, 2, -16, 0, 16, 16, 16, out, 75) == 0);\n    const unsigned char grid[] = {1, 0, 7, 0, 0, 1, 0, 1, 1, 0, 0, 1};\n    assert(solid_tiles(grid, 12, 3, 4, 0, 0, 64, 48, 16, out, 75) == 6);\n    tile_is(out[0], 0, 0);\n    tile_is(out[1], 0, 2);\n    tile_is(out[2], 1, 1);\n    tile_is(out[3], 1, 3);\n    tile_is(out[4], 2, 0);\n    tile_is(out[5], 2, 3);\n    assert(solid_tiles(grid, 12, 3, 4, 16, 0, 16, 48, 16, out, 75) == 1);\n    tile_is(out[0], 1, 1);\n    out[2].row = 999;\n    out[2].col = 999;\n    assert(solid_tiles(grid, 12, 3, 4, 0, 0, 64, 48, 16, out, 2) == 6);\n    tile_is(out[0], 0, 0);\n    tile_is(out[1], 0, 2);\n    tile_is(out[2], 999, 999);\n    assert(solid_tiles(grid, 12, 3, 4, 0, 0, 64, 48, 16, NULL, 0) == 6);\n    unsigned char large[72];\n    for (size_t i = 0; i < 72; i++)\n        large[i] = 1;\n    assert(solid_tiles(large, 72, 8, 9, -10, -10, 200, 200, 1, out, 75) == 72);\n    tile_is(out[71], 7, 8);\n    assert(solid_tiles(large, 72, 8, 9, -1, -1, 1, 1, 1, out, 75) == 0);\n    assert(solid_tiles(large, 72, 8, 9, -0.5, -0.5, 1, 1, 1, out, 75) == 1);\n    tile_is(out[0], 0, 0);\n    out[0].row = 999;\n    out[0].col = 999;\n    assert(solid_tiles(NULL, 0, 0, 0, 0, 0, 1, 1, 1, out, 75) == 0);\n    assert(solid_tiles(grid, 11, 3, 4, 0, 0, 1, 1, 1, out, 75) == 0);\n    assert(solid_tiles(grid, 12, 3, 4, 0, 0, 0, 1, 1, out, 75) == 0);\n    assert(solid_tiles(grid, 12, 3, 4, 0, 0, 1, -1, 1, out, 75) == 0);\n    assert(solid_tiles(grid, 12, 3, 4, 0, 0, 1, 1, 0, out, 75) == 0);\n    assert(solid_tiles(grid, 12, 3, 4, NAN, 0, 1, 1, 1, out, 75) == 0);\n    tile_is(out[0], 999, 999);\n    return 0;\n}\n"
      },
      "cpp": {
        "starter": "#include <cassert>\n#include <cmath>\n#include <cstddef>\n#include <cstdint>\n#include <limits>\n#include <span>\n#include <stdexcept>\nusing std::size_t;\nstruct Tile {\n    size_t row, col;\n};\n// Both spans are borrowed. Return all matches, writing only those that fit out.\nsize_t solid_tiles(std::span<const unsigned char> solid, size_t rows, size_t cols,\n                   double x, double y, double w, double h, double size,\n                   std::span<Tile> out) {\n    (void)solid;\n    (void)rows;\n    (void)cols;\n    (void)x;\n    (void)y;\n    (void)w;\n    (void)h;\n    (void)size;\n    (void)out;\n    throw std::logic_error(\"TODO: query tile overlaps\");\n}\n",
        "solution": "#include <cassert>\n#include <cmath>\n#include <cstddef>\n#include <cstdint>\n#include <limits>\n#include <span>\n#include <stdexcept>\nusing std::size_t;\nstruct Tile {\n    size_t row, col;\n};\n// Both spans are borrowed. Return all matches, writing only those that fit out.\nsize_t solid_tiles(std::span<const unsigned char> solid, size_t rows, size_t cols,\n                   double x, double y, double w, double h, double size,\n                   std::span<Tile> out) {\n    if (cols == 0 || rows == 0 || rows > std::numeric_limits<size_t>::max() / cols ||\n        rows * cols != solid.size() || w <= 0 || h <= 0 || size <= 0 ||\n        !std::isfinite(x) || !std::isfinite(y) || !std::isfinite(w) ||\n        !std::isfinite(h) || !std::isfinite(size))\n        return 0;\n    size_t matches = 0;\n    for (size_t row = 0; row < rows; ++row) {\n        for (size_t col = 0; col < cols; ++col) {\n            double tx = (double)col * size, ty = (double)row * size;\n            if (solid[row * cols + col] && x < tx + size && x + w > tx &&\n                y < ty + size && y + h > ty) {\n                if (matches < out.size()) {\n                    out[matches].row = row;\n                    out[matches].col = col;\n                }\n                ++matches;\n            }\n        }\n    }\n    return matches;\n}\n",
        "tests": "static void tile_is(Tile tile, size_t row, size_t col) {\n    assert(tile.row == row && tile.col == col);\n}\nint main(void) {\n    Tile out[75];\n    const unsigned char small[] = {1, 1, 0, 1};\n    assert(solid_tiles(small, 2, 2, 0, 0, 16, 16, 16, out) == 1);\n    tile_is(out[0], 0, 0);\n    assert(solid_tiles(small, 2, 2, 15, 15, 2, 2, 16, out) == 3);\n    tile_is(out[0], 0, 0);\n    tile_is(out[1], 0, 1);\n    tile_is(out[2], 1, 1);\n    assert(solid_tiles(small, 2, 2, -16, 0, 16, 16, 16, out) == 0);\n    const unsigned char grid[] = {1, 0, 7, 0, 0, 1, 0, 1, 1, 0, 0, 1};\n    assert(solid_tiles(grid, 3, 4, 0, 0, 64, 48, 16, out) == 6);\n    tile_is(out[0], 0, 0);\n    tile_is(out[1], 0, 2);\n    tile_is(out[2], 1, 1);\n    tile_is(out[3], 1, 3);\n    tile_is(out[4], 2, 0);\n    tile_is(out[5], 2, 3);\n    assert(solid_tiles(grid, 3, 4, 16, 0, 16, 48, 16, out) == 1);\n    tile_is(out[0], 1, 1);\n    out[2].row = 999;\n    out[2].col = 999;\n    assert(solid_tiles(grid, 3, 4, 0, 0, 64, 48, 16, std::span<Tile>{out, 2}) == 6);\n    tile_is(out[0], 0, 0);\n    tile_is(out[1], 0, 2);\n    tile_is(out[2], 999, 999);\n    assert(solid_tiles(grid, 3, 4, 0, 0, 64, 48, 16, {}) == 6);\n    unsigned char large[72];\n    for (size_t i = 0; i < 72; i++)\n        large[i] = 1;\n    assert(solid_tiles(large, 8, 9, -10, -10, 200, 200, 1, out) == 72);\n    tile_is(out[71], 7, 8);\n    assert(solid_tiles(large, 8, 9, -1, -1, 1, 1, 1, out) == 0);\n    assert(solid_tiles(large, 8, 9, -0.5, -0.5, 1, 1, 1, out) == 1);\n    tile_is(out[0], 0, 0);\n    out[0].row = 999;\n    out[0].col = 999;\n    assert(solid_tiles({}, 0, 0, 0, 0, 1, 1, 1, out) == 0);\n    assert(solid_tiles(std::span<const unsigned char>{grid, 11}, 3, 4, 0, 0, 1, 1, 1,\n                       out) == 0);\n    assert(solid_tiles(grid, 3, 4, 0, 0, 0, 1, 1, out) == 0);\n    assert(solid_tiles(grid, 3, 4, 0, 0, 1, -1, 1, out) == 0);\n    assert(solid_tiles(grid, 3, 4, 0, 0, 1, 1, 0, out) == 0);\n    assert(solid_tiles(grid, 3, 4, std::numeric_limits<double>::quiet_NaN(), 0, 1, 1, 1,\n                       out) == 0);\n    tile_is(out[0], 999, 999);\n    return 0;\n}\n"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nconst Tile = struct { row: usize, col: usize };\n// Both slices are borrowed. Return all matches and write the first out.len.\nfn solid_tiles(solid: []const u8, rows: usize, cols: usize, x: f64, y: f64, w: f64, h: f64, size: f64, out: []Tile) usize {\n    _ = solid;\n    _ = rows;\n    _ = cols;\n    _ = x;\n    _ = y;\n    _ = w;\n    _ = h;\n    _ = size;\n    _ = out;\n    @panic(\"TODO: query tile overlaps\");\n}\n",
        "solution": "const std = @import(\"std\");\nconst Tile = struct { row: usize, col: usize };\n// Both slices are borrowed. Return all matches and write the first out.len.\nfn solid_tiles(solid: []const u8, rows: usize, cols: usize, x: f64, y: f64, w: f64, h: f64, size: f64, out: []Tile) usize {\n    const cells = @mulWithOverflow(rows, cols);\n    if (rows == 0 or cols == 0 or cells[1] != 0 or cells[0] != solid.len or w <= 0 or h <= 0 or size <= 0 or\n        !std.math.isFinite(x) or !std.math.isFinite(y) or !std.math.isFinite(w) or !std.math.isFinite(h) or !std.math.isFinite(size)) return 0;\n    var matches: usize = 0;\n    for (0..rows) |row| {\n        for (0..cols) |col| {\n            const tx = @as(f64, @floatFromInt(col)) * size;\n            const ty = @as(f64, @floatFromInt(row)) * size;\n            if (solid[row * cols + col] != 0 and x < tx + size and x + w > tx and y < ty + size and y + h > ty) {\n                if (matches < out.len) out[matches] = .{ .row = row, .col = col };\n                matches += 1;\n            }\n        }\n    }\n    return matches;\n}\n",
        "tests": "fn tile_is(tile: Tile, row: usize, col: usize) !void {\n    try std.testing.expectEqualDeep(Tile{ .row = row, .col = col }, tile);\n}\ntest \"arbitrary grids, exact bounds, row order and bounded output\" {\n    var out: [75]Tile = undefined;\n    const small = [_]u8{ 1, 1, 0, 1 };\n    try std.testing.expectEqual(@as(usize, 1), solid_tiles(&small, 2, 2, 0, 0, 16, 16, 16, &out));\n    try tile_is(out[0], 0, 0);\n    try std.testing.expectEqual(@as(usize, 3), solid_tiles(&small, 2, 2, 15, 15, 2, 2, 16, &out));\n    try tile_is(out[0], 0, 0);\n    try tile_is(out[1], 0, 1);\n    try tile_is(out[2], 1, 1);\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(&small, 2, 2, -16, 0, 16, 16, 16, &out));\n    const grid = [_]u8{ 1, 0, 7, 0, 0, 1, 0, 1, 1, 0, 0, 1 };\n    try std.testing.expectEqual(@as(usize, 6), solid_tiles(&grid, 3, 4, 0, 0, 64, 48, 16, &out));\n    try tile_is(out[0], 0, 0);\n    try tile_is(out[1], 0, 2);\n    try tile_is(out[2], 1, 1);\n    try tile_is(out[3], 1, 3);\n    try tile_is(out[4], 2, 0);\n    try tile_is(out[5], 2, 3);\n    try std.testing.expectEqual(@as(usize, 1), solid_tiles(&grid, 3, 4, 16, 0, 16, 48, 16, &out));\n    try tile_is(out[0], 1, 1);\n    out[2] = .{ .row = 999, .col = 999 };\n    try std.testing.expectEqual(@as(usize, 6), solid_tiles(&grid, 3, 4, 0, 0, 64, 48, 16, out[0..2]));\n    try tile_is(out[0], 0, 0);\n    try tile_is(out[1], 0, 2);\n    try tile_is(out[2], 999, 999);\n    try std.testing.expectEqual(@as(usize, 6), solid_tiles(&grid, 3, 4, 0, 0, 64, 48, 16, out[0..0]));\n    const large: [72]u8 = @splat(1);\n    try std.testing.expectEqual(@as(usize, 72), solid_tiles(&large, 8, 9, -10, -10, 200, 200, 1, &out));\n    try tile_is(out[71], 7, 8);\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(&large, 8, 9, -1, -1, 1, 1, 1, &out));\n    try std.testing.expectEqual(@as(usize, 1), solid_tiles(&large, 8, 9, -0.5, -0.5, 1, 1, 1, &out));\n    try tile_is(out[0], 0, 0);\n    out[0] = .{ .row = 999, .col = 999 };\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(&.{}, 0, 0, 0, 0, 1, 1, 1, &out));\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(grid[0..11], 3, 4, 0, 0, 1, 1, 1, &out));\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(&grid, 3, 4, 0, 0, 0, 1, 1, &out));\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(&grid, 3, 4, 0, 0, 1, -1, 1, &out));\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(&grid, 3, 4, 0, 0, 1, 1, 0, &out));\n    try std.testing.expectEqual(@as(usize, 0), solid_tiles(&grid, 3, 4, std.math.nan(f64), 0, 1, 1, 1, &out));\n    try tile_is(out[0], 999, 999);\n}\n"
      }
    },
    "hints": [
      "Touching an edge has zero overlap area, even if coordinates are equal.",
      "For every solid tile compare strict rectangle bounds, count every match and write only those that fit.",
      "Return total matches, independent of output capacity. Inputs/output are borrowed; invalid geometry writes nothing."
    ],
    "explanation": "Strict rectangle comparisons find overlapping solid cells. Coordinates are returned in row-major order, with counting separated from bounded output writes.",
    "difficulty": 3,
    "topics": [
      "grids",
      "arrays"
    ],
    "prereqs": [
      "movement"
    ],
    "examples": [
      {
        "input": "2×2 solids=[1,1,0,1], rect=(15,15,2,2), tile size=16",
        "output": "3 matches: (0,0),(0,1),(1,1)"
      },
      {
        "input": "rect=(-16,0,16,16), tile size=16",
        "output": "0: edge touching is not overlap"
      }
    ]
  },
  {
    "id": "jump-buffer",
    "title": "Consume a buffered jump",
    "prompt": "Return true if a press is unconsumed, both ages are nonnegative, press_age≤buffer and grounded_age≤coyote. Ages are seconds.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "phy-controllers",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer,\n              double coyote) {\n    return false;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer,\n              double coyote) {\n    return !consumed && press_age >= 0 && grounded_age >= 0 && press_age <= buffer &&\n           grounded_age <= coyote;\n}",
        "tests": "int main(void) {\n    assert(can_jump(.05, .05, false, .1, .1));\n    assert(can_jump(.1, .1, false, .1, .1));\n    assert(!can_jump(0, 0, true, .1, .1));\n    assert(!can_jump(-1, 0, false, .1, .1));\n    assert(!can_jump(.2, 0, false, .1, .1));\n    assert(!can_jump(0, -1, false, .1, .1));\n    assert(!can_jump(0, .2, false, .1, .1));\n    assert(can_jump(.1, .1, false, .1, .1));\n    return 0;\n}"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer,\n              double coyote) {\n    return false;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer,\n              double coyote) {\n    return !consumed && press_age >= 0 && grounded_age >= 0 && press_age <= buffer &&\n           grounded_age <= coyote;\n}",
        "tests": "int main(void) {\n    assert(can_jump(.05, .05, false, .1, .1));\n    assert(can_jump(.1, .1, false, .1, .1));\n    assert(!can_jump(0, 0, true, .1, .1));\n    assert(!can_jump(-1, 0, false, .1, .1));\n    assert(!can_jump(.2, 0, false, .1, .1));\n    assert(!can_jump(0, -1, false, .1, .1));\n    assert(!can_jump(0, .2, false, .1, .1));\n    assert(can_jump(.1, .1, false, .1, .1));\n    return 0;\n}"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn can_jump(press_age: f64, grounded_age: f64, consumed: bool, buffer: f64, coyote: f64) bool {\n    _ = press_age;\n    _ = grounded_age;\n    _ = consumed;\n    _ = buffer;\n    _ = coyote;\n    return false;\n}\n",
        "solution": "const std = @import(\"std\");\nfn can_jump(press_age: f64, grounded_age: f64, consumed: bool, buffer: f64, coyote: f64) bool {\n    return !consumed and press_age >= 0 and grounded_age >= 0 and press_age <= buffer and grounded_age <= coyote;\n}\n",
        "tests": "test \"mechanic edge cases\" {\n    try std.testing.expect(can_jump(0.05, 0.05, false, 0.1, 0.1));\n    try std.testing.expect(!can_jump(0, 0, true, 0.1, 0.1));\n    try std.testing.expect(!can_jump(-1, 0, false, 0.1, 0.1));\n    try std.testing.expect(!can_jump(0.2, 0, false, 0.1, 0.1));\n    try std.testing.expect(!can_jump(0, -1, false, 0.1, 0.1));\n    try std.testing.expect(!can_jump(0, 0.2, false, 0.1, 0.1));\n    try std.testing.expect(can_jump(0.1, 0.1, false, 0.1, 0.1));\n}\n"
      }
    },
    "hints": [
      "A press can be remembered briefly, and recent ground contact can remain eligible briefly.",
      "Require an unconsumed press with both nonnegative ages inside their inclusive time windows.",
      "Return eligibility only; the caller consumes a successful press. Both exact window boundaries are accepted."
    ],
    "explanation": "The conjunction checks input lifetime and coyote time independently. The consumed flag prevents one press from triggering multiple jumps.",
    "difficulty": 3,
    "topics": [
      "state",
      "time"
    ],
    "prereqs": [
      "cooldown",
      "movement"
    ],
    "examples": [
      {
        "input": "press_age=0.1, grounded_age=0.1, windows=0.1, consumed=false",
        "output": "true"
      },
      {
        "input": "same ages, consumed=true",
        "output": "false"
      }
    ]
  },
  {
    "id": "movement",
    "title": "Acceleration and braking",
    "prompt": "Approach target by at most acceleration*dt without overshooting. Inputs use pixels and seconds, acceleration and dt are nonnegative.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-vectors",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble approach_velocity(double current, double target, double acceleration,\n                         double dt) {\n    return 0;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble approach_velocity(double current, double target, double acceleration,\n                         double dt) {\n    double change = acceleration * dt;\n    return current < target ? fmin(target, current + change)\n                            : fmax(target, current - change);\n}",
        "tests": "int main(void) {\n    assert(approach_velocity(0, 100, 200, .1) == 20);\n    assert(approach_velocity(90, 100, 200, .1) == 100);\n    assert(approach_velocity(-100, 0, 200, .1) == -80);\n    assert(approach_velocity(10, -100, 200, .1) == -10);\n    assert(approach_velocity(10, -100, 200, .1) == -10);\n    assert(approach_velocity(10, 10, 200, .1) == 10);\n    assert(approach_velocity(10, 0, 200, 0) == 10);\n    assert(approach_velocity(10, 0, 0, 1) == 10);\n    return 0;\n}"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble approach_velocity(double current, double target, double acceleration,\n                         double dt) {\n    return 0;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble approach_velocity(double current, double target, double acceleration,\n                         double dt) {\n    double change = acceleration * dt;\n    return current < target ? fmin(target, current + change)\n                            : fmax(target, current - change);\n}",
        "tests": "int main(void) {\n    assert(approach_velocity(0, 100, 200, .1) == 20);\n    assert(approach_velocity(90, 100, 200, .1) == 100);\n    assert(approach_velocity(-100, 0, 200, .1) == -80);\n    assert(approach_velocity(10, -100, 200, .1) == -10);\n    assert(approach_velocity(10, -100, 200, .1) == -10);\n    assert(approach_velocity(10, 10, 200, .1) == 10);\n    assert(approach_velocity(10, 0, 200, 0) == 10);\n    assert(approach_velocity(10, 0, 0, 1) == 10);\n    return 0;\n}"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn approach_velocity(current: f64, target: f64, acceleration: f64, dt: f64) f64 {\n    _ = current;\n    _ = target;\n    _ = acceleration;\n    _ = dt;\n    return 0;\n}\n",
        "solution": "const std = @import(\"std\");\nfn approach_velocity(current: f64, target: f64, acceleration: f64, dt: f64) f64 {\n    const change = acceleration * dt;\n    return if (current < target) @min(target, current + change) else @max(target, current - change);\n}\n",
        "tests": "test \"mechanic edge cases\" {\n    try std.testing.expectEqual(@as(f64, 20), approach_velocity(0, 100, 200, 0.1));\n    try std.testing.expectEqual(@as(f64, 100), approach_velocity(90, 100, 200, 0.1));\n    try std.testing.expectEqual(@as(f64, -80), approach_velocity(-100, 0, 200, 0.1));\n    try std.testing.expectEqual(@as(f64, -10), approach_velocity(10, -100, 200, 0.1));\n    try std.testing.expectEqual(@as(f64, 10), approach_velocity(10, 10, 200, 0.1));\n    try std.testing.expectEqual(@as(f64, 10), approach_velocity(10, 0, 200, 0));\n    try std.testing.expectEqual(@as(f64, 10), approach_velocity(10, 0, 0, 1));\n}\n"
      }
    },
    "hints": [
      "Acceleration limits how far velocity can move toward its target per elapsed second.",
      "Compute acceleration*dt, move in the target direction and clamp before overshooting.",
      "Use signed velocities. Equal current/target, zero acceleration and zero dt leave the velocity unchanged."
    ],
    "explanation": "A bounded approach changes speed smoothly while the min/max clamp prevents overshooting when close to the target.",
    "difficulty": 2,
    "topics": [
      "math",
      "simulation"
    ],
    "prereqs": [
      "cooldown"
    ],
    "examples": [
      {
        "input": "current=0, target=100, acceleration=200, dt=0.1",
        "output": "20"
      },
      {
        "input": "current=90, target=100, acceleration=200, dt=0.1",
        "output": "100"
      },
      {
        "input": "current=10, target=-100, acceleration=200, dt=0.1",
        "output": "-10"
      }
    ]
  },
  {
    "id": "camera",
    "title": "Frame-independent camera smoothing",
    "prompt": "Return current+(target-current)*(1-exp(-rate*dt)). Splitting a duration into steps must preserve the result.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-camera",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble smooth_camera(double current, double target, double rate, double dt) {\n    return 0;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble smooth_camera(double current, double target, double rate, double dt) {\n    return current + (target - current) * (1 - exp(-rate * dt));\n}",
        "tests": "int main(void) {\n    assert(smooth_camera(0, 100, 0, 1) == 0);\n    assert(fabs(smooth_camera(0, 100, 2, .5) - 63.212055882855765) < 1e-6);\n    double half = smooth_camera(0, 100, 2, .25);\n    assert(fabs(smooth_camera(half, 100, 2, .25) - smooth_camera(0, 100, 2, .5)) <\n           1e-6);\n    assert(smooth_camera(10, 20, 2, 0) == 10);\n    assert(smooth_camera(10, 10, 2, 1) == 10);\n    return 0;\n}"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble smooth_camera(double current, double target, double rate, double dt) {\n    return 0;\n}",
        "solution": "#include <assert.h>\n#include <math.h>\n#include <stdbool.h>\n#include <stddef.h>\ndouble smooth_camera(double current, double target, double rate, double dt) {\n    return current + (target - current) * (1 - exp(-rate * dt));\n}",
        "tests": "int main(void) {\n    assert(smooth_camera(0, 100, 0, 1) == 0);\n    assert(fabs(smooth_camera(0, 100, 2, .5) - 63.212055882855765) < 1e-6);\n    double half = smooth_camera(0, 100, 2, .25);\n    assert(fabs(smooth_camera(half, 100, 2, .25) - smooth_camera(0, 100, 2, .5)) <\n           1e-6);\n    assert(smooth_camera(10, 20, 2, 0) == 10);\n    assert(smooth_camera(10, 10, 2, 1) == 10);\n    return 0;\n}"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn smooth_camera(current: f64, target: f64, rate: f64, dt: f64) f64 {\n    _ = current;\n    _ = target;\n    _ = rate;\n    _ = dt;\n    return 0;\n}\n",
        "solution": "const std = @import(\"std\");\nfn smooth_camera(current: f64, target: f64, rate: f64, dt: f64) f64 {\n    return current + (target - current) * (1 - @exp(-rate * dt));\n}\n",
        "tests": "test \"mechanic edge cases\" {\n    try std.testing.expectApproxEqAbs(@as(f64, 63.212055882855765), smooth_camera(0, 100, 2, 0.5), 1e-6);\n    const half = smooth_camera(0, 100, 2, 0.25);\n    try std.testing.expectApproxEqAbs(smooth_camera(0, 100, 2, 0.5), smooth_camera(half, 100, 2, 0.25), 1e-6);\n    try std.testing.expectEqual(@as(f64, 10), smooth_camera(10, 20, 2, 0));\n    try std.testing.expectEqual(@as(f64, 10), smooth_camera(10, 10, 2, 1));\n    try std.testing.expectEqual(@as(f64, 0), smooth_camera(0, 100, 0, 1));\n}\n"
      }
    },
    "hints": [
      "Exponential smoothing composes over elapsed time, unlike a fixed per-frame lerp.",
      "Compute 1-exp(-rate*dt) as the interpolation factor.",
      "Zero rate or dt preserves current. Compare fractional results with tolerance; split durations should agree."
    ],
    "explanation": "The exponential decay factor multiplies over successive steps, so two half-duration updates equal one full-duration update toward a fixed target.",
    "difficulty": 3,
    "topics": [
      "math",
      "time"
    ],
    "prereqs": [
      "movement"
    ],
    "examples": [
      {
        "input": "current=0, target=100, rate=2, dt=0.5",
        "output": "≈63.21205588"
      },
      {
        "input": "two updates with dt=0.25, same target",
        "output": "same final value as dt=0.5"
      }
    ]
  }
];
