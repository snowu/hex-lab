// A seeded random number generator
// Run: g++ -std=c++20 -Wall -o rng_lcg rng_lcg.cpp && ./rng_lcg

#include <cstdint>

class Rng {
public:
    explicit Rng(std::uint64_t seed) {}
    std::uint32_t next_int(std::uint32_t n) { return 0; }
    double next_float() { return 0; }
private:
    std::uint64_t state_ = 0;
};

// ---- tests: do not edit below this line ----
#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { Rng r(42); const unsigned e[] = {81, 33, 69, 61, 56, 93}; for (unsigned v : e) CHECK(r.next_int(100) == v); }
    { Rng r(7); CHECK(std::fabs(r.next_float() - 0.5970560554414988) < 1e-12); CHECK(std::fabs(r.next_float() - 0.29926483193412423) < 1e-12);
      CHECK(std::fabs(r.next_float() - 0.3316746735945344) < 1e-12); }
    { Rng a(9), b(9), c(10); bool same = true, differs = false;
      for (int i = 0; i < 20; ++i) { auto x = a.next_int(1000); if (x != b.next_int(1000)) same = false; if (x != c.next_int(1000)) differs = true; }
      CHECK(same); CHECK(differs); }
    { Rng r(5); double sum = 0; bool inrange = true;
      for (int i = 0; i < 1000; ++i) { double f = r.next_float(); if (f < 0 || f >= 1) inrange = false; sum += f; }
      CHECK(inrange); CHECK(sum / 1000 > 0.4 && sum / 1000 < 0.6); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
