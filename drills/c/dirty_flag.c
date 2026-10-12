// Dirty flag: lazy world transforms
// Run: cc -std=c17 -Wall dirty_flag.c -lm -o dirty_flag && ./dirty_flag

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
#include <limits.h>

/* Caller owns Scene, initialized with {0}. Capacity eight; parent -1 means root.
   Parents must already exist. add returns SIZE_MAX for invalid parent/full scene.
   Other operations require an existing node index. */
typedef struct { int parent[8];int32_t local[8],cache[8];bool dirty[8];size_t n;uint32_t recomputes; } Scene;
size_t scene_add(Scene *s, int parent, int32_t local) {
    (void)s;
    (void)parent;
    (void)local;
    abort(); /* TODO: implement scene_add */
}
void scene_set_local(Scene *s, size_t index, int32_t value) {
    (void)s;
    (void)index;
    (void)value;
    abort(); /* TODO: implement scene_set_local */
}
int32_t scene_world(Scene *s, size_t index) {
    (void)s;
    (void)index;
    abort(); /* TODO: implement scene_world */
}

// ---- tests: do not edit below this line ----
#include <assert.h>

static Scene chain(void){Scene s={0};scene_add(&s,-1,1);scene_add(&s,0,2);scene_add(&s,1,3);scene_add(&s,2,4);return s;}
int main(void){
    Scene s=chain();assert(scene_world(&s,3)==10&&scene_world(&s,1)==3&&s.recomputes==4);scene_world(&s,3);scene_world(&s,2);assert(s.recomputes==4);
    scene_set_local(&s,1,20);assert(scene_world(&s,3)==28&&s.recomputes==7);
    s=(Scene){0};scene_add(&s,-1,10);scene_add(&s,0,1);scene_add(&s,0,2);scene_world(&s,1);scene_world(&s,2);uint32_t before=s.recomputes;scene_set_local(&s,1,5);assert(scene_world(&s,2)==12&&s.recomputes==before);assert(scene_world(&s,1)==15&&s.recomputes==before+1);
    s=chain();scene_world(&s,3);scene_set_local(&s,0,100);assert(scene_world(&s,3)==109&&s.recomputes==8);
    s=chain();scene_world(&s,3);size_t extra=scene_add(&s,3,5);assert(scene_world(&s,extra)==15&&s.recomputes==5);assert(scene_add(&s,7,1)==SIZE_MAX);return 0;
}
