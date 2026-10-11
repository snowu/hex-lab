// Object pool with an O(1) free list
// Run: zig test free_list_pool.zig   (written against Zig 0.17)

const std = @import("std");

pub fn Pool(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        items: [capacity]T = undefined,
        next_free: [capacity]usize = undefined, // the free list is threaded through the unused slots
        in_use: [capacity]bool = @splat(false),
        free_head: usize = 0, // first free slot; capacity means "none"
        free_count: usize = capacity,

        pub fn init() Self {
            var s = Self{};
            for (0..capacity) |i| s.next_free[i] = i + 1;
            return s;
        }

        pub fn freeCount(self: *const Self) usize {
            return self.free_count;
        }

        pub fn get(self: *Self, index: usize) *T {
            return &self.items[index];
        }

        /// the index of a free slot, or null if the pool is exhausted
        pub fn acquire(self: *Self) ?usize {
            _ = self;
            return null;
        }

        /// false for an out-of-range index or a slot that is already free
        pub fn release(self: *Self, index: usize) bool {
            _ = self;
            _ = index;
            return false;
        }
    };
}

// ---- tests: do not edit below this line ----
test "slots are handed out in order and then it runs dry" {
    var p = Pool(u32, 4).init();
    try std.testing.expectEqual(@as(?usize, 0), p.acquire());
    try std.testing.expectEqual(@as(?usize, 1), p.acquire());
    try std.testing.expectEqual(@as(?usize, 2), p.acquire());
    try std.testing.expectEqual(@as(?usize, 3), p.acquire());
    try std.testing.expectEqual(@as(?usize, null), p.acquire());
    try std.testing.expectEqual(@as(usize, 0), p.freeCount());
}
test "a released slot is reused first" {
    var p = Pool(u32, 4).init();
    for (0..4) |_| _ = p.acquire();
    try std.testing.expect(p.release(1));
    try std.testing.expectEqual(@as(usize, 1), p.freeCount());
    try std.testing.expectEqual(@as(?usize, 1), p.acquire());
}
test "most recently released comes back first" {
    var p = Pool(u32, 4).init();
    for (0..4) |_| _ = p.acquire();
    _ = p.release(2);
    _ = p.release(0);
    try std.testing.expectEqual(@as(?usize, 0), p.acquire());
    try std.testing.expectEqual(@as(?usize, 2), p.acquire());
    try std.testing.expectEqual(@as(?usize, null), p.acquire());
}
test "double release and bad indices are refused and cannot corrupt the list" {
    var p = Pool(u32, 3).init();
    const a = p.acquire().?;
    try std.testing.expect(p.release(a));
    try std.testing.expect(!p.release(a));
    try std.testing.expect(!p.release(99));
    try std.testing.expect(!p.release(2)); // never acquired
    try std.testing.expectEqual(@as(usize, 3), p.freeCount());
    var seen: [3]bool = @splat(false);
    for (0..3) |_| seen[p.acquire().?] = true;
    try std.testing.expect(seen[0] and seen[1] and seen[2]);
    try std.testing.expectEqual(@as(?usize, null), p.acquire());
}
test "slots keep their data" {
    var p = Pool(u32, 2).init();
    const a = p.acquire().?;
    const b = p.acquire().?;
    p.get(a).* = 11;
    p.get(b).* = 22;
    try std.testing.expectEqual(@as(u32, 11), p.get(a).*);
    try std.testing.expectEqual(@as(u32, 22), p.get(b).*);
}
