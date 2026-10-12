// Sparse set: the heart of a fast ECS
// Run: cc -std=c17 -Wall sparse_set.c -lm -o sparse_set && ./sparse_set

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
enum{CAPACITY=8};typedef struct{unsigned ids[CAPACITY],sparse[CAPACITY];int values[CAPACITY];size_t n;}SparseSet;bool has(const SparseSet*s,unsigned id){ /* TODO: implement this function. */ abort(); }bool insert(SparseSet*s,unsigned id,int value){ /* TODO: implement this function. */ abort(); }bool get(const SparseSet*s,unsigned id,int*out){ /* TODO: implement this function. */ abort(); }bool remove_id(SparseSet*s,unsigned id){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { SparseSet s={0};int v;assert(!has(&s,1));assert(insert(&s,1,10)&&insert(&s,3,20));assert(get(&s,3,&v)&&v==20);assert(insert(&s,1,11)&&s.n==2);assert(remove_id(&s,1));assert(!has(&s,1)&&get(&s,3,&v)&&v==20);assert(!remove_id(&s,1));assert(!insert(&s,8,5));assert(insert(&s,1,12)); return 0; }
