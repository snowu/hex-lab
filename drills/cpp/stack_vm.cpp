// Bytecode: a tiny stack virtual machine
// Run: g++ -std=c++20 -Wall -o stack_vm stack_vm.cpp && ./stack_vm

#include <cstddef>
#include <vector>

enum class OpKind { Push, Add, Sub, Mul, Div, Dup, Swap, Jz, Jmp, Halt };
struct Op { OpKind kind; int arg = 0; };
enum class Err { None, StackUnderflow, StackOverflow, DivideByZero, BadJump, StepLimit, NoHalt };
struct Result { Err err; int value; };

// Run the program and return the value on top of the stack when it halts (or the error that stopped it).
Result run(const std::vector<Op>& program, std::size_t max_steps) {
    return {Err::NoHalt, 0};
}

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
using K = OpKind;
static bool is(Result r, int v) { return r.err == Err::None && r.value == v; }

int main() {
    CHECK(is(run({{K::Push, 2}, {K::Push, 3}, {K::Add}, {K::Push, 4}, {K::Mul}, {K::Halt}}, 100), 20));
    CHECK(is(run({{K::Push, 10}, {K::Push, 3}, {K::Sub}, {K::Halt}}, 10), 7));
    CHECK(is(run({{K::Push, -7}, {K::Push, 2}, {K::Div}, {K::Halt}}, 10), -3));
    CHECK(is(run({{K::Push, 5}, {K::Dup}, {K::Mul}, {K::Halt}}, 10), 25));
    CHECK(is(run({{K::Push, 1}, {K::Push, 2}, {K::Swap}, {K::Push, 10}, {K::Mul}, {K::Halt}}, 10), 10 * 1));
    CHECK(is(run({{K::Push, 5}, {K::Dup}, {K::Jz, 6}, {K::Push, 1}, {K::Sub}, {K::Jmp, 1}, {K::Halt}}, 1000), 0));
    CHECK(run({{K::Jmp, 0}}, 50).err == Err::StepLimit);
    CHECK(run({{K::Push, 1}, {K::Add}, {K::Halt}}, 10).err == Err::StackUnderflow);
    CHECK(run({{K::Halt}}, 10).err == Err::StackUnderflow);
    CHECK(run({{K::Dup}}, 10).err == Err::StackUnderflow);
    { std::vector<Op> many(17, Op{K::Push, 1}); CHECK(run(many, 100).err == Err::StackOverflow); }
    CHECK(run({{K::Push, 1}, {K::Push, 0}, {K::Div}, {K::Halt}}, 10).err == Err::DivideByZero);
    CHECK(run({{K::Jmp, 5}, {K::Halt}}, 10).err == Err::BadJump);
    CHECK(run({{K::Push, 1}}, 10).err == Err::NoHalt);
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
