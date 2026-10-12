#include "wordy.h"
#include <ctype.h>
#include <errno.h>
#include <limits.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
static void spaces(const char **text) {
    while (isspace((unsigned char)**text)) ++*text;
}
static bool number(const char **text, int64_t *value) {
    spaces(text);
    char *end;
    errno = 0;
    long long parsed = strtoll(*text, &end, 10);
    if (end == *text || errno == ERANGE || parsed < INT_MIN || parsed > INT_MAX) return false;
    *text = end;
    *value = parsed;
    spaces(text);
    return true;
}
bool answer(const char *question, int *result) {
    if (!question || strncmp(question, "What is ", 8)) return false;
    question += 8;
    int64_t value;
    if (!number(&question, &value)) return false;
    while (*question != '?') {
        const char *operators[] = {"plus", "minus", "multiplied by", "divided by"};
        unsigned operation;
        for (operation = 0; operation < 4; ++operation) {
            size_t length = strlen(operators[operation]);
            if (!strncmp(question, operators[operation], length) &&
                isspace((unsigned char)question[length])) {
                question += length;
                break;
            }
        }
        if (operation == 4) return false;
        int64_t right;
        if (!number(&question, &right)) return false;
        if (operation == 0) value += right;
        else if (operation == 1) value -= right;
        else if (operation == 2) value *= right;
        else {
            if (!right) return false;
            value /= right;
        }
        if (value < INT_MIN || value > INT_MAX) return false;
    }
    if (question[1]) return false;
    *result = (int)value;
    return true;
}
