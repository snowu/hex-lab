// Frame-rate independent smoothing
// Run: zig test damp.zig   (written against Zig 0.17)

const std = @import("std");

pub fn damp(current: f64, target: f64, k: f64, dt: f64) f64 {
    return current + (target - current) * k * dt;
}

// ---- tests: do not edit below this line ----
test "no time passes" {
    try std.testing.expectApproxEqAbs(@as(f64, 5), damp(5, 10, 3, 0), 1e-12);
}
test "matches the closed form" {
    try std.testing.expectApproxEqAbs(10 * (1 - @exp(@as(f64, -1))), damp(0, 10, 2, 0.5), 1e-9);
}
fn run(fps: usize) f64 {
    var p: f64 = 0;
    var i: usize = 0;
    while (i < fps) : (i += 1) p = damp(p, 10, 4, 1.0 / @as(f64, @floatFromInt(fps)));
    return p;
}
test "same result at any frame rate" {
    try std.testing.expectApproxEqAbs(run(30), run(144), 1e-9);
    try std.testing.expectApproxEqAbs(run(60), run(5), 1e-9);
}
test "never overshoots, even with a huge dt" {
    const v = damp(0, 10, 50, 10);
    try std.testing.expect(v >= 0 and v <= 10);
}
