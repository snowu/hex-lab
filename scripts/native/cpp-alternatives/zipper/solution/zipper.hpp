#pragma once
#include <memory>
#include <optional>
#include <stdexcept>
#include <vector>

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
/* Immutable shared_ptr nodes make ordinary Zipper copies safe. Edits copy only
 * the focus and ancestor path; unchanged subtrees share ownership through RAII.
 * This is a C++ alternative to the exercise's explicit C-compatible ownership API. */
class Zipper {
    struct Crumb { int value; Tree sibling; bool from_left; };
    Tree focus_;
    std::vector<Crumb> ancestors_;
    Zipper(Tree focus, std::vector<Crumb> ancestors)
        : focus_(std::move(focus)), ancestors_(std::move(ancestors)) {}
    std::optional<Zipper> down(bool left) const {
        if (!focus_) return std::nullopt;
        const auto &child = left ? focus_->left : focus_->right;
        if (!child) return std::nullopt;
        auto path = ancestors_;
        path.push_back({focus_->value, left ? focus_->right : focus_->left, left});
        return Zipper(child, std::move(path));
    }
  public:
    explicit Zipper(Tree tree) : focus_(std::move(tree)) {}
    int value() const {
        if (!focus_) throw std::logic_error("empty zipper");
        return focus_->value;
    }
    std::optional<Zipper> left() const { return down(true); }
    std::optional<Zipper> right() const { return down(false); }
    std::optional<Zipper> up() const {
        if (ancestors_.empty()) return std::nullopt;
        auto path = ancestors_;
        const auto crumb = path.back(); path.pop_back();
        auto parent = Node::make(crumb.value, crumb.from_left ? focus_ : crumb.sibling,
                                crumb.from_left ? crumb.sibling : focus_);
        return Zipper(std::move(parent), std::move(path));
    }
    Zipper set_value(int value) const {
        return Zipper(Node::make(value, focus_->left, focus_->right), ancestors_);
    }
    Zipper set_left(Tree subtree) const {
        return Zipper(Node::make(value(), std::move(subtree), focus_->right), ancestors_);
    }
    Zipper set_right(Tree subtree) const {
        return Zipper(Node::make(value(), focus_->left, std::move(subtree)), ancestors_);
    }
    Tree to_tree() const {
        auto current = *this;
        while (auto parent = current.up()) current = std::move(*parent);
        return current.focus_;
    }
};
} // namespace persistent_zipper
