// Integrators: why the order of two lines matters
// Run: zig test spring_integrator.zig   (written against Zig 0.17)

const std = @import("std");

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

// ---- tests: do not edit below this line ----
const StepFn = *const fn (State, f64, f64) State;

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
