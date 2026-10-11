// Fixed timestep with an accumulator
// Run: g++ -std=c++20 -Wall -o fixed_steps fixed_steps.cpp && ./fixed_steps

#include <vector>

// Returns, for every frame, how many simulation steps ran.
std::vector<int> fixed_steps(const std::vector<int>& frame_ms, int step = 10, int max_steps = 5) {
    return std::vector<int>(frame_ms.size(), 0);
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using V = std::vector<int>;

int main() {
    CHECK(fixed_steps({16, 16, 16}) == V({1, 2, 1}));
    CHECK(fixed_steps({5, 5, 5, 5}) == V({0, 1, 0, 1}));
    CHECK(fixed_steps({35}) == V({3}));
    CHECK(fixed_steps({100, 100}) == V({5, 5}));
    CHECK(fixed_steps({100, 9, 1}) == V({5, 0, 1}));
    CHECK(fixed_steps({50, 7}, 20, 2) == V({2, 0}));
    CHECK(fixed_steps({}).empty());
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
