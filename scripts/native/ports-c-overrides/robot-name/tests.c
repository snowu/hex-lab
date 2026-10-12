robot first, second;
assert(robot_create(&first) && robot_create(&second));
assert(strcmp(first.name, second.name));
char original[6]; strcpy(original, first.name);
assert(robot_reset(&first) && strcmp(original, first.name));
/* Retain every assigned name, including retired names: a reset must not make
 * a name immediately available for another robot. */
bool *seen = (bool *)calloc(676000, sizeof(bool));
seen[name_id(original)] = true; seen[name_id(first.name)] = true; seen[name_id(second.name)] = true;
unsigned previous = 0, first_difference = 0;
bool constant_difference = true;
for (unsigned i = 0; i < 2000; ++i) {
    robot next;
    assert(robot_create(&next));
    unsigned id = name_id(next.name);
    assert(!seen[id]); seen[id] = true;
    unsigned difference = (id + 676000 - previous) % 676000;
    if (i == 1) first_difference = difference;
    if (i > 1 && difference != first_difference) constant_difference = false;
    previous = id;
}
/* Regression for the old predictable affine permutation. Testing thousands
 * of differences avoids depending on a particular random first name. */
assert(!constant_difference);
for (unsigned i = 0; i < 1000; ++i) {
    assert(robot_reset(&first));
    unsigned id = name_id(first.name);
    assert(!seen[id]); seen[id] = true;
}
free(seen);
