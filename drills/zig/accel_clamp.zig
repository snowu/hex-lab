// Acceleration with a speed cap
// Run: zig test accel_clamp.zig   (written against Zig 0.17)

const std = @import("std");

pub const Vec2 = struct { x: f32, y: f32 };

pub fn accelerate(v: Vec2, a: Vec2, dt: f32, max_speed: f32) Vec2 {
    _ = a;
    _ = dt;
    _ = max_speed;
    return v;
}

// ---- tests: do not edit below this line ----
fn expectVec(ex: Vec2, got: Vec2) !void {
    try std.testing.expectApproxEqAbs(ex.x, got.x, 1e-4);
    try std.testing.expectApproxEqAbs(ex.y, got.y, 1e-4);
}

test "below the cap" {
    try expectVec(.{ .x = 3, .y = 4 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = 3, .y = 4 }, 1, 100));
}
test "clamped keeps direction (3-4-5)" {
    try expectVec(.{ .x = 15, .y = 20 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = 30, .y = 40 }, 1, 25));
}
test "diagonal is not faster" {
    const v = accelerate(.{ .x = 0, .y = 0 }, .{ .x = 100, .y = 100 }, 1, 10);
    try std.testing.expectApproxEqAbs(@as(f32, 10), @sqrt(v.x * v.x + v.y * v.y), 1e-4);
    try std.testing.expectApproxEqAbs(v.x, v.y, 1e-4);
}
test "adds to the existing velocity" {
    try expectVec(.{ .x = 2, .y = 2 }, accelerate(.{ .x = 1, .y = 1 }, .{ .x = 2, .y = 2 }, 0.5, 100));
}
test "zero stays zero" {
    try expectVec(.{ .x = 0, .y = 0 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = 0, .y = 0 }, 1, 5));
}
test "negative direction" {
    try expectVec(.{ .x = -15, .y = -20 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = -30, .y = -40 }, 1, 25));
}
