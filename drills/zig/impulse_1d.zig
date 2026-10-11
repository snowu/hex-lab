// Collision response with impulses
// Run: zig test impulse_1d.zig   (written against Zig 0.17)

const std = @import("std");

pub const Pair = struct { v1: f64, v2: f64 };

/// Body 1 is on the left of body 2 and they touch. e = restitution.
pub fn collide(m1: f64, v1: f64, m2: f64, v2: f64, e: f64) Pair {
    _ = m1;
    _ = m2;
    _ = e;
    return .{ .v1 = v1, .v2 = v2 };
}

// ---- tests: do not edit below this line ----
fn expectPair(a: f64, b: f64, got: Pair) !void {
    try std.testing.expectApproxEqAbs(a, got.v1, 1e-9);
    try std.testing.expectApproxEqAbs(b, got.v2, 1e-9);
}

test "equal masses, perfect bounce: they swap velocities" {
    try expectPair(0, 3, collide(1, 3, 1, 0, 1));
}
test "unequal masses (checked by hand)" {
    try expectPair(1, 4, collide(2, 3, 1, 0, 1));
}
test "e = 0: they move together at the common velocity" {
    const r = collide(2, 6, 3, 1, 0);
    try std.testing.expectApproxEqAbs((2.0 * 6 + 3.0 * 1) / 5.0, r.v1, 1e-9);
    try std.testing.expectApproxEqAbs(r.v1, r.v2, 1e-9);
}
test "momentum is conserved for any e" {
    for ([_]f64{ 0, 0.3, 0.8, 1 }) |e| {
        const r = collide(1.5, 4.0, 0.7, -2.0, e);
        try std.testing.expectApproxEqAbs(1.5 * 4.0 + 0.7 * -2.0, 1.5 * r.v1 + 0.7 * r.v2, 1e-9);
    }
}
test "kinetic energy is conserved when e = 1" {
    const r = collide(1.5, 4.0, 0.7, -2.0, 1);
    try std.testing.expectApproxEqAbs(0.5 * 1.5 * 16 + 0.5 * 0.7 * 4, 0.5 * 1.5 * r.v1 * r.v1 + 0.5 * 0.7 * r.v2 * r.v2, 1e-9);
}
test "against an almost immovable wall the ball comes back at e times its speed" {
    const r = collide(1, 10, 1e12, 0, 0.5);
    try std.testing.expectApproxEqAbs(@as(f64, -5), r.v1, 1e-6);
}
test "bodies that are separating or moving together are left alone" {
    try expectPair(1, 2, collide(1, 1, 1, 2, 1));
    try expectPair(2, 2, collide(3, 2, 1, 2, 0.5));
}
