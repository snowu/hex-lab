// A seeded random number generator
// Run: zig test rng_lcg.zig   (written against Zig 0.17)

const std = @import("std");

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

// ---- tests: do not edit below this line ----
test "known sequence for seed 42" {
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
