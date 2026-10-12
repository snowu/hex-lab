// Coyote time and jump buffering
// Run: cc -std=c17 -Wall jumper.c -lm -o jumper && ./jumper

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
typedef struct {
    int coyote, buffer, left, pressed;
    bool has_left, has_press;
} Jumper;
void leave_ground(Jumper *j, int t) { /* TODO: implement this function. */ abort(); }
bool press(Jumper *j, int t, bool grounded) { /* TODO: implement this function. */
    abort();
}
bool land(Jumper *j, int t) { /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) {
    Jumper j = {.coyote = 100, .buffer = 100};
    leave_ground(&j, 1000);
    assert(press(&j, 1060, false));
    assert(!press(&j, 1070, false));
    assert(land(&j, 1100));
    assert(!land(&j, 1110));
    leave_ground(&j, 2000);
    assert(!press(&j, 2101, false));
    assert(!land(&j, 2300));
    return 0;
}
