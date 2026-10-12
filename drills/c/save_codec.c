// A versioned binary save format
// Run: cc -std=c17 -Wall save_codec.c -lm -o save_codec && ./save_codec

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
typedef struct{uint32_t coins;uint16_t level;}Save;uint8_t checksum(const uint8_t*p,size_t n){ /* TODO: implement this function. */ abort(); }void encode(Save s,uint8_t*out){ /* TODO: implement this function. */ abort(); }bool decode(const uint8_t*b,size_t n,Save*out){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { uint8_t b[9];encode((Save){0x01020304,0x0506},b);uint8_t expected[]={0x53,2,4,3,2,1,6,5,0x6A};assert(memcmp(b,expected,9)==0);Save out;assert(decode(b,9,&out)&&out.coins==0x01020304&&out.level==0x0506);b[8]^=1;assert(!decode(b,9,&out));uint8_t v1[]={0x53,1,0x2C,1,7,0x88};assert(decode(v1,6,&out)&&out.coins==300&&out.level==7);assert(!decode(NULL,0,&out)); return 0; }
