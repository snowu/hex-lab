/* Drills for the Patterns track (Zig and C++). Same shape and tooling as content/drills-game.js. */
Object.assign(window.DRILLS, {

  command_undo: {
    title: 'Command pattern: undo and redo', minutes: 20, level: 'medium',
    prompt: `<p>An editor has 8 integer cells. Every change is a <b>command object</b> that remembers how to reverse itself: the index, the new value and the <b>previous</b> value. A history keeps the last <b>4</b> commands.</p>
<ul><li><code>exec(index, value)</code>: set the cell and push a command on the undo stack (when the stack already holds 4, the <b>oldest</b> is forgotten). An out-of-range index does nothing and records nothing. A new change <b>clears the redo stack</b>.</li><li><code>undo()</code>: reverse the latest command and move it to the redo stack. <code>false</code> if there is nothing to undo.</li><li><code>redo()</code>: re-apply the latest undone command and move it back to the undo stack. <code>false</code> if there is nothing to redo.</li></ul>`,
    hint: 'Capture prev = cells[index] before you overwrite it. undo writes prev back; redo writes value again. Write one helper that pushes onto a bounded stack (drop the oldest by shifting) and use it for both stacks. Clearing redo is just redo_len = 0.',
    notes: 'This is the Command pattern: an action turned into data. The same object powers undo/redo, input replay (record commands with their frame number), network play (send commands, not state), AI (an enemy emits the same commands a player does) and macros. The trick that makes undo cheap is storing the previous value in the command instead of snapshotting the whole world. For large changes (move 500 selected tiles) one command holds a list of per-tile changes so one Ctrl+Z reverts the whole gesture.',
    zig: {
      starter: String.raw`const std = @import("std");

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
`,
      tests: String.raw`test "exec sets a cell" {
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
`,
      solution: String.raw`const std = @import("std");

pub const Command = struct { index: usize, value: i32, prev: i32 = 0 };

fn pushBounded(buf: *[4]Command, len: *usize, cmd: Command) void {
    if (len.* == buf.len) {
        var i: usize = 1;
        while (i < buf.len) : (i += 1) buf[i - 1] = buf[i];
        len.* -= 1;
    }
    buf[len.*] = cmd;
    len.* += 1;
}

pub const History = struct {
    cells: [8]i32 = @splat(0),
    undo_buf: [4]Command = undefined,
    undo_len: usize = 0,
    redo_buf: [4]Command = undefined,
    redo_len: usize = 0,

    pub fn exec(self: *History, index: usize, value: i32) void {
        if (index >= self.cells.len) return;
        const cmd = Command{ .index = index, .value = value, .prev = self.cells[index] };
        self.cells[index] = value;
        pushBounded(&self.undo_buf, &self.undo_len, cmd);
        self.redo_len = 0;
    }

    pub fn undo(self: *History) bool {
        if (self.undo_len == 0) return false;
        self.undo_len -= 1;
        const c = self.undo_buf[self.undo_len];
        self.cells[c.index] = c.prev;
        pushBounded(&self.redo_buf, &self.redo_len, c);
        return true;
    }

    pub fn redo(self: *History) bool {
        if (self.redo_len == 0) return false;
        self.redo_len -= 1;
        const c = self.redo_buf[self.redo_len];
        self.cells[c.index] = c.value;
        pushBounded(&self.undo_buf, &self.undo_len, c);
        return true;
    }
};
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cstddef>
#include <vector>

struct Command { std::size_t index; int value; int prev; };

class History {
public:
    std::array<int, 8> cells{};

    // Set cells[index] = value and remember how to undo it.
    void exec(std::size_t index, int value) {}
    bool undo() { return false; }
    bool redo() { return false; }

private:
    std::vector<Command> undo_, redo_;  // at most 4 each
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { History h; h.exec(0, 5); CHECK(h.cells[0] == 5); }
    { History h; h.exec(0, 5); h.exec(0, 9); CHECK(h.undo()); CHECK(h.cells[0] == 5); CHECK(h.undo()); CHECK(h.cells[0] == 0); CHECK(!h.undo()); }
    { History h; CHECK(!h.redo()); h.exec(1, 7); h.undo(); CHECK(h.redo()); CHECK(h.cells[1] == 7); CHECK(!h.redo()); }
    { History h; h.exec(1, 1); h.exec(1, 2); h.undo(); h.exec(1, 3); CHECK(!h.redo()); CHECK(h.cells[1] == 3); }
    { History h; for (int v : {1, 2, 3, 4, 5}) h.exec(0, v); int n = 0; while (h.undo()) ++n; CHECK(n == 4); CHECK(h.cells[0] == 1); }
    { History h; h.exec(8, 1); CHECK(!h.undo()); }
    { History h; h.exec(2, 7); h.exec(3, 8); h.undo(); CHECK(h.cells[3] == 0); CHECK(h.cells[2] == 7); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cstddef>
#include <vector>

struct Command { std::size_t index; int value; int prev; };

class History {
public:
    std::array<int, 8> cells{};

    void exec(std::size_t index, int value) {
        if (index >= cells.size()) return;
        push(undo_, {index, value, cells[index]});
        cells[index] = value;
        redo_.clear();
    }
    bool undo() {
        if (undo_.empty()) return false;
        Command c = undo_.back(); undo_.pop_back();
        cells[c.index] = c.prev;
        push(redo_, c);
        return true;
    }
    bool redo() {
        if (redo_.empty()) return false;
        Command c = redo_.back(); redo_.pop_back();
        cells[c.index] = c.value;
        push(undo_, c);
        return true;
    }

private:
    static void push(std::vector<Command>& v, Command c) {
        if (v.size() == 4) v.erase(v.begin());
        v.push_back(c);
    }
    std::vector<Command> undo_, redo_;
};
`,
    },
  },

  event_queue: {
    title: 'Event queue: a fixed-size ring buffer', minutes: 20, level: 'medium',
    prompt: `<p>An event queue decouples <i>who sends</i> from <i>who handles</i> and from <i>when</i>. The standard implementation is a <b>ring buffer</b>: a fixed array with a <code>head</code> (oldest item) and a <code>count</code>, so push and pop are O(1) and nothing is ever allocated.</p>
<ul><li><code>push(v)</code>: store at the back. If the queue is full, store nothing and return <code>false</code>.</li><li><code>pushOverwrite(v)</code>: always store; if full, the <b>oldest</b> item is dropped to make room. Returns <code>true</code> if something was dropped.</li><li><code>pop()</code>: remove and return the oldest item (FIFO), or nothing if empty. <code>peek()</code> returns it without removing.</li><li><code>len()</code>: number of items.</li></ul>
<p>The queue must keep working after the indices wrap around the end of the array many times.</p>`,
    hint: 'The back is at (head + count) % capacity. pop reads items[head], then head = (head + 1) % capacity and count -= 1. pushOverwrite when full: drop the oldest first (advance head, count -= 1), then push.',
    notes: 'The Event Queue pattern fixes two problems of direct callbacks: the sender no longer blocks while handlers run, and a handler can be run later at a safe point in the frame (so a collision handler cannot delete an object mid-physics-step). The ring buffer choice shows the real design decision: what happens when it is full. Drop the new event, drop the oldest, grow, or block? Input and audio queues usually drop; a network send queue may want to disconnect the client instead. Make the policy explicit.',
    zig: {
      starter: String.raw`const std = @import("std");

pub fn RingQueue(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        items: [capacity]T = undefined,
        head: usize = 0, // index of the oldest item
        count: usize = 0,

        pub fn len(self: *const Self) usize {
            return self.count;
        }

        /// false (and nothing stored) when full
        pub fn push(self: *Self, v: T) bool {
            _ = self;
            _ = v;
            return false;
        }

        /// always stores v; true if the oldest item had to be dropped
        pub fn pushOverwrite(self: *Self, v: T) bool {
            _ = self;
            _ = v;
            return false;
        }

        pub fn pop(self: *Self) ?T {
            _ = self;
            return null;
        }

        pub fn peek(self: *const Self) ?T {
            _ = self;
            return null;
        }
    };
}
`,
      tests: String.raw`test "first in, first out" {
    var q = RingQueue(u32, 4){};
    try std.testing.expect(q.push(1));
    try std.testing.expect(q.push(2));
    try std.testing.expect(q.push(3));
    try std.testing.expectEqual(@as(usize, 3), q.len());
    try std.testing.expectEqual(@as(?u32, 1), q.pop());
    try std.testing.expectEqual(@as(?u32, 2), q.pop());
    try std.testing.expectEqual(@as(?u32, 3), q.pop());
    try std.testing.expectEqual(@as(?u32, null), q.pop());
}
test "a full queue refuses new items and keeps the old ones" {
    var q = RingQueue(u32, 2){};
    try std.testing.expect(q.push(1));
    try std.testing.expect(q.push(2));
    try std.testing.expect(!q.push(3));
    try std.testing.expectEqual(@as(?u32, 1), q.pop());
    try std.testing.expect(q.push(3));
    try std.testing.expectEqual(@as(?u32, 2), q.pop());
    try std.testing.expectEqual(@as(?u32, 3), q.pop());
}
test "indices wrap around many times" {
    var q = RingQueue(u32, 3){};
    var next_in: u32 = 0;
    var next_out: u32 = 0;
    for (0..100) |_| {
        try std.testing.expect(q.push(next_in));
        next_in += 1;
        try std.testing.expect(q.push(next_in));
        next_in += 1;
        try std.testing.expectEqual(@as(?u32, next_out), q.pop());
        next_out += 1;
        try std.testing.expectEqual(@as(?u32, next_out), q.pop());
        next_out += 1;
    }
}
test "peek does not remove" {
    var q = RingQueue(u32, 2){};
    try std.testing.expectEqual(@as(?u32, null), q.peek());
    _ = q.push(9);
    try std.testing.expectEqual(@as(?u32, 9), q.peek());
    try std.testing.expectEqual(@as(usize, 1), q.len());
}
test "overwrite drops the oldest when full" {
    var q = RingQueue(u32, 3){};
    try std.testing.expect(!q.pushOverwrite(1));
    try std.testing.expect(!q.pushOverwrite(2));
    try std.testing.expect(!q.pushOverwrite(3));
    try std.testing.expect(q.pushOverwrite(4));
    try std.testing.expect(q.pushOverwrite(5));
    try std.testing.expectEqual(@as(usize, 3), q.len());
    try std.testing.expectEqual(@as(?u32, 3), q.pop());
    try std.testing.expectEqual(@as(?u32, 4), q.pop());
    try std.testing.expectEqual(@as(?u32, 5), q.pop());
}
`,
      solution: String.raw`const std = @import("std");

pub fn RingQueue(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        items: [capacity]T = undefined,
        head: usize = 0,
        count: usize = 0,

        pub fn len(self: *const Self) usize {
            return self.count;
        }

        pub fn push(self: *Self, v: T) bool {
            if (self.count == capacity) return false;
            self.items[(self.head + self.count) % capacity] = v;
            self.count += 1;
            return true;
        }

        pub fn pushOverwrite(self: *Self, v: T) bool {
            const dropped = self.count == capacity;
            if (dropped) {
                self.head = (self.head + 1) % capacity;
                self.count -= 1;
            }
            _ = self.push(v);
            return dropped;
        }

        pub fn pop(self: *Self) ?T {
            if (self.count == 0) return null;
            const v = self.items[self.head];
            self.head = (self.head + 1) % capacity;
            self.count -= 1;
            return v;
        }

        pub fn peek(self: *const Self) ?T {
            if (self.count == 0) return null;
            return self.items[self.head];
        }
    };
}
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cstddef>
#include <optional>

template <class T, std::size_t Capacity>
class RingQueue {
public:
    std::size_t len() const { return count_; }
    // false (and nothing stored) when full
    bool push(T v) { return false; }
    // always stores v; true if the oldest item had to be dropped
    bool push_overwrite(T v) { return false; }
    std::optional<T> pop() { return std::nullopt; }
    std::optional<T> peek() const { return std::nullopt; }

private:
    std::array<T, Capacity> items_{};
    std::size_t head_ = 0;   // index of the oldest item
    std::size_t count_ = 0;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { RingQueue<unsigned, 4> q; CHECK(q.push(1)); CHECK(q.push(2)); CHECK(q.push(3)); CHECK(q.len() == 3);
      CHECK(q.pop() == 1u); CHECK(q.pop() == 2u); CHECK(q.pop() == 3u); CHECK(!q.pop().has_value()); }
    { RingQueue<unsigned, 2> q; CHECK(q.push(1)); CHECK(q.push(2)); CHECK(!q.push(3)); CHECK(q.pop() == 1u); CHECK(q.push(3)); CHECK(q.pop() == 2u); CHECK(q.pop() == 3u); }
    { RingQueue<unsigned, 3> q; unsigned in = 0, out = 0; bool good = true;
      for (int i = 0; i < 100; ++i) { good &= q.push(in++); good &= q.push(in++); good &= (q.pop() == out++); good &= (q.pop() == out++); } CHECK(good); }
    { RingQueue<unsigned, 2> q; CHECK(!q.peek().has_value()); q.push(9); CHECK(q.peek() == 9u); CHECK(q.len() == 1); }
    { RingQueue<unsigned, 3> q; CHECK(!q.push_overwrite(1)); CHECK(!q.push_overwrite(2)); CHECK(!q.push_overwrite(3)); CHECK(q.push_overwrite(4)); CHECK(q.push_overwrite(5));
      CHECK(q.len() == 3); CHECK(q.pop() == 3u); CHECK(q.pop() == 4u); CHECK(q.pop() == 5u); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cstddef>
#include <optional>

template <class T, std::size_t Capacity>
class RingQueue {
public:
    std::size_t len() const { return count_; }
    bool push(T v) {
        if (count_ == Capacity) return false;
        items_[(head_ + count_) % Capacity] = v;
        ++count_;
        return true;
    }
    bool push_overwrite(T v) {
        bool dropped = count_ == Capacity;
        if (dropped) { head_ = (head_ + 1) % Capacity; --count_; }
        push(v);
        return dropped;
    }
    std::optional<T> pop() {
        if (count_ == 0) return std::nullopt;
        T v = items_[head_];
        head_ = (head_ + 1) % Capacity;
        --count_;
        return v;
    }
    std::optional<T> peek() const {
        if (count_ == 0) return std::nullopt;
        return items_[head_];
    }

private:
    std::array<T, Capacity> items_{};
    std::size_t head_ = 0;
    std::size_t count_ = 0;
};
`,
    },
  },

  dirty_flag: {
    title: 'Dirty flag: lazy world transforms', minutes: 25, level: 'medium',
    prompt: `<p>In a scene graph a node's <b>world</b> position is its parent's world position plus its own local offset (1-D here to keep it small). Recomputing every world value every frame is wasteful when almost nothing moved. Cache each node's world value with a <b>dirty flag</b>.</p>
<ul><li><code>add(parent, local)</code> returns the new node's index. A parent always has a smaller index than its children.</li><li><code>setLocal(i, v)</code> changes the local value and marks <b>that node and all its descendants</b> dirty (their cached world values are now wrong).</li><li><code>world(i)</code> returns the world value. If the node is not dirty, return the cache. Otherwise compute it from the parent's (cached or recomputed) world value, store it, clear the flag and add one to <code>recomputes</code>.</li></ul>
<p>The tests count <code>recomputes</code>: an unchanged scene must cost nothing, and changing a node must not recompute its ancestors or its siblings.</p>`,
    hint: 'Because a parent always has a smaller index than its children, one forward pass after setLocal is enough: for j in i+1..n, if the parent of j is dirty then mark j dirty. world(i) is recursive: base = parent ? world(parent) : 0.',
    notes: 'Dirty Flag is cache invalidation with a boolean. The costs are (1) you must set the flag on every path that changes the input (miss one and you get stale data, the classic bug) and (2) you must decide when to clean: lazily on read, like here, or in a batch at a known point in the frame. Engines use it everywhere: transform hierarchies, bounding boxes, navmesh and lighting rebuilds, UI layout, "needs save" markers.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Scene = struct {
    const max = 8;

    parent: [max]?usize = @splat(null),
    local: [max]i32 = @splat(0),
    cache: [max]i32 = @splat(0),
    dirty: [max]bool = @splat(true),
    n: usize = 0,
    recomputes: u32 = 0,

    pub fn add(self: *Scene, parent: ?usize, local: i32) usize {
        _ = self;
        _ = parent;
        _ = local;
        return 0;
    }

    pub fn setLocal(self: *Scene, i: usize, v: i32) void {
        _ = self;
        _ = i;
        _ = v;
    }

    pub fn world(self: *Scene, i: usize) i32 {
        _ = self;
        _ = i;
        return 0;
    }
};
`,
      tests: String.raw`fn chain() Scene {
    var s = Scene{};
    const a = s.add(null, 1);
    const b = s.add(a, 2);
    const c = s.add(b, 3);
    _ = s.add(c, 4);
    return s;
}

test "world value is the sum along the chain" {
    var s = chain();
    try std.testing.expectEqual(@as(i32, 10), s.world(3));
    try std.testing.expectEqual(@as(i32, 3), s.world(1));
}
test "the first read computes each node once, later reads are free" {
    var s = chain();
    _ = s.world(3);
    try std.testing.expectEqual(@as(u32, 4), s.recomputes);
    _ = s.world(3);
    _ = s.world(2);
    try std.testing.expectEqual(@as(u32, 4), s.recomputes);
}
test "changing a node recomputes it and its descendants, not its ancestors" {
    var s = chain();
    _ = s.world(3);
    s.setLocal(1, 20);
    try std.testing.expectEqual(@as(i32, 28), s.world(3));
    try std.testing.expectEqual(@as(u32, 4 + 3), s.recomputes);
}
test "siblings are not recomputed" {
    var s = Scene{};
    const root = s.add(null, 10);
    const left = s.add(root, 1);
    const right = s.add(root, 2);
    _ = s.world(left);
    _ = s.world(right);
    const before = s.recomputes;
    s.setLocal(left, 5);
    _ = s.world(right);
    try std.testing.expectEqual(before, s.recomputes);
    try std.testing.expectEqual(@as(i32, 15), s.world(left));
}
test "changing the root recomputes everything below it" {
    var s = chain();
    _ = s.world(3);
    s.setLocal(0, 100);
    try std.testing.expectEqual(@as(i32, 109), s.world(3));
    try std.testing.expectEqual(@as(u32, 8), s.recomputes);
}
test "a node added after others are cached is computed correctly" {
    var s = chain();
    _ = s.world(3);
    const extra = s.add(3, 5);
    try std.testing.expectEqual(@as(i32, 15), s.world(extra));
}
`,
      solution: String.raw`const std = @import("std");

pub const Scene = struct {
    const max = 8;

    parent: [max]?usize = @splat(null),
    local: [max]i32 = @splat(0),
    cache: [max]i32 = @splat(0),
    dirty: [max]bool = @splat(true),
    n: usize = 0,
    recomputes: u32 = 0,

    pub fn add(self: *Scene, parent: ?usize, local: i32) usize {
        const id = self.n;
        self.parent[id] = parent;
        self.local[id] = local;
        self.dirty[id] = true;
        self.n += 1;
        return id;
    }

    pub fn setLocal(self: *Scene, i: usize, v: i32) void {
        self.local[i] = v;
        self.dirty[i] = true;
        var j = i + 1;
        while (j < self.n) : (j += 1) {
            if (self.parent[j]) |p| {
                if (self.dirty[p]) self.dirty[j] = true;
            }
        }
    }

    pub fn world(self: *Scene, i: usize) i32 {
        if (!self.dirty[i]) return self.cache[i];
        const base: i32 = if (self.parent[i]) |p| self.world(p) else 0;
        self.cache[i] = base + self.local[i];
        self.dirty[i] = false;
        self.recomputes += 1;
        return self.cache[i];
    }
};
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cstddef>
#include <optional>

class Scene {
public:
    static constexpr std::size_t kMax = 8;
    unsigned recomputes = 0;

    std::size_t add(std::optional<std::size_t> parent, int local) { return 0; }
    void set_local(std::size_t i, int v) {}
    int world(std::size_t i) { return 0; }

private:
    std::array<std::optional<std::size_t>, kMax> parent_{};
    std::array<int, kMax> local_{}, cache_{};
    std::array<bool, kMax> dirty_{};
    std::size_t n_ = 0;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

static Scene chain() { Scene s; auto a = s.add(std::nullopt, 1); auto b = s.add(a, 2); auto c = s.add(b, 3); s.add(c, 4); return s; }

int main() {
    { Scene s = chain(); CHECK(s.world(3) == 10); CHECK(s.world(1) == 3); }
    { Scene s = chain(); s.world(3); CHECK(s.recomputes == 4); s.world(3); s.world(2); CHECK(s.recomputes == 4); }
    { Scene s = chain(); s.world(3); s.set_local(1, 20); CHECK(s.world(3) == 28); CHECK(s.recomputes == 7); }
    { Scene s; auto root = s.add(std::nullopt, 10); auto l = s.add(root, 1); auto r = s.add(root, 2); s.world(l); s.world(r);
      unsigned before = s.recomputes; s.set_local(l, 5); s.world(r); CHECK(s.recomputes == before); CHECK(s.world(l) == 15); }
    { Scene s = chain(); s.world(3); s.set_local(0, 100); CHECK(s.world(3) == 109); CHECK(s.recomputes == 8); }
    { Scene s = chain(); s.world(3); auto e = s.add(3, 5); CHECK(s.world(e) == 15); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cstddef>
#include <optional>

class Scene {
public:
    static constexpr std::size_t kMax = 8;
    unsigned recomputes = 0;

    std::size_t add(std::optional<std::size_t> parent, int local) {
        std::size_t id = n_++;
        parent_[id] = parent; local_[id] = local; dirty_[id] = true;
        return id;
    }
    void set_local(std::size_t i, int v) {
        local_[i] = v; dirty_[i] = true;
        for (std::size_t j = i + 1; j < n_; ++j)
            if (parent_[j] && dirty_[*parent_[j]]) dirty_[j] = true;
    }
    int world(std::size_t i) {
        if (!dirty_[i]) return cache_[i];
        int base = parent_[i] ? world(*parent_[i]) : 0;
        cache_[i] = base + local_[i];
        dirty_[i] = false;
        ++recomputes;
        return cache_[i];
    }

private:
    std::array<std::optional<std::size_t>, kMax> parent_{};
    std::array<int, kMax> local_{}, cache_{};
    std::array<bool, kMax> dirty_{};
    std::size_t n_ = 0;
};
`,
    },
  },

  type_object: {
    title: 'Type object: data-driven monsters with inheritance', minutes: 25, level: 'medium',
    prompt: `<p>Instead of a C++/Zig class per monster kind (<code>Goblin</code>, <code>GoblinChief</code>, <code>EliteGoblinChief</code>...), make "monster type" <b>data</b>. A type has a name, an optional parent type, and stats that may be set or left unset. Designers add types without recompiling.</p>
<ul><li><code>define(name, parent, stats)</code>: add a type. Returns <code>false</code> if the name already exists or the parent has not been defined yet.</li><li><code>resolve(name)</code>: the final stats. Walk from the type up through its parents: each stat comes from the <b>closest</b> type that sets it. Returns nothing if the type is unknown or a stat is never set anywhere on the chain.</li></ul>
<p>Example: <code>goblin</code> sets hp 10, attack 2, speed 3. <code>chief</code> (parent goblin) sets hp 25 and attack 4. <code>elite</code> (parent chief) sets speed 5. Resolving <code>elite</code> gives hp 25, attack 4, speed 5.</p>`,
    hint: 'Keep parallel arrays (names, parent indices, stats) and a find(name) helper. define: reject duplicates, translate the parent name to an index (failing if missing), store. resolve: start with three empty optionals, loop cur = idx; while cur: fill any still-empty stat from stats[cur]; cur = parents[cur].',
    notes: 'Type Object (and its close relative Prototype) is why games are mostly data: weapons, enemies, items, spells. The runtime has one Monster class that holds a pointer/index to its type. Resolving inheritance once at load time, not per frame, is the usual optimisation (flatten the chain into a final table). Godot Resources and Unity ScriptableObjects are this pattern with an editor on top. Watch for cycles (reject parents that are not defined yet, as here) and for "inheritance depth creep" where nobody knows where a stat comes from: show the source in tooling.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Stats = struct { hp: ?i32 = null, attack: ?i32 = null, speed: ?i32 = null };
pub const Resolved = struct { hp: i32, attack: i32, speed: i32 };

pub const Registry = struct {
    const max = 8;

    names: [max][]const u8 = undefined,
    parents: [max]?usize = @splat(null),
    stats: [max]Stats = undefined,
    n: usize = 0,

    /// false if the name exists already or the parent is not defined yet
    pub fn define(self: *Registry, name: []const u8, parent: ?[]const u8, stats: Stats) bool {
        _ = self;
        _ = name;
        _ = parent;
        _ = stats;
        return false;
    }

    /// each stat comes from the closest type on the chain that sets it; null if unknown or incomplete
    pub fn resolve(self: *const Registry, name: []const u8) ?Resolved {
        _ = self;
        _ = name;
        return null;
    }
};
`,
      tests: String.raw`fn zoo() Registry {
    var r = Registry{};
    _ = r.define("goblin", null, .{ .hp = 10, .attack = 2, .speed = 3 });
    _ = r.define("chief", "goblin", .{ .hp = 25, .attack = 4 });
    _ = r.define("elite", "chief", .{ .speed = 5 });
    return r;
}

test "a root type resolves to its own stats" {
    const r = zoo();
    const g = r.resolve("goblin").?;
    try std.testing.expectEqual(@as(i32, 10), g.hp);
    try std.testing.expectEqual(@as(i32, 2), g.attack);
    try std.testing.expectEqual(@as(i32, 3), g.speed);
}
test "children override only what they set" {
    const r = zoo();
    const c = r.resolve("chief").?;
    try std.testing.expectEqual(@as(i32, 25), c.hp);
    try std.testing.expectEqual(@as(i32, 4), c.attack);
    try std.testing.expectEqual(@as(i32, 3), c.speed);
}
test "inheritance goes up more than one level" {
    const r = zoo();
    const e = r.resolve("elite").?;
    try std.testing.expectEqual(@as(i32, 25), e.hp);
    try std.testing.expectEqual(@as(i32, 4), e.attack);
    try std.testing.expectEqual(@as(i32, 5), e.speed);
}
test "unknown types and unknown parents are refused" {
    var r = zoo();
    try std.testing.expect(r.resolve("dragon") == null);
    try std.testing.expect(!r.define("whelp", "dragon", .{ .hp = 1 }));
    try std.testing.expect(r.resolve("whelp") == null);
}
test "duplicate names are refused and do not change the original" {
    var r = zoo();
    try std.testing.expect(!r.define("goblin", null, .{ .hp = 999, .attack = 999, .speed = 999 }));
    try std.testing.expectEqual(@as(i32, 10), r.resolve("goblin").?.hp);
}
test "a type whose chain never sets a stat does not resolve" {
    var r = Registry{};
    try std.testing.expect(r.define("half", null, .{ .hp = 1, .attack = 1 }));
    try std.testing.expect(r.resolve("half") == null);
    try std.testing.expect(r.define("fixed", "half", .{ .speed = 2 }));
    try std.testing.expect(r.resolve("fixed") != null);
}
`,
      solution: String.raw`const std = @import("std");

pub const Stats = struct { hp: ?i32 = null, attack: ?i32 = null, speed: ?i32 = null };
pub const Resolved = struct { hp: i32, attack: i32, speed: i32 };

pub const Registry = struct {
    const max = 8;

    names: [max][]const u8 = undefined,
    parents: [max]?usize = @splat(null),
    stats: [max]Stats = undefined,
    n: usize = 0,

    fn find(self: *const Registry, name: []const u8) ?usize {
        for (self.names[0..self.n], 0..) |nm, i| {
            if (std.mem.eql(u8, nm, name)) return i;
        }
        return null;
    }

    pub fn define(self: *Registry, name: []const u8, parent: ?[]const u8, stats: Stats) bool {
        if (self.n == max or self.find(name) != null) return false;
        var parent_idx: ?usize = null;
        if (parent) |p| parent_idx = self.find(p) orelse return false;
        self.names[self.n] = name;
        self.parents[self.n] = parent_idx;
        self.stats[self.n] = stats;
        self.n += 1;
        return true;
    }

    pub fn resolve(self: *const Registry, name: []const u8) ?Resolved {
        var hp: ?i32 = null;
        var attack: ?i32 = null;
        var speed: ?i32 = null;
        var cur = self.find(name);
        while (cur) |i| {
            if (hp == null) hp = self.stats[i].hp;
            if (attack == null) attack = self.stats[i].attack;
            if (speed == null) speed = self.stats[i].speed;
            cur = self.parents[i];
        }
        if (hp == null or attack == null or speed == null) return null;
        return .{ .hp = hp.?, .attack = attack.?, .speed = speed.? };
    }
};
`,
    },
    cpp: {
      starter: String.raw`#include <optional>
#include <string>
#include <vector>

struct Stats { std::optional<int> hp, attack, speed; };
struct Resolved { int hp, attack, speed; };

class Registry {
public:
    // false if the name exists already or the parent is not defined yet
    bool define(const std::string& name, const std::optional<std::string>& parent, Stats stats) { return false; }
    // each stat comes from the closest type on the chain that sets it; nothing if unknown or incomplete
    std::optional<Resolved> resolve(const std::string& name) const { return std::nullopt; }

private:
    struct Type { std::string name; std::optional<std::size_t> parent; Stats stats; };
    std::vector<Type> types_;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

static Registry zoo() { Registry r; r.define("goblin", std::nullopt, {10, 2, 3}); r.define("chief", std::string("goblin"), {25, 4, std::nullopt}); r.define("elite", std::string("chief"), {std::nullopt, std::nullopt, 5}); return r; }

int main() {
    { auto r = zoo(); auto g = r.resolve("goblin"); CHECK(g && g->hp == 10 && g->attack == 2 && g->speed == 3); }
    { auto r = zoo(); auto c = r.resolve("chief"); CHECK(c && c->hp == 25 && c->attack == 4 && c->speed == 3); }
    { auto r = zoo(); auto e = r.resolve("elite"); CHECK(e && e->hp == 25 && e->attack == 4 && e->speed == 5); }
    { auto r = zoo(); CHECK(!r.resolve("dragon")); CHECK(!r.define("whelp", std::string("dragon"), {1, 1, 1})); CHECK(!r.resolve("whelp")); }
    { auto r = zoo(); CHECK(!r.define("goblin", std::nullopt, {999, 999, 999})); CHECK(r.resolve("goblin")->hp == 10); }
    { Registry r; CHECK(r.define("half", std::nullopt, {1, 1, std::nullopt})); CHECK(!r.resolve("half")); CHECK(r.define("fixed", std::string("half"), {std::nullopt, std::nullopt, 2})); CHECK(r.resolve("fixed").has_value()); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <optional>
#include <string>
#include <vector>

struct Stats { std::optional<int> hp, attack, speed; };
struct Resolved { int hp, attack, speed; };

class Registry {
public:
    bool define(const std::string& name, const std::optional<std::string>& parent, Stats stats) {
        if (find(name)) return false;
        std::optional<std::size_t> pi;
        if (parent) { pi = find(*parent); if (!pi) return false; }
        types_.push_back({name, pi, stats});
        return true;
    }
    std::optional<Resolved> resolve(const std::string& name) const {
        std::optional<int> hp, attack, speed;
        for (auto cur = find(name); cur; cur = types_[*cur].parent) {
            const Stats& s = types_[*cur].stats;
            if (!hp) hp = s.hp;
            if (!attack) attack = s.attack;
            if (!speed) speed = s.speed;
        }
        if (!hp || !attack || !speed) return std::nullopt;
        return Resolved{*hp, *attack, *speed};
    }

private:
    struct Type { std::string name; std::optional<std::size_t> parent; Stats stats; };
    std::optional<std::size_t> find(const std::string& name) const {
        for (std::size_t i = 0; i < types_.size(); ++i) if (types_[i].name == name) return i;
        return std::nullopt;
    }
    std::vector<Type> types_;
};
`,
    },
  },

  free_list_pool: {
    title: 'Object pool with an O(1) free list', minutes: 25, level: 'medium',
    prompt: `<p>An <b>object pool</b> allocates all objects up front and hands them out and takes them back. A naive pool scans for a free slot (O(n)). A <b>free list</b> threads the unused slots together so both operations are O(1): <code>free_head</code> is the first free slot and <code>next_free[i]</code> is the slot after <code>i</code> in the list. <code>init</code> is given and links every slot (0 → 1 → 2 → ... → capacity, where <code>capacity</code> means "end of list").</p>
<ul><li><code>acquire()</code>: take the head of the free list, mark it in use, return its index. Nothing if the pool is exhausted.</li><li><code>release(index)</code>: put the slot at the <b>front</b> of the free list (so the most recently released slot is reused first). Returns <code>false</code> for an out-of-range index or a slot that is already free (a double release must not corrupt the list).</li><li><code>freeCount()</code> / <code>get(index)</code> as in the starter.</li></ul>`,
    hint: 'acquire: if free_head == capacity return null; i = free_head; free_head = next_free[i]; in_use[i] = true; free_count -= 1. release: reject invalid or already-free slots; in_use[index] = false; next_free[index] = free_head; free_head = index; free_count += 1.',
    notes: 'Pools avoid allocator cost, fragmentation and garbage-collector pauses for things that spawn and die constantly (bullets, particles, enemies). The free list is the same trick malloc implementations use. Design decisions to state out loud: what happens when the pool is empty (drop the request, recycle the oldest, grow in chunks), and how stale handles are detected. Index + generation counters ("handles") catch the use-after-release bug: a bullet that was recycled must not be hit by an old reference.',
    zig: {
      starter: String.raw`const std = @import("std");

pub fn Pool(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        items: [capacity]T = undefined,
        next_free: [capacity]usize = undefined, // the free list is threaded through the unused slots
        in_use: [capacity]bool = @splat(false),
        free_head: usize = 0, // first free slot; capacity means "none"
        free_count: usize = capacity,

        pub fn init() Self {
            var s = Self{};
            for (0..capacity) |i| s.next_free[i] = i + 1;
            return s;
        }

        pub fn freeCount(self: *const Self) usize {
            return self.free_count;
        }

        pub fn get(self: *Self, index: usize) *T {
            return &self.items[index];
        }

        /// the index of a free slot, or null if the pool is exhausted
        pub fn acquire(self: *Self) ?usize {
            _ = self;
            return null;
        }

        /// false for an out-of-range index or a slot that is already free
        pub fn release(self: *Self, index: usize) bool {
            _ = self;
            _ = index;
            return false;
        }
    };
}
`,
      tests: String.raw`test "slots are handed out in order and then it runs dry" {
    var p = Pool(u32, 4).init();
    try std.testing.expectEqual(@as(?usize, 0), p.acquire());
    try std.testing.expectEqual(@as(?usize, 1), p.acquire());
    try std.testing.expectEqual(@as(?usize, 2), p.acquire());
    try std.testing.expectEqual(@as(?usize, 3), p.acquire());
    try std.testing.expectEqual(@as(?usize, null), p.acquire());
    try std.testing.expectEqual(@as(usize, 0), p.freeCount());
}
test "a released slot is reused first" {
    var p = Pool(u32, 4).init();
    for (0..4) |_| _ = p.acquire();
    try std.testing.expect(p.release(1));
    try std.testing.expectEqual(@as(usize, 1), p.freeCount());
    try std.testing.expectEqual(@as(?usize, 1), p.acquire());
}
test "most recently released comes back first" {
    var p = Pool(u32, 4).init();
    for (0..4) |_| _ = p.acquire();
    _ = p.release(2);
    _ = p.release(0);
    try std.testing.expectEqual(@as(?usize, 0), p.acquire());
    try std.testing.expectEqual(@as(?usize, 2), p.acquire());
    try std.testing.expectEqual(@as(?usize, null), p.acquire());
}
test "double release and bad indices are refused and cannot corrupt the list" {
    var p = Pool(u32, 3).init();
    const a = p.acquire().?;
    try std.testing.expect(p.release(a));
    try std.testing.expect(!p.release(a));
    try std.testing.expect(!p.release(99));
    try std.testing.expect(!p.release(2)); // never acquired
    try std.testing.expectEqual(@as(usize, 3), p.freeCount());
    var seen: [3]bool = @splat(false);
    for (0..3) |_| seen[p.acquire().?] = true;
    try std.testing.expect(seen[0] and seen[1] and seen[2]);
    try std.testing.expectEqual(@as(?usize, null), p.acquire());
}
test "slots keep their data" {
    var p = Pool(u32, 2).init();
    const a = p.acquire().?;
    const b = p.acquire().?;
    p.get(a).* = 11;
    p.get(b).* = 22;
    try std.testing.expectEqual(@as(u32, 11), p.get(a).*);
    try std.testing.expectEqual(@as(u32, 22), p.get(b).*);
}
`,
      solution: String.raw`const std = @import("std");

pub fn Pool(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();

        items: [capacity]T = undefined,
        next_free: [capacity]usize = undefined,
        in_use: [capacity]bool = @splat(false),
        free_head: usize = 0,
        free_count: usize = capacity,

        pub fn init() Self {
            var s = Self{};
            for (0..capacity) |i| s.next_free[i] = i + 1;
            return s;
        }

        pub fn freeCount(self: *const Self) usize {
            return self.free_count;
        }

        pub fn get(self: *Self, index: usize) *T {
            return &self.items[index];
        }

        pub fn acquire(self: *Self) ?usize {
            if (self.free_head == capacity) return null;
            const i = self.free_head;
            self.free_head = self.next_free[i];
            self.in_use[i] = true;
            self.free_count -= 1;
            return i;
        }

        pub fn release(self: *Self, index: usize) bool {
            if (index >= capacity or !self.in_use[index]) return false;
            self.in_use[index] = false;
            self.next_free[index] = self.free_head;
            self.free_head = index;
            self.free_count += 1;
            return true;
        }
    };
}
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cstddef>
#include <optional>

template <class T, std::size_t Capacity>
class Pool {
public:
    Pool() { for (std::size_t i = 0; i < Capacity; ++i) next_free_[i] = i + 1; }

    std::size_t free_count() const { return free_count_; }
    T& get(std::size_t index) { return items_[index]; }

    // the index of a free slot, or nothing if the pool is exhausted
    std::optional<std::size_t> acquire() { return std::nullopt; }
    // false for an out-of-range index or a slot that is already free
    bool release(std::size_t index) { return false; }

private:
    std::array<T, Capacity> items_{};
    std::array<std::size_t, Capacity> next_free_{};  // the free list is threaded through the unused slots
    std::array<bool, Capacity> in_use_{};
    std::size_t free_head_ = 0;                      // first free slot; Capacity means "none"
    std::size_t free_count_ = Capacity;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { Pool<unsigned, 4> p; CHECK(p.acquire() == 0u); CHECK(p.acquire() == 1u); CHECK(p.acquire() == 2u); CHECK(p.acquire() == 3u); CHECK(!p.acquire().has_value()); CHECK(p.free_count() == 0); }
    { Pool<unsigned, 4> p; for (int i = 0; i < 4; ++i) p.acquire(); CHECK(p.release(1)); CHECK(p.free_count() == 1); CHECK(p.acquire() == 1u); }
    { Pool<unsigned, 4> p; for (int i = 0; i < 4; ++i) p.acquire(); p.release(2); p.release(0); CHECK(p.acquire() == 0u); CHECK(p.acquire() == 2u); CHECK(!p.acquire().has_value()); }
    { Pool<unsigned, 3> p; auto a = *p.acquire(); CHECK(p.release(a)); CHECK(!p.release(a)); CHECK(!p.release(99)); CHECK(!p.release(2)); CHECK(p.free_count() == 3);
      bool seen[3] = {false, false, false}; for (int i = 0; i < 3; ++i) seen[*p.acquire()] = true; CHECK(seen[0] && seen[1] && seen[2]); CHECK(!p.acquire().has_value()); }
    { Pool<unsigned, 2> p; auto a = *p.acquire(), b = *p.acquire(); p.get(a) = 11; p.get(b) = 22; CHECK(p.get(a) == 11u); CHECK(p.get(b) == 22u); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cstddef>
#include <optional>

template <class T, std::size_t Capacity>
class Pool {
public:
    Pool() { for (std::size_t i = 0; i < Capacity; ++i) next_free_[i] = i + 1; }

    std::size_t free_count() const { return free_count_; }
    T& get(std::size_t index) { return items_[index]; }

    std::optional<std::size_t> acquire() {
        if (free_head_ == Capacity) return std::nullopt;
        std::size_t i = free_head_;
        free_head_ = next_free_[i];
        in_use_[i] = true;
        --free_count_;
        return i;
    }
    bool release(std::size_t index) {
        if (index >= Capacity || !in_use_[index]) return false;
        in_use_[index] = false;
        next_free_[index] = free_head_;
        free_head_ = index;
        ++free_count_;
        return true;
    }

private:
    std::array<T, Capacity> items_{};
    std::array<std::size_t, Capacity> next_free_{};
    std::array<bool, Capacity> in_use_{};
    std::size_t free_head_ = 0;
    std::size_t free_count_ = Capacity;
};
`,
    },
  },

  state_stack: {
    title: 'Pushdown automaton: a stack of states', minutes: 25, level: 'medium',
    prompt: `<p>A <b>state stack</b> remembers what you were doing: the pause menu goes on top of gameplay, a dialogue on top of that, and popping returns to exactly where you were. States are small integers here. Every change is written to an event <b>log</b> so you can see which lifecycle callbacks would run.</p>
<ul><li><code>push(s)</code>: if there is a current top, log <code>pause</code> for it. Then log <code>enter</code> for <code>s</code> and put it on top. Returns <code>false</code> (and logs nothing) if the stack already holds 8 states.</li><li><code>pop()</code>: log <code>exit</code> for the top and remove it; if a state is now on top, log <code>unpause</code> for it. <code>false</code> if empty.</li><li><code>replace(s)</code>: log <code>exit</code> for the top, then <code>enter</code> for <code>s</code>, at the same depth (no pause or unpause). <code>false</code> if empty.</li><li><code>top()</code> is the current state; <code>events()</code> is the log so far.</li></ul>`,
    hint: 'Write a tiny record(kind, state) helper that appends to the log, and implement push/pop/replace as sequences of record calls plus the stack change. Mind the order: pause the old top BEFORE entering the new one, and unpause the new top AFTER exiting the old one.',
    notes: 'A plain state machine has no memory ("go back to what I was doing" needs every state to know its predecessor). The pushdown automaton fixes that with a stack and is how most game flow works: main menu → game → pause → options. The lifecycle events (enter/exit/pause/unpause) are the important part: they are where you stop music, freeze the simulation, release held input. Hierarchical state machines are the other extension: states that share behaviour inherit it from a parent state.',
    zig: {
      starter: String.raw`const std = @import("std");

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
`,
      tests: String.raw`fn expectLog(st: *const StateStack, expected: []const Event) !void {
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
`,
      solution: String.raw`const std = @import("std");

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
        if (self.depth == self.stack.len) return false;
        if (self.top()) |t| self.record(.pause, t);
        self.record(.enter, s);
        self.stack[self.depth] = s;
        self.depth += 1;
        return true;
    }

    pub fn pop(self: *StateStack) bool {
        const t = self.top() orelse return false;
        self.record(.exit, t);
        self.depth -= 1;
        if (self.top()) |below| self.record(.unpause, below);
        return true;
    }

    pub fn replace(self: *StateStack, s: u8) bool {
        const t = self.top() orelse return false;
        self.record(.exit, t);
        self.record(.enter, s);
        self.stack[self.depth - 1] = s;
        return true;
    }
};
`,
    },
    cpp: {
      starter: String.raw`#include <cstdint>
#include <optional>
#include <vector>

enum class Kind { Enter, Exit, Pause, Unpause };
struct Event { Kind kind; std::uint8_t state; };

class StateStack {
public:
    std::optional<std::uint8_t> top() const { return stack_.empty() ? std::nullopt : std::optional<std::uint8_t>(stack_.back()); }
    const std::vector<Event>& events() const { return log_; }

    bool push(std::uint8_t s) { return false; }     // false if 8 states are already on the stack
    bool pop() { return false; }                    // false if empty
    bool replace(std::uint8_t s) { return false; }  // false if empty

private:
    void record(Kind k, std::uint8_t s) { log_.push_back({k, s}); }
    std::vector<std::uint8_t> stack_;
    std::vector<Event> log_;
};
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool log_is(const StateStack& st, std::vector<Event> want) { auto& g = st.events(); if (g.size() != want.size()) return false; for (std::size_t i = 0; i < g.size(); ++i) if (g[i].kind != want[i].kind || g[i].state != want[i].state) return false; return true; }

int main() {
    { StateStack st; CHECK(st.push(1)); CHECK(st.push(2)); CHECK(st.top() == 2); CHECK(log_is(st, {{Kind::Enter, 1}, {Kind::Pause, 1}, {Kind::Enter, 2}})); }
    { StateStack st; st.push(1); st.push(2); CHECK(st.pop()); CHECK(st.top() == 1); CHECK(log_is(st, {{Kind::Enter, 1}, {Kind::Pause, 1}, {Kind::Enter, 2}, {Kind::Exit, 2}, {Kind::Unpause, 1}})); }
    { StateStack st; st.push(7); CHECK(st.pop()); CHECK(!st.top().has_value()); CHECK(log_is(st, {{Kind::Enter, 7}, {Kind::Exit, 7}})); CHECK(!st.pop()); }
    { StateStack st; st.push(1); CHECK(st.replace(3)); CHECK(st.top() == 3); CHECK(log_is(st, {{Kind::Enter, 1}, {Kind::Exit, 1}, {Kind::Enter, 3}})); StateStack e; CHECK(!e.replace(1)); }
    { StateStack st; for (int i = 0; i < 8; ++i) CHECK(st.push(static_cast<std::uint8_t>(i))); auto before = st.events().size(); CHECK(!st.push(99)); CHECK(st.events().size() == before); CHECK(st.top() == 7); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cstdint>
#include <optional>
#include <vector>

enum class Kind { Enter, Exit, Pause, Unpause };
struct Event { Kind kind; std::uint8_t state; };

class StateStack {
public:
    std::optional<std::uint8_t> top() const { return stack_.empty() ? std::nullopt : std::optional<std::uint8_t>(stack_.back()); }
    const std::vector<Event>& events() const { return log_; }

    bool push(std::uint8_t s) {
        if (stack_.size() == 8) return false;
        if (auto t = top()) record(Kind::Pause, *t);
        record(Kind::Enter, s);
        stack_.push_back(s);
        return true;
    }
    bool pop() {
        auto t = top();
        if (!t) return false;
        record(Kind::Exit, *t);
        stack_.pop_back();
        if (auto below = top()) record(Kind::Unpause, *below);
        return true;
    }
    bool replace(std::uint8_t s) {
        auto t = top();
        if (!t) return false;
        record(Kind::Exit, *t);
        record(Kind::Enter, s);
        stack_.back() = s;
        return true;
    }

private:
    void record(Kind k, std::uint8_t s) { log_.push_back({k, s}); }
    std::vector<std::uint8_t> stack_;
    std::vector<Event> log_;
};
`,
    },
  },

  stack_vm: {
    title: 'Bytecode: a tiny stack virtual machine', minutes: 30, level: 'hard',
    prompt: `<p>Game scripting often compiles to <b>bytecode</b>: a flat array of tiny instructions run by a loop. Write the interpreter for a stack machine. The stack holds at most <b>16</b> values. Each instruction executed counts as one step.</p>
<table><tr><th>op</th><th>effect</th></tr>
<tr><td><code>push n</code></td><td>push the number (fails with <b>StackOverflow</b> if full)</td></tr>
<tr><td><code>add sub mul div</code></td><td>pop <code>b</code>, pop <code>a</code>, push <code>a op b</code> (<code>div</code> truncates toward zero; <code>b == 0</code> is <b>DivideByZero</b>). Too few values: <b>StackUnderflow</b></td></tr>
<tr><td><code>dup</code> / <code>swap</code></td><td>duplicate the top / swap the top two</td></tr>
<tr><td><code>jz addr</code></td><td>pop a value; if it is 0 continue at <code>addr</code>, else carry on</td></tr>
<tr><td><code>jmp addr</code></td><td>continue at <code>addr</code></td></tr>
<tr><td><code>halt</code></td><td>stop and return the value on top of the stack (<b>StackUnderflow</b> if empty)</td></tr></table>
<p>A jump to an address outside the program is <b>BadJump</b>. Running past the end without <code>halt</code> is <b>NoHalt</b>. More than <code>max_steps</code> steps is <b>StepLimit</b> (this is what stops an infinite loop in a script from freezing the game).</p>`,
    hint: 'Keep pc (program counter), a stack array with a length, and a step counter. Loop: if steps == max_steps return StepLimit; if pc >= program.len return NoHalt; steps += 1; switch on the op. Write small helpers pop() and push() that return the stack errors, so every op stays short.',
    notes: 'This is the Bytecode pattern at its smallest. Real engines (Lua, GDScript, Wren, the Godot VM, WebAssembly) are this loop with more opcodes, registers instead of a stack, and type tags. Why bother instead of calling native functions? Safety (a script cannot crash or hang the host: note the step limit and the stack checks), portability, hot reload and modding. Notice how every failure is an explicit error value: in Zig an error set, in C++ a result struct. A "switch (op)" loop is also the interpreter used inside most emulators.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Op = union(enum) { push: i32, add, sub, mul, div, dup, swap, jz: usize, jmp: usize, halt };
pub const VmError = error{ StackUnderflow, StackOverflow, DivideByZero, BadJump, StepLimit, NoHalt };

/// Run the program and return the value on top of the stack when it halts.
pub fn run(program: []const Op, max_steps: usize) VmError!i32 {
    _ = program;
    _ = max_steps;
    return error.NoHalt;
}
`,
      tests: String.raw`const expectError = std.testing.expectError;

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
`,
      solution: String.raw`const std = @import("std");

pub const Op = union(enum) { push: i32, add, sub, mul, div, dup, swap, jz: usize, jmp: usize, halt };
pub const VmError = error{ StackUnderflow, StackOverflow, DivideByZero, BadJump, StepLimit, NoHalt };

const Stack = struct {
    items: [16]i32 = undefined,
    len: usize = 0,

    fn push(self: *Stack, v: i32) VmError!void {
        if (self.len == self.items.len) return error.StackOverflow;
        self.items[self.len] = v;
        self.len += 1;
    }

    fn pop(self: *Stack) VmError!i32 {
        if (self.len == 0) return error.StackUnderflow;
        self.len -= 1;
        return self.items[self.len];
    }
};

pub fn run(program: []const Op, max_steps: usize) VmError!i32 {
    var st = Stack{};
    var pc: usize = 0;
    var steps: usize = 0;
    while (true) {
        if (steps == max_steps) return error.StepLimit;
        if (pc >= program.len) return error.NoHalt;
        steps += 1;
        const op = program[pc];
        pc += 1;
        switch (op) {
            .push => |n| try st.push(n),
            .add, .sub, .mul, .div => {
                const b = try st.pop();
                const a = try st.pop();
                const r: i32 = switch (op) {
                    .add => a + b,
                    .sub => a - b,
                    .mul => a * b,
                    .div => blk: {
                        if (b == 0) return error.DivideByZero;
                        break :blk @divTrunc(a, b);
                    },
                    else => unreachable,
                };
                try st.push(r);
            },
            .dup => {
                const a = try st.pop();
                try st.push(a);
                try st.push(a);
            },
            .swap => {
                const b = try st.pop();
                const a = try st.pop();
                try st.push(b);
                try st.push(a);
            },
            .jz => |addr| {
                const v = try st.pop();
                if (v == 0) {
                    if (addr >= program.len) return error.BadJump;
                    pc = addr;
                }
            },
            .jmp => |addr| {
                if (addr >= program.len) return error.BadJump;
                pc = addr;
            },
            .halt => return try st.pop(),
        }
    }
}
`,
    },
    cpp: {
      starter: String.raw`#include <cstddef>
#include <vector>

enum class OpKind { Push, Add, Sub, Mul, Div, Dup, Swap, Jz, Jmp, Halt };
struct Op { OpKind kind; int arg = 0; };
enum class Err { None, StackUnderflow, StackOverflow, DivideByZero, BadJump, StepLimit, NoHalt };
struct Result { Err err; int value; };

// Run the program and return the value on top of the stack when it halts (or the error that stopped it).
Result run(const std::vector<Op>& program, std::size_t max_steps) {
    return {Err::NoHalt, 0};
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using K = OpKind;
static bool is(Result r, int v) { return r.err == Err::None && r.value == v; }

int main() {
    CHECK(is(run({{K::Push, 2}, {K::Push, 3}, {K::Add}, {K::Push, 4}, {K::Mul}, {K::Halt}}, 100), 20));
    CHECK(is(run({{K::Push, 10}, {K::Push, 3}, {K::Sub}, {K::Halt}}, 10), 7));
    CHECK(is(run({{K::Push, -7}, {K::Push, 2}, {K::Div}, {K::Halt}}, 10), -3));
    CHECK(is(run({{K::Push, 5}, {K::Dup}, {K::Mul}, {K::Halt}}, 10), 25));
    CHECK(is(run({{K::Push, 1}, {K::Push, 2}, {K::Swap}, {K::Push, 10}, {K::Mul}, {K::Halt}}, 10), 10 * 1));
    CHECK(is(run({{K::Push, 5}, {K::Dup}, {K::Jz, 6}, {K::Push, 1}, {K::Sub}, {K::Jmp, 1}, {K::Halt}}, 1000), 0));
    CHECK(run({{K::Jmp, 0}}, 50).err == Err::StepLimit);
    CHECK(run({{K::Push, 1}, {K::Add}, {K::Halt}}, 10).err == Err::StackUnderflow);
    CHECK(run({{K::Halt}}, 10).err == Err::StackUnderflow);
    CHECK(run({{K::Dup}}, 10).err == Err::StackUnderflow);
    { std::vector<Op> many(17, Op{K::Push, 1}); CHECK(run(many, 100).err == Err::StackOverflow); }
    CHECK(run({{K::Push, 1}, {K::Push, 0}, {K::Div}, {K::Halt}}, 10).err == Err::DivideByZero);
    CHECK(run({{K::Jmp, 5}, {K::Halt}}, 10).err == Err::BadJump);
    CHECK(run({{K::Push, 1}}, 10).err == Err::NoHalt);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cstddef>
#include <vector>

enum class OpKind { Push, Add, Sub, Mul, Div, Dup, Swap, Jz, Jmp, Halt };
struct Op { OpKind kind; int arg = 0; };
enum class Err { None, StackUnderflow, StackOverflow, DivideByZero, BadJump, StepLimit, NoHalt };
struct Result { Err err; int value; };

Result run(const std::vector<Op>& program, std::size_t max_steps) {
    int stack[16]; std::size_t len = 0, pc = 0, steps = 0;
    auto fail = [](Err e) { return Result{e, 0}; };
    while (true) {
        if (steps == max_steps) return fail(Err::StepLimit);
        if (pc >= program.size()) return fail(Err::NoHalt);
        ++steps;
        const Op op = program[pc++];
        auto pop = [&](int& out) { if (len == 0) return false; out = stack[--len]; return true; };
        auto push = [&](int v) { if (len == 16) return false; stack[len++] = v; return true; };
        int a = 0, b = 0;
        switch (op.kind) {
            case OpKind::Push: if (!push(op.arg)) return fail(Err::StackOverflow); break;
            case OpKind::Add: case OpKind::Sub: case OpKind::Mul: case OpKind::Div: {
                if (!pop(b) || !pop(a)) return fail(Err::StackUnderflow);
                int r = 0;
                if (op.kind == OpKind::Add) r = a + b; else if (op.kind == OpKind::Sub) r = a - b; else if (op.kind == OpKind::Mul) r = a * b;
                else { if (b == 0) return fail(Err::DivideByZero); r = a / b; }
                push(r); break;
            }
            case OpKind::Dup: if (!pop(a)) return fail(Err::StackUnderflow); push(a); if (!push(a)) return fail(Err::StackOverflow); break;
            case OpKind::Swap: if (!pop(b) || !pop(a)) return fail(Err::StackUnderflow); push(b); push(a); break;
            case OpKind::Jz: if (!pop(a)) return fail(Err::StackUnderflow); if (a == 0) { if (static_cast<std::size_t>(op.arg) >= program.size()) return fail(Err::BadJump); pc = static_cast<std::size_t>(op.arg); } break;
            case OpKind::Jmp: if (static_cast<std::size_t>(op.arg) >= program.size()) return fail(Err::BadJump); pc = static_cast<std::size_t>(op.arg); break;
            case OpKind::Halt: if (!pop(a)) return fail(Err::StackUnderflow); return {Err::None, a};
        }
    }
}
`,
    },
  },
});
