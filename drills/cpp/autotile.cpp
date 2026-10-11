// Autotile bitmask
// Run: g++ -std=c++20 -Wall -o autotile autotile.cpp && ./autotile

#include <string>
#include <vector>

int bitmask(const std::vector<std::string>& grid, int row, int col) {
    return 0;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(bitmask({"###", "#.#", "###"}, 1, 1) == 15);
    CHECK(bitmask({"...", ".#.", "..."}, 1, 1) == 0);
    CHECK(bitmask({".#.", ".#.", "..."}, 1, 1) == 1);
    CHECK(bitmask({"...", ".##", ".#."}, 1, 1) == 6);
    CHECK(bitmask({"...", "##.", "..."}, 1, 1) == 8);
    CHECK(bitmask({"#.", ".."}, 0, 0) == 9);
    CHECK(bitmask({"..", ".#"}, 1, 1) == 6);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
