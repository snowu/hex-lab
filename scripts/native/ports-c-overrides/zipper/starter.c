zipper zipper_from_tree(const tree *root) { (void)root; zipper z = {NULL,NULL,NULL,0}; return z; }
zipper zipper_clone(const zipper *z) { (void)z; return zipper_from_tree(NULL); }
zipper zipper_left(const zipper *z) { (void)z; return zipper_from_tree(NULL); }
zipper zipper_right(const zipper *z) { return zipper_left(z); }
zipper zipper_up(const zipper *z) { return zipper_left(z); }
int zipper_value(const zipper *z) { (void)z; return 0; }
zipper zipper_set_value(const zipper *z,int value) { (void)value; return zipper_left(z); }
zipper zipper_set_left(const zipper *z,const tree *subtree) { (void)subtree; return zipper_left(z); }
zipper zipper_set_right(const zipper *z,const tree *subtree) { return zipper_set_left(z,subtree); }
const tree *zipper_to_tree(const zipper *z) { return z->root; }
void zipper_free(zipper *z) { (void)z; }
