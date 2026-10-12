// Snapshot interpolation for remote players
// Run: cc -std=c17 -Wall snapshot_interp.c -lm -o snapshot_interp && ./snapshot_interp

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef struct {
    double t, x;
} Snapshot;
bool interpolate(const Snapshot *s, size_t n, double t,
                 double *out) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    Snapshot s[] = {{1, 10}, {1.1, 20}, {1.3, 60}};
    double v;
    assert(interpolate(s, 3, 1.05, &v) && fabs(v - 15) < 1e-9);
    assert(interpolate(s, 3, 1.2, &v) && fabs(v - 40) < 1e-9);
    assert(interpolate(s, 3, 9, &v) && v == 60);
    assert(!interpolate(NULL, 0, 1, &v));
    return 0;
}
