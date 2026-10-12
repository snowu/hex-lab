// Type object: data-driven monsters with inheritance
// Run: cc -std=c17 -Wall type_object.c -lm -o type_object && ./type_object

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
#include <limits.h>

/* Registry owns eight records and borrows immutable NUL-terminated names;
   names must remain alive while the registry is used. Initialize with {0}.
   Mask bits distinguish explicit zero-valued stats from inherited values.
   resolve writes caller-owned output only when every stat can be resolved. */
enum { STAT_HP=1,STAT_ATTACK=2,STAT_SPEED=4 };
typedef struct { unsigned mask;int32_t hp,attack,speed; } Stats;
typedef struct { int32_t hp,attack,speed; } Resolved;
typedef struct { const char *names[8];int parents[8];Stats stats[8];size_t n; } Registry;
static int registry_find(const Registry *r, const char *name) {
    (void)r;
    (void)name;
    abort(); /* TODO: implement registry_find */
}
bool registry_define(Registry *r, const char *name, const char *parent, Stats stats) {
    (void)r;
    (void)name;
    (void)parent;
    (void)stats;
    abort(); /* TODO: implement registry_define */
}
bool registry_resolve(const Registry *r, const char *name, Resolved *out) {
    (void)r;
    (void)name;
    (void)out;
    abort(); /* TODO: implement registry_resolve */
}

// ---- tests: do not edit below this line ----
#include <assert.h>

int main(void){Registry r={0};Resolved v;assert(registry_define(&r,"goblin",NULL,(Stats){7,10,2,3}));assert(registry_define(&r,"chief","goblin",(Stats){3,25,4,0}));assert(registry_define(&r,"elite","chief",(Stats){4,0,0,5}));
assert(registry_resolve(&r,"goblin",&v)&&v.hp==10&&v.attack==2&&v.speed==3);assert(registry_resolve(&r,"chief",&v)&&v.hp==25&&v.attack==4&&v.speed==3);assert(registry_resolve(&r,"elite",&v)&&v.hp==25&&v.attack==4&&v.speed==5);
assert(!registry_resolve(&r,"dragon",&v));assert(!registry_define(&r,"whelp","dragon",(Stats){1,1,0,0}));assert(!registry_resolve(&r,"whelp",&v));assert(!registry_define(&r,"goblin",NULL,(Stats){7,999,999,999}));assert(registry_resolve(&r,"goblin",&v)&&v.hp==10);
r=(Registry){0};assert(registry_define(&r,"half",NULL,(Stats){3,1,1,0}));assert(!registry_resolve(&r,"half",&v));assert(registry_define(&r,"fixed","half",(Stats){4,0,0,2}));assert(registry_resolve(&r,"fixed",&v)&&v.speed==2);assert(registry_define(&r,"zero","fixed",(Stats){1,0,0,0}));assert(registry_resolve(&r,"zero",&v)&&v.hp==0&&v.attack==1);return 0;}
