// Test scenarios adapted from the MIT-licensed Exercism Python track and
// exercism/problem-specifications (4289d4ec9ed947cd785939ab82c479bb8d4f2cc7).
const std = @import("std");
const t = std.testing;
const m = @import("poker.zig");
fn check(hands: []const []const u8, expected: []const []const u8) !void {
    const out = try m.bestHands(t.allocator, hands);
    defer t.allocator.free(out);
    try t.expectEqual(expected.len, out.len);
    for (out, expected) |x, y| try t.expectEqualStrings(y, x);
}
test "single hand always wins 161f485e-39c2-4012-84cf-bec0c755b66c" {
    try check(&.{"4S 5S 7H 8D JC"}, &.{"4S 5S 7H 8D JC"});
}
test "highest card out of all hands wins 370ac23a-a00f-48a9-9965-6f3fb595cf45" {
    try check(&.{ "4D 5S 6S 8D 3C", "2S 4C 7S 9H 10H", "3S 4S 5D 6H JH" }, &.{"3S 4S 5D 6H JH"});
}
test "a tie has multiple winners d94ad5a7-17df-484b-9932-c64fc26cff52" {
    try check(&.{ "4D 5S 6S 8D 3C", "2S 4C 7S 9H 10H", "3S 4S 5D 6H JH", "3H 4H 5C 6C JD" }, &.{ "3S 4S 5D 6H JH", "3H 4H 5C 6C JD" });
}
test "multiple hands with the same high cards, tie compares next highest ranked, down to last card 61ed83a9-cfaa-40a5-942a-51f52f0a8725" {
    try check(&.{ "3S 5H 6S 8D 7H", "2S 5D 6D 8C 7S" }, &.{"3S 5H 6S 8D 7H"});
}
test "winning high card hand also has the lowest card da01becd-f5b0-4342-b7f3-1318191d0580" {
    try check(&.{ "2S 5H 6S 8D 7H", "3S 4D 6D 8C 7S" }, &.{"2S 5H 6S 8D 7H"});
}
test "one pair beats high card f7175a89-34ff-44de-b3d7-f6fd97d1fca4" {
    try check(&.{ "4S 5H 6C 8D KH", "2S 4H 6S 4D JH" }, &.{"2S 4H 6S 4D JH"});
}
test "highest pair wins e114fd41-a301-4111-a9e7-5a7f72a76561" {
    try check(&.{ "4S 2H 6S 2D JH", "2S 4H 6C 4D JD" }, &.{"2S 4H 6C 4D JD"});
}
test "both hands have the same pair, high card wins b3acd3a7-f9fa-4647-85ab-e0a9e07d1365" {
    try check(&.{ "4H 4S AH JC 3D", "4C 4D AS 5D 6C" }, &.{"4H 4S AH JC 3D"});
}
test "two pairs beats one pair 935bb4dc-a622-4400-97fa-86e7d06b1f76" {
    try check(&.{ "2S 8H 6S 8D JH", "4S 5H 4C 8C 5C" }, &.{"4S 5H 4C 8C 5C"});
}
test "both hands have two pairs, highest ranked pair wins c8aeafe1-6e3d-4711-a6de-5161deca91fd" {
    try check(&.{ "2S 8H 2D 8D 3H", "4S 5H 4C 8S 5D" }, &.{"2S 8H 2D 8D 3H"});
}
test "both hands have two pairs, with the same highest ranked pair, tie goes to low pair 88abe1ba-7ad7-40f3-847e-0a26f8e46a60" {
    try check(&.{ "2S QS 2C QD JH", "JD QH JS 8D QC" }, &.{"JD QH JS 8D QC"});
}
test "both hands have two identically ranked pairs, tie goes to remaining card (kicker) 15a7a315-0577-47a3-9981-d6cf8e6f387b" {
    try check(&.{ "JD QH JS 8D QC", "JS QS JC 2D QD" }, &.{"JD QH JS 8D QC"});
}
test "both hands have two pairs that add to the same value, win goes to highest pair f761e21b-2560-4774-a02a-b3e9366a51ce" {
    try check(&.{ "6S 6H 3S 3H AS", "7H 7S 2H 2S AC" }, &.{"7H 7S 2H 2S AC"});
}
test "two pairs first ranked by largest pair fc6277ac-94ac-4078-8d39-9d441bc7a79e" {
    try check(&.{ "5C 2S 5S 4H 4C", "6S 2S 6H 7C 2C" }, &.{"6S 2S 6H 7C 2C"});
}
test "three of a kind beats two pair 21e9f1e6-2d72-49a1-a930-228e5e0195dc" {
    try check(&.{ "2S 8H 2H 8D JH", "4S 5H 4C 8S 4H" }, &.{"4S 5H 4C 8S 4H"});
}
test "both hands have three of a kind, tie goes to highest ranked triplet c2fffd1f-c287-480f-bf2d-9628e63bbcc3" {
    try check(&.{ "2S 2H 2C 8D JH", "4S AH AS 8C AD" }, &.{"4S AH AS 8C AD"});
}
test "with multiple decks, two players can have same three of a kind, ties go to highest remaining cards eb856cc2-481c-4b0d-9835-4d75d07a5d9d" {
    try check(&.{ "4S AH AS 7C AD", "4S AH AS 8C AD" }, &.{"4S AH AS 8C AD"});
}
test "with multiple decks, two players can have same three of a kind, ties go to highest remaining cards 26a4a7d4-34a2-4f18-90b4-4a8dd35d2bb1" {
    try check(&.{ "5S AH AS 7C AD", "4S AH AS 8C AD" }, &.{"4S AH AS 8C AD"});
}
test "a straight beats three of a kind a858c5d9-2f28-48e7-9980-b7fa04060a60" {
    try check(&.{ "4S 5H 4C 8D 4H", "3S 4D 2S 6D 5C" }, &.{"3S 4D 2S 6D 5C"});
}
test "aces can end a straight (10 J Q K A) 73c9c756-e63e-4b01-a88d-0d4491a7a0e3" {
    try check(&.{ "4S 5H 4C 8D 4H", "10D JH QS KD AC" }, &.{"10D JH QS KD AC"});
}
test "aces can start a straight (A 2 3 4 5) 76856b0d-35cd-49ce-a492-fe5db53abc02" {
    try check(&.{ "4S 5H 4C 8D 4H", "4D AH 3S 2D 5C" }, &.{"4D AH 3S 2D 5C"});
}
test "aces cannot be in the middle of a straight (Q K A 2 3) e214b7df-dcba-45d3-a2e5-342d8c46c286" {
    try check(&.{ "2C 3D 7H 5H 2S", "QS KH AC 2D 3S" }, &.{"2C 3D 7H 5H 2S"});
}
test "both hands with a straight, tie goes to highest ranked card 6980c612-bbff-4914-b17a-b044e4e69ea1" {
    try check(&.{ "4S 6C 7S 8D 5H", "5S 7H 8S 9D 6H" }, &.{"5S 7H 8S 9D 6H"});
}
test "even though an ace is usually high, a 5-high straight is the lowest-scoring straight 5135675c-c2fc-4e21-9ba3-af77a32e9ba4" {
    try check(&.{ "2H 3C 4D 5D 6H", "4S AH 3S 2D 5H" }, &.{"2H 3C 4D 5D 6H"});
}
test "flush beats a straight c601b5e6-e1df-4ade-b444-b60ce13b2571" {
    try check(&.{ "4C 6H 7D 8D 5H", "2S 4S 5S 6S 7S" }, &.{"2S 4S 5S 6S 7S"});
}
test "both hands have a flush, tie goes to high card, down to the last one if necessary 4d90261d-251c-49bd-a468-896bf10133de" {
    try check(&.{ "4H 7H 8H 9H 6H", "2S 4S 5S 6S 7S" }, &.{"4H 7H 8H 9H 6H"});
}
test "both hands have a flush, tie goes to high card, down to the last one if necessary e04137c5-c19a-4dfc-97a1-9dfe9baaa2ff" {
    try check(&.{ "2H 7H 8H 9H 6H", "3S 5S 6S 7S 8S" }, &.{"2H 7H 8H 9H 6H"});
}
test "full house beats a flush 3a19361d-8974-455c-82e5-f7152f5dba7c" {
    try check(&.{ "3H 6H 7H 8H 5H", "4S 5H 4C 5D 4H" }, &.{"4S 5H 4C 5D 4H"});
}
test "both hands have a full house, tie goes to highest-ranked triplet eb73d0e6-b66c-4f0f-b8ba-bf96bc0a67f0" {
    try check(&.{ "4H 4S 4D 9S 9D", "5H 5S 5D 8S 8D" }, &.{"5H 5S 5D 8S 8D"});
}
test "with multiple decks, both hands have a full house with the same triplet, tie goes to the pair 34b51168-1e43-4c0d-9b32-e356159b4d5d" {
    try check(&.{ "5H 5S 5D 9S 9D", "5H 5S 5D 8S 8D" }, &.{"5H 5S 5D 9S 9D"});
}
test "four of a kind beats a full house d61e9e99-883b-4f99-b021-18f0ae50c5f4" {
    try check(&.{ "4S 5H 4D 5D 4H", "3S 3H 2S 3D 3C" }, &.{"3S 3H 2S 3D 3C"});
}
test "both hands have four of a kind, tie goes to high quad 2e1c8c63-e0cb-4214-a01b-91954490d2fe" {
    try check(&.{ "2S 2H 2C 8D 2D", "4S 5H 5S 5D 5C" }, &.{"4S 5H 5S 5D 5C"});
}
test "with multiple decks, both hands with identical four of a kind, tie determined by kicker 892ca75d-5474-495d-9f64-a6ce2dcdb7e1" {
    try check(&.{ "3S 3H 2S 3D 3C", "3S 3H 4S 3D 3C" }, &.{"3S 3H 4S 3D 3C"});
}
test "straight flush beats four of a kind 923bd910-dc7b-4f7d-a330-8b42ec10a3ac" {
    try check(&.{ "4S 5H 5S 5D 5C", "7S 8S 9S 6S 10S" }, &.{"7S 8S 9S 6S 10S"});
}
test "aces can end a straight flush (10 J Q K A) d9629e22-c943-460b-a951-2134d1b43346" {
    try check(&.{ "KC AH AS AD AC", "10C JC QC KC AC" }, &.{"10C JC QC KC AC"});
}
test "aces can start a straight flush (A 2 3 4 5) 05d5ede9-64a5-4678-b8ae-cf4c595dc824" {
    try check(&.{ "KS AH AS AD AC", "4H AH 3H 2H 5H" }, &.{"4H AH 3H 2H 5H"});
}
test "aces cannot be in the middle of a straight flush (Q K A 2 3) ad655466-6d04-49e8-a50c-0043c3ac18ff" {
    try check(&.{ "2C AC QC 10C KC", "QH KH AH 2H 3H" }, &.{"2C AC QC 10C KC"});
}
test "both hands have a straight flush, tie goes to highest-ranked card d0927f70-5aec-43db-aed8-1cbd1b6ee9ad" {
    try check(&.{ "4H 6H 7H 8H 5H", "5S 7S 8S 9S 6S" }, &.{"5S 7S 8S 9S 6S"});
}
test "even though an ace is usually high, a 5-high straight flush is the lowest-scoring straight flush be620e09-0397-497b-ac37-d1d7a4464cfc" {
    try check(&.{ "2H 3H 4H 5H 6H", "4D AD 3D 2D 5D" }, &.{"2H 3H 4H 5H 6H"});
}

test "five of a kind from multiple decks outranks a straight flush" {
    const hands = [_][]const u8{ "AC AC AC AC AC", "10H JH QH KH AH" };
    const winners = try m.bestHands(t.allocator, &hands);
    defer t.allocator.free(winners);
    try t.expectEqual(@as(usize, 1), winners.len);
    try t.expectEqualStrings(hands[0], winners[0]);
}

test "invalid suits and nonstandard numeric faces are rejected" {
try t.expectError(error.InvalidHand,m.bestHands(t.allocator,&.{"2Z 3H 4H 5H 6H"}));
try t.expectError(error.InvalidHand,m.bestHands(t.allocator,&.{"14H 3H 4H 5H 6H"}));
}
