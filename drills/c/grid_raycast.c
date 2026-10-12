// Raycast on a grid (DDA)
// Run: cc -std=c17 -Wall grid_raycast.c -lm -o grid_raycast && ./grid_raycast

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* grid borrows height NUL-terminated rows of equal width. out is caller-owned
   and written only on a hit. Direction and origin must be finite, max_dist>=0.
   Exact corner ties follow the original drill: step y, then x at the same t. */
typedef struct {
    size_t col, row;
    double dist;
} Hit;
bool raycast(const char *const *grid, size_t height, double ox, double oy, double dx,
             double dy, double max_dist, Hit *out) {
    (void)grid;
    (void)height;
    (void)ox;
    (void)oy;
    (void)dx;
    (void)dy;
    (void)max_dist;
    (void)out;
    abort(); /* TODO: implement raycast */
}

// ---- tests: do not edit below this line ----
#include <assert.h>

static const char *const G[] = {".....", "..#..", ".....", "....#", "....."};
static void hit_is(double ox, double oy, double dx, double dy, size_t x, size_t y,
                   double distance) {
    Hit hit;
    assert(raycast(G, 5, ox, oy, dx, dy, 10, &hit));
    assert(hit.col == x && hit.row == y && fabs(hit.dist - distance) < 1e-9);
}
int main(void) {
    Hit hit;
    hit_is(0.5, 1.5, 1, 0, 2, 1, 1.5);
    hit_is(0.5, 3.5, 1, 0, 4, 3, 3.5);
    hit_is(2.5, 4.5, 0, -1, 2, 1, 2.5);
    hit_is(0.5, 0.5, 2, 1, 2, 1, 1.6770509831248424);
    hit_is(0.2, 0.3, 3, 2, 2, 1, 2.1633307652783937);
    assert(!raycast(G, 5, 4.5, 0.5, -1, 0, 10, &hit));
    assert(!raycast(G, 5, 0.5, 0.5, -1, 0, 10, &hit));
    assert(!raycast(G, 5, 0.5, 1.5, 1, 0, 1, &hit));
    assert(raycast(G, 5, 0.5, 1.5, 1, 0, 1.6, &hit));
    hit_is(2.5, 1.5, 1, 0, 2, 1, 0);
    assert(!raycast(G, 5, -1.5, 0.5, 1, 0, 10, &hit));
    assert(!raycast(G, 5, 0.5, 0.5, 0, 0, 10, &hit));
    assert(!raycast(NULL, 0, 0.5, 0.5, 1, 0, 10, &hit));
    return 0;
}
