// Event queue: a fixed-size ring buffer
// Run: cc -std=c17 -Wall event_queue.c -lm -o event_queue && ./event_queue

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
enum { CAPACITY = 8 };
typedef struct {
    int items[CAPACITY];
    size_t head, count;
} RingQueue;
bool queue_push(RingQueue *q, int v) { /* TODO: implement this function. */ abort(); }
bool queue_pop(RingQueue *q, int *out) { /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) {
    RingQueue q = {0};
    int v;
    assert(!queue_pop(&q, &v));
    for (int i = 0; i < 8; i++)
        assert(queue_push(&q, i));
    assert(!queue_push(&q, 9));
    for (int i = 0; i < 4; i++) {
        assert(queue_pop(&q, &v));
        assert(v == i);
    }
    for (int i = 8; i < 12; i++)
        assert(queue_push(&q, i));
    for (int i = 4; i < 12; i++) {
        assert(queue_pop(&q, &v));
        assert(v == i);
    }
    assert(!queue_pop(&q, &v));
    return 0;
}
