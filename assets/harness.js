/* Tiny test harness. Used by the browser worker and by scripts/validate.mjs. */
(function (root) {
  function fmt(v) {
    try {
      if (typeof v === 'string') return JSON.stringify(v);
      if (typeof v === 'function') return '[Function]';
      if (v instanceof Map) return 'Map' + JSON.stringify([...v]);
      if (v instanceof Set) return 'Set' + JSON.stringify([...v]);
      return JSON.stringify(v, (k, x) => (x === undefined ? '__undefined__' : x)) ?? String(v);
    } catch (e) { return String(v); }
  }
  function deepEq(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
    if (a instanceof Map && b instanceof Map) return deepEq([...a], [...b]);
    if (a instanceof Set && b instanceof Set) return deepEq([...a], [...b]);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEq(a[k], b[k]));
  }

  async function runTests(code, onLog) {
    const logs = [];
    const con = { log: (...a) => { logs.push(a.map((x) => (typeof x === 'string' ? x : fmt(x))).join(' ')); onLog && onLog(); } };
    con.info = con.warn = con.error = con.log;
    const tests = [];
    const test = (name, fn) => tests.push({ name, fn });
    const eq = (actual, expected, msg) => {
      if (!deepEq(actual, expected)) throw new Error((msg ? msg + ': ' : '') + 'expected ' + fmt(expected) + ', got ' + fmt(actual));
    };
    const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
    const throws = async (fn, msg) => {
      try { await fn(); } catch (e) { return e; }
      throw new Error(msg || 'expected function to throw');
    };
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    try {
      await new AsyncFunction('test', 'eq', 'assert', 'throws', 'console', code)(test, eq, assert, throws, con);
    } catch (e) {
      return { fatal: String((e && e.stack) || e).split('\n').slice(0, 4).join('\n'), logs, results: [] };
    }
    const results = [];
    for (const t of tests) {
      try {
        await Promise.race([
          t.fn(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('test timed out (async never resolved?)')), 1500)),
        ]);
        results.push({ name: t.name, pass: true });
      } catch (e) {
        results.push({ name: t.name, pass: false, err: String((e && e.message) || e) });
      }
    }
    if (!tests.length) return { fatal: 'No tests were registered.', logs, results };
    return { results, logs };
  }
  root.runTests = runTests;
})(typeof self !== 'undefined' ? self : globalThis);
