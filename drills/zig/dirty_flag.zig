// Dirty flag: lazy world transforms
// Run: zig test dirty_flag.zig   (written against Zig 0.17)

const std = @import("std");

pub const Scene = struct {
    const max = 8;

    parent: [max]?usize = @splat(null),
    local: [max]i32 = @splat(0),
    cache: [max]i32 = @splat(0),
    dirty: [max]bool = @splat(true),
    n: usize = 0,
    recomputes: u32 = 0,

    pub fn add(self: *Scene, parent: ?usize, local: i32) usize {
        _ = self;
        _ = parent;
        _ = local;
        return 0;
    }

    pub fn setLocal(self: *Scene, i: usize, v: i32) void {
        _ = self;
        _ = i;
        _ = v;
    }

    pub fn world(self: *Scene, i: usize) i32 {
        _ = self;
        _ = i;
        return 0;
    }
};

// ---- tests: do not edit below this line ----
fn chain() Scene {
    var s = Scene{};
    const a = s.add(null, 1);
    const b = s.add(a, 2);
    const c = s.add(b, 3);
    _ = s.add(c, 4);
    return s;
}

test "world value is the sum along the chain" {
    var s = chain();
    try std.testing.expectEqual(@as(i32, 10), s.world(3));
    try std.testing.expectEqual(@as(i32, 3), s.world(1));
}
test "the first read computes each node once, later reads are free" {
    var s = chain();
    _ = s.world(3);
    try std.testing.expectEqual(@as(u32, 4), s.recomputes);
    _ = s.world(3);
    _ = s.world(2);
    try std.testing.expectEqual(@as(u32, 4), s.recomputes);
}
test "changing a node recomputes it and its descendants, not its ancestors" {
    var s = chain();
    _ = s.world(3);
    s.setLocal(1, 20);
    try std.testing.expectEqual(@as(i32, 28), s.world(3));
    try std.testing.expectEqual(@as(u32, 4 + 3), s.recomputes);
}
test "siblings are not recomputed" {
    var s = Scene{};
    const root = s.add(null, 10);
    const left = s.add(root, 1);
    const right = s.add(root, 2);
    _ = s.world(left);
    _ = s.world(right);
    const before = s.recomputes;
    s.setLocal(left, 5);
    _ = s.world(right);
    try std.testing.expectEqual(before, s.recomputes);
    try std.testing.expectEqual(@as(i32, 15), s.world(left));
}
test "changing the root recomputes everything below it" {
    var s = chain();
    _ = s.world(3);
    s.setLocal(0, 100);
    try std.testing.expectEqual(@as(i32, 109), s.world(3));
    try std.testing.expectEqual(@as(u32, 8), s.recomputes);
}
test "a node added after others are cached is computed correctly" {
    var s = chain();
    _ = s.world(3);
    const extra = s.add(3, 5);
    try std.testing.expectEqual(@as(i32, 15), s.world(extra));
}
