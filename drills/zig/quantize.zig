// Snap an image to a palette
// Run: zig test quantize.zig   (written against Zig 0.17)

const std = @import("std");

pub const Rgb = [3]u8;

pub fn nearestIndex(c: Rgb, palette: []const Rgb) usize {
    _ = c;
    _ = palette;
    return 0;
}

/// out[i] = palette index for pixels[i]. out.len == pixels.len.
pub fn quantize(pixels: []const Rgb, palette: []const Rgb, out: []usize) void {
    _ = pixels;
    _ = palette;
    for (out) |*o| o.* = 0;
}

// ---- tests: do not edit below this line ----
const P = [_]Rgb{ .{ 0, 0, 0 }, .{ 255, 255, 255 }, .{ 255, 0, 0 } };

test "exact and nearest" {
    try std.testing.expectEqual(@as(usize, 2), nearestIndex(.{ 255, 0, 0 }, &P));
    try std.testing.expectEqual(@as(usize, 2), nearestIndex(.{ 200, 30, 30 }, &P));
    try std.testing.expectEqual(@as(usize, 0), nearestIndex(.{ 60, 60, 60 }, &P));
    try std.testing.expectEqual(@as(usize, 1), nearestIndex(.{ 250, 250, 250 }, &P));
}
test "ties go to the first colour" {
    const pal = [_]Rgb{ .{ 0, 0, 0 }, .{ 2, 2, 2 } };
    try std.testing.expectEqual(@as(usize, 0), nearestIndex(.{ 1, 1, 1 }, &pal));
}
test "quantize an image" {
    const px = [_]Rgb{ .{ 10, 10, 10 }, .{ 250, 250, 250 }, .{ 240, 10, 10 }, .{ 0, 0, 0 } };
    var out: [4]usize = undefined;
    quantize(&px, &P, &out);
    try std.testing.expectEqualSlices(usize, &.{ 0, 1, 2, 0 }, &out);
}
test "empty image" {
    var out: [0]usize = undefined;
    quantize(&.{}, &P, &out);
}
