// A behaviour tree tick
// Run: g++ -std=c++20 -Wall -o behavior_tree behavior_tree.cpp && ./behavior_tree

#include <cstddef>
#include <vector>

enum class Status { Success, Failure, Running };
enum class Kind { Leaf, Sequence, Selector, Inverter };
struct Node { Kind kind; std::size_t a = 0, b = 0; };

// leaf: a = index into results. sequence/selector: children are kids[a .. a + b]. inverter: a = child node index.
Status tick(const std::vector<Node>& nodes, const std::vector<std::size_t>& kids, const std::vector<Status>& results, std::size_t root) {
    return Status::Failure;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using S = Status;

int main() {
    std::vector<Node> nodes = {{Kind::Selector, 0, 2}, {Kind::Sequence, 2, 3}, {Kind::Leaf, 0}, {Kind::Leaf, 1}, {Kind::Leaf, 2}, {Kind::Leaf, 3}, {Kind::Inverter, 4}};
    std::vector<std::size_t> kids = {1, 5, 2, 3, 4};
    CHECK(tick(nodes, kids, {S::Success, S::Success, S::Success, S::Failure}, 0) == S::Success);
    CHECK(tick(nodes, kids, {S::Success, S::Success, S::Success, S::Failure}, 1) == S::Success);
    CHECK(tick(nodes, kids, {S::Success, S::Failure, S::Success, S::Success}, 0) == S::Success);
    CHECK(tick(nodes, kids, {S::Success, S::Failure, S::Success, S::Success}, 1) == S::Failure);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Failure, S::Failure}, 0) == S::Failure);
    CHECK(tick(nodes, kids, {S::Success, S::Success, S::Running, S::Success}, 0) == S::Running);
    CHECK(tick(nodes, kids, {S::Running, S::Failure, S::Failure, S::Success}, 0) == S::Running);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Success, S::Failure}, 6) == S::Failure);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Failure, S::Failure}, 6) == S::Success);
    CHECK(tick(nodes, kids, {S::Failure, S::Failure, S::Running, S::Failure}, 6) == S::Running);
    std::vector<Node> ns = {{Kind::Sequence, 0, 0}, {Kind::Selector, 0, 0}};
    CHECK(tick(ns, {}, {}, 0) == S::Success);
    CHECK(tick(ns, {}, {}, 1) == S::Failure);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
