"""Test harness shared by the browser (Pyodide worker) and scripts/pyrun.py (CPython, used by CI).

User code and the exercise's tests are exec'd into one namespace. Tests register themselves with
`test(name, fn)` or `@test(name)`, may be sync or async, and use `eq`, `raises` and `close`.
"""
import ast
import asyncio
import contextlib
import inspect
import io
import json
import math
import sqlite3


class _Raises:
    """`with raises(ValueError) as r:` (also works as `async with`). r.value holds the exception."""

    def __init__(self, exc=Exception):
        self.exc = exc
        self.value = None

    def __enter__(self):
        return self

    def __exit__(self, etype, evalue, tb):
        name = getattr(self.exc, "__name__", str(self.exc))
        if etype is None:
            raise AssertionError(f"expected {name} to be raised, but nothing was")
        if issubclass(etype, self.exc):
            self.value = evalue
            return True
        return False

    async def __aenter__(self):
        return self.__enter__()

    async def __aexit__(self, etype, evalue, tb):
        return self.__exit__(etype, evalue, tb)


def raises(exc=Exception):
    return _Raises(exc)


def eq(actual, expected, msg=""):
    if actual != expected:
        prefix = f"{msg}: " if msg else ""
        raise AssertionError(f"{prefix}expected {expected!r}, got {actual!r}")


def close(a, b, tol=1e-9):
    return isinstance(a, (int, float)) and isinstance(b, (int, float)) and math.isclose(a, b, abs_tol=tol)


def _describe(exc):
    """One short, readable line for an exception raised by user code."""
    if isinstance(exc, SyntaxError):
        where = f" (line {exc.lineno})" if exc.lineno else ""
        return f"SyntaxError: {exc.msg}{where}"
    line = None
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename in ("<solution>", "<tests>"):
            line = (tb.tb_frame.f_code.co_filename.strip("<>"), tb.tb_lineno)
        tb = tb.tb_next
    where = f" (in {line[0]}, line {line[1]})" if line else ""
    text = str(exc)
    return f"{type(exc).__name__}: {text}{where}" if text else f"{type(exc).__name__}{where}"


async def _exec(src, filename, ns):
    code = compile(src, filename, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    result = eval(code, ns)
    if inspect.iscoroutine(result):
        await result


async def run(code, tests="", allow_empty=False, test_timeout=2.0, extra=None):
    registry = []
    out = io.StringIO()

    def test(name, fn=None):
        def register(f):
            registry.append((name, f))
            return f
        return register(fn) if fn is not None else register

    ns = {"__name__": "__lab__", "test": test, "eq": eq, "raises": raises, "close": close}
    ns.update(extra or {})
    results = []
    with contextlib.redirect_stdout(out):
        try:
            await _exec(code, "<solution>", ns)
            if tests:
                await _exec(tests, "<tests>", ns)
        except BaseException as e:  # noqa: BLE001 - report anything the user code raises
            return {"fatal": _describe(e), "logs": out.getvalue().splitlines(), "results": []}
        for name, fn in registry:
            try:
                r = fn()
                if inspect.iscoroutine(r):
                    await asyncio.wait_for(r, test_timeout)
                results.append({"name": name, "pass": True})
            except asyncio.TimeoutError:
                results.append({"name": name, "pass": False, "err": "test timed out (an await never finished?)"})
            except AssertionError as e:
                results.append({"name": name, "pass": False, "err": str(e) or "assertion failed"})
            except BaseException as e:  # noqa: BLE001
                results.append({"name": name, "pass": False, "err": _describe(e)})
    if not registry and not allow_empty:
        return {"fatal": "No tests were registered.", "logs": out.getvalue().splitlines(), "results": []}
    return {"logs": out.getvalue().splitlines(), "results": results}


async def run_json(code, tests="", allow_empty=False):
    return json.dumps(await run(code, tests, allow_empty))


# ---------------------------------------------------------------- SQL exercises
# spec: {kind: 'sql'|'ddl', sql, schema, seed, hidden?, solution?, ordered?, names?, verify?}
#   sql  : compares the user's single query with the reference solution on the visible data and on a second dataset
#   ddl  : executes the user's script (CREATE INDEX ...), then runs `verify` (Python tests) with `conn` and `sql` in scope

def _connect(spec, with_hidden=False):
    conn = sqlite3.connect(":memory:")
    ops = [0]

    def guard():
        ops[0] += 1
        return 1 if ops[0] > 4000 else 0  # abort runaway queries (about 4M VM steps)

    conn.set_progress_handler(guard, 1000)
    conn.executescript(spec["schema"])
    if spec.get("seed"):
        conn.executescript(spec["seed"])
    if with_hidden and spec.get("hidden"):
        conn.executescript(spec["hidden"])
    return conn


def _query(conn, sql):
    cur = conn.execute(sql)
    cols = [d[0] for d in (cur.description or [])]
    return cols, [list(r) for r in cur.fetchall()]


def _norm(rows, ordered):
    out = [[round(v, 6) if isinstance(v, float) else v for v in r] for r in rows]
    return out if ordered else sorted(out, key=lambda r: [repr(v) for v in r])


def _diff(got, want):
    if len(got) != len(want):
        return f"expected {len(want)} row(s), got {len(got)}"
    for i, (g, w) in enumerate(zip(got, want)):
        if g != w:
            return f"row {i + 1} differs: expected {w!r}, got {g!r}"
    return None


async def run_sql(spec):
    user = spec.get("sql", "")
    if spec.get("kind") == "ddl":
        try:
            conn = _connect(spec)
            conn.executescript(user)
        except sqlite3.Error as e:
            return {"fatal": f"SQL error: {e}", "logs": [], "results": []}
        return await run("", spec["verify"], extra={"conn": conn, "sql": user, "query": lambda s: _query(conn, s)[1], "plan": lambda s: " | ".join(r[3] for r in conn.execute("EXPLAIN QUERY PLAN " + s))})
    if not user.strip():
        return {"fatal": "Write a query first.", "logs": [], "results": []}
    results, ordered = [], bool(spec.get("ordered"))
    try:
        ucols, urows = _query(_connect(spec), user)
    except sqlite3.Error as e:
        return {"fatal": f"SQL error: {e}", "logs": [], "results": []}
    ecols, erows = _query(_connect(spec), spec["solution"])
    shape_ok = len(ucols) == len(ecols) and (not spec.get("names") or [c.lower() for c in ucols] == [c.lower() for c in ecols])
    results.append({"name": "returns the expected columns" + (" (names matter here)" if spec.get("names") else ""), "pass": shape_ok,
                    **({} if shape_ok else {"err": f"expected {ecols}, got {ucols}"})})
    got, want = _norm(urows, ordered), _norm(erows, ordered)
    d = _diff(got, want) if shape_ok else "fix the columns first"
    results.append({"name": "returns the expected rows" + (" in the expected order" if ordered else ""), "pass": d is None, **({} if d is None else {"err": d})})
    if spec.get("hidden"):
        try:
            _, hu = _query(_connect(spec, True), user)
            _, he = _query(_connect(spec, True), spec["solution"])
            d2 = _diff(_norm(hu, ordered), _norm(he, ordered)) if shape_ok else "fix the columns first"
        except sqlite3.Error as e:
            d2 = f"SQL error on the second dataset: {e}"
        results.append({"name": "also correct on a second dataset (no hard-coding)", "pass": d2 is None, **({} if d2 is None else {"err": d2})})
    return {"logs": [], "results": results, "table": {"cols": ucols, "rows": urows[:30], "total": len(urows)}, "expected": {"cols": ecols, "rows": erows[:30], "total": len(erows)}}


async def run_sql_json(spec_json):
    return json.dumps(await run_sql(json.loads(spec_json)), default=str)
