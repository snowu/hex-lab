// Sparse set: the heart of a fast ECS
// Run: g++ -std=c++20 -Wall -o sparse_set sparse_set.cpp && ./sparse_set

#include <array>
#include <cstdint>
#include <optional>
#include <vector>

template <class T, std::size_t Capacity>
class SparseSet {
public:
    bool has(std::uint32_t id) const { return false; }
    // false if id is out of range or already present
    bool add(std::uint32_t id, T value) { return false; }
    std::optional<T> get(std::uint32_t id) const { return std::nullopt; }
    // swap-remove: keep the dense arrays packed
    bool remove(std::uint32_t id) { return false; }
    std::vector<std::uint32_t> ids() const { return {dense_.begin(), dense_.begin() + count_}; }

private:
    std::array<std::uint32_t, Capacity> sparse_{};  // id -> index into dense_
    std::array<std::uint32_t, Capacity> dense_{};   // index -> id
    std::array<T, Capacity> values_{};              // index -> value
    std::size_t count_ = 0;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Ids = std::vector<std::uint32_t>;

int main() {
    { SparseSet<int, 8> s; CHECK(s.add(3, 30)); CHECK(s.add(5, 50)); CHECK(s.has(3)); CHECK(!s.has(4));
      CHECK(s.get(5) == 50); CHECK(!s.get(4).has_value()); }
    { SparseSet<int, 4> s; CHECK(s.add(1, 10)); CHECK(!s.add(1, 99)); CHECK(s.get(1) == 10); CHECK(!s.add(4, 1)); CHECK(!s.has(100)); }
    { SparseSet<int, 8> s; s.add(1, 10); s.add(2, 20); s.add(3, 30);
      CHECK(s.remove(1)); CHECK(s.ids() == Ids({3, 2})); CHECK(s.get(3) == 30); CHECK(s.get(2) == 20); CHECK(!s.has(1)); CHECK(!s.remove(1)); }
    { SparseSet<int, 4> s; s.add(0, 5); s.add(1, 6); CHECK(s.remove(1)); CHECK(s.ids() == Ids({0})); CHECK(!s.has(1)); }
    { SparseSet<int, 8> s; s.add(2, 1); s.add(6, 2); s.remove(6); CHECK(!s.has(6)); s.add(7, 3); CHECK(!s.has(6)); CHECK(s.has(7)); }
    { SparseSet<int, 4> s; s.add(2, 1); s.remove(2); CHECK(s.add(2, 9)); CHECK(s.get(2) == 9); CHECK(s.ids().size() == 1); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
