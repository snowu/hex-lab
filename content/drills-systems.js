/* Drills for the Physics, AI, Graphics and Networking tracks (Zig and C++). */
Object.assign(window.DRILLS, {

  behavior_tree: {
    title: 'A behaviour tree tick', minutes: 25, level: 'medium',
    prompt: `<p>A <b>behaviour tree</b> decides what an enemy does by asking a tree of nodes, every tick, "can you do your job?". Each node answers <code>success</code>, <code>failure</code> or <code>running</code> (still busy, ask me again next tick). Implement <code>tick</code> for four kinds of node:</p>
<ul><li><b>leaf</b>: the answer comes from <code>results[leaf_id]</code> (in a real game it would run a condition or action).</li><li><b>sequence</b> ("and"): tick children in order. The first one that is not <code>success</code> decides the answer (<code>failure</code> or <code>running</code>). All succeeded (or no children): <code>success</code>.</li><li><b>selector</b> ("or", a fallback list): tick children in order. The first one that is not <code>failure</code> decides the answer. All failed (or none): <code>failure</code>.</li><li><b>inverter</b>: swaps success and failure, passes <code>running</code> through.</li></ul>
<p>Nodes live in an array. A leaf stores its result index in <code>a</code>. A sequence or selector stores the start of its children in <code>a</code> and the count in <code>b</code>; the children's node indices are in the <code>kids</code> array. An inverter stores its child's node index in <code>a</code>. The tree is re-evaluated from the root every tick (no memory), which keeps it reactive: if the enemy loses sight of the player, the chase branch fails on the next tick.</p>`,
    hint: 'A recursive function with a switch on the node kind. For a sequence: for each child index in kids[a..a+b], r = tick(child); if r != success return r. After the loop return success. A selector is the mirror image with failure.',
    notes: 'Behaviour trees replaced big finite state machines in many games (Halo 2 popularised them) because they compose: you build "attack" once and reuse it under different parents, and adding a behaviour is adding a branch, not rewiring transitions. Real implementations add decorators (cooldown, repeat, "until success"), parallel nodes, a blackboard for shared data, and a memory variant so a sequence resumes at the running child. Godot has the LimboAI addon and the Beehave addon. The cost: debugging "why did it do that?" needs good tooling (highlight the active path).',
    zig: {
      starter: String.raw`const std = @import("std");

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
`,
      tests: String.raw`// root selector [ sequence [ sees_player, in_range, attack ], patrol ], plus an inverter around leaf 2
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
`,
      solution: String.raw`const std = @import("std");

pub const Status = enum { success, failure, running };
pub const Kind = enum { leaf, sequence, selector, inverter };
pub const Node = struct { kind: Kind, a: usize = 0, b: usize = 0 };

pub fn tick(nodes: []const Node, kids: []const usize, results: []const Status, root: usize) Status {
    const n = nodes[root];
    switch (n.kind) {
        .leaf => return results[n.a],
        .inverter => return switch (tick(nodes, kids, results, n.a)) {
            .success => .failure,
            .failure => .success,
            .running => .running,
        },
        .sequence => {
            for (kids[n.a .. n.a + n.b]) |c| {
                const r = tick(nodes, kids, results, c);
                if (r != .success) return r;
            }
            return .success;
        },
        .selector => {
            for (kids[n.a .. n.a + n.b]) |c| {
                const r = tick(nodes, kids, results, c);
                if (r != .failure) return r;
            }
            return .failure;
        },
    }
}
`,
    },
    cpp: {
      starter: String.raw`#include <cstddef>
#include <vector>

enum class Status { Success, Failure, Running };
enum class Kind { Leaf, Sequence, Selector, Inverter };
struct Node { Kind kind; std::size_t a = 0, b = 0; };

// leaf: a = index into results. sequence/selector: children are kids[a .. a + b]. inverter: a = child node index.
Status tick(const std::vector<Node>& nodes, const std::vector<std::size_t>& kids, const std::vector<Status>& results, std::size_t root) {
    return Status::Failure;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using S = Status;

int main() {
    std::vector<Node> nodes = {{Kind::Selector, 0, 2}, {Kind::Sequence, 2, 3}, {Kind::Leaf, 0}, {Kind::Leaf, 1}, {Kind::Leaf, 2}, {Kind::Leaf, 3}, {Kind::Inverter, 4}};
    std::vector<std::size_t> kids = {1, 5, 2, 3, 4};
    CHECK(tick(nodes, kids, {S::Success, S::Success, S::Success, S::Failure}, 0) == S::Success);
    CHECK(tick(nodes, kids, {S::Success, S::Success, S::Success, S::Failure}, 1) == S::Success);
    CHECK(tick(nodes, kids, {S::Success, S::Failure, S::Success, S::Success}, 0) == S::Success);
    CHECK(tick(nodes, kids, {S::Success, S::Failure, S::Success, S::Success}, 1) == S::Failure);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Failure, S::Failure}, 0) == S::Failure);
    CHECK(tick(nodes, kids, {S::Success, S::Success, S::Running, S::Success}, 0) == S::Running);
    CHECK(tick(nodes, kids, {S::Running, S::Failure, S::Failure, S::Success}, 0) == S::Running);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Success, S::Failure}, 6) == S::Failure);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Failure, S::Failure}, 6) == S::Success);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Running, S::Failure}, 6) == S::Running);
    std::vector<Node> ns = {{Kind::Sequence, 0, 0}, {Kind::Selector, 0, 0}};
    CHECK(tick(ns, {}, {}, 0) == S::Success);
    CHECK(tick(ns, {}, {}, 1) == S::Failure);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cstddef>
#include <vector>

enum class Status { Success, Failure, Running };
enum class Kind { Leaf, Sequence, Selector, Inverter };
struct Node { Kind kind; std::size_t a = 0, b = 0; };

Status tick(const std::vector<Node>& nodes, const std::vector<std::size_t>& kids, const std::vector<Status>& results, std::size_t root) {
    const Node& n = nodes[root];
    switch (n.kind) {
        case Kind::Leaf: return results[n.a];
        case Kind::Inverter: {
            Status r = tick(nodes, kids, results, n.a);
            return r == Status::Success ? Status::Failure : r == Status::Failure ? Status::Success : Status::Running;
        }
        case Kind::Sequence:
            for (std::size_t i = n.a; i < n.a + n.b; ++i) { Status r = tick(nodes, kids, results, kids[i]); if (r != Status::Success) return r; }
            return Status::Success;
        case Kind::Selector:
            for (std::size_t i = n.a; i < n.a + n.b; ++i) { Status r = tick(nodes, kids, results, kids[i]); if (r != Status::Failure) return r; }
            return Status::Failure;
    }
    return Status::Failure;
}
`,
    },
  },

  utility_pick: {
    title: 'Utility AI: scoring and not flip-flopping', minutes: 20, level: 'easy',
    prompt: `<p>In <b>utility AI</b> every possible action gets a score from 0 to 1 and the agent does the best one. A score is built from <b>considerations</b> (health is low, enemy is close, ammo left...), each already mapped to 0..1 by a response curve.</p>
<ul><li><code>score(considerations)</code>: multiply them, after clamping each to <code>[0, 1]</code>. A 0 vetoes the action. An empty list scores 1.</li><li><code>pick(scores, current, inertia)</code>: the index of the best action. The action currently running gets <code>inertia</code> <b>added</b> to its score first, so the agent does not flip between two actions whose scores hover around each other. Ties go to the lowest index. Returns nothing for an empty list. A <code>current</code> that is out of range is ignored.</li></ul>`,
    hint: 'score: start at 1.0 and multiply by clamp(c, 0, 1). pick: loop i, value = scores[i] + (i == current ? inertia : 0); keep the best with a strict ">" so earlier indices win ties.',
    notes: 'Multiplying considerations is the simplest "and" (Dave Mark and Kevin Dill\'s GDC talks on utility AI are the reference). Designers shape behaviour by editing curves, not code. The inertia (or "commitment") term is not optional in practice: without it two close scores make the agent twitch between actions every frame. Other fixes are a minimum action time and cooldowns. Compare with behaviour trees: utility AI is better at "choose the most appropriate thing now" among many options, trees are better at scripted sequences.',
    zig: {
      starter: String.raw`const std = @import("std");

/// Multiply the considerations, each clamped to 0..1. An empty list scores 1.
pub fn score(considerations: []const f64) f64 {
    _ = considerations;
    return 0;
}

/// Index of the best action; the current one gets +inertia. Ties: lowest index. Empty: null.
pub fn pick(scores: []const f64, current: ?usize, inertia: f64) ?usize {
    _ = scores;
    _ = current;
    _ = inertia;
    return null;
}
`,
      tests: String.raw`test "score multiplies and clamps" {
    try std.testing.expectApproxEqAbs(@as(f64, 0.25), score(&.{ 0.5, 0.5 }), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.5), score(&.{ 1.7, 0.5 }), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.0), score(&.{ -0.3, 0.9 }), 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, 0.0), score(&.{ 0.8, 0.0, 0.9 }), 1e-12);
}
test "an empty list scores 1" {
    try std.testing.expectApproxEqAbs(@as(f64, 1.0), score(&.{}), 1e-12);
}
test "pick takes the highest score" {
    try std.testing.expectEqual(@as(?usize, 2), pick(&.{ 0.2, 0.5, 0.9, 0.1 }, null, 0));
}
test "ties go to the lowest index" {
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.1, 0.7, 0.7 }, null, 0));
}
test "inertia keeps the current action when scores are close" {
    try std.testing.expectEqual(@as(?usize, 0), pick(&.{ 0.50, 0.55 }, 0, 0.1));
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.50, 0.55 }, null, 0.1));
}
test "a much better action still wins" {
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.2, 0.9 }, 0, 0.1));
}
test "empty list and bad current" {
    try std.testing.expectEqual(@as(?usize, null), pick(&.{}, null, 0.1));
    try std.testing.expectEqual(@as(?usize, 1), pick(&.{ 0.1, 0.4 }, 7, 0.5));
}
`,
      solution: String.raw`const std = @import("std");

pub fn score(considerations: []const f64) f64 {
    var s: f64 = 1.0;
    for (considerations) |c| s *= std.math.clamp(c, 0.0, 1.0);
    return s;
}

pub fn pick(scores: []const f64, current: ?usize, inertia: f64) ?usize {
    var best: ?usize = null;
    var best_v: f64 = 0;
    for (scores, 0..) |sc, i| {
        const v = sc + (if (current != null and current.? == i) inertia else 0.0);
        if (best == null or v > best_v) {
            best = i;
            best_v = v;
        }
    }
    return best;
}
`,
    },
    cpp: {
      starter: String.raw`#include <algorithm>
#include <cstddef>
#include <optional>
#include <vector>

// Multiply the considerations, each clamped to 0..1. An empty list scores 1.
double score(const std::vector<double>& considerations) { return 0; }

// Index of the best action; the current one gets +inertia. Ties: lowest index. Empty: nothing.
std::optional<std::size_t> pick(const std::vector<double>& scores, std::optional<std::size_t> current, double inertia) { return std::nullopt; }
`,
      tests: String.raw`#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool near(double a, double b) { return std::fabs(a - b) < 1e-12; }
using O = std::optional<std::size_t>;

int main() {
    CHECK(near(score({0.5, 0.5}), 0.25)); CHECK(near(score({1.7, 0.5}), 0.5)); CHECK(near(score({-0.3, 0.9}), 0.0)); CHECK(near(score({0.8, 0.0, 0.9}), 0.0)); CHECK(near(score({}), 1.0));
    CHECK(pick({0.2, 0.5, 0.9, 0.1}, std::nullopt, 0) == O(2));
    CHECK(pick({0.1, 0.7, 0.7}, std::nullopt, 0) == O(1));
    CHECK(pick({0.50, 0.55}, O(0), 0.1) == O(0)); CHECK(pick({0.50, 0.55}, std::nullopt, 0.1) == O(1));
    CHECK(pick({0.2, 0.9}, O(0), 0.1) == O(1));
    CHECK(!pick({}, std::nullopt, 0.1).has_value()); CHECK(pick({0.1, 0.4}, O(7), 0.5) == O(1));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <algorithm>
#include <cstddef>
#include <optional>
#include <vector>

double score(const std::vector<double>& considerations) {
    double s = 1.0;
    for (double c : considerations) s *= std::clamp(c, 0.0, 1.0);
    return s;
}

std::optional<std::size_t> pick(const std::vector<double>& scores, std::optional<std::size_t> current, double inertia) {
    std::optional<std::size_t> best;
    double best_v = 0;
    for (std::size_t i = 0; i < scores.size(); ++i) {
        double v = scores[i] + (current && *current == i ? inertia : 0.0);
        if (!best || v > best_v) { best = i; best_v = v; }
    }
    return best;
}
`,
    },
  },

  spring_integrator: {
    title: 'Integrators: why the order of two lines matters', minutes: 25, level: 'medium',
    prompt: `<p>A spring with unit mass accelerates by <code>a = -k * x</code>. An <b>integrator</b> turns acceleration into motion one time step at a time. The obvious version (explicit Euler: <code>x += v*dt; v += a*dt</code>) <b>adds energy every step</b> and the spring slowly explodes. The starter does exactly that. Implement two better ones:</p>
<ul><li><code>semiImplicit</code> (symplectic Euler): update the velocity first, then move using the <b>new</b> velocity. Same cost, but the energy stays bounded.</li><li><code>velocityVerlet</code>: <code>x += v*dt + a*dt*dt/2</code>, compute the new acceleration from the new position, then <code>v += (a_old + a_new) * dt / 2</code>. More accurate for the same step size.</li></ul>
<p>The tests run 10,000 steps (k = 4, dt = 0.01) and check how far the total energy <code>v²/2 + k x²/2</code> drifts, and compare positions with the exact solution <code>cos(t)</code> for k = 1.</p>`,
    hint: 'semiImplicit: v_new = v + (-k*x)*dt; x_new = x + v_new*dt. velocityVerlet: a = -k*x; x_new = x + v*dt + 0.5*a*dt*dt; a_new = -k*x_new; v_new = v + 0.5*(a + a_new)*dt.',
    notes: 'Gaffer On Games, "Integration Basics", is the reference. Explicit Euler is first-order and unconditionally unstable for oscillators; semi-implicit Euler is also first-order but symplectic, which is why it is what most game physics engines (Box2D, Bullet, Godot) use. Verlet is second-order and the basis of rope and cloth. RK4 is more accurate per step but costs four force evaluations, usually not worth it for games. Whatever you pick, integrate with a fixed timestep (see the game loop lesson): a variable dt makes the energy behaviour unpredictable.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const State = struct { x: f64, v: f64 };

// Spring with unit mass: acceleration = -k * x.
// The starter is explicit Euler, which gains energy every step. Fix both functions.
pub fn semiImplicit(s: State, k: f64, dt: f64) State {
    const a = -k * s.x;
    return .{ .x = s.x + s.v * dt, .v = s.v + a * dt };
}

pub fn velocityVerlet(s: State, k: f64, dt: f64) State {
    const a = -k * s.x;
    return .{ .x = s.x + s.v * dt, .v = s.v + a * dt };
}
`,
      tests: String.raw`const StepFn = *const fn (State, f64, f64) State;

fn maxEnergyDrift(step: StepFn, k: f64, dt: f64, steps: usize) f64 {
    var s = State{ .x = 1.0, .v = 0.0 };
    const e0 = 0.5 * s.v * s.v + 0.5 * k * s.x * s.x;
    var worst: f64 = 0;
    for (0..steps) |_| {
        s = step(s, k, dt);
        const e = 0.5 * s.v * s.v + 0.5 * k * s.x * s.x;
        worst = @max(worst, @abs(e / e0 - 1.0));
    }
    return worst;
}

fn positionError(step: StepFn) f64 {
    var s = State{ .x = 1.0, .v = 0.0 };
    const n: usize = 157; // t = 1.57, close to pi/2 where cos(t) is about 0
    for (0..n) |_| s = step(s, 1.0, 0.01);
    return @abs(s.x - @cos(@as(f64, @floatFromInt(n)) * 0.01));
}

test "first steps match the formulas" {
    const a = semiImplicit(.{ .x = 1, .v = 0 }, 4, 0.1);
    try std.testing.expectApproxEqAbs(@as(f64, 0.96), a.x, 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, -0.4), a.v, 1e-12);
    const b = velocityVerlet(.{ .x = 1, .v = 0 }, 4, 0.1);
    try std.testing.expectApproxEqAbs(@as(f64, 0.98), b.x, 1e-12);
    try std.testing.expectApproxEqAbs(@as(f64, -0.396), b.v, 1e-12);
}
test "semi-implicit Euler keeps the energy bounded for 10,000 steps" {
    try std.testing.expect(maxEnergyDrift(semiImplicit, 4, 0.01, 10_000) < 0.02);
}
test "velocity Verlet keeps it far closer" {
    try std.testing.expect(maxEnergyDrift(velocityVerlet, 4, 0.01, 10_000) < 0.001);
}
test "positions follow the exact solution" {
    try std.testing.expect(positionError(semiImplicit) < 0.01);
    try std.testing.expect(positionError(velocityVerlet) < 0.0001);
}
`,
      solution: String.raw`const std = @import("std");

pub const State = struct { x: f64, v: f64 };

pub fn semiImplicit(s: State, k: f64, dt: f64) State {
    const v = s.v + (-k * s.x) * dt;
    return .{ .x = s.x + v * dt, .v = v };
}

pub fn velocityVerlet(s: State, k: f64, dt: f64) State {
    const a = -k * s.x;
    const x = s.x + s.v * dt + 0.5 * a * dt * dt;
    const a_new = -k * x;
    return .{ .x = x, .v = s.v + 0.5 * (a + a_new) * dt };
}
`,
    },
    cpp: {
      starter: String.raw`struct State { double x, v; };

// Spring with unit mass: acceleration = -k * x.
// The starter is explicit Euler, which gains energy every step. Fix both functions.
State semi_implicit(State s, double k, double dt) {
    double a = -k * s.x;
    return {s.x + s.v * dt, s.v + a * dt};
}

State velocity_verlet(State s, double k, double dt) {
    double a = -k * s.x;
    return {s.x + s.v * dt, s.v + a * dt};
}
`,
      tests: String.raw`#include <algorithm>
#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Step = State (*)(State, double, double);

static double max_drift(Step f, double k, double dt, int steps) {
    State s{1.0, 0.0}; double e0 = 0.5 * s.v * s.v + 0.5 * k * s.x * s.x, worst = 0;
    for (int i = 0; i < steps; ++i) { s = f(s, k, dt); double e = 0.5 * s.v * s.v + 0.5 * k * s.x * s.x; worst = std::max(worst, std::fabs(e / e0 - 1.0)); }
    return worst;
}
static double pos_err(Step f) { State s{1.0, 0.0}; for (int i = 0; i < 157; ++i) s = f(s, 1.0, 0.01); return std::fabs(s.x - std::cos(157 * 0.01)); }

int main() {
    State a = semi_implicit({1, 0}, 4, 0.1); CHECK(std::fabs(a.x - 0.96) < 1e-12); CHECK(std::fabs(a.v + 0.4) < 1e-12);
    State b = velocity_verlet({1, 0}, 4, 0.1); CHECK(std::fabs(b.x - 0.98) < 1e-12); CHECK(std::fabs(b.v + 0.396) < 1e-12);
    CHECK(max_drift(semi_implicit, 4, 0.01, 10000) < 0.02);
    CHECK(max_drift(velocity_verlet, 4, 0.01, 10000) < 0.001);
    CHECK(pos_err(semi_implicit) < 0.01);
    CHECK(pos_err(velocity_verlet) < 0.0001);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`struct State { double x, v; };

State semi_implicit(State s, double k, double dt) {
    double v = s.v + (-k * s.x) * dt;
    return {s.x + v * dt, v};
}

State velocity_verlet(State s, double k, double dt) {
    double a = -k * s.x;
    double x = s.x + s.v * dt + 0.5 * a * dt * dt;
    double a_new = -k * x;
    return {x, s.v + 0.5 * (a + a_new) * dt};
}
`,
    },
  },

  impulse_1d: {
    title: 'Collision response with impulses', minutes: 20, level: 'medium',
    prompt: `<p>Two balls roll along a line and touch. Body 1 is on the <b>left</b> of body 2. Write <code>collide(m1, v1, m2, v2, e)</code> returning their velocities after the hit, where <code>e</code> is the <b>restitution</b> (0 = they stick together, 1 = perfectly bouncy).</p>
<p>If they are not approaching (<code>v1 &lt;= v2</code>) nothing happens: return the velocities unchanged. Otherwise momentum is conserved and the relative speed after the hit is <code>e</code> times the relative speed before, reversed:</p>
<pre><code>v1' = (m1*v1 + m2*v2 + m2*e*(v2 - v1)) / (m1 + m2)
v2' = (m1*v1 + m2*v2 + m1*e*(v1 - v2)) / (m1 + m2)</code></pre>`,
    hint: 'Check approaching first (v1 > v2). Then it is just the two formulas. The tests verify momentum conservation, energy conservation at e = 1, sticking at e = 0, and the "wall" limit (one body so heavy it does not move).',
    notes: 'Real engines (Box2D, Bullet, Godot Physics) solve this with impulses along the contact normal, adding friction along the tangent, and iterate over all contacts several times ("sequential impulses") because resolving one pair disturbs another. A stack of boxes is hard exactly because of that coupling. The e value is usually blended from the two materials (the larger or the product), and below a small closing speed e is forced to 0 so resting objects stop jittering. Erin Catto\'s GDC "Understanding Constraints" talk is the next step.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Pair = struct { v1: f64, v2: f64 };

/// Body 1 is on the left of body 2 and they touch. e = restitution.
pub fn collide(m1: f64, v1: f64, m2: f64, v2: f64, e: f64) Pair {
    _ = m1;
    _ = m2;
    _ = e;
    return .{ .v1 = v1, .v2 = v2 };
}
`,
      tests: String.raw`fn expectPair(a: f64, b: f64, got: Pair) !void {
    try std.testing.expectApproxEqAbs(a, got.v1, 1e-9);
    try std.testing.expectApproxEqAbs(b, got.v2, 1e-9);
}

test "equal masses, perfect bounce: they swap velocities" {
    try expectPair(0, 3, collide(1, 3, 1, 0, 1));
}
test "unequal masses (checked by hand)" {
    try expectPair(1, 4, collide(2, 3, 1, 0, 1));
}
test "e = 0: they move together at the common velocity" {
    const r = collide(2, 6, 3, 1, 0);
    try std.testing.expectApproxEqAbs((2.0 * 6 + 3.0 * 1) / 5.0, r.v1, 1e-9);
    try std.testing.expectApproxEqAbs(r.v1, r.v2, 1e-9);
}
test "momentum is conserved for any e" {
    for ([_]f64{ 0, 0.3, 0.8, 1 }) |e| {
        const r = collide(1.5, 4.0, 0.7, -2.0, e);
        try std.testing.expectApproxEqAbs(1.5 * 4.0 + 0.7 * -2.0, 1.5 * r.v1 + 0.7 * r.v2, 1e-9);
    }
}
test "kinetic energy is conserved when e = 1" {
    const r = collide(1.5, 4.0, 0.7, -2.0, 1);
    try std.testing.expectApproxEqAbs(0.5 * 1.5 * 16 + 0.5 * 0.7 * 4, 0.5 * 1.5 * r.v1 * r.v1 + 0.5 * 0.7 * r.v2 * r.v2, 1e-9);
}
test "against an almost immovable wall the ball comes back at e times its speed" {
    const r = collide(1, 10, 1e12, 0, 0.5);
    try std.testing.expectApproxEqAbs(@as(f64, -5), r.v1, 1e-6);
}
test "bodies that are separating or moving together are left alone" {
    try expectPair(1, 2, collide(1, 1, 1, 2, 1));
    try expectPair(2, 2, collide(3, 2, 1, 2, 0.5));
}
`,
      solution: String.raw`const std = @import("std");

pub const Pair = struct { v1: f64, v2: f64 };

pub fn collide(m1: f64, v1: f64, m2: f64, v2: f64, e: f64) Pair {
    if (v1 <= v2) return .{ .v1 = v1, .v2 = v2 };
    const p = m1 * v1 + m2 * v2;
    const m = m1 + m2;
    return .{ .v1 = (p + m2 * e * (v2 - v1)) / m, .v2 = (p + m1 * e * (v1 - v2)) / m };
}
`,
    },
    cpp: {
      starter: String.raw`struct Pair { double v1, v2; };

// Body 1 is on the left of body 2 and they touch. e = restitution.
Pair collide(double m1, double v1, double m2, double v2, double e) {
    return {v1, v2};
}
`,
      tests: String.raw`#include <cmath>
#include <cstdio>
#include <initializer_list>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool near(double a, double b, double t = 1e-9) { return std::fabs(a - b) < t; }
static bool is(Pair p, double a, double b) { return near(p.v1, a) && near(p.v2, b); }

int main() {
    CHECK(is(collide(1, 3, 1, 0, 1), 0, 3));
    CHECK(is(collide(2, 3, 1, 0, 1), 1, 4));
    { Pair r = collide(2, 6, 3, 1, 0); CHECK(near(r.v1, (2.0 * 6 + 3.0 * 1) / 5.0)); CHECK(near(r.v1, r.v2)); }
    for (double e : {0.0, 0.3, 0.8, 1.0}) { Pair r = collide(1.5, 4.0, 0.7, -2.0, e); CHECK(near(1.5 * 4.0 + 0.7 * -2.0, 1.5 * r.v1 + 0.7 * r.v2)); }
    { Pair r = collide(1.5, 4.0, 0.7, -2.0, 1); CHECK(near(0.5 * 1.5 * 16 + 0.5 * 0.7 * 4, 0.5 * 1.5 * r.v1 * r.v1 + 0.5 * 0.7 * r.v2 * r.v2)); }
    { Pair r = collide(1, 10, 1e12, 0, 0.5); CHECK(near(r.v1, -5, 1e-6)); }
    CHECK(is(collide(1, 1, 1, 2, 1), 1, 2));
    CHECK(is(collide(3, 2, 1, 2, 0.5), 2, 2));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`struct Pair { double v1, v2; };

Pair collide(double m1, double v1, double m2, double v2, double e) {
    if (v1 <= v2) return {v1, v2};
    double p = m1 * v1 + m2 * v2, m = m1 + m2;
    return {(p + m2 * e * (v2 - v1)) / m, (p + m1 * e * (v1 - v2)) / m};
}
`,
    },
  },

  grid_raycast: {
    title: 'Raycast on a grid (DDA)', minutes: 30, level: 'hard',
    prompt: `<p>Hitscan weapons, line of sight and "what is under the cursor" all need a <b>raycast</b>. On a tile grid the fast, exact method is the <b>DDA</b> (digital differential analyzer, Amanatides and Woo): instead of sampling along the ray, jump from one cell border to the next.</p>
<p>The grid is a list of rows; a cell is 1×1; <code>'#'</code> is a wall; the position <code>(ox, oy)</code> is in cell units (so <code>(0.5, 0.5)</code> is the middle of the top-left cell, x grows right, y grows down). <code>(dx, dy)</code> is the direction (any length except zero). Return the <b>first wall cell</b> the ray enters and the distance along the ray at which it enters it, or nothing if the ray leaves the grid or travels more than <code>max_dist</code> without hitting one. If the origin is already inside a wall, that is a hit at distance 0. An origin outside the grid has no hit.</p>`,
    hint: 'Normalise the direction. cell = floor(origin). For each axis keep tMax = distance along the ray to the next border on that axis, and tDelta = distance between borders (1/|d|, or infinity when d is 0). Loop: step on the axis with the smaller tMax (the distance you report is that tMax BEFORE you add tDelta), check bounds, check the new cell. Beware exact corner crossings in your own tests: both axes tie.',
    notes: 'The DDA visits exactly the cells the ray passes through, so the cost is proportional to the distance, not to the number of samples. The same loop draws lines on a grid, does shadow casting, and (with a height per cell) renders the classic Wolfenstein-style 3D view. In 3D engines the equivalent is a ray through a BVH or the physics broadphase. For rays against shapes (circles, boxes) use analytic tests instead, and for a thick "projectile" use a shape cast, as in the collision lesson.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Hit = struct { col: usize, row: usize, dist: f64 };

/// grid rows of '.' and '#', cells are 1x1, y grows down. Returns the first wall cell entered by the ray.
pub fn raycast(grid: []const []const u8, ox: f64, oy: f64, dx: f64, dy: f64, max_dist: f64) ?Hit {
    _ = grid;
    _ = ox;
    _ = oy;
    _ = dx;
    _ = dy;
    _ = max_dist;
    return null;
}
`,
      tests: String.raw`const G = [_][]const u8{ ".....", "..#..", ".....", "....#", "....." };

fn expectHit(col: usize, row: usize, dist: f64, got: ?Hit) !void {
    try std.testing.expect(got != null);
    try std.testing.expectEqual(col, got.?.col);
    try std.testing.expectEqual(row, got.?.row);
    try std.testing.expectApproxEqAbs(dist, got.?.dist, 1e-9);
}

test "horizontal ray" {
    try expectHit(2, 1, 1.5, raycast(&G, 0.5, 1.5, 1, 0, 10));
    try expectHit(4, 3, 3.5, raycast(&G, 0.5, 3.5, 1, 0, 10));
}
test "vertical ray going up" {
    try expectHit(2, 1, 2.5, raycast(&G, 2.5, 4.5, 0, -1, 10));
}
test "diagonal rays (the direction need not be normalised)" {
    try expectHit(2, 1, 1.6770509831248424, raycast(&G, 0.5, 0.5, 2, 1, 10));
    try expectHit(2, 1, 2.1633307652783937, raycast(&G, 0.2, 0.3, 3, 2, 10));
}
test "a ray that finds nothing, and one that leaves the grid" {
    try std.testing.expect(raycast(&G, 4.5, 0.5, -1, 0, 10) == null);
    try std.testing.expect(raycast(&G, 0.5, 0.5, -1, 0, 10) == null);
}
test "max distance stops the ray" {
    try std.testing.expect(raycast(&G, 0.5, 1.5, 1, 0, 1.0) == null);
    try std.testing.expect(raycast(&G, 0.5, 1.5, 1, 0, 1.6) != null);
}
test "starting inside a wall is a hit at distance 0, starting outside the grid is no hit" {
    try expectHit(2, 1, 0.0, raycast(&G, 2.5, 1.5, 1, 0, 10));
    try std.testing.expect(raycast(&G, -1.5, 0.5, 1, 0, 10) == null);
}
`,
      solution: String.raw`const std = @import("std");

pub const Hit = struct { col: usize, row: usize, dist: f64 };

pub fn raycast(grid: []const []const u8, ox: f64, oy: f64, dx: f64, dy: f64, max_dist: f64) ?Hit {
    const h: i32 = @intCast(grid.len);
    if (h == 0) return null;
    const w: i32 = @intCast(grid[0].len);
    const len = @sqrt(dx * dx + dy * dy);
    if (len == 0) return null;
    const ux = dx / len;
    const uy = dy / len;
    var cx: i32 = @intFromFloat(@floor(ox));
    var cy: i32 = @intFromFloat(@floor(oy));
    if (cx < 0 or cy < 0 or cx >= w or cy >= h) return null;
    if (grid[@intCast(cy)][@intCast(cx)] == '#') return .{ .col = @intCast(cx), .row = @intCast(cy), .dist = 0 };

    const inf = std.math.inf(f64);
    const step_x: i32 = if (ux > 0) 1 else -1;
    const step_y: i32 = if (uy > 0) 1 else -1;
    const t_delta_x = if (ux != 0) @abs(1.0 / ux) else inf;
    const t_delta_y = if (uy != 0) @abs(1.0 / uy) else inf;
    var t_max_x = if (ux == 0) inf else (if (ux > 0) @as(f64, @floatFromInt(cx + 1)) - ox else ox - @as(f64, @floatFromInt(cx))) * t_delta_x;
    var t_max_y = if (uy == 0) inf else (if (uy > 0) @as(f64, @floatFromInt(cy + 1)) - oy else oy - @as(f64, @floatFromInt(cy))) * t_delta_y;

    while (true) {
        var t: f64 = undefined;
        if (t_max_x < t_max_y) {
            t = t_max_x;
            cx += step_x;
            t_max_x += t_delta_x;
        } else {
            t = t_max_y;
            cy += step_y;
            t_max_y += t_delta_y;
        }
        if (t > max_dist or cx < 0 or cy < 0 or cx >= w or cy >= h) return null;
        if (grid[@intCast(cy)][@intCast(cx)] == '#') return .{ .col = @intCast(cx), .row = @intCast(cy), .dist = t };
    }
}
`,
    },
    cpp: {
      starter: String.raw`#include <cmath>
#include <optional>
#include <string>
#include <vector>

struct Hit { int col, row; double dist; };

// grid rows of '.' and '#', cells are 1x1, y grows down. Returns the first wall cell entered by the ray.
std::optional<Hit> raycast(const std::vector<std::string>& grid, double ox, double oy, double dx, double dy, double max_dist) {
    return std::nullopt;
}
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool hit(std::optional<Hit> h, int c, int r, double d) { return h && h->col == c && h->row == r && std::fabs(h->dist - d) < 1e-9; }

int main() {
    std::vector<std::string> G = {".....", "..#..", ".....", "....#", "....."};
    CHECK(hit(raycast(G, 0.5, 1.5, 1, 0, 10), 2, 1, 1.5));
    CHECK(hit(raycast(G, 0.5, 3.5, 1, 0, 10), 4, 3, 3.5));
    CHECK(hit(raycast(G, 2.5, 4.5, 0, -1, 10), 2, 1, 2.5));
    CHECK(hit(raycast(G, 0.5, 0.5, 2, 1, 10), 2, 1, 1.6770509831248424));
    CHECK(hit(raycast(G, 0.2, 0.3, 3, 2, 10), 2, 1, 2.1633307652783937));
    CHECK(!raycast(G, 4.5, 0.5, -1, 0, 10));
    CHECK(!raycast(G, 0.5, 0.5, -1, 0, 10));
    CHECK(!raycast(G, 0.5, 1.5, 1, 0, 1.0));
    CHECK(raycast(G, 0.5, 1.5, 1, 0, 1.6).has_value());
    CHECK(hit(raycast(G, 2.5, 1.5, 1, 0, 10), 2, 1, 0.0));
    CHECK(!raycast(G, -1.5, 0.5, 1, 0, 10));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cmath>
#include <limits>
#include <optional>
#include <string>
#include <vector>

struct Hit { int col, row; double dist; };

std::optional<Hit> raycast(const std::vector<std::string>& grid, double ox, double oy, double dx, double dy, double max_dist) {
    int h = static_cast<int>(grid.size());
    if (h == 0) return std::nullopt;
    int w = static_cast<int>(grid[0].size());
    double len = std::sqrt(dx * dx + dy * dy);
    if (len == 0) return std::nullopt;
    double ux = dx / len, uy = dy / len;
    int cx = static_cast<int>(std::floor(ox)), cy = static_cast<int>(std::floor(oy));
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) return std::nullopt;
    if (grid[cy][cx] == '#') return Hit{cx, cy, 0.0};

    const double inf = std::numeric_limits<double>::infinity();
    int step_x = ux > 0 ? 1 : -1, step_y = uy > 0 ? 1 : -1;
    double t_delta_x = ux != 0 ? std::fabs(1.0 / ux) : inf, t_delta_y = uy != 0 ? std::fabs(1.0 / uy) : inf;
    double t_max_x = ux == 0 ? inf : (ux > 0 ? cx + 1 - ox : ox - cx) * t_delta_x;
    double t_max_y = uy == 0 ? inf : (uy > 0 ? cy + 1 - oy : oy - cy) * t_delta_y;
    for (;;) {
        double t;
        if (t_max_x < t_max_y) { t = t_max_x; cx += step_x; t_max_x += t_delta_x; }
        else { t = t_max_y; cy += step_y; t_max_y += t_delta_y; }
        if (t > max_dist || cx < 0 || cy < 0 || cx >= w || cy >= h) return std::nullopt;
        if (grid[cy][cx] == '#') return Hit{cx, cy, t};
    }
}
`,
    },
  },

  transform2d: {
    title: '2D transforms: matrices and the order of operations', minutes: 30, level: 'medium',
    prompt: `<p>A 2D transform (move, rotate, scale) is an <b>affine matrix</b> stored as six numbers: <code>x' = a*x + c*y + tx</code> and <code>y' = b*x + d*y + ty</code>. Parent and child nodes combine by multiplying their matrices. Implement:</p>
<ul><li><code>identity</code>, <code>translate(x, y)</code>, <code>rotate(radians)</code> (counter-clockwise: rotating <code>(1, 0)</code> by 90° gives <code>(0, 1)</code>), <code>scale(sx, sy)</code>.</li><li><code>mul(parent, child)</code>: the matrix that applies the <b>child first</b>, then the parent. This is how a child's local transform becomes a world transform.</li><li><code>apply(m, x, y)</code>: transform a point.</li><li><code>inverse(m)</code>: the matrix that undoes <code>m</code>, or nothing if it cannot be undone (a zero determinant, e.g. <code>scale(0, 1)</code>). You need it to turn a mouse position back into local coordinates.</li></ul>`,
    hint: 'Treat it as the 3×3 matrix [[a c tx], [b d ty], [0 0 1]] and multiply: for mul(p, c): a = p.a*c.a + p.c*c.b; b = p.b*c.a + p.d*c.b; c = p.a*c.c + p.c*c.d; d = p.b*c.c + p.d*c.d; tx = p.a*c.tx + p.c*c.ty + p.tx; ty = p.b*c.tx + p.d*c.ty + p.ty. Inverse: det = a*d - b*c; the 2×2 part inverts to [d -c; -b a] / det, and the translation becomes -(inverse2x2 · (tx, ty)).',
    notes: 'Order of operations is the number-one transform bug. "Rotate then translate" and "translate then rotate" are different things: the first spins a thing around its own centre and then moves it, the second moves it and then swings it around the origin. Scene graphs (Godot Node2D, Unity Transform) store position/rotation/scale per node and multiply down the tree, usually caching the result with a dirty flag (see the patterns track). Non-uniform scale combined with rotation produces shear, which is why some engines forbid it on parents. 3D uses 4×4 matrices and quaternions for rotation, but the ideas are the same.',
    zig: {
      starter: String.raw`const std = @import("std");

/// x' = a*x + c*y + tx ; y' = b*x + d*y + ty
pub const Mat = struct { a: f64, b: f64, c: f64, d: f64, tx: f64, ty: f64 };
pub const identity = Mat{ .a = 1, .b = 0, .c = 0, .d = 1, .tx = 0, .ty = 0 };

pub fn translate(x: f64, y: f64) Mat {
    _ = x;
    _ = y;
    return identity;
}

pub fn rotate(rad: f64) Mat {
    _ = rad;
    return identity;
}

pub fn scale(sx: f64, sy: f64) Mat {
    _ = sx;
    _ = sy;
    return identity;
}

/// The matrix that applies c first and then p (a child inside a parent).
pub fn mul(p: Mat, c: Mat) Mat {
    _ = p;
    return c;
}

pub fn apply(m: Mat, x: f64, y: f64) [2]f64 {
    _ = m;
    return .{ x, y };
}

pub fn inverse(m: Mat) ?Mat {
    _ = m;
    return null;
}
`,
      tests: String.raw`fn expectPt(ex: f64, ey: f64, got: [2]f64) !void {
    try std.testing.expectApproxEqAbs(ex, got[0], 1e-9);
    try std.testing.expectApproxEqAbs(ey, got[1], 1e-9);
}

test "the basic transforms" {
    try expectPt(4, 7, apply(translate(3, 5), 1, 2));
    try expectPt(0, 1, apply(rotate(std.math.pi / 2.0), 1, 0));
    try expectPt(-1, 0, apply(rotate(std.math.pi / 2.0), 0, 1));
    try expectPt(6, -3, apply(scale(2, -3), 3, 1));
    try expectPt(5, 6, apply(identity, 5, 6));
}
test "child first, then parent: parent = translate * rotate" {
    const m = mul(translate(10, 0), rotate(std.math.pi / 2.0));
    try expectPt(10, 1, apply(m, 1, 0));
}
test "order matters: rotate * translate is a different transform" {
    const m = mul(rotate(std.math.pi / 2.0), translate(10, 0));
    try expectPt(0, 11, apply(m, 1, 0));
}
test "mul agrees with applying the two transforms one after another" {
    const p = mul(translate(3, -2), scale(2, 0.5));
    const c = mul(rotate(0.7), translate(1, 4));
    const m = mul(p, c);
    const step = apply(p, apply(c, 2.5, -1.5)[0], apply(c, 2.5, -1.5)[1]);
    try expectPt(step[0], step[1], apply(m, 2.5, -1.5));
}
test "inverse undoes the transform" {
    const m = mul(translate(5, 6), mul(rotate(1.1), scale(2, 3)));
    const inv = inverse(m).?;
    const p = apply(m, 1.25, -7.5);
    try expectPt(1.25, -7.5, apply(inv, p[0], p[1]));
}
test "a flattened transform has no inverse" {
    try std.testing.expect(inverse(scale(0, 1)) == null);
    try std.testing.expect(inverse(identity) != null);
}
`,
      solution: String.raw`const std = @import("std");

pub const Mat = struct { a: f64, b: f64, c: f64, d: f64, tx: f64, ty: f64 };
pub const identity = Mat{ .a = 1, .b = 0, .c = 0, .d = 1, .tx = 0, .ty = 0 };

pub fn translate(x: f64, y: f64) Mat {
    return .{ .a = 1, .b = 0, .c = 0, .d = 1, .tx = x, .ty = y };
}

pub fn rotate(rad: f64) Mat {
    const co = @cos(rad);
    const si = @sin(rad);
    return .{ .a = co, .b = si, .c = -si, .d = co, .tx = 0, .ty = 0 };
}

pub fn scale(sx: f64, sy: f64) Mat {
    return .{ .a = sx, .b = 0, .c = 0, .d = sy, .tx = 0, .ty = 0 };
}

pub fn mul(p: Mat, c: Mat) Mat {
    return .{
        .a = p.a * c.a + p.c * c.b,
        .b = p.b * c.a + p.d * c.b,
        .c = p.a * c.c + p.c * c.d,
        .d = p.b * c.c + p.d * c.d,
        .tx = p.a * c.tx + p.c * c.ty + p.tx,
        .ty = p.b * c.tx + p.d * c.ty + p.ty,
    };
}

pub fn apply(m: Mat, x: f64, y: f64) [2]f64 {
    return .{ m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty };
}

pub fn inverse(m: Mat) ?Mat {
    const det = m.a * m.d - m.b * m.c;
    if (@abs(det) < 1e-12) return null;
    const ia = m.d / det;
    const ib = -m.b / det;
    const ic = -m.c / det;
    const id = m.a / det;
    return .{ .a = ia, .b = ib, .c = ic, .d = id, .tx = -(ia * m.tx + ic * m.ty), .ty = -(ib * m.tx + id * m.ty) };
}
`,
    },
    cpp: {
      starter: String.raw`#include <array>
#include <cmath>
#include <optional>

// x' = a*x + c*y + tx ; y' = b*x + d*y + ty
struct Mat { double a, b, c, d, tx, ty; };
inline constexpr Mat kIdentity{1, 0, 0, 1, 0, 0};

Mat translate(double x, double y) { return kIdentity; }
Mat rotate(double rad) { return kIdentity; }
Mat scale(double sx, double sy) { return kIdentity; }
// The matrix that applies c first and then p (a child inside a parent).
Mat mul(const Mat& p, const Mat& c) { return c; }
std::array<double, 2> apply(const Mat& m, double x, double y) { return {x, y}; }
std::optional<Mat> inverse(const Mat& m) { return std::nullopt; }
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool pt(std::array<double, 2> p, double x, double y) { return std::fabs(p[0] - x) < 1e-9 && std::fabs(p[1] - y) < 1e-9; }
static const double kPi = 3.14159265358979323846;

int main() {
    CHECK(pt(apply(translate(3, 5), 1, 2), 4, 7));
    CHECK(pt(apply(rotate(kPi / 2), 1, 0), 0, 1));
    CHECK(pt(apply(rotate(kPi / 2), 0, 1), -1, 0));
    CHECK(pt(apply(scale(2, -3), 3, 1), 6, -3));
    CHECK(pt(apply(kIdentity, 5, 6), 5, 6));
    CHECK(pt(apply(mul(translate(10, 0), rotate(kPi / 2)), 1, 0), 10, 1));
    CHECK(pt(apply(mul(rotate(kPi / 2), translate(10, 0)), 1, 0), 0, 11));
    { Mat p = mul(translate(3, -2), scale(2, 0.5)), c = mul(rotate(0.7), translate(1, 4)), m = mul(p, c);
      auto inner = apply(c, 2.5, -1.5); auto step = apply(p, inner[0], inner[1]); CHECK(pt(apply(m, 2.5, -1.5), step[0], step[1])); }
    { Mat m = mul(translate(5, 6), mul(rotate(1.1), scale(2, 3))); auto inv = inverse(m); auto p = apply(m, 1.25, -7.5); CHECK(inv && pt(apply(*inv, p[0], p[1]), 1.25, -7.5)); }
    CHECK(!inverse(scale(0, 1))); CHECK(inverse(kIdentity).has_value());
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <array>
#include <cmath>
#include <optional>

struct Mat { double a, b, c, d, tx, ty; };
inline constexpr Mat kIdentity{1, 0, 0, 1, 0, 0};

Mat translate(double x, double y) { return {1, 0, 0, 1, x, y}; }
Mat rotate(double rad) { double co = std::cos(rad), si = std::sin(rad); return {co, si, -si, co, 0, 0}; }
Mat scale(double sx, double sy) { return {sx, 0, 0, sy, 0, 0}; }
Mat mul(const Mat& p, const Mat& c) {
    return {p.a * c.a + p.c * c.b, p.b * c.a + p.d * c.b, p.a * c.c + p.c * c.d, p.b * c.c + p.d * c.d,
            p.a * c.tx + p.c * c.ty + p.tx, p.b * c.tx + p.d * c.ty + p.ty};
}
std::array<double, 2> apply(const Mat& m, double x, double y) { return {m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty}; }
std::optional<Mat> inverse(const Mat& m) {
    double det = m.a * m.d - m.b * m.c;
    if (std::fabs(det) < 1e-12) return std::nullopt;
    double ia = m.d / det, ib = -m.b / det, ic = -m.c / det, id = m.a / det;
    return Mat{ia, ib, ic, id, -(ia * m.tx + ic * m.ty), -(ib * m.tx + id * m.ty)};
}
`,
    },
  },

  net_reconcile: {
    title: 'Client-side prediction and reconciliation', minutes: 20, level: 'medium',
    prompt: `<p>In an online game the server is the authority, but waiting a round trip to see your own character move feels terrible. So the client <b>predicts</b>: it applies each input immediately and sends it to the server tagged with a sequence number. Later the server reports <i>"after processing your input number N, you are here"</i>. The client must <b>reconcile</b>: start from the server's position and replay the inputs the server has not seen yet.</p>
<ul><li><code>reconcile(server_pos, acked, pending)</code>: <code>server_pos</code> plus the <code>dx</code> of every pending input whose <code>seq</code> is greater than <code>acked</code>.</li><li><code>dropAcked(pending, acked)</code>: how many leading inputs of <code>pending</code> (sorted by increasing <code>seq</code>) have <code>seq &lt;= acked</code> and can be forgotten.</li></ul>`,
    hint: 'Both are single loops over the pending inputs. For reconcile just skip inputs with seq <= acked. For dropAcked count from the front and stop at the first input that is not yet acknowledged.',
    notes: 'This is the core of the Quake/Source/Overwatch style of netcode (Gaffer On Games "Networked Physics" and the Valve "Source Multiplayer Networking" page explain it with pictures). It only works if movement is deterministic given the same inputs and the same step, so the client\'s replay matches the server\'s processing: another reason for fixed timesteps and no floating-point surprises. Mispredictions (the server says you were blocked) are corrected by replay; a visible snap is hidden by smoothing the error out over a few frames. Other players are not predicted this way: they are shown slightly in the past using snapshot interpolation (the next drill).',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Input = struct { seq: u32, dx: i32 };

/// server_pos is where the server says we were after processing input number acked.
/// Replay the inputs the server has not seen yet (seq > acked) on top of it.
pub fn reconcile(server_pos: i32, acked: u32, pending: []const Input) i32 {
    _ = acked;
    _ = pending;
    return server_pos;
}

/// How many leading inputs (sorted by seq) are acknowledged and can be dropped.
pub fn dropAcked(pending: []const Input, acked: u32) usize {
    _ = pending;
    _ = acked;
    return 0;
}
`,
      tests: String.raw`const demo_pending = [_]Input{ .{ .seq = 5, .dx = 1 }, .{ .seq = 6, .dx = 1 }, .{ .seq = 7, .dx = 1 }, .{ .seq = 8, .dx = 2 }, .{ .seq = 9, .dx = -1 } };

test "only unacknowledged inputs are replayed" {
    try std.testing.expectEqual(@as(i32, 101), reconcile(100, 7, &demo_pending));
}
test "everything acknowledged: the server position is the truth" {
    try std.testing.expectEqual(@as(i32, 100), reconcile(100, 9, &demo_pending));
    try std.testing.expectEqual(@as(i32, 100), reconcile(100, 50, &demo_pending));
}
test "nothing acknowledged: replay everything" {
    try std.testing.expectEqual(@as(i32, 104), reconcile(100, 0, &demo_pending));
}
test "a correction from the server moves the result" {
    try std.testing.expectEqual(@as(i32, 91), reconcile(90, 7, &demo_pending));
}
test "dropAcked counts the acknowledged prefix" {
    try std.testing.expectEqual(@as(usize, 3), dropAcked(&demo_pending, 7));
    try std.testing.expectEqual(@as(usize, 0), dropAcked(&demo_pending, 4));
    try std.testing.expectEqual(@as(usize, 5), dropAcked(&demo_pending, 99));
    try std.testing.expectEqual(@as(usize, 0), dropAcked(&.{}, 3));
}
`,
      solution: String.raw`const std = @import("std");

pub const Input = struct { seq: u32, dx: i32 };

pub fn reconcile(server_pos: i32, acked: u32, pending: []const Input) i32 {
    var pos = server_pos;
    for (pending) |in| {
        if (in.seq > acked) pos += in.dx;
    }
    return pos;
}

pub fn dropAcked(pending: []const Input, acked: u32) usize {
    var n: usize = 0;
    while (n < pending.len and pending[n].seq <= acked) n += 1;
    return n;
}
`,
    },
    cpp: {
      starter: String.raw`#include <cstddef>
#include <cstdint>
#include <vector>

struct Input { std::uint32_t seq; int dx; };

// server_pos is where the server says we were after processing input number acked.
// Replay the inputs the server has not seen yet (seq > acked) on top of it.
int reconcile(int server_pos, std::uint32_t acked, const std::vector<Input>& pending) { return server_pos; }

// How many leading inputs (sorted by seq) are acknowledged and can be dropped.
std::size_t drop_acked(const std::vector<Input>& pending, std::uint32_t acked) { return 0; }
`,
      tests: String.raw`#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    std::vector<Input> p = {{5, 1}, {6, 1}, {7, 1}, {8, 2}, {9, -1}};
    CHECK(reconcile(100, 7, p) == 101);
    CHECK(reconcile(100, 9, p) == 100); CHECK(reconcile(100, 50, p) == 100);
    CHECK(reconcile(100, 0, p) == 104);
    CHECK(reconcile(90, 7, p) == 91);
    CHECK(drop_acked(p, 7) == 3); CHECK(drop_acked(p, 4) == 0); CHECK(drop_acked(p, 99) == 5); CHECK(drop_acked({}, 3) == 0);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cstddef>
#include <cstdint>
#include <vector>

struct Input { std::uint32_t seq; int dx; };

int reconcile(int server_pos, std::uint32_t acked, const std::vector<Input>& pending) {
    int pos = server_pos;
    for (const Input& in : pending) if (in.seq > acked) pos += in.dx;
    return pos;
}

std::size_t drop_acked(const std::vector<Input>& pending, std::uint32_t acked) {
    std::size_t n = 0;
    while (n < pending.size() && pending[n].seq <= acked) ++n;
    return n;
}
`,
    },
  },

  snapshot_interp: {
    title: 'Snapshot interpolation for remote players', minutes: 20, level: 'easy',
    prompt: `<p>The server sends a position snapshot 10 to 30 times a second, but you draw 60+ frames a second. To show other players smoothly you render them <b>slightly in the past</b> and blend between the two snapshots around the render time. Implement <code>interpolate(snaps, render_t)</code>:</p>
<ul><li>Snapshots are sorted by <code>t</code>. Find the two around <code>render_t</code> and blend their <code>x</code> linearly.</li><li>Before the first snapshot, return the first position; after the last, return the last (hold, no extrapolation).</li><li>Two snapshots with the same <code>t</code> must not divide by zero.</li><li>An empty list returns nothing.</li></ul>`,
    hint: 'If render_t <= first.t return first.x; if >= last.t return last.x. Otherwise find i with snaps[i].t <= render_t < snaps[i+1].t and return lerp with f = (render_t - t0) / (t1 - t0).',
    notes: 'Choosing the delay is the design decision: it must cover one send interval plus jitter, so you always have two snapshots to blend between (typically 2 to 3 intervals, 100 ms is common). Too small and you run out of snapshots and the character freezes or you extrapolate and it jitters; too big and others look far behind. This is why shooters need lag compensation on the server: your shot is aimed at what you saw in the past. Interpolate rotation with a slerp/shortest-angle blend, and teleports (respawn) must not be blended.',
    zig: {
      starter: String.raw`const std = @import("std");

pub const Snapshot = struct { t: f64, x: f64 };

/// Position at render_t, blended between the snapshots around it. snaps is sorted by t.
pub fn interpolate(snaps: []const Snapshot, render_t: f64) ?f64 {
    _ = snaps;
    _ = render_t;
    return null;
}
`,
      tests: String.raw`const demo_snaps = [_]Snapshot{ .{ .t = 1.0, .x = 10 }, .{ .t = 1.1, .x = 20 }, .{ .t = 1.3, .x = 60 } };

fn expectX(ex: f64, got: ?f64) !void {
    try std.testing.expect(got != null);
    try std.testing.expectApproxEqAbs(ex, got.?, 1e-9);
}

test "halfway between two snapshots" {
    try expectX(15, interpolate(&demo_snaps, 1.05));
    try expectX(40, interpolate(&demo_snaps, 1.2));
}
test "exactly on a snapshot" {
    try expectX(10, interpolate(&demo_snaps, 1.0));
    try expectX(20, interpolate(&demo_snaps, 1.1));
    try expectX(60, interpolate(&demo_snaps, 1.3));
}
test "outside the range it holds the nearest snapshot" {
    try expectX(10, interpolate(&demo_snaps, 0.5));
    try expectX(60, interpolate(&demo_snaps, 9.0));
}
test "one snapshot and no snapshots" {
    try expectX(7, interpolate(&.{.{ .t = 3, .x = 7 }}, 100));
    try std.testing.expect(interpolate(&.{}, 1.0) == null);
}
test "two snapshots with the same time do not divide by zero" {
    const dup = [_]Snapshot{ .{ .t = 1, .x = 1 }, .{ .t = 2, .x = 5 }, .{ .t = 2, .x = 9 }, .{ .t = 3, .x = 9 } };
    const v = interpolate(&dup, 2.0);
    try std.testing.expect(v != null and !std.math.isNan(v.?) and !std.math.isInf(v.?));
}
`,
      solution: String.raw`const std = @import("std");

pub const Snapshot = struct { t: f64, x: f64 };

pub fn interpolate(snaps: []const Snapshot, render_t: f64) ?f64 {
    if (snaps.len == 0) return null;
    if (render_t <= snaps[0].t) return snaps[0].x;
    const last = snaps[snaps.len - 1];
    if (render_t >= last.t) return last.x;
    var i: usize = 0;
    while (i + 1 < snaps.len and snaps[i + 1].t <= render_t) i += 1;
    const a = snaps[i];
    const b = snaps[i + 1];
    if (b.t == a.t) return b.x;
    const f = (render_t - a.t) / (b.t - a.t);
    return a.x + (b.x - a.x) * f;
}
`,
    },
    cpp: {
      starter: String.raw`#include <cstddef>
#include <optional>
#include <vector>

struct Snapshot { double t, x; };

// Position at render_t, blended between the snapshots around it. snaps is sorted by t.
std::optional<double> interpolate(const std::vector<Snapshot>& snaps, double render_t) { return std::nullopt; }
`,
      tests: String.raw`#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool is(std::optional<double> v, double x) { return v && std::fabs(*v - x) < 1e-9; }

int main() {
    std::vector<Snapshot> s = {{1.0, 10}, {1.1, 20}, {1.3, 60}};
    CHECK(is(interpolate(s, 1.05), 15)); CHECK(is(interpolate(s, 1.2), 40));
    CHECK(is(interpolate(s, 1.0), 10)); CHECK(is(interpolate(s, 1.1), 20)); CHECK(is(interpolate(s, 1.3), 60));
    CHECK(is(interpolate(s, 0.5), 10)); CHECK(is(interpolate(s, 9.0), 60));
    CHECK(is(interpolate({{3, 7}}, 100), 7)); CHECK(!interpolate({}, 1.0));
    { std::vector<Snapshot> dup = {{1, 1}, {2, 5}, {2, 9}, {3, 9}}; auto v = interpolate(dup, 2.0); CHECK(v && std::isfinite(*v)); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
`,
      solution: String.raw`#include <cstddef>
#include <optional>
#include <vector>

struct Snapshot { double t, x; };

std::optional<double> interpolate(const std::vector<Snapshot>& snaps, double render_t) {
    if (snaps.empty()) return std::nullopt;
    if (render_t <= snaps.front().t) return snaps.front().x;
    if (render_t >= snaps.back().t) return snaps.back().x;
    std::size_t i = 0;
    while (i + 1 < snaps.size() && snaps[i + 1].t <= render_t) ++i;
    const Snapshot &a = snaps[i], &b = snaps[i + 1];
    if (b.t == a.t) return b.x;
    double f = (render_t - a.t) / (b.t - a.t);
    return a.x + (b.x - a.x) * f;
}
`,
    },
  },
});
