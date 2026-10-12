const std = @import("std");
pub const Property = struct { id: []const u8, values: []const []const u8 };
pub const Node = struct { properties: []const Property = &.{}, children: []const *const Node = &.{} };
pub const Tree = struct {
    arena: std.heap.ArenaAllocator,
    root: *const Node,
    pub fn deinit(tree: *Tree) void {
        tree.arena.deinit();
    }
};
const Parser = struct {
    a: std.mem.Allocator,
    s: []const u8,
    i: usize = 0,
    fn skip(p: *Parser) void {
        while (p.i < p.s.len and std.ascii.isWhitespace(p.s[p.i])) p.i += 1;
    }
    fn peek(p: *Parser) u8 {
        p.skip();
        return if (p.i < p.s.len) p.s[p.i] else 0;
    }
    fn value(p: *Parser) ![]const u8 {
        p.i += 1;
        var out = std.array_list.Managed(u8).init(p.a);
        while (p.i < p.s.len) {
            var c = p.s[p.i];
            p.i += 1;
            if (c == ']') return out.toOwnedSlice();
            if (c == '\\') {
                if (p.i == p.s.len) return error.PropertiesWithoutDelimiter;
                c = p.s[p.i];
                p.i += 1;
                if (c == '\n') continue;
                if (c == '\r') {
                    if (p.i < p.s.len and p.s[p.i] == '\n') p.i += 1;
                    continue;
                }
            }
            if (c == '\t' or c == '\r' or c == 11 or c == 12) c = ' ';
            try out.append(c);
        }
        return error.PropertiesWithoutDelimiter;
    }
    fn node(p: *Parser) anyerror!*Node {
        if (p.peek() != ';') return error.TreeWithNoNodes;
        p.i += 1;
        var props = std.array_list.Managed(Property).init(p.a);
        while (std.ascii.isAlphabetic(p.peek())) {
            const start = p.i;
            while (p.i < p.s.len and std.ascii.isAlphabetic(p.s[p.i])) {
                if (!std.ascii.isUpper(p.s[p.i])) return error.PropertyMustBeUppercase;
                p.i += 1;
            }
            const id = try p.a.dupe(u8, p.s[start..p.i]);
            if (p.peek() != '[') return error.PropertiesWithoutDelimiter;
            var values = std.array_list.Managed([]const u8).init(p.a);
            while (p.peek() == '[') try values.append(try p.value());
            const additions = try values.toOwnedSlice();
            var duplicate = false;
            for (props.items) |*property| {
                if (std.mem.eql(u8, property.id, id)) {
                    const merged = try p.a.alloc([]const u8, property.values.len + additions.len);
                    @memcpy(merged[0..property.values.len], property.values);
                    @memcpy(merged[property.values.len..], additions);
                    property.values = merged;
                    duplicate = true;
                    break;
                }
            }
            if (!duplicate) try props.append(.{ .id = id, .values = additions });
        }
        const n = try p.a.create(Node);
        n.* = .{ .properties = try props.toOwnedSlice() };
        return n;
    }
    fn tree(p: *Parser) anyerror!*const Node {
        if (p.peek() != '(') return error.TreeMissing;
        p.i += 1;
        if (p.peek() != ';') return error.TreeWithNoNodes;
        const root = try p.node();
        var current = root;
        while (p.peek() == ';') {
            const next = try p.node();
            const children = try p.a.alloc(*const Node, 1);
            children[0] = next;
            current.children = children;
            current = next;
        }
        var children = std.array_list.Managed(*const Node).init(p.a);
        while (p.peek() == '(') try children.append(try p.tree());
        current.children = try children.toOwnedSlice();
        if (p.peek() != ')') return error.TreeMissing;
        p.i += 1;
        return root;
    }
};
pub fn parse(a: std.mem.Allocator, input: []const u8) !Tree {
    var arena = std.heap.ArenaAllocator.init(a);
    errdefer arena.deinit();
    var parser = Parser{ .a = arena.allocator(), .s = input };
    const root = try parser.tree();
    if (parser.peek() != 0) return error.TreeMissing;
    return .{ .arena = arena, .root = root };
}
