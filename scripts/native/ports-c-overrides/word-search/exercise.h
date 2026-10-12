/* Word search coordinates are 0-based. */
typedef struct {size_t row,column;} coordinate;
bool find_word(const char *const *grid,size_t rows,const char *word,coordinate *start,coordinate *end);
