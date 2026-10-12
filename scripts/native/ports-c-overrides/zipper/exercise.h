/* Every zipper owns an independent immutable snapshot. Navigation and edits
 * return new zippers; they never change their input or the source tree.
 * Missing children / root.up return a zipper whose focus is NULL.
 * Release each returned snapshot exactly once with zipper_free().
 * Plain struct assignment is a shallow ownership transfer, not a clone: do
 * not free both copies. Use zipper_clone() for an independently owned copy. */
typedef struct tree { int value; struct tree *left, *right; } tree;
typedef struct { tree *root, *focus; tree **ancestors; size_t depth; } zipper;
zipper zipper_from_tree(const tree *root);
zipper zipper_clone(const zipper *source);
zipper zipper_left(const zipper *z);
zipper zipper_right(const zipper *z);
zipper zipper_up(const zipper *z);
int zipper_value(const zipper *z);
zipper zipper_set_value(const zipper *z, int value);
zipper zipper_set_left(const zipper *z, const tree *subtree);
zipper zipper_set_right(const zipper *z, const tree *subtree);
const tree *zipper_to_tree(const zipper *z);
void zipper_free(zipper *z);
