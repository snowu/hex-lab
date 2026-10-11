// Shortest path on a tile map
// Run: zig test grid_path.zig   (written against Zig 0.17)

const std = @import("std");

/// Steps in the shortest 4-directional path, or -1 if unreachable.
pub fn shortestPath(allocator: std.mem.Allocator, grid: []const []const u8, start: [2]usize, goal: [2]usize) !i32 {
    _ = allocator;
    _ = grid;
    _ = start;
    _ = goal;
    return -2;
}

// ---- tests: do not edit below this line ----
const alloc = std.testing.allocator;

test "around the wall" {
    const g = [_][]const u8{ ".....", ".###.", ".#...", ".#.#.", "....." };
    try std.testing.expectEqual(@as(i32, 6), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 2, 4 }));
}
test "same cell" {
    const g = [_][]const u8{"..."};
    try std.testing.expectEqual(@as(i32, 0), try shortestPath(alloc, &g, .{ 0, 1 }, .{ 0, 1 }));
}
test "blocked" {
    const g = [_][]const u8{ ".#.", ".#.", ".#." };
    try std.testing.expectEqual(@as(i32, -1), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 0, 2 }));
}
test "goal in a wall" {
    const g = [_][]const u8{".#"};
    try std.testing.expectEqual(@as(i32, -1), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 0, 1 }));
}
test "4-directional only" {
    const g = [_][]const u8{ "..", ".." };
    try std.testing.expectEqual(@as(i32, 2), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 1, 1 }));
}
test "large open grid" {
    const n = 300;
    const cells = try alloc.alloc(u8, n * n);
    defer alloc.free(cells);
    @memset(cells, '.');
    const rows = try alloc.alloc([]const u8, n);
    defer alloc.free(rows);
    for (rows, 0..) |*r, i| r.* = cells[i * n ..][0..n];
    try std.testing.expectEqual(@as(i32, 598), try shortestPath(alloc, rows, .{ 0, 0 }, .{ n - 1, n - 1 }));
}
