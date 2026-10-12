const std = @import("std");
const Group = struct { rank: u8, count: u8 };
fn score(hand: []const u8) !u64 {
    var counts: [15]u8 = @splat(0);
    var ranks: [5]u8 = undefined;
    var suits: [5]u8 = undefined;
    var tokens = std.mem.tokenizeScalar(u8, hand, ' ');
    var n: usize = 0;
    while (tokens.next()) |card| {
        if (n >= 5 or card.len < 2 or card.len > 3) return error.InvalidHand;
        const face = card[0 .. card.len - 1];
        const rank: u8 = if (std.mem.eql(u8, face, "A")) 14 else if (std.mem.eql(u8, face, "K")) 13 else if (std.mem.eql(u8, face, "Q")) 12 else if (std.mem.eql(u8, face, "J")) 11 else try std.fmt.parseInt(u8, face, 10);
        if (rank < 2 or rank > 14 or (rank > 10 and face.len != 1)) return error.InvalidHand;
        if (std.mem.indexOfScalar(u8, "CDHS", card[card.len - 1]) == null) return error.InvalidHand;
        ranks[n] = rank;
        suits[n] = card[card.len - 1];
        counts[rank] += 1;
        n += 1;
    }
    if (n != 5) return error.InvalidHand;
    std.mem.sort(u8, &ranks, {}, std.sort.desc(u8));
    var flush = true;
    for (suits) |s| {
        if (s != suits[0]) flush = false;
    }
    var straight = true;
    for (1..5) |i| {
        if (ranks[i] + 1 != ranks[i - 1]) straight = false;
    }
    var high = ranks[0];
    if (std.mem.eql(u8, &ranks, &.{ 14, 5, 4, 3, 2 })) {
        straight = true;
        high = 5;
    }
    var groups: [5]Group = undefined;
    var len: usize = 0;
    for (counts, 0..) |count, rank| {
        if (count > 0) {
            groups[len] = .{ .rank = @intCast(rank), .count = count };
            len += 1;
        }
    }
    std.mem.sort(Group, groups[0..len], {}, struct {
        fn less(_: void, x: Group, y: Group) bool {
            return if (x.count != y.count) x.count > y.count else x.rank > y.rank;
        }
    }.less);
    const category: u64 = if (groups[0].count == 5) 9 else if (flush and straight) 8 else if (groups[0].count == 4) 7 else if (groups[0].count == 3 and groups[1].count == 2) 6 else if (flush) 5 else if (straight) 4 else if (groups[0].count == 3) 3 else if (groups[0].count == 2 and groups[1].count == 2) 2 else if (groups[0].count == 2) 1 else 0;
    var keys: [5]u8 = @splat(0);
    if (straight and (category == 4 or category == 8)) {
        keys[0] = high;
    } else if (flush or category == 0) {
        keys = ranks;
    } else {
        for (groups[0..len], 0..) |g, i| keys[i] = g.rank;
    }
    var result = category;
    for (keys) |key| result = result * 15 + key;
    return result;
}
pub fn bestHands(a: std.mem.Allocator, hands: []const []const u8) ![][]const u8 {
    var out = std.array_list.Managed([]const u8).init(a);
    errdefer out.deinit();
    var best: u64 = 0;
    for (hands) |hand| {
        const value = try score(hand);
        if (out.items.len == 0 or value > best) {
            out.clearRetainingCapacity();
            best = value;
        }
        if (value == best) try out.append(hand);
    }
    return out.toOwnedSlice();
}
