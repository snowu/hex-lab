// 2D transforms: matrices and the order of operations
// Run: zig test transform2d.zig   (written against Zig 0.17)

const std = @import("std");

/// x' = a*x + c*y + tx ; y' = b*x + d*y + ty
pub const Mat = struct { a: f64, b: f64, c: f64, d: f64, tx: f64, ty: f64 };
pub const identity = Mat{ .a = 1, .b = 0, .c = 0, .d = 1, .tx = 0, .ty = 0 };

pub fn translate(x: f64, y: f64) Mat {
    _ = x;
    _ = y;
    return identity;
}

pub fn rotate(rad: f64) Mat {
    _ = rad;
    return identity;
}

pub fn scale(sx: f64, sy: f64) Mat {
    _ = sx;
    _ = sy;
    return identity;
}

/// The matrix that applies c first and then p (a child inside a parent).
pub fn mul(p: Mat, c: Mat) Mat {
    _ = p;
    return c;
}

pub fn apply(m: Mat, x: f64, y: f64) [2]f64 {
    _ = m;
    return .{ x, y };
}

pub fn inverse(m: Mat) ?Mat {
    _ = m;
    return null;
}

// ---- tests: do not edit below this line ----
fn expectPt(ex: f64, ey: f64, got: [2]f64) !void {
    try std.testing.expectApproxEqAbs(ex, got[0], 1e-9);
    try std.testing.expectApproxEqAbs(ey, got[1], 1e-9);
}

test "the basic transforms" {
    try expectPt(4, 7, apply(translate(3, 5), 1, 2));
    try expectPt(0, 1, apply(rotate(std.math.pi / 2.0), 1, 0));
    try expectPt(-1, 0, apply(rotate(std.math.pi / 2.0), 0, 1));
    try expectPt(6, -3, apply(scale(2, -3), 3, 1));
    try expectPt(5, 6, apply(identity, 5, 6));
}
test "child first, then parent: parent = translate * rotate" {
    const m = mul(translate(10, 0), rotate(std.math.pi / 2.0));
    try expectPt(10, 1, apply(m, 1, 0));
}
test "order matters: rotate * translate is a different transform" {
    const m = mul(rotate(std.math.pi / 2.0), translate(10, 0));
    try expectPt(0, 11, apply(m, 1, 0));
}
test "mul agrees with applying the two transforms one after another" {
    const p = mul(translate(3, -2), scale(2, 0.5));
    const c = mul(rotate(0.7), translate(1, 4));
    const m = mul(p, c);
    const step = apply(p, apply(c, 2.5, -1.5)[0], apply(c, 2.5, -1.5)[1]);
    try expectPt(step[0], step[1], apply(m, 2.5, -1.5));
}
test "inverse undoes the transform" {
    const m = mul(translate(5, 6), mul(rotate(1.1), scale(2, 3)));
    const inv = inverse(m).?;
    const p = apply(m, 1.25, -7.5);
    try expectPt(1.25, -7.5, apply(inv, p[0], p[1]));
}
test "a flattened transform has no inverse" {
    try std.testing.expect(inverse(scale(0, 1)) == null);
    try std.testing.expect(inverse(identity) != null);
}
