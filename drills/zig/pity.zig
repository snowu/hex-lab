// Drop rates with a pity timer
// Run: zig test pity.zig   (written against Zig 0.17)

const std = @import("std");

/// out[i] = whether roll i dropped the item. out.len == rolls.len.
pub fn simulatePity(rolls: []const f32, p: f32, pity: u32, out: []bool) void {
    _ = rolls;
    _ = p;
    _ = pity;
    for (out) |*o| o.* = false;
}

// ---- tests: do not edit below this line ----
fn expectDrops(rolls: []const f32, p: f32, pity: u32, expected: []const bool) !void {
    var buf: [128]bool = undefined;
    const got = buf[0..rolls.len];
    simulatePity(rolls, p, pity, got);
    try std.testing.expectEqualSlices(bool, expected, got);
}

test "plain drops" {
    try expectDrops(&.{ 0.1, 0.9, 0.04 }, 0.05, 90, &.{ false, false, true });
}
test "pity guarantees the 3rd roll" {
    try expectDrops(&.{ 0.9, 0.9, 0.9 }, 0.05, 3, &.{ false, false, true });
}
test "counter resets after a pity drop" {
    try expectDrops(&.{ 0.9, 0.9, 0.9, 0.9, 0.9, 0.9 }, 0.05, 3, &.{ false, false, true, false, false, true });
}
test "a natural drop also resets" {
    try expectDrops(&.{ 0.9, 0.01, 0.9, 0.9, 0.9 }, 0.05, 3, &.{ false, true, false, false, true });
}
test "pity of 1 always drops" {
    try expectDrops(&.{ 0.99, 0.99 }, 0.05, 1, &.{ true, true });
}
test "the gap between drops is bounded" {
    const rolls: [100]f32 = @splat(0.99);
    var out: [100]bool = undefined;
    simulatePity(&rolls, 0.01, 10, &out);
    var gap: u32 = 0;
    var worst: u32 = 0;
    for (out) |d| {
        gap = if (d) 0 else gap + 1;
        worst = @max(worst, gap);
    }
    try std.testing.expectEqual(@as(u32, 9), worst);
}
