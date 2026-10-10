/* Persistent Python (Pyodide) worker. The main thread terminates it on timeout (infinite loops). */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');

const ready = (async () => {
  const py = await loadPyodide();
  try { await py.loadPackage('sqlite3'); } catch (e) { /* SQL exercises will report the problem */ }
  const harness = await (await fetch('harness.py')).text();
  py.runPython(harness);
  return py;
})();

ready.then(() => postMessage({ type: 'ready' }), (e) => postMessage({ type: 'init-error', error: String(e) }));

onmessage = async (e) => {
  const { id, code, tests, allowEmpty, spec } = e.data;
  try {
    const py = await ready;
    let json;
    if (spec) {
      py.globals.set('_spec', JSON.stringify(spec));
      json = await py.runPythonAsync('await run_sql_json(_spec)');
    } else {
      py.globals.set('_code', code);
      py.globals.set('_tests', tests || '');
      py.globals.set('_allow_empty', !!allowEmpty);
      json = await py.runPythonAsync('await run_json(_code, _tests, _allow_empty)');
    }
    postMessage({ type: 'result', id, data: JSON.parse(json) });
  } catch (err) {
    postMessage({ type: 'result', id, data: { fatal: String(err), logs: [], results: [] } });
  }
};
