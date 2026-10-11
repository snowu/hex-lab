// Autotile bitmask
// Run: zig test autotile.zig   (written against Zig 0.17)

const std = @import("std");

pub fn bitmask(grid: []const []const u8, row: usize, col: usize) u8 {
    _ = grid;
    _ = row;
    _ = col;
    return 0;
}

// ---- tests: do not edit below this line ----
test "fully surrounded" {
    const g = [_][]const u8{ "###", "#.#", "###" };
    try std.testing.expectEqual(@as(u8, 15), bitmask(&g, 1, 1));
}
test "lone tile in open space" {
    const g = [_][]const u8{ "...", ".#.", "..." };
    try std.testing.expectEqual(@as(u8, 0), bitmask(&g, 1, 1));
}
test "north only" {
    const g = [_][]const u8{ ".#.", ".#.", "..." };
    try std.testing.expectEqual(@as(u8, 1), bitmask(&g, 1, 1));
}
test "east and south" {
    const g = [_][]const u8{ "...", ".##", ".#." };
    try std.testing.expectEqual(@as(u8, 6), bitmask(&g, 1, 1));
}
test "west only" {
    const g = [_][]const u8{ "...", "##.", "..." };
    try std.testing.expectEqual(@as(u8, 8), bitmask(&g, 1, 1));
}
test "top-left corner: north and west are outside the map" {
    const g = [_][]const u8{ "#.", ".." };
    try std.testing.expectEqual(@as(u8, 9), bitmask(&g, 0, 0));
}
test "bottom-right corner: east and south are outside" {
    const g = [_][]const u8{ "..", ".#" };
    try std.testing.expectEqual(@as(u8, 6), bitmask(&g, 1, 1));
}
