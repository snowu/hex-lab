/* Learner code runs away from the DOM. The parent terminates this worker after 2 seconds. */
self.onmessage = ({ data }) => {
  try {
    const fn = new Function(
      '"use strict";\n' +
        data.code +
        "\nreturn typeof " +
        data.name +
        ' === "function" ? ' +
        data.name +
        " : null;",
    )();
    if (!fn) throw Error("Define function " + data.name);
    const canonical = (v) =>
      v && typeof v === "object"
        ? Array.isArray(v)
          ? v.map(canonical)
          : Object.fromEntries(
              Object.keys(v)
                .sort()
                .map((k) => [k, canonical(v[k])]),
            )
        : v;
    const results = data.tests.map((t, i) => {
      const args = structuredClone(t.args),
        before = JSON.stringify(args);
      let value, error;
      try {
        value = fn(...args);
      } catch (e) {
        error = e;
      }
      const pass = t.throws
        ? error?.name === t.throws
        : !error &&
          (t.tolerance
            ? typeof value === "number" &&
              Math.abs(value - t.expected) <= t.tolerance
            : JSON.stringify(canonical(value)) ===
              JSON.stringify(canonical(t.expected))) &&
          JSON.stringify(args) === before;
      return {
        index: i,
        pass,
        actual: error
          ? error.name + ": " + error.message
          : JSON.stringify(value),
        expected: t.throws || JSON.stringify(t.expected),
      };
    });
    self.postMessage({ results });
  } catch (e) {
    self.postMessage({ error: e.message });
  }
};
