// Pixel-perfect integer scaling
// Run: g++ -std=c++20 -Wall -o integer_scale integer_scale.cpp && ./integer_scale

#include <algorithm>

struct Fit { int scale, off_x, off_y; };

Fit integer_scale(int win_w, int win_h, int base_w, int base_h) {
    return {0, 0, 0};
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool fit(int w, int h, int bw, int bh, int s, int ox, int oy) { Fit f = integer_scale(w, h, bw, bh); return f.scale == s && f.off_x == ox && f.off_y == oy; }

int main() {
    CHECK(fit(1920, 1080, 320, 180, 6, 0, 0));
    CHECK(fit(1000, 700, 320, 180, 3, 20, 80));
    CHECK(fit(2000, 400, 320, 180, 2, 680, 20));
    CHECK(fit(200, 100, 320, 180, 1, -60, -40));
    CHECK(fit(390, 844, 160, 144, 2, 35, 278));
    CHECK(fit(201, 100, 320, 180, 1, -60, -40));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
