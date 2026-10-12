const char *grid[] = {"abc", "def", "ghi"};
struct search_case { const char *word; size_t sr, sc, er, ec; };
const struct search_case cases[] = {
    {"abc",0,0,0,2}, {"cba",0,2,0,0}, {"adg",0,0,2,0}, {"gda",2,0,0,0},
    {"aei",0,0,2,2}, {"iea",2,2,0,0}, {"ceg",0,2,2,0}, {"gec",2,0,0,2}
};
coordinate start, end;
for (size_t i=0; i<sizeof(cases)/sizeof(cases[0]); ++i) {
    assert(find_word(grid,3,cases[i].word,&start,&end));
    assert(start.row==cases[i].sr && start.column==cases[i].sc);
    assert(end.row==cases[i].er && end.column==cases[i].ec);
}
assert(!find_word(grid,3,"zzz",&start,&end));
assert(!find_word(grid,3,"ABC",&start,&end)); /* Match characters exactly. */
assert(!find_word(grid,3,"",&start,&end));
assert(!find_word(grid,3,"abcd",&start,&end)); /* Never wrap across rows. */
assert(!find_word(NULL,0,"a",&start,&end));
assert(find_word(grid,3,"e",&start,&end) && start.row==1 && start.column==1 &&
       end.row==1 && end.column==1);
const char *ragged[] = {"ab", "c", "def"};
assert(!find_word(ragged,3,"be",&start,&end));
assert(find_word(ragged,3,"acd",&start,&end) && end.row==2 && end.column==0);
