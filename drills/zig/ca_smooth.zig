// Cave generation: one smoothing step
// Run: zig test ca_smooth.zig   (written against Zig 0.17)

const std = @import("std");

/// src and dst are w*h bytes, row-major. '#' wall, '.' floor.
pub fn smooth(src: []const u8, w: usize, h: usize, dst: []u8) void {
    _ = w;
    _ = h;
    @memcpy(dst, src);
}

// ---- tests: do not edit below this line ----
fn expectSmooth(src: []const u8, w: usize, h: usize, expected: []const u8) !void {
    var buf: [64]u8 = undefined;
    const dst = buf[0 .. w * h];
    smooth(src, w, h, dst);
    try std.testing.expectEqualStrings(expected, dst);
}

test "open field: corners close, edges stay open" {
    try expectSmooth("..." ++ "..." ++ "...", 3, 3, "#.#" ++ "..." ++ "#.#");
}
test "solid stays solid" {
    try expectSmooth("###" ++ "###" ++ "###", 3, 3, "###" ++ "###" ++ "###");
}
test "a lone wall in a big room is erased" {
    var src: [25]u8 = @splat('.');
    src[12] = '#';
    var dst: [25]u8 = undefined;
    smooth(&src, 5, 5, &dst);
    try std.testing.expectEqual(@as(u8, '.'), dst[12]);
}
test "a 2x2 map closes completely (every cell has 5 outside neighbours)" {
    try expectSmooth("#." ++ "..", 2, 2, "##" ++ "##");
}
test "reads only the old generation (corner walls close the edges, the centre opens)" {
    try expectSmooth("#.#" ++ "..." ++ "#.#", 3, 3, "###" ++ "#.#" ++ "###");
}
