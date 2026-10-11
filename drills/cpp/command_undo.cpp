// Command pattern: undo and redo
// Run: g++ -std=c++20 -Wall -o command_undo command_undo.cpp && ./command_undo

#include <array>
#include <cstddef>
#include <vector>

struct Command { std::size_t index; int value; int prev; };

class History {
public:
    std::array<int, 8> cells{};

    // Set cells[index] = value and remember how to undo it.
    void exec(std::size_t index, int value) {}
    bool undo() { return false; }
    bool redo() { return false; }

private:
    std::vector<Command> undo_, redo_;  // at most 4 each
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { History h; h.exec(0, 5); CHECK(h.cells[0] == 5); }
    { History h; h.exec(0, 5); h.exec(0, 9); CHECK(h.undo()); CHECK(h.cells[0] == 5); CHECK(h.undo()); CHECK(h.cells[0] == 0); CHECK(!h.undo()); }
    { History h; CHECK(!h.redo()); h.exec(1, 7); h.undo(); CHECK(h.redo()); CHECK(h.cells[1] == 7); CHECK(!h.redo()); }
    { History h; h.exec(1, 1); h.exec(1, 2); h.undo(); h.exec(1, 3); CHECK(!h.redo()); CHECK(h.cells[1] == 3); }
    { History h; for (int v : {1, 2, 3, 4, 5}) h.exec(0, v); int n = 0; while (h.undo()) ++n; CHECK(n == 4); CHECK(h.cells[0] == 1); }
    { History h; h.exec(8, 1); CHECK(!h.undo()); }
    { History h; h.exec(2, 7); h.exec(3, 8); h.undo(); CHECK(h.cells[3] == 0); CHECK(h.cells[2] == 7); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
