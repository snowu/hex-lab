// Snap an image to a palette
// Run: cc -std=c17 -Wall quantize.c -lm -o quantize && ./quantize

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
typedef struct{int r,g,b;}Rgb;size_t nearest_index(Rgb color,const Rgb*palette,size_t n){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { Rgb p[]={{0,0,0},{255,255,255},{255,0,0}};assert(nearest_index((Rgb){250,5,5},p,3)==2);assert(nearest_index((Rgb){128,128,128},p,2)==1);Rgb tie[]={{0,0,0},{2,0,0}};assert(nearest_index((Rgb){1,0,0},tie,2)==0); return 0; }
