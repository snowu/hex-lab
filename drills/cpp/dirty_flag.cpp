// Dirty flag: lazy world transforms
// Run: g++ -std=c++20 -Wall -o dirty_flag dirty_flag.cpp && ./dirty_flag

#include <array>
#include <cstddef>
#include <optional>

class Scene {
public:
    static constexpr std::size_t kMax = 8;
    unsigned recomputes = 0;

    std::size_t add(std::optional<std::size_t> parent, int local) { return 0; }
    void set_local(std::size_t i, int v) {}
    int world(std::size_t i) { return 0; }

private:
    std::array<std::optional<std::size_t>, kMax> parent_{};
    std::array<int, kMax> local_{}, cache_{};
    std::array<bool, kMax> dirty_{};
    std::size_t n_ = 0;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

static Scene chain() { Scene s; auto a = s.add(std::nullopt, 1); auto b = s.add(a, 2); auto c = s.add(b, 3); s.add(c, 4); return s; }

int main() {
    { Scene s = chain(); CHECK(s.world(3) == 10); CHECK(s.world(1) == 3); }
    { Scene s = chain(); s.world(3); CHECK(s.recomputes == 4); s.world(3); s.world(2); CHECK(s.recomputes == 4); }
    { Scene s = chain(); s.world(3); s.set_local(1, 20); CHECK(s.world(3) == 28); CHECK(s.recomputes == 7); }
    { Scene s; auto root = s.add(std::nullopt, 10); auto l = s.add(root, 1); auto r = s.add(root, 2); s.world(l); s.world(r);
      unsigned before = s.recomputes; s.set_local(l, 5); s.world(r); CHECK(s.recomputes == before); CHECK(s.world(l) == 15); }
    { Scene s = chain(); s.world(3); s.set_local(0, 100); CHECK(s.world(3) == 109); CHECK(s.recomputes == 8); }
    { Scene s = chain(); s.world(3); auto e = s.add(3, 5); CHECK(s.world(e) == 15); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
