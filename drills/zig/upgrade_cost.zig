// Exponential upgrade costs
// Run: zig test upgrade_cost.zig   (written against Zig 0.17)

const std = @import("std");

pub fn upgradeCost(base: u64, growth: f64, level: u32) u64 {
    _ = base;
    _ = growth;
    _ = level;
    return 0;
}

pub fn levelsAffordable(budget: u64, base: u64, growth: f64) u32 {
    _ = budget;
    _ = base;
    _ = growth;
    return 0;
}

// ---- tests: do not edit below this line ----
test "cost" {
    try std.testing.expectEqual(@as(u64, 80), upgradeCost(10, 2, 3));
    try std.testing.expectEqual(@as(u64, 22), upgradeCost(10, 1.5, 2));
    try std.testing.expectEqual(@as(u64, 7), upgradeCost(7, 3, 0));
}
test "affordable levels" {
    try std.testing.expectEqual(@as(u32, 3), levelsAffordable(70, 10, 2));
    try std.testing.expectEqual(@as(u32, 4), levelsAffordable(150, 10, 2));
    try std.testing.expectEqual(@as(u32, 0), levelsAffordable(5, 10, 2));
}
test "smaller growth buys more" {
    try std.testing.expect(levelsAffordable(1_000_000, 10, 1.15) > levelsAffordable(1_000_000, 10, 2));
}
test "exponential: 20x the budget buys only 4 more levels" {
    try std.testing.expectEqual(@as(u32, 4), levelsAffordable(2000, 10, 2) - levelsAffordable(100, 10, 2));
}
