// Pushdown automaton: a stack of states
// Run: cc -std=c17 -Wall state_stack.c -lm -o state_stack && ./state_stack

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* Initialize with {0}. All eight states and 64 events are owned inline.
   Failed operations (empty/full stack or full event buffer) are atomic.
   events returns a borrowed view invalidated by subsequent stack mutations. */
typedef enum { ENTER, EXIT, PAUSE, UNPAUSE } Kind;
typedef struct {
    Kind kind;
    uint8_t state;
} Event;
typedef struct {
    uint8_t stack[8];
    size_t depth;
    Event log[64];
    size_t log_len;
} StateStack;
static void state_record(StateStack *s, Kind kind, uint8_t state) {
    (void)s;
    (void)kind;
    (void)state;
    abort(); /* TODO: implement state_record */
}
bool state_top(const StateStack *s, uint8_t *out) {
    (void)s;
    (void)out;
    abort(); /* TODO: implement state_top */
}
const Event *state_events(const StateStack *s, size_t *count) {
    *count = s->log_len;
    return s->log;
}
bool state_push(StateStack *s, uint8_t state) {
    (void)s;
    (void)state;
    abort(); /* TODO: implement state_push */
}
bool state_pop(StateStack *s) {
    (void)s;
    abort(); /* TODO: implement state_pop */
}
bool state_replace(StateStack *s, uint8_t state) {
    (void)s;
    (void)state;
    abort(); /* TODO: implement state_replace */
}

// ---- tests: do not edit below this line ----
#include <assert.h>

static void log_is(const StateStack *s, const Event *expected, size_t count) {
    size_t n;
    const Event *events = state_events(s, &n);
    assert(n == count);
    for (size_t i = 0; i < n; i++) {
        assert(events[i].kind == expected[i].kind);
        assert(events[i].state == expected[i].state);
    }
}
int main(void) {
    StateStack s = {0};
    uint8_t top;
    assert(!state_top(&s, &top));
    assert(state_push(&s, 1) && state_push(&s, 2));
    assert(state_top(&s, &top) && top == 2);
    log_is(&s, (Event[]){{ENTER, 1}, {PAUSE, 1}, {ENTER, 2}}, 3);
    assert(state_pop(&s) && state_top(&s, &top) && top == 1);
    log_is(&s, (Event[]){{ENTER, 1}, {PAUSE, 1}, {ENTER, 2}, {EXIT, 2}, {UNPAUSE, 1}},
           5);
    s = (StateStack){0};
    state_push(&s, 7);
    assert(state_pop(&s) && !state_top(&s, &top));
    log_is(&s, (Event[]){{ENTER, 7}, {EXIT, 7}}, 2);
    assert(!state_pop(&s));
    s = (StateStack){0};
    assert(!state_replace(&s, 1));
    state_push(&s, 1);
    assert(state_replace(&s, 3) && state_top(&s, &top) && top == 3);
    log_is(&s, (Event[]){{ENTER, 1}, {EXIT, 1}, {ENTER, 3}}, 3);
    s = (StateStack){0};
    for (uint8_t i = 0; i < 8; i++)
        assert(state_push(&s, i));
    size_t before = s.log_len;
    assert(!state_push(&s, 99) && s.log_len == before && state_top(&s, &top) &&
           top == 7);
    return 0;
}
