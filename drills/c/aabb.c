// AABB overlap and push-out
// Run: cc -std=c17 -Wall aabb.c -lm -o aabb && ./aabb

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef struct {
    double x, y, w, h;
} Rect;
typedef struct {
    double x, y;
} Vec2;
bool overlaps(Rect a, Rect b) { /* TODO: implement this function. */ abort(); }
Vec2 push_out(Rect a, Rect b) { /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) {
    assert(!overlaps((Rect){0, 0, 10, 10}, (Rect){10, 0, 10, 10}));
    Vec2 v = push_out((Rect){8, 0, 10, 10}, (Rect){0, 0, 10, 10});
    assert(v.x == 2 && v.y == 0);
    assert(!overlaps((Rect){10, 0, 10, 10}, (Rect){0, 0, 10, 10}));
    return 0;
}
