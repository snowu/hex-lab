// Client-side prediction and reconciliation
// Run: g++ -std=c++20 -Wall -o net_reconcile net_reconcile.cpp && ./net_reconcile

#include <cstddef>
#include <cstdint>
#include <vector>

struct Input { std::uint32_t seq; int dx; };

// server_pos is where the server says we were after processing input number acked.
// Replay the inputs the server has not seen yet (seq > acked) on top of it.
int reconcile(int server_pos, std::uint32_t acked, const std::vector<Input>& pending) { return server_pos; }

// How many leading inputs (sorted by seq) are acknowledged and can be dropped.
std::size_t drop_acked(const std::vector<Input>& pending, std::uint32_t acked) { return 0; }

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    std::vector<Input> p = {{5, 1}, {6, 1}, {7, 1}, {8, 2}, {9, -1}};
    CHECK(reconcile(100, 7, p) == 101);
    CHECK(reconcile(100, 9, p) == 100); CHECK(reconcile(100, 50, p) == 100);
    CHECK(reconcile(100, 0, p) == 104);
    CHECK(reconcile(90, 7, p) == 91);
    CHECK(drop_acked(p, 7) == 3); CHECK(drop_acked(p, 4) == 0); CHECK(drop_acked(p, 99) == 5); CHECK(drop_acked({}, 3) == 0);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
