// Object pool with an O(1) free list
// Run: g++ -std=c++20 -Wall -o free_list_pool free_list_pool.cpp && ./free_list_pool

#include <array>
#include <cstddef>
#include <optional>

template <class T, std::size_t Capacity>
class Pool {
public:
    Pool() { for (std::size_t i = 0; i < Capacity; ++i) next_free_[i] = i + 1; }

    std::size_t free_count() const { return free_count_; }
    T& get(std::size_t index) { return items_[index]; }

    // the index of a free slot, or nothing if the pool is exhausted
    std::optional<std::size_t> acquire() { return std::nullopt; }
    // false for an out-of-range index or a slot that is already free
    bool release(std::size_t index) { return false; }

private:
    std::array<T, Capacity> items_{};
    std::array<std::size_t, Capacity> next_free_{};  // the free list is threaded through the unused slots
    std::array<bool, Capacity> in_use_{};
    std::size_t free_head_ = 0;                      // first free slot; Capacity means "none"
    std::size_t free_count_ = Capacity;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { Pool<unsigned, 4> p; CHECK(p.acquire() == 0u); CHECK(p.acquire() == 1u); CHECK(p.acquire() == 2u); CHECK(p.acquire() == 3u); CHECK(!p.acquire().has_value()); CHECK(p.free_count() == 0); }
    { Pool<unsigned, 4> p; for (int i = 0; i < 4; ++i) p.acquire(); CHECK(p.release(1)); CHECK(p.free_count() == 1); CHECK(p.acquire() == 1u); }
    { Pool<unsigned, 4> p; for (int i = 0; i < 4; ++i) p.acquire(); p.release(2); p.release(0); CHECK(p.acquire() == 0u); CHECK(p.acquire() == 2u); CHECK(!p.acquire().has_value()); }
    { Pool<unsigned, 3> p; auto a = *p.acquire(); CHECK(p.release(a)); CHECK(!p.release(a)); CHECK(!p.release(99)); CHECK(!p.release(2)); CHECK(p.free_count() == 3);
      bool seen[3] = {false, false, false}; for (int i = 0; i < 3; ++i) seen[*p.acquire()] = true; CHECK(seen[0] && seen[1] && seen[2]); CHECK(!p.acquire().has_value()); }
    { Pool<unsigned, 2> p; auto a = *p.acquire(), b = *p.acquire(); p.get(a) = 11; p.get(b) = 22; CHECK(p.get(a) == 11u); CHECK(p.get(b) == 22u); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
