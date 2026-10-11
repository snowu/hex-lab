/* Katas: Exercism's Python practice exercises (MIT), run in the browser with their own unittest suites.
   Other languages: the same exercise via the Exercism CLI, plus AI feedback on a pasted solution. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  const { $, $$, esc, store, ic, app, toast, hueOf, askBtn } = H;
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
  const TRACKS = [['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['go', 'Go'], ['rust', 'Rust'], ['java', 'Java'], ['kotlin', 'Kotlin'], ['csharp', 'C#'], ['ruby', 'Ruby'], ['cpp', 'C++'], ['elixir', 'Elixir'], ['php', 'PHP'], ['swift', 'Swift']];
  H.routes.push([/^#\/katas$/, () => viewKatas()], [/^#\/kata\/([\w-]+)$/, (slug) => viewKata(slug)]);

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
  const view = { q: '', band: 'all', status: 'all', picks: false };
  function viewKatas() {
    const done = ITEMS.filter((k) => solved(k.slug)).length;
    const next = ITEMS.find((k) => PICKS.has(k.slug) && !solved(k.slug)) || ITEMS.find((k) => !solved(k.slug));
    const rows = () => ITEMS.filter((k) =>
      (view.band === 'all' || band(k.difficulty) === view.band) &&
      (view.status === 'all' || (view.status === 'solved') === solved(k.slug)) &&
      (!view.picks || PICKS.has(k.slug)) &&
      (!view.q || (k.slug + ' ' + k.name + ' ' + k.blurb).toLowerCase().includes(view.q)));
    app.innerHTML = `<div class="page-h"><h1>Code katas</h1><p>${ITEMS.length} practice exercises with real unit tests, run in your browser (Python). Other languages through the Exercism CLI, with AI feedback on whatever you paste.</p></div>
      <div class="kstats tc"><div><b>${done}</b><span>solved of ${ITEMS.length}</span></div><span class="mbar"><i style="width:${Math.round((done / ITEMS.length) * 100)}%"></i></span>
        ${next ? `<a class="btn primary" href="#/kata/${next.slug}">${ic('play', 15)} ${done ? 'Next' : 'Start'}: ${esc(next.name)}</a>` : ''}<button class="btn" id="krand">${ic('rotate', 15)} Random kata</button></div>
      <div class="kfilters"><input id="kq" class="inp" type="search" placeholder="Search katas…" value="${esc(view.q)}" aria-label="Search katas">
        ${BANDS.map(([k, n]) => `<button class="fchip ${view.band === k ? 'on' : ''}" data-b="${k}">${n}</button>`).join('')}<span class="ksep"></span>
        ${[['all', 'Any status'], ['todo', 'To do'], ['solved', 'Solved']].map(([k, n]) => `<button class="fchip ${view.status === k ? 'on' : ''}" data-s="${k}">${n}</button>`).join('')}<span class="ksep"></span>
        <button class="fchip ${view.picks ? 'on' : ''}" id="kpicks" title="Classics that map well to backend interviews">Interview picks</button></div>
      <div id="klist"></div>
      <p class="muted kcredit">Exercises from <a href="https://exercism.org" target="_blank" rel="noopener">Exercism</a> (MIT licence, authors credited on each kata).</p>`;
    const draw = () => {
      const r = rows();
      $('#klist').innerHTML = r.length ? `<div class="klist">${r.map((k) => `<a class="krow tc ${solved(k.slug) ? 'done' : ''}" style="--h:${hueOf(band(k.difficulty))}" href="#/kata/${k.slug}">
          <span class="kck">${solved(k.slug) ? ic('check', 14, 3) : ''}</span><span class="kn">${esc(k.name)}${PICKS.has(k.slug) ? ' <span class="chip">pick</span>' : ''}${k.refactor ? ' <span class="chip">refactor</span>' : ''}</span>
          <span class="kb">${esc(k.blurb)}</span><span class="kd" title="Difficulty ${k.difficulty}/10">${'■'.repeat(Math.min(5, Math.ceil(k.difficulty / 2)))}${'□'.repeat(5 - Math.min(5, Math.ceil(k.difficulty / 2)))}</span></a>`).join('')}</div>` : '<div class="empty"><p class="muted">No katas match.</p></div>';
    };
    draw();
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
    const idx = ITEMS.findIndex((x) => x.slug === slug), prev = ITEMS[idx - 1], nxt = ITEMS[idx + 1];
    const hue = hueOf(band(k.difficulty));
    const lesson = { id: lid(slug), title: k.name, sections: [] };
    const sec = {
      type: 'code', id: lid(slug), title: 'Your solution', level: band(k.difficulty), minutes: Math.min(45, 8 + k.difficulty * 4),
      prompt: '', /* the instructions live in the left pane */
      starter: k.stub, solution: k.example, tests: `#!unittest:${k.module}\n${k.tests}`,
      hint: k.hints ? md(k.hints) : 'Run the tests first and read the first failure. Make that one pass, then the next.',
      notes: k.source ? `Source: ${esc(k.source)}${k.source_url ? ` (<a href="${esc(k.source_url)}" target="_blank" rel="noopener">link</a>)` : ''}` : '',
    };
    lesson.sections.push(sec);
    app.classList.add('kata-wide'); disposers.push(() => app.classList.remove('kata-wide'));
    app.innerHTML = `<div class="crumbs"><a href="#/katas">${ic('home', 14)} Katas</a> ${ic('arrow', 12)} <span>${esc(k.name)}</span></div>
      <div class="kata-split">
        <section class="kata-desc tc brk"><div class="kd-scroll">
          <span class="chip tc" style="--h:${hue}">difficulty ${k.difficulty}/10 · ${band(k.difficulty)}</span><h1>${esc(k.name)}</h1><p class="sum">${esc(k.blurb)}</p>
          ${k.refactor ? '<div class="callout tip"><b>Refactoring kata.</b> The starter already passes the tests. Make the code cleaner without breaking them.</div>' : ''}
          <div class="kd-body ex-prompt">${md(k.instructions)}</div>
          <p class="muted kcredit">Exercise by ${esc((k.authors || []).join(', ') || 'Exercism contributors')}${(k.contributors || []).length ? ` and ${k.contributors.length} contributor${k.contributors.length > 1 ? 's' : ''}` : ''}, from <a href="https://github.com/${esc(DATA.source)}/tree/${esc(DATA.ref)}/exercises/practice/${esc(slug)}" target="_blank" rel="noopener">Exercism</a> (MIT licence).</p>
          <div class="dbar kpn">${prev ? `<a class="btn ghost" href="#/kata/${prev.slug}">${ic('arrowL', 14)} ${esc(prev.name)}</a>` : '<span></span>'}<span class="sp"></span>${nxt ? `<a class="btn" href="#/kata/${nxt.slug}">${esc(nxt.name)} ${ic('arrow', 14)}</a>` : ''}</div>
        </div></section>
        <div class="kata-work">
          <div id="kcode"></div>
          <details class="kother tc brk has-ask">${askBtn(`Code kata "${k.name}": ${k.blurb}\n\nGive me the approach to solve this well (not the code), the edge cases to test, and how you would explain the solution in an interview.`, 'Ask AI about the approach')}<summary>${ic('terminal', 16)} Practise it in another language</summary>
            <p class="muted">Download the same exercise with the <a href="https://exercism.org/cli-walkthrough" target="_blank" rel="noopener">Exercism CLI</a>, solve and test it locally, then paste your solution here for feedback.</p>
            <div class="cs-row"><select id="ktrack" class="inp" aria-label="Language">${TRACKS.map(([t, n]) => `<option value="${t}">${n}</option>`).join('')}</select>
              <a id="klink" class="btn ghost" target="_blank" rel="noopener">Open on exercism.org</a></div>
            <pre class="kcmd"><code id="kcmd"></code></pre>
            <textarea id="kpaste" class="inp" rows="8" spellcheck="false" placeholder="Paste your solution here (any language)…"></textarea>
            <div id="kfb"></div>
            <div class="dbar"><button class="btn" id="kdone">${ic('check', 15)} I solved it locally</button></div>
          </details>
        </div>
      </div>`;
    H.rCode($('#kcode'), sec, lesson, 0, () => {}, hue, disposers);
    const cmd = () => {
      const t = $('#ktrack').value;
      $('#kcmd').textContent = `exercism download --track=${t} --exercise=${slug}\ncd <the folder it prints>\n# read README.md / HELP.md there to run the tests, then:\nexercism submit <your solution file>`;
      $('#klink').href = `https://exercism.org/tracks/${t}/exercises/${slug}`;
    };
    $('#ktrack').onchange = cmd; cmd();
    if (window.FEEDBACK) FEEDBACK.mount($('#kfb'), { kind: 'code', prompt: `Code kata "${k.name}": ${k.blurb}`, getAnswer: () => $('#kpaste').value });
    $('#kdone').onclick = () => { if (H.mark(lid(slug), 'c0', 50, 'Kata solved')) toast('Marked as solved'); $('#kdone').textContent = 'Solved'; };
  }
});
