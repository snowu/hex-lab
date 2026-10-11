// Integrators: why the order of two lines matters
// Run: g++ -std=c++20 -Wall -o spring_integrator spring_integrator.cpp && ./spring_integrator

struct State { double x, v; };

// Spring with unit mass: acceleration = -k * x.
// The starter is explicit Euler, which gains energy every step. Fix both functions.
State semi_implicit(State s, double k, double dt) {
    double a = -k * s.x;
    return {s.x + s.v * dt, s.v + a * dt};
}

State velocity_verlet(State s, double k, double dt) {
    double a = -k * s.x;
    return {s.x + s.v * dt, s.v + a * dt};
}

// ---- tests: do not edit below this line ----
#include <algorithm>
#include <cmath>
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using Step = State (*)(State, double, double);

static double max_drift(Step f, double k, double dt, int steps) {
    State s{1.0, 0.0}; double e0 = 0.5 * s.v * s.v + 0.5 * k * s.x * s.x, worst = 0;
    for (int i = 0; i < steps; ++i) { s = f(s, k, dt); double e = 0.5 * s.v * s.v + 0.5 * k * s.x * s.x; worst = std::max(worst, std::fabs(e / e0 - 1.0)); }
    return worst;
}
static double pos_err(Step f) { State s{1.0, 0.0}; for (int i = 0; i < 157; ++i) s = f(s, 1.0, 0.01); return std::fabs(s.x - std::cos(157 * 0.01)); }

int main() {
    State a = semi_implicit({1, 0}, 4, 0.1); CHECK(std::fabs(a.x - 0.96) < 1e-12); CHECK(std::fabs(a.v + 0.4) < 1e-12);
    State b = velocity_verlet({1, 0}, 4, 0.1); CHECK(std::fabs(b.x - 0.98) < 1e-12); CHECK(std::fabs(b.v + 0.396) < 1e-12);
    CHECK(max_drift(semi_implicit, 4, 0.01, 10000) < 0.02);
    CHECK(max_drift(velocity_verlet, 4, 0.01, 10000) < 0.001);
    CHECK(pos_err(semi_implicit) < 0.01);
    CHECK(pos_err(velocity_verlet) < 0.0001);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
