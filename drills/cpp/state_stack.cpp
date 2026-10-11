// Pushdown automaton: a stack of states
// Run: g++ -std=c++20 -Wall -o state_stack state_stack.cpp && ./state_stack

#include <cstdint>
#include <optional>
#include <vector>

enum class Kind { Enter, Exit, Pause, Unpause };
struct Event { Kind kind; std::uint8_t state; };

class StateStack {
public:
    std::optional<std::uint8_t> top() const { return stack_.empty() ? std::nullopt : std::optional<std::uint8_t>(stack_.back()); }
    const std::vector<Event>& events() const { return log_; }

    bool push(std::uint8_t s) { return false; }     // false if 8 states are already on the stack
    bool pop() { return false; }                    // false if empty
    bool replace(std::uint8_t s) { return false; }  // false if empty

private:
    void record(Kind k, std::uint8_t s) { log_.push_back({k, s}); }
    std::vector<std::uint8_t> stack_;
    std::vector<Event> log_;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool log_is(const StateStack& st, std::vector<Event> want) { auto& g = st.events(); if (g.size() != want.size()) return false; for (std::size_t i = 0; i < g.size(); ++i) if (g[i].kind != want[i].kind || g[i].state != want[i].state) return false; return true; }

int main() {
    { StateStack st; CHECK(st.push(1)); CHECK(st.push(2)); CHECK(st.top() == 2); CHECK(log_is(st, {{Kind::Enter, 1}, {Kind::Pause, 1}, {Kind::Enter, 2}})); }
    { StateStack st; st.push(1); st.push(2); CHECK(st.pop()); CHECK(st.top() == 1); CHECK(log_is(st, {{Kind::Enter, 1}, {Kind::Pause, 1}, {Kind::Enter, 2}, {Kind::Exit, 2}, {Kind::Unpause, 1}})); }
    { StateStack st; st.push(7); CHECK(st.pop()); CHECK(!st.top().has_value()); CHECK(log_is(st, {{Kind::Enter, 7}, {Kind::Exit, 7}})); CHECK(!st.pop()); }
    { StateStack st; st.push(1); CHECK(st.replace(3)); CHECK(st.top() == 3); CHECK(log_is(st, {{Kind::Enter, 1}, {Kind::Exit, 1}, {Kind::Enter, 3}})); StateStack e; CHECK(!e.replace(1)); }
    { StateStack st; for (int i = 0; i < 8; ++i) CHECK(st.push(static_cast<std::uint8_t>(i))); auto before = st.events().size(); CHECK(!st.push(99)); CHECK(st.events().size() == before); CHECK(st.top() == 7); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
