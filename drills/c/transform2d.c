// 2D transforms: matrices and the order of operations
// Run: cc -std=c17 -Wall transform2d.c -lm -o transform2d && ./transform2d

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
typedef struct{double a,b,c,d,tx,ty;}Mat;typedef struct{double x,y;}Point;Mat translate(double x,double y){ /* TODO: implement this function. */ abort(); }Mat rotate(double rad){ /* TODO: implement this function. */ abort(); }Mat scale(double x,double y){ /* TODO: implement this function. */ abort(); }Mat mul(Mat p,Mat c){ /* TODO: implement this function. */ abort(); }Point apply(Mat m,Point p){ /* TODO: implement this function. */ abort(); }bool inverse(Mat m,Mat*out){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { Mat m=mul(translate(3,4),scale(2,3));Point p=apply(m,(Point){1,2});assert(p.x==5&&p.y==10);Mat inv;assert(inverse(m,&inv));p=apply(inv,p);assert(fabs(p.x-1)<1e-9&&fabs(p.y-2)<1e-9);assert(!inverse(scale(0,1),&inv));p=apply(rotate(acos(-1)/2),(Point){1,0});assert(fabs(p.x)<1e-9&&fabs(p.y-1)<1e-9); return 0; }
