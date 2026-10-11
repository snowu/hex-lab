// Coyote time and jump buffering
// Run: zig test jumper.zig   (written against Zig 0.17)

const std = @import("std");

pub const Jumper = struct {
    coyote: i64 = 100,
    buffer: i64 = 100,
    left_at: ?i64 = null,
    pressed_at: ?i64 = null,

    pub fn leaveGround(self: *Jumper, t: i64) void {
        _ = self;
        _ = t;
    }

    /// true if the jump happens right now
    pub fn press(self: *Jumper, t: i64, grounded: bool) bool {
        _ = self;
        _ = t;
        _ = grounded;
        return false;
    }

    /// true if a buffered jump fires on landing
    pub fn land(self: *Jumper, t: i64) bool {
        _ = self;
        _ = t;
        return false;
    }
};

// ---- tests: do not edit below this line ----
const expect = std.testing.expect;

test "grounded jump works" {
    var j = Jumper{};
    try expect(j.press(0, true));
}
test "airborne with no ledge: no jump" {
    var j = Jumper{};
    try expect(!j.press(500, false));
}
test "coyote: jump 60 ms after leaving a ledge" {
    var j = Jumper{};
    j.leaveGround(1000);
    try expect(j.press(1060, false));
}
test "coyote expires" {
    var j = Jumper{};
    j.leaveGround(1000);
    try expect(!j.press(1101, false));
}
test "coyote is used up by the jump" {
    var j = Jumper{};
    j.leaveGround(1000);
    try expect(j.press(1040, false));
    try expect(!j.press(1060, false));
}
test "buffered press fires on landing" {
    var j = Jumper{};
    try expect(!j.press(2000, false));
    try expect(j.land(2060));
}
test "stale press does not fire" {
    var j = Jumper{};
    _ = j.press(2000, false);
    try expect(!j.land(2101));
}
test "a buffered press fires only once" {
    var j = Jumper{};
    _ = j.press(2000, false);
    try expect(j.land(2050));
    try expect(!j.land(2060));
}
test "landing clears coyote" {
    var j = Jumper{};
    j.leaveGround(100);
    _ = j.land(120);
    try expect(!j.press(150, false));
}
