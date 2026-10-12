#ifndef RESISTOR_COLOR_TRIO_H
#define RESISTOR_COLOR_TRIO_H

#include <cstdint>

typedef enum {
    BLACK = 0,
    BROWN = 1,
    RED = 2,
    ORANGE = 3,
    YELLOW = 4,
    GREEN = 5,
    BLUE = 6,
    VIOLET = 7,
    GREY = 8,
    WHITE = 9
} resistor_band_t;

typedef enum {
    OHMS = 0,
    KILOOHMS = 1,
    MEGAOHMS = 2,
    GIGAOHMS = 3,
    TERAOHMS = 4,
    PETAOHMS = 5,
    EXAOHMS = 6,
} resistor_unit_t;

/* Integral API: choose the largest unit that preserves the exact value,
 * e.g. 1500 ohms rather than truncating 1.5 kiloohms to 1 kiloohm. */
typedef struct {
    uint16_t value;
    resistor_unit_t unit;
} resistor_value_t;

resistor_value_t color_code(const resistor_band_t colors[]);

#endif
