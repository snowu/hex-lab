// A state machine you cannot misuse
// Run: g++ -std=c++20 -Wall -o fsm fsm.cpp && ./fsm

#include <optional>

enum class State { Idle, Running, Air };
enum class Event { Run, Stop, Jump, Land, Wait };

std::optional<State> transition(State s, Event e) {
    return std::nullopt;
}

struct Machine {
    State state = State::Idle;
    int enter_count = 0;
    // true if the event was valid. enter_count only grows when the state changes.
    bool send(Event e) { return false; }
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    CHECK(transition(State::Idle, Event::Run) == State::Running);
    CHECK(transition(State::Running, Event::Jump) == State::Air);
    CHECK(transition(State::Air, Event::Land) == State::Idle);
    CHECK(!transition(State::Air, Event::Run).has_value());
    CHECK(!transition(State::Running, Event::Land).has_value());
    { Machine m; CHECK(m.send(Event::Run)); CHECK(m.state == State::Running); CHECK(!m.send(Event::Land)); CHECK(m.state == State::Running); }
    { Machine m; m.send(Event::Jump); m.send(Event::Land); CHECK(m.enter_count == 2);
      CHECK(m.send(Event::Wait)); CHECK(m.enter_count == 2); m.send(Event::Stop); CHECK(m.enter_count == 2); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
