#include "resistor_color_trio.h"

resistor_value_t color_code(const resistor_band_t colors[]) {
    resistor_value_t resistor{0, OHMS};
    std::uint64_t total =
        static_cast<unsigned>(colors[0]) * 10u + static_cast<unsigned>(colors[1]);
    for (unsigned exponent = 0; exponent < static_cast<unsigned>(colors[2]); ++exponent)
        total *= 10u;
    while (total >= 1000 && total % 1000 == 0) {
        resistor.unit =
            static_cast<resistor_unit_t>(static_cast<unsigned>(resistor.unit) + 1);
        total /= 1000;
    }
    resistor.value = static_cast<std::uint16_t>(total);
    return resistor;
}
