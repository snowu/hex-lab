#include <time.h>
#ifdef __cplusplus
#include <atomic>
static std::atomic_bool factory_locked{false};
#else
#include <stdatomic.h>
static atomic_bool factory_locked = false;
#endif
static bool used[676000];
static unsigned issued;
static uint64_t fallback_state;
static void acquire_factory(void) {
#ifdef __cplusplus
    while (factory_locked.exchange(true, std::memory_order_acquire)) {}
#else
    while (atomic_exchange_explicit(&factory_locked, true, memory_order_acquire)) {}
#endif
}
static void release_factory(void) {
#ifdef __cplusplus
    factory_locked.store(false, std::memory_order_release);
#else
    atomic_store_explicit(&factory_locked, false, memory_order_release);
#endif
}
/* Prefer operating-system entropy; standard-library-only fallback is seeded
 * once from wall-clock time and an address, then advances a xorshift PRNG.
 * This exercise requires unpredictable assignment order, not security keys. */
static uint32_t random_number(FILE *entropy) {
    uint32_t value;
    if (entropy && fread(&value, sizeof(value), 1, entropy) == 1) return value;
    if (!fallback_state) {
        struct timespec now;
        timespec_get(&now, TIME_UTC);
        fallback_state = (uint64_t)now.tv_sec ^ ((uint64_t)now.tv_nsec << 32) ^ (uintptr_t)&fallback_state;
        if (!fallback_state) fallback_state = 0x9e3779b97f4a7c15ULL;
    }
    fallback_state ^= fallback_state >> 12;
    fallback_state ^= fallback_state << 25;
    fallback_state ^= fallback_state >> 27;
    return (uint32_t)((fallback_state * 2685821657736338717ULL) >> 32);
}
bool robot_create(robot *result) {
    acquire_factory();
    if (issued == 676000) { release_factory(); return false; }
    FILE *entropy = fopen("/dev/urandom", "rb");
    unsigned identifier;
    do { identifier = random_number(entropy) % 676000; } while (used[identifier]);
    if (entropy) fclose(entropy);
    used[identifier] = true;
    ++issued;
    result->name[0] = (char)('A' + identifier / 26000);
    result->name[1] = (char)('A' + identifier / 1000 % 26);
    snprintf(result->name + 2, 4, "%03u", identifier % 1000);
    release_factory();
    return true;
}
bool robot_reset(robot *result) { return robot_create(result); }
