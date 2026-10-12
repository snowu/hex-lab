// Object pool with an O(1) free list
// Run: cc -std=c17 -Wall free_list_pool.c -lm -o free_list_pool && ./free_list_pool

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
enum{CAPACITY=8};typedef struct{int values[CAPACITY];size_t next[CAPACITY],head,free_count;bool live[CAPACITY];}Pool;void pool_init(Pool*p){ /* TODO: implement this function. */ abort(); }int*acquire(Pool*p){ /* TODO: implement this function. */ abort(); }bool release(Pool*p,int*value){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { Pool p;pool_init(&p);int*slots[8];for(size_t i=0;i<8;i++){slots[i]=acquire(&p);assert(slots[i]);}assert(!acquire(&p)&&p.free_count==0);assert(release(&p,slots[3]));assert(!release(&p,slots[3]));assert(acquire(&p)==slots[3]);int foreign;assert(!release(&p,&foreign)); return 0; }
