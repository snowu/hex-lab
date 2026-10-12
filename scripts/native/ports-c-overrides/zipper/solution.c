static tree *copy_tree(const tree *source) {
    if (!source) return NULL;
    tree *result = (tree *)malloc(sizeof(tree));
    result->value = source->value;
    result->left = copy_tree(source->left);
    result->right = copy_tree(source->right);
    return result;
}
static void free_tree(tree *root) {
    if (!root) return;
    free_tree(root->left);
    free_tree(root->right);
    free(root);
}
zipper zipper_from_tree(const tree *root) {
    zipper result = {NULL, NULL, NULL, 0};
    result.root = result.focus = copy_tree(root);
    return result;
}
/* Rebuild the focus path in the copied snapshot, never copying pointers from
 * the old snapshot into the new one. This simple C implementation trades O(n)
 * copying for straightforward ownership. Path-copying trees can reduce edits
 * to O(depth) when shared nodes have reference-counted lifetimes. */
static zipper copy_zipper(const zipper *source) {
    zipper result = zipper_from_tree(source->root);
    if (!source->focus) return result;
    result.depth = source->depth;
    result.ancestors = (tree **)malloc(result.depth * sizeof(tree *));
    for (size_t i = 0; i < result.depth; ++i) {
        result.ancestors[i] = result.focus;
        const tree *child = i + 1 == source->depth ? source->focus : source->ancestors[i + 1];
        result.focus = source->ancestors[i]->left == child ? result.focus->left : result.focus->right;
    }
    return result;
}
zipper zipper_clone(const zipper *source) { return copy_zipper(source); }
static zipper down(const zipper *source, bool left) {
    zipper empty = {NULL, NULL, NULL, 0};
    if (!source->focus || !(left ? source->focus->left : source->focus->right)) return empty;
    zipper result = copy_zipper(source);
    result.ancestors = (tree **)realloc(result.ancestors, (result.depth + 1) * sizeof(tree *));
    result.ancestors[result.depth++] = result.focus;
    result.focus = left ? result.focus->left : result.focus->right;
    return result;
}
zipper zipper_left(const zipper *z) { return down(z, true); }
zipper zipper_right(const zipper *z) { return down(z, false); }
zipper zipper_up(const zipper *z) {
    zipper empty = {NULL, NULL, NULL, 0};
    if (!z->focus || !z->depth) return empty;
    zipper result = copy_zipper(z);
    result.focus = result.ancestors[--result.depth];
    return result;
}
int zipper_value(const zipper *z) { return z->focus->value; }
zipper zipper_set_value(const zipper *z, int value) {
    zipper result = copy_zipper(z);
    if (result.focus) result.focus->value = value;
    return result;
}
zipper zipper_set_left(const zipper *z, const tree *subtree) {
    zipper result = copy_zipper(z);
    if (result.focus) {
        free_tree(result.focus->left);
        result.focus->left = copy_tree(subtree);
    }
    return result;
}
zipper zipper_set_right(const zipper *z, const tree *subtree) {
    zipper result = copy_zipper(z);
    if (result.focus) {
        free_tree(result.focus->right);
        result.focus->right = copy_tree(subtree);
    }
    return result;
}
const tree *zipper_to_tree(const zipper *z) { return z->root; }
void zipper_free(zipper *z) {
    free_tree(z->root);
    free(z->ancestors);
    z->root = z->focus = NULL;
    z->ancestors = NULL;
    z->depth = 0;
}
