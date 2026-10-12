// Autotile bitmask
// Run: cc -std=c17 -Wall autotile.c -lm -o autotile && ./autotile

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
bool solid(const char*const*g,int h,int w,int row,int col){ /* TODO: implement this function. */ abort(); }unsigned bitmask(const char*const*g,int h,int w,int row,int col){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { const char*g[]={".#.","#.#",".#."};assert(bitmask(g,3,3,1,1)==15);const char*e[]={"...","...","..."};assert(bitmask(e,3,3,1,1)==0);assert(bitmask(e,3,3,0,0)==9); return 0; }
