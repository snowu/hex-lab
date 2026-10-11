// Event queue: a fixed-size ring buffer
// Run: g++ -std=c++20 -Wall -o event_queue event_queue.cpp && ./event_queue

#include <array>
#include <cstddef>
#include <optional>

template <class T, std::size_t Capacity>
class RingQueue {
public:
    std::size_t len() const { return count_; }
    // false (and nothing stored) when full
    bool push(T v) { return false; }
    // always stores v; true if the oldest item had to be dropped
    bool push_overwrite(T v) { return false; }
    std::optional<T> pop() { return std::nullopt; }
    std::optional<T> peek() const { return std::nullopt; }

private:
    std::array<T, Capacity> items_{};
    std::size_t head_ = 0;   // index of the oldest item
    std::size_t count_ = 0;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main() {
    { RingQueue<unsigned, 4> q; CHECK(q.push(1)); CHECK(q.push(2)); CHECK(q.push(3)); CHECK(q.len() == 3);
      CHECK(q.pop() == 1u); CHECK(q.pop() == 2u); CHECK(q.pop() == 3u); CHECK(!q.pop().has_value()); }
    { RingQueue<unsigned, 2> q; CHECK(q.push(1)); CHECK(q.push(2)); CHECK(!q.push(3)); CHECK(q.pop() == 1u); CHECK(q.push(3)); CHECK(q.pop() == 2u); CHECK(q.pop() == 3u); }
    { RingQueue<unsigned, 3> q; unsigned in = 0, out = 0; bool good = true;
      for (int i = 0; i < 100; ++i) { good &= q.push(in++); good &= q.push(in++); good &= (q.pop() == out++); good &= (q.pop() == out++); } CHECK(good); }
    { RingQueue<unsigned, 2> q; CHECK(!q.peek().has_value()); q.push(9); CHECK(q.peek() == 9u); CHECK(q.len() == 1); }
    { RingQueue<unsigned, 3> q; CHECK(!q.push_overwrite(1)); CHECK(!q.push_overwrite(2)); CHECK(!q.push_overwrite(3)); CHECK(q.push_overwrite(4)); CHECK(q.push_overwrite(5));
      CHECK(q.len() == 3); CHECK(q.pop() == 3u); CHECK(q.pop() == 4u); CHECK(q.pop() == 5u); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
