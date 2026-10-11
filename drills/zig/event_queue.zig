// Event queue: a fixed-size ring buffer
// Run: zig test event_queue.zig   (written against Zig 0.17)

const std = @import("std");

pub fn RingQueue(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        items: [capacity]T = undefined,
        head: usize = 0, // index of the oldest item
        count: usize = 0,

        pub fn len(self: *const Self) usize {
            return self.count;
        }

        /// false (and nothing stored) when full
        pub fn push(self: *Self, v: T) bool {
            _ = self;
            _ = v;
            return false;
        }

        /// always stores v; true if the oldest item had to be dropped
        pub fn pushOverwrite(self: *Self, v: T) bool {
            _ = self;
            _ = v;
            return false;
        }

        pub fn pop(self: *Self) ?T {
            _ = self;
            return null;
        }

        pub fn peek(self: *const Self) ?T {
            _ = self;
            return null;
        }
    };
}

// ---- tests: do not edit below this line ----
test "first in, first out" {
    var q = RingQueue(u32, 4){};
    try std.testing.expect(q.push(1));
    try std.testing.expect(q.push(2));
    try std.testing.expect(q.push(3));
    try std.testing.expectEqual(@as(usize, 3), q.len());
    try std.testing.expectEqual(@as(?u32, 1), q.pop());
    try std.testing.expectEqual(@as(?u32, 2), q.pop());
    try std.testing.expectEqual(@as(?u32, 3), q.pop());
    try std.testing.expectEqual(@as(?u32, null), q.pop());
}
test "a full queue refuses new items and keeps the old ones" {
    var q = RingQueue(u32, 2){};
    try std.testing.expect(q.push(1));
    try std.testing.expect(q.push(2));
    try std.testing.expect(!q.push(3));
    try std.testing.expectEqual(@as(?u32, 1), q.pop());
    try std.testing.expect(q.push(3));
    try std.testing.expectEqual(@as(?u32, 2), q.pop());
    try std.testing.expectEqual(@as(?u32, 3), q.pop());
}
test "indices wrap around many times" {
    var q = RingQueue(u32, 3){};
    var next_in: u32 = 0;
    var next_out: u32 = 0;
    for (0..100) |_| {
        try std.testing.expect(q.push(next_in));
        next_in += 1;
        try std.testing.expect(q.push(next_in));
        next_in += 1;
        try std.testing.expectEqual(@as(?u32, next_out), q.pop());
        next_out += 1;
        try std.testing.expectEqual(@as(?u32, next_out), q.pop());
        next_out += 1;
    }
}
test "peek does not remove" {
    var q = RingQueue(u32, 2){};
    try std.testing.expectEqual(@as(?u32, null), q.peek());
    _ = q.push(9);
    try std.testing.expectEqual(@as(?u32, 9), q.peek());
    try std.testing.expectEqual(@as(usize, 1), q.len());
}
test "overwrite drops the oldest when full" {
    var q = RingQueue(u32, 3){};
    try std.testing.expect(!q.pushOverwrite(1));
    try std.testing.expect(!q.pushOverwrite(2));
    try std.testing.expect(!q.pushOverwrite(3));
    try std.testing.expect(q.pushOverwrite(4));
    try std.testing.expect(q.pushOverwrite(5));
    try std.testing.expectEqual(@as(usize, 3), q.len());
    try std.testing.expectEqual(@as(?u32, 3), q.pop());
    try std.testing.expectEqual(@as(?u32, 4), q.pop());
    try std.testing.expectEqual(@as(?u32, 5), q.pop());
}
