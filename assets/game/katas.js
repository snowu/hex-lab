(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  if (window.MODE !== 'gamedev') return;
  const {$, esc, store, app} = H;
  const items = [...GAME_KATAS, ...(window.NATIVE_KATAS?.items || [])];
  const learning = window.GAME_LEARNING || {exercises: {}, paths: [], topics: {}};
  const languages = {c: {label: 'C', ext: 'c'}, zig: {label: 'Zig', ext: 'zig'}, cpp: {label: 'C++', ext: 'cpp'}};
  const byId = new Map(items.map(item => [item.id, item]));
  const metadata = item => learning.exercises[item.slug || item.id] || item;
  const reviews = () => store.get('gd:kataReviews', {});
  const passes = () => store.get('gd:kataPasses', {});
  const evidence = () => store.get('gd:kataEvidence', {});
  const passed = (id, language) => Boolean(passes()[id]?.[language]);
  const preferredLanguage = () => languages[store.get('gd:kataLanguage', 'c')] ? store.get('gd:kataLanguage', 'c') : 'c';
  const recentRecords = () => { const records = store.get('gd:kataRecent', []); return Array.isArray(records) ? records.filter(r => r && byId.has(r.id) && languages[r.language] && Number.isFinite(r.at)) : []; };
  const draftFiles = (id, language) => { const draft = store.get('gd:kataFiles:' + id + ':' + language, {}); return draft && typeof draft === 'object' && !Array.isArray(draft) ? draft : {}; };
  const hasDraft = (id, language) => Object.values(draftFiles(id, language)).some(value => typeof value === 'string' && value.trim());
  const remember = (id, language) => {
    store.set('gd:kataLanguage:' + id, language);
    store.set('gd:kataRecent', [{id, language, at: Date.now()}, ...recentRecords().filter(r => r.id !== id)].slice(0, items.length));
  };
  const recentKatas = () => {
    const records = recentRecords(), seen = new Set(records.map(r => r.id));
    for (const item of items) if (!seen.has(item.id)) {
      const drafts = Object.keys(languages).filter(language => hasDraft(item.id, language));
      if (drafts.length) { const selected = store.get('gd:kataLanguage:' + item.id, preferredLanguage()); const language = drafts.find(language => !passed(item.id, language) && language === selected) || drafts.find(language => !passed(item.id, language)) || drafts[0]; records.push({id: item.id, language, at: 0}); }
    }
    return records.map(record => ({...record, name: byId.get(record.id).title, href: '#/game-kata/' + record.id, solved: passed(record.id, record.language), draft: hasDraft(record.id, record.language), file: store.get('gd:kataFile:' + record.id + ':' + record.language, '') || Object.keys(draftFiles(record.id, record.language))[0] || ''})).sort((a, b) => Number(a.solved) - Number(b.solved));
  };
  const resume = (id, language) => { if (!byId.has(id) || !languages[language]) return; store.set('gd:kataLanguage:' + id, language); store.set('gd:kataLanguage', language); };
  const recentPanel = () => {
    const recent = recentKatas();
    if (!recent.length) return '';
    return `<section class="ikrecent" aria-label="Continue working"><div class="sec-h"><h2>Continue working</h2><span>${recent.filter(r => !r.solved).length} unfinished katas</span></div><p class="muted">Return to the language and editable file you last used. Opening an exercise does not record a pass.</p><div class="ikrecent-grid">${recent.slice(0, 6).map(r => `<a class="ikrecent-card" data-game-resume="${r.id}" data-resume-language="${r.language}" href="${r.href}"><b>${esc(r.name)}</b><span>${r.solved ? 'Pass recorded · revisit' : r.draft ? 'Draft saved · continue' : 'Opened · continue'}</span><small>${languages[r.language].label}${r.file ? ' · ' + esc(r.file) : ''}${r.at ? ' · ' + esc(new Date(r.at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})) : ' · earlier saved draft'}</small></a>`).join('')}</div></section>`;
  };
  const difficulty = item => metadata(item).difficulty || item.difficulty || 1;
  const level = item => difficulty(item) <= 2 ? 'beginner' : difficulty(item) <= 5 ? 'intermediate' : 'advanced';
  const levelLabel = item => level(item)[0].toUpperCase() + level(item).slice(1);
  const missing = (item, language) => (metadata(item).prereqs || []).filter(id => byId.has(id) && !passed(id, language));
  const progress = (path, language) => ({done: path.steps.filter(id => passed(id, language)).length, total: path.steps.length});
  const topicLabel = topic => learning.topics[topic] || topic;
  const status = (item, language) => {
    const record = evidence()[item.id]?.[language];
    if (record?.status === 'failed') return 'Latest local tests failed';
    if (!passed(item.id, language)) return 'Not yet completed';
    return record?.status === 'passed' ? 'Local results imported' : 'Self-reported pass';
  };
  let filter = {q: '', group: 'all', topic: 'all', difficulty: 'all', readiness: 'all', path: 'all', status: 'all'};
  let loadId = 0;
  function orderedPath(item) {
    const selected = learning.paths.find(path => path.id === store.get('gd:kataPath', 'native-basics') && path.steps.includes(item.id));
    return selected || learning.paths.find(path => path.steps.includes(item.id));
  }
  function nextExercise(item, language) {
    const path = orderedPath(item);
    if (path) {
      const position = path.steps.indexOf(item.id);
      const later = path.steps.slice(position + 1).concat(path.steps.slice(0, position));
      const id = later.find(id => !passed(id, language));
      if (id) return {item: byId.get(id), path};
    }
    const topics = metadata(item).topics || [];
    const candidates = items.filter(other => other.id !== item.id && !passed(other.id, language) && (metadata(other).topics || []).some(topic => topics.includes(topic)));
    candidates.sort((a, b) => difficulty(a) - difficulty(b));
    const result = candidates.find(other => difficulty(other) >= difficulty(item)) || candidates[0];
    return result ? {item: result} : null;
  }
  window.GAME_LEARNING_UI = {metadata, progress, nextExercise, missing, items, paths: learning.paths};
  window.GAME_KATA_SR = {recent: recentKatas, resume, due: () => items.filter(item => reviews()[item.id]?.due <= Date.now()).map(item => ({name: item.title, slug: item.id, href: '#/game-kata/' + item.id}))};
  H.routes.push([/^#\/game-katas$/, list], [/^#\/game-path\/([\w-]+)$/, pathView], [/^#\/game-kata\/([\w-]+)$/, view]);

  function languageOptions(language) {
    return Object.entries(languages).map(([value, option]) => `<option value="${value}" ${language === value ? 'selected' : ''}>${option.label}</option>`).join('');
  }
  function pathCards(language) {
    return learning.paths.map(path => {
      const count = progress(path, language);
      const next = path.steps.find(id => !passed(id, language));
      return `<a class="tc gk-path-card" href="#/game-path/${path.id}" data-learning-path="${path.id}"><h3>${esc(path.title)}</h3><p>${esc(path.description)}</p><span class="chip" data-path-progress="${path.id}">${count.done}/${count.total} in ${languages[language].label}</span><span class="muted">${next ? 'Next: ' + esc(byId.get(next)?.title || next) : 'Path completed'}</span></a>`;
    }).join('');
  }
  function list() {
    const language = preferredLanguage(), started = new Set(recentKatas().map(r => r.id));
    document.title = 'Game katas · Hex Lab';
    app.innerHTML = `<div class="page-h"><h1>Game katas</h1><p>${items.length} exercises in C, Zig and C++. Follow a path or explore the entire catalog. Each exercise includes native tests, progressive hints and an explained reference.</p></div>${recentPanel()}<section class="gk-paths" aria-label="Guided learning paths"><div class="gk-section-heading"><h2>Choose a learning path</h2><label class="gk-field" for="gkprogresslanguage"><span>Progress language</span><select id="gkprogresslanguage">${languageOptions(language)}</select></label></div><p class="muted">Progress is counted separately for each language. Suggested prerequisites guide your practice; every exercise stays available.</p><div class="gk-path-grid">${pathCards(language)}</div></section><section aria-label="All native exercises"><h2>Explore all exercises</h2><div class="dbar"><a class="btn" href="#/play/mechanics">Try mechanics in a game</a><input class="inp" id="gkfilter" type="search" aria-label="Search native katas" placeholder="Search exercises, concepts or game uses…" value="${esc(filter.q)}"><select id="gkgroup" aria-label="Exercise collection"><option value="all">All exercises</option><option value="game">Game mechanics</option><option value="catalog">Exercism catalog</option></select><button class="btn" id="gkclear">Clear filters</button></div><div class="gk-filter-grid"><label class="gk-field"><span>Practice status</span><select id="gkstatusfilter" aria-label="Kata practice status"><option value="all">All exercises</option><option value="started">In progress</option><option value="passed">Pass recorded</option></select></label><label class="gk-field"><span>Topic</span><select id="gktopic" aria-label="Kata topic"><option value="all">All topics</option>${Object.entries(learning.topics).map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join('')}</select></label><label class="gk-field"><span>Difficulty</span><select id="gkdifficulty" aria-label="Kata difficulty"><option value="all">All levels</option><option value="beginner">Beginner · 1–2</option><option value="intermediate">Intermediate · 3–5</option><option value="advanced">Advanced · 6–9</option></select></label><label class="gk-field"><span>Suggested preparation</span><select id="gkreadiness" aria-label="Kata prerequisites"><option value="all">All exercises stay accessible</option><option value="ready">Prerequisites practiced</option><option value="practice">Prerequisites to practice</option></select></label><label class="gk-field"><span>Learning path</span><select id="gkpathfilter" aria-label="Filter learning path"><option value="all">All paths and exercises</option>${learning.paths.map(path => `<option value="${path.id}">${esc(path.title)}</option>`).join('')}</select></label></div><p class="muted" id="gkcount" role="status"></p><div class="dgrid" id="gklist"></div></section>`;
    function paint() {
      const selectedPath = learning.paths.find(path => path.id === filter.path);
      const rows = items.filter(item => {
        const meta = metadata(item), needsPractice = missing(item, language).length > 0;
        return (filter.status === 'all' || (filter.status === 'started' ? started.has(item.id) && !passed(item.id, language) : passed(item.id, language))) && (filter.group === 'all' || (filter.group === 'catalog') === Boolean(item.catalog)) &&
          (filter.topic === 'all' || (meta.topics || []).includes(filter.topic)) &&
          (filter.difficulty === 'all' || level(item) === filter.difficulty) &&
          (filter.readiness === 'all' || (filter.readiness === 'practice') === needsPractice) &&
          (!selectedPath || selectedPath.steps.includes(item.id)) &&
          `${item.title} ${item.prompt} ${meta.gameContext || ''} ${(meta.topics || []).map(topicLabel).join(' ')}`.toLowerCase().includes(filter.q.toLowerCase());
      });
      if (selectedPath) rows.sort((a, b) => selectedPath.steps.indexOf(a.id) - selectedPath.steps.indexOf(b.id));
      $('#gkcount').textContent = `${rows.length} of ${items.length} exercises · ${languages[language].label} progress`;
      $('#gklist').innerHTML = rows.map(item => {
        const meta = metadata(item), needs = missing(item, language);
        return `<a class="dcard tc" href="#/game-kata/${item.id}" data-kata-id="${item.id}" data-difficulty="${level(item)}"><h3>${esc(item.title)}</h3><p>${esc(item.prompt)}</p><p class="gk-context">${esc(meta.gameContext || '')}</p><span class="chip">${levelLabel(item)} · ${difficulty(item)}/9</span>${(meta.topics || []).slice(0, 2).map(topic => `<span class="chip">${esc(topicLabel(topic))}</span>`).join('')}<span class="chip gk-pass-status">${status(item, language)}</span><small>${needs.length ? `${needs.length} suggested prerequisite${needs.length === 1 ? '' : 's'} to practice · open access` : 'Ready to practice'}</small>${reviews()[item.id]?.due <= Date.now() ? '<span class="chip">Review due</span>' : ''}</a>`;
      }).join('') || '<p>No exercises match. Clear filters to return to the complete catalog.</p>';
    }
    const controls = {status: '#gkstatusfilter', group: '#gkgroup', topic: '#gktopic', difficulty: '#gkdifficulty', readiness: '#gkreadiness', path: '#gkpathfilter'};
    for (const [key, selector] of Object.entries(controls)) {
      $(selector).value = filter[key];
      $(selector).onchange = () => {filter[key] = $(selector).value; paint();};
    }
    $('#gkfilter').oninput = () => {filter.q = $('#gkfilter').value; paint();};
    $('#gkclear').onclick = () => {filter = {q: '', group: 'all', topic: 'all', difficulty: 'all', readiness: 'all', path: 'all', status: 'all'}; list();};
    $('#gkprogresslanguage').onchange = event => {store.set('gd:kataLanguage', event.target.value); list();};
    app.querySelectorAll('[data-game-resume]').forEach(link => link.onclick = () => resume(link.dataset.gameResume, link.dataset.resumeLanguage));
    paint();
  }
  function pathView(id) {
    const path = learning.paths.find(path => path.id === id);
    if (!path) return list();
    store.set('gd:kataPath', id);
    const language = preferredLanguage(), count = progress(path, language);
    document.title = path.title + ' · Hex Lab';
    app.innerHTML = `<div class="crumbs"><a href="#/game-katas">Game katas</a> / Learning path</div><div class="page-h"><h1>${esc(path.title)}</h1><p>${esc(path.description)}</p></div><div class="gk-section-heading"><p>${esc(path.outcome)}</p><label class="gk-field"><span>Practice language</span><select id="gkpathlanguage">${languageOptions(language)}</select></label></div><p id="gkpathprogress" role="status">${count.done}/${count.total} exercises completed in ${languages[language].label}</p><p class="muted">Suggested order, not a gate. You can open any step and revisit prerequisites whenever useful.</p><ol class="gk-path-steps">${path.steps.map((step, index) => {
      const item = byId.get(step), meta = metadata(item), needs = missing(item, language);
      return `<li data-path-step="${step}"><a href="#/game-kata/${step}"><span class="gk-step-number">${index + 1}</span><div><h2>${esc(item.title)}</h2><p>${esc(meta.gameContext)}</p><span class="chip">${status(item, language)}</span>${needs.length ? `<small>Optional preparation: ${esc(needs.map(id => byId.get(id).title).join(', '))}</small>` : ''}</div></a></li>`;
    }).join('')}</ol>${path.projects?.length ? `<section class="gk-path-projects"><h2>Put the skills into a game</h2><p>Complete your native learner file, compile the project and inspect the resulting gameplay replay.</p>${path.projects.map(project => `<a class="btn" href="${project.href}">${esc(project.title)} →</a>`).join('')}</section>` : ''}${path.practice ? `<p><a class="btn" href="${path.practice.href}">${esc(path.practice.title)} →</a></p>` : ''}`;
    $('#gkpathlanguage').onchange = event => {store.set('gd:kataLanguage', event.target.value); pathView(id);};
  }
  async function json(url) {
    const response = await fetch(url);
    if (!response.ok) throw Error('Could not load exercise files. Check your connection and retry.');
    return response.json();
  }
  function apiInfo(bundle, language) {
    const entries = Object.entries(bundle.starter || {});
    const headers = entries.filter(([name]) => /\.(h|hpp)$/.test(name));
    const selected = headers.length ? headers : entries;
    const signatures = [];
    for (const [, text] of selected) {
      const pattern = language === 'zig' ? /(?:pub\s+)?fn\s+\w+\s*\([^{}]*?\)[^{}\n]*?(?=\s*\{)/g : /(?:^|\n)\s*(?:(?:static|inline|constexpr|extern)\s+)*[\w:*<>\[\]&,\s]+?\b\w+\s*\([^;{}]*\)\s*(?:const)?\s*(?=;|\{)/g;
      for (const match of text.matchAll(pattern)) {
        const signature = match[0].trim().replace(/\s+/g, ' ');
        if (!signature.includes('#include') && !signature.startsWith('if ') && signature.length < 350) signatures.push(signature);
      }
    }
    return [...new Set(signatures)].slice(0, 4);
  }
  function ownershipInfo(bundle, language, item) {
    if (metadata(item).ownership?.[language]) return metadata(item).ownership[language];
    const sources = Object.values(bundle.solution || {}).join('\n');
    if (language === 'zig') {
      if (/Allocator|allocator/.test(sources)) return 'This Zig variant names an allocator in its API. Track every returned allocation and the corresponding free/deinit calls in the tests; const input slices are borrowed. An error return must also release any temporary allocation.';
      if (/\[\]u\d+|\[\]Tile/.test(sources)) return 'This Zig variant uses slices over caller-owned storage. Keep the slice alive for the call and mutate only the output or mutable slices the API identifies; a slice alone does not allocate or own its backing memory.';
      return 'This Zig variant uses typed values and explicitly borrowed inputs. Inspect any deinit methods before sharing a stateful value; scalar results need no allocator or cleanup.';
    }
    if (language === 'cpp') {
      if (/std::(?:vector|string|unique_ptr|shared_ptr)\b/.test(sources)) return 'This C++ variant uses owning standard containers or smart pointers for results/state. Their destructors release storage. References, spans and views borrow existing data, so keep the owner alive and distinguish a returned owning value from a view.';
      if (/\bnew\b|\bdelete\b|malloc\(/.test(sources)) return 'This C++ variant exposes an allocation/lifecycle API rather than hiding all ownership in a returned value. Pair construction with the release function shown in its tests; borrowed pointers do not transfer ownership.';
      return 'This C++ variant borrows input references, spans or pointers and/or returns scalar values. Caller-supplied output remains caller-owned. Const inputs must remain unchanged; use the declared interface rather than replacing it with a different ownership model.';
    }
    if (/malloc\(|calloc\(|realloc\(/.test(sources)) return 'This C variant allocates some result or state storage explicitly. Pair each successful construction with the free/destroy routine in its tests, and release partial allocations on failure. Input pointers remain borrowed unless the header states otherwise.';
    return 'This C variant uses scalar results and/or caller-owned buffers. Pointer/length pairs describe borrowed storage; honor output capacity, keep input storage alive, and do not free memory supplied by the caller. State mutations must follow the declared API.';
  }
  function nextMarkup(item, language) {
    const next = nextExercise(item, language), path = orderedPath(item);
    return `${path ? `<a href="#/game-path/${path.id}">View ${esc(path.title)}</a>` : ''}${next ? `<a class="btn primary" id="gknext" href="#/game-kata/${next.item.id}">Next exercise: ${esc(next.item.title)} →</a><p class="muted">${next.path ? 'Next unfinished step in ' + esc(next.path.title) : 'Related practice in the same topic'} · ${languages[language].label}</p>` : '<p>Related practice completed in this language. Choose another path or revisit the catalog.</p>'}`;
  }
  async function view(id) {
    const item = byId.get(id);
    if (!item) return list();
    const meta = metadata(item), route = '#/game-kata/' + id;
    let language = store.get('gd:kataLanguage:' + id, preferredLanguage()), token = ++loadId, editor, saveCurrent = () => {}, disposers = [];
    if (!languages[language]) language = preferredLanguage();
    const dispose = () => {saveCurrent(); editor?.destroy(); editor = null; for (const cleanup of disposers) cleanup?.(); disposers = [];};
    async function paint() {
      dispose();
      const current = ++token, activeLanguage = language;
      const isCurrent = () => location.hash === route && current === token && language === activeLanguage;
      app.innerHTML = `<div class="crumbs"><a href="#/game-katas">Game katas</a> / ${esc(item.title)}</div><p>Loading ${languages[language].label} files…</p>`;
      let bundle, instructions = '', support = {}, license = '';
      try {
        if (item.catalog) {
          bundle = await json(`content/katas/native/${item.slug}-${language}.json`);
          support = await json(`content/katas/native/support/${bundle.support}.json`);
          instructions = bundle.instructions || '';
          const text = await fetch(`content/katas/native/LICENSE-${bundle.derivedFrom ? 'c' : language}.txt`);
          if (!text.ok) throw Error('Could not load exercise license');
          license = await text.text();
          const original = await fetch('content/katas/LICENSE-exercism.txt');
          if (!original.ok) throw Error('Could not load original exercise license');
          license += '\n\nOriginal exercise specifications and Python-derived ports:\n' + await original.text();
        } else {
          const native = item.native[language];
          bundle = {starter: {[id + '.' + languages[language].ext]: native.starter}, solution: {[id + '.' + languages[language].ext]: native.solution}, tests: {[language === 'zig' ? id + '_test.zig' : 'test_' + id + '.' + languages[language].ext]: native.tests}, authors: ['Hex Lab'], source: 'Original Hex Lab exercise'};
          instructions = item.prompt;
        }
      } catch (failure) {
        if (isCurrent()) app.innerHTML = `<h1>${esc(item.title)}</h1><p role="status">${esc(failure.message)}</p><a href="#/game-katas">Back to katas</a>`;
        return;
      }
      if (!isCurrent()) return;
      remember(id, language);
      const names = Object.keys(bundle.starter), draftKey = 'gd:kataFiles:' + id + ':' + language;
      const fileKey = 'gd:kataFile:' + id + ':' + language, draft = store.get(draftKey, {});
      const code = Object.fromEntries(names.map(name => [name, typeof draft[name] === 'string' ? draft[name] : bundle.starter[name]]));
      let filename = names.includes(store.get(fileKey, '')) ? store.get(fileKey, '') : names.find(name => name.endsWith('.' + languages[language].ext)) || names[0];
      const single = !item.catalog;
      const sourceNames = Object.keys({...bundle.starter, ...bundle.tests, ...support}).filter(name => name.endsWith(language === 'cpp' ? '.cpp' : '.c'));
      const command = single ? language === 'zig' ? `zig test ${id}.zig` : `${language === 'c' ? 'cc -std=c17' : 'c++ -std=c++20'} ${id}.${languages[language].ext} -lm -o kata && ./kata` : language === 'zig' ? `zig test ${Object.keys(bundle.tests).find(name => name.endsWith('.zig'))}` : `${language === 'c' ? 'cc -std=c17' : 'c++ -std=c++20'} -DEXERCISM_RUN_ALL_TESTS -DUNITY_INCLUDE_DOUBLE -DCATCH_CONFIG_NO_POSIX_SIGNALS ${sourceNames.join(' ')} -pthread -lm -o kata && ./kata`;
      const needs = missing(item, language), signatures = apiInfo(bundle, language);
      document.title = `${item.title} (${languages[language].label}) · Game katas`;
      app.innerHTML = `<div class="crumbs"><a href="#/game-katas">Game katas</a> / ${esc(item.title)}</div><div class="page-h gk-heading"><h1>${esc(item.title)}</h1><p>${esc(item.prompt)}</p><span class="chip">${levelLabel(item)} · ${difficulty(item)}/9</span>${(meta.topics || []).map(topic => `<span class="chip">${esc(topicLabel(topic))}</span>`).join('')}<p class="gk-context">${esc(meta.gameContext || '')}</p></div><section class="gk-setup" aria-label="Exercise setup"><div class="gk-controls"><label class="gk-field" for="gklanguage"><span>Language</span><select id="gklanguage" aria-label="Kata language">${languageOptions(language)}</select></label><label class="gk-field" for="gkfile"><span>Editable file</span><select id="gkfile" aria-label="Source file">${names.map(name => `<option ${name === filename ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><p class="gk-runtime">${language === 'zig' ? 'Zig 0.17.0 · ' : ''}Native code runs locally.<br>Manual completion is self-reported.</p></div><div class="gk-run"><span class="gk-run-label">Run locally</span><pre class="gl-source"><code id="gkcommand">${esc(command)}</code></pre></div><div class="gk-expected-failure"><h3>Start with a failing test</h3><p>The starter is intentionally incomplete. A failing assertion or TODO panic is expected before implementation. Fix compilation/linking errors first, then use the first failing case to choose your next change. Record a pass only after the entire test program exits successfully.</p></div></section><section class="gk-preparation" aria-label="Suggested prerequisites"><h2>Suggested preparation</h2>${(meta.prereqs || []).length ? `<p>These are helpful practice, not requirements. Every exercise remains open.</p><ul>${meta.prereqs.map(prerequisite => `<li><a href="#/game-kata/${prerequisite}">${esc(byId.get(prerequisite)?.title || prerequisite)}</a> · ${passed(prerequisite, language) ? 'practiced in ' + languages[language].label : 'optional practice in ' + languages[language].label}</li>`).join('')}</ul>` : '<p>You can start here. Read the API, predict one example, and run the starter tests.</p>'}</section>${meta.examples?.length ? `<section class="gk-examples" aria-label="Input and output examples"><h2>Predict the result</h2><table><thead><tr><th>Input</th><th>Expected output</th></tr></thead><tbody>${meta.examples.map(example => `<tr><td><code>${esc(example.input)}</code></td><td><code>${esc(example.output)}</code></td></tr>`).join('')}</tbody></table></section>` : ''}${instructions ? `<details><summary>Full exercise instructions</summary><pre class="gl-instructions">${esc(instructions)}</pre><p>The native API, ownership and error behavior are specified in the source headers and tests below.</p></details>` : ''}<section class="tc brk"><label class="lbl gk-editor-label" id="gkfilename" for="gkcode">${esc(filename)}</label><textarea class="inp gl-code" id="gkcode" rows="14" spellcheck="false">${esc(code[filename])}</textarea><div class="dbar"><button class="btn primary" id="gkdownload">${single ? 'Download code + tests' : 'Download project ZIP'}</button><button class="btn" id="gkreset">Reset starter</button><button class="btn" id="gkhint" aria-expanded="false" aria-controls="gkhintout">Hint</button><button class="btn" id="gksolution" aria-expanded="false" aria-controls="gkref">Reference</button><button class="btn" id="gkpass">My local tests pass</button><button class="btn" id="gkshaky">Mark shaky</button>${H.askBtn(`I am learning ${item.title} in ${languages[language].label}. ${item.prompt} ${meta.gameContext || ''} Give me a conceptual hint and edge cases, not the solution.`, 'Ask tutor')}</div><section id="gkhintout" class="gk-hints" hidden aria-label="Progressive hints"><h2>Hints, one step at a time</h2><ol id="gkhintsteps"></ol><button class="btn" id="gkhintnext">Reveal strategy hint</button><p class="muted">Try the current hint before revealing another. Hints do not replace the native test contract.</p></section><section id="gkref" class="gk-reference" hidden><h2>How the reference works</h2><p>${esc(meta.explanation || meta.strategy || '')}</p><h3>Ownership in ${languages[language].label}</h3><p>${esc(ownershipInfo(bundle, language, item))}</p><h3>Complexity</h3><p>${esc(meta.complexity || '')}</p><h3>Tradeoff to discuss</h3><p>${esc(meta.tradeoffs || '')}</p>${Object.entries(bundle.solution).map(([name, text]) => `<h3>${esc(name)}</h3><pre data-native-code><code>${esc(text)}</code></pre>`).join('')}</section><details><summary>Native tests</summary>${Object.entries(bundle.tests).map(([name, text]) => `<h3>${esc(name)}</h3><pre data-native-code><code>${esc(text)}</code></pre>`).join('')}</details><div id="gkextensions"></div><output id="gkresult" class="gk-result" role="status"></output><p id="gkevidence" class="muted">${status(item, language)} in ${languages[language].label}. Imported local results describe the tested source; manual completion does not run a compiler.</p><nav class="gk-related" aria-label="Continue learning"><div id="gknextarea">${nextMarkup(item, language)}</div>${item.lesson ? `<a class="btn" href="#/lesson/${item.lesson}">Related lesson →</a>` : ''}</nav>${item.catalog ? `<p class="muted">${esc(bundle.source)} · ${esc((bundle.authors || []).join(', '))}${bundle.ref ? ' · pinned ' + esc(bundle.ref.slice(0, 12)) : ''}</p>` : ''}</section>`;
      editor = NativeCode.editor($('#gkcode'), language);
      NativeCode.highlight(app, language);
      const save = () => {if (!isCurrent()) return; code[filename] = $('#gkcode').value; store.set(draftKey, code);};
      saveCurrent = save;
      const setFiles = files => {
        if (!isCurrent()) return;
        for (const name of names) if (typeof files[name] === 'string') code[name] = files[name];
        editor.setValue(code[filename]);
        store.set(draftKey, code); remember(id, language);
      };
      const getFiles = () => {save(); return {...code};};
      function markPass(options = {}) {
        if (!isCurrent()) return;
        save();
        const all = reviews(), previous = all[id], now = Date.now(), recorded = passes();
        const first = !recorded[id]?.[language];
        if (first || !previous || previous.due <= now) {
          const box = first ? 0 : Math.min(4, previous.box + 1);
          all[id] = {box, due: now + [2,5,14,30,60][box] * 864e5};
          store.set('gd:kataReviews', all); H.logAct('kata');
        }
        recorded[id] = {...recorded[id], [language]: now}; store.set('gd:kataPasses', recorded);
        if (options.evidence === 'local-report' && options.report) {
          const records = evidence(), report = options.report;
          records[id] = {...records[id], [language]: {...records[id]?.[language], status: report.status, stage: report.stage, sourceHash: report.sourceHash, testHash: report.testHash, timestamp: report.timestamp}};
          store.set('gd:kataEvidence', records);
        }
        GameNotebook.outcome('kata-' + id, 'Completed local kata: ' + item.title);
        $('#gkresult').textContent = `${languages[language].label} local pass recorded${options.evidence === 'local-report' ? ' from imported results' : ' (self-reported)'}. Review scheduled for ${new Date(all[id].due).toLocaleDateString()}.`;
        $('#gkevidence').textContent = `${status(item, language)} in ${languages[language].label}.`;
        $('#gkpass').disabled = true;
        $('#gknextarea').innerHTML = nextMarkup(item, language);
      }
      $('#gkcode').oninput = () => {save(); remember(id, language);};
      $('#gkfile').onchange = () => {save(); filename = $('#gkfile').value; store.set(fileKey, filename); remember(id, language); $('#gkfilename').textContent = filename; editor.setValue(code[filename]);};
      $('#gklanguage').onchange = () => {save(); language = $('#gklanguage').value; store.set('gd:kataLanguage', language); paint();};
      $('#gkdownload').onclick = () => {
        save();
        if (single) {GameDownload(`// ${item.title}\n// Run: ${command}\n${code[filename]}\n\n// Tests\n${Object.values(bundle.tests).join('\n')}`, id + '.' + languages[language].ext, 'text/plain'); return;}
        const readme = `# ${item.title} (${languages[language].label})\n\nEdit the source files, then run:\n\n${command}\n\n${language === 'zig' ? 'Requires Zig 0.17.0.' : ''}\n\n${bundle.source}\nPinned revision: ${bundle.ref || 'original native port'}\nAuthors: ${(bundle.authors || []).join(', ')}\nContributors: ${(bundle.contributors || []).join(', ')}\n`;
        const blob = nativeZip({...code, ...bundle.tests, ...support, 'README.md': readme, 'LICENSE': license, 'INSTRUCTIONS.md': instructions}), url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = `${item.slug}-${language}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      $('#gkreset').onclick = () => {code[filename] = bundle.starter[filename]; editor.setValue(code[filename]); save();};
      let hintCount = 1;
      const hints = meta.hints || item.hints || [item.hint];
      function paintHints() {
        const labels = ['Concept', 'Strategy', 'API and edge cases'];
        $('#gkhintsteps').innerHTML = hints.slice(0, hintCount).map((hint, index) => `<li><h3>${labels[index]}</h3><p>${esc(hint)}</p>${index === 2 ? `<p>${esc(ownershipInfo(bundle, language, item))}</p>${signatures.length ? `<p>Declared native API:</p><pre><code>${esc(signatures.join('\n'))}</code></pre>` : ''}` : ''}</li>`).join('');
        $('#gkhintnext').hidden = hintCount >= hints.length;
        $('#gkhintnext').textContent = hintCount === 1 ? 'Reveal strategy hint' : 'Reveal API and edge cases';
      }
      paintHints();
      $('#gkhint').onclick = () => {$('#gkhintout').hidden = !$('#gkhintout').hidden; $('#gkhint').setAttribute('aria-expanded', String(!$('#gkhintout').hidden));};
      $('#gkhintnext').onclick = () => {hintCount = Math.min(hints.length, hintCount + 1); paintHints();};
      $('#gksolution').onclick = () => {$('#gkref').hidden = !$('#gkref').hidden; $('#gksolution').setAttribute('aria-expanded', String(!$('#gkref').hidden));};
      $('#gkshaky').onclick = () => {const all = reviews(); all[id] = {box: 0, due: Date.now() + 864e5}; store.set('gd:kataReviews', all); $('#gkresult').textContent = 'Review scheduled for tomorrow.';};
      $('#gkpass').onclick = () => markPass();
      for (const mount of window.GAME_KATA_EXTENSIONS || []) {
        const cleanup = mount({H, item, language, bundle, support, license, instructions, command, save, getFiles, setFiles, markPass, container: $('#gkextensions'), editorElement: $('#gkcode'), isCurrent});
        if (typeof cleanup === 'function') disposers.push(cleanup);
      }
    }
    const beforeUnload = () => saveCurrent();
    addEventListener('beforeunload', beforeUnload);
    H.setCleanup(() => {saveCurrent(); token++; dispose(); removeEventListener('beforeunload', beforeUnload);});
    paint();
  }
});
