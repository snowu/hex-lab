/* Game dev drills in Zig and C++. They run locally (the browser cannot compile either language), so each one is a single self-contained file:
   your code first, then the tests. `scripts/gen-drills.mjs` writes them to drills/zig and drills/cpp, `scripts/validate-drills.mjs` compiles every
   reference solution and checks the starters fail. Referenced from the lessons via { type: 'drill', ref }. */
window.DRILLS = {

  fixed_steps: {
    title: 'Fixed timestep with an accumulator', minutes: 15, level: 'medium',
    prompt: `<p>Implement <code>fixed_steps</code>. <code>frame_ms</code> holds the real duration of each frame in whole milliseconds. The game simulates in fixed slices of <code>step</code> ms. For every frame report how many simulation steps ran.</p>
<ul><li>Add the frame time to an accumulator, then run one step (subtract <code>step</code>) while the accumulator holds at least one.</li><li><b>Spiral-of-death guard:</b> never run more than <code>max_steps</code> in one frame. If you hit the cap and are still behind, throw the rest of the accumulator away (set it to 0) instead of trying to catch up.</li></ul>`,
    hint: 'acc += t; then while (acc >= step and n < max_steps) { acc -= step; n += 1 }. Afterwards, if acc is still >= step you were behind: acc = 0. Only drop on a real backlog ([50] with step 10 and cap 5 runs exactly 5 and leaves 0 anyway).',
    notes: 'Gaffer On Games, "Fix Your Timestep", is the reference. The simulation stays deterministic because it only ever sees the same dt, and rendering interpolates with alpha = acc / step. Without the cap one long frame (alt-tab, a breakpoint) makes the next frame run hundreds of steps, which takes longer, which makes the backlog bigger: the spiral of death.',
    zig: {
      starter: String.raw`const std = @import("std");

/// Writes into out[i] how many simulation steps ran during frame i. out.len == frame_ms.len.
pub fn fixedSteps(frame_ms: []const u32, step: u32, max_steps: u32, out: []u32) void {
    _ = frame_ms;
    _ = step;
    _ = max_steps;
    for (out) |*o| o.* = 0;
}
`,
      tests: String.raw`fn expectSteps(frames: []const u32, step: u32, cap: u32, expected: []const u32) !void {
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
`,
      solution: String.raw`const std = @import("std");

pub fn fixedSteps(frame_ms: []const u32, step: u32, max_steps: u32, out: []u32) void {
    var acc: u32 = 0;
    for (frame_ms, 0..) |t, i| {
        acc += t;
        var n: u32 = 0;
        while (acc >= step and n < max_steps) {
            acc -= step;
            n += 1;
        }
        if (acc >= step) acc = 0;
        out[i] = n;
    }
}
`,
    },
    cpp: {
      starter: String.raw`#include <vector>

// Returns, for every frame, how many simulation steps ran.
std::vector<int> fixed_steps(const std::vector<int>& frame_ms, int step = 10, int max_steps = 5) {
    return std::vector<int>(frame_ms.size(), 0);
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using V = std::vector<int>;

int main() {
    CHECK(fixed_steps({16, 16, 16}) == V({1, 2, 1}));
    CHECK(fixed_steps({5, 5, 5, 5}) == V({0, 1, 0, 1}));
    CHECK(fixed_steps({35}) == V({3}));
    CHECK(fixed_steps({100, 100}) == V({5, 5}));
    CHECK(fixed_steps({100, 9, 1}) == V({5, 0, 1}));
    CHECK(fixed_steps({50, 7}, 20, 2) == V({2, 0}));
    CHECK(fixed_steps({}).empty());
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <vector>

std::vector<int> fixed_steps(const std::vector<int>& frame_ms, int step = 10, int max_steps = 5) {
    std::vector<int> out;
    int acc = 0;
    for (int t : frame_ms) {
        acc += t;
        int n = 0;
        while (acc >= step && n < max_steps) { acc -= step; ++n; }
        if (acc >= step) acc = 0;
        out.push_back(n);
    }
    return out;
}
`,
    },
  },

  jumper: {
    title: 'Coyote time and jump buffering', minutes: 15, level: 'medium',
    prompt: `<p>Two tricks make platformers feel fair. <b>Coyote time</b>: you may still jump for a few ms after walking off a ledge. <b>Jump buffering</b>: a jump pressed a few ms before landing still fires on landing. Times are in ms.</p>
<ul><li><code>leave_ground(t)</code>: the player walked off a ledge at time <code>t</code>.</li><li><code>press(t, grounded)</code>: jump pressed. Return <code>true</code> if the jump happens now (grounded, or within <code>coyote</code> ms of leaving the ground). Otherwise remember the press and return <code>false</code>. A coyote jump uses up the coyote window (no double jump).</li><li><code>land(t)</code>: the player touched the ground. Return <code>true</code> if a press happened within <code>buffer</code> ms before <code>t</code> (the buffered jump fires). Clear the buffer and coyote state either way.</li></ul>
<p>Both windows default to 100 ms.</p>`,
    hint: 'Keep two optionals: left_at and pressed_at. press: if grounded or (left_at set and t - left_at <= coyote) then clear both and return true, else pressed_at = t. land: clear left_at, fire if pressed_at is set and within buffer, then clear pressed_at.',
    notes: 'Celeste uses roughly 5 frames of coyote time and a similar jump buffer. Players never notice these, only their absence ("the game ate my jump"). The same idea (input forgiveness) applies to attack buffering in action and fighting games.',
    zig: {
      starter: String.raw`const std = @import("std");

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
`,
      tests: String.raw`const expect = std.testing.expect;

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
`,
      solution: String.raw`const std = @import("std");

pub const Jumper = struct {
    coyote: i64 = 100,
    buffer: i64 = 100,
    left_at: ?i64 = null,
    pressed_at: ?i64 = null,

    pub fn leaveGround(self: *Jumper, t: i64) void {
        self.left_at = t;
    }

    pub fn press(self: *Jumper, t: i64, grounded: bool) bool {
        const coyote_ok = if (self.left_at) |l| t - l <= self.coyote else false;
        if (grounded or coyote_ok) {
            self.left_at = null;
            self.pressed_at = null;
            return true;
        }
        self.pressed_at = t;
        return false;
    }

    pub fn land(self: *Jumper, t: i64) bool {
        self.left_at = null;
        const fired = if (self.pressed_at) |p| t - p <= self.buffer else false;
        self.pressed_at = null;
        return fired;
    }
};
`,
    },
    cpp: {
      starter: String.raw`#include <optional>

class Jumper {
public:
    explicit Jumper(int coyote = 100, int buffer = 100) : coyote_(coyote), buffer_(buffer) {}
    void leave_ground(int t) {}
    bool press(int t, bool grounded) { return false; }  // true if the jump happens now
    bool land(int t) { return false; }                  // true if a buffered jump fires
private:
    int coyote_, buffer_;
    std::optional<int> left_at_, pressed_at_;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { Jumper j; CHECK(j.press(0, true)); }
    { Jumper j; CHECK(!j.press(500, false)); }
    { Jumper j; j.leave_ground(1000); CHECK(j.press(1060, false)); }
    { Jumper j; j.leave_ground(1000); CHECK(!j.press(1101, false)); }
    { Jumper j; j.leave_ground(1000); CHECK(j.press(1040, false)); CHECK(!j.press(1060, false)); }
    { Jumper j; CHECK(!j.press(2000, false)); CHECK(j.land(2060)); }
    { Jumper j; j.press(2000, false); CHECK(!j.land(2101)); }
    { Jumper j; j.press(2000, false); CHECK(j.land(2050)); CHECK(!j.land(2060)); }
    { Jumper j; j.leave_ground(100); j.land(120); CHECK(!j.press(150, false)); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <optional>

class Jumper {
public:
    explicit Jumper(int coyote = 100, int buffer = 100) : coyote_(coyote), buffer_(buffer) {}
    void leave_ground(int t) { left_at_ = t; }
    bool press(int t, bool grounded) {
        bool coyote_ok = left_at_ && t - *left_at_ <= coyote_;
        if (grounded || coyote_ok) { left_at_.reset(); pressed_at_.reset(); return true; }
        pressed_at_ = t;
        return false;
    }
    bool land(int t) {
        left_at_.reset();
        bool fired = pressed_at_ && t - *pressed_at_ <= buffer_;
        pressed_at_.reset();
        return fired;
    }
private:
    int coyote_, buffer_;
    std::optional<int> left_at_, pressed_at_;
};
`,
    },
  },

  fsm: {
    title: 'A state machine you cannot misuse', minutes: 15, level: 'easy',
    prompt: `<p>Model a player with three states <code>idle</code>, <code>running</code>, <code>air</code> and five events <code>run</code>, <code>stop</code>, <code>jump</code>, <code>land</code>, <code>wait</code>. The valid transitions:</p>
<table><tr><th>from</th><th>event</th><th>to</th></tr><tr><td>idle</td><td>run</td><td>running</td></tr><tr><td>idle</td><td>jump</td><td>air</td></tr><tr><td>idle</td><td>wait</td><td>idle</td></tr><tr><td>running</td><td>stop</td><td>idle</td></tr><tr><td>running</td><td>jump</td><td>air</td></tr><tr><td>air</td><td>land</td><td>idle</td></tr></table>
<p>Everything else is invalid. <code>transition(state, event)</code> returns the next state or "nothing". <code>Machine::send</code> applies an event: it returns <code>true</code> when the event was valid. It increments <code>enter_count</code> only when the state actually <b>changes</b> (so idle + wait is valid but does not count as entering a state).</p>`,
    hint: 'A nested switch on state, then event. Let the compiler check you covered every state: do not use a default branch on the outer switch.',
    notes: 'Explicit states beat a pile of booleans (is_jumping, is_attacking, can_dash...) because impossible combinations cannot exist. In Godot you would write this as an enum plus match, or as child nodes per state. A pushdown automaton (a stack of states) handles "go back to what I was doing", like hit-stun interrupting a run. In Zig and C++ an exhaustive switch over an enum is a compile error when you add a state and forget a branch.',
    zig: {
      starter: String.raw`const std = @import("std");

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
`,
      tests: String.raw`test "transition table" {
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
`,
      solution: String.raw`const std = @import("std");

pub const State = enum { idle, running, air };
pub const Event = enum { run, stop, jump, land, wait };

pub fn transition(s: State, e: Event) ?State {
    return switch (s) {
        .idle => switch (e) {
            .run => .running,
            .jump => .air,
            .wait => .idle,
            else => null,
        },
        .running => switch (e) {
            .stop => .idle,
            .jump => .air,
            else => null,
        },
        .air => switch (e) {
            .land => .idle,
            else => null,
        },
    };
}

pub const Machine = struct {
    state: State = .idle,
    enter_count: u32 = 0,

    pub fn send(self: *Machine, e: Event) bool {
        const next = transition(self.state, e) orelse return false;
        if (next != self.state) {
            self.state = next;
            self.enter_count += 1;
        }
        return true;
    }
};
`,
    },
    cpp: {
      starter: String.raw`#include <optional>

enum class State { Idle, Running, Air };
enum class Event { Run, Stop, Jump, Land, Wait };

std::optional<State> transition(State s, Event e) {
    return std::nullopt;
}

struct Machine {
    State state = State::Idle;
    int enter_count = 0;
    // true if the event was valid. enter_count only grows when the state changes.
    bool send(Event e) { return false; }
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(transition(State::Idle, Event::Run) == State::Running);
    CHECK(transition(State::Running, Event::Jump) == State::Air);
    CHECK(transition(State::Air, Event::Land) == State::Idle);
    CHECK(!transition(State::Air, Event::Run).has_value());
    CHECK(!transition(State::Running, Event::Land).has_value());
    { Machine m; CHECK(m.send(Event::Run)); CHECK(m.state == State::Running); CHECK(!m.send(Event::Land)); CHECK(m.state == State::Running); }
    { Machine m; m.send(Event::Jump); m.send(Event::Land); CHECK(m.enter_count == 2);
      CHECK(m.send(Event::Wait)); CHECK(m.enter_count == 2); m.send(Event::Stop); CHECK(m.enter_count == 2); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <optional>

enum class State { Idle, Running, Air };
enum class Event { Run, Stop, Jump, Land, Wait };

std::optional<State> transition(State s, Event e) {
    switch (s) {
        case State::Idle:
            if (e == Event::Run) return State::Running;
            if (e == Event::Jump) return State::Air;
            if (e == Event::Wait) return State::Idle;
            return std::nullopt;
        case State::Running:
            if (e == Event::Stop) return State::Idle;
            if (e == Event::Jump) return State::Air;
            return std::nullopt;
        case State::Air:
            if (e == Event::Land) return State::Idle;
            return std::nullopt;
    }
    return std::nullopt;
}

struct Machine {
    State state = State::Idle;
    int enter_count = 0;
    bool send(Event e) {
        auto next = transition(state, e);
        if (!next) return false;
        if (*next != state) { state = *next; ++enter_count; }
        return true;
    }
};
`,
    },
  },

  sparse_set: {
    title: 'Sparse set: the heart of a fast ECS', minutes: 25, level: 'medium',
    prompt: `<p>Entity-component systems store each component type in a <b>sparse set</b>: <code>O(1)</code> add, remove, lookup, and a densely packed array you can iterate without gaps. Implement one with a fixed capacity (ids are <code>0 .. capacity-1</code>).</p>
<ul><li><code>sparse[id]</code> is the index of that id in the dense arrays. <code>dense[i]</code> is the id stored at index <code>i</code>, and <code>values[i]</code> its value. Only the first <code>count</code> dense slots are live.</li><li><code>add(id, value)</code>: returns <code>false</code> if the id is out of range or already present, else stores it at the end.</li><li><code>has(id)</code> and <code>get(id)</code> (optional/null when absent). Careful: a stale <code>sparse</code> entry from a removed id must not fool <code>has</code>. Check that <code>sparse[id] &lt; count</code> and <code>dense[sparse[id]] == id</code>.</li><li><code>remove(id)</code>: <b>swap-remove</b>. Move the last live element into the hole so the array stays packed. Returns whether something was removed.</li><li><code>ids()</code> returns the live ids in dense order.</li></ul>`,
    hint: 'remove: let i = sparse[id], last = count - 1. dense[i] = dense[last], values[i] = values[last], sparse[dense[i]] = i, count -= 1. That also works when i == last.',
    notes: 'Bevy, flecs and EnTT build on this idea (Bevy also has archetype tables). Iterating a dense array is cache friendly, and swap-remove is why entity order is never stable. In Zig this is a comptime-generic function that returns a type, which is how its standard containers (ArrayList, HashMap) are built too.',
    zig: {
      starter: String.raw`const std = @import("std");

pub fn SparseSet(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        sparse: [capacity]u32 = @splat(0), // id -> index into dense
        dense: [capacity]u32 = @splat(0), // index -> id
        values: [capacity]T = undefined, // index -> value
        count: usize = 0,

        pub fn has(self: *const Self, id: u32) bool {
            _ = self;
            _ = id;
            return false;
        }

        /// false if id is out of range or already present
        pub fn add(self: *Self, id: u32, value: T) bool {
            _ = self;
            _ = id;
            _ = value;
            return false;
        }

        pub fn get(self: *const Self, id: u32) ?T {
            _ = self;
            _ = id;
            return null;
        }

        /// swap-remove: keep the dense arrays packed
        pub fn remove(self: *Self, id: u32) bool {
            _ = self;
            _ = id;
            return false;
        }

        pub fn ids(self: *const Self) []const u32 {
            return self.dense[0..self.count];
        }
    };
}
`,
      tests: String.raw`test "add, has, get" {
    var s = SparseSet(i32, 8){};
    try std.testing.expect(s.add(3, 30));
    try std.testing.expect(s.add(5, 50));
    try std.testing.expect(s.has(3));
    try std.testing.expect(!s.has(4));
    try std.testing.expectEqual(@as(?i32, 50), s.get(5));
    try std.testing.expectEqual(@as(?i32, null), s.get(4));
}

test "duplicate and out-of-range adds are refused" {
    var s = SparseSet(i32, 4){};
    try std.testing.expect(s.add(1, 10));
    try std.testing.expect(!s.add(1, 99));
    try std.testing.expectEqual(@as(?i32, 10), s.get(1));
    try std.testing.expect(!s.add(4, 1));
    try std.testing.expect(!s.has(100));
}

test "swap-remove keeps the array packed" {
    var s = SparseSet(i32, 8){};
    _ = s.add(1, 10);
    _ = s.add(2, 20);
    _ = s.add(3, 30);
    try std.testing.expect(s.remove(1));
    try std.testing.expectEqualSlices(u32, &.{ 3, 2 }, s.ids());
    try std.testing.expectEqual(@as(?i32, 30), s.get(3));
    try std.testing.expectEqual(@as(?i32, 20), s.get(2));
    try std.testing.expect(!s.has(1));
    try std.testing.expect(!s.remove(1));
}

test "removing the last element" {
    var s = SparseSet(i32, 4){};
    _ = s.add(0, 5);
    _ = s.add(1, 6);
    try std.testing.expect(s.remove(1));
    try std.testing.expectEqualSlices(u32, &.{0}, s.ids());
    try std.testing.expect(!s.has(1));
}

test "stale sparse entries do not fool has()" {
    var s = SparseSet(i32, 8){};
    _ = s.add(2, 1);
    _ = s.add(6, 2);
    _ = s.remove(6);
    try std.testing.expect(!s.has(6));
    _ = s.add(7, 3);
    try std.testing.expect(!s.has(6));
    try std.testing.expect(s.has(7));
}

test "re-adding after removal" {
    var s = SparseSet(i32, 4){};
    _ = s.add(2, 1);
    _ = s.remove(2);
    try std.testing.expect(s.add(2, 9));
    try std.testing.expectEqual(@as(?i32, 9), s.get(2));
    try std.testing.expectEqual(@as(usize, 1), s.ids().len);
}
`,
      solution: String.raw`const std = @import("std");

pub fn SparseSet(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        sparse: [capacity]u32 = @splat(0),
        dense: [capacity]u32 = @splat(0),
        values: [capacity]T = undefined,
        count: usize = 0,

        pub fn has(self: *const Self, id: u32) bool {
            if (id >= capacity) return false;
            const i = self.sparse[id];
            return i < self.count and self.dense[i] == id;
        }

        pub fn add(self: *Self, id: u32, value: T) bool {
            if (id >= capacity or self.has(id)) return false;
            const i: u32 = @intCast(self.count);
            self.sparse[id] = i;
            self.dense[i] = id;
            self.values[i] = value;
            self.count += 1;
            return true;
        }

        pub fn get(self: *const Self, id: u32) ?T {
            if (!self.has(id)) return null;
            return self.values[self.sparse[id]];
        }

        pub fn remove(self: *Self, id: u32) bool {
            if (!self.has(id)) return false;
            const i = self.sparse[id];
            const last = self.count - 1;
            self.dense[i] = self.dense[last];
            self.values[i] = self.values[last];
            self.sparse[self.dense[i]] = i;
            self.count -= 1;
            return true;
        }

        pub fn ids(self: *const Self) []const u32 {
            return self.dense[0..self.count];
        }
    };
}
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cstdint>
#include <optional>
#include <vector>

template <class T, std::size_t Capacity>
class SparseSet {
public:
    bool has(std::uint32_t id) const { return false; }
    // false if id is out of range or already present
    bool add(std::uint32_t id, T value) { return false; }
    std::optional<T> get(std::uint32_t id) const { return std::nullopt; }
    // swap-remove: keep the dense arrays packed
    bool remove(std::uint32_t id) { return false; }
    std::vector<std::uint32_t> ids() const { return {dense_.begin(), dense_.begin() + count_}; }

private:
    std::array<std::uint32_t, Capacity> sparse_{};  // id -> index into dense_
    std::array<std::uint32_t, Capacity> dense_{};   // index -> id
    std::array<T, Capacity> values_{};              // index -> value
    std::size_t count_ = 0;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Ids = std::vector<std::uint32_t>;

int main() {
    { SparseSet<int, 8> s; CHECK(s.add(3, 30)); CHECK(s.add(5, 50)); CHECK(s.has(3)); CHECK(!s.has(4));
      CHECK(s.get(5) == 50); CHECK(!s.get(4).has_value()); }
    { SparseSet<int, 4> s; CHECK(s.add(1, 10)); CHECK(!s.add(1, 99)); CHECK(s.get(1) == 10); CHECK(!s.add(4, 1)); CHECK(!s.has(100)); }
    { SparseSet<int, 8> s; s.add(1, 10); s.add(2, 20); s.add(3, 30);
      CHECK(s.remove(1)); CHECK(s.ids() == Ids({3, 2})); CHECK(s.get(3) == 30); CHECK(s.get(2) == 20); CHECK(!s.has(1)); CHECK(!s.remove(1)); }
    { SparseSet<int, 4> s; s.add(0, 5); s.add(1, 6); CHECK(s.remove(1)); CHECK(s.ids() == Ids({0})); CHECK(!s.has(1)); }
    { SparseSet<int, 8> s; s.add(2, 1); s.add(6, 2); s.remove(6); CHECK(!s.has(6)); s.add(7, 3); CHECK(!s.has(6)); CHECK(s.has(7)); }
    { SparseSet<int, 4> s; s.add(2, 1); s.remove(2); CHECK(s.add(2, 9)); CHECK(s.get(2) == 9); CHECK(s.ids().size() == 1); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cstdint>
#include <optional>
#include <vector>

template <class T, std::size_t Capacity>
class SparseSet {
public:
    bool has(std::uint32_t id) const {
        if (id >= Capacity) return false;
        std::uint32_t i = sparse_[id];
        return i < count_ && dense_[i] == id;
    }
    bool add(std::uint32_t id, T value) {
        if (id >= Capacity || has(id)) return false;
        std::uint32_t i = static_cast<std::uint32_t>(count_);
        sparse_[id] = i; dense_[i] = id; values_[i] = value;
        ++count_;
        return true;
    }
    std::optional<T> get(std::uint32_t id) const {
        if (!has(id)) return std::nullopt;
        return values_[sparse_[id]];
    }
    bool remove(std::uint32_t id) {
        if (!has(id)) return false;
        std::uint32_t i = sparse_[id];
        std::size_t last = count_ - 1;
        dense_[i] = dense_[last];
        values_[i] = values_[last];
        sparse_[dense_[i]] = i;
        --count_;
        return true;
    }
    std::vector<std::uint32_t> ids() const { return {dense_.begin(), dense_.begin() + count_}; }

private:
    std::array<std::uint32_t, Capacity> sparse_{};
    std::array<std::uint32_t, Capacity> dense_{};
    std::array<T, Capacity> values_{};
    std::size_t count_ = 0;
};
`,
    },
  },

  spatial_hash: {
    title: 'Spatial hash grid for neighbour queries', minutes: 25, level: 'hard',
    prompt: `<p>Checking every pair of 5,000 entities is 12 million tests per frame. A spatial hash buckets entities into square cells so a query only looks near the point.</p>
<p>Build one that you <b>rebuild every frame</b>: <code>clear()</code>, then <code>insert(x, y)</code> for each entity (the returned id is the insertion index 0, 1, 2...), then <code>query(x, y, r)</code> returns the ids of all entities whose distance to <code>(x, y)</code> is at most <code>r</code> (exact distance, not whole cells). Coordinates can be negative. Order of results is unspecified.</p>
<p>Zig version: a fixed number of buckets with an intrusive linked list (<code>heads[bucket]</code>, <code>next[id]</code>), so no allocation. Different cells can share a bucket, so skip entities whose cell is not the one you are visiting, or you will return duplicates. The tests use very few buckets to force collisions. C++ version: use an <code>unordered_map</code> keyed by the cell.</p>`,
    hint: 'cell coordinate = floor(v / cell) (floor, not truncation, or negative coordinates land in the wrong cell). To query: loop cells from floor(x - r) to floor(x + r) on both axes, walk each bucket, re-check the entity actually sits in that cell, then do the exact distance test.',
    notes: 'Choose a cell size near the typical query radius (or the largest entity). Too small and queries visit many empty cells, too large and each cell holds too many entities. Alternatives: a quadtree (uneven density), sweep and prune (mostly 1D motion), or just the engine broadphase (Godot, Box2D and Jolt already do this). Hashing (cx, cy) with large primes and a modulo is the classic scheme from "Optimized Spatial Hashing for Collision Detection of Deformable Objects".',
    zig: {
      starter: String.raw`const std = @import("std");

pub fn SpatialHash(comptime max_entities: usize, comptime buckets: usize) type {
    return struct {
        const Self = @This();

        cell: f32,
        heads: [buckets]i32 = @splat(-1), // bucket -> newest entity id, or -1
        next: [max_entities]i32 = undefined, // entity id -> next entity in the same bucket, or -1
        xs: [max_entities]f32 = undefined,
        ys: [max_entities]f32 = undefined,
        n: usize = 0,

        pub fn init(cell: f32) Self {
            return .{ .cell = cell };
        }

        pub fn clear(self: *Self) void {
            _ = self;
        }

        /// returns the new entity's id (0, 1, 2, ...)
        pub fn insert(self: *Self, x: f32, y: f32) u32 {
            _ = self;
            _ = x;
            _ = y;
            return 0;
        }

        /// writes matching ids into out (at most out.len of them) and returns how many
        pub fn query(self: *const Self, x: f32, y: f32, r: f32, out: []u32) usize {
            _ = self;
            _ = x;
            _ = y;
            _ = r;
            _ = out;
            return 0;
        }
    };
}
`,
      tests: String.raw`const Hash = SpatialHash(64, 4); // 4 buckets: lots of collisions on purpose

fn expectNear(h: *const Hash, x: f32, y: f32, r: f32, expected: []const u32) !void {
    var buf: [64]u32 = undefined;
    const n = h.query(x, y, r, &buf);
    std.mem.sort(u32, buf[0..n], {}, std.sort.asc(u32));
    try std.testing.expectEqualSlices(u32, expected, buf[0..n]);
}

test "finds neighbours within the radius" {
    var h = Hash.init(10);
    _ = h.insert(1, 1);
    _ = h.insert(5, 5);
    _ = h.insert(50, 50);
    try expectNear(&h, 0, 0, 8, &.{ 0, 1 });
}

test "exact distance, not whole cells" {
    var h = Hash.init(10);
    _ = h.insert(9, 9);
    try expectNear(&h, 0, 0, 5, &.{});
    try expectNear(&h, 0, 0, 13, &.{0});
}

test "negative coordinates" {
    var h = Hash.init(10);
    _ = h.insert(-1, -1);
    _ = h.insert(1, 1);
    _ = h.insert(-10, 0);
    try expectNear(&h, 0, 0, 2, &.{ 0, 1 });
    try expectNear(&h, 0, 0, 10, &.{ 0, 1, 2 });
}

test "a radius much larger than a cell" {
    var h = Hash.init(2);
    var i: usize = 0;
    while (i < 20) : (i += 1) _ = h.insert(@floatFromInt(i), 0);
    try expectNear(&h, 10, 0, 3, &.{ 7, 8, 9, 10, 11, 12, 13 });
}

test "no duplicates when cells share a bucket" {
    var h = Hash.init(1);
    var i: usize = 0;
    while (i < 30) : (i += 1) _ = h.insert(@floatFromInt(i), @floatFromInt(i));
    var buf: [64]u32 = undefined;
    const n = h.query(15, 15, 40, &buf);
    try std.testing.expectEqual(@as(usize, 30), n);
}

test "clear empties it, ids restart" {
    var h = Hash.init(10);
    _ = h.insert(0, 0);
    h.clear();
    try expectNear(&h, 0, 0, 5, &.{});
    try std.testing.expectEqual(@as(u32, 0), h.insert(3, 3));
    try expectNear(&h, 0, 0, 5, &.{0});
}
`,
      solution: String.raw`const std = @import("std");

pub fn SpatialHash(comptime max_entities: usize, comptime buckets: usize) type {
    return struct {
        const Self = @This();

        cell: f32,
        heads: [buckets]i32 = @splat(-1),
        next: [max_entities]i32 = undefined,
        xs: [max_entities]f32 = undefined,
        ys: [max_entities]f32 = undefined,
        n: usize = 0,

        pub fn init(cell: f32) Self {
            return .{ .cell = cell };
        }

        fn cellOf(self: *const Self, v: f32) i32 {
            return @intFromFloat(@floor(v / self.cell));
        }

        fn bucketOf(cx: i32, cy: i32) usize {
            const a: u32 = @bitCast(cx);
            const b: u32 = @bitCast(cy);
            return @intCast(((a *% 73856093) ^ (b *% 19349663)) % buckets);
        }

        pub fn clear(self: *Self) void {
            self.heads = @splat(-1);
            self.n = 0;
        }

        pub fn insert(self: *Self, x: f32, y: f32) u32 {
            const id = self.n;
            const b = bucketOf(self.cellOf(x), self.cellOf(y));
            self.xs[id] = x;
            self.ys[id] = y;
            self.next[id] = self.heads[b];
            self.heads[b] = @intCast(id);
            self.n += 1;
            return @intCast(id);
        }

        pub fn query(self: *const Self, x: f32, y: f32, r: f32, out: []u32) usize {
            var count: usize = 0;
            const x0 = self.cellOf(x - r);
            const x1 = self.cellOf(x + r);
            const y0 = self.cellOf(y - r);
            const y1 = self.cellOf(y + r);
            var cy = y0;
            while (cy <= y1) : (cy += 1) {
                var cx = x0;
                while (cx <= x1) : (cx += 1) {
                    var i = self.heads[bucketOf(cx, cy)];
                    while (i >= 0) : (i = self.next[@intCast(i)]) {
                        const u: usize = @intCast(i);
                        if (self.cellOf(self.xs[u]) != cx or self.cellOf(self.ys[u]) != cy) continue;
                        const dx = self.xs[u] - x;
                        const dy = self.ys[u] - y;
                        if (dx * dx + dy * dy <= r * r and count < out.len) {
                            out[count] = @intCast(u);
                            count += 1;
                        }
                    }
                }
            }
            return count;
        }
    };
}
`,
    },
    cpp: {
      starter: String.raw`#include <algorithm>
#include <cmath>
#include <cstdint>
#include <unordered_map>
#include <vector>

class SpatialHash {
public:
    explicit SpatialHash(float cell) : cell_(cell) {}
    void clear() {}
    // returns the new entity's id (0, 1, 2, ...)
    int insert(float x, float y) { return 0; }
    // ids of everything within distance r of (x, y), sorted ascending
    std::vector<int> near(float x, float y, float r) const { return {}; }

private:
    float cell_;
    std::unordered_map<std::int64_t, std::vector<int>> cells_;  // cell key -> entity ids
    std::vector<float> xs_, ys_;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Ids = std::vector<int>;

int main() {
    { SpatialHash h(10); h.insert(1, 1); h.insert(5, 5); h.insert(50, 50); CHECK(h.near(0, 0, 8) == Ids({0, 1})); }
    { SpatialHash h(10); h.insert(9, 9); CHECK(h.near(0, 0, 5).empty()); CHECK(h.near(0, 0, 13) == Ids({0})); }
    { SpatialHash h(10); h.insert(-1, -1); h.insert(1, 1); h.insert(-10, 0);
      CHECK(h.near(0, 0, 2) == Ids({0, 1})); CHECK(h.near(0, 0, 10) == Ids({0, 1, 2})); }
    { SpatialHash h(2); for (int i = 0; i < 20; ++i) h.insert(float(i), 0); CHECK(h.near(10, 0, 3) == Ids({7, 8, 9, 10, 11, 12, 13})); }
    { SpatialHash h(1); for (int i = 0; i < 30; ++i) h.insert(float(i), float(i)); CHECK(h.near(15, 15, 40).size() == 30); }
    { SpatialHash h(10); h.insert(0, 0); h.clear(); CHECK(h.near(0, 0, 5).empty()); CHECK(h.insert(3, 3) == 0); CHECK(h.near(0, 0, 5) == Ids({0})); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <algorithm>
#include <cmath>
#include <cstdint>
#include <unordered_map>
#include <vector>

class SpatialHash {
public:
    explicit SpatialHash(float cell) : cell_(cell) {}
    void clear() { cells_.clear(); xs_.clear(); ys_.clear(); }
    int insert(float x, float y) {
        int id = static_cast<int>(xs_.size());
        xs_.push_back(x); ys_.push_back(y);
        cells_[key(cell_of(x), cell_of(y))].push_back(id);
        return id;
    }
    std::vector<int> near(float x, float y, float r) const {
        std::vector<int> out;
        for (int cy = cell_of(y - r); cy <= cell_of(y + r); ++cy)
            for (int cx = cell_of(x - r); cx <= cell_of(x + r); ++cx) {
                auto it = cells_.find(key(cx, cy));
                if (it == cells_.end()) continue;
                for (int id : it->second) {
                    float dx = xs_[id] - x, dy = ys_[id] - y;
                    if (dx * dx + dy * dy <= r * r) out.push_back(id);
                }
            }
        std::sort(out.begin(), out.end());
        return out;
    }

private:
    int cell_of(float v) const { return static_cast<int>(std::floor(v / cell_)); }
    static std::int64_t key(int cx, int cy) { return (static_cast<std::int64_t>(cx) << 32) ^ static_cast<std::uint32_t>(cy); }
    float cell_;
    std::unordered_map<std::int64_t, std::vector<int>> cells_;
    std::vector<float> xs_, ys_;
};
`,
    },
  },

  accel_clamp: {
    title: 'Acceleration with a speed cap', minutes: 10, level: 'easy',
    prompt: `<p>Implement <code>accelerate(v, a, dt, max_speed)</code>: add <code>a * dt</code> to the velocity, then limit the <b>length</b> of the resulting vector to <code>max_speed</code>, keeping its direction.</p>
<p>The classic bug: clamping x and y separately lets diagonal movement be about 41% faster than straight movement.</p>`,
    hint: 'speed = sqrt(x*x + y*y). If speed > max_speed, multiply both components by max_speed / speed. If speed is 0 you never enter the branch, so there is no division by zero.',
    notes: 'The same idea in one line of GDScript: velocity = velocity.limit_length(max_speed). Normalising input before multiplying by speed is the other half: Input.get_vector() already returns a length-clamped vector, which is why it exists.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Vec2 = struct { x: f32, y: f32 };

pub fn accelerate(v: Vec2, a: Vec2, dt: f32, max_speed: f32) Vec2 {
    _ = a;
    _ = dt;
    _ = max_speed;
    return v;
}
`,
      tests: String.raw`fn expectVec(ex: Vec2, got: Vec2) !void {
    try std.testing.expectApproxEqAbs(ex.x, got.x, 1e-4);
    try std.testing.expectApproxEqAbs(ex.y, got.y, 1e-4);
}

test "below the cap" {
    try expectVec(.{ .x = 3, .y = 4 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = 3, .y = 4 }, 1, 100));
}
test "clamped keeps direction (3-4-5)" {
    try expectVec(.{ .x = 15, .y = 20 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = 30, .y = 40 }, 1, 25));
}
test "diagonal is not faster" {
    const v = accelerate(.{ .x = 0, .y = 0 }, .{ .x = 100, .y = 100 }, 1, 10);
    try std.testing.expectApproxEqAbs(@as(f32, 10), @sqrt(v.x * v.x + v.y * v.y), 1e-4);
    try std.testing.expectApproxEqAbs(v.x, v.y, 1e-4);
}
test "adds to the existing velocity" {
    try expectVec(.{ .x = 2, .y = 2 }, accelerate(.{ .x = 1, .y = 1 }, .{ .x = 2, .y = 2 }, 0.5, 100));
}
test "zero stays zero" {
    try expectVec(.{ .x = 0, .y = 0 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = 0, .y = 0 }, 1, 5));
}
test "negative direction" {
    try expectVec(.{ .x = -15, .y = -20 }, accelerate(.{ .x = 0, .y = 0 }, .{ .x = -30, .y = -40 }, 1, 25));
}
`,
      solution: String.raw`const std = @import("std");

pub const Vec2 = struct { x: f32, y: f32 };

pub fn accelerate(v: Vec2, a: Vec2, dt: f32, max_speed: f32) Vec2 {
    var out = Vec2{ .x = v.x + a.x * dt, .y = v.y + a.y * dt };
    const speed = @sqrt(out.x * out.x + out.y * out.y);
    if (speed > max_speed) {
        const k = max_speed / speed;
        out.x *= k;
        out.y *= k;
    }
    return out;
}
`,
    },
    cpp: {
      starter: String.raw`#include <cmath>

struct Vec2 { float x, y; };

Vec2 accelerate(Vec2 v, Vec2 a, float dt, float max_speed) {
    return v;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool near(float a, float b) { return std::fabs(a - b) < 1e-4f; }
static bool is(Vec2 v, float x, float y) { return near(v.x, x) && near(v.y, y); }

int main() {
    CHECK(is(accelerate({0, 0}, {3, 4}, 1, 100), 3, 4));
    CHECK(is(accelerate({0, 0}, {30, 40}, 1, 25), 15, 20));
    { Vec2 v = accelerate({0, 0}, {100, 100}, 1, 10); CHECK(near(std::sqrt(v.x * v.x + v.y * v.y), 10)); CHECK(near(v.x, v.y)); }
    CHECK(is(accelerate({1, 1}, {2, 2}, 0.5f, 100), 2, 2));
    CHECK(is(accelerate({0, 0}, {0, 0}, 1, 5), 0, 0));
    CHECK(is(accelerate({0, 0}, {-30, -40}, 1, 25), -15, -20));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cmath>

struct Vec2 { float x, y; };

Vec2 accelerate(Vec2 v, Vec2 a, float dt, float max_speed) {
    Vec2 out{v.x + a.x * dt, v.y + a.y * dt};
    float speed = std::sqrt(out.x * out.x + out.y * out.y);
    if (speed > max_speed) {
        float k = max_speed / speed;
        out.x *= k;
        out.y *= k;
    }
    return out;
}
`,
    },
  },

  aabb: {
    title: 'AABB overlap and push-out', minutes: 20, level: 'medium',
    prompt: `<p>Rectangles are <code>{x, y, w, h}</code> with y growing downward (screen coordinates).</p>
<ul><li><code>overlaps(a, b)</code>: true only if the rectangles share area. Touching edges do <b>not</b> count.</li><li><code>push_out(a, b)</code>: the smallest translation that moves <code>a</code> so it no longer overlaps <code>b</code>, along the axis of <b>least penetration</b>. The sign points away from <code>b</code> (compare the rectangle centres). Returns <code>(0, 0)</code> when they do not overlap. If both axes tie, resolve on x.</li></ul>`,
    hint: 'Penetration on x = min(a.right, b.right) - max(a.left, b.left); same for y. Pick the smaller (x on ties). Push negative if a\'s centre is left of (above) b\'s, else positive.',
    notes: 'Resolving along the least-penetration axis is why a character standing on a floor gets pushed up, not sideways. For tile maps the usual trick is to move and resolve one axis at a time (x then y), which also gives clean wall sliding.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Rect = struct { x: f32, y: f32, w: f32, h: f32 };
pub const Vec2 = struct { x: f32, y: f32 };

pub fn overlaps(a: Rect, b: Rect) bool {
    _ = a;
    _ = b;
    return false;
}

/// How far to move a so it stops overlapping b (zero if it does not).
pub fn pushOut(a: Rect, b: Rect) Vec2 {
    _ = a;
    _ = b;
    return .{ .x = 0, .y = 0 };
}
`,
      tests: String.raw`const A = Rect{ .x = 0, .y = 0, .w = 10, .h = 10 };

fn expectPush(ex_x: f32, ex_y: f32, got: Vec2) !void {
    try std.testing.expectApproxEqAbs(ex_x, got.x, 1e-5);
    try std.testing.expectApproxEqAbs(ex_y, got.y, 1e-5);
}

test "overlap" {
    try std.testing.expect(overlaps(A, .{ .x = 5, .y = 5, .w = 10, .h = 10 }));
    try std.testing.expect(overlaps(A, .{ .x = 2, .y = 2, .w = 3, .h = 3 }));
}
test "apart and touching edges" {
    try std.testing.expect(!overlaps(A, .{ .x = 20, .y = 0, .w = 5, .h = 5 }));
    try std.testing.expect(!overlaps(A, .{ .x = 10, .y = 0, .w = 5, .h = 5 }));
}
test "push left and right" {
    try expectPush(-2, 0, pushOut(A, .{ .x = 8, .y = 0, .w = 10, .h = 10 }));
    try expectPush(2, 0, pushOut(.{ .x = 8, .y = 0, .w = 10, .h = 10 }, A));
}
test "push up and down (least penetration is y)" {
    try expectPush(0, -1, pushOut(A, .{ .x = 0, .y = 9, .w = 10, .h = 10 }));
    try expectPush(0, 1, pushOut(.{ .x = 0, .y = 9, .w = 10, .h = 10 }, A));
}
test "no overlap gives zero" {
    try expectPush(0, 0, pushOut(A, .{ .x = 30, .y = 30, .w = 5, .h = 5 }));
}
test "tie resolves on x" {
    try expectPush(-2, 0, pushOut(A, .{ .x = 8, .y = 8, .w = 10, .h = 10 }));
}
`,
      solution: String.raw`const std = @import("std");

pub const Rect = struct { x: f32, y: f32, w: f32, h: f32 };
pub const Vec2 = struct { x: f32, y: f32 };

pub fn overlaps(a: Rect, b: Rect) bool {
    return a.x < b.x + b.w and b.x < a.x + a.w and a.y < b.y + b.h and b.y < a.y + a.h;
}

pub fn pushOut(a: Rect, b: Rect) Vec2 {
    if (!overlaps(a, b)) return .{ .x = 0, .y = 0 };
    const px = @min(a.x + a.w, b.x + b.w) - @max(a.x, b.x);
    const py = @min(a.y + a.h, b.y + b.h) - @max(a.y, b.y);
    if (px <= py) {
        const left = a.x + a.w / 2 < b.x + b.w / 2;
        return .{ .x = if (left) -px else px, .y = 0 };
    }
    const above = a.y + a.h / 2 < b.y + b.h / 2;
    return .{ .x = 0, .y = if (above) -py else py };
}
`,
    },
    cpp: {
      starter: String.raw`#include <algorithm>

struct Rect { float x, y, w, h; };
struct Vec2 { float x, y; };

bool overlaps(const Rect& a, const Rect& b) {
    return false;
}

// How far to move a so it stops overlapping b (zero if it does not).
Vec2 push_out(const Rect& a, const Rect& b) {
    return {0, 0};
}
`,
      tests: String.raw`#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool is(Vec2 v, float x, float y) { return std::fabs(v.x - x) < 1e-5f && std::fabs(v.y - y) < 1e-5f; }

int main() {
    Rect A{0, 0, 10, 10};
    CHECK(overlaps(A, {5, 5, 10, 10}));
    CHECK(overlaps(A, {2, 2, 3, 3}));
    CHECK(!overlaps(A, {20, 0, 5, 5}));
    CHECK(!overlaps(A, {10, 0, 5, 5}));
    CHECK(is(push_out(A, {8, 0, 10, 10}), -2, 0));
    CHECK(is(push_out({8, 0, 10, 10}, A), 2, 0));
    CHECK(is(push_out(A, {0, 9, 10, 10}), 0, -1));
    CHECK(is(push_out({0, 9, 10, 10}, A), 0, 1));
    CHECK(is(push_out(A, {30, 30, 5, 5}), 0, 0));
    CHECK(is(push_out(A, {8, 8, 10, 10}), -2, 0));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <algorithm>

struct Rect { float x, y, w, h; };
struct Vec2 { float x, y; };

bool overlaps(const Rect& a, const Rect& b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

Vec2 push_out(const Rect& a, const Rect& b) {
    if (!overlaps(a, b)) return {0, 0};
    float px = std::min(a.x + a.w, b.x + b.w) - std::max(a.x, b.x);
    float py = std::min(a.y + a.h, b.y + b.h) - std::max(a.y, b.y);
    if (px <= py) {
        bool left = a.x + a.w / 2 < b.x + b.w / 2;
        return {left ? -px : px, 0};
    }
    bool above = a.y + a.h / 2 < b.y + b.h / 2;
    return {0, above ? -py : py};
}
`,
    },
  },

  sweep_hit: {
    title: 'Swept collision time (no tunneling)', minutes: 15, level: 'medium',
    prompt: `<p>A box of width <code>size</code> with left edge at <code>pos</code> moves right by <code>dist</code> this frame. A wall's left face is at <code>wall_left</code>.</p>
<p>Return the fraction <code>t</code> in <code>[0, 1]</code> of this frame's movement at which the box's <b>right edge first touches the wall</b>, or "nothing" if it does not reach the wall this frame, if the wall is already behind or overlapping the box (gap &lt; 0), or if <code>dist &lt;= 0</code>. Touching already (gap == 0) is <code>t = 0</code>.</p>
<p>Unlike testing only the end position, a fast box cannot skip over a thin wall.</p>`,
    hint: 'gap = wall_left - (pos + size). If dist <= 0 or gap < 0 there is no hit. Otherwise t = gap / dist, and there is no hit if t > 1.',
    notes: 'In 2D this becomes ray-vs-expanded-AABB (Minkowski sum), and in engines it is continuous collision detection (Godot: continuous_cd on RigidBody2D, or shape casts for bullets). Cheap alternatives: cap the speed, or substep the physics. Only the left face matters here because the box moves right; a box moving left would use the wall\'s right face.',
    zig: {
      starter: String.raw`const std = @import("std");

pub fn sweepHit(pos: f32, size: f32, dist: f32, wall_left: f32) ?f32 {
    _ = pos;
    _ = size;
    _ = dist;
    _ = wall_left;
    return null;
}
`,
      tests: String.raw`fn expectHit(expected: ?f32, got: ?f32) !void {
    if (expected) |e| {
        try std.testing.expect(got != null);
        try std.testing.expectApproxEqAbs(e, got.?, 1e-5);
    } else {
        try std.testing.expect(got == null);
    }
}

test "hits partway" {
    try expectHit(0.42, sweepHit(0, 8, 100, 50));
}
test "hits at the very end" {
    try expectHit(1.0, sweepHit(0, 10, 40, 50));
}
test "does not reach" {
    try expectHit(null, sweepHit(0, 8, 10, 50));
}
test "a huge step toward a thin wall is still found" {
    try expectHit(0.0196, sweepHit(0, 2, 5000, 100));
}
test "wall behind" {
    try expectHit(null, sweepHit(200, 8, 100, 50));
}
test "moving away" {
    try expectHit(null, sweepHit(0, 8, -100, 50));
}
test "already touching is t = 0" {
    try expectHit(0.0, sweepHit(42, 8, 10, 50));
}
test "already inside" {
    try expectHit(null, sweepHit(46, 8, 10, 50));
}
`,
      solution: String.raw`const std = @import("std");

pub fn sweepHit(pos: f32, size: f32, dist: f32, wall_left: f32) ?f32 {
    if (dist <= 0) return null;
    const gap = wall_left - (pos + size);
    if (gap < 0) return null;
    const t = gap / dist;
    if (t > 1) return null;
    return t;
}
`,
    },
    cpp: {
      starter: String.raw`#include <optional>

std::optional<float> sweep_hit(float pos, float size, float dist, float wall_left) {
    return std::nullopt;
}
`,
      tests: String.raw`#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool hit(std::optional<float> got, float expected) { return got && std::fabs(*got - expected) < 1e-5f; }

int main() {
    CHECK(hit(sweep_hit(0, 8, 100, 50), 0.42f));
    CHECK(hit(sweep_hit(0, 10, 40, 50), 1.0f));
    CHECK(!sweep_hit(0, 8, 10, 50));
    CHECK(hit(sweep_hit(0, 2, 5000, 100), 0.0196f));
    CHECK(!sweep_hit(200, 8, 100, 50));
    CHECK(!sweep_hit(0, 8, -100, 50));
    CHECK(hit(sweep_hit(42, 8, 10, 50), 0.0f));
    CHECK(!sweep_hit(46, 8, 10, 50));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <optional>

std::optional<float> sweep_hit(float pos, float size, float dist, float wall_left) {
    if (dist <= 0) return std::nullopt;
    float gap = wall_left - (pos + size);
    if (gap < 0) return std::nullopt;
    float t = gap / dist;
    if (t > 1) return std::nullopt;
    return t;
}
`,
    },
  },

  damp: {
    title: 'Frame-rate independent smoothing', minutes: 10, level: 'easy',
    prompt: `<p>Smoothing a camera with <code>pos += (target - pos) * 0.1</code> every frame behaves differently at 30 and 144 fps. Implement <code>damp(current, target, k, dt)</code> so it moves toward <code>target</code> exponentially, and running it for 1 second as one step or as 60 steps of 1/60 s gives the same result. The starter is the naive version, which fails the frame-rate test.</p>`,
    hint: 'The exact solution of dp/dt = -k (p - target) is p = target + (p0 - target) * exp(-k * dt). Apply it twice and you get exp(-k * (dt1 + dt2)), which is why splitting the time changes nothing.',
    notes: 'Search for "lerp smoothing is broken" for the well-known talk and write-ups. The naive version is also unstable: with k * dt above 2 it overshoots and oscillates. Godot users often write lerp(a, b, 1.0 - exp(-k * delta)) for exactly this reason.',
    zig: {
      starter: String.raw`const std = @import("std");

pub fn damp(current: f64, target: f64, k: f64, dt: f64) f64 {
    return current + (target - current) * k * dt;
}
`,
      tests: String.raw`test "no time passes" {
    try std.testing.expectApproxEqAbs(@as(f64, 5), damp(5, 10, 3, 0), 1e-12);
}
test "matches the closed form" {
    try std.testing.expectApproxEqAbs(10 * (1 - @exp(@as(f64, -1))), damp(0, 10, 2, 0.5), 1e-9);
}
fn run(fps: usize) f64 {
    var p: f64 = 0;
    var i: usize = 0;
    while (i < fps) : (i += 1) p = damp(p, 10, 4, 1.0 / @as(f64, @floatFromInt(fps)));
    return p;
}
test "same result at any frame rate" {
    try std.testing.expectApproxEqAbs(run(30), run(144), 1e-9);
    try std.testing.expectApproxEqAbs(run(60), run(5), 1e-9);
}
test "never overshoots, even with a huge dt" {
    const v = damp(0, 10, 50, 10);
    try std.testing.expect(v >= 0 and v <= 10);
}
`,
      solution: String.raw`const std = @import("std");

pub fn damp(current: f64, target: f64, k: f64, dt: f64) f64 {
    return target + (current - target) * @exp(-k * dt);
}
`,
    },
    cpp: {
      starter: String.raw`#include <cmath>

double damp(double current, double target, double k, double dt) {
    return current + (target - current) * k * dt;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool close(double a, double b) { return std::fabs(a - b) < 1e-9; }
static double run(int fps) { double p = 0; for (int i = 0; i < fps; ++i) p = damp(p, 10, 4, 1.0 / fps); return p; }

int main() {
    CHECK(close(damp(5, 10, 3, 0), 5));
    CHECK(close(damp(0, 10, 2, 0.5), 10 * (1 - std::exp(-1.0))));
    CHECK(close(run(30), run(144)));
    CHECK(close(run(60), run(5)));
    { double v = damp(0, 10, 50, 10); CHECK(v >= 0 && v <= 10); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cmath>

double damp(double current, double target, double k, double dt) {
    return target + (current - target) * std::exp(-k * dt);
}
`,
    },
  },

  grid_path: {
    title: 'Shortest path on a tile map', minutes: 25, level: 'medium',
    prompt: `<p>The grid is a list of equal-length rows. <code>'#'</code> is a wall, anything else is floor. Return the number of steps of the shortest <b>4-directional</b> path from <code>start</code> to <code>goal</code> (both <code>(row, col)</code>), or <code>-1</code> if there is none. A start or goal inside a wall is unreachable.</p>
<p>Zig: take an allocator and return an error union (you need scratch memory for the search; free it with <code>defer</code>).</p>`,
    hint: 'Breadth-first search: a queue of cell indices and a distance array filled with -1 (doubles as the visited set). Set a cell\'s distance when you enqueue it, not when you pop it, or the queue grows huge on open maps.',
    notes: 'BFS is optimal when every step costs the same. With terrain costs use Dijkstra, and add a heuristic (Manhattan distance on a 4-way grid) to get A*. Games also cache paths, share one flow field between many units, or spread the search across frames. In Zig note how the allocator is an explicit parameter: the caller decides where the memory comes from, which makes tests catch leaks for free (std.testing.allocator fails the test on a leak).',
    zig: {
      starter: String.raw`const std = @import("std");

/// Steps in the shortest 4-directional path, or -1 if unreachable.
pub fn shortestPath(allocator: std.mem.Allocator, grid: []const []const u8, start: [2]usize, goal: [2]usize) !i32 {
    _ = allocator;
    _ = grid;
    _ = start;
    _ = goal;
    return -2;
}
`,
      tests: String.raw`const alloc = std.testing.allocator;

test "around the wall" {
    const g = [_][]const u8{ ".....", ".###.", ".#...", ".#.#.", "....." };
    try std.testing.expectEqual(@as(i32, 6), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 2, 4 }));
}
test "same cell" {
    const g = [_][]const u8{"..."};
    try std.testing.expectEqual(@as(i32, 0), try shortestPath(alloc, &g, .{ 0, 1 }, .{ 0, 1 }));
}
test "blocked" {
    const g = [_][]const u8{ ".#.", ".#.", ".#." };
    try std.testing.expectEqual(@as(i32, -1), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 0, 2 }));
}
test "goal in a wall" {
    const g = [_][]const u8{".#"};
    try std.testing.expectEqual(@as(i32, -1), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 0, 1 }));
}
test "4-directional only" {
    const g = [_][]const u8{ "..", ".." };
    try std.testing.expectEqual(@as(i32, 2), try shortestPath(alloc, &g, .{ 0, 0 }, .{ 1, 1 }));
}
test "large open grid" {
    const n = 300;
    const cells = try alloc.alloc(u8, n * n);
    defer alloc.free(cells);
    @memset(cells, '.');
    const rows = try alloc.alloc([]const u8, n);
    defer alloc.free(rows);
    for (rows, 0..) |*r, i| r.* = cells[i * n ..][0..n];
    try std.testing.expectEqual(@as(i32, 598), try shortestPath(alloc, rows, .{ 0, 0 }, .{ n - 1, n - 1 }));
}
`,
      solution: String.raw`const std = @import("std");

pub fn shortestPath(allocator: std.mem.Allocator, grid: []const []const u8, start: [2]usize, goal: [2]usize) !i32 {
    const rows = grid.len;
    if (rows == 0) return -1;
    const cols = grid[0].len;
    if (start[0] >= rows or start[1] >= cols or goal[0] >= rows or goal[1] >= cols) return -1;
    if (grid[start[0]][start[1]] == '#' or grid[goal[0]][goal[1]] == '#') return -1;

    const dist = try allocator.alloc(i32, rows * cols);
    defer allocator.free(dist);
    @memset(dist, -1);
    const queue = try allocator.alloc(usize, rows * cols);
    defer allocator.free(queue);

    var head: usize = 0;
    var tail: usize = 0;
    const s = start[0] * cols + start[1];
    const g = goal[0] * cols + goal[1];
    dist[s] = 0;
    queue[tail] = s;
    tail += 1;

    const dr = [_]i32{ 1, -1, 0, 0 };
    const dc = [_]i32{ 0, 0, 1, -1 };
    const irows: i32 = @intCast(rows);
    const icols: i32 = @intCast(cols);
    while (head < tail) {
        const cur = queue[head];
        head += 1;
        if (cur == g) return dist[cur];
        const r: i32 = @intCast(cur / cols);
        const c: i32 = @intCast(cur % cols);
        for (0..4) |k| {
            const nr = r + dr[k];
            const nc = c + dc[k];
            if (nr < 0 or nc < 0 or nr >= irows or nc >= icols) continue;
            const ur: usize = @intCast(nr);
            const uc: usize = @intCast(nc);
            const n = ur * cols + uc;
            if (grid[ur][uc] == '#' or dist[n] != -1) continue;
            dist[n] = dist[cur] + 1;
            queue[tail] = n;
            tail += 1;
        }
    }
    return -1;
}
`,
    },
    cpp: {
      starter: String.raw`#include <queue>
#include <string>
#include <utility>
#include <vector>

using Cell = std::pair<int, int>;  // (row, col)

// Steps in the shortest 4-directional path, or -1 if unreachable.
int shortest_path(const std::vector<std::string>& grid, Cell start, Cell goal) {
    return -2;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(shortest_path({".....", ".###.", ".#...", ".#.#.", "....."}, {0, 0}, {2, 4}) == 6);
    CHECK(shortest_path({"..."}, {0, 1}, {0, 1}) == 0);
    CHECK(shortest_path({".#.", ".#.", ".#."}, {0, 0}, {0, 2}) == -1);
    CHECK(shortest_path({".#"}, {0, 0}, {0, 1}) == -1);
    CHECK(shortest_path({"..", ".."}, {0, 0}, {1, 1}) == 2);
    { std::vector<std::string> big(300, std::string(300, '.')); CHECK(shortest_path(big, {0, 0}, {299, 299}) == 598); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <queue>
#include <string>
#include <utility>
#include <vector>

using Cell = std::pair<int, int>;

int shortest_path(const std::vector<std::string>& grid, Cell start, Cell goal) {
    int rows = static_cast<int>(grid.size());
    if (rows == 0) return -1;
    int cols = static_cast<int>(grid[0].size());
    auto ok = [&](Cell c) { return c.first >= 0 && c.second >= 0 && c.first < rows && c.second < cols && grid[c.first][c.second] != '#'; };
    if (!ok(start) || !ok(goal)) return -1;
    std::vector<int> dist(rows * cols, -1);
    std::queue<Cell> q;
    dist[start.first * cols + start.second] = 0;
    q.push(start);
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        Cell cur = q.front(); q.pop();
        int d = dist[cur.first * cols + cur.second];
        if (cur == goal) return d;
        for (int k = 0; k < 4; ++k) {
            Cell n{cur.first + dr[k], cur.second + dc[k]};
            if (!ok(n) || dist[n.first * cols + n.second] != -1) continue;
            dist[n.first * cols + n.second] = d + 1;
            q.push(n);
        }
    }
    return -1;
}
`,
    },
  },

  pity: {
    title: 'Drop rates with a pity timer', minutes: 15, level: 'medium',
    prompt: `<p>Loot systems use a pity timer so bad luck is capped. <code>rolls</code> are random floats in <code>[0, 1)</code>. A roll drops the item if <code>roll &lt; p</code>. Additionally, after <code>pity - 1</code> misses in a row the next roll is a <b>guaranteed</b> drop. Any drop resets the miss counter. Write out one boolean per roll.</p>`,
    hint: 'Keep misses = 0. For each roll: hit = roll < p or misses + 1 >= pity. If hit, misses = 0, else misses += 1.',
    notes: 'With a flat 1% rate, 37% of players still have not seen the item after 100 rolls (0.99^100). A pity timer changes the feel from "unlucky" to "bounded". Many games add soft pity: the rate ramps up after N misses. Disclose the odds: it is increasingly a legal requirement too.',
    zig: {
      starter: String.raw`const std = @import("std");

/// out[i] = whether roll i dropped the item. out.len == rolls.len.
pub fn simulatePity(rolls: []const f32, p: f32, pity: u32, out: []bool) void {
    _ = rolls;
    _ = p;
    _ = pity;
    for (out) |*o| o.* = false;
}
`,
      tests: String.raw`fn expectDrops(rolls: []const f32, p: f32, pity: u32, expected: []const bool) !void {
    var buf: [128]bool = undefined;
    const got = buf[0..rolls.len];
    simulatePity(rolls, p, pity, got);
    try std.testing.expectEqualSlices(bool, expected, got);
}

test "plain drops" {
    try expectDrops(&.{ 0.1, 0.9, 0.04 }, 0.05, 90, &.{ false, false, true });
}
test "pity guarantees the 3rd roll" {
    try expectDrops(&.{ 0.9, 0.9, 0.9 }, 0.05, 3, &.{ false, false, true });
}
test "counter resets after a pity drop" {
    try expectDrops(&.{ 0.9, 0.9, 0.9, 0.9, 0.9, 0.9 }, 0.05, 3, &.{ false, false, true, false, false, true });
}
test "a natural drop also resets" {
    try expectDrops(&.{ 0.9, 0.01, 0.9, 0.9, 0.9 }, 0.05, 3, &.{ false, true, false, false, true });
}
test "pity of 1 always drops" {
    try expectDrops(&.{ 0.99, 0.99 }, 0.05, 1, &.{ true, true });
}
test "the gap between drops is bounded" {
    const rolls: [100]f32 = @splat(0.99);
    var out: [100]bool = undefined;
    simulatePity(&rolls, 0.01, 10, &out);
    var gap: u32 = 0;
    var worst: u32 = 0;
    for (out) |d| {
        gap = if (d) 0 else gap + 1;
        worst = @max(worst, gap);
    }
    try std.testing.expectEqual(@as(u32, 9), worst);
}
`,
      solution: String.raw`const std = @import("std");

pub fn simulatePity(rolls: []const f32, p: f32, pity: u32, out: []bool) void {
    var misses: u32 = 0;
    for (rolls, 0..) |r, i| {
        const hit = r < p or misses + 1 >= pity;
        misses = if (hit) 0 else misses + 1;
        out[i] = hit;
    }
}
`,
    },
    cpp: {
      starter: String.raw`#include <vector>

// One boolean per roll: did it drop?
std::vector<bool> simulate_pity(const std::vector<float>& rolls, float p, int pity) {
    return std::vector<bool>(rolls.size(), false);
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using B = std::vector<bool>;

int main() {
    CHECK(simulate_pity({0.1f, 0.9f, 0.04f}, 0.05f, 90) == B({false, false, true}));
    CHECK(simulate_pity({0.9f, 0.9f, 0.9f}, 0.05f, 3) == B({false, false, true}));
    CHECK(simulate_pity(std::vector<float>(6, 0.9f), 0.05f, 3) == B({false, false, true, false, false, true}));
    CHECK(simulate_pity({0.9f, 0.01f, 0.9f, 0.9f, 0.9f}, 0.05f, 3) == B({false, true, false, false, true}));
    CHECK(simulate_pity({0.99f, 0.99f}, 0.05f, 1) == B({true, true}));
    { auto out = simulate_pity(std::vector<float>(100, 0.99f), 0.01f, 10); int gap = 0, worst = 0;
      for (bool d : out) { gap = d ? 0 : gap + 1; if (gap > worst) worst = gap; } CHECK(worst == 9); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <vector>

std::vector<bool> simulate_pity(const std::vector<float>& rolls, float p, int pity) {
    std::vector<bool> out;
    int misses = 0;
    for (float r : rolls) {
        bool hit = r < p || misses + 1 >= pity;
        misses = hit ? 0 : misses + 1;
        out.push_back(hit);
    }
    return out;
}
`,
    },
  },

  upgrade_cost: {
    title: 'Exponential upgrade costs', minutes: 10, level: 'easy',
    prompt: `<p>Idle and incremental games price level <code>n</code> at <code>base * growth ^ n</code>, rounded <b>down</b> to a whole number. Implement <code>upgrade_cost(base, growth, level)</code> and <code>levels_affordable(budget, base, growth)</code>: how many upgrades in a row you can buy starting from level 0 with that budget (buy level 0, then 1, ...).</p>`,
    hint: 'Loop: spent = 0, level = 0; while spent + cost(level) <= budget { spent += cost(level); level += 1 }. pow(growth, level) returns a float, so floor it before converting to an integer.',
    notes: 'Cost grows exponentially while income usually grows only linearly or polynomially, so the time between upgrades keeps stretching. That tension is the whole design of an incremental game: a growth factor around 1.07 to 1.15 per level is common (Cookie Clicker buildings use 1.15). Resets ("prestige") trade progress for a multiplier and restart the curve.',
    zig: {
      starter: String.raw`const std = @import("std");

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
`,
      tests: String.raw`test "cost" {
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
`,
      solution: String.raw`const std = @import("std");

pub fn upgradeCost(base: u64, growth: f64, level: u32) u64 {
    const b: f64 = @floatFromInt(base);
    const l: f64 = @floatFromInt(level);
    return @intFromFloat(@floor(b * std.math.pow(f64, growth, l)));
}

pub fn levelsAffordable(budget: u64, base: u64, growth: f64) u32 {
    var spent: u64 = 0;
    var level: u32 = 0;
    while (spent + upgradeCost(base, growth, level) <= budget) : (level += 1) {
        spent += upgradeCost(base, growth, level);
    }
    return level;
}
`,
    },
    cpp: {
      starter: String.raw`#include <cmath>
#include <cstdint>

std::uint64_t upgrade_cost(std::uint64_t base, double growth, unsigned level) {
    return 0;
}

unsigned levels_affordable(std::uint64_t budget, std::uint64_t base, double growth) {
    return 0;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(upgrade_cost(10, 2, 3) == 80);
    CHECK(upgrade_cost(10, 1.5, 2) == 22);
    CHECK(upgrade_cost(7, 3, 0) == 7);
    CHECK(levels_affordable(70, 10, 2) == 3);
    CHECK(levels_affordable(150, 10, 2) == 4);
    CHECK(levels_affordable(5, 10, 2) == 0);
    CHECK(levels_affordable(1000000, 10, 1.15) > levels_affordable(1000000, 10, 2));
    CHECK(levels_affordable(2000, 10, 2) - levels_affordable(100, 10, 2) == 4);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cmath>
#include <cstdint>

std::uint64_t upgrade_cost(std::uint64_t base, double growth, unsigned level) {
    return static_cast<std::uint64_t>(std::floor(static_cast<double>(base) * std::pow(growth, level)));
}

unsigned levels_affordable(std::uint64_t budget, std::uint64_t base, double growth) {
    std::uint64_t spent = 0;
    unsigned level = 0;
    while (spent + upgrade_cost(base, growth, level) <= budget) {
        spent += upgrade_cost(base, growth, level);
        ++level;
    }
    return level;
}
`,
    },
  },

  rng_lcg: {
    title: 'A seeded random number generator', minutes: 15, level: 'medium',
    prompt: `<p>Procedural levels, replays and "daily seeds" need a deterministic RNG you control. Implement a linear congruential generator. The state update is <code>state = (1103515245 * state + 12345) mod 2^31</code>, starting from <code>seed mod 2^31</code>.</p>
<ul><li><code>next_int(n)</code>: update the state once, return <code>(state &gt;&gt; 16) % n</code>. The low bits of an LCG are weak, so use the high ones.</li><li><code>next_float()</code>: update the state once, return <code>state / 2^31</code> as a double.</li></ul>`,
    hint: 'Use 64-bit integers: 1103515245 * (2^31 - 1) is about 2.4e18, which fits in u64 / uint64_t without overflow, so you can take the modulo afterwards.',
    notes: 'Never use a global random for gameplay: you cannot replay it, and any extra call (a particle spawn!) shifts every later result. Keep separate streams per concern (loot, level generation, cosmetic effects). Godot has RandomNumberGenerator with a seed; PCG and xoshiro are far better generators than this LCG, which is for teaching. Zig ships std.Random.DefaultPrng (xoshiro) and C++ has <random>.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Rng = struct {
    state: u64,

    pub fn init(seed: u64) Rng {
        _ = seed;
        return .{ .state = 0 };
    }

    pub fn nextInt(self: *Rng, n: u32) u32 {
        _ = self;
        _ = n;
        return 0;
    }

    pub fn nextFloat(self: *Rng) f64 {
        _ = self;
        return 0;
    }
};
`,
      tests: String.raw`test "known sequence for seed 42" {
    var r = Rng.init(42);
    const expected = [_]u32{ 81, 33, 69, 61, 56, 93 };
    for (expected) |e| try std.testing.expectEqual(e, r.nextInt(100));
}
test "known floats for seed 7" {
    var r = Rng.init(7);
    try std.testing.expectApproxEqAbs(@as(f64, 0.5970560554414988), r.nextFloat(), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.29926483193412423), r.nextFloat(), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.3316746735945344), r.nextFloat(), 1e-12);
}
test "same seed gives the same numbers, different seeds differ" {
    var a = Rng.init(9);
    var b = Rng.init(9);
    var c = Rng.init(10);
    var same = true;
    var differs = false;
    for (0..20) |_| {
        const x = a.nextInt(1000);
        if (x != b.nextInt(1000)) same = false;
        if (x != c.nextInt(1000)) differs = true;
    }
    try std.testing.expect(same);
    try std.testing.expect(differs);
}
test "floats stay in [0, 1) with a sane mean" {
    var r = Rng.init(5);
    var sum: f64 = 0;
    for (0..1000) |_| {
        const f = r.nextFloat();
        try std.testing.expect(f >= 0 and f < 1);
        sum += f;
    }
    try std.testing.expect(sum / 1000 > 0.4 and sum / 1000 < 0.6);
}
`,
      solution: String.raw`const std = @import("std");

pub const Rng = struct {
    const M: u64 = 1 << 31;
    state: u64,

    pub fn init(seed: u64) Rng {
        return .{ .state = seed % M };
    }

    fn step(self: *Rng) u64 {
        self.state = (1103515245 * self.state + 12345) % M;
        return self.state;
    }

    pub fn nextInt(self: *Rng, n: u32) u32 {
        return @intCast((self.step() >> 16) % n);
    }

    pub fn nextFloat(self: *Rng) f64 {
        return @as(f64, @floatFromInt(self.step())) / @as(f64, @floatFromInt(M));
    }
};
`,
    },
    cpp: {
      starter: String.raw`#include <cstdint>

class Rng {
public:
    explicit Rng(std::uint64_t seed) {}
    std::uint32_t next_int(std::uint32_t n) { return 0; }
    double next_float() { return 0; }
private:
    std::uint64_t state_ = 0;
};
`,
      tests: String.raw`#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { Rng r(42); const unsigned e[] = {81, 33, 69, 61, 56, 93}; for (unsigned v : e) CHECK(r.next_int(100) == v); }
    { Rng r(7); CHECK(std::fabs(r.next_float() - 0.5970560554414988) < 1e-12); CHECK(std::fabs(r.next_float() - 0.29926483193412423) < 1e-12);
      CHECK(std::fabs(r.next_float() - 0.3316746735945344) < 1e-12); }
    { Rng a(9), b(9), c(10); bool same = true, differs = false;
      for (int i = 0; i < 20; ++i) { auto x = a.next_int(1000); if (x != b.next_int(1000)) same = false; if (x != c.next_int(1000)) differs = true; }
      CHECK(same); CHECK(differs); }
    { Rng r(5); double sum = 0; bool inrange = true;
      for (int i = 0; i < 1000; ++i) { double f = r.next_float(); if (f < 0 || f >= 1) inrange = false; sum += f; }
      CHECK(inrange); CHECK(sum / 1000 > 0.4 && sum / 1000 < 0.6); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cstdint>

class Rng {
public:
    explicit Rng(std::uint64_t seed) : state_(seed % M) {}
    std::uint32_t next_int(std::uint32_t n) { return static_cast<std::uint32_t>((step() >> 16) % n); }
    double next_float() { return static_cast<double>(step()) / static_cast<double>(M); }
private:
    static constexpr std::uint64_t M = 1ull << 31;
    std::uint64_t step() { state_ = (1103515245ull * state_ + 12345ull) % M; return state_; }
    std::uint64_t state_;
};
`,
    },
  },

  ca_smooth: {
    title: 'Cave generation: one smoothing step', minutes: 20, level: 'medium',
    prompt: `<p>Cellular-automata caves start from random noise and repeatedly apply one rule. Write <code>smooth</code>: the map is a grid of <code>'#'</code> (wall) and <code>'.'</code> (floor). A cell of the next generation is a wall if <b>5 or more of its 8 neighbours</b> are walls, otherwise floor. Cells outside the map count as walls. Read only from the old generation. Try the same rule in the cave simulation above.</p>
<p>Zig: the map is a flat <code>w * h</code> byte slice, write the result into <code>dst</code>. C++: rows as strings, return the new grid.</p>`,
    hint: 'For every cell loop dr, dc over -1..1 except (0,0). A neighbour outside the grid counts as a wall. Compare the count with 5. Never write into the grid you are reading from. Note a 2x2 map: every cell has 5 outside neighbours, so all four become walls.',
    notes: 'Typical recipe: fill about 45% walls, run 4 or 5 smoothing steps, then flood-fill to find the caves and either keep the biggest or tunnel between them. Other generators: random-walk "drunkard" digging, BSP rooms, Wave Function Collapse for tile consistency.',
    zig: {
      starter: String.raw`const std = @import("std");

/// src and dst are w*h bytes, row-major. '#' wall, '.' floor.
pub fn smooth(src: []const u8, w: usize, h: usize, dst: []u8) void {
    _ = w;
    _ = h;
    @memcpy(dst, src);
}
`,
      tests: String.raw`fn expectSmooth(src: []const u8, w: usize, h: usize, expected: []const u8) !void {
    var buf: [64]u8 = undefined;
    const dst = buf[0 .. w * h];
    smooth(src, w, h, dst);
    try std.testing.expectEqualStrings(expected, dst);
}

test "open field: corners close, edges stay open" {
    try expectSmooth("..." ++ "..." ++ "...", 3, 3, "#.#" ++ "..." ++ "#.#");
}
test "solid stays solid" {
    try expectSmooth("###" ++ "###" ++ "###", 3, 3, "###" ++ "###" ++ "###");
}
test "a lone wall in a big room is erased" {
    var src: [25]u8 = @splat('.');
    src[12] = '#';
    var dst: [25]u8 = undefined;
    smooth(&src, 5, 5, &dst);
    try std.testing.expectEqual(@as(u8, '.'), dst[12]);
}
test "a 2x2 map closes completely (every cell has 5 outside neighbours)" {
    try expectSmooth("#." ++ "..", 2, 2, "##" ++ "##");
}
test "reads only the old generation (corner walls close the edges, the centre opens)" {
    try expectSmooth("#.#" ++ "..." ++ "#.#", 3, 3, "###" ++ "#.#" ++ "###");
}
`,
      solution: String.raw`const std = @import("std");

pub fn smooth(src: []const u8, w: usize, h: usize, dst: []u8) void {
    const iw: i32 = @intCast(w);
    const ih: i32 = @intCast(h);
    for (0..h) |y| {
        for (0..w) |x| {
            var walls: u32 = 0;
            var dy: i32 = -1;
            while (dy <= 1) : (dy += 1) {
                var dx: i32 = -1;
                while (dx <= 1) : (dx += 1) {
                    if (dx == 0 and dy == 0) continue;
                    const nx = @as(i32, @intCast(x)) + dx;
                    const ny = @as(i32, @intCast(y)) + dy;
                    if (nx < 0 or ny < 0 or nx >= iw or ny >= ih) {
                        walls += 1;
                    } else if (src[@as(usize, @intCast(ny)) * w + @as(usize, @intCast(nx))] == '#') {
                        walls += 1;
                    }
                }
            }
            dst[y * w + x] = if (walls >= 5) '#' else '.';
        }
    }
}
`,
    },
    cpp: {
      starter: String.raw`#include <string>
#include <vector>

std::vector<std::string> smooth(const std::vector<std::string>& grid) {
    return grid;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using G = std::vector<std::string>;

int main() {
    CHECK(smooth({"...", "...", "..."}) == G({"#.#", "...", "#.#"}));
    CHECK(smooth({"###", "###", "###"}) == G({"###", "###", "###"}));
    { G g(5, std::string(5, '.')); g[2][2] = '#'; CHECK(smooth(g)[2][2] == '.'); }
    CHECK(smooth({"#.", ".."}) == G({"##", "##"}));
    { G g{"..#", ".#.", "#.."}; G before = g; smooth(g); CHECK(g == before); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <string>
#include <vector>

std::vector<std::string> smooth(const std::vector<std::string>& grid) {
    int h = static_cast<int>(grid.size());
    int w = h ? static_cast<int>(grid[0].size()) : 0;
    std::vector<std::string> out(h, std::string(w, '.'));
    for (int y = 0; y < h; ++y)
        for (int x = 0; x < w; ++x) {
            int walls = 0;
            for (int dy = -1; dy <= 1; ++dy)
                for (int dx = -1; dx <= 1; ++dx) {
                    if (dx == 0 && dy == 0) continue;
                    int nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h || grid[ny][nx] == '#') ++walls;
                }
            if (walls >= 5) out[y][x] = '#';
        }
    return out;
}
`,
    },
  },

  save_codec: {
    title: 'A versioned binary save format', minutes: 25, level: 'medium',
    prompt: `<p>Saves outlive your code. Implement <code>encode</code> and <code>decode</code> for this layout (all multi-byte integers <b>little-endian</b>):</p>
<table><tr><th>version</th><th>bytes</th></tr>
<tr><td><b>2</b> (current, 9 bytes)</td><td><code>'S'</code> (0x53), <code>2</code>, coins u32, level u16, checksum</td></tr>
<tr><td><b>1</b> (old, 6 bytes)</td><td><code>'S'</code>, <code>1</code>, coins <b>u16</b>, level <b>u8</b>, checksum</td></tr></table>
<p>The checksum is the sum of all the bytes before it, modulo 256. <code>encode</code> always writes version 2. <code>decode</code> accepts both versions (migrating v1 to the current <code>Save</code> struct) and returns "nothing" for a wrong length, bad magic byte, unknown version or bad checksum. It must never read out of bounds.</p>`,
    hint: 'Check the length first, then the magic byte, then the version, then the checksum. Zig: std.mem.writeInt(u32, buf[2..6], value, .little) and std.mem.readInt(u32, bytes[2..6], .little). C++: shift and mask yourself.',
    notes: 'Always write a version number from day one. Never edit an old migration step, only append new ones, and keep a test fixture per historical version. Write saves to a temp file and rename it over the old one so a crash mid-write cannot destroy the player\'s progress. Never trust the bytes: a corrupt or hand-edited save must fail cleanly, not crash or read past the buffer (this is also how most real-world game exploits start).',
    zig: {
      starter: String.raw`const std = @import("std");

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
`,
      tests: String.raw`test "known bytes" {
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
`,
      solution: String.raw`const std = @import("std");

pub const Save = struct { coins: u32, level: u16 };
pub const size = 9;

fn checksum(bytes: []const u8) u8 {
    var sum: u8 = 0;
    for (bytes) |b| sum +%= b;
    return sum;
}

pub fn encode(s: Save) [size]u8 {
    var buf: [size]u8 = undefined;
    buf[0] = 'S';
    buf[1] = 2;
    std.mem.writeInt(u32, buf[2..6], s.coins, .little);
    std.mem.writeInt(u16, buf[6..8], s.level, .little);
    buf[8] = checksum(buf[0..8]);
    return buf;
}

pub fn decode(bytes: []const u8) ?Save {
    if (bytes.len < 2 or bytes[0] != 'S') return null;
    switch (bytes[1]) {
        2 => {
            if (bytes.len != 9 or bytes[8] != checksum(bytes[0..8])) return null;
            return .{ .coins = std.mem.readInt(u32, bytes[2..6], .little), .level = std.mem.readInt(u16, bytes[6..8], .little) };
        },
        1 => {
            if (bytes.len != 6 or bytes[5] != checksum(bytes[0..5])) return null;
            return .{ .coins = std.mem.readInt(u16, bytes[2..4], .little), .level = bytes[4] };
        },
        else => return null,
    }
}
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cstdint>
#include <optional>
#include <vector>

struct Save { std::uint32_t coins; std::uint16_t level; };

std::array<std::uint8_t, 9> encode(Save s) {
    return {};
}

std::optional<Save> decode(const std::vector<std::uint8_t>& bytes) {
    return std::nullopt;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Bytes = std::vector<std::uint8_t>;

int main() {
    { auto b = encode({0x01020304, 0x0506}); CHECK(Bytes(b.begin(), b.end()) == Bytes({0x53, 2, 4, 3, 2, 1, 6, 5, 0x6A})); }
    { auto b = encode({123456, 77}); auto got = decode(Bytes(b.begin(), b.end())); CHECK(got && got->coins == 123456 && got->level == 77); }
    { auto got = decode({0x53, 1, 0x2C, 0x01, 7, 0x88}); CHECK(got && got->coins == 300 && got->level == 7); }
    CHECK(!decode({}));
    CHECK(!decode({0x53, 2, 4, 3}));
    CHECK(!decode({0x54, 2, 4, 3, 2, 1, 6, 5, 0x6B}));
    CHECK(!decode({0x53, 2, 4, 3, 2, 1, 6, 5, 0x00}));
    CHECK(!decode({0x53, 3, 0, 0, 0, 0, 0, 0, 0x56}));
    CHECK(!decode({0x53, 2, 0x2C, 0x01, 7, 0x88}));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cstdint>
#include <optional>
#include <vector>

struct Save { std::uint32_t coins; std::uint16_t level; };

static std::uint8_t checksum(const std::uint8_t* p, std::size_t n) {
    std::uint8_t sum = 0;
    for (std::size_t i = 0; i < n; ++i) sum = static_cast<std::uint8_t>(sum + p[i]);
    return sum;
}

std::array<std::uint8_t, 9> encode(Save s) {
    std::array<std::uint8_t, 9> b{};
    b[0] = 'S'; b[1] = 2;
    for (int i = 0; i < 4; ++i) b[2 + i] = static_cast<std::uint8_t>(s.coins >> (8 * i));
    b[6] = static_cast<std::uint8_t>(s.level);
    b[7] = static_cast<std::uint8_t>(s.level >> 8);
    b[8] = checksum(b.data(), 8);
    return b;
}

std::optional<Save> decode(const std::vector<std::uint8_t>& b) {
    if (b.size() < 2 || b[0] != 'S') return std::nullopt;
    if (b[1] == 2) {
        if (b.size() != 9 || b[8] != checksum(b.data(), 8)) return std::nullopt;
        std::uint32_t coins = b[2] | (b[3] << 8) | (b[4] << 16) | (static_cast<std::uint32_t>(b[5]) << 24);
        return Save{coins, static_cast<std::uint16_t>(b[6] | (b[7] << 8))};
    }
    if (b[1] == 1) {
        if (b.size() != 6 || b[5] != checksum(b.data(), 5)) return std::nullopt;
        return Save{static_cast<std::uint32_t>(b[2] | (b[3] << 8)), b[4]};
    }
    return std::nullopt;
}
`,
    },
  },

  autotile: {
    title: 'Autotile bitmask', minutes: 15, level: 'easy',
    prompt: `<p>Tile maps pick the right edge or corner sprite from which neighbours are solid. Return a 4-bit number: <b>N = 1, E = 2, S = 4, W = 8</b>, each bit set when that neighbour is <code>'#'</code>. Cells <b>outside</b> the map count as solid, so the map border joins up. The result selects one of 16 tiles.</p>`,
    hint: 'A helper solid(row, col) that returns true when the coordinates are outside the map or the character is #. Use signed integers for the neighbour coordinates: row - 1 on an unsigned 0 wraps around.',
    notes: 'This is the 16-tile (4-bit) scheme. Adding the diagonals gives the 47-tile "blob" set, which needs corner checks so inner corners look right. Godot 4 terrain tiles do the matching for you, but you still have to draw the tiles. Draw the 16 first, then expand. (The unsigned wrap-around in the hint is a real bug source in C++ and Zig; Zig catches it in Debug builds with a panic.)',
    zig: {
      starter: String.raw`const std = @import("std");

pub fn bitmask(grid: []const []const u8, row: usize, col: usize) u8 {
    _ = grid;
    _ = row;
    _ = col;
    return 0;
}
`,
      tests: String.raw`test "fully surrounded" {
    const g = [_][]const u8{ "###", "#.#", "###" };
    try std.testing.expectEqual(@as(u8, 15), bitmask(&g, 1, 1));
}
test "lone tile in open space" {
    const g = [_][]const u8{ "...", ".#.", "..." };
    try std.testing.expectEqual(@as(u8, 0), bitmask(&g, 1, 1));
}
test "north only" {
    const g = [_][]const u8{ ".#.", ".#.", "..." };
    try std.testing.expectEqual(@as(u8, 1), bitmask(&g, 1, 1));
}
test "east and south" {
    const g = [_][]const u8{ "...", ".##", ".#." };
    try std.testing.expectEqual(@as(u8, 6), bitmask(&g, 1, 1));
}
test "west only" {
    const g = [_][]const u8{ "...", "##.", "..." };
    try std.testing.expectEqual(@as(u8, 8), bitmask(&g, 1, 1));
}
test "top-left corner: north and west are outside the map" {
    const g = [_][]const u8{ "#.", ".." };
    try std.testing.expectEqual(@as(u8, 9), bitmask(&g, 0, 0));
}
test "bottom-right corner: east and south are outside" {
    const g = [_][]const u8{ "..", ".#" };
    try std.testing.expectEqual(@as(u8, 6), bitmask(&g, 1, 1));
}
`,
      solution: String.raw`const std = @import("std");

fn solid(grid: []const []const u8, row: isize, col: isize) bool {
    if (row < 0 or col < 0) return true;
    if (row >= grid.len or col >= grid[0].len) return true;
    return grid[@intCast(row)][@intCast(col)] == '#';
}

pub fn bitmask(grid: []const []const u8, row: usize, col: usize) u8 {
    const r: isize = @intCast(row);
    const c: isize = @intCast(col);
    var m: u8 = 0;
    if (solid(grid, r - 1, c)) m |= 1;
    if (solid(grid, r, c + 1)) m |= 2;
    if (solid(grid, r + 1, c)) m |= 4;
    if (solid(grid, r, c - 1)) m |= 8;
    return m;
}
`,
    },
    cpp: {
      starter: String.raw`#include <string>
#include <vector>

int bitmask(const std::vector<std::string>& grid, int row, int col) {
    return 0;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(bitmask({"###", "#.#", "###"}, 1, 1) == 15);
    CHECK(bitmask({"...", ".#.", "..."}, 1, 1) == 0);
    CHECK(bitmask({".#.", ".#.", "..."}, 1, 1) == 1);
    CHECK(bitmask({"...", ".##", ".#."}, 1, 1) == 6);
    CHECK(bitmask({"...", "##.", "..."}, 1, 1) == 8);
    CHECK(bitmask({"#.", ".."}, 0, 0) == 9);
    CHECK(bitmask({"..", ".#"}, 1, 1) == 6);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <string>
#include <vector>

static bool solid(const std::vector<std::string>& g, int r, int c) {
    if (r < 0 || c < 0 || r >= static_cast<int>(g.size()) || c >= static_cast<int>(g[0].size())) return true;
    return g[r][c] == '#';
}

int bitmask(const std::vector<std::string>& grid, int row, int col) {
    return (solid(grid, row - 1, col) ? 1 : 0) | (solid(grid, row, col + 1) ? 2 : 0) |
           (solid(grid, row + 1, col) ? 4 : 0) | (solid(grid, row, col - 1) ? 8 : 0);
}
`,
    },
  },

  quantize: {
    title: 'Snap an image to a palette', minutes: 15, level: 'easy',
    prompt: `<p>Implement <code>nearest_index(rgb, palette)</code>: the index of the palette colour closest to <code>rgb</code> by squared Euclidean distance in RGB. The <b>first</b> one wins a tie. Then <code>quantize(pixels, palette, out)</code> maps a list of pixels to a list of palette indices (this is how a PNG becomes an indexed image).</p>`,
    hint: 'Squared distance in a wider type (i32): 255 * 255 * 3 does not fit in u8 arithmetic. Keep the best distance so far and only replace it when the new one is strictly smaller, which gives you the tie rule.',
    notes: 'RGB distance is crude: human vision weighs green more and is not linear, so tools use perceptual spaces such as Oklab. Plain nearest-colour also bands; add dithering (see the dither simulation) to keep gradients. Working with an indexed palette is also what gives you palette swaps (enemy recolours) for free, and what Aseprite and most retro hardware used.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Rgb = [3]u8;

pub fn nearestIndex(c: Rgb, palette: []const Rgb) usize {
    _ = c;
    _ = palette;
    return 0;
}

/// out[i] = palette index for pixels[i]. out.len == pixels.len.
pub fn quantize(pixels: []const Rgb, palette: []const Rgb, out: []usize) void {
    _ = pixels;
    _ = palette;
    for (out) |*o| o.* = 0;
}
`,
      tests: String.raw`const P = [_]Rgb{ .{ 0, 0, 0 }, .{ 255, 255, 255 }, .{ 255, 0, 0 } };

test "exact and nearest" {
    try std.testing.expectEqual(@as(usize, 2), nearestIndex(.{ 255, 0, 0 }, &P));
    try std.testing.expectEqual(@as(usize, 2), nearestIndex(.{ 200, 30, 30 }, &P));
    try std.testing.expectEqual(@as(usize, 0), nearestIndex(.{ 60, 60, 60 }, &P));
    try std.testing.expectEqual(@as(usize, 1), nearestIndex(.{ 250, 250, 250 }, &P));
}
test "ties go to the first colour" {
    const pal = [_]Rgb{ .{ 0, 0, 0 }, .{ 2, 2, 2 } };
    try std.testing.expectEqual(@as(usize, 0), nearestIndex(.{ 1, 1, 1 }, &pal));
}
test "quantize an image" {
    const px = [_]Rgb{ .{ 10, 10, 10 }, .{ 250, 250, 250 }, .{ 240, 10, 10 }, .{ 0, 0, 0 } };
    var out: [4]usize = undefined;
    quantize(&px, &P, &out);
    try std.testing.expectEqualSlices(usize, &.{ 0, 1, 2, 0 }, &out);
}
test "empty image" {
    var out: [0]usize = undefined;
    quantize(&.{}, &P, &out);
}
`,
      solution: String.raw`const std = @import("std");

pub const Rgb = [3]u8;

fn dist2(a: Rgb, b: Rgb) i32 {
    var d: i32 = 0;
    for (0..3) |i| {
        const diff = @as(i32, a[i]) - @as(i32, b[i]);
        d += diff * diff;
    }
    return d;
}

pub fn nearestIndex(c: Rgb, palette: []const Rgb) usize {
    var best: usize = 0;
    var best_d: i32 = std.math.maxInt(i32);
    for (palette, 0..) |p, i| {
        const d = dist2(c, p);
        if (d < best_d) {
            best_d = d;
            best = i;
        }
    }
    return best;
}

pub fn quantize(pixels: []const Rgb, palette: []const Rgb, out: []usize) void {
    for (pixels, 0..) |p, i| out[i] = nearestIndex(p, palette);
}
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cstddef>
#include <vector>

using Rgb = std::array<int, 3>;

std::size_t nearest_index(Rgb c, const std::vector<Rgb>& palette) {
    return 0;
}

std::vector<std::size_t> quantize(const std::vector<Rgb>& pixels, const std::vector<Rgb>& palette) {
    return std::vector<std::size_t>(pixels.size(), 0);
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Idx = std::vector<std::size_t>;

int main() {
    std::vector<Rgb> P = {{0, 0, 0}, {255, 255, 255}, {255, 0, 0}};
    CHECK(nearest_index({255, 0, 0}, P) == 2);
    CHECK(nearest_index({200, 30, 30}, P) == 2);
    CHECK(nearest_index({60, 60, 60}, P) == 0);
    CHECK(nearest_index({250, 250, 250}, P) == 1);
    CHECK(nearest_index({1, 1, 1}, {{0, 0, 0}, {2, 2, 2}}) == 0);
    CHECK(quantize({{10, 10, 10}, {250, 250, 250}, {240, 10, 10}, {0, 0, 0}}, P) == Idx({0, 1, 2, 0}));
    CHECK(quantize({}, P).empty());
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cstddef>
#include <limits>
#include <vector>

using Rgb = std::array<int, 3>;

std::size_t nearest_index(Rgb c, const std::vector<Rgb>& palette) {
    std::size_t best = 0;
    int best_d = std::numeric_limits<int>::max();
    for (std::size_t i = 0; i < palette.size(); ++i) {
        int d = 0;
        for (int k = 0; k < 3; ++k) d += (c[k] - palette[i][k]) * (c[k] - palette[i][k]);
        if (d < best_d) { best_d = d; best = i; }
    }
    return best;
}

std::vector<std::size_t> quantize(const std::vector<Rgb>& pixels, const std::vector<Rgb>& palette) {
    std::vector<std::size_t> out;
    for (const Rgb& p : pixels) out.push_back(nearest_index(p, palette));
    return out;
}
`,
    },
  },

  integer_scale: {
    title: 'Pixel-perfect integer scaling', minutes: 10, level: 'easy',
    prompt: `<p>A pixel-art game renders at a low base resolution (say 320x180) and is scaled to the window. Non-integer scaling makes some pixels wider than others. Return the largest integer <code>scale</code> that fits (at least 1) and the offsets that centre the picture, using <b>floor</b> division (so a negative odd offset rounds down, towards minus infinity).</p>`,
    hint: 'scale = max(1, min(win_w / base_w, win_h / base_h)). offset = floor((win - base * scale) / 2). Zig has @divFloor. C++ integer division truncates toward zero, so a negative odd numerator rounds the wrong way: write a small floor-division helper.',
    notes: 'In Godot: Project Settings > Display > Window > Stretch: mode canvas_items (or viewport), aspect keep, scale mode integer. Set the default texture filter to Nearest and snap 2D transforms to pixel so sprites do not shimmer. Camera smoothing and sub-pixel movement are the usual cause of "swimming" pixels.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Fit = struct { scale: i32, off_x: i32, off_y: i32 };

pub fn integerScale(win_w: i32, win_h: i32, base_w: i32, base_h: i32) Fit {
    _ = win_w;
    _ = win_h;
    _ = base_w;
    _ = base_h;
    return .{ .scale = 0, .off_x = 0, .off_y = 0 };
}
`,
      tests: String.raw`fn expectFit(w: i32, h: i32, bw: i32, bh: i32, s: i32, ox: i32, oy: i32) !void {
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
`,
      solution: String.raw`const std = @import("std");

pub const Fit = struct { scale: i32, off_x: i32, off_y: i32 };

pub fn integerScale(win_w: i32, win_h: i32, base_w: i32, base_h: i32) Fit {
    const s = @max(1, @min(@divFloor(win_w, base_w), @divFloor(win_h, base_h)));
    return .{
        .scale = s,
        .off_x = @divFloor(win_w - base_w * s, 2),
        .off_y = @divFloor(win_h - base_h * s, 2),
    };
}
`,
    },
    cpp: {
      starter: String.raw`#include <algorithm>

struct Fit { int scale, off_x, off_y; };

Fit integer_scale(int win_w, int win_h, int base_w, int base_h) {
    return {0, 0, 0};
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool fit(int w, int h, int bw, int bh, int s, int ox, int oy) { Fit f = integer_scale(w, h, bw, bh); return f.scale == s && f.off_x == ox && f.off_y == oy; }

int main() {
    CHECK(fit(1920, 1080, 320, 180, 6, 0, 0));
    CHECK(fit(1000, 700, 320, 180, 3, 20, 80));
    CHECK(fit(2000, 400, 320, 180, 2, 680, 20));
    CHECK(fit(200, 100, 320, 180, 1, -60, -40));
    CHECK(fit(390, 844, 160, 144, 2, 35, 278));
    CHECK(fit(201, 100, 320, 180, 1, -60, -40));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <algorithm>

struct Fit { int scale, off_x, off_y; };

static int floor_div(int a, int b) {
    int q = a / b;
    if ((a % b != 0) && ((a < 0) != (b < 0))) --q;
    return q;
}

Fit integer_scale(int win_w, int win_h, int base_w, int base_h) {
    int s = std::max(1, std::min(win_w / base_w, win_h / base_h));
    return {s, floor_div(win_w - base_w * s, 2), floor_div(win_h - base_h * s, 2)};
}
`,
    },
  },
};

/* The single file a learner edits: header, starter (or solution), tests. Shared by the lab UI and scripts/lib-drills.mjs. */
window.drillFile = function (id, d, lang, which) {
  const head = lang === 'c' ? `// ${d.title}\n// Run: cc -std=c17 -Wall ${id}.c -lm -o ${id} && ./${id}\n\n` : lang === 'zig'
    ? `// ${d.title}\n// Run: zig test ${id}.zig   (written against Zig 0.17)\n\n`
    : `// ${d.title}\n// Run: g++ -std=c++20 -Wall -o ${id} ${id}.cpp && ./${id}\n\n`;
  return head + d[lang][which || 'starter'] + '\n// ---- tests: do not edit below this line ----\n' + d[lang].tests;
};

/* Resolve { type: 'drill', ref } stubs in the lesson files. Called at the end of every game track file (idempotent). */
window.resolveDrills = function () {
  for (const t of window.TRACKS) for (const l of t.lessons) for (const s of l.sections) {
    if (s.type === 'drill' && s.ref) {
      const d = window.DRILLS[s.ref];
      if (!d) continue;
      Object.assign(s, d); s.id = s.ref; delete s.ref;
    }
  }
};
