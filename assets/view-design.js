/* Design lab: timed design reps, comparison with a reference, estimation trainer, numbers to know. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  const { $, $$, esc, store, ic, app, addXp, logAct, toast, confetti, fmtClock } = H;
  const STEPS = window.DESIGN_STEPS, DESIGNS = window.DESIGNS;
  H.routes.push([/^#\/design$/, () => viewDesign()], [/^#\/design\/([\w-]+)$/, (id) => viewWorkspace(id)]);

  const hist = () => store.get('designhist', []);
  const histOf = (id) => hist().filter((x) => x.id === id);
  const words = (t) => (String(t).trim().match(/\S+/g) || []).length;
  let tab = 'reps', level = 'all';
  const checkpointKey = (id) => 'design-review:' + id;
  if (!document.querySelector('link[data-design-learning]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'assets/design-learning.css'; css.dataset.designLearning = ''; document.head.append(css);
  }

  /* ---------------- list ---------------- */
  function viewDesign() {
    document.title = 'Design lab · ' + (window.MODE === 'gamedev' ? 'Game Dev Lab' : 'Senior Interview Lab');
    const tabs = [['reps', 'Design reps'], ['est', 'Estimation trainer'], ['nums', 'Numbers to know']];
    app.innerHTML = `<div class="page-h"><h1>Design lab</h1><p>${window.MODE === 'gamedev' ? 'Practise game architecture: sketch a small system, compare approaches, then record what you learned. The clock is optional.' : 'Design under pressure is a skill you train with reps: a clock, a blank page, then a comparison against a reference. Each rep takes 30-40 minutes. Do one or two a week.'}</p></div>
      <div class="filters">${tabs.map(([k, n]) => `<button class="fchip ${tab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div><div id="dbody"></div>`;
    $$('.fchip', app).forEach((b) => (b.onclick = () => { tab = b.dataset.t; viewDesign(); }));
    ({ reps: drawReps, est: drawEstimation, nums: drawNumbers }[tab])($('#dbody'));
  }

  function drawReps(el) {
    const attempts = hist(), practiced = new Set(attempts.map((x) => x.id));
    el.innerHTML = `<div class="design-overview"><strong>${practiced.size}/${DESIGNS.length} prompts practiced</strong><span>${attempts.length} saved reps · ${attempts.filter((x) => x.secs > 0).length} timed</span><p>Start with a warm-up, explain the simplest working design, then add complexity only when a requirement demands it. Saved scores are your own assessment.</p></div><div class="filters" aria-label="Design difficulty">${['all', ...new Set(DESIGNS.map((d) => d.level))].map((v) => `<button class="fchip ${level === v ? 'on' : ''}" data-level="${esc(v)}" aria-pressed="${level === v}">${esc(v === 'all' ? 'All levels' : v)}</button>`).join('')}</div><div class="dgrid">${DESIGNS.filter((d) => level === 'all' || d.level === level).map((d) => {
      const h = histOf(d.id), last = h[h.length - 1], draft = store.get('dw:' + d.id, {});
      const resume = STEPS.some((step) => words(draft[step.id] || '')) || store.get(checkpointKey(d.id), null);
      return `<a class="dcard tc" href="#/design/${d.id}"><div class="row"><span class="chip">${esc(d.level)}</span><span class="chip">${ic('clock', 12)} ${d.minutes} min</span>${last ? `<span class="chip good">last ${last.score}/${last.total}</span>` : ''}</div>
        <h3>${esc(d.title)}</h3><p>${esc(d.prompt)}</p><div class="meta"><span class="muted">${h.length ? h.length + ' attempt' + (h.length > 1 ? 's' : '') : 'not tried'}</span><span class="go">${resume ? 'resume draft' : 'start rep'} ${ic('arrow', 14)}</span></div></a>`;
    }).join('')}</div>${attempts.length ? `<details class="design-history"><summary>Recent practice and next steps</summary>${attempts.slice(-5).reverse().map((rep) => `<article><a href="#/design/${esc(rep.id)}">${esc(DESIGNS.find((d) => d.id === rep.id)?.title || rep.id)}</a><span>${rep.score}/${rep.total} self-assessed · ${rep.secs ? fmtClock(rep.secs) : 'untimed'}</span><p>${esc(rep.learn || 'Choose one missed requirement to focus on in your next attempt.')}</p></article>`).join('')}</details>` : ''}
    <div class="callout tip"><b>How to get the most from a rep.</b> Set the timer, write rough notes in each step (bullets are fine), and speak your reasoning out loud. When time is up, compare with the reference, tick the rubric honestly, and write down the two things you missed. Redo the same prompt a week later.</div>`;
    $$('[data-level]', el).forEach((button) => { button.onclick = () => { level = button.dataset.level; drawReps(el); }; });
  }

  /* ---------------- workspace ---------------- */
  function viewWorkspace(id) {
    const d = DESIGNS.find((x) => x.id === id); if (!d) return viewDesign();
    document.title = d.title + ' · Design lab';
    const dk = 'dw:' + id, saved = store.get(dk, {}), limit = d.minutes * 60;
    const checkpoint = store.get(checkpointKey(id), null);
    let timer = null, hintsUsed = checkpoint?.hints || 0, finished = false;
    app.innerHTML = `
      <div class="crumbs"><a href="#/design">${ic('home', 14)} Design lab</a> ${ic('arrow', 12)} <span>${esc(d.title)}</span></div>
      <section class="dprompt tc brk has-ask">${H.askBtn(`Design exercise "${d.title}": ${d.prompt}\n\nDo not solve it. Based on what I have written so far, tell me what I am missing or should clarify first, and what to tackle next.`, 'Ask AI')}<span class="chip">${esc(d.level)}</span> <span class="chip">${ic('clock', 12)} ${d.minutes} min</span>
        <h1>${esc(d.title)}</h1><p class="lead">${esc(d.prompt)}</p>
        <div class="dbar"><button class="btn primary" id="dstart">${ic('play', 15)} Start the clock</button><span class="dclock" id="dclock">${fmtClock(limit)}</span><span class="sp"></span><button class="btn" id="dhint">${ic('bulb', 15)} Hint <small id="dhn">(${hintsUsed}/${d.hints.length})</small></button><button class="btn" id="dfinish">${ic('check', 15)} Finish &amp; compare</button><button class="btn" id="drevisenotes" hidden>Revise notes</button></div>
        <div id="dhints"></div><p class="muted design-save-status" role="status" id="ddraftstatus">Notes save automatically on this device. The timer is optional.</p></section>
      <div id="dsteps">${STEPS.map((s) => `<details class="wstep" open><summary>${esc(s.title)} <span class="wc" data-w="${s.id}"></span></summary><p class="muted wask">${esc(s.ask)}</p><textarea aria-label="${esc(s.title)} notes" data-s="${s.id}" rows="5" spellcheck="false" placeholder="Your notes…">${esc(saved[s.id] || '')}</textarea></details>`).join('')}</div>
      <div id="dcompare"></div>`;
    const count = (k) => { const ta = $(`textarea[data-s="${k}"]`); $(`.wc[data-w="${k}"]`).textContent = words(ta.value) ? words(ta.value) + ' words' : ''; };
    $$('textarea[data-s]').forEach((ta) => { count(ta.dataset.s); ta.addEventListener('input', () => { const cur = store.get(dk, {}); cur[ta.dataset.s] = ta.value; store.set(dk, cur); $('#ddraftstatus').textContent = 'Draft saved on this device'; count(ta.dataset.s); }); });
    const clock = $('#dclock'), startBtn = $('#dstart');
    const tick = () => { const left = limit - (Date.now() - timer.t0) / 1000; clock.textContent = fmtClock(Math.max(0, left)); clock.classList.toggle('low', left < limit * 0.2); if (left <= 0) { clock.textContent = '00:00'; toast('Time is up: finish and compare'); clearInterval(timer.iv); } };
    startBtn.onclick = () => {
      if (timer) return;
      timer = { t0: Date.now(), iv: setInterval(tick, 500) }; startBtn.disabled = true; startBtn.innerHTML = ic('clock', 15) + ' Running'; tick();
      $('#dsteps details').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $('#dhint').onclick = () => {
      if (hintsUsed >= d.hints.length) return;
      $('#dhints').insertAdjacentHTML('beforeend', `<div class="callout tip"><b>Hint ${hintsUsed + 1}.</b> ${esc(d.hints[hintsUsed])}</div>`);
      hintsUsed++; $('#dhn').textContent = `(${hintsUsed}/${d.hints.length})`;
    };
    $('#dfinish').onclick = () => {
      if (finished) return; finished = true;
      const secs = timer ? Math.min(limit * 2, Math.round((Date.now() - timer.t0) / 1000)) : 0;
      if (timer) clearInterval(timer.iv);
      showCompare(d, store.get(dk, {}), secs, hintsUsed);
    };
    $('#drevisenotes').onclick = () => {
      finished = false; $('#dsteps').hidden = false; $('#dcompare').innerHTML = ''; $('#drevisenotes').hidden = true; $('#dfinish').disabled = false;
      store.set(checkpointKey(id), { ...store.get(checkpointKey(id), {}), editing: true });
    };
    if (checkpoint && !checkpoint.editing) { finished = true; showCompare(d, saved, checkpoint.secs || 0, hintsUsed); }
    H.setCleanup(() => { if (timer) clearInterval(timer.iv); });
  }

  function showCompare(d, mine, secs, hints) {
    const el = $('#dcompare'); $('#dsteps').hidden = true; $('#drevisenotes').hidden = false; $('#dfinish').disabled = true;
    const reviewKey = checkpointKey(d.id), review = store.get(reviewKey, null) || { secs, hints, checked: [], learn: '' };
    const saveReview = () => store.set(reviewKey, { secs, hints, checked: Array.from($$('#drub input')).map((input) => input.checked), learn: $('#dlearn').value });
    store.set(reviewKey, { ...review, secs, hints, editing: false });
    const wordsTotal = STEPS.reduce((n, s) => n + words(mine[s.id] || ''), 0);
    el.innerHTML = `
      <div class="callout"><b>Compare, don't just read.</b> For each step, look at what the reference has that you did not. ${secs ? `You took <b>${fmtClock(secs)}</b> of ${d.minutes}:00.` : (window.MODE === 'gamedev' ? 'Compare at your own pace.' : 'You did not start the clock, so this rep will not count toward your pressure practice.')} ${hints ? `Hints used: ${hints}.` : ''}</div>
      ${STEPS.map((s) => `<section class="cmp"><h3>${esc(s.title)}</h3><div class="cols"><div class="col mine"><div class="ch">your answer</div><div class="ct">${esc(mine[s.id] || '(empty)').replace(/\n/g, '<br>')}</div></div><div class="col ref"><div class="ch">reference</div><div class="ct html">${d.ref[s.id]}</div></div></div></section>`).join('')}
      <section class="cmp"><h3>Trade-offs the reference would mention</h3><ul>${d.tradeoffs.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
      <section class="cmp"><h3>${window.MODE === 'gamedev' ? 'Experiments to try next' : 'Pressure round: answer each out loud in 60 seconds'}</h3><ol>${d.followups.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></section>
      <section class="cmp"><h3>Review against evidence in your notes</h3><p class="muted">Check a criterion only if you can point to a decision or calculation in your answer. An unchecked item becomes a concrete target for your next rep.</p><ul class="rubric" id="drub">${d.rubric.map((r, i) => `<li class="${review.checked[i] ? 'hit' : ''}"><label><input type="checkbox" ${review.checked[i] ? 'checked' : ''}><span>${esc(r)}</span></label></li>`).join('')}</ul>
        <div class="dbar"><button class="btn primary" id="dsave">${ic('check', 15)} Save this rep</button><span class="muted" id="dscore"></span></div>
        <label class="lbl">The two things I missed or will do differently next time</label><textarea id="dlearn" aria-label="Next practice targets" rows="3" placeholder="e.g. I skipped estimates and never named a failure mode">${esc(review.learn || '')}</textarea><div id="dnext" class="callout tip"></div></section>`;
    const upd = () => {
      const inputs = Array.from($$('#drub input'));
      $('#dscore').textContent = `${inputs.filter((input) => input.checked).length}/${d.rubric.length} covered · self-assessed`;
      const gaps = d.rubric.filter((r, i) => !inputs[i].checked);
      $('#dnext').innerHTML = '<b>Next practice target.</b> ' + esc(gaps.length ? gaps.slice(0, 2).join(' · ') : 'Repeat the prompt with a changed scale or availability requirement and explain which decisions change.');
    }; upd();
    $$('#drub input').forEach((input) => { input.onchange = () => { input.closest('li').classList.toggle('hit', input.checked); upd(); saveReview(); }; });
    $('#dlearn').oninput = saveReview;
    $('#dsave').onclick = () => {
      const score = $$('#drub li.hit').length, all = hist();
      all.push({ id: d.id, ts: Date.now(), secs, score, total: d.rubric.length, hints, words: wordsTotal, learn: $('#dlearn').value.trim() });
      store.set('designhist', all.slice(-200)); logAct('design'); addXp(40 + (secs ? 20 : 0), 'Design rep saved');
      if (score >= d.rubric.length - 1) { const r = $('#dsave').getBoundingClientRect(); confetti(r.left, r.top); }
      store.set('dw:' + d.id, {}); store.set(reviewKey, null); $('#dsave').disabled = true; $('#dsave').textContent = 'Saved'; $('#drevisenotes').hidden = true;
    };
    if (window.FEEDBACK && FEEDBACK.enabled()) {
      el.insertAdjacentHTML('beforeend', '<section class="cmp"><h3>Second opinion</h3><div id="dfbk"></div></section>');
      FEEDBACK.mount($('#dfbk'), { kind: 'design', prompt: d.title + ': ' + d.prompt, getAnswer: () => STEPS.map((x) => x.title + ':\n' + (mine[x.id] || '')).join('\n\n') });
    }
    el.scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------------- estimation trainer ---------------- */
  const E = () => store.get('estats', { n: 0, good: 0, close: 0, streak: 0, best: 0 });
  let cur = null;
  const parseNum = (txt) => {
    const m = String(txt).trim().toLowerCase().replace(/[, _]/g, '').match(/^(-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?)([kmb])?$/);
    if (!m) return NaN;
    return parseFloat(m[1]) * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1);
  };
  function drawEstimation(el) {
    const s = E();
    if (!cur) { const t = window.ESTIMATES[Math.floor(Math.random() * window.ESTIMATES.length)]; cur = { t, g: t.gen(Math.random), done: false }; }
    el.innerHTML = `<div class="est tc brk"><div class="row"><span class="chip">${esc(cur.t.title)}</span><span class="muted">answered ${s.n} · within 1.5×: ${s.n ? Math.round((s.good / s.n) * 100) : 0}% · streak ${s.streak} (best ${s.best})</span></div>
      <p class="estq">${esc(cur.g.q)}</p>
      <div class="estin"><input id="eans" inputmode="decimal" autocomplete="off" placeholder="your estimate (plain numbers, or 1.5k / 3m / 2b)"><span class="unit">${esc(cur.g.unit)}</span><button class="btn primary" id="echeck">Check</button><button class="btn ghost" id="eskip">skip</button></div>
      <div id="eout"></div></div>
      <p class="muted">${window.MODE === 'gamedev' ? 'Estimate first, then check the arithmetic and units. Use these budgets when profiling a game.' : 'Goal: right order of magnitude fast, then within 1.5×. Do the arithmetic out loud; round aggressively (86,400 ≈ 10^5).'}</p>`;
    const ans = $('#eans'); ans.focus();
    const check = () => {
      if (cur.done) { cur = null; return drawEstimation(el); }
      const v = parseNum(ans.value);
      if (!isFinite(v) || v <= 0) { $('#eout').innerHTML = '<div class="callout warn">Enter a positive number.</div>'; return; }
      cur.done = true;
      const ratio = v / cur.g.answer, off = ratio >= 1 ? ratio : 1 / ratio, st = E();
      st.n++; let verdict, cls;
      if (off <= 1.5) { st.good++; st.streak++; st.best = Math.max(st.best, st.streak); verdict = window.MODE === 'gamedev' ? 'Within 1.5×. Good estimate.' : 'Within 1.5×. Interview-grade.'; cls = 'good'; if (st.streak % 5 === 0) addXp(10, `${st.streak} estimates in a row`); }
      else if (off <= 3) { st.close++; st.streak = 0; verdict = `Right ballpark (${off.toFixed(1)}× ${ratio > 1 ? 'too high' : 'too low'}). Re-check one step.`; cls = 'warn'; }
      else { st.streak = 0; verdict = `Off by ${off >= 100 ? '>100' : off.toFixed(0)}× (${ratio > 1 ? 'too high' : 'too low'}). Look for a unit slip.`; cls = 'bad'; }
      store.set('estats', st); logAct('est');
      $('#eout').innerHTML = `<div class="callout ${cls === 'good' ? 'tip' : cls === 'warn' ? 'warn' : ''} ${cls === 'bad' ? 'bad' : ''}"><b>${verdict}</b> Answer ≈ <b>${window.ESTIMATE_FMT(cur.g.answer)} ${esc(cur.g.unit)}</b>.<ol>${cur.g.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p class="muted">${esc(cur.g.tip)}</p></div>`;
      $('#echeck').textContent = 'Next question';
    };
    $('#echeck').onclick = check;
    ans.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    $('#eskip').onclick = () => { cur = null; drawEstimation(el); };
  }

  /* ---------------- numbers ---------------- */
  function drawNumbers(el) {
    el.innerHTML = `<p class="muted">Rough orders of magnitude to anchor your estimates. Say “roughly” and “it depends on hardware”: the point is the ratio between them.</p>
      <table><tr><th>What</th><th>Roughly</th></tr>${window.NUMBERS.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>`;
  }
});
