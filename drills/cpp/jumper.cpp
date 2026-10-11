// Coyote time and jump buffering
// Run: g++ -std=c++20 -Wall -o jumper jumper.cpp && ./jumper

#include <optional>

class Jumper {
public:
    explicit Jumper(int coyote = 100, int buffer = 100) : coyote_(coyote), buffer_(buffer) {}
    void leave_ground(int t) {}
    bool press(int t, bool grounded) { return false; }  // true if the jump happens now
    bool land(int t) { return false; }                  // true if a buffered jump fires
private:
    int coyote_, buffer_;
    std::optional<int> left_at_, pressed_at_;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { Jumper j; CHECK(j.press(0, true)); }
    { Jumper j; CHECK(!j.press(500, false)); }
    { Jumper j; j.leave_ground(1000); CHECK(j.press(1060, false)); }
    { Jumper j; j.leave_ground(1000); CHECK(!j.press(1101, false)); }
    { Jumper j; j.leave_ground(1000); CHECK(j.press(1040, false)); CHECK(!j.press(1060, false)); }
    { Jumper j; CHECK(!j.press(2000, false)); CHECK(j.land(2060)); }
    { Jumper j; j.press(2000, false); CHECK(!j.land(2101)); }
    { Jumper j; j.press(2000, false); CHECK(j.land(2050)); CHECK(!j.land(2060)); }
    { Jumper j; j.leave_ground(100); j.land(120); CHECK(!j.press(150, false)); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
