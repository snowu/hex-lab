// Type object: data-driven monsters with inheritance
// Run: g++ -std=c++20 -Wall -o type_object type_object.cpp && ./type_object

#include <optional>
#include <string>
#include <vector>

struct Stats { std::optional<int> hp, attack, speed; };
struct Resolved { int hp, attack, speed; };

class Registry {
public:
    // false if the name exists already or the parent is not defined yet
    bool define(const std::string& name, const std::optional<std::string>& parent, Stats stats) { return false; }
    // each stat comes from the closest type on the chain that sets it; nothing if unknown or incomplete
    std::optional<Resolved> resolve(const std::string& name) const { return std::nullopt; }

private:
    struct Type { std::string name; std::optional<std::size_t> parent; Stats stats; };
    std::vector<Type> types_;
};

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

static Registry zoo() { Registry r; r.define("goblin", std::nullopt, {10, 2, 3}); r.define("chief", std::string("goblin"), {25, 4, std::nullopt}); r.define("elite", std::string("chief"), {std::nullopt, std::nullopt, 5}); return r; }

int main() {
    { auto r = zoo(); auto g = r.resolve("goblin"); CHECK(g && g->hp == 10 && g->attack == 2 && g->speed == 3); }
    { auto r = zoo(); auto c = r.resolve("chief"); CHECK(c && c->hp == 25 && c->attack == 4 && c->speed == 3); }
    { auto r = zoo(); auto e = r.resolve("elite"); CHECK(e && e->hp == 25 && e->attack == 4 && e->speed == 5); }
    { auto r = zoo(); CHECK(!r.resolve("dragon")); CHECK(!r.define("whelp", std::string("dragon"), {1, 1, 1})); CHECK(!r.resolve("whelp")); }
    { auto r = zoo(); CHECK(!r.define("goblin", std::nullopt, {999, 999, 999})); CHECK(r.resolve("goblin")->hp == 10); }
    { Registry r; CHECK(r.define("half", std::nullopt, {1, 1, std::nullopt})); CHECK(!r.resolve("half")); CHECK(r.define("fixed", std::string("half"), {std::nullopt, std::nullopt, 2})); CHECK(r.resolve("fixed").has_value()); }
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
