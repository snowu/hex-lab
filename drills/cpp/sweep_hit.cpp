// Swept collision time (no tunneling)
// Run: g++ -std=c++20 -Wall -o sweep_hit sweep_hit.cpp && ./sweep_hit

#include <optional>

std::optional<float> sweep_hit(float pos, float size, float dist, float wall_left) {
    return std::nullopt;
}

// ---- tests: do not edit below this line ----
#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool hit(std::optional<float> got, float expected) { return got && std::fabs(*got - expected) < 1e-5f; }

int main() {
    CHECK(hit(sweep_hit(0, 8, 100, 50), 0.42f));
    CHECK(hit(sweep_hit(0, 10, 40, 50), 1.0f));
    CHECK(!sweep_hit(0, 8, 10, 50));
    CHECK(hit(sweep_hit(0, 2, 5000, 100), 0.0196f));
    CHECK(!sweep_hit(200, 8, 100, 50));
    CHECK(!sweep_hit(0, 8, -100, 50));
    CHECK(hit(sweep_hit(42, 8, 10, 50), 0.0f));
    CHECK(!sweep_hit(46, 8, 10, 50));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
