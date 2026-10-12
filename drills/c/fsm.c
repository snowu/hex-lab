// A state machine you cannot misuse
// Run: cc -std=c17 -Wall fsm.c -lm -o fsm && ./fsm

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
typedef enum{IDLE,RUNNING,AIR}State;typedef enum{RUN,STOP,JUMP,LAND,WAIT}Event;bool transition(State s,Event e,State*out){ /* TODO: implement this function. */ abort(); }typedef struct{State state;unsigned enters;}Machine;bool send(Machine*m,Event e){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { Machine m={IDLE,0};assert(send(&m,RUN)&&m.state==RUNNING);assert(!send(&m,LAND));assert(send(&m,JUMP)&&m.state==AIR);assert(send(&m,LAND));assert(m.enters==3);assert(send(&m,WAIT)&&m.enters==3); return 0; }
