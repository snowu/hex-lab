/* Native project pages edit/package learner files and display imported native frames.
 * This module deliberately contains no movement, collision, cooldown or spawn rules. */
(function () {
  function parseReplay(project, language, text) {
    if (typeof text !== 'string' || text.length > 4 * 1024 * 1024) throw Error('Import a replay smaller than 4 MB. Export a shorter sequence if necessary.');
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2 || lines.length > 20001) throw Error('A replay needs a header and 1–20,000 native frames.');
    let records;
    try { records = lines.map(line => JSON.parse(line)); } catch { throw Error('Invalid replay JSON. Import the unmodified output of game --replay ACTIONS.'); }
    const header = records[0];
    if (!header || header.type !== 'header' || header.project !== project.id || header.version !== project.version || header.language !== language) throw Error('This replay belongs to another project, version or language. Select its original project/language first.');
    const integer = (value, min, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
    const flag = value => typeof value === 'boolean';
    const frames = records.slice(1);
    for (const frame of frames) {
      if (!frame || frame.type !== 'frame' || !integer(frame.tick, 0) || !flag(frame.won) || typeof frame.action !== 'string' || frame.action.length !== 1) throw Error('A native frame has missing or invalid fields.');
      if (project.kind === 'runner') {
        if (!integer(frame.x, 0, project.grid[0].length - 1) || !integer(frame.y, 0, project.grid.length - 1) || !integer(frame.coins, 0, 3) || !flag(frame.moved) || !'wasd.'.includes(frame.action)) throw Error('A Tile Runner frame has invalid coordinates, pickups or movement data.');
      } else {
        if (!integer(frame.player, 0, project.width - 1) || !integer(frame.health, 0, 3) || !integer(frame.cooldown, 0, 3) || !integer(frame.score, 0, 3) || !integer(frame.waves, 0) || !flag(frame.fired) || !flag(frame.hit) || !'adf.'.includes(frame.action) || !Array.isArray(frame.enemies) || frame.enemies.length > 8 || frame.enemies.some(enemy => !enemy || !integer(enemy.x, 0, project.width - 1) || !integer(enemy.y, 0, project.height - 2))) throw Error('A Wave Arena frame has invalid enemy, cooldown or player data.');
      }
    }
    return { header, frames };
  }
  window.NativeProjectReplay = { parse: parseReplay };

  (window.LAB_VIEWS = window.LAB_VIEWS || []).push(H => {
    if (window.MODE !== 'gamedev') return;
    const { $, app, esc, store } = H;
    const items = window.NATIVE_PROJECTS?.items || [];
    const languages = { c: { title: 'C17', ext: 'c' }, zig: { title: 'Zig 0.17.0', ext: 'zig' }, cpp: { title: 'C++20', ext: 'cpp' } };
    H.routes.push([/^#\/native-projects$/, list], [/^#\/native-project\/([\w-]+)$/, view]);

    function list() {
      document.title = 'Playable native projects · Game Dev Lab';
      app.innerHTML = `<div class="page-h"><h1>Playable native projects</h1><p>Write mechanics that run in an actual native terminal game. Build locally, play with keyboard input, then import its native-computed replay here.</p></div><div class="dgrid">${items.map(project => `<a class="dcard tc" href="#/native-project/${project.id}"><h2>${esc(project.title)}</h2><p>${esc(project.blurb)}</p><span class="chip">${esc(project.difficulty)} · ${project.minutes} min</span><span class="chip">C · Zig · C++</span></a>`).join('')}</div><p><a href="#/game-katas">Practice an individual mechanic first</a> · <a href="#/projects">JavaScript build-along projects</a></p>`;
    }

    async function view(id) {
      const project = items.find(item => item.id === id);
      if (!project) return list();
      let language = store.get('gd:nativeProjectLanguage', 'c');
      if (!languages[language]) language = 'c';
      let editor, timer, disposeResults, token = 0;
      H.setCleanup(() => { token++; clearInterval(timer); disposeResults?.(); editor?.destroy(); });
      async function paint() {
        const current = ++token;
        clearInterval(timer); timer = null; disposeResults?.(); disposeResults = null; editor?.destroy(); editor = null;
        app.innerHTML = `<h1>${esc(project.title)}</h1><p>Loading ${esc(languages[language].title)} project files…</p>`;
        let bundle;
        try {
          const response = await fetch(`content/native-projects/${id}-${language}.json`);
          if (!response.ok) throw Error('Could not load this project. Check the connection and retry.');
          bundle = await response.json();
        } catch (error) {
          if (current === token && location.hash === '#/native-project/' + id) app.innerHTML = `<h1>${esc(project.title)}</h1><p role="status">${esc(error.message)}</p><a href="#/native-projects">Back to native projects</a>`;
          return;
        }
        if (current !== token || location.hash !== '#/native-project/' + id) return;
        const draftKey = `gd:nativeProjectFiles:${id}:${language}`;
        const replayKey = `gd:nativeProjectReplay:${id}:${language}`;
        const saved = store.get(draftKey, {}), sources = { ...bundle.starter };
        for (const name of bundle.learnerFiles) if (typeof saved[name] === 'string') sources[name] = saved[name];
        let filename = bundle.learnerFiles[0], replay = null, index = 0;
        document.title = project.title + ' · Playable native project';
        app.innerHTML = `<div class="native-project-page"><div class="crumbs"><a href="#/native-projects">Playable native projects</a> / ${esc(project.title)}</div><div class="page-h gk-heading"><h1>${esc(project.title)}</h1><p>${esc(project.prompt)}</p></div><section class="gk-setup" aria-label="Native project setup"><div class="gk-controls"><label class="gk-field" for="nplanguage"><span>Language</span><select id="nplanguage">${Object.entries(languages).map(([key, value]) => `<option value="${key}" ${key === language ? 'selected' : ''}>${esc(value.title)}</option>`).join('')}</select></label><label class="gk-field" for="npfile"><span>Your mechanics file</span><select id="npfile">${bundle.learnerFiles.map(name => `<option>${esc(name)}</option>`).join('')}</select></label><p class="gk-runtime">Runs as a native terminal game.<br>Your source drives both play and replay export.</p></div><div class="gk-run"><span class="gk-run-label">Build and play</span><pre class="gl-source"><code>${esc(bundle.commands.build)}
${esc(bundle.commands.play)}</code></pre></div></section><section class="tc brk"><label class="lbl gk-editor-label" id="npfilename" for="npcode">${esc(filename)}</label><textarea class="inp gl-code" id="npcode" rows="16" spellcheck="false">${esc(sources[filename])}</textarea><div class="dbar"><button class="btn primary" id="npdownload">Download complete game ZIP</button><button class="btn" id="npreset">Reset this source file</button><button class="btn" id="npreference">Reference and explanation</button>${project.lesson ? `<a class="btn" href="#/lesson/${project.lesson}">Related lesson</a>` : ''}</div><output id="npdownloadstatus" role="status"></output><details><summary>Named native tests</summary><pre class="gl-source"><code>${esc(bundle.commands.test)}</code></pre>${bundle.packageConfig.testNames.map(name => `<h3>${esc(name)}</h3><pre data-native-code><code>${esc(bundle.files[name])}</code></pre>`).join('')}</details><details><summary>Native state API and terminal harness</summary>${bundle.packageConfig.supportNames.map(name => `<h3>${esc(name)}</h3><pre data-native-code><code>${esc(bundle.files[name])}</code></pre>`).join('')}</details><div id="npref" hidden><h2>Why this reference works</h2><p>${esc(bundle.explanation)}</p>${Object.entries(bundle.solution).map(([name, text]) => `<h3>${esc(name)}</h3><pre data-native-code><code>${esc(text)}</code></pre>`).join('')}</div><div id="npresults"></div></section><section class="tc brk" aria-label="Native replay viewer"><h2>See your native game run</h2><p>After editing the downloaded mechanics, build and play the executable. Export a route, then import its output below. The viewer displays frames produced by that program; it does not simulate the game.</p><pre class="gl-source"><code>${esc(bundle.commands.replay)}</code></pre><label class="lbl" for="npreplay">Import replay.ndjson<input class="inp" id="npreplay" type="file" accept=".ndjson,.jsonl,.json,text/plain,application/x-ndjson"></label><output id="npreplaystatus" role="status">No native replay imported.</output><div id="npreplayview" hidden><pre class="gl-source native-replay-board" id="npboard" role="img"></pre><p class="np-replay-legend">${project.kind === 'runner' ? '@ player · # wall · C pickup · G exit' : 'A player · V enemy'}</p><p id="npstats"></p><div class="dbar"><button class="btn" id="npprev">Previous frame</button><button class="btn" id="npplay">Play frames</button><button class="btn" id="npnext">Next frame</button><label class="lbl" for="npframe">Native frame<input id="npframe" type="range" min="0" max="0" value="0"></label></div><pre class="gl-source"><code id="npraw"></code></pre></div></section></div>`;
        editor = NativeCode.editor($('#npcode'), language); NativeCode.highlight(app, language);
        const save = () => { sources[filename] = $('#npcode').value; store.set(draftKey, sources); };
        const editable = () => { save(); return { ...sources }; };
        $('#npcode').oninput = save;
        $('#npfile').onchange = () => { save(); filename = $('#npfile').value; $('#npfilename').textContent = filename; editor.setValue(sources[filename]); };
        $('#nplanguage').onchange = () => { save(); language = $('#nplanguage').value; store.set('gd:nativeProjectLanguage', language); paint(); };
        $('#npreset').onclick = () => { sources[filename] = bundle.starter[filename]; editor.setValue(sources[filename]); save(); };
        $('#npreference').onclick = () => { $('#npref').hidden = !$('#npref').hidden; };
        $('#npdownload').onclick = async () => {
          const button = $('#npdownload'), status = $('#npdownloadstatus'); button.disabled = true;
          const downloadLanguage = language;
          try {
            const files = { ...bundle.files, ...editable() };
            if (window.NativePractice) Object.assign(files, await NativePractice.makePackage({ ...bundle.packageConfig, id: 'native-project-' + id, language: downloadLanguage, files, combine: false }));
            const blob = nativeZip(files), link = document.createElement('a'), objectURL = URL.createObjectURL(blob);
            link.href = objectURL; link.download = `${id}-${downloadLanguage}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(objectURL), 1500);
            status.textContent = 'Game, your mechanics, named tests and terminal harness downloaded. Build it locally to play.';
          } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
        };
        if (window.NativePractice) {
          const pick = names => Object.fromEntries(names.map(name => [name, bundle.files[name]]));
          disposeResults = NativePractice.mountResults({ H, container: $('#npresults'), exerciseId: 'native-project-' + id, language, getFiles: editable, testFiles: { ...pick(bundle.packageConfig.testNames), ...pick(bundle.packageConfig.supportNames) }, packageConfig: { ...bundle.packageConfig, files: bundle.files, combine: false }, editorElement: $('#npcode'), setFiles(files) { for (const name of bundle.learnerFiles) if (typeof files[name] === 'string') sources[name] = files[name]; editor.setValue(sources[filename]); save(); }, markPass({ evidence, report }) { const passes = store.get('gd:nativeProjectPasses', {}); passes[id] = { ...(passes[id] || {}), [language]: { evidence, timestamp: report.timestamp, sourceHash: report.sourceHash } }; store.set('gd:nativeProjectPasses', passes); GameNotebook.outcome('native-project-' + id, 'Imported local native project pass: ' + project.title); }, isCurrent: () => current === token && location.hash === '#/native-project/' + id });
        }
        function drawFrame() {
          const frame = replay.frames[index], rows = [];
          if (project.kind === 'runner') {
            for (let y = 0; y < project.grid.length; y++) {
              let row = '';
              for (let x = 0; x < project.grid[y].length; x++) {
                let cell = project.grid[y][x]; if (cell === 'P') cell = '.';
                if (y === 4 && x === 3 && frame.coins & 1 || y === 4 && x === 5 && frame.coins & 2) cell = '.';
                if (x === frame.x && y === frame.y) cell = '@'; row += cell;
              }
              rows.push(row);
            }
            $('#npstats').textContent = `Native tick ${frame.tick} · position (${frame.x}, ${frame.y}) · pickup mask ${frame.coins} · ${frame.won ? 'WIN' : frame.moved ? 'Moved' : 'Blocked or wait'}`;
          } else {
            for (let y = 0; y < project.height; y++) {
              let row = '|'; for (let x = 0; x < project.width; x++) row += y === project.height - 1 && frame.player === x ? 'A' : frame.enemies.some(enemy => enemy.x === x && enemy.y === y) ? 'V' : '.'; rows.push(row + '|');
            }
            $('#npstats').textContent = `Native tick ${frame.tick} · health ${frame.health} · score ${frame.score}/3 · cooldown ${frame.cooldown} · waves ${frame.waves} · ${frame.won ? 'WIN' : frame.health === 0 ? 'LOSS' : frame.hit ? 'Enemy hit' : frame.fired ? 'Shot fired' : 'Ready'}`;
          }
          const cellStyle = { '@': 'player', A: 'player', V: 'enemy', C: 'pickup', G: 'goal', '#': 'wall', '|': 'wall', '.': 'floor' };
          $('#npboard').innerHTML = rows.map(row => [...row].map(cell => `<span class="np-cell np-cell-${cellStyle[cell] || 'floor'}">${esc(cell)}</span>`).join('')).join('\n'); $('#npboard').setAttribute('aria-label', $('#npstats').textContent);
          $('#npraw').textContent = JSON.stringify(frame, null, 2); $('#npframe').value = index;
          $('#npprev').disabled = index === 0; $('#npnext').disabled = index === replay.frames.length - 1;
        }
        function showReplay(imported, restored = false, retained = true) {
          replay = imported; index = 0; $('#npframe').max = replay.frames.length - 1; $('#npreplayview').hidden = false;
          $('#npreplaystatus').textContent = `${restored ? 'Restored' : 'Imported'} native output: ${replay.header.project} · version ${replay.header.version} · ${languages[replay.header.language].title} · ${replay.frames.length} frames. Project, version and language match. Playback only reads these exported frames.${retained ? '' : ' This large replay is shown for this session only.'}`;
          drawFrame();
        }
        const lastReplay = store.get(replayKey, null);
        if (typeof lastReplay === 'string') {
          try { showReplay(parseReplay(project, language, lastReplay), true); }
          catch { store.set(replayKey, null); $('#npreplaystatus').textContent = 'The saved replay no longer matches this project. Import a fresh native export.'; }
        }
        $('#npreplay').onchange = async event => {
          const input = event.currentTarget;
          clearInterval(timer); timer = null; $('#npplay').textContent = 'Play frames'; $('#npreplayview').hidden = true;
          const file = input.files[0]; if (!file) return;
          try {
            if (file.size > 4 * 1024 * 1024) throw Error('Replay exceeds the 4 MB viewer limit.');
            const text = await file.text(), imported = parseReplay(project, language, text);
            if (current !== token) return;
            const retained = text.length <= 500000;
            store.set(replayKey, retained ? text : null); showReplay(imported, false, retained);
          } catch (error) { if (current === token) $('#npreplaystatus').textContent = error.message; }
          finally { input.value = ''; }
        };
        $('#npprev').onclick = () => { if (index > 0) { index--; drawFrame(); } };
        $('#npnext').onclick = () => { if (replay && index < replay.frames.length - 1) { index++; drawFrame(); } };
        $('#npframe').oninput = () => { if (replay) { index = Number($('#npframe').value); drawFrame(); } };
        $('#npplay').onclick = () => {
          if (timer) { clearInterval(timer); timer = null; $('#npplay').textContent = 'Play frames'; return; }
          if (!replay) return; if (index === replay.frames.length - 1) index = 0;
          $('#npplay').textContent = 'Pause frames'; drawFrame();
          timer = setInterval(() => { if (index < replay.frames.length - 1) { index++; drawFrame(); } else { clearInterval(timer); timer = null; $('#npplay').textContent = 'Play frames'; } }, 300);
        };
      }
      paint();
    }
  });
})();
