// Frame-rate independent smoothing
// Run: g++ -std=c++20 -Wall -o damp damp.cpp && ./damp

#include <cmath>

double damp(double current, double target, double k, double dt) {
    return current + (target - current) * k * dt;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool close(double a, double b) { return std::fabs(a - b) < 1e-9; }
static double run(int fps) { double p = 0; for (int i = 0; i < fps; ++i) p = damp(p, 10, 4, 1.0 / fps); return p; }

int main() {
    CHECK(close(damp(5, 10, 3, 0), 5));
    CHECK(close(damp(0, 10, 2, 0.5), 10 * (1 - std::exp(-1.0))));
    CHECK(close(run(30), run(144)));
    CHECK(close(run(60), run(5)));
    { double v = damp(0, 10, 50, 10); CHECK(v >= 0 && v <= 10); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
