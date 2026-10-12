// Cave generation: one smoothing step
// Run: cc -std=c17 -Wall ca_smooth.c -lm -o ca_smooth && ./ca_smooth

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
void smooth(const char *const *grid, int h, int w,
            char *out) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    const char *g[] = {"...", "...", "..."};
    char out[9];
    smooth(g, 3, 3, out);
    assert(memcmp(out, "#.#...#.#", 9) == 0);
    const char *s[] = {"."};
    smooth(s, 1, 1, out);
    assert(out[0] == '#');
    smooth(NULL, 0, 0, NULL);
    return 0;
}
