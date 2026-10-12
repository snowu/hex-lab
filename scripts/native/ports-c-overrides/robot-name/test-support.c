static unsigned name_id(const char *name) {
    assert(strlen(name) == 5);
    assert(name[0] >= 'A' && name[0] <= 'Z' && name[1] >= 'A' && name[1] <= 'Z');
    for (int i = 2; i < 5; ++i) assert(name[i] >= '0' && name[i] <= '9');
    return (unsigned)(name[0] - 'A') * 26000 + (unsigned)(name[1] - 'A') * 1000 +
           (unsigned)(name[2] - '0') * 100 + (unsigned)(name[3] - '0') * 10 + (unsigned)(name[4] - '0');
}
