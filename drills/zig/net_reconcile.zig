// Client-side prediction and reconciliation
// Run: zig test net_reconcile.zig   (written against Zig 0.17)

const std = @import("std");

pub const Input = struct { seq: u32, dx: i32 };

/// server_pos is where the server says we were after processing input number acked.
/// Replay the inputs the server has not seen yet (seq > acked) on top of it.
pub fn reconcile(server_pos: i32, acked: u32, pending: []const Input) i32 {
    _ = acked;
    _ = pending;
    return server_pos;
}

/// How many leading inputs (sorted by seq) are acknowledged and can be dropped.
pub fn dropAcked(pending: []const Input, acked: u32) usize {
    _ = pending;
    _ = acked;
    return 0;
}

// ---- tests: do not edit below this line ----
const demo_pending = [_]Input{ .{ .seq = 5, .dx = 1 }, .{ .seq = 6, .dx = 1 }, .{ .seq = 7, .dx = 1 }, .{ .seq = 8, .dx = 2 }, .{ .seq = 9, .dx = -1 } };

test "only unacknowledged inputs are replayed" {
    try std.testing.expectEqual(@as(i32, 101), reconcile(100, 7, &demo_pending));
}
test "everything acknowledged: the server position is the truth" {
    try std.testing.expectEqual(@as(i32, 100), reconcile(100, 9, &demo_pending));
    try std.testing.expectEqual(@as(i32, 100), reconcile(100, 50, &demo_pending));
}
test "nothing acknowledged: replay everything" {
    try std.testing.expectEqual(@as(i32, 104), reconcile(100, 0, &demo_pending));
}
test "a correction from the server moves the result" {
    try std.testing.expectEqual(@as(i32, 91), reconcile(90, 7, &demo_pending));
}
test "dropAcked counts the acknowledged prefix" {
    try std.testing.expectEqual(@as(usize, 3), dropAcked(&demo_pending, 7));
    try std.testing.expectEqual(@as(usize, 0), dropAcked(&demo_pending, 4));
    try std.testing.expectEqual(@as(usize, 5), dropAcked(&demo_pending, 99));
    try std.testing.expectEqual(@as(usize, 0), dropAcked(&.{}, 3));
}
