"""Run exercise cases under CPython with the same harness the browser uses.

stdin : JSON list of {"id", "code", "tests", "allow_empty"}
stdout: JSON list of {"id", "fatal"?, "logs", "results"}
"""
import asyncio
import importlib.util
import json
import pathlib
import signal
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("harness", ROOT / "assets" / "harness.py")
harness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harness)


class CaseTimeout(BaseException):
    pass


def _alarm(signum, frame):
    raise CaseTimeout()


signal.signal(signal.SIGALRM, _alarm)
out = []
for case in json.load(sys.stdin):
    signal.alarm(15)
    try:
        if "sql_spec" in case:
            res = asyncio.run(harness.run_sql(case["sql_spec"]))
        else:
            res = asyncio.run(harness.run(case["code"], case.get("tests", ""), case.get("allow_empty", False)))
    except CaseTimeout:
        res = {"fatal": "timed out after 15s (infinite loop?)", "logs": [], "results": []}
    finally:
        signal.alarm(0)
    res["id"] = case["id"]
    out.append(res)
json.dump(out, sys.stdout)
