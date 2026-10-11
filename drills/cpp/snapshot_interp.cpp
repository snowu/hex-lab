// Snapshot interpolation for remote players
// Run: g++ -std=c++20 -Wall -o snapshot_interp snapshot_interp.cpp && ./snapshot_interp

#include <cstddef>
#include <optional>
#include <vector>

struct Snapshot { double t, x; };

// Position at render_t, blended between the snapshots around it. snaps is sorted by t.
std::optional<double> interpolate(const std::vector<Snapshot>& snaps, double render_t) { return std::nullopt; }

// ---- tests: do not edit below this line ----
#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool is(std::optional<double> v, double x) { return v && std::fabs(*v - x) < 1e-9; }

int main() {
    std::vector<Snapshot> s = {{1.0, 10}, {1.1, 20}, {1.3, 60}};
    CHECK(is(interpolate(s, 1.05), 15)); CHECK(is(interpolate(s, 1.2), 40));
    CHECK(is(interpolate(s, 1.0), 10)); CHECK(is(interpolate(s, 1.1), 20)); CHECK(is(interpolate(s, 1.3), 60));
    CHECK(is(interpolate(s, 0.5), 10)); CHECK(is(interpolate(s, 9.0), 60));
    CHECK(is(interpolate({{3, 7}}, 100), 7)); CHECK(!interpolate({}, 1.0));
    { std::vector<Snapshot> dup = {{1, 1}, {2, 5}, {2, 9}, {3, 9}}; auto v = interpolate(dup, 2.0); CHECK(v && std::isfinite(*v)); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
