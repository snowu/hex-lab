// Snap an image to a palette
// Run: g++ -std=c++20 -Wall -o quantize quantize.cpp && ./quantize

#include <array>
#include <cstddef>
#include <vector>

using Rgb = std::array<int, 3>;

std::size_t nearest_index(Rgb c, const std::vector<Rgb>& palette) {
    return 0;
}

std::vector<std::size_t> quantize(const std::vector<Rgb>& pixels, const std::vector<Rgb>& palette) {
    return std::vector<std::size_t>(pixels.size(), 0);
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Idx = std::vector<std::size_t>;

int main() {
    std::vector<Rgb> P = {{0, 0, 0}, {255, 255, 255}, {255, 0, 0}};
    CHECK(nearest_index({255, 0, 0}, P) == 2);
    CHECK(nearest_index({200, 30, 30}, P) == 2);
    CHECK(nearest_index({60, 60, 60}, P) == 0);
    CHECK(nearest_index({250, 250, 250}, P) == 1);
    CHECK(nearest_index({1, 1, 1}, {{0, 0, 0}, {2, 2, 2}}) == 0);
    CHECK(quantize({{10, 10, 10}, {250, 250, 250}, {240, 10, 10}, {0, 0, 0}}, P) == Idx({0, 1, 2, 0}));
    CHECK(quantize({}, P).empty());
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
