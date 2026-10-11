// Snapshot interpolation for remote players
// Run: zig test snapshot_interp.zig   (written against Zig 0.17)

const std = @import("std");

pub const Snapshot = struct { t: f64, x: f64 };

/// Position at render_t, blended between the snapshots around it. snaps is sorted by t.
pub fn interpolate(snaps: []const Snapshot, render_t: f64) ?f64 {
    _ = snaps;
    _ = render_t;
    return null;
}

// ---- tests: do not edit below this line ----
const demo_snaps = [_]Snapshot{ .{ .t = 1.0, .x = 10 }, .{ .t = 1.1, .x = 20 }, .{ .t = 1.3, .x = 60 } };

fn expectX(ex: f64, got: ?f64) !void {
    try std.testing.expect(got != null);
    try std.testing.expectApproxEqAbs(ex, got.?, 1e-9);
}

test "halfway between two snapshots" {
    try expectX(15, interpolate(&demo_snaps, 1.05));
    try expectX(40, interpolate(&demo_snaps, 1.2));
}
test "exactly on a snapshot" {
    try expectX(10, interpolate(&demo_snaps, 1.0));
    try expectX(20, interpolate(&demo_snaps, 1.1));
    try expectX(60, interpolate(&demo_snaps, 1.3));
}
test "outside the range it holds the nearest snapshot" {
    try expectX(10, interpolate(&demo_snaps, 0.5));
    try expectX(60, interpolate(&demo_snaps, 9.0));
}
test "one snapshot and no snapshots" {
    try expectX(7, interpolate(&.{.{ .t = 3, .x = 7 }}, 100));
    try std.testing.expect(interpolate(&.{}, 1.0) == null);
}
test "two snapshots with the same time do not divide by zero" {
    const dup = [_]Snapshot{ .{ .t = 1, .x = 1 }, .{ .t = 2, .x = 5 }, .{ .t = 2, .x = 9 }, .{ .t = 3, .x = 9 } };
    const v = interpolate(&dup, 2.0);
    try std.testing.expect(v != null and !std.math.isNan(v.?) and !std.math.isInf(v.?));
}
