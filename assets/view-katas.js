/* Katas: Exercism's Python practice exercises (MIT), run in the browser with their own unittest suites.
   Other languages: the same exercise via the Exercism CLI, plus AI feedback on a pasted solution. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  const { $, $$, esc, store, ic, app, toast, hueOf, askBtn, logAct } = H;
  const DATA = window.KATAS;
  if (!DATA) return;
  const ITEMS = DATA.items, BY = Object.fromEntries(ITEMS.map((k) => [k.slug, k]));
  const lid = (slug) => 'kata-' + slug;
  const solved = (slug) => !!((H.getProgress()[lid(slug)] || {}).c0);
  const band = (d) => (d <= 2 ? 'easy' : d <= 4 ? 'medium' : 'hard');
  const BANDS = [['all', 'All'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
  /* Classics that map well to backend interviews: parsing, graphs, state machines, data-structure design. */
  const PICKS = new Set(['two-bucket', 'knapsack', 'word-search', 'dominoes', 'linked-list', 'simple-linked-list', 'binary-search-tree', 'circular-buffer', 'bank-account', 'custom-set', 'rest-api', 'forth', 'tournament', 'anagram', 'alphametics', 'change', 'book-store', 'minesweeper', 'connect', 'go-counting', 'sublist', 'grep', 'react', 'satellite', 'pov', 'binary-search', 'sieve', 'list-ops', 'transpose', 'wordy', 'tree-building', 'bowling', 'poker', 'zipper', 'variable-length-quantity', 'robot-simulator', 'word-count']);
  for (const s of [...PICKS]) if (!BY[s]) PICKS.delete(s);
  // Ordered practice sequences: each introduces a pattern before combining it with state.
  const PATHS = [
    { id: 'collections', name: 'Collections & lookup', focus: 'Choose structures, maintain invariants and explain lookup costs.', slugs: ['word-count', 'anagram', 'binary-search', 'custom-set', 'linked-list', 'circular-buffer'] },
    { id: 'parsing', name: 'Parsing & validation', focus: 'Separate tokenization, validation and evaluation; handle malformed inputs.', slugs: ['wordy', 'matching-brackets', 'variable-length-quantity', 'grep', 'forth'] },
    { id: 'search', name: 'Search & optimization', focus: 'Model states, prune repeated work and justify time and space costs.', slugs: ['word-search', 'minesweeper', 'two-bucket', 'knapsack', 'change', 'connect'] },
    { id: 'state', name: 'State & API design', focus: 'Define legal transitions and preserve invariants across operation sequences.', slugs: ['robot-simulator', 'bank-account', 'react', 'rest-api', 'bowling'] },
    { id: 'trees', name: 'Trees & ownership', focus: 'Describe traversal order, identity, mutation and persistent alternatives.', slugs: ['binary-search-tree', 'tree-building', 'satellite', 'pov', 'zipper'] },
  ].map((p) => ({ ...p, slugs: p.slugs.filter((slug) => BY[slug]) }));
  const COACH = {
    'binary-search': ['Maintain a half-open search interval containing every remaining candidate.', 'Compare the midpoint and discard the half that cannot contain the target.', 'Return the original index; explicitly handle an empty interval and a missing value.', 'A sorted input permits halving the candidate interval. Iterative search takes O(log n) comparisons and O(1) auxiliary space; linear search needs no sorted precondition.', 'Duplicates: specify which matching index is allowed. Test first, last, absent and empty cases.'],
    'word-count': ['Decide which characters belong to a token before counting.', 'Normalize case once, then count tokens in a dictionary.', 'Check apostrophes inside words separately from punctuation at word boundaries.', 'A single scan plus dictionary updates is O(n) expected time, with O(u) storage for distinct words. Token rules matter as much as the counting loop.', 'Explain how punctuation and case affect token identity; avoid replacing all punctuation with nothing.'],
    'anagram': ['Two words match only if their letter multiplicities match.', 'Normalize case and exclude the original word before comparing candidates.', 'A frequency map or sorted letters can be the canonical signature.', 'Sorting a length-m word costs O(m log m); a frequency signature is O(m) with space proportional to the alphabet. Case-insensitive identity is checked separately.', 'Repeated letters distinguish set equality from multiset equality.'],
    'two-bucket': ['Treat the two current water levels as a search state.', 'Generate only legal fill, empty and pour transitions.', 'Use breadth-first search with a visited set to find the fewest moves; respect the designated first bucket.', 'Breadth-first search discovers minimum-length paths when each operation costs one move. A visited set prevents cycles; the capacities bound the state space.', 'Explain why DFS does not guarantee the fewest moves.'],
    'knapsack': ['A greedy choice by value or ratio can miss the optimal subset.', 'For each item, compare excluding it with including it when capacity permits.', 'In a one-dimensional capacity table, iterate capacities downward so each item is used once.', 'Dynamic programming tracks the best value for each capacity. For n items and capacity C it takes O(nC) time and O(C) space; this is pseudo-polynomial in the numeric capacity.', 'Distinguish 0/1 selection from unlimited reuse and mention large-capacity tradeoffs.'],
    'circular-buffer': ['Keep read position, write position and occupied count consistent.', 'A full buffer and an empty buffer can have identical indices: store enough state to tell them apart.', 'Wrap indices modulo capacity and define what overwrite does to the oldest entry.', 'Fixed-capacity storage supports O(1) read/write/overwrite. Tracking size prevents ambiguous index equality and makes empty/full behavior explicit.', 'Test wraparound, overwrite on full, clear, and reuse after clear.'],
    'bank-account': ['Write down the closed/open lifecycle before arithmetic.', 'Validate the operation while protecting the same state that you modify.', 'Balance reads, deposits, withdrawals and lifecycle changes must share a consistent synchronization policy.', 'A lock around the complete validation-and-update operation protects the balance invariant. Thread-safe arithmetic alone cannot protect account lifecycle transitions.', 'Discuss rejected operations, atomicity and whether a caller can observe stale state.'],
    'matching-brackets': ['Only unmatched opening brackets need to be remembered.', 'Closing brackets must match the most recent unmatched opening bracket.', 'Reject an empty stack on closing; finish with an empty stack.', 'A stack models nested structure in O(n) time and O(d) space for maximum nesting depth. Counting bracket totals cannot detect incorrect order.', 'Use crossed pairs, unmatched prefixes and non-bracket characters as tests.'],
    'wordy': ['Identify legal tokens before attempting arithmetic.', 'Validate the grammar rather than evaluating arbitrary source text.', 'Apply operations in the order required by the exercise; do not assume normal operator precedence.', 'Separating parsing from evaluation keeps malformed inputs out of the arithmetic stage. A left-to-right token scan is linear in input length.', 'Explain how you reject incomplete expressions and unknown operations safely.'],
    'react': ['Separate stored input values from values computed by dependencies.', 'Only notify observers when the effective computed value changes.', 'Propagate updates in dependency order and deduplicate callbacks for one input change.', 'A dependency graph makes recomputation explicit. Cached values suppress redundant notifications, while ownership and callback removal need their own contracts.', 'Discuss cycles, callback order and repeated assignments of the same input.'],
  };
  const pathFor = (slug) => PATHS.find((p) => p.slugs.includes(slug));
  const coaching = (k) => COACH[k.slug] || [
    'Translate the specification into an input/output contract. Identify the smallest case and one boundary before coding.',
    'Run the starter tests and inspect the first failing case. Make one behavior correct before adding more branches.',
    'Trace a nontrivial example by hand. Name the invariant your loop or state transition must preserve.',
    'Compare the reference with your approach: identify its main operation, count how often that operation runs, and account for retained memory.',
    'Explain your assumptions, a counterexample to a simpler approach, and one test you would add beyond the supplied suite.',
  ];
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = 'assets/interview-katas.css'; document.head.appendChild(style);
  const TRACKS = [['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['go', 'Go'], ['rust', 'Rust'], ['java', 'Java'], ['kotlin', 'Kotlin'], ['csharp', 'C#'], ['ruby', 'Ruby'], ['cpp', 'C++'], ['elixir', 'Elixir'], ['php', 'PHP'], ['swift', 'Swift']];
  /* ---------- spaced repetition: a solved kata comes back after 2, 5, 14, 30, 60 days; passing it again once due moves it up a box ---------- */
  const SR_KEY = 'kreview', SR_DAYS = [2, 5, 14, 30, 60], DAY = 864e5;
  const srAll = () => store.get(SR_KEY, {});
  const isDue = (slug) => { const r = srAll()[slug]; return !!r && r.due <= Date.now(); };
  const dueKatas = () => ITEMS.filter((k) => isDue(k.slug)).sort((a, b) => srAll()[a.slug].due - srAll()[b.slug].due);
  const inDays = (ms) => { const d = Math.max(1, Math.round(ms / DAY)); return d === 1 ? 'tomorrow' : `in ${d} days`; };
  /** called whenever the tests all pass; returns what happened so the page can say it */
  function recordPass(slug) {
    const all = srAll(), r = all[slug], now = Date.now();
    if (!r) { all[slug] = { box: 0, due: now + SR_DAYS[0] * DAY, last: now, n: 1 }; store.set(SR_KEY, all); logAct('kata'); return { kind: 'new', text: `Review scheduled ${inDays(SR_DAYS[0] * DAY)}.` }; }
    if (r.due <= now) { r.box = Math.min(SR_DAYS.length - 1, r.box + 1); r.due = now + SR_DAYS[r.box] * DAY; r.last = now; r.n = (r.n || 1) + 1; store.set(SR_KEY, all); logAct('kata'); return { kind: 'advanced', text: `Review done. Next one ${inDays(SR_DAYS[r.box] * DAY)}.` }; }
    return { kind: 'early', text: `Solved again. Your next review is ${inDays(r.due - now)}.` };
  }
  const shaky = (slug) => { const all = srAll(); all[slug] = { box: 0, due: Date.now() + DAY, last: Date.now(), n: (all[slug] && all[slug].n) || 1 }; store.set(SR_KEY, all); };
  const srLine = (slug) => { const r = srAll()[slug]; return !r ? '' : r.due <= Date.now() ? 'Due for review now: solve it again from scratch to move it up.' : `Next review ${inDays(r.due - Date.now())}.`; };
  window.KATA_SR = { due: dueKatas, isDue, recordPass };
  H.routes.push([/^#\/katas$/, () => window.MODE === 'gamedev' ? (location.hash = '#/game-katas') : viewKatas()], [/^#\/kata\/([\w-]+)$/, (slug) => window.MODE === 'gamedev' ? (location.hash = '#/game-kata/exercism-' + slug) : viewKata(slug)]);

  /* ---------- small, safe markdown for the exercise instructions ---------- */
  function inline(text) {
    return text.split(/(`[^`\n]+`)/g).map((part) => {
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return `<code>${esc(part.slice(1, -1))}</code>`;
      return esc(part)
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
        .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }).join('');
  }
  function md(src) {
    /* reference-style links: "[text][label]" / "[text][]" with "[label]: https://…" definitions elsewhere in the text */
    /* Exercism's own callout syntax: ~~~~exercism/caution ... ~~~~ (also note, important, advanced) */
    src = String(src).replace(/~~~~exercism\/(\w+)\s+([\s\S]*?)\s*~~~~/g, (_, kind, body) => `\n> **${kind[0].toUpperCase() + kind.slice(1)}:** ${body.replace(/\s*\n\s*/g, ' ')}\n`);
    const refs = {};
    src = String(src).replace(/^\[([^\]]+)\]:\s*(https?:\/\/\S+)\s*$/gm, (_, l, u) => { refs[l.toLowerCase()] = u; return ''; })
      .replace(/\[([^\]\n]+)\]\[([^\]\n]*)\]/g, (m, text, label) => { const u = refs[(label || text).toLowerCase()]; return u ? `[${text}](${u})` : m; });
    const out = [];
    let list = null, para = [], code = null, quote = [];
    const endPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
    const endList = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
    const endQuote = () => { if (quote.length) { out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`); quote = []; } };
    const flush = () => { endPara(); endList(); endQuote(); };
    for (const line of String(src).replace(/\r/g, '').split('\n')) {
      if (code) { if (/^```/.test(line)) { out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`); code = null; } else code.push(line); continue; }
      if (/^```/.test(line)) { flush(); code = []; continue; }
      const h = /^(#{1,6})\s+(.*)$/.exec(line), ul = /^\s*[-*]\s+(.*)$/.exec(line), ol = /^\s*\d+[.)]\s+(.*)$/.exec(line), bq = /^>\s?(.*)$/.exec(line);
      if (!line.trim()) { flush(); continue; }
      if (h) { flush(); const n = Math.min(4, h[1].length + 1); out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }
      if (ul || ol) { endPara(); endQuote(); const t = ul ? 'ul' : 'ol'; if (!list || list.t !== t) { endList(); list = { t, items: [] }; } list.items.push((ul || ol)[1]); continue; }
      if (bq) { endPara(); endList(); quote.push(bq[1]); continue; }
      if (list && /^\s+\S/.test(line)) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
      endList(); endQuote(); para.push(line.trim());
    }
    if (code) out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
    flush();
    return out.join('\n');
  }

  /* ---------- index ---------- */
  const view = { q: '', band: 'all', status: 'all', picks: false, path: 'all' };
  function viewKatas() {
    const done = ITEMS.filter((k) => solved(k.slug)).length;
    const activePath = PATHS.find((p) => p.id === view.path);
    const dueNow = dueKatas(), next = (activePath && activePath.slugs.map((slug) => BY[slug]).find((k) => !solved(k.slug))) || dueNow[0] || ITEMS.find((k) => PICKS.has(k.slug) && !solved(k.slug)) || ITEMS.find((k) => !solved(k.slug));
    const rows = () => ITEMS.filter((k) =>
      (view.band === 'all' || band(k.difficulty) === view.band) &&
      (view.status === 'all' || (view.status === 'due' ? isDue(k.slug) : (view.status === 'solved') === solved(k.slug))) &&
      (!view.picks || PICKS.has(k.slug)) &&
      (view.path === 'all' || PATHS.find((p) => p.id === view.path)?.slugs.includes(k.slug)) &&
      (!view.q || (k.slug + ' ' + k.name + ' ' + k.blurb).toLowerCase().includes(view.q)));
    app.innerHTML = `<div class="page-h"><h1>Code katas</h1><p>${ITEMS.length} practice exercises with real unit tests, run in your browser (Python). Build an approach, test edge cases, then explain complexity and tradeoffs. Python runs here; other languages run locally through Exercism.</p></div>
      <div class="kstats tc"><div><b>${done}</b><span>solved of ${ITEMS.length}${dueNow.length ? ` · <b class="kdue">${dueNow.length} due for review</b>` : ''}</span></div><span class="mbar"><i style="width:${Math.round((done / ITEMS.length) * 100)}%"></i></span>
        ${next ? `<a class="btn primary" href="#/kata/${next.slug}">${ic('play', 15)} ${isDue(next.slug) ? 'Review' : done ? 'Next' : 'Start'}: ${esc(next.name)}</a>` : ''}<button class="btn" id="krand">${ic('rotate', 15)} Random kata</button></div>
      <section class="ikpaths" aria-label="Interview practice paths"><div class="ikpaths-head"><h2>Practise a pattern</h2><button class="btn ghost sm" id="kallpaths" aria-pressed="${view.path === 'all'}">All exercises</button></div><div class="ikpath-grid">${PATHS.map((p) => `<button class="ikpath tc ${view.path === p.id ? 'on' : ''}" data-path="${p.id}" aria-pressed="${view.path === p.id}"><b>${esc(p.name)}</b><span>${esc(p.focus)}</span><small>${p.slugs.filter(solved).length}/${p.slugs.length} solved</small></button>`).join('')}</div></section>
      <div class="kfilters"><input id="kq" class="inp" type="search" placeholder="Search katas…" value="${esc(view.q)}" aria-label="Search katas">
        ${BANDS.map(([k, n]) => `<button class="fchip ${view.band === k ? 'on' : ''}" data-b="${k}" aria-pressed="${view.band === k}">${n}</button>`).join('')}<span class="ksep"></span>
        ${[['all', 'Any status'], ['todo', 'To do'], ['solved', 'Solved'], ['due', 'Due']].map(([k, n]) => `<button class="fchip ${view.status === k ? 'on' : ''}" data-s="${k}" aria-pressed="${view.status === k}">${n}</button>`).join('')}<span class="ksep"></span>
        <button class="fchip ${view.picks ? 'on' : ''}" id="kpicks" aria-pressed="${view.picks}" title="Parsing, graphs, state machines and data structures">${window.MODE === 'gamedev' ? 'Practice picks' : 'Interview picks'}</button></div>
      <div id="klist"></div>
      <p class="muted kcredit">Exercises from <a href="https://exercism.org" target="_blank" rel="noopener">Exercism</a> (MIT licence, authors credited on each kata).</p>`;
    const draw = () => {
      const r = rows();
      if (view.path !== 'all') { const order = PATHS.find((p) => p.id === view.path).slugs; r.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)); }
      $('#klist').innerHTML = r.length ? `<div class="klist">${r.map((k) => `<a class="krow tc ${solved(k.slug) ? 'done' : ''}" style="--h:${hueOf(band(k.difficulty))}" href="#/kata/${k.slug}">
          <span class="kck">${solved(k.slug) ? ic('check', 14, 3) : ''}</span><span class="kn">${esc(k.name)}${PICKS.has(k.slug) ? ' <span class="chip">pick</span>' : ''}${isDue(k.slug) ? ' <span class="chip hot">due</span>' : ''}${k.refactor ? ' <span class="chip">refactor</span>' : ''}</span>
          <span class="kb">${esc(k.blurb)}</span><span class="kd" title="Difficulty ${k.difficulty}/10">${'■'.repeat(Math.min(5, Math.ceil(k.difficulty / 2)))}${'□'.repeat(5 - Math.min(5, Math.ceil(k.difficulty / 2)))}</span></a>`).join('')}</div>` : '<div class="empty"><p class="muted">No katas match.</p></div>';
    };
    draw();
    $$('[data-path]').forEach((b) => (b.onclick = () => { view.path = b.dataset.path; viewKatas(); }));
    $('#kallpaths').onclick = () => { view.path = 'all'; viewKatas(); };
    $('#kq').oninput = (e) => { view.q = e.target.value.trim().toLowerCase(); draw(); };
    $$('[data-b]').forEach((b) => (b.onclick = () => { view.band = b.dataset.b; viewKatas(); }));
    $$('[data-s]').forEach((b) => (b.onclick = () => { view.status = b.dataset.s; viewKatas(); }));
    $('#kpicks').onclick = () => { view.picks = !view.picks; viewKatas(); };
    $('#krand').onclick = () => { const pool = rows().filter((k) => !solved(k.slug)); const k = (pool.length ? pool : rows())[Math.floor(Math.random() * Math.max(1, (pool.length ? pool : rows()).length))]; if (k) location.hash = '#/kata/' + k.slug; };
  }

  /* ---------- one kata ---------- */
  const cache = {};
  async function loadKata(slug) {
    if (cache[slug]) return cache[slug];
    const res = await fetch(`content/katas/python/${slug}.json`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (cache[slug] = await res.json());
  }
  async function viewKata(slug) {
    const meta = BY[slug];
    if (!meta) { app.innerHTML = '<h1>Kata not found</h1><p><a href="#/katas">Back to the katas</a></p>'; return; }
    app.innerHTML = `<div class="crumbs"><a href="#/katas">${ic('home', 14)} Katas</a> ${ic('arrow', 12)} <span>${esc(meta.name)}</span></div><p class="muted">Loading ${esc(meta.name)}…</p>`;
    let k;
    try { k = await loadKata(slug); } catch { app.innerHTML = `<div class="crumbs"><a href="#/katas">${ic('home', 14)} Katas</a></div><div class="callout warn">Could not load this kata. Check your connection and <a href="#/kata/${slug}">try again</a>.</div>`; return; }
    if (location.hash !== '#/kata/' + slug) return; /* navigated away while loading */
    const disposers = [];
    H.setCleanup(() => disposers.forEach((f) => f()));
    const guide = coaching(k), path = pathFor(slug);
    const sequence = path ? path.slugs.map((s) => BY[s]) : ITEMS;
    const idx = sequence.findIndex((x) => x.slug === slug), prev = sequence[idx - 1], nxt = sequence[idx + 1];
    const hue = hueOf(band(k.difficulty));
    const lesson = { id: lid(slug), title: k.name, sections: [] };
    const sec = {
      type: 'code', id: lid(slug), title: 'Your solution', level: band(k.difficulty), minutes: Math.min(45, 8 + k.difficulty * 4),
      prompt: '', /* the instructions live in the left pane */
      feedbackPrompt: `Code kata "${k.name}": ${k.blurb}\n${k.instructions.replace(/\s+/g, ' ').slice(0, 1500)}`,
      starter: k.stub, solution: k.example, tests: `#!unittest:${k.module}\n${k.tests}`,
      hint: k.hints ? md(k.hints) : 'Run the tests first and read the first failure. Make that one pass, then the next.',
      notes: `<b>Reference reasoning.</b> ${esc(guide[3])}<p><b>Interview follow-up.</b> ${esc(guide[4])}</p>` + (k.source ? `Source: ${esc(k.source)}${k.source_url ? ` (<a href="${esc(k.source_url)}" target="_blank" rel="noopener">link</a>)` : ''}` : ''),
    };
    lesson.sections.push(sec);
    app.classList.add('kata-wide'); disposers.push(() => app.classList.remove('kata-wide'));
    app.innerHTML = `<div class="crumbs"><a href="#/katas">${ic('home', 14)} Katas</a> ${ic('arrow', 12)} <span>${esc(k.name)}</span></div>
      <div class="kata-split">
        <section class="kata-desc tc brk"><div class="kd-scroll">
          <span class="chip tc" style="--h:${hue}">difficulty ${k.difficulty}/10 · ${band(k.difficulty)}</span><h1>${esc(k.name)}</h1><p class="sum">${esc(k.blurb)}</p>
          ${k.refactor ? '<div class="callout tip"><b>Refactoring kata.</b> The starter already passes the tests. Make the code cleaner without breaking them.</div>' : ''}
          ${path ? `<div class="ikpath-note"><b>${esc(path.name)}</b><p>${esc(path.focus)}</p><a href="#/katas" id="kbackpath">See this practice path</a></div>` : ''}
          <div class="kd-body ex-prompt">${md(k.instructions)}</div>
          <p class="muted kcredit">Exercise by ${esc((k.authors || []).join(', ') || 'Exercism contributors')}${(k.contributors || []).length ? ` and ${k.contributors.length} contributor${k.contributors.length > 1 ? 's' : ''}` : ''}, from <a href="https://github.com/${esc(DATA.source)}/tree/${esc(DATA.ref)}/exercises/practice/${esc(slug)}" target="_blank" rel="noopener">Exercism</a> (MIT licence).</p>
          <p class="muted" id="ksr">${esc(srLine(slug))}</p><div class="dbar" id="kshaky" ${srAll()[slug] ? '' : 'hidden'}><button class="btn ghost sm" id="kshakybtn">Mark as shaky (review tomorrow)</button></div>
          <div class="dbar kpn">${prev ? `<a class="btn ghost" href="#/kata/${prev.slug}">${ic('arrowL', 14)} ${esc(prev.name)}</a>` : '<span></span>'}<span class="sp"></span>${nxt ? `<a class="btn" href="#/kata/${nxt.slug}">${esc(nxt.name)} ${ic('arrow', 14)}</a>` : ''}</div>
        </div></section>
        <div class="kata-work">
          <div class="ikpractice tc"><b>Practice loop</b><span>Clarify the contract → trace an example → implement → test → explain</span><details><summary>Interview debrief</summary><p>${esc(guide[4])}</p><textarea class="inp" id="kreflection" rows="3" aria-label="Your interview debrief" placeholder="Approach, time/space cost, one edge case and a tradeoff…">${esc(store.get('kata-reflection:' + slug, ''))}</textarea><small>Saved on this device. A passing suite checks behavior; this explanation is your own assessment.</small></details></div>
          <div id="kcode"></div>
          <details class="kother tc brk has-ask">${askBtn(`Code kata "${k.name}": ${k.blurb}\n\nGive me the approach to solve this well (not the code), the edge cases to test, and ${window.MODE === 'gamedev' ? 'a small game feature where this technique applies.' : 'how you would explain the solution in an interview.'}`, 'Ask AI about the approach')}<summary>${ic('terminal', 16)} Practise it in another language</summary>
            <p class="muted">Download the same exercise with the <a href="https://exercism.org/cli-walkthrough" target="_blank" rel="noopener">Exercism CLI</a>, solve and test it locally, then paste your solution here for feedback. Language availability varies by exercise; local completion is self-reported and does not run browser tests.</p>
            <div class="cs-row"><select id="ktrack" class="inp" aria-label="Language">${TRACKS.map(([t, n]) => `<option value="${t}">${n}</option>`).join('')}</select>
              <a id="klink" class="btn ghost" target="_blank" rel="noopener">Open on exercism.org</a></div>
            <pre class="kcmd"><code id="kcmd"></code></pre>
            <textarea aria-label="Local solution for feedback" id="kpaste" class="inp" rows="8" spellcheck="false" placeholder="Paste your solution here (any language)…"></textarea>
            <div id="kfb"></div>
            <div class="dbar"><button class="btn" id="kdone">${ic('check', 15)} I solved it locally</button></div>
          </details>
        </div>
      </div>`;
    const say = (txt) => { $('#ksr').textContent = txt; $('#kshaky').hidden = false; };
    H.rCode($('#kcode'), sec, lesson, 0, () => { const r = recordPass(slug); say(r.text); if (r.kind !== 'early') toast(r.text); }, hue, disposers);
    $('#kreflection').oninput = (e) => store.set('kata-reflection:' + slug, e.target.value);
    if (path) $('#kbackpath').onclick = () => { view.path = path.id; view.q = ''; view.band = 'all'; view.status = 'all'; view.picks = false; };
    let hintStep = 0;
    $('#kcode .hint').onclick = () => {
      hintStep = Math.min(3, hintStep + 1);
      $('#kcode .out').innerHTML = `<div class="callout tip"><b>Hint ${hintStep} of 3</b>${guide.slice(0, hintStep).map((hint, i) => `<p><b>${i + 1}.</b> ${esc(hint)}</p>`).join('')}${hintStep === 3 && k.hints ? `<details><summary>Exercise-specific notes</summary>${md(k.hints)}</details>` : ''}</div>`;
    };
    $('#kshakybtn').onclick = () => { shaky(slug); say('Review tomorrow.'); };
    const cmd = () => {
      const t = $('#ktrack').value;
      $('#kcmd').textContent = `exercism download --track=${t} --exercise=${slug}\ncd <the folder it prints>\n# read README.md / HELP.md there to run the tests, then:\nexercism submit <your solution file>`;
      $('#klink').href = `https://exercism.org/tracks/${t}/exercises/${slug}`;
    };
    $('#ktrack').value = store.get('kata-local-language', 'javascript');
    $('#ktrack').onchange = () => { store.set('kata-local-language', $('#ktrack').value); cmd(); }; cmd();
    $('#kpaste').value = store.get('kata-local-draft:' + slug, '');
    $('#kpaste').oninput = (e) => store.set('kata-local-draft:' + slug, e.target.value);
    if (window.FEEDBACK) FEEDBACK.mount($('#kfb'), { kind: 'code', prompt: `Code kata "${k.name}": ${k.blurb}`, getAnswer: () => $('#kpaste').value });
    $('#kdone').onclick = () => { if (H.mark(lid(slug), 'c0', 50, 'Kata solved')) toast('Marked as solved'); const r = recordPass(slug); say(r.text); $('#kdone').textContent = 'Solved'; };
  }
});
