// Fixed timestep with an accumulator
// Run: zig test fixed_steps.zig   (written against Zig 0.17)

const std = @import("std");

/// Writes into out[i] how many simulation steps ran during frame i. out.len == frame_ms.len.
pub fn fixedSteps(frame_ms: []const u32, step: u32, max_steps: u32, out: []u32) void {
    _ = frame_ms;
    _ = step;
    _ = max_steps;
    for (out) |*o| o.* = 0;
}

// ---- tests: do not edit below this line ----
fn expectSteps(frames: []const u32, step: u32, cap: u32, expected: []const u32) !void {
    var buf: [16]u32 = undefined;
    const got = buf[0..frames.len];
    fixedSteps(frames, step, cap, got);
    try std.testing.expectEqualSlices(u32, expected, got);
}

test "steady 16 ms frames, 10 ms step" {
    try expectSteps(&.{ 16, 16, 16 }, 10, 5, &.{ 1, 2, 1 });
}
test "leftover carries over" {
    try expectSteps(&.{ 5, 5, 5, 5 }, 10, 5, &.{ 0, 1, 0, 1 });
}
test "a slow frame runs several steps" {
    try expectSteps(&.{35}, 10, 5, &.{3});
}
test "cap and drop the backlog" {
    try expectSteps(&.{ 100, 100 }, 10, 5, &.{ 5, 5 });
}
test "dropped time is really gone" {
    try expectSteps(&.{ 100, 9, 1 }, 10, 5, &.{ 5, 0, 1 });
}
test "custom step and cap" {
    try expectSteps(&.{ 50, 7 }, 20, 2, &.{ 2, 0 });
}
test "empty" {
    try expectSteps(&.{}, 10, 5, &.{});
}
