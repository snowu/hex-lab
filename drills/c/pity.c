// Drop rates with a pity timer
// Run: cc -std=c17 -Wall pity.c -lm -o pity && ./pity

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
void simulate_pity(const double*rolls,size_t n,double probability,unsigned pity,bool*out){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { double rolls[]={.9,.9,.9,.1,.9};bool out[5];simulate_pity(rolls,5,.2,3,out);assert(!out[0]&&!out[1]&&out[2]&&out[3]&&!out[4]);simulate_pity(NULL,0,.2,3,NULL); return 0; }
