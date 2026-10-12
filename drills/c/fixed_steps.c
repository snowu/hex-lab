// Fixed timestep with an accumulator
// Run: cc -std=c17 -Wall fixed_steps.c -lm -o fixed_steps && ./fixed_steps

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
void fixed_steps(const unsigned *frames,size_t n,unsigned step,unsigned cap,unsigned *out){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { unsigned f[]={16,16,16},out[3];fixed_steps(f,3,10,5,out);assert(out[0]==1&&out[1]==2&&out[2]==1);unsigned lag[]={100,9,1};fixed_steps(lag,3,10,5,out);assert(out[0]==5&&out[1]==0&&out[2]==1);fixed_steps(NULL,0,10,5,NULL); return 0; }
