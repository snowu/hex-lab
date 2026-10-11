// A behaviour tree tick
// Run: zig test behavior_tree.zig   (written against Zig 0.17)

const std = @import("std");

pub const Status = enum { success, failure, running };
pub const Kind = enum { leaf, sequence, selector, inverter };
pub const Node = struct { kind: Kind, a: usize = 0, b: usize = 0 };

/// leaf: a = index into results. sequence/selector: children are kids[a .. a + b]. inverter: a = child node index.
pub fn tick(nodes: []const Node, kids: []const usize, results: []const Status, root: usize) Status {
    _ = nodes;
    _ = kids;
    _ = results;
    _ = root;
    return .failure;
}

// ---- tests: do not edit below this line ----
// root selector [ sequence [ sees_player, in_range, attack ], patrol ], plus an inverter around leaf 2
const demo_nodes = [_]Node{
    .{ .kind = .selector, .a = 0, .b = 2 }, // 0
    .{ .kind = .sequence, .a = 2, .b = 3 }, // 1
    .{ .kind = .leaf, .a = 0 }, // 2: sees_player
    .{ .kind = .leaf, .a = 1 }, // 3: in_range
    .{ .kind = .leaf, .a = 2 }, // 4: attack
    .{ .kind = .leaf, .a = 3 }, // 5: patrol
    .{ .kind = .inverter, .a = 4 }, // 6: not attack
};
const demo_kids = [_]usize{ 1, 5, 2, 3, 4 };
const S = Status;

test "the sequence succeeds when every condition holds" {
    try std.testing.expectEqual(S.success, tick(&demo_nodes, &demo_kids, &.{ .success, .success, .success, .failure }, 0));
    try std.testing.expectEqual(S.success, tick(&demo_nodes, &demo_kids, &.{ .success, .success, .success, .failure }, 1));
}
test "a failed condition makes the selector fall back to patrol" {
    try std.testing.expectEqual(S.success, tick(&demo_nodes, &demo_kids, &.{ .success, .failure, .success, .success }, 0));
    try std.testing.expectEqual(S.failure, tick(&demo_nodes, &demo_kids, &.{ .success, .failure, .success, .success }, 1));
}
test "everything failing fails the selector" {
    try std.testing.expectEqual(S.failure, tick(&demo_nodes, &demo_kids, &.{ .failure, .failure, .failure, .failure }, 0));
}
test "running propagates up and stops evaluation" {
    try std.testing.expectEqual(S.running, tick(&demo_nodes, &demo_kids, &.{ .success, .success, .running, .success }, 0));
    try std.testing.expectEqual(S.running, tick(&demo_nodes, &demo_kids, &.{ .running, .failure, .failure, .success }, 0));
}
test "the inverter swaps success and failure and leaves running alone" {
    try std.testing.expectEqual(S.failure, tick(&demo_nodes, &demo_kids, &.{ .failure, .failure, .success, .failure }, 6));
    try std.testing.expectEqual(S.success, tick(&demo_nodes, &demo_kids, &.{ .failure, .failure, .failure, .failure }, 6));
    try std.testing.expectEqual(S.running, tick(&demo_nodes, &demo_kids, &.{ .failure, .failure, .running, .failure }, 6));
}
test "empty composites" {
    const ns = [_]Node{ .{ .kind = .sequence, .a = 0, .b = 0 }, .{ .kind = .selector, .a = 0, .b = 0 } };
    try std.testing.expectEqual(S.success, tick(&ns, &.{}, &.{}, 0));
    try std.testing.expectEqual(S.failure, tick(&ns, &.{}, &.{}, 1));
}
