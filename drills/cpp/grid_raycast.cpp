// Raycast on a grid (DDA)
// Run: g++ -std=c++20 -Wall -o grid_raycast grid_raycast.cpp && ./grid_raycast

#include <cmath>
#include <optional>
#include <string>
#include <vector>

struct Hit { int col, row; double dist; };

// grid rows of '.' and '#', cells are 1x1, y grows down. Returns the first wall cell entered by the ray.
std::optional<Hit> raycast(const std::vector<std::string>& grid, double ox, double oy, double dx, double dy, double max_dist) {
    return std::nullopt;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool hit(std::optional<Hit> h, int c, int r, double d) { return h && h->col == c && h->row == r && std::fabs(h->dist - d) < 1e-9; }

int main() {
    std::vector<std::string> G = {".....", "..#..", ".....", "....#", "....."};
    CHECK(hit(raycast(G, 0.5, 1.5, 1, 0, 10), 2, 1, 1.5));
    CHECK(hit(raycast(G, 0.5, 3.5, 1, 0, 10), 4, 3, 3.5));
    CHECK(hit(raycast(G, 2.5, 4.5, 0, -1, 10), 2, 1, 2.5));
    CHECK(hit(raycast(G, 0.5, 0.5, 2, 1, 10), 2, 1, 1.6770509831248424));
    CHECK(hit(raycast(G, 0.2, 0.3, 3, 2, 10), 2, 1, 2.1633307652783937));
    CHECK(!raycast(G, 4.5, 0.5, -1, 0, 10));
    CHECK(!raycast(G, 0.5, 0.5, -1, 0, 10));
    CHECK(!raycast(G, 0.5, 1.5, 1, 0, 1.0));
    CHECK(raycast(G, 0.5, 1.5, 1, 0, 1.6).has_value());
    CHECK(hit(raycast(G, 2.5, 1.5, 1, 0, 10), 2, 1, 0.0));
    CHECK(!raycast(G, -1.5, 0.5, 1, 0, 10));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
