// Spatial hash grid for neighbour queries
// Run: g++ -std=c++20 -Wall -o spatial_hash spatial_hash.cpp && ./spatial_hash

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <unordered_map>
#include <vector>

class SpatialHash {
public:
    explicit SpatialHash(float cell) : cell_(cell) {}
    void clear() {}
    // returns the new entity's id (0, 1, 2, ...)
    int insert(float x, float y) { return 0; }
    // ids of everything within distance r of (x, y), sorted ascending
    std::vector<int> near(float x, float y, float r) const { return {}; }

private:
    float cell_;
    std::unordered_map<std::int64_t, std::vector<int>> cells_;  // cell key -> entity ids
    std::vector<float> xs_, ys_;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Ids = std::vector<int>;

int main() {
    { SpatialHash h(10); h.insert(1, 1); h.insert(5, 5); h.insert(50, 50); CHECK(h.near(0, 0, 8) == Ids({0, 1})); }
    { SpatialHash h(10); h.insert(9, 9); CHECK(h.near(0, 0, 5).empty()); CHECK(h.near(0, 0, 13) == Ids({0})); }
    { SpatialHash h(10); h.insert(-1, -1); h.insert(1, 1); h.insert(-10, 0);
      CHECK(h.near(0, 0, 2) == Ids({0, 1})); CHECK(h.near(0, 0, 10) == Ids({0, 1, 2})); }
    { SpatialHash h(2); for (int i = 0; i < 20; ++i) h.insert(float(i), 0); CHECK(h.near(10, 0, 3) == Ids({7, 8, 9, 10, 11, 12, 13})); }
    { SpatialHash h(1); for (int i = 0; i < 30; ++i) h.insert(float(i), float(i)); CHECK(h.near(15, 15, 40).size() == 30); }
    { SpatialHash h(10); h.insert(0, 0); h.clear(); CHECK(h.near(0, 0, 5).empty()); CHECK(h.insert(3, 3) == 0); CHECK(h.near(0, 0, 5) == Ids({0})); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
