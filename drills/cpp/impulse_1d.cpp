// Collision response with impulses
// Run: g++ -std=c++20 -Wall -o impulse_1d impulse_1d.cpp && ./impulse_1d

struct Pair { double v1, v2; };

// Body 1 is on the left of body 2 and they touch. e = restitution.
Pair collide(double m1, double v1, double m2, double v2, double e) {
    return {v1, v2};
}

// ---- tests: do not edit below this line ----
#include <cmath>
#include <cstdio>
#include <initializer_list>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool near(double a, double b, double t = 1e-9) { return std::fabs(a - b) < t; }
static bool is(Pair p, double a, double b) { return near(p.v1, a) && near(p.v2, b); }

int main() {
    CHECK(is(collide(1, 3, 1, 0, 1), 0, 3));
    CHECK(is(collide(2, 3, 1, 0, 1), 1, 4));
    { Pair r = collide(2, 6, 3, 1, 0); CHECK(near(r.v1, (2.0 * 6 + 3.0 * 1) / 5.0)); CHECK(near(r.v1, r.v2)); }
    for (double e : {0.0, 0.3, 0.8, 1.0}) { Pair r = collide(1.5, 4.0, 0.7, -2.0, e); CHECK(near(1.5 * 4.0 + 0.7 * -2.0, 1.5 * r.v1 + 0.7 * r.v2)); }
    { Pair r = collide(1.5, 4.0, 0.7, -2.0, 1); CHECK(near(0.5 * 1.5 * 16 + 0.5 * 0.7 * 4, 0.5 * 1.5 * r.v1 * r.v1 + 0.5 * 0.7 * r.v2 * r.v2)); }
    { Pair r = collide(1, 10, 1e12, 0, 0.5); CHECK(near(r.v1, -5, 1e-6)); }
    CHECK(is(collide(1, 1, 1, 2, 1), 1, 2));
    CHECK(is(collide(3, 2, 1, 2, 0.5), 2, 2));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
