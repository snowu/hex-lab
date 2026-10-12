// Spatial hash grid for neighbour queries
// Run: cc -std=c17 -Wall spatial_hash.c -lm -o spatial_hash && ./spatial_hash

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* Caller owns this fixed-capacity grid and query output. No allocation.
   Insert returns SIZE_MAX when 64 entities are stored. Query writes at most
   capacity ids, returns the number written, and never emits duplicates.
   Cell size must be positive; finite coordinates/cell quotients fit int32_t. */
enum { SPATIAL_MAX = 64, SPATIAL_BUCKETS = 4 };
typedef struct {
    float cell, xs[SPATIAL_MAX], ys[SPATIAL_MAX];
    int heads[SPATIAL_BUCKETS], next[SPATIAL_MAX];
    size_t n;
} SpatialHash;
static int32_t spatial_cell(const SpatialHash *h, float v) {
    (void)h;
    (void)v;
    abort(); /* TODO: implement spatial_cell */
}
static size_t spatial_bucket(int32_t x, int32_t y) {
    (void)x;
    (void)y;
    abort(); /* TODO: implement spatial_bucket */
}
void spatial_clear(SpatialHash *h) {
    (void)h;
    abort(); /* TODO: implement spatial_clear */
}
SpatialHash spatial_init(float cell) {
    (void)cell;
    abort(); /* TODO: implement spatial_init */
}
size_t spatial_insert(SpatialHash *h, float x, float y) {
    (void)h;
    (void)x;
    (void)y;
    abort(); /* TODO: implement spatial_insert */
}
size_t spatial_query(const SpatialHash *h, float x, float y, float radius,
                     uint32_t *out, size_t capacity) {
    (void)h;
    (void)x;
    (void)y;
    (void)radius;
    (void)out;
    (void)capacity;
    abort(); /* TODO: implement spatial_query */
}

// ---- tests: do not edit below this line ----
#include <assert.h>

static int compare_id(const void *x, const void *y) {
    uint32_t a = *(const uint32_t *)x, b = *(const uint32_t *)y;
    return (a > b) - (a < b);
}
static void near(const SpatialHash *h, float x, float y, float r,
                 const uint32_t *expected, size_t count) {
    uint32_t ids[64];
    size_t n = spatial_query(h, x, y, r, ids, 64);
    qsort(ids, n, sizeof(*ids), compare_id);
    assert(n == count);
    for (size_t i = 0; i < n; i++)
        assert(ids[i] == expected[i]);
}
int main(void) {
    SpatialHash h = spatial_init(10);
    spatial_insert(&h, 1, 1);
    spatial_insert(&h, 5, 5);
    spatial_insert(&h, 50, 50);
    near(&h, 0, 0, 8, (uint32_t[]){0, 1}, 2);
    h = spatial_init(10);
    spatial_insert(&h, 9, 9);
    near(&h, 0, 0, 5, NULL, 0);
    near(&h, 0, 0, 13, (uint32_t[]){0}, 1);
    h = spatial_init(10);
    spatial_insert(&h, -1, -1);
    spatial_insert(&h, 1, 1);
    spatial_insert(&h, -10, 0);
    near(&h, 0, 0, 2, (uint32_t[]){0, 1}, 2);
    near(&h, 0, 0, 10, (uint32_t[]){0, 1, 2}, 3);
    h = spatial_init(2);
    for (int i = 0; i < 20; i++)
        spatial_insert(&h, (float)i, 0);
    near(&h, 10, 0, 3, (uint32_t[]){7, 8, 9, 10, 11, 12, 13}, 7);
    h = spatial_init(1);
    for (int i = 0; i < 30; i++)
        spatial_insert(&h, (float)i, (float)i);
    uint32_t ids[64];
    size_t n = spatial_query(&h, 15, 15, 40, ids, 64);
    assert(n == 30);
    qsort(ids, n, sizeof(*ids), compare_id);
    for (size_t i = 0; i < n; i++)
        assert(ids[i] == i);
    assert(spatial_query(&h, 15, 15, 40, ids, 2) == 2);
    spatial_clear(&h);
    near(&h, 0, 0, 5, NULL, 0);
    assert(spatial_insert(&h, 3, 3) == 0);
    near(&h, 0, 0, 5, (uint32_t[]){0}, 1);
    return 0;
}
