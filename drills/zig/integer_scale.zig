// Pixel-perfect integer scaling
// Run: zig test integer_scale.zig   (written against Zig 0.17)

const std = @import("std");

pub const Fit = struct { scale: i32, off_x: i32, off_y: i32 };

pub fn integerScale(win_w: i32, win_h: i32, base_w: i32, base_h: i32) Fit {
    _ = win_w;
    _ = win_h;
    _ = base_w;
    _ = base_h;
    return .{ .scale = 0, .off_x = 0, .off_y = 0 };
}

// ---- tests: do not edit below this line ----
fn expectFit(w: i32, h: i32, bw: i32, bh: i32, s: i32, ox: i32, oy: i32) !void {
    const f = integerScale(w, h, bw, bh);
    try std.testing.expectEqual(Fit{ .scale = s, .off_x = ox, .off_y = oy }, f);
}

test "perfect fit at 1080p" {
    try expectFit(1920, 1080, 320, 180, 6, 0, 0);
}
test "letterboxed" {
    try expectFit(1000, 700, 320, 180, 3, 20, 80);
}
test "height limits the scale" {
    try expectFit(2000, 400, 320, 180, 2, 680, 20);
}
test "a window smaller than the base still scales by 1" {
    try expectFit(200, 100, 320, 180, 1, -60, -40);
}
test "phone in portrait" {
    try expectFit(390, 844, 160, 144, 2, 35, 278);
}
test "odd negative offsets round down" {
    try expectFit(201, 100, 320, 180, 1, -60, -40);
}
