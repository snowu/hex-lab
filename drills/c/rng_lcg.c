// A seeded random number generator
// Run: cc -std=c17 -Wall rng_lcg.c -lm -o rng_lcg && ./rng_lcg

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef struct {
    uint64_t state;
} Rng;
uint64_t rng_step(Rng *r) { /* TODO: implement this function. */ abort(); }
unsigned next_int(Rng *r, unsigned n) { /* TODO: implement this function. */ abort(); }
double next_float(Rng *r) { /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) {
    Rng r = {42};
    unsigned e[] = {81, 33, 69, 61, 56, 93};
    for (size_t i = 0; i < 6; i++)
        assert(next_int(&r, 100) == e[i]);
    Rng f = {7};
    assert(fabs(next_float(&f) - .5970560554414988) < 1e-12);
    assert(fabs(next_float(&f) - .29926483193412423) < 1e-12);
    return 0;
}
