// Bytecode: a tiny stack virtual machine
// Run: cc -std=c17 -Wall stack_vm.c -lm -o stack_vm && ./stack_vm

#include <assert.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* program is borrowed for this call. The VM owns a 16-value stack on the
   call stack; no allocation. Result carries either a value or an explicit error.
   Arithmetic values are signed 32-bit; overflow is reported explicitly. */
typedef enum { PUSH, ADD, SUB, MUL, DIV, DUP, SWAP, JZ, JMP, HALT } OpKind;
typedef struct {
    OpKind kind;
    int32_t arg;
} Op;
typedef enum {
    VM_OK,
    STACK_UNDERFLOW,
    STACK_OVERFLOW,
    DIVIDE_BY_ZERO,
    BAD_JUMP,
    STEP_LIMIT,
    NO_HALT,
    ARITHMETIC_OVERFLOW
} VmError;
typedef struct {
    VmError err;
    int32_t value;
} Result;
static Result vm_error(VmError err) {
    (void)err;
    abort(); /* TODO: implement vm_error */
}
Result run(const Op *program, size_t length, size_t max_steps) {
    (void)program;
    (void)length;
    (void)max_steps;
    abort(); /* TODO: implement run */
}

// ---- tests: do not edit below this line ----
#include <assert.h>

#define RUN(limit, ...)                                                                \
    run((Op[]){__VA_ARGS__}, sizeof((Op[]){__VA_ARGS__}) / sizeof(Op), limit)
static void value_is(Result r, int32_t expected) {
    assert(r.err == VM_OK && r.value == expected);
}
int main(void) {
    value_is(RUN(100, {PUSH, 2}, {PUSH, 3}, {ADD, 0}, {PUSH, 4}, {MUL, 0}, {HALT, 0}),
             20);
    value_is(RUN(10, {PUSH, 10}, {PUSH, 3}, {SUB, 0}, {HALT, 0}), 7);
    value_is(RUN(10, {PUSH, -7}, {PUSH, 2}, {DIV, 0}, {HALT, 0}), -3);
    value_is(RUN(10, {PUSH, 5}, {DUP, 0}, {MUL, 0}, {HALT, 0}), 25);
    value_is(RUN(10, {PUSH, 1}, {PUSH, 2}, {SWAP, 0}, {PUSH, 10}, {MUL, 0}, {HALT, 0}),
             10);
    value_is(RUN(1000, {PUSH, 5}, {DUP, 0}, {JZ, 6}, {PUSH, 1}, {SUB, 0}, {JMP, 1},
                 {HALT, 0}),
             0);
    assert(RUN(50, {JMP, 0}).err == STEP_LIMIT);
    assert(RUN(10, {PUSH, 1}, {ADD, 0}, {HALT, 0}).err == STACK_UNDERFLOW);
    assert(RUN(10, {HALT, 0}).err == STACK_UNDERFLOW);
    assert(RUN(10, {DUP, 0}).err == STACK_UNDERFLOW);
    Op many[17];
    for (int i = 0; i < 17; i++)
        many[i] = (Op){PUSH, 1};
    assert(run(many, 17, 100).err == STACK_OVERFLOW);
    assert(RUN(10, {PUSH, 1}, {PUSH, 0}, {DIV, 0}, {HALT, 0}).err == DIVIDE_BY_ZERO);
    assert(RUN(10, {JMP, 5}, {HALT, 0}).err == BAD_JUMP);
    assert(RUN(10, {PUSH, 1}).err == NO_HALT);
    assert(RUN(1, {JMP, -1}).err == BAD_JUMP);
    assert(RUN(10, {PUSH, 1}, {JZ, 99}, {HALT, 0}).err == STACK_UNDERFLOW);
    return 0;
}
