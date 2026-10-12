// Collision response with impulses
// Run: cc -std=c17 -Wall impulse_1d.c -lm -o impulse_1d && ./impulse_1d

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef struct {
    double v1, v2;
} Pair;
Pair collide(double m1, double v1, double m2, double v2,
             double e) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    Pair a = collide(1, 10, 1, 0, 1);
    assert(a.v1 == 0 && a.v2 == 10);
    a = collide(1, 10, 1, 0, 0);
    assert(a.v1 == 5 && a.v2 == 5);
    a = collide(1, -10, 1, 0, 1);
    assert(a.v1 == -10 && a.v2 == 0);
    return 0;
}
