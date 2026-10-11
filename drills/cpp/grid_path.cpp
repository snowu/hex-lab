// Shortest path on a tile map
// Run: g++ -std=c++20 -Wall -o grid_path grid_path.cpp && ./grid_path

#include <queue>
#include <string>
#include <utility>
#include <vector>

using Cell = std::pair<int, int>;  // (row, col)

// Steps in the shortest 4-directional path, or -1 if unreachable.
int shortest_path(const std::vector<std::string>& grid, Cell start, Cell goal) {
    return -2;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(shortest_path({".....", ".###.", ".#...", ".#.#.", "....."}, {0, 0}, {2, 4}) == 6);
    CHECK(shortest_path({"..."}, {0, 1}, {0, 1}) == 0);
    CHECK(shortest_path({".#.", ".#.", ".#."}, {0, 0}, {0, 2}) == -1);
    CHECK(shortest_path({".#"}, {0, 0}, {0, 1}) == -1);
    CHECK(shortest_path({"..", ".."}, {0, 0}, {1, 1}) == 2);
    { std::vector<std::string> big(300, std::string(300, '.')); CHECK(shortest_path(big, {0, 0}, {299, 299}) == 598); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
