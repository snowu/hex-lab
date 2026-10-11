// Command pattern: undo and redo
// Run: zig test command_undo.zig   (written against Zig 0.17)

const std = @import("std");

pub const Command = struct { index: usize, value: i32, prev: i32 = 0 };

pub const History = struct {
    cells: [8]i32 = @splat(0),
    undo_buf: [4]Command = undefined,
    undo_len: usize = 0,
    redo_buf: [4]Command = undefined,
    redo_len: usize = 0,

    /// Set cells[index] = value and remember how to undo it.
    pub fn exec(self: *History, index: usize, value: i32) void {
        _ = self;
        _ = index;
        _ = value;
    }

    pub fn undo(self: *History) bool {
        _ = self;
        return false;
    }

    pub fn redo(self: *History) bool {
        _ = self;
        return false;
    }
};

// ---- tests: do not edit below this line ----
test "exec sets a cell" {
    var h = History{};
    h.exec(0, 5);
    try std.testing.expectEqual(@as(i32, 5), h.cells[0]);
}
test "undo restores the previous value, one step at a time" {
    var h = History{};
    h.exec(0, 5);
    h.exec(0, 9);
    try std.testing.expect(h.undo());
    try std.testing.expectEqual(@as(i32, 5), h.cells[0]);
    try std.testing.expect(h.undo());
    try std.testing.expectEqual(@as(i32, 0), h.cells[0]);
    try std.testing.expect(!h.undo());
}
test "redo re-applies, and only after an undo" {
    var h = History{};
    try std.testing.expect(!h.redo());
    h.exec(1, 7);
    _ = h.undo();
    try std.testing.expect(h.redo());
    try std.testing.expectEqual(@as(i32, 7), h.cells[1]);
    try std.testing.expect(!h.redo());
}
test "a new change clears redo" {
    var h = History{};
    h.exec(1, 1);
    h.exec(1, 2);
    _ = h.undo();
    h.exec(1, 3);
    try std.testing.expect(!h.redo());
    try std.testing.expectEqual(@as(i32, 3), h.cells[1]);
}
test "only the last 4 commands are remembered" {
    var h = History{};
    for ([_]i32{ 1, 2, 3, 4, 5 }) |v| h.exec(0, v);
    var undone: u32 = 0;
    while (h.undo()) undone += 1;
    try std.testing.expectEqual(@as(u32, 4), undone);
    try std.testing.expectEqual(@as(i32, 1), h.cells[0]);
}
test "out of range changes are ignored and not recorded" {
    var h = History{};
    h.exec(8, 1);
    try std.testing.expect(!h.undo());
}
test "commands on different cells undo independently" {
    var h = History{};
    h.exec(2, 7);
    h.exec(3, 8);
    _ = h.undo();
    try std.testing.expectEqual(@as(i32, 0), h.cells[3]);
    try std.testing.expectEqual(@as(i32, 7), h.cells[2]);
}
