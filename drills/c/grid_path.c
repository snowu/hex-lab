// Shortest path on a tile map
// Run: cc -std=c17 -Wall grid_path.c -lm -o grid_path && ./grid_path

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
typedef struct{int row,col;}Cell;int shortest_path(const char*const*grid,int rows,int cols,Cell start,Cell goal){ /* TODO: implement this function. */ abort(); }
// ---- tests: do not edit below this line ----
int main(void) { const char*g[]={".#.","..."};assert(shortest_path(g,2,3,(Cell){0,0},(Cell){0,2})==4);assert(shortest_path(g,2,3,(Cell){0,0},(Cell){0,0})==0);assert(shortest_path(g,2,3,(Cell){0,1},(Cell){0,2})==-1);const char*w[]={".#."};assert(shortest_path(w,1,3,(Cell){0,0},(Cell){0,2})==-1); return 0; }
