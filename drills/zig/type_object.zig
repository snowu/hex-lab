// Type object: data-driven monsters with inheritance
// Run: zig test type_object.zig   (written against Zig 0.17)

const std = @import("std");

pub const Stats = struct { hp: ?i32 = null, attack: ?i32 = null, speed: ?i32 = null };
pub const Resolved = struct { hp: i32, attack: i32, speed: i32 };

pub const Registry = struct {
    const max = 8;

    names: [max][]const u8 = undefined,
    parents: [max]?usize = @splat(null),
    stats: [max]Stats = undefined,
    n: usize = 0,

    /// false if the name exists already or the parent is not defined yet
    pub fn define(self: *Registry, name: []const u8, parent: ?[]const u8, stats: Stats) bool {
        _ = self;
        _ = name;
        _ = parent;
        _ = stats;
        return false;
    }

    /// each stat comes from the closest type on the chain that sets it; null if unknown or incomplete
    pub fn resolve(self: *const Registry, name: []const u8) ?Resolved {
        _ = self;
        _ = name;
        return null;
    }
};

// ---- tests: do not edit below this line ----
fn zoo() Registry {
    var r = Registry{};
    _ = r.define("goblin", null, .{ .hp = 10, .attack = 2, .speed = 3 });
    _ = r.define("chief", "goblin", .{ .hp = 25, .attack = 4 });
    _ = r.define("elite", "chief", .{ .speed = 5 });
    return r;
}

test "a root type resolves to its own stats" {
    const r = zoo();
    const g = r.resolve("goblin").?;
    try std.testing.expectEqual(@as(i32, 10), g.hp);
    try std.testing.expectEqual(@as(i32, 2), g.attack);
    try std.testing.expectEqual(@as(i32, 3), g.speed);
}
test "children override only what they set" {
    const r = zoo();
    const c = r.resolve("chief").?;
    try std.testing.expectEqual(@as(i32, 25), c.hp);
    try std.testing.expectEqual(@as(i32, 4), c.attack);
    try std.testing.expectEqual(@as(i32, 3), c.speed);
}
test "inheritance goes up more than one level" {
    const r = zoo();
    const e = r.resolve("elite").?;
    try std.testing.expectEqual(@as(i32, 25), e.hp);
    try std.testing.expectEqual(@as(i32, 4), e.attack);
    try std.testing.expectEqual(@as(i32, 5), e.speed);
}
test "unknown types and unknown parents are refused" {
    var r = zoo();
    try std.testing.expect(r.resolve("dragon") == null);
    try std.testing.expect(!r.define("whelp", "dragon", .{ .hp = 1 }));
    try std.testing.expect(r.resolve("whelp") == null);
}
test "duplicate names are refused and do not change the original" {
    var r = zoo();
    try std.testing.expect(!r.define("goblin", null, .{ .hp = 999, .attack = 999, .speed = 999 }));
    try std.testing.expectEqual(@as(i32, 10), r.resolve("goblin").?.hp);
}
test "a type whose chain never sets a stat does not resolve" {
    var r = Registry{};
    try std.testing.expect(r.define("half", null, .{ .hp = 1, .attack = 1 }));
    try std.testing.expect(r.resolve("half") == null);
    try std.testing.expect(r.define("fixed", "half", .{ .speed = 2 }));
    try std.testing.expect(r.resolve("fixed") != null);
}
