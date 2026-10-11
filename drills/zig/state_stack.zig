// Pushdown automaton: a stack of states
// Run: zig test state_stack.zig   (written against Zig 0.17)

const std = @import("std");

pub const Kind = enum { enter, exit, pause, unpause };
pub const Event = struct { kind: Kind, state: u8 };

pub const StateStack = struct {
    stack: [8]u8 = undefined,
    depth: usize = 0,
    log: [64]Event = undefined,
    log_len: usize = 0,

    fn record(self: *StateStack, kind: Kind, state: u8) void {
        self.log[self.log_len] = .{ .kind = kind, .state = state };
        self.log_len += 1;
    }

    pub fn top(self: *const StateStack) ?u8 {
        if (self.depth == 0) return null;
        return self.stack[self.depth - 1];
    }

    pub fn events(self: *const StateStack) []const Event {
        return self.log[0..self.log_len];
    }

    pub fn push(self: *StateStack, s: u8) bool {
        _ = self;
        _ = s;
        return false;
    }

    pub fn pop(self: *StateStack) bool {
        _ = self;
        return false;
    }

    pub fn replace(self: *StateStack, s: u8) bool {
        _ = self;
        _ = s;
        return false;
    }
};

// ---- tests: do not edit below this line ----
fn expectLog(st: *const StateStack, expected: []const Event) !void {
    try std.testing.expectEqual(expected.len, st.events().len);
    for (expected, st.events()) |e, g| {
        try std.testing.expectEqual(e.kind, g.kind);
        try std.testing.expectEqual(e.state, g.state);
    }
}

test "push enters the new state and pauses the old one" {
    var st = StateStack{};
    try std.testing.expect(st.push(1));
    try std.testing.expect(st.push(2));
    try std.testing.expectEqual(@as(?u8, 2), st.top());
    try expectLog(&st, &.{ .{ .kind = .enter, .state = 1 }, .{ .kind = .pause, .state = 1 }, .{ .kind = .enter, .state = 2 } });
}
test "pop exits the top and resumes the one below" {
    var st = StateStack{};
    _ = st.push(1);
    _ = st.push(2);
    try std.testing.expect(st.pop());
    try std.testing.expectEqual(@as(?u8, 1), st.top());
    try expectLog(&st, &.{ .{ .kind = .enter, .state = 1 }, .{ .kind = .pause, .state = 1 }, .{ .kind = .enter, .state = 2 }, .{ .kind = .exit, .state = 2 }, .{ .kind = .unpause, .state = 1 } });
}
test "popping the last state exits it and resumes nothing" {
    var st = StateStack{};
    _ = st.push(7);
    try std.testing.expect(st.pop());
    try std.testing.expectEqual(@as(?u8, null), st.top());
    try expectLog(&st, &.{ .{ .kind = .enter, .state = 7 }, .{ .kind = .exit, .state = 7 } });
    try std.testing.expect(!st.pop());
}
test "replace swaps the top without pausing anything" {
    var st = StateStack{};
    _ = st.push(1);
    try std.testing.expect(st.replace(3));
    try std.testing.expectEqual(@as(?u8, 3), st.top());
    try expectLog(&st, &.{ .{ .kind = .enter, .state = 1 }, .{ .kind = .exit, .state = 1 }, .{ .kind = .enter, .state = 3 } });
    var empty = StateStack{};
    try std.testing.expect(!empty.replace(1));
}
test "the stack holds 8 states and refuses more without logging" {
    var st = StateStack{};
    for (0..8) |i| try std.testing.expect(st.push(@intCast(i)));
    const before = st.events().len;
    try std.testing.expect(!st.push(99));
    try std.testing.expectEqual(before, st.events().len);
    try std.testing.expectEqual(@as(?u8, 7), st.top());
}
