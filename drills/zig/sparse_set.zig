// Sparse set: the heart of a fast ECS
// Run: zig test sparse_set.zig   (written against Zig 0.17)

const std = @import("std");

pub fn SparseSet(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        sparse: [capacity]u32 = @splat(0), // id -> index into dense
        dense: [capacity]u32 = @splat(0), // index -> id
        values: [capacity]T = undefined, // index -> value
        count: usize = 0,

        pub fn has(self: *const Self, id: u32) bool {
            _ = self;
            _ = id;
            return false;
        }

        /// false if id is out of range or already present
        pub fn add(self: *Self, id: u32, value: T) bool {
            _ = self;
            _ = id;
            _ = value;
            return false;
        }

        pub fn get(self: *const Self, id: u32) ?T {
            _ = self;
            _ = id;
            return null;
        }

        /// swap-remove: keep the dense arrays packed
        pub fn remove(self: *Self, id: u32) bool {
            _ = self;
            _ = id;
            return false;
        }

        pub fn ids(self: *const Self) []const u32 {
            return self.dense[0..self.count];
        }
    };
}

// ---- tests: do not edit below this line ----
test "add, has, get" {
    var s = SparseSet(i32, 8){};
    try std.testing.expect(s.add(3, 30));
    try std.testing.expect(s.add(5, 50));
    try std.testing.expect(s.has(3));
    try std.testing.expect(!s.has(4));
    try std.testing.expectEqual(@as(?i32, 50), s.get(5));
    try std.testing.expectEqual(@as(?i32, null), s.get(4));
}

test "duplicate and out-of-range adds are refused" {
    var s = SparseSet(i32, 4){};
    try std.testing.expect(s.add(1, 10));
    try std.testing.expect(!s.add(1, 99));
    try std.testing.expectEqual(@as(?i32, 10), s.get(1));
    try std.testing.expect(!s.add(4, 1));
    try std.testing.expect(!s.has(100));
}

test "swap-remove keeps the array packed" {
    var s = SparseSet(i32, 8){};
    _ = s.add(1, 10);
    _ = s.add(2, 20);
    _ = s.add(3, 30);
    try std.testing.expect(s.remove(1));
    try std.testing.expectEqualSlices(u32, &.{ 3, 2 }, s.ids());
    try std.testing.expectEqual(@as(?i32, 30), s.get(3));
    try std.testing.expectEqual(@as(?i32, 20), s.get(2));
    try std.testing.expect(!s.has(1));
    try std.testing.expect(!s.remove(1));
}

test "removing the last element" {
    var s = SparseSet(i32, 4){};
    _ = s.add(0, 5);
    _ = s.add(1, 6);
    try std.testing.expect(s.remove(1));
    try std.testing.expectEqualSlices(u32, &.{0}, s.ids());
    try std.testing.expect(!s.has(1));
}

test "stale sparse entries do not fool has()" {
    var s = SparseSet(i32, 8){};
    _ = s.add(2, 1);
    _ = s.add(6, 2);
    _ = s.remove(6);
    try std.testing.expect(!s.has(6));
    _ = s.add(7, 3);
    try std.testing.expect(!s.has(6));
    try std.testing.expect(s.has(7));
}

test "re-adding after removal" {
    var s = SparseSet(i32, 4){};
    _ = s.add(2, 1);
    _ = s.remove(2);
    try std.testing.expect(s.add(2, 9));
    try std.testing.expectEqual(@as(?i32, 9), s.get(2));
    try std.testing.expectEqual(@as(usize, 1), s.ids().len);
}
