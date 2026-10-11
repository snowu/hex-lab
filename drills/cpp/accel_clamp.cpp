// Acceleration with a speed cap
// Run: g++ -std=c++20 -Wall -o accel_clamp accel_clamp.cpp && ./accel_clamp

#include <cmath>

struct Vec2 { float x, y; };

Vec2 accelerate(Vec2 v, Vec2 a, float dt, float max_speed) {
    return v;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool near(float a, float b) { return std::fabs(a - b) < 1e-4f; }
static bool is(Vec2 v, float x, float y) { return near(v.x, x) && near(v.y, y); }

int main() {
    CHECK(is(accelerate({0, 0}, {3, 4}, 1, 100), 3, 4));
    CHECK(is(accelerate({0, 0}, {30, 40}, 1, 25), 15, 20));
    { Vec2 v = accelerate({0, 0}, {100, 100}, 1, 10); CHECK(near(std::sqrt(v.x * v.x + v.y * v.y), 10)); CHECK(near(v.x, v.y)); }
    CHECK(is(accelerate({1, 1}, {2, 2}, 0.5f, 100), 2, 2));
    CHECK(is(accelerate({0, 0}, {0, 0}, 1, 5), 0, 0));
    CHECK(is(accelerate({0, 0}, {-30, -40}, 1, 25), -15, -20));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
