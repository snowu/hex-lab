// Frame-rate independent smoothing
// Run: cc -std=c17 -Wall damp.c -lm -o damp && ./damp

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
double damp(double current, double target, double k,
            double dt) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    assert(damp(0, 100, 0, 1) == 0);
    double half = damp(0, 100, 2, .5);
    assert(fabs(half - 63.212055882855765) < 1e-9);
    assert(fabs(damp(damp(0, 100, 2, .25), 100, 2, .25) - half) < 1e-9);
    return 0;
}
