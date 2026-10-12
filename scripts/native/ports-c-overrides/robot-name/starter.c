bool robot_create(robot *result) { strcpy(result->name, "AA000"); return true; }
bool robot_reset(robot *result) { return robot_create(result); }
