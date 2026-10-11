// AABB overlap and push-out
// Run: zig test aabb.zig   (written against Zig 0.17)

const std = @import("std");

pub const Rect = struct { x: f32, y: f32, w: f32, h: f32 };
pub const Vec2 = struct { x: f32, y: f32 };

pub fn overlaps(a: Rect, b: Rect) bool {
    _ = a;
    _ = b;
    return false;
}

/// How far to move a so it stops overlapping b (zero if it does not).
pub fn pushOut(a: Rect, b: Rect) Vec2 {
    _ = a;
    _ = b;
    return .{ .x = 0, .y = 0 };
}

// ---- tests: do not edit below this line ----
const A = Rect{ .x = 0, .y = 0, .w = 10, .h = 10 };

fn expectPush(ex_x: f32, ex_y: f32, got: Vec2) !void {
    try std.testing.expectApproxEqAbs(ex_x, got.x, 1e-5);
    try std.testing.expectApproxEqAbs(ex_y, got.y, 1e-5);
}

test "overlap" {
    try std.testing.expect(overlaps(A, .{ .x = 5, .y = 5, .w = 10, .h = 10 }));
    try std.testing.expect(overlaps(A, .{ .x = 2, .y = 2, .w = 3, .h = 3 }));
}
test "apart and touching edges" {
    try std.testing.expect(!overlaps(A, .{ .x = 20, .y = 0, .w = 5, .h = 5 }));
    try std.testing.expect(!overlaps(A, .{ .x = 10, .y = 0, .w = 5, .h = 5 }));
}
test "push left and right" {
    try expectPush(-2, 0, pushOut(A, .{ .x = 8, .y = 0, .w = 10, .h = 10 }));
    try expectPush(2, 0, pushOut(.{ .x = 8, .y = 0, .w = 10, .h = 10 }, A));
}
test "push up and down (least penetration is y)" {
    try expectPush(0, -1, pushOut(A, .{ .x = 0, .y = 9, .w = 10, .h = 10 }));
    try expectPush(0, 1, pushOut(.{ .x = 0, .y = 9, .w = 10, .h = 10 }, A));
}
test "no overlap gives zero" {
    try expectPush(0, 0, pushOut(A, .{ .x = 30, .y = 30, .w = 5, .h = 5 }));
}
test "tie resolves on x" {
    try expectPush(-2, 0, pushOut(A, .{ .x = 8, .y = 8, .w = 10, .h = 10 }));
}
