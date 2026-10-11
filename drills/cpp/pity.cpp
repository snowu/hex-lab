// Drop rates with a pity timer
// Run: g++ -std=c++20 -Wall -o pity pity.cpp && ./pity

#include <vector>

// One boolean per roll: did it drop?
std::vector<bool> simulate_pity(const std::vector<float>& rolls, float p, int pity) {
    return std::vector<bool>(rolls.size(), false);
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using B = std::vector<bool>;

int main() {
    CHECK(simulate_pity({0.1f, 0.9f, 0.04f}, 0.05f, 90) == B({false, false, true}));
    CHECK(simulate_pity({0.9f, 0.9f, 0.9f}, 0.05f, 3) == B({false, false, true}));
    CHECK(simulate_pity(std::vector<float>(6, 0.9f), 0.05f, 3) == B({false, false, true, false, false, true}));
    CHECK(simulate_pity({0.9f, 0.01f, 0.9f, 0.9f, 0.9f}, 0.05f, 3) == B({false, true, false, false, true}));
    CHECK(simulate_pity({0.99f, 0.99f}, 0.05f, 1) == B({true, true}));
    { auto out = simulate_pity(std::vector<float>(100, 0.99f), 0.01f, 10); int gap = 0, worst = 0;
      for (bool d : out) { gap = d ? 0 : gap + 1; if (gap > worst) worst = gap; } CHECK(worst == 9); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
