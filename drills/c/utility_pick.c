// Utility AI: scoring and not flip-flopping
// Run: cc -std=c17 -Wall utility_pick.c -lm -o utility_pick && ./utility_pick

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
double score(const double *c, size_t n) { /* TODO: implement this function. */
    abort();
}
bool pick(const double *s, size_t n, int current, double inertia,
          size_t *out) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    double c[] = {.5, 2, -1};
    assert(score(c, 2) == .5 && score(c, 3) == 0);
    assert(score(NULL, 0) == 1);
    double s[] = {.5, .6};
    size_t out;
    assert(pick(s, 2, 0, .2, &out) && out == 0);
    assert(pick(s, 2, -1, 0, &out) && out == 1);
    assert(!pick(NULL, 0, -1, 0, &out));
    return 0;
}
