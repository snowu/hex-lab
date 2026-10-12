// Client-side prediction and reconciliation
// Run: cc -std=c17 -Wall net_reconcile.c -lm -o net_reconcile && ./net_reconcile

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
typedef struct{uint32_t seq;int dx;}Input;int reconcile(int pos,uint32_t ack,const Input*p,size_t n){ /* TODO: implement this function. */ abort(); }size_t drop_acked(const Input*p,size_t n,uint32_t ack){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { Input p[]={{5,1},{6,1},{7,1},{8,2},{9,-1}};assert(reconcile(100,7,p,5)==101);assert(reconcile(100,9,p,5)==100);assert(reconcile(100,0,p,5)==104);assert(drop_acked(p,5,7)==3);assert(drop_acked(NULL,0,3)==0); return 0; }
