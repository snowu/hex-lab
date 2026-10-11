// Cave generation: one smoothing step
// Run: g++ -std=c++20 -Wall -o ca_smooth ca_smooth.cpp && ./ca_smooth

#include <string>
#include <vector>

std::vector<std::string> smooth(const std::vector<std::string>& grid) {
    return grid;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using G = std::vector<std::string>;

int main() {
    CHECK(smooth({"...", "...", "..."}) == G({"#.#", "...", "#.#"}));
    CHECK(smooth({"###", "###", "###"}) == G({"###", "###", "###"}));
    { G g(5, std::string(5, '.')); g[2][2] = '#'; CHECK(smooth(g)[2][2] == '.'); }
    CHECK(smooth({"#.", ".."}) == G({"##", "##"}));
    { G g{"..#", ".#.", "#.."}; G before = g; smooth(g); CHECK(g == before); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
