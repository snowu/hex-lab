// 2D transforms: matrices and the order of operations
// Run: g++ -std=c++20 -Wall -o transform2d transform2d.cpp && ./transform2d

#include <array>
#include <cmath>
#include <optional>

// x' = a*x + c*y + tx ; y' = b*x + d*y + ty
struct Mat { double a, b, c, d, tx, ty; };
inline constexpr Mat kIdentity{1, 0, 0, 1, 0, 0};

Mat translate(double x, double y) { return kIdentity; }
Mat rotate(double rad) { return kIdentity; }
Mat scale(double sx, double sy) { return kIdentity; }
// The matrix that applies c first and then p (a child inside a parent).
Mat mul(const Mat& p, const Mat& c) { return c; }
std::array<double, 2> apply(const Mat& m, double x, double y) { return {x, y}; }
std::optional<Mat> inverse(const Mat& m) { return std::nullopt; }

// ---- tests: do not edit below this line ----
#include <cstdio>
static int g_fail = 0, g_run = 0;
#define CHECK(c) do { ++g_run; if (!(c)) { ++g_fail; std::printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static bool pt(std::array<double, 2> p, double x, double y) { return std::fabs(p[0] - x) < 1e-9 && std::fabs(p[1] - y) < 1e-9; }
static const double kPi = 3.14159265358979323846;

int main() {
    CHECK(pt(apply(translate(3, 5), 1, 2), 4, 7));
    CHECK(pt(apply(rotate(kPi / 2), 1, 0), 0, 1));
    CHECK(pt(apply(rotate(kPi / 2), 0, 1), -1, 0));
    CHECK(pt(apply(scale(2, -3), 3, 1), 6, -3));
    CHECK(pt(apply(kIdentity, 5, 6), 5, 6));
    CHECK(pt(apply(mul(translate(10, 0), rotate(kPi / 2)), 1, 0), 10, 1));
    CHECK(pt(apply(mul(rotate(kPi / 2), translate(10, 0)), 1, 0), 0, 11));
    { Mat p = mul(translate(3, -2), scale(2, 0.5)), c = mul(rotate(0.7), translate(1, 4)), m = mul(p, c);
      auto inner = apply(c, 2.5, -1.5); auto step = apply(p, inner[0], inner[1]); CHECK(pt(apply(m, 2.5, -1.5), step[0], step[1])); }
    { Mat m = mul(translate(5, 6), mul(rotate(1.1), scale(2, 3))); auto inv = inverse(m); auto p = apply(m, 1.25, -7.5); CHECK(inv && pt(apply(*inv, p[0], p[1]), 1.25, -7.5)); }
    CHECK(!inverse(scale(0, 1))); CHECK(inverse(kIdentity).has_value());
    std::printf("%d checks, %d failed\n", g_run, g_fail);
    return g_fail ? 1 : 0;
}
