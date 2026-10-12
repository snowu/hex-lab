// Acceleration with a speed cap
// Run: cc -std=c17 -Wall accel_clamp.c -lm -o accel_clamp && ./accel_clamp

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef struct {
    double x, y;
} Vec2;
Vec2 accelerate(Vec2 v, Vec2 a, double dt,
                double max) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    Vec2 o = accelerate((Vec2){0, 0}, (Vec2){3, 4}, 1, 2);
    assert(fabs(o.x - 1.2) < 1e-9 && fabs(o.y - 1.6) < 1e-9);
    o = accelerate((Vec2){2, 3}, (Vec2){0, 0}, 1, 10);
    assert(o.x == 2 && o.y == 3);
    o = accelerate((Vec2){0, 0}, (Vec2){0, 0}, 1, 0);
    assert(o.x == 0 && o.y == 0);
    return 0;
}
