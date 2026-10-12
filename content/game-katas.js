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
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble cooldown(double remaining, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble cooldown(double remaining, double dt) { return dt < 0 ? NAN : fmax(0,remaining-dt); }",
        "tests": "int main(void) { assert(cooldown(2,.25)==1.75); assert(cooldown(.1,.2)==0); assert(isnan(cooldown(1,-1))); assert(cooldown(-2,0)==0); assert(cooldown(2,0)==2); return 0; }"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble cooldown(double remaining, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble cooldown(double remaining, double dt) { return dt < 0 ? NAN : fmax(0,remaining-dt); }",
        "tests": "int main(void) { assert(cooldown(2,.25)==1.75); assert(cooldown(.1,.2)==0); assert(isnan(cooldown(1,-1))); assert(cooldown(-2,0)==0); assert(cooldown(2,0)==2); return 0; }"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn cooldown(remaining: f64, dt: f64) f64 { _ = remaining; _ = dt; return 0; }",
        "solution": "const std = @import(\"std\");\nfn cooldown(remaining: f64, dt: f64) f64 { return if (dt < 0) std.math.nan(f64) else @max(0,remaining-dt); }",
        "tests": "test \"mechanic edge cases\" { try std.testing.expectEqual(@as(f64,1.75),cooldown(2,0.25)); try std.testing.expectEqual(@as(f64,0),cooldown(0.1,0.2)); try std.testing.expect(std.math.isNan(cooldown(1,-1))); try std.testing.expectEqual(@as(f64,0),cooldown(-2,0)); try std.testing.expectEqual(@as(f64,2),cooldown(2,0)); }"
      }
    }
  },
  {
    "id": "inventory",
    "title": "Inventory stacking",
    "prompt": "Mutate slot quantities: fill existing stacks first, then empty slots, up to max per slot. Return leftover items. Input quantities are between zero and max.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-data-saves",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) { for(int empty=0;empty<2;empty++) for(size_t i=0;i<n;i++) { if((slots[i]==0)!=empty) continue; unsigned add=count < max-slots[i] ? count : max-slots[i]; slots[i]+=add; count-=add; } return count; }",
        "tests": "int main(void) { unsigned s[]={3,0,4}; assert(stack_items(s,3,5,5)==0); assert(s[0]==5 && s[1]==2 && s[2]==5); unsigned full[]={5}; assert(stack_items(full,1,3,5)==3); assert(stack_items(full,0,2,5)==2); unsigned e[]={0,2,0}; assert(stack_items(e,3,5,4)==0); assert(e[0]==3 && e[1]==4 && e[2]==0); assert(stack_items(e,3,0,4)==0); assert(stack_items(NULL,0,7,4)==7); return 0; }"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nunsigned stack_items(unsigned *slots, size_t n, unsigned count, unsigned max) { for(int empty=0;empty<2;empty++) for(size_t i=0;i<n;i++) { if((slots[i]==0)!=empty) continue; unsigned add=count < max-slots[i] ? count : max-slots[i]; slots[i]+=add; count-=add; } return count; }",
        "tests": "int main(void) { unsigned s[]={3,0,4}; assert(stack_items(s,3,5,5)==0); assert(s[0]==5 && s[1]==2 && s[2]==5); unsigned full[]={5}; assert(stack_items(full,1,3,5)==3); assert(stack_items(full,0,2,5)==2); unsigned e[]={0,2,0}; assert(stack_items(e,3,5,4)==0); assert(e[0]==3 && e[1]==4 && e[2]==0); assert(stack_items(e,3,0,4)==0); assert(stack_items(NULL,0,7,4)==7); return 0; }"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn stack_items(slots: []u32, count: u32, max: u32) u32 { _ = slots; _ = count; _ = max; return 0; }",
        "solution": "const std = @import(\"std\");\nfn stack_items(slots: []u32, count: u32, max: u32) u32 { var left=count; for (0..2) |pass| { for (slots) |*slot| { if ((slot.*==0)!=(pass==1)) continue; const amount=@min(left,max-slot.*); slot.*+=amount; left-=amount; } } return left; }",
        "tests": "test \"mechanic edge cases\" { var s=[_]u32{3,0,4}; try std.testing.expectEqual(@as(u32,0),stack_items(&s,5,5)); try std.testing.expectEqualSlices(u32,&.{5,2,5},&s); var full=[_]u32{5}; try std.testing.expectEqual(@as(u32,3),stack_items(&full,3,5)); var e=[_]u32{0,2,0}; try std.testing.expectEqual(@as(u32,0),stack_items(&e,5,4)); try std.testing.expectEqualSlices(u32,&.{3,4,0},&e); try std.testing.expectEqual(@as(u32,0),stack_items(&e,0,4)); try std.testing.expectEqual(@as(u32,7),stack_items(e[0..0],7,4)); }"
      }
    }
  },
  {
    "id": "waves",
    "title": "Wave scheduling",
    "prompt": "Write count spawn times into out: start + index * interval. For a negative interval return false without writing. count zero succeeds.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-core-loop",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool spawn_times(double *out, size_t count, double start, double interval) { return false; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool spawn_times(double *out, size_t count, double start, double interval) { if(interval<0) return false; for(size_t i=0;i<count;i++) out[i]=start+(double)i*interval; return true; }",
        "tests": "int main(void) { double out[4]={0}; assert(spawn_times(out,4,2,.5)); assert(out[0]==2 && out[3]==3.5); assert(!spawn_times(out,4,2,-1)); assert(spawn_times(out,0,0,0)); double unchanged[]={9,8}; assert(!spawn_times(unchanged,2,0,-1)); assert(unchanged[0]==9 && unchanged[1]==8); assert(spawn_times(unchanged,2,3,0)); assert(unchanged[0]==3 && unchanged[1]==3); return 0; }"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool spawn_times(double *out, size_t count, double start, double interval) { return false; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool spawn_times(double *out, size_t count, double start, double interval) { if(interval<0) return false; for(size_t i=0;i<count;i++) out[i]=start+(double)i*interval; return true; }",
        "tests": "int main(void) { double out[4]={0}; assert(spawn_times(out,4,2,.5)); assert(out[0]==2 && out[3]==3.5); assert(!spawn_times(out,4,2,-1)); assert(spawn_times(out,0,0,0)); double unchanged[]={9,8}; assert(!spawn_times(unchanged,2,0,-1)); assert(unchanged[0]==9 && unchanged[1]==8); assert(spawn_times(unchanged,2,3,0)); assert(unchanged[0]==3 && unchanged[1]==3); return 0; }"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn spawn_times(out: []f64, start: f64, interval: f64) bool { _ = out; _ = start; _ = interval; return false; }",
        "solution": "const std = @import(\"std\");\nfn spawn_times(out: []f64, start: f64, interval: f64) bool { if(interval<0) return false; for(out,0..) |*v,i| v.*=start+@as(f64,@floatFromInt(i))*interval; return true; }",
        "tests": "test \"mechanic edge cases\" { var out=[_]f64{0,0,0,0}; try std.testing.expect(spawn_times(&out,2,0.5)); try std.testing.expectEqual(@as(f64,3.5),out[3]); try std.testing.expect(!spawn_times(&out,2,-1)); try std.testing.expect(spawn_times(out[0..0],0,0)); var unchanged=[_]f64{9,8}; try std.testing.expect(!spawn_times(&unchanged,0,-1)); try std.testing.expectEqualSlices(f64,&.{9,8},&unchanged); try std.testing.expect(spawn_times(&unchanged,3,0)); try std.testing.expectEqualSlices(f64,&.{3,3},&unchanged); }"
      }
    }
  },
  {
    "id": "animation",
    "title": "Animation state transitions",
    "prompt": "Return 0=dead (health\u22640), 1=hurt, 2=jump (not grounded), 3=run (absolute speed>0.1), otherwise 4=idle, in that priority.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "px-anim",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nint animation_state(int health, bool hit, bool grounded, double speed) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nint animation_state(int health, bool hit, bool grounded, double speed) { return health<=0?0:hit?1:!grounded?2:fabs(speed)>.1?3:4; }",
        "tests": "int main(void) { assert(animation_state(0,true,false,10)==0); assert(animation_state(10,true,false,10)==1); assert(animation_state(10,false,false,0)==2); assert(animation_state(10,false,true,-2)==3); assert(animation_state(10,false,true,.1)==4); assert(animation_state(-1,false,true,0)==0); assert(animation_state(1,false,true,0)==4); assert(animation_state(1,false,true,.1001)==3); return 0; }"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nint animation_state(int health, bool hit, bool grounded, double speed) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nint animation_state(int health, bool hit, bool grounded, double speed) { return health<=0?0:hit?1:!grounded?2:fabs(speed)>.1?3:4; }",
        "tests": "int main(void) { assert(animation_state(0,true,false,10)==0); assert(animation_state(10,true,false,10)==1); assert(animation_state(10,false,false,0)==2); assert(animation_state(10,false,true,-2)==3); assert(animation_state(10,false,true,.1)==4); assert(animation_state(-1,false,true,0)==0); assert(animation_state(1,false,true,0)==4); assert(animation_state(1,false,true,.1001)==3); return 0; }"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn animation_state(health: i32, hit: bool, grounded: bool, speed: f64) i32 { _ = health; _ = hit; _ = grounded; _ = speed; return 0; }",
        "solution": "const std = @import(\"std\");\nfn animation_state(health: i32, hit: bool, grounded: bool, speed: f64) i32 { return if(health<=0) 0 else if(hit) 1 else if(!grounded) 2 else if(@abs(speed)>0.1) 3 else 4; }",
        "tests": "test \"mechanic edge cases\" { try std.testing.expectEqual(@as(i32,0),animation_state(0,true,false,10)); try std.testing.expectEqual(@as(i32,1),animation_state(10,true,false,10)); try std.testing.expectEqual(@as(i32,2),animation_state(10,false,false,0)); try std.testing.expectEqual(@as(i32,3),animation_state(10,false,true,-2)); try std.testing.expectEqual(@as(i32,4),animation_state(10,false,true,0.1)); try std.testing.expectEqual(@as(i32,0),animation_state(-1,false,true,0)); try std.testing.expectEqual(@as(i32,4),animation_state(1,false,true,0)); try std.testing.expectEqual(@as(i32,3),animation_state(1,false,true,0.1001)); }"
      }
    }
  },
  {
    "id": "tile-collision",
    "title": "Tile collision queries",
    "prompt": "Query solid tiles in an arbitrary rows \u00d7 columns grid of row-major bytes (nonzero means solid). Tiles have side length size and the grid begins at (0,0). Write overlapping tile coordinates in row-major order, up to the output capacity, and return the total match count. Edge touching is not overlap. Empty grids, nonpositive rectangle dimensions or tile size, invalid grid dimensions, and nonfinite geometry return zero without writing.",
    "hint": "Compare strict rectangle bounds against each solid tile. Keep the total count separate from the number of coordinates that fit in the caller\u2019s output buffer.",
    "lesson": "gd-collision",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <math.h>\n#include <stdlib.h>\ntypedef struct { size_t row, col; } Tile;\n/* Grid and output remain caller-owned. solid has cell_count bytes, and\n   out has capacity Tile entries (may be NULL when capacity is zero).\n   Return every match's count, writing only the first capacity coordinates. */\nsize_t solid_tiles(const unsigned char *solid, size_t cell_count, size_t rows, size_t cols, double x, double y, double w, double h, double size, Tile *out, size_t capacity) { (void)solid; (void)cell_count; (void)rows; (void)cols; (void)x; (void)y; (void)w; (void)h; (void)size; (void)out; (void)capacity; abort(); /* TODO */ }\n",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <math.h>\n#include <stdlib.h>\ntypedef struct { size_t row, col; } Tile;\n/* Grid and output remain caller-owned. solid has cell_count bytes, and\n   out has capacity Tile entries (may be NULL when capacity is zero).\n   Return every match's count, writing only the first capacity coordinates. */\nsize_t solid_tiles(const unsigned char *solid, size_t cell_count, size_t rows, size_t cols, double x, double y, double w, double h, double size, Tile *out, size_t capacity) {\n    if (cols == 0 || rows == 0 || rows > SIZE_MAX / cols || rows * cols != cell_count || solid == NULL ||\n        w <= 0 || h <= 0 || size <= 0 || !isfinite(x) || !isfinite(y) || !isfinite(w) || !isfinite(h) || !isfinite(size)) return 0;\n    size_t matches = 0;\n    for (size_t row = 0; row < rows; ++row) {\n        for (size_t col = 0; col < cols; ++col) {\n            double tx = (double)col * size, ty = (double)row * size;\n            if (solid[row * cols + col] && x < tx + size && x + w > tx && y < ty + size && y + h > ty) {\n                if (matches < capacity) { out[matches].row = row; out[matches].col = col; }\n                ++matches;\n            }\n        }\n    }\n    return matches;\n}\n",
        "tests": "static void tile_is(Tile tile, size_t row, size_t col) { assert(tile.row == row && tile.col == col); }\nint main(void) {\n    Tile out[75];\n    const unsigned char small[] = {1,1,0,1};\n    assert(solid_tiles(small,4,2,2,0,0,16,16,16,out,75) == 1); tile_is(out[0],0,0);\n    assert(solid_tiles(small,4,2,2,15,15,2,2,16,out,75) == 3); tile_is(out[0],0,0); tile_is(out[1],0,1); tile_is(out[2],1,1);\n    assert(solid_tiles(small,4,2,2,-16,0,16,16,16,out,75) == 0);\n    const unsigned char grid[] = {1,0,7,0,0,1,0,1,1,0,0,1};\n    assert(solid_tiles(grid,12,3,4,0,0,64,48,16,out,75) == 6);\n    tile_is(out[0],0,0); tile_is(out[1],0,2); tile_is(out[2],1,1); tile_is(out[3],1,3); tile_is(out[4],2,0); tile_is(out[5],2,3);\n    assert(solid_tiles(grid,12,3,4,16,0,16,48,16,out,75) == 1); tile_is(out[0],1,1);\n    out[2].row = 999; out[2].col = 999;\n    assert(solid_tiles(grid,12,3,4,0,0,64,48,16,out,2) == 6); tile_is(out[0],0,0); tile_is(out[1],0,2); tile_is(out[2],999,999);\n    assert(solid_tiles(grid,12,3,4,0,0,64,48,16,NULL,0) == 6);\n    unsigned char large[72]; for (size_t i=0;i<72;i++) large[i]=1;\n    assert(solid_tiles(large,72,8,9,-10,-10,200,200,1,out,75) == 72); tile_is(out[71],7,8);\n    assert(solid_tiles(large,72,8,9,-1,-1,1,1,1,out,75) == 0);\n    assert(solid_tiles(large,72,8,9,-0.5,-0.5,1,1,1,out,75) == 1); tile_is(out[0],0,0);\n    out[0].row=999; out[0].col=999;\n    assert(solid_tiles(NULL,0,0,0,0,0,1,1,1,out,75) == 0);\n    assert(solid_tiles(grid,11,3,4,0,0,1,1,1,out,75) == 0);\n    assert(solid_tiles(grid,12,3,4,0,0,0,1,1,out,75) == 0);\n    assert(solid_tiles(grid,12,3,4,0,0,1,-1,1,out,75) == 0);\n    assert(solid_tiles(grid,12,3,4,0,0,1,1,0,out,75) == 0);\n    assert(solid_tiles(grid,12,3,4,NAN,0,1,1,1,out,75) == 0); tile_is(out[0],999,999);\n    return 0;\n}\n"
      },
      "cpp": {
        "starter": "#include <cassert>\n#include <cstddef>\n#include <cstdint>\n#include <cmath>\n#include <span>\n#include <limits>\n#include <stdexcept>\nusing std::size_t;\nstruct Tile { size_t row, col; };\n// Both spans are borrowed. Return all matches, writing only those that fit out.\nsize_t solid_tiles(std::span<const unsigned char> solid, size_t rows, size_t cols, double x, double y, double w, double h, double size, std::span<Tile> out) { (void)solid; (void)rows; (void)cols; (void)x; (void)y; (void)w; (void)h; (void)size; (void)out; throw std::logic_error(\"TODO: query tile overlaps\"); }\n",
        "solution": "#include <cassert>\n#include <cstddef>\n#include <cstdint>\n#include <cmath>\n#include <span>\n#include <limits>\n#include <stdexcept>\nusing std::size_t;\nstruct Tile { size_t row, col; };\n// Both spans are borrowed. Return all matches, writing only those that fit out.\nsize_t solid_tiles(std::span<const unsigned char> solid, size_t rows, size_t cols, double x, double y, double w, double h, double size, std::span<Tile> out) {\n    if (cols == 0 || rows == 0 || rows > std::numeric_limits<size_t>::max() / cols || rows * cols != solid.size() ||\n        w <= 0 || h <= 0 || size <= 0 || !std::isfinite(x) || !std::isfinite(y) || !std::isfinite(w) || !std::isfinite(h) || !std::isfinite(size)) return 0;\n    size_t matches = 0;\n    for (size_t row = 0; row < rows; ++row) {\n        for (size_t col = 0; col < cols; ++col) {\n            double tx = (double)col * size, ty = (double)row * size;\n            if (solid[row * cols + col] && x < tx + size && x + w > tx && y < ty + size && y + h > ty) {\n                if (matches < out.size()) { out[matches].row = row; out[matches].col = col; }\n                ++matches;\n            }\n        }\n    }\n    return matches;\n}\n",
        "tests": "static void tile_is(Tile tile, size_t row, size_t col) { assert(tile.row == row && tile.col == col); }\nint main(void) {\n    Tile out[75];\n    const unsigned char small[] = {1,1,0,1};\n    assert(solid_tiles(small,2,2,0,0,16,16,16,out) == 1); tile_is(out[0],0,0);\n    assert(solid_tiles(small,2,2,15,15,2,2,16,out) == 3); tile_is(out[0],0,0); tile_is(out[1],0,1); tile_is(out[2],1,1);\n    assert(solid_tiles(small,2,2,-16,0,16,16,16,out) == 0);\n    const unsigned char grid[] = {1,0,7,0,0,1,0,1,1,0,0,1};\n    assert(solid_tiles(grid,3,4,0,0,64,48,16,out) == 6);\n    tile_is(out[0],0,0); tile_is(out[1],0,2); tile_is(out[2],1,1); tile_is(out[3],1,3); tile_is(out[4],2,0); tile_is(out[5],2,3);\n    assert(solid_tiles(grid,3,4,16,0,16,48,16,out) == 1); tile_is(out[0],1,1);\n    out[2].row = 999; out[2].col = 999;\n    assert(solid_tiles(grid,3,4,0,0,64,48,16,std::span<Tile>{out,2}) == 6); tile_is(out[0],0,0); tile_is(out[1],0,2); tile_is(out[2],999,999);\n    assert(solid_tiles(grid,3,4,0,0,64,48,16,{}) == 6);\n    unsigned char large[72]; for (size_t i=0;i<72;i++) large[i]=1;\n    assert(solid_tiles(large,8,9,-10,-10,200,200,1,out) == 72); tile_is(out[71],7,8);\n    assert(solid_tiles(large,8,9,-1,-1,1,1,1,out) == 0);\n    assert(solid_tiles(large,8,9,-0.5,-0.5,1,1,1,out) == 1); tile_is(out[0],0,0);\n    out[0].row=999; out[0].col=999;\n    assert(solid_tiles({},0,0,0,0,1,1,1,out) == 0);\n    assert(solid_tiles(std::span<const unsigned char>{grid,11},3,4,0,0,1,1,1,out) == 0);\n    assert(solid_tiles(grid,3,4,0,0,0,1,1,out) == 0);\n    assert(solid_tiles(grid,3,4,0,0,1,-1,1,out) == 0);\n    assert(solid_tiles(grid,3,4,0,0,1,1,0,out) == 0);\n    assert(solid_tiles(grid,3,4,std::numeric_limits<double>::quiet_NaN(),0,1,1,1,out) == 0); tile_is(out[0],999,999);\n    return 0;\n}\n"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nconst Tile = struct { row: usize, col: usize };\n// Both slices are borrowed. Return all matches and write the first out.len.\nfn solid_tiles(solid: []const u8, rows: usize, cols: usize, x: f64, y: f64, w: f64, h: f64, size: f64, out: []Tile) usize { _ = solid; _ = rows; _ = cols; _ = x; _ = y; _ = w; _ = h; _ = size; _ = out; @panic(\"TODO: query tile overlaps\"); }\n",
        "solution": "const std = @import(\"std\");\nconst Tile = struct { row: usize, col: usize };\n// Both slices are borrowed. Return all matches and write the first out.len.\nfn solid_tiles(solid: []const u8, rows: usize, cols: usize, x: f64, y: f64, w: f64, h: f64, size: f64, out: []Tile) usize {\n    const cells = @mulWithOverflow(rows, cols);\n    if (rows == 0 or cols == 0 or cells[1] != 0 or cells[0] != solid.len or w <= 0 or h <= 0 or size <= 0 or\n        !std.math.isFinite(x) or !std.math.isFinite(y) or !std.math.isFinite(w) or !std.math.isFinite(h) or !std.math.isFinite(size)) return 0;\n    var matches: usize = 0;\n    for (0..rows) |row| {\n        for (0..cols) |col| {\n            const tx = @as(f64, @floatFromInt(col)) * size;\n            const ty = @as(f64, @floatFromInt(row)) * size;\n            if (solid[row * cols + col] != 0 and x < tx + size and x + w > tx and y < ty + size and y + h > ty) {\n                if (matches < out.len) out[matches] = .{ .row = row, .col = col };\n                matches += 1;\n            }\n        }\n    }\n    return matches;\n}\n",
        "tests": "fn tile_is(tile: Tile, row: usize, col: usize) !void { try std.testing.expectEqualDeep(Tile{.row=row,.col=col},tile); }\ntest \"arbitrary grids, exact bounds, row order and bounded output\" {\n    var out: [75]Tile = undefined;\n    const small = [_]u8{1,1,0,1};\n    try std.testing.expectEqual(@as(usize,1),solid_tiles(&small,2,2,0,0,16,16,16,&out)); try tile_is(out[0],0,0);\n    try std.testing.expectEqual(@as(usize,3),solid_tiles(&small,2,2,15,15,2,2,16,&out)); try tile_is(out[0],0,0); try tile_is(out[1],0,1); try tile_is(out[2],1,1);\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(&small,2,2,-16,0,16,16,16,&out));\n    const grid = [_]u8{1,0,7,0,0,1,0,1,1,0,0,1};\n    try std.testing.expectEqual(@as(usize,6),solid_tiles(&grid,3,4,0,0,64,48,16,&out));\n    try tile_is(out[0],0,0); try tile_is(out[1],0,2); try tile_is(out[2],1,1); try tile_is(out[3],1,3); try tile_is(out[4],2,0); try tile_is(out[5],2,3);\n    try std.testing.expectEqual(@as(usize,1),solid_tiles(&grid,3,4,16,0,16,48,16,&out)); try tile_is(out[0],1,1);\n    out[2] = .{.row=999,.col=999};\n    try std.testing.expectEqual(@as(usize,6),solid_tiles(&grid,3,4,0,0,64,48,16,out[0..2])); try tile_is(out[0],0,0); try tile_is(out[1],0,2); try tile_is(out[2],999,999);\n    try std.testing.expectEqual(@as(usize,6),solid_tiles(&grid,3,4,0,0,64,48,16,out[0..0]));\n    const large: [72]u8 = @splat(1);\n    try std.testing.expectEqual(@as(usize,72),solid_tiles(&large,8,9,-10,-10,200,200,1,&out)); try tile_is(out[71],7,8);\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(&large,8,9,-1,-1,1,1,1,&out));\n    try std.testing.expectEqual(@as(usize,1),solid_tiles(&large,8,9,-0.5,-0.5,1,1,1,&out)); try tile_is(out[0],0,0);\n    out[0] = .{.row=999,.col=999};\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(&.{},0,0,0,0,1,1,1,&out));\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(grid[0..11],3,4,0,0,1,1,1,&out));\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(&grid,3,4,0,0,0,1,1,&out));\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(&grid,3,4,0,0,1,-1,1,&out));\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(&grid,3,4,0,0,1,1,0,&out));\n    try std.testing.expectEqual(@as(usize,0),solid_tiles(&grid,3,4,std.math.nan(f64),0,1,1,1,&out)); try tile_is(out[0],999,999);\n}\n"
      }
    }
  },
  {
    "id": "jump-buffer",
    "title": "Consume a buffered jump",
    "prompt": "Return true if a press is unconsumed, both ages are nonnegative, press_age\u2264buffer and grounded_age\u2264coyote. Ages are seconds.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "phy-controllers",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer, double coyote) { return false; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer, double coyote) { return !consumed && press_age>=0 && grounded_age>=0 && press_age<=buffer && grounded_age<=coyote; }",
        "tests": "int main(void) { assert(can_jump(.05,.05,false,.1,.1)); assert(can_jump(.1,.1,false,.1,.1)); assert(!can_jump(0,0,true,.1,.1)); assert(!can_jump(-1,0,false,.1,.1)); assert(!can_jump(.2,0,false,.1,.1)); assert(!can_jump(0,-1,false,.1,.1)); assert(!can_jump(0,.2,false,.1,.1)); assert(can_jump(.1,.1,false,.1,.1)); return 0; }"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer, double coyote) { return false; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\nbool can_jump(double press_age, double grounded_age, bool consumed, double buffer, double coyote) { return !consumed && press_age>=0 && grounded_age>=0 && press_age<=buffer && grounded_age<=coyote; }",
        "tests": "int main(void) { assert(can_jump(.05,.05,false,.1,.1)); assert(can_jump(.1,.1,false,.1,.1)); assert(!can_jump(0,0,true,.1,.1)); assert(!can_jump(-1,0,false,.1,.1)); assert(!can_jump(.2,0,false,.1,.1)); assert(!can_jump(0,-1,false,.1,.1)); assert(!can_jump(0,.2,false,.1,.1)); assert(can_jump(.1,.1,false,.1,.1)); return 0; }"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn can_jump(press_age: f64, grounded_age: f64, consumed: bool, buffer: f64, coyote: f64) bool { _ = press_age; _ = grounded_age; _ = consumed; _ = buffer; _ = coyote; return false; }",
        "solution": "const std = @import(\"std\");\nfn can_jump(press_age: f64, grounded_age: f64, consumed: bool, buffer: f64, coyote: f64) bool { return !consumed and press_age>=0 and grounded_age>=0 and press_age<=buffer and grounded_age<=coyote; }",
        "tests": "test \"mechanic edge cases\" { try std.testing.expect(can_jump(0.05,0.05,false,0.1,0.1)); try std.testing.expect(!can_jump(0,0,true,0.1,0.1)); try std.testing.expect(!can_jump(-1,0,false,0.1,0.1)); try std.testing.expect(!can_jump(0.2,0,false,0.1,0.1)); try std.testing.expect(!can_jump(0,-1,false,0.1,0.1)); try std.testing.expect(!can_jump(0,0.2,false,0.1,0.1)); try std.testing.expect(can_jump(0.1,0.1,false,0.1,0.1)); }"
      }
    }
  },
  {
    "id": "movement",
    "title": "Acceleration and braking",
    "prompt": "Approach target by at most acceleration*dt without overshooting. Inputs use pixels and seconds, acceleration and dt are nonnegative.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-vectors",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble approach_velocity(double current, double target, double acceleration, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble approach_velocity(double current, double target, double acceleration, double dt) { double change=acceleration*dt; return current<target?fmin(target,current+change):fmax(target,current-change); }",
        "tests": "int main(void) { assert(approach_velocity(0,100,200,.1)==20); assert(approach_velocity(90,100,200,.1)==100); assert(approach_velocity(-100,0,200,.1)==-80); assert(approach_velocity(10,-100,200,.1)==-10); assert(approach_velocity(10,-100,200,.1)==-10); assert(approach_velocity(10,10,200,.1)==10); assert(approach_velocity(10,0,200,0)==10); assert(approach_velocity(10,0,0,1)==10); return 0; }"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble approach_velocity(double current, double target, double acceleration, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble approach_velocity(double current, double target, double acceleration, double dt) { double change=acceleration*dt; return current<target?fmin(target,current+change):fmax(target,current-change); }",
        "tests": "int main(void) { assert(approach_velocity(0,100,200,.1)==20); assert(approach_velocity(90,100,200,.1)==100); assert(approach_velocity(-100,0,200,.1)==-80); assert(approach_velocity(10,-100,200,.1)==-10); assert(approach_velocity(10,-100,200,.1)==-10); assert(approach_velocity(10,10,200,.1)==10); assert(approach_velocity(10,0,200,0)==10); assert(approach_velocity(10,0,0,1)==10); return 0; }"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn approach_velocity(current: f64, target: f64, acceleration: f64, dt: f64) f64 { _ = current; _ = target; _ = acceleration; _ = dt; return 0; }",
        "solution": "const std = @import(\"std\");\nfn approach_velocity(current: f64, target: f64, acceleration: f64, dt: f64) f64 { const change=acceleration*dt; return if(current<target) @min(target,current+change) else @max(target,current-change); }",
        "tests": "test \"mechanic edge cases\" { try std.testing.expectEqual(@as(f64,20),approach_velocity(0,100,200,0.1)); try std.testing.expectEqual(@as(f64,100),approach_velocity(90,100,200,0.1)); try std.testing.expectEqual(@as(f64,-80),approach_velocity(-100,0,200,0.1)); try std.testing.expectEqual(@as(f64,-10),approach_velocity(10,-100,200,0.1)); try std.testing.expectEqual(@as(f64,10),approach_velocity(10,10,200,0.1)); try std.testing.expectEqual(@as(f64,10),approach_velocity(10,0,200,0)); try std.testing.expectEqual(@as(f64,10),approach_velocity(10,0,0,1)); }"
      }
    }
  },
  {
    "id": "camera",
    "title": "Frame-independent camera smoothing",
    "prompt": "Return current+(target-current)*(1-exp(-rate*dt)). Splitting a duration into steps must preserve the result.",
    "hint": "Work in the units stated in the signature. Read the boundary cases before implementing.",
    "lesson": "gd-camera",
    "native": {
      "c": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble smooth_camera(double current, double target, double rate, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble smooth_camera(double current, double target, double rate, double dt) { return current+(target-current)*(1-exp(-rate*dt)); }",
        "tests": "int main(void) { assert(smooth_camera(0,100,0,1)==0); assert(fabs(smooth_camera(0,100,2,.5)-63.212055882855765)<1e-6); double half=smooth_camera(0,100,2,.25); assert(fabs(smooth_camera(half,100,2,.25)-smooth_camera(0,100,2,.5))<1e-6); assert(smooth_camera(10,20,2,0)==10); assert(smooth_camera(10,10,2,1)==10); return 0; }"
      },
      "cpp": {
        "starter": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble smooth_camera(double current, double target, double rate, double dt) { return 0; }",
        "solution": "#include <assert.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <math.h>\ndouble smooth_camera(double current, double target, double rate, double dt) { return current+(target-current)*(1-exp(-rate*dt)); }",
        "tests": "int main(void) { assert(smooth_camera(0,100,0,1)==0); assert(fabs(smooth_camera(0,100,2,.5)-63.212055882855765)<1e-6); double half=smooth_camera(0,100,2,.25); assert(fabs(smooth_camera(half,100,2,.25)-smooth_camera(0,100,2,.5))<1e-6); assert(smooth_camera(10,20,2,0)==10); assert(smooth_camera(10,10,2,1)==10); return 0; }"
      },
      "zig": {
        "starter": "const std = @import(\"std\");\nfn smooth_camera(current: f64, target: f64, rate: f64, dt: f64) f64 { _ = current; _ = target; _ = rate; _ = dt; return 0; }",
        "solution": "const std = @import(\"std\");\nfn smooth_camera(current: f64, target: f64, rate: f64, dt: f64) f64 { return current+(target-current)*(1-@exp(-rate*dt)); }",
        "tests": "test \"mechanic edge cases\" { try std.testing.expectApproxEqAbs(@as(f64,63.212055882855765),smooth_camera(0,100,2,0.5),1e-6); const half=smooth_camera(0,100,2,0.25); try std.testing.expectApproxEqAbs(smooth_camera(0,100,2,0.5),smooth_camera(half,100,2,0.25),1e-6); try std.testing.expectEqual(@as(f64,10),smooth_camera(10,20,2,0)); try std.testing.expectEqual(@as(f64,10),smooth_camera(10,10,2,1)); try std.testing.expectEqual(@as(f64,0),smooth_camera(0,100,0,1)); }"
      }
    }
  }
];
