#pragma once
#include <memory>
#include <optional>
namespace persistent_zipper {
struct Node;
using Tree = std::shared_ptr<const Node>;
struct Node {
    int value;
    Tree left, right;
    static Tree make(int value, Tree left = {}, Tree right = {}) {
        return std::make_shared<const Node>(Node{value, std::move(left), std::move(right)});
    }
};
class Zipper {
  public:
    explicit Zipper(Tree tree) { (void)tree; }
    int value() const { return 0; }
    std::optional<Zipper> left() const { return std::nullopt; }
    std::optional<Zipper> right() const { return std::nullopt; }
    std::optional<Zipper> up() const { return std::nullopt; }
    Zipper set_value(int value) const { (void)value; return *this; }
    Zipper set_left(Tree tree) const { (void)tree; return *this; }
    Zipper set_right(Tree tree) const { (void)tree; return *this; }
    Tree to_tree() const { return {}; }
};
}
