/* Downloadable local tests and source-bound result imports; no native code runs here. */
(function () {
  const PACKAGE = 'game-dev-lab/native-package@1', RESULT = 'game-dev-lab/local-results@1';
  const reserved = ['lab-test.mjs', 'lab-manifest.json', 'lab-results.json', 'LOCAL_TESTS.md'];
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const sameNames = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  let runner;

  async function hashFiles(files) {
    if (!window.crypto?.subtle) throw Error('Use HTTPS or localhost to compare the tested source with this editor.');
    const text = JSON.stringify(Object.keys(files).sort().map(name => [name, files[name]]));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function makePackage(config) {
    const {id, language, files, sourceNames, testNames, supportNames = []} = config;
    if (!/^[\w-]+$/.test(id) || !['c', 'cpp', 'zig'].includes(language)) throw Error('Invalid native project.');
    if (reserved.some(name => Object.hasOwn(files, name))) throw Error('A source file conflicts with the local test runner.');
    const names = [...sourceNames, ...testNames, ...supportNames];
    if (new Set(names).size !== names.length || names.some(name => typeof files[name] !== 'string' || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..'))) throw Error('Invalid native file list.');
    runner ||= fetch('assets/game/local-test-runner.mjs').then(response => {
      if (!response.ok) throw Error('Could not load the local test runner. Retry the download.');
      return response.text();
    }).catch(error => {runner = null; throw error;});
    const manifest = {schema: PACKAGE, exerciseId: id, language, sourceNames, testNames, supportNames};
    for (const key of ['combine', 'compileNames', 'compileArgs', 'zigArgs', 'testEntry', 'runTimeoutMs']) if (config[key] !== undefined) manifest[key] = config[key];
    if (language === 'zig' && !manifest.testEntry) manifest.testEntry = testNames.find(name => name.endsWith('.zig'));
    const compiler = {c: 'a C17 compiler (cc)', cpp: 'a C++20 compiler (c++)', zig: 'Zig 0.17.0'}[language];
    const instructions = `# Run local tests\n\nInstall Node.js 22 or later and ${compiler}. Keep the files together after extracting this ZIP. Edit the source files, then run:\n\n    node lab-test.mjs\n\nThe runner compiles your files, runs their native tests, prints failing cases and compiler diagnostics, and writes lab-results.json. Import that file in Hex Lab to view feedback and load the exact source that was tested. If you change source, rerun the command to produce a fresh result.\n\nSet CC, CXX or ZIG to choose another compiler executable. Test reports are local results supplied by you; they are distinct from the manual completion button. The native test program must finish within the time limit; a timeout is a failed run.\n`;
    return {...files, 'lab-test.mjs': await runner, 'lab-manifest.json': JSON.stringify(manifest, null, 2) + '\n', 'LOCAL_TESTS.md': instructions};
  }

  async function validateReport(report, config) {
    if (!object(report) || report.schema !== RESULT) throw Error('Choose lab-results.json from the downloaded local test runner.');
    if (report.exerciseId !== config.exerciseId) throw Error('This result belongs to another exercise. Open that exercise before importing it.');
    if (report.language !== config.language) throw Error('This result uses another language. Switch the language selector before importing it.');
    if (typeof report.timestamp !== 'string' || !Number.isFinite(Date.parse(report.timestamp)) || !/^[0-9a-f]{64}$/.test(report.sourceHash) || !/^[0-9a-f]{64}$/.test(report.testHash)) throw Error('The result has invalid source fingerprints or a timestamp.');
    if (!['passed', 'failed'].includes(report.status) || !['compile', 'test'].includes(report.stage) || !Array.isArray(report.cases) || report.cases.length > 10000 || typeof report.output !== 'string' || report.output.length > 100000) throw Error('The result file has an invalid status or diagnostics.');
    if (!report.cases.length || report.cases.some(test => !object(test) || typeof test.name !== 'string' || test.name.length > 2000 || !['passed', 'failed', 'skipped'].includes(test.status))) throw Error('The result file has invalid test cases.');
    if (report.status === 'passed' && (report.stage !== 'test' || report.error || report.signal || report.cases.some(test => test.status === 'failed') || !report.cases.some(test => test.status === 'passed'))) throw Error('This file does not describe a completed passing test run.');
    const current = config.getFiles();
    if (!object(report.sources) || !sameNames(Object.keys(report.sources), Object.keys(current)) || Object.values(report.sources).some(text => typeof text !== 'string' || text.length > 500000)) throw Error('The tested source files do not match this exercise.');
    if (report.sourceHash !== await hashFiles(report.sources)) throw Error('The tested source snapshot is inconsistent with its fingerprint. Run the local tests again.');
    if (report.testHash !== await hashFiles(config.testFiles)) throw Error('The exercise tests have changed or differ from this download. Download a fresh test runner ZIP and rerun your source.');
    return {sourceMatches: report.sourceHash === await hashFiles(current)};
  }

  function mountResults(config) {
    const {H, container, language, getFiles, setFiles, markPass, isCurrent = () => true} = config;
    const exerciseId = config.exerciseId || config.item.id;
    const testFiles = config.testFiles || {...(config.tests || config.bundle?.tests || {}), ...config.support};
    const esc = H.esc;
    const section = document.createElement('section');
    section.className = 'native-results';
    section.innerHTML = `<h2>Feedback from your local tests</h2><p>Compile and test your own code, then bring the results back here.</p><div class="dbar"><button type="button" class="btn native-runner-download">Download test runner ZIP</button><label class="btn native-report-file">Import lab-results.json<input type="file" accept="application/json,.json" aria-label="Import local test results"></label></div><p class="muted">Requires Node.js 22 and your native compiler. Run <code>node lab-test.mjs</code> in the extracted folder.</p><div class="native-report" role="status"></div>`;
    container.append(section);
    const status = section.querySelector('.native-report');
    let disposed = false, imported;
    const current = () => !disposed && isCurrent();
    const key = 'gd:kataEvidence';
    const saveEvidence = report => {
      const records = H.store.get(key, {});
      records[exerciseId] = {...records[exerciseId], [language]: {status: report.status, stage: report.stage, sourceHash: report.sourceHash, testHash: report.testHash, timestamp: report.timestamp, caseCount: report.cases.length, failed: report.cases.filter(test => test.status === 'failed').length}};
      H.store.set(key, records);
    };
    const error = message => {status.innerHTML = `<p class="native-report-error">${esc(message)}</p>`;};

    function show(report, matches) {
      const failed = report.cases.filter(test => test.status === 'failed').length;
      status.innerHTML = `<p class="native-report-summary ${report.status === 'passed' ? 'native-report-pass' : 'native-report-error'}">${report.status === 'passed' ? 'Local test program passed' : report.stage === 'compile' ? 'Compilation failed' : 'Local tests failed'}${failed ? ' · ' + failed + ' failing case' + (failed === 1 ? '' : 's') : ''}</p><p>${esc(report.guidance || (report.status === 'passed' ? 'Review the tested source before recording this result.' : 'Inspect the first failing case or compiler diagnostic, then rerun your files locally.'))}</p><ul class="native-report-cases">${report.cases.slice(0, 80).map(test => `<li><span class="chip">${esc(test.status)}</span> ${esc(test.name)}${test.location ? `<small> · ${esc(test.location)}</small>` : ''}${test.expected !== undefined ? `<p>Expected: ${esc(String(test.expected))}<br>Actual: ${esc(String(test.actual))}</p>` : ''}${test.message ? `<p>${esc(test.message)}</p>` : ''}</li>`).join('')}</ul>${report.cases.length > 80 ? '<p>Additional cases are included in the result file.</p>' : ''}${report.output ? `<details><summary>Full compiler and test output</summary><pre>${esc(report.output)}</pre></details>` : ''}<p class="native-source-status">${matches ? 'The tested source matches the current editor.' : 'Your local source differs from the browser draft. Load the tested files before recording a pass.'}</p><div class="dbar">${!matches ? '<button type="button" class="btn native-load-source">Load tested source</button>' : ''}${report.status === 'passed' ? `<button type="button" class="btn primary native-record-result" ${!matches ? 'disabled' : ''}>Record imported local pass</button>` : ''}</div>`;
      const load = status.querySelector('.native-load-source');
      if (load) load.onclick = () => {setFiles(report.sources); show(report, true);};
      const record = status.querySelector('.native-record-result');
      if (record) record.onclick = async () => {
        try {
          if (report.sourceHash !== await hashFiles(getFiles())) throw Error('The source changed after this run. Rerun local tests or load the tested source again.');
          if (!current()) return;
          saveEvidence(report);
          markPass({evidence: 'local-report', report});
          record.disabled = true;
          status.querySelector('.native-source-status').textContent = 'Imported local pass recorded for the exact tested source.';
        } catch (failure) {if (current()) error(failure.message);}
      };
    }

    section.querySelector('.native-runner-download').onclick = async () => {
      try {
        config.save?.();
        let files, sourceNames, testNames, supportNames, combine;
        if (config.packageConfig) ({files, sourceNames, testNames, supportNames, combine} = {...config.packageConfig, files: {...config.packageConfig.files, ...getFiles()}});
        else {
          files = {...getFiles(), ...config.bundle.tests, ...config.support};
          sourceNames = Object.keys(getFiles()); testNames = Object.keys(config.bundle.tests); supportNames = Object.keys(config.support); combine = !config.item.catalog;
          files['README.md'] = `# ${config.item.title}\n\n${config.bundle.source}\nRevision: ${config.bundle.ref || 'original game exercise'}\nAuthors: ${(config.bundle.authors || []).join(', ')}\nContributors: ${(config.bundle.contributors || []).join(', ')}\n\nSee LOCAL_TESTS.md for the one-command test runner.\n`;
          if (config.license) files['LICENSE'] = config.license;
          if (config.instructions) files['INSTRUCTIONS.md'] = config.instructions;
        }
        const archive = await makePackage({...config.packageConfig, id: exerciseId, language, files, sourceNames, testNames, supportNames, combine});
        if (!current()) return;
        const url = URL.createObjectURL(nativeZip(archive)), link = document.createElement('a');
        link.href = url; link.download = exerciseId + '-' + language + '-tests.zip'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (failure) {if (current()) error(failure.message);}
    };
    section.querySelector('input[type=file]').onchange = async event => {
      try {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) throw Error('Choose a local test result smaller than 4 MB.');
        const report = JSON.parse(await file.text());
        const result = await validateReport(report, {exerciseId, language, getFiles, testFiles});
        if (!current()) return;
        imported = report;
        show(report, result.sourceMatches);
        if (report.status === 'failed') saveEvidence(report);
      } catch (failure) {if (current()) error(failure.message);}
      finally {event.target.value = '';}
    };
    const edit = () => {
      if (!imported) return;
      const sourceStatus = status.querySelector('.native-source-status');
      if (sourceStatus) sourceStatus.textContent = 'Source edited after the imported run. Rerun local tests before recording a fresh pass.';
      const record = status.querySelector('.native-record-result'); if (record) record.disabled = true;
    };
    const editor = config.editor || config.editorElement || document.querySelector('#gkcode,#npcode');
    editor?.addEventListener('input', edit);
    return () => {disposed = true; editor?.removeEventListener('input', edit);};
  }

  window.NativePractice = {makePackage, hashFiles, validateReport, mountResults};
  (window.GAME_KATA_EXTENSIONS ||= []).push(context => mountResults(context));
})();
