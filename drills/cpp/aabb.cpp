// AABB overlap and push-out
// Run: g++ -std=c++20 -Wall -o aabb aabb.cpp && ./aabb

#include <algorithm>

struct Rect { float x, y, w, h; };
struct Vec2 { float x, y; };

bool overlaps(const Rect& a, const Rect& b) {
    return false;
}

// How far to move a so it stops overlapping b (zero if it does not).
Vec2 push_out(const Rect& a, const Rect& b) {
    return {0, 0};
}

// ---- tests: do not edit below this line ----
#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool is(Vec2 v, float x, float y) { return std::fabs(v.x - x) < 1e-5f && std::fabs(v.y - y) < 1e-5f; }

int main() {
    Rect A{0, 0, 10, 10};
    CHECK(overlaps(A, {5, 5, 10, 10}));
    CHECK(overlaps(A, {2, 2, 3, 3}));
    CHECK(!overlaps(A, {20, 0, 5, 5}));
    CHECK(!overlaps(A, {10, 0, 5, 5}));
    CHECK(is(push_out(A, {8, 0, 10, 10}), -2, 0));
    CHECK(is(push_out({8, 0, 10, 10}, A), 2, 0));
    CHECK(is(push_out(A, {0, 9, 10, 10}), 0, -1));
    CHECK(is(push_out({0, 9, 10, 10}, A), 0, 1));
    CHECK(is(push_out(A, {30, 30, 5, 5}), 0, 0));
    CHECK(is(push_out(A, {8, 8, 10, 10}), -2, 0));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
