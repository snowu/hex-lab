// Raycast on a grid (DDA)
// Run: zig test grid_raycast.zig   (written against Zig 0.17)

const std = @import("std");

pub const Hit = struct { col: usize, row: usize, dist: f64 };

/// grid rows of '.' and '#', cells are 1x1, y grows down. Returns the first wall cell entered by the ray.
pub fn raycast(grid: []const []const u8, ox: f64, oy: f64, dx: f64, dy: f64, max_dist: f64) ?Hit {
    _ = grid;
    _ = ox;
    _ = oy;
    _ = dx;
    _ = dy;
    _ = max_dist;
    return null;
}

// ---- tests: do not edit below this line ----
const G = [_][]const u8{ ".....", "..#..", ".....", "....#", "....." };

fn expectHit(col: usize, row: usize, dist: f64, got: ?Hit) !void {
    try std.testing.expect(got != null);
    try std.testing.expectEqual(col, got.?.col);
    try std.testing.expectEqual(row, got.?.row);
    try std.testing.expectApproxEqAbs(dist, got.?.dist, 1e-9);
}

test "horizontal ray" {
    try expectHit(2, 1, 1.5, raycast(&G, 0.5, 1.5, 1, 0, 10));
    try expectHit(4, 3, 3.5, raycast(&G, 0.5, 3.5, 1, 0, 10));
}
test "vertical ray going up" {
    try expectHit(2, 1, 2.5, raycast(&G, 2.5, 4.5, 0, -1, 10));
}
test "diagonal rays (the direction need not be normalised)" {
    try expectHit(2, 1, 1.6770509831248424, raycast(&G, 0.5, 0.5, 2, 1, 10));
    try expectHit(2, 1, 2.1633307652783937, raycast(&G, 0.2, 0.3, 3, 2, 10));
}
test "a ray that finds nothing, and one that leaves the grid" {
    try std.testing.expect(raycast(&G, 4.5, 0.5, -1, 0, 10) == null);
    try std.testing.expect(raycast(&G, 0.5, 0.5, -1, 0, 10) == null);
}
test "max distance stops the ray" {
    try std.testing.expect(raycast(&G, 0.5, 1.5, 1, 0, 1.0) == null);
    try std.testing.expect(raycast(&G, 0.5, 1.5, 1, 0, 1.6) != null);
}
test "starting inside a wall is a hit at distance 0, starting outside the grid is no hit" {
    try expectHit(2, 1, 0.0, raycast(&G, 2.5, 1.5, 1, 0, 10));
    try std.testing.expect(raycast(&G, -1.5, 0.5, 1, 0, 10) == null);
}
