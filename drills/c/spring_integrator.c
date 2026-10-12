// Integrators: why the order of two lines matters
// Run: cc -std=c17 -Wall spring_integrator.c -lm -o spring_integrator && ./spring_integrator

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef struct {
    double x, v;
} State;
State semi_implicit(State s, double k, double dt) { /* TODO: implement this function. */
    abort();
}
State velocity_verlet(State s, double k,
                      double dt) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    State a = semi_implicit((State){1, 0}, 4, .1);
    assert(fabs(a.x - .96) < 1e-9 && fabs(a.v + .4) < 1e-9);
    State b = velocity_verlet((State){1, 0}, 4, .1);
    assert(fabs(b.x - .98) < 1e-9 && fabs(b.v + .396) < 1e-9);
    return 0;
}
