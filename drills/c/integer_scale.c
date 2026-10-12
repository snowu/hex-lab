// Pixel-perfect integer scaling
// Run: cc -std=c17 -Wall integer_scale.c -lm -o integer_scale && ./integer_scale

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
typedef struct{int scale,off_x,off_y;}Fit;int floor_div(int a,int b){ /* TODO: implement this function. */ abort(); }Fit integer_scale(int w,int h,int bw,int bh){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { Fit f=integer_scale(1920,1080,320,180);assert(f.scale==6&&f.off_x==0&&f.off_y==0);f=integer_scale(1000,700,320,180);assert(f.scale==3&&f.off_x==20&&f.off_y==80);f=integer_scale(201,100,320,180);assert(f.scale==1&&f.off_x==-60&&f.off_y==-40); return 0; }
