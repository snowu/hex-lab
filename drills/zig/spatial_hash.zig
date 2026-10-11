// Spatial hash grid for neighbour queries
// Run: zig test spatial_hash.zig   (written against Zig 0.17)

const std = @import("std");

pub fn SpatialHash(comptime max_entities: usize, comptime buckets: usize) type {
    return struct {
        const Self = @This();

        cell: f32,
        heads: [buckets]i32 = @splat(-1), // bucket -> newest entity id, or -1
        next: [max_entities]i32 = undefined, // entity id -> next entity in the same bucket, or -1
        xs: [max_entities]f32 = undefined,
        ys: [max_entities]f32 = undefined,
        n: usize = 0,

        pub fn init(cell: f32) Self {
            return .{ .cell = cell };
        }

        pub fn clear(self: *Self) void {
            _ = self;
        }

        /// returns the new entity's id (0, 1, 2, ...)
        pub fn insert(self: *Self, x: f32, y: f32) u32 {
            _ = self;
            _ = x;
            _ = y;
            return 0;
        }

        /// writes matching ids into out (at most out.len of them) and returns how many
        pub fn query(self: *const Self, x: f32, y: f32, r: f32, out: []u32) usize {
            _ = self;
            _ = x;
            _ = y;
            _ = r;
            _ = out;
            return 0;
        }
    };
}

// ---- tests: do not edit below this line ----
const Hash = SpatialHash(64, 4); // 4 buckets: lots of collisions on purpose

fn expectNear(h: *const Hash, x: f32, y: f32, r: f32, expected: []const u32) !void {
    var buf: [64]u32 = undefined;
    const n = h.query(x, y, r, &buf);
    std.mem.sort(u32, buf[0..n], {}, std.sort.asc(u32));
    try std.testing.expectEqualSlices(u32, expected, buf[0..n]);
}

test "finds neighbours within the radius" {
    var h = Hash.init(10);
    _ = h.insert(1, 1);
    _ = h.insert(5, 5);
    _ = h.insert(50, 50);
    try expectNear(&h, 0, 0, 8, &.{ 0, 1 });
}

test "exact distance, not whole cells" {
    var h = Hash.init(10);
    _ = h.insert(9, 9);
    try expectNear(&h, 0, 0, 5, &.{});
    try expectNear(&h, 0, 0, 13, &.{0});
}

test "negative coordinates" {
    var h = Hash.init(10);
    _ = h.insert(-1, -1);
    _ = h.insert(1, 1);
    _ = h.insert(-10, 0);
    try expectNear(&h, 0, 0, 2, &.{ 0, 1 });
    try expectNear(&h, 0, 0, 10, &.{ 0, 1, 2 });
}

test "a radius much larger than a cell" {
    var h = Hash.init(2);
    var i: usize = 0;
    while (i < 20) : (i += 1) _ = h.insert(@floatFromInt(i), 0);
    try expectNear(&h, 10, 0, 3, &.{ 7, 8, 9, 10, 11, 12, 13 });
}

test "no duplicates when cells share a bucket" {
    var h = Hash.init(1);
    var i: usize = 0;
    while (i < 30) : (i += 1) _ = h.insert(@floatFromInt(i), @floatFromInt(i));
    var buf: [64]u32 = undefined;
    const n = h.query(15, 15, 40, &buf);
    try std.testing.expectEqual(@as(usize, 30), n);
}

test "clear empties it, ids restart" {
    var h = Hash.init(10);
    _ = h.insert(0, 0);
    h.clear();
    try expectNear(&h, 0, 0, 5, &.{});
    try std.testing.expectEqual(@as(u32, 0), h.insert(3, 3));
    try expectNear(&h, 0, 0, 5, &.{0});
}
