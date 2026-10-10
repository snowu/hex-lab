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


async def run(code, tests="", allow_empty=False, test_timeout=2.0):
    registry = []
    out = io.StringIO()

    def test(name, fn=None):
        def register(f):
            registry.append((name, f))
            return f
        return register(fn) if fn is not None else register

    ns = {"__name__": "__lab__", "test": test, "eq": eq, "raises": raises, "close": close}
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
