// Swept collision time (no tunneling)
// Run: zig test sweep_hit.zig   (written against Zig 0.17)

const std = @import("std");

pub fn sweepHit(pos: f32, size: f32, dist: f32, wall_left: f32) ?f32 {
    _ = pos;
    _ = size;
    _ = dist;
    _ = wall_left;
    return null;
}

// ---- tests: do not edit below this line ----
fn expectHit(expected: ?f32, got: ?f32) !void {
    if (expected) |e| {
        try std.testing.expect(got != null);
        try std.testing.expectApproxEqAbs(e, got.?, 1e-5);
    } else {
        try std.testing.expect(got == null);
    }
}

test "hits partway" {
    try expectHit(0.42, sweepHit(0, 8, 100, 50));
}
test "hits at the very end" {
    try expectHit(1.0, sweepHit(0, 10, 40, 50));
}
test "does not reach" {
    try expectHit(null, sweepHit(0, 8, 10, 50));
}
test "a huge step toward a thin wall is still found" {
    try expectHit(0.0196, sweepHit(0, 2, 5000, 100));
}
test "wall behind" {
    try expectHit(null, sweepHit(200, 8, 100, 50));
}
test "moving away" {
    try expectHit(null, sweepHit(0, 8, -100, 50));
}
test "already touching is t = 0" {
    try expectHit(0.0, sweepHit(42, 8, 10, 50));
}
test "already inside" {
    try expectHit(null, sweepHit(46, 8, 10, 50));
}
