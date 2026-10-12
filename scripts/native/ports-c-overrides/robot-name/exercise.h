typedef struct { char name[6]; } robot;
/* Names are random AA000-style identifiers, globally unique even after resets.
 * Returns false if all 676000 identifiers have already been issued. */
bool robot_create(robot *robot);
bool robot_reset(robot *robot);
