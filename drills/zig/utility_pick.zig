// Utility AI: scoring and not flip-flopping
// Run: zig test utility_pick.zig   (written against Zig 0.17)

const std = @import("std");

/// Multiply the considerations, each clamped to 0..1. An empty list scores 1.
pub fn score(considerations: []const f64) f64 {
    _ = considerations;
    return 0;
}

/// Index of the best action; the current one gets +inertia. Ties: lowest index. Empty: null.
pub fn pick(scores: []const f64, current: ?usize, inertia: f64) ?usize {
    _ = scores;
    _ = current;
    _ = inertia;
    return null;
}

// ---- tests: do not edit below this line ----
test "score multiplies and clamps" {
    try std.testing.expectApproxEqAbs(@as(f64, 0.25), score(&.{ 0.5, 0.5 }), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.5), score(&.{ 1.7, 0.5 }), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.0), score(&.{ -0.3, 0.9 }), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.0), score(&.{ 0.8, 0.0, 0.9 }), 1e-12);
}
test "an empty list scores 1" {
    try std.testing.expectApproxEqAbs(@as(f64, 1.0), score(&.{}), 1e-12);
}
test "pick takes the highest score" {
    try std.testing.expectEqual(@as(?usize, 2), pick(&.{ 0.2, 0.5, 0.9, 0.1 }, null, 0));
}
test "ties go to the lowest index" {
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.1, 0.7, 0.7 }, null, 0));
}
test "inertia keeps the current action when scores are close" {
    try std.testing.expectEqual(@as(?usize, 0), pick(&.{ 0.50, 0.55 }, 0, 0.1));
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.50, 0.55 }, null, 0.1));
}
test "a much better action still wins" {
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.2, 0.9 }, 0, 0.1));
}
test "empty list and bad current" {
    try std.testing.expectEqual(@as(?usize, null), pick(&.{}, null, 0.1));
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.1, 0.4 }, 7, 0.5));
}
