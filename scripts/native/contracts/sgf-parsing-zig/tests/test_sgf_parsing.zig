// Test scenarios adapted from the MIT-licensed Exercism Python track and
// exercism/problem-specifications (4289d4ec9ed947cd785939ab82c479bb8d4f2cc7).
const std = @import("std");
const t = std.testing;
const m = @import("sgf_parsing.zig");
fn same(a: *const m.Node, b: *const m.Node) !void {
    try t.expectEqual(a.properties.len, b.properties.len);
    try t.expectEqual(a.children.len, b.children.len);
    for (a.properties, b.properties) |x, y| {
        try t.expectEqualStrings(y.id, x.id);
        try t.expectEqual(x.values.len, y.values.len);
        for (x.values, y.values) |u, v| try t.expectEqualStrings(v, u);
    }
    for (a.children, b.children) |x, y| try same(x, y);
}
test "test_empty_input" {
    try t.expectError(error.TreeMissing, m.parse(t.allocator, ""));
}
test "test_tree_with_no_nodes" {
    try t.expectError(error.TreeWithNoNodes, m.parse(t.allocator, "()"));
}
test "test_node_without_tree" {
    try t.expectError(error.TreeMissing, m.parse(t.allocator, ";"));
}
test "test_node_without_properties" {
    var tree = try m.parse(t.allocator, "(;)");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{}, .children = &.{} });
}
test "test_single_node_tree" {
    var tree = try m.parse(t.allocator, "(;A[B])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"B"} }}, .children = &.{} });
}
test "test_multiple_properties" {
    var tree = try m.parse(t.allocator, "(;A[b]C[d])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{ .{ .id = "A", .values = &.{"b"} }, .{ .id = "C", .values = &.{"d"} } }, .children = &.{} });
}
test "test_properties_without_delimiter" {
    try t.expectError(error.PropertiesWithoutDelimiter, m.parse(t.allocator, "(;A)"));
}
test "test_all_lowercase_property" {
    try t.expectError(error.PropertyMustBeUppercase, m.parse(t.allocator, "(;a[b])"));
}
test "test_upper_and_lowercase_property" {
    try t.expectError(error.PropertyMustBeUppercase, m.parse(t.allocator, "(;Aa[b])"));
}
test "test_two_nodes" {
    var tree = try m.parse(t.allocator, "(;A[B];B[C])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"B"} }}, .children = &.{&m.Node{ .properties = &.{.{ .id = "B", .values = &.{"C"} }}, .children = &.{} }} });
}
test "test_two_child_trees" {
    var tree = try m.parse(t.allocator, "(;A[B](;B[C])(;C[D]))");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"B"} }}, .children = &.{ &m.Node{ .properties = &.{.{ .id = "B", .values = &.{"C"} }}, .children = &.{} }, &m.Node{ .properties = &.{.{ .id = "C", .values = &.{"D"} }}, .children = &.{} } } });
}
test "test_multiple_property_values" {
    var tree = try m.parse(t.allocator, "(;A[b][c][d])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{ "b", "c", "d" } }}, .children = &.{} });
}
test "test_within_property_values_whitespace_characters_such_as_tab_are_converted_to_spaces" {
    var tree = try m.parse(t.allocator, "(;A[hello\t\tworld])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"hello  world"} }}, .children = &.{} });
}
test "test_within_property_values_newlines_remain_as_newlines" {
    var tree = try m.parse(t.allocator, "(;A[hello\n\nworld])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"hello\n\nworld"} }}, .children = &.{} });
}
test "test_escaped_closing_bracket_within_property_value_becomes_just_a_closing_bracket" {
    var tree = try m.parse(t.allocator, "(;A[\\]])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"]"} }}, .children = &.{} });
}
test "test_escaped_backslash_in_property_value_becomes_just_a_backslash" {
    var tree = try m.parse(t.allocator, "(;A[\\\\])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"\\"} }}, .children = &.{} });
}
test "test_opening_bracket_within_property_value_doesn_t_need_to_be_escaped" {
    var tree = try m.parse(t.allocator, "(;A[x[y\\]z][foo]B[bar];C[baz])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{ .{ .id = "A", .values = &.{ "x[y]z", "foo" } }, .{ .id = "B", .values = &.{"bar"} } }, .children = &.{&m.Node{ .properties = &.{.{ .id = "C", .values = &.{"baz"} }}, .children = &.{} }} });
}
test "test_semicolon_in_property_value_doesn_t_need_to_be_escaped" {
    var tree = try m.parse(t.allocator, "(;A[a;b][foo]B[bar];C[baz])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{ .{ .id = "A", .values = &.{ "a;b", "foo" } }, .{ .id = "B", .values = &.{"bar"} } }, .children = &.{&m.Node{ .properties = &.{.{ .id = "C", .values = &.{"baz"} }}, .children = &.{} }} });
}
test "test_parentheses_in_property_value_don_t_need_to_be_escaped" {
    var tree = try m.parse(t.allocator, "(;A[x(y)z][foo]B[bar];C[baz])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{ .{ .id = "A", .values = &.{ "x(y)z", "foo" } }, .{ .id = "B", .values = &.{"bar"} } }, .children = &.{&m.Node{ .properties = &.{.{ .id = "C", .values = &.{"baz"} }}, .children = &.{} }} });
}
test "test_escaped_tab_in_property_value_is_converted_to_space" {
    var tree = try m.parse(t.allocator, "(;A[hello\\\tworld])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"hello world"} }}, .children = &.{} });
}
test "test_escaped_newline_in_property_value_is_converted_to_nothing_at_all" {
    var tree = try m.parse(t.allocator, "(;A[hello\\\nworld])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"helloworld"} }}, .children = &.{} });
}
test "test_escaped_t_and_n_in_property_value_are_just_letters_not_whitespace" {
    var tree = try m.parse(t.allocator, "(;A[\\t = t and \\n = n])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"t = t and n = n"} }}, .children = &.{} });
}
test "test_mixing_various_kinds_of_whitespace_and_escaped_characters_in_property_value" {
    var tree = try m.parse(t.allocator, "(;A[\\]b\nc\\\nd\t\te\\\\ \\\n\\]])");
    defer tree.deinit();
    try same(tree.root, &m.Node{ .properties = &.{.{ .id = "A", .values = &.{"]b\ncd  e\\ ]"} }}, .children = &.{} });
}

test "duplicate IDs merge values and tree owns the identifier" {
var input = [_]u8{'(', ';', 'A', '[', 'x', ']', 'A', '[', 'y', ']', ')'};
var tree = try m.parse(t.allocator, &input); defer tree.deinit();
input[2]='Z';
try t.expectEqual(@as(usize,1), tree.root.properties.len);
try t.expectEqualStrings("A", tree.root.properties[0].id);
try t.expectEqual(@as(usize,2), tree.root.properties[0].values.len);
try t.expectEqualStrings("x", tree.root.properties[0].values[0]);
try t.expectEqualStrings("y", tree.root.properties[0].values[1]);
}
