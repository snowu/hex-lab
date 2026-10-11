// Utility AI: scoring and not flip-flopping
// Run: g++ -std=c++20 -Wall -o utility_pick utility_pick.cpp && ./utility_pick

#include <algorithm>
#include <cstddef>
#include <optional>
#include <vector>

// Multiply the considerations, each clamped to 0..1. An empty list scores 1.
double score(const std::vector<double>& considerations) { return 0; }

// Index of the best action; the current one gets +inertia. Ties: lowest index. Empty: nothing.
std::optional<std::size_t> pick(const std::vector<double>& scores, std::optional<std::size_t> current, double inertia) { return std::nullopt; }

// ---- tests: do not edit below this line ----
#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool near(double a, double b) { return std::fabs(a - b) < 1e-12; }
using O = std::optional<std::size_t>;

int main() {
    CHECK(near(score({0.5, 0.5}), 0.25)); CHECK(near(score({1.7, 0.5}), 0.5)); CHECK(near(score({-0.3, 0.9}), 0.0)); CHECK(near(score({0.8, 0.0, 0.9}), 0.0)); CHECK(near(score({}), 1.0));
    CHECK(pick({0.2, 0.5, 0.9, 0.1}, std::nullopt, 0) == O(2));
    CHECK(pick({0.1, 0.7, 0.7}, std::nullopt, 0) == O(1));
    CHECK(pick({0.50, 0.55}, O(0), 0.1) == O(0)); CHECK(pick({0.50, 0.55}, std::nullopt, 0.1) == O(1));
    CHECK(pick({0.2, 0.9}, O(0), 0.1) == O(1));
    CHECK(!pick({}, std::nullopt, 0.1).has_value()); CHECK(pick({0.1, 0.4}, O(7), 0.5) == O(1));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
