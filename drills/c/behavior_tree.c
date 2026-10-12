// A behaviour tree tick
// Run: cc -std=c17 -Wall behavior_tree.c -lm -o behavior_tree && ./behavior_tree

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef enum { SUCCESS, FAILURE, RUNNING } Status;
typedef enum { LEAF, SEQUENCE, SELECTOR, INVERTER } Kind;
typedef struct {
    Kind kind;
    size_t a, b;
} Node;
Status tick(const Node *nodes, const size_t *kids, const Status *results,
            size_t root) { /* TODO: implement this function. */
    abort();
}
// ---- tests: do not edit below this line ----
int main(void) {
    Node nodes[] = {{LEAF, 0, 0},
                    {LEAF, 1, 0},
                    {SEQUENCE, 0, 2},
                    {SELECTOR, 0, 2},
                    {INVERTER, 0, 0}};
    size_t kids[] = {0, 1};
    Status results[] = {SUCCESS, RUNNING};
    assert(tick(nodes, kids, results, 2) == RUNNING);
    assert(tick(nodes, kids, results, 3) == SUCCESS);
    assert(tick(nodes, kids, results, 4) == FAILURE);
    results[0] = FAILURE;
    assert(tick(nodes, kids, results, 2) == FAILURE);
    assert(tick(nodes, kids, results, 3) == RUNNING);
    return 0;
}
