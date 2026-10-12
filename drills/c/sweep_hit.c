// Swept collision time (no tunneling)
// Run: cc -std=c17 -Wall sweep_hit.c -lm -o sweep_hit && ./sweep_hit

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
bool sweep_hit(double pos,double size,double dist,double wall,double*out){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { double t;assert(sweep_hit(0,2,20,12,&t)&&t==.5);assert(!sweep_hit(0,2,5,12,&t));assert(!sweep_hit(0,2,-20,12,&t));assert(!sweep_hit(10,5,20,12,&t)); return 0; }
