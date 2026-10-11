// Bytecode: a tiny stack virtual machine
// Run: zig test stack_vm.zig   (written against Zig 0.17)

const std = @import("std");

pub const Op = union(enum) { push: i32, add, sub, mul, div, dup, swap, jz: usize, jmp: usize, halt };
pub const VmError = error{ StackUnderflow, StackOverflow, DivideByZero, BadJump, StepLimit, NoHalt };

/// Run the program and return the value on top of the stack when it halts.
pub fn run(program: []const Op, max_steps: usize) VmError!i32 {
    _ = program;
    _ = max_steps;
    return error.NoHalt;
}

// ---- tests: do not edit below this line ----
const expectError = std.testing.expectError;

test "arithmetic" {
    const p = [_]Op{ .{ .push = 2 }, .{ .push = 3 }, .add, .{ .push = 4 }, .mul, .halt };
    try std.testing.expectEqual(@as(i32, 20), try run(&p, 100));
}
test "operand order: sub and div take (a, b) as pushed" {
    try std.testing.expectEqual(@as(i32, 7), try run(&[_]Op{ .{ .push = 10 }, .{ .push = 3 }, .sub, .halt }, 10));
    try std.testing.expectEqual(@as(i32, -3), try run(&[_]Op{ .{ .push = -7 }, .{ .push = 2 }, .div, .halt }, 10));
}
test "dup and swap" {
    try std.testing.expectEqual(@as(i32, 25), try run(&[_]Op{ .{ .push = 5 }, .dup, .mul, .halt }, 10));
    try std.testing.expectEqual(@as(i32, 10), try run(&[_]Op{ .{ .push = 1 }, .{ .push = 2 }, .swap, .{ .push = 10 }, .mul, .halt }, 10));
}
test "a countdown loop with jz and jmp" {
    const p = [_]Op{ .{ .push = 5 }, .dup, .{ .jz = 6 }, .{ .push = 1 }, .sub, .{ .jmp = 1 }, .halt };
    try std.testing.expectEqual(@as(i32, 0), try run(&p, 1000));
}
test "an infinite loop is stopped by the step limit" {
    try expectError(error.StepLimit, run(&[_]Op{.{ .jmp = 0 }}, 50));
}
test "stack errors" {
    try expectError(error.StackUnderflow, run(&[_]Op{ .{ .push = 1 }, .add, .halt }, 10));
    try expectError(error.StackUnderflow, run(&[_]Op{.halt}, 10));
    try expectError(error.StackUnderflow, run(&[_]Op{.dup}, 10));
    var many: [17]Op = undefined;
    for (&many) |*o| o.* = .{ .push = 1 };
    try expectError(error.StackOverflow, run(&many, 100));
}
test "other failures" {
    try expectError(error.DivideByZero, run(&[_]Op{ .{ .push = 1 }, .{ .push = 0 }, .div, .halt }, 10));
    try expectError(error.BadJump, run(&[_]Op{ .{ .jmp = 5 }, .halt }, 10));
    try expectError(error.NoHalt, run(&[_]Op{.{ .push = 1 }}, 10));
}
