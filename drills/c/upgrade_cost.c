// Exponential upgrade costs
// Run: cc -std=c17 -Wall upgrade_cost.c -lm -o upgrade_cost && ./upgrade_cost

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
uint64_t upgrade_cost(uint64_t base, double growth,
                      unsigned level) { /* TODO: implement this function. */
    abort();
}
unsigned levels_affordable(uint64_t coins, uint64_t base, double growth, unsigned start,
                           unsigned cap) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    assert(upgrade_cost(100, 1.5, 2) == 225);
    assert(levels_affordable(475, 100, 1.5, 0, 10) == 3);
    assert(levels_affordable(99, 100, 1.5, 0, 10) == 0);
    assert(levels_affordable(999, 0, 1.5, 0, 5) == 5);
    return 0;
}
