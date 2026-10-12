// Command pattern: undo and redo
// Run: cc -std=c17 -Wall command_undo.c -lm -o command_undo && ./command_undo

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* All commands and eight cells are owned by History. Initialize with {0}.
   Each stack holds four commands; overflow forgets its oldest command. */
typedef struct {
    size_t index;
    int32_t value, prev;
} Command;
typedef struct {
    int32_t cells[8];
    Command undo_buf[4], redo_buf[4];
    size_t undo_len, redo_len;
} History;
static void command_push(Command buf[4], size_t *length, Command command) {
    (void)buf;
    (void)length;
    (void)command;
    abort(); /* TODO: implement command_push */
}
void history_exec(History *h, size_t index, int32_t value) {
    (void)h;
    (void)index;
    (void)value;
    abort(); /* TODO: implement history_exec */
}
bool history_undo(History *h) {
    (void)h;
    abort(); /* TODO: implement history_undo */
}
bool history_redo(History *h) {
    (void)h;
    abort(); /* TODO: implement history_redo */
}

// ---- tests: do not edit below this line ----
#include <assert.h>

int main(void) {
    History h = {0};
    assert(!history_undo(&h));
    assert(!history_redo(&h));
    history_exec(&h, 0, 5);
    history_exec(&h, 0, 9);
    assert(h.cells[0] == 9);
    assert(history_undo(&h) && h.cells[0] == 5);
    assert(history_undo(&h) && h.cells[0] == 0);
    assert(!history_undo(&h));
    assert(history_redo(&h) && h.cells[0] == 5);
    assert(history_redo(&h) && h.cells[0] == 9);
    assert(!history_redo(&h));
    h = (History){0};
    history_exec(&h, 1, 1);
    history_exec(&h, 1, 2);
    history_undo(&h);
    history_exec(&h, 1, 3);
    assert(!history_redo(&h) && h.cells[1] == 3);
    h = (History){0};
    for (int i = 1; i <= 5; i++)
        history_exec(&h, 0, i);
    int count = 0;
    while (history_undo(&h))
        count++;
    assert(count == 4 && h.cells[0] == 1);
    h = (History){0};
    history_exec(&h, 8, 1);
    assert(!history_undo(&h));
    history_exec(&h, 2, 7);
    history_exec(&h, 3, 8);
    history_undo(&h);
    assert(h.cells[2] == 7 && h.cells[3] == 0);
    history_exec(&h, 8, 9);
    assert(history_redo(&h) && h.cells[3] == 8);
    return 0;
}
