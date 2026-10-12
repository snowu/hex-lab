// Test scenarios adapted from the MIT-licensed Exercism Python track and
// exercism/problem-specifications (4289d4ec9ed947cd785939ab82c479bb8d4f2cc7).
const std = @import("std");
const t = std.testing;
const m = @import("word_search.zig");
test "eight directions and absence" {
    const g = [_][]const u8{ "abc", "def", "ghi" };
    const cases = [_]struct { word: []const u8, s: m.Point, e: m.Point }{ .{ .word = "abc", .s = .{ .x = 0, .y = 0 }, .e = .{ .x = 2, .y = 0 } }, .{ .word = "cba", .s = .{ .x = 2, .y = 0 }, .e = .{ .x = 0, .y = 0 } }, .{ .word = "adg", .s = .{ .x = 0, .y = 0 }, .e = .{ .x = 0, .y = 2 } }, .{ .word = "gda", .s = .{ .x = 0, .y = 2 }, .e = .{ .x = 0, .y = 0 } }, .{ .word = "aei", .s = .{ .x = 0, .y = 0 }, .e = .{ .x = 2, .y = 2 } }, .{ .word = "iea", .s = .{ .x = 2, .y = 2 }, .e = .{ .x = 0, .y = 0 } }, .{ .word = "ceg", .s = .{ .x = 2, .y = 0 }, .e = .{ .x = 0, .y = 2 } }, .{ .word = "gec", .s = .{ .x = 0, .y = 2 }, .e = .{ .x = 2, .y = 0 } } };
    for (cases) |c| {
        const r = m.search(&g, c.word).?;
        try t.expectEqualDeep(c.s, r.start);
        try t.expectEqualDeep(c.e, r.end);
    }
    try t.expect(m.search(&g, "abcd") == null);
    try t.expect(m.search(&.{}, "a") == null);
}
test "canonical b4057815-0d01-41f0-9119-6a91f54b2a0a" {
    const grid = [_][]const u8{"jefblpepre"};
    try t.expect(m.search(&grid, "clojure") == null);
}
test "canonical 6b22bcc5-6cbf-4674-931b-d2edbff73132" {
    const grid = [_][]const u8{"clojurermt"};
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 6, .y = 0 } }, m.search(&grid, "clojure").?);
}
test "canonical ff462410-434b-442d-9bc3-3360c75f34a8" {
    const grid = [_][]const u8{"mtclojurer"};
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 2, .y = 0 }, .end = .{ .x = 8, .y = 0 } }, m.search(&grid, "clojure").?);
}
test "canonical a02febae-6347-443e-b99c-ab0afb0b8fca" {
    const grid = [_][]const u8{"coffeelplx"};
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 5, .y = 0 } }, m.search(&grid, "coffee").?);
}
test "canonical e42e9987-6304-4e13-8232-fa07d5280130" {
    const grid = [_][]const u8{"xcoffeezlp"};
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 1, .y = 0 }, .end = .{ .x = 6, .y = 0 } }, m.search(&grid, "coffee").?);
}
test "canonical 9bff3cee-49b9-4775-bdfb-d55b43a70b2f" {
    const grid = [_][]const u8{ "jefblpepre", "tclojurerm" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 1, .y = 1 }, .end = .{ .x = 7, .y = 1 } }, m.search(&grid, "clojure").?);
}
test "canonical 851a35fb-f499-4ec1-9581-395a87903a22" {
    const grid = [_][]const u8{ "camdcimgtc", "jefblpepre", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 2 }, .end = .{ .x = 6, .y = 2 } }, m.search(&grid, "clojure").?);
}
test "canonical 2f3dcf84-ba7d-4b75-8b8d-a3672b32c035" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
}
test "canonical 006d4856-f365-4e84-a18c-7d129ce9eefb" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "clojurermt", "jalaycalmp" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 8 }, .end = .{ .x = 6, .y = 8 } }, m.search(&grid, "clojure").?);
}
test "canonical eff7ac9f-ff11-443e-9747-40850c12ab60" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "fortranftw", "alxhpburyi", "clojurermt", "jalaycalmp" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 6 }, .end = .{ .x = 6, .y = 6 } }, m.search(&grid, "fortran").?);
}
test "canonical dea39f86-8c67-4164-8884-13bfc48bd13b" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "fortranftw", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 6 }, .end = .{ .x = 6, .y = 6 } }, m.search(&grid, "fortran").?);
}
test "canonical 29e6a6a5-f80c-48a6-8e68-05bbbe187a09" {
    const grid = [_][]const u8{"rixilelhrs"};
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 0 }, .end = .{ .x = 0, .y = 0 } }, m.search(&grid, "elixir").?);
}
test "canonical 3cf34428-b43f-48b6-b332-ea0b8836011d" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
}
test "canonical 2c8cd344-a02f-464b-93b6-8bf1bd890003" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 9, .y = 0 }, .end = .{ .x = 9, .y = 9 } }, m.search(&grid, "ecmascript").?);
}
test "canonical 9ee1e43d-e59d-4c32-9a5f-6a22d4a1550f" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 9, .y = 0 }, .end = .{ .x = 9, .y = 9 } }, m.search(&grid, "ecmascript").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 8, .y = 4 }, .end = .{ .x = 8, .y = 1 } }, m.search(&grid, "rust").?);
}
test "canonical 6a21a676-f59e-4238-8e88-9f81015afae9" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 9, .y = 0 }, .end = .{ .x = 9, .y = 9 } }, m.search(&grid, "ecmascript").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 8, .y = 4 }, .end = .{ .x = 8, .y = 1 } }, m.search(&grid, "rust").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 3, .y = 3 } }, m.search(&grid, "java").?);
}
test "canonical c9125189-1861-4b0d-a14e-ba5dab29ca7c" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 9, .y = 0 }, .end = .{ .x = 9, .y = 9 } }, m.search(&grid, "ecmascript").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 8, .y = 4 }, .end = .{ .x = 8, .y = 1 } }, m.search(&grid, "rust").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 3, .y = 3 } }, m.search(&grid, "java").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 7, .y = 8 }, .end = .{ .x = 5, .y = 6 } }, m.search(&grid, "lua").?);
}
test "canonical b19e2149-7fc5-41ec-a8a9-9bc6c6c38c40" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 9, .y = 0 }, .end = .{ .x = 9, .y = 9 } }, m.search(&grid, "ecmascript").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 8, .y = 4 }, .end = .{ .x = 8, .y = 1 } }, m.search(&grid, "rust").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 3, .y = 3 } }, m.search(&grid, "java").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 7, .y = 8 }, .end = .{ .x = 5, .y = 6 } }, m.search(&grid, "lua").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 2, .y = 5 }, .end = .{ .x = 5, .y = 2 } }, m.search(&grid, "lisp").?);
}
test "canonical 69e1d994-a6d7-4e24-9b5a-db76751c2ef8" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 9, .y = 0 }, .end = .{ .x = 9, .y = 9 } }, m.search(&grid, "ecmascript").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 8, .y = 4 }, .end = .{ .x = 8, .y = 1 } }, m.search(&grid, "rust").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 3, .y = 3 } }, m.search(&grid, "java").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 7, .y = 8 }, .end = .{ .x = 5, .y = 6 } }, m.search(&grid, "lua").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 2, .y = 5 }, .end = .{ .x = 5, .y = 2 } }, m.search(&grid, "lisp").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 7, .y = 5 }, .end = .{ .x = 4, .y = 8 } }, m.search(&grid, "ruby").?);
}
test "canonical 695531db-69eb-463f-8bad-8de3bf5ef198" {
    const grid = [_][]const u8{ "jefblpepre", "camdcimgtc", "oivokprjsm", "pbwasqroua", "rixilelhrs", "wolcqlirpc", "screeaumgr", "alxhpburyi", "jalaycalmp", "clojurermt" };
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 9 }, .end = .{ .x = 6, .y = 9 } }, m.search(&grid, "clojure").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 5, .y = 4 }, .end = .{ .x = 0, .y = 4 } }, m.search(&grid, "elixir").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 9, .y = 0 }, .end = .{ .x = 9, .y = 9 } }, m.search(&grid, "ecmascript").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 8, .y = 4 }, .end = .{ .x = 8, .y = 1 } }, m.search(&grid, "rust").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 3, .y = 3 } }, m.search(&grid, "java").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 7, .y = 8 }, .end = .{ .x = 5, .y = 6 } }, m.search(&grid, "lua").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 2, .y = 5 }, .end = .{ .x = 5, .y = 2 } }, m.search(&grid, "lisp").?);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 7, .y = 5 }, .end = .{ .x = 4, .y = 8 } }, m.search(&grid, "ruby").?);
    try t.expect(m.search(&grid, "haskell") == null);
}
test "canonical fda5b937-6774-4a52-8f89-f64ed833b175" {
    const grid = [_][]const u8{ "abc", "def" };
    try t.expect(m.search(&grid, "aef") == null);
    try t.expect(m.search(&grid, "ced") == null);
    try t.expect(m.search(&grid, "abf") == null);
    try t.expect(m.search(&grid, "cbd") == null);
}
test "canonical 5b6198eb-2847-4e2f-8efe-65045df16bd3" {
    const grid = [_][]const u8{ "abceli", "xirdfg" };
    try t.expect(m.search(&grid, "elixir") == null);
}
test "canonical eba44139-a34f-4a92-98e1-bd5f259e5769" {
    const grid = [_][]const u8{"silabcdefp"};
    try t.expect(m.search(&grid, "lisp") == null);
}
test "canonical cd1f0fa8-76af-4167-b105-935f78364dac" {
    const grid = [_][]const u8{ "s", "u", "r", "a", "b", "c", "t" };
    try t.expect(m.search(&grid, "rust") == null);
}

test "exact case ragged boundaries single character and no wrapping parity" {
    const g = [_][]const u8{ "abc", "def", "ghi" };
    try t.expect(m.search(&g, "ABC") == null);
    try t.expect(m.search(&g, "") == null);
    try t.expect(m.search(&g, "abcd") == null);
    try t.expect(m.search(&.{}, "a") == null);
    const single = m.search(&g, "e").?;
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 1, .y = 1 }, .end = .{ .x = 1, .y = 1 } }, single);
    const ragged = [_][]const u8{ "ab", "c", "def" };
    try t.expect(m.search(&ragged, "be") == null);
    try t.expectEqualDeep(m.Match{ .start = .{ .x = 0, .y = 0 }, .end = .{ .x = 0, .y = 2 } }, m.search(&ragged, "acd").?);
}
