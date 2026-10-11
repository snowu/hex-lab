// Exponential upgrade costs
// Run: g++ -std=c++20 -Wall -o upgrade_cost upgrade_cost.cpp && ./upgrade_cost

#include <cmath>
#include <cstdint>

std::uint64_t upgrade_cost(std::uint64_t base, double growth, unsigned level) {
    return 0;
}

unsigned levels_affordable(std::uint64_t budget, std::uint64_t base, double growth) {
    return 0;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(upgrade_cost(10, 2, 3) == 80);
    CHECK(upgrade_cost(10, 1.5, 2) == 22);
    CHECK(upgrade_cost(7, 3, 0) == 7);
    CHECK(levels_affordable(70, 10, 2) == 3);
    CHECK(levels_affordable(150, 10, 2) == 4);
    CHECK(levels_affordable(5, 10, 2) == 0);
    CHECK(levels_affordable(1000000, 10, 1.15) > levels_affordable(1000000, 10, 2));
    CHECK(levels_affordable(2000, 10, 2) - levels_affordable(100, 10, 2) == 4);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
