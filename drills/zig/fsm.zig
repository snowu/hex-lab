// A state machine you cannot misuse
// Run: zig test fsm.zig   (written against Zig 0.17)

const std = @import("std");

pub const State = enum { idle, running, air };
pub const Event = enum { run, stop, jump, land, wait };

/// The next state, or null if the event is not valid in this state.
pub fn transition(s: State, e: Event) ?State {
    _ = s;
    _ = e;
    return null;
}

pub const Machine = struct {
    state: State = .idle,
    enter_count: u32 = 0,

    /// true if the event was valid. enter_count only grows when the state changes.
    pub fn send(self: *Machine, e: Event) bool {
        _ = self;
        _ = e;
        return false;
    }
};

// ---- tests: do not edit below this line ----
test "transition table" {
    try std.testing.expectEqual(@as(?State, .running), transition(.idle, .run));
    try std.testing.expectEqual(@as(?State, .air), transition(.running, .jump));
    try std.testing.expectEqual(@as(?State, .idle), transition(.air, .land));
    try std.testing.expectEqual(@as(?State, null), transition(.air, .run));
    try std.testing.expectEqual(@as(?State, null), transition(.running, .land));
}

test "machine follows valid events and ignores invalid ones" {
    var m = Machine{};
    try std.testing.expect(m.send(.run));
    try std.testing.expectEqual(State.running, m.state);
    try std.testing.expect(!m.send(.land));
    try std.testing.expectEqual(State.running, m.state);
}

test "enter_count counts changes only" {
    var m = Machine{};
    _ = m.send(.jump);
    _ = m.send(.land);
    try std.testing.expectEqual(@as(u32, 2), m.enter_count);
    try std.testing.expect(m.send(.wait));
    try std.testing.expectEqual(@as(u32, 2), m.enter_count);
    _ = m.send(.stop);
    try std.testing.expectEqual(@as(u32, 2), m.enter_count);
}
