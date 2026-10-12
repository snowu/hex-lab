// The idiomatic C++ alternative has the same persistent contracts, with RAII.
using persistent_zipper::Node;
auto tree_value = Node::make(1, Node::make(2, {}, Node::make(3)), Node::make(4));
persistent_zipper::Zipper cpp_original(tree_value);
auto cpp_deep = cpp_original.left()->right().value();
auto cpp_changed = cpp_deep.set_value(30);
auto cpp_branch = cpp_deep.set_value(50);
assert(cpp_original.value() == 1 && cpp_deep.value() == 3);
assert(tree_value->left->right->value == 3);
assert(cpp_changed.to_tree()->left->right->value == 30);
assert(cpp_branch.to_tree()->left->right->value == 50);
assert(!cpp_original.up() && !cpp_original.left()->left());
auto cpp_removed = cpp_changed.up()->set_right({});
assert(!cpp_removed.right() && cpp_changed.value() == 30);
auto cpp_inserted = cpp_removed.set_left(Node::make(7));
assert(cpp_inserted.left()->value() == 7 && !cpp_removed.left());
