// A versioned binary save format
// Run: g++ -std=c++20 -Wall -o save_codec save_codec.cpp && ./save_codec

#include <array>
#include <cstdint>
#include <optional>
#include <vector>

struct Save { std::uint32_t coins; std::uint16_t level; };

std::array<std::uint8_t, 9> encode(Save s) {
    return {};
}

std::optional<Save> decode(const std::vector<std::uint8_t>& bytes) {
    return std::nullopt;
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Bytes = std::vector<std::uint8_t>;

int main() {
    { auto b = encode({0x01020304, 0x0506}); CHECK(Bytes(b.begin(), b.end()) == Bytes({0x53, 2, 4, 3, 2, 1, 6, 5, 0x6A})); }
    { auto b = encode({123456, 77}); auto got = decode(Bytes(b.begin(), b.end())); CHECK(got && got->coins == 123456 && got->level == 77); }
    { auto got = decode({0x53, 1, 0x2C, 0x01, 7, 0x88}); CHECK(got && got->coins == 300 && got->level == 7); }
    CHECK(!decode({}));
    CHECK(!decode({0x53, 2, 4, 3}));
    CHECK(!decode({0x54, 2, 4, 3, 2, 1, 6, 5, 0x6B}));
    CHECK(!decode({0x53, 2, 4, 3, 2, 1, 6, 5, 0x00}));
    CHECK(!decode({0x53, 3, 0, 0, 0, 0, 0, 0, 0x56}));
    CHECK(!decode({0x53, 2, 0x2C, 0x01, 7, 0x88}));
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
