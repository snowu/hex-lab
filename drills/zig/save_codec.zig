// A versioned binary save format
// Run: zig test save_codec.zig   (written against Zig 0.17)

const std = @import("std");

pub const Save = struct { coins: u32, level: u16 };
pub const size = 9;

pub fn encode(s: Save) [size]u8 {
    _ = s;
    return @splat(0);
}

pub fn decode(bytes: []const u8) ?Save {
    _ = bytes;
    return null;
}

// ---- tests: do not edit below this line ----
test "known bytes" {
    const b = encode(.{ .coins = 0x01020304, .level = 0x0506 });
    try std.testing.expectEqualSlices(u8, &.{ 0x53, 2, 4, 3, 2, 1, 6, 5, 0x6A }, &b);
}
test "round trip" {
    const s = Save{ .coins = 123456, .level = 77 };
    const got = decode(&encode(s)).?;
    try std.testing.expectEqual(s.coins, got.coins);
    try std.testing.expectEqual(s.level, got.level);
}
test "migrates a version 1 save" {
    const got = decode(&.{ 0x53, 1, 0x2C, 0x01, 7, 0x88 }).?;
    try std.testing.expectEqual(@as(u32, 300), got.coins);
    try std.testing.expectEqual(@as(u16, 7), got.level);
}
test "rejects bad input" {
    try std.testing.expect(decode(&.{}) == null);
    try std.testing.expect(decode(&.{ 0x53, 2, 4, 3 }) == null); // truncated
    try std.testing.expect(decode(&.{ 0x54, 2, 4, 3, 2, 1, 6, 5, 0x6B }) == null); // magic
    try std.testing.expect(decode(&.{ 0x53, 2, 4, 3, 2, 1, 6, 5, 0x00 }) == null); // checksum
    try std.testing.expect(decode(&.{ 0x53, 3, 0, 0, 0, 0, 0, 0, 0x56 }) == null); // unknown version
}
test "a v1 length with a v2 header is rejected" {
    try std.testing.expect(decode(&.{ 0x53, 2, 0x2C, 0x01, 7, 0x88 }) == null);
}
