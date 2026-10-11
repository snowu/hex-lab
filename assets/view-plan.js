/* Plan page: daily plan, diagnostic, readiness dashboard, backup. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  const { $, $$, esc, strip, store, ic, app, addXp, logAct, actToday, toast, TRACKS, lessonPct, trackPct, dueCards, hueOf, fmtClock, findLesson, getProgress } = H;
  H.routes.push([/^#\/plan$/, () => viewPlan()]);

  const dstr = (d) => d.toISOString().slice(0, 10);
  const SELF = [['code', 'Writing code against the clock'], ['design', 'System design under pressure'], ['story', 'Behavioral stories'], ['data', 'Databases and SQL'], ['domain', 'Open banking / payments domain']];
  let diag = null; // running diagnostic

  /* ---------------- helpers ---------------- */
  const diagResult = () => store.get('diag', null);
  const mastery = (t) => {
    const lp = trackPct(t), d = diagResult() && diagResult().tracks[t.id];
    return d ? Math.round(0.5 * lp + 0.5 * (d.right / d.total) * 100) : lp;
  };
  const allExercises = () => TRACKS.flatMap((t) => t.lessons.flatMap((l) => l.sections.filter((s) => s.type === 'code').map((s) => ({ t, l, s }))));
  const seeded = (str) => { let h = 0; for (const c of str + dstr(new Date())) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0) % 1000; };
  const weakestTrack = () => [...TRACKS].filter((t) => t.lessons.some((l) => lessonPct(l) < 100)).sort((a, b) => mastery(a) - mastery(b))[0];

  function pickDrill(mins) {
    const att = store.get('attempts', []);
    const scored = allExercises().map((e) => {
      const mine = att.filter((x) => x.id === e.s.id), ok = mine.some((x) => x.ok), fails = mine.filter((x) => !x.ok).length;
      const lastTs = mine.length ? Math.max(...mine.map((x) => x.ts)) : 0, days = lastTs ? (Date.now() - lastTs) / 864e5 : 99;
      return { e, score: (ok ? 0 : 100) + (e.t.id === 'patterns' ? 25 : 0) + fails * 5 + Math.min(days, 30) + ((e.s.minutes || 20) <= mins ? 15 : 0) + seeded(e.s.id) / 1000 };
    });
    return scored.sort((a, b) => b.score - a.score)[0]?.e;
  }
  function pickDesign() {
    const h = store.get('designhist', []);
    return [...window.DESIGNS].sort((a, b) => (h.filter((x) => x.id === a.id).length - h.filter((x) => x.id === b.id).length) || (seeded(a.id) - seeded(b.id)))[0];
  }

  function buildPlan(mins) {
    const act = actToday(), tasks = [], self = store.get('self', {}), due = dueCards().length;
    const cardsTarget = Math.min(due, mins <= 15 ? 10 : mins <= 30 ? 15 : 25);
    if (due) tasks.push({ icon: 'cards', title: `Review ${cardsTarget} flashcards`, detail: `${due} due. Say each answer out loud before flipping.`, href: '#/review', done: (act.cards || 0) >= cardsTarget, min: Math.ceil(cardsTarget / 3) });
    const kd = window.KATA_SR ? KATA_SR.due() : [];
    if (kd.length) tasks.push({ icon: 'terminal', title: `Kata review: ${kd[0].name}`, detail: `${kd.length} kata${kd.length === 1 ? '' : 's'} due for spaced review. Solve it again from scratch, no peeking.`, href: '#/kata/' + kd[0].slug, done: (act.kata || 0) >= 1, min: 15 });
    const drill = pickDrill(Math.min(mins, 30)), codeWeak = (self.code || 3) <= 2;
    if (drill) tasks.push({ icon: 'clock', title: `Timed drill: ${drill.s.title}`, detail: `${drill.t.title} · budget ${drill.s.minutes || 20} min. Press Timed and talk through your plan first.`, href: '#/lesson/' + drill.l.id, done: (act.drill || 0) >= 1, min: drill.s.minutes || 20 });
    if (codeWeak && mins >= 60) { const d2 = pickDrill(30); if (d2 && d2.s.id !== drill.s.id) tasks.push({ icon: 'clock', title: `Second timed drill: ${d2.s.title}`, detail: `${d2.t.title} · budget ${d2.s.minutes || 20} min`, href: '#/lesson/' + d2.l.id, done: (act.drill || 0) >= 2, min: d2.s.minutes || 20 }); }
    if (mins >= 60) { const ds = pickDesign(); tasks.push({ icon: 'design', title: `Design rep: ${ds.title}`, detail: `${ds.minutes} min on the clock, then compare with the reference.`, href: '#/design/' + ds.id, done: (act.design || 0) >= 1, min: ds.minutes }); }
    else if (mins >= 30) tasks.push({ icon: 'design', title: 'Estimation trainer: 3 questions', detail: 'Back-of-envelope numbers, answered in under a minute each.', href: '#/design', done: (act.est || 0) >= 3, min: 5 });
    if (mins >= 30) {
      const stories = store.get('stories', []);
      tasks.push({ icon: 'mic', title: stories.length ? 'Practise one story out loud (2 min)' : 'Write your first STAR story', detail: stories.length ? 'Pick the one you are least comfortable with.' : 'Behavioral rounds are won with prepared stories.', href: '#/stories', done: (act.story || 0) >= 1, min: 8 });
    }
    const wt = weakestTrack();
    if (wt) { const l = wt.lessons.find((x) => lessonPct(x) < 100); tasks.push({ icon: wt.id, title: `Learn: ${l.title}`, detail: `${wt.title}, your weakest area (${mastery(wt)}%). Work the quizzes and challenges, not just the text.`, href: '#/lesson/' + l.id, done: (act.practice || 0) >= 3, min: l.minutes }); }
    if (mins >= 60) tasks.push({ icon: 'mic', title: 'One mock interview question', detail: 'Answer out loud, then tick the rubric.', href: '#/mock', done: (act.mock || 0) >= 1, min: 15 });
    return tasks;
  }

  /* ---------------- main page ---------------- */
  function viewPlan() {
    document.title = 'Plan · Senior Interview Lab';
    if (diag) return drawDiag();
    const mins = store.get('planMin', 30), goal = store.get('goalDate', ''), tasks = buildPlan(mins), done = tasks.filter((t) => t.done).length;
    const days = goal ? Math.ceil((new Date(goal) - new Date(dstr(new Date()))) / 864e5) : null;
    const dr = diagResult();
    if (tasks.length && done === tasks.length && store.get('plandone', '') !== dstr(new Date())) { store.set('plandone', dstr(new Date())); addXp(30, 'Daily plan complete'); }
    app.innerHTML = `
      <div class="page-h"><h1>Plan</h1><p><span id="daysleft">${daysLeftHtml(days)}</span>A short, repeatable session that targets pressure skills: code against the clock, design reps, and out-loud practice. No interview date needed.</p></div>
      <section class="pl-top">
        <div class="seg" role="group" aria-label="Session length">${[15, 30, 60].map((m) => `<button data-m="${m}" class="${m === mins ? 'on' : ''}">${m} min</button>`).join('')}</div>
        <label class="lbl inl">interview date (optional) <input type="date" id="goal" value="${esc(goal)}"></label>
      </section>
      <section class="plan">
        <div class="ph"><h2>Today</h2><span class="muted">${done}/${tasks.length} done · about ${tasks.reduce((n, t) => n + t.min, 0)} min</span></div>
        <div class="pbar2"><i style="width:${tasks.length ? (done / tasks.length) * 100 : 0}%"></i></div>
        ${tasks.map((t) => `<a class="ptask ${t.done ? 'done' : ''}" href="${t.href}"><span class="pk">${t.done ? ic('check', 16, 3) : ''}</span><span class="pic">${ic(t.icon, 18)}</span><span class="ptx"><b>${esc(t.title)}</b><small>${esc(t.detail)}</small></span><span class="pmin">${t.min} min</span></a>`).join('') || '<p class="muted">Nothing to plan yet. Start a lesson.</p>'}
      </section>
      <section class="diag">
        <div class="ph"><h2>Diagnostic</h2><span class="muted">${dr ? 'taken ' + new Date(dr.ts).toLocaleDateString() : 'not taken yet'}</span></div>
        ${dr ? diagResultsHtml(dr) : `<p class="muted">A ~20-question check across every track, with no feedback until the end. It shows where you are weakest and tunes the plan. Takes about 10 minutes.</p>`}
        <button class="btn primary" id="dgo">${ic('target', 15)} ${dr ? 'Retake the diagnostic' : 'Take the diagnostic'}</button>
      </section>
      <section class="ready"><div class="ph"><h2>Readiness</h2><span class="muted">lessons + diagnostic</span></div>${readinessHtml()}${statsHtml()}${heatmapHtml()}</section>
      <section class="cloud"><div class="ph"><h2>Cloud sync</h2><span class="muted">optional · this device always wins unless you choose otherwise</span></div><div id="cloudpanel"></div></section>
      ${window.FEEDBACK && FEEDBACK.enabled() ? `<section class="usage"><div class="ph"><h2>AI usage</h2><span class="muted">estimated from token counts · kept on this device only</span></div><div id="aiusage"></div></section>` : ''}
      <section class="backup"><div class="ph"><h2>Backup</h2><span class="muted">your data lives only in this browser</span></div>
        <p class="muted">Export a file to move to another browser or device, or to keep a copy before clearing site data.</p>
        <div class="dbar"><button class="btn" id="bexp">${ic('arrow', 15)} Export progress</button><label class="btn" for="bimp">${ic('arrowL', 15)} Import progress</label><input type="file" id="bimp" accept="application/json" hidden></div></section>`;
    $$('.pl-top .seg button').forEach((b) => (b.onclick = () => { store.set('planMin', +b.dataset.m); viewPlan(); }));
    /* Never re-render while the date is being typed: each digit of a year is already a "valid" date and rebuilding the input swallowed the keystrokes. */
    const goalEl = $('#goal'), saveGoal = () => {
      const v = goalEl.value;
      if (v === '') { store.set('goalDate', ''); $('#daysleft').innerHTML = ''; return; }
      const y = +v.slice(0, 4);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || y < 2000 || y > 2100) return; /* partial or implausible: wait */
      store.set('goalDate', v);
      $('#daysleft').innerHTML = daysLeftHtml(Math.ceil((new Date(v) - new Date(dstr(new Date()))) / 864e5));
    };
    goalEl.oninput = saveGoal; goalEl.onchange = saveGoal;
    $('#dgo').onclick = startDiag;
    $('#bexp').onclick = exportData; $('#bimp').onchange = importData;
    if (window.CLOUD) window.CLOUD.mount($('#cloudpanel'));
    if ($('#aiusage')) drawUsage();
  }

  const money = (n) => (n < 0.01 ? (n === 0 ? '$0' : '<$0.01') : '$' + n.toFixed(n < 1 ? 3 : 2));
  const tok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n));
  const FLABEL = { review: 'answer reviews', chat: 'tutor chat', interview: 'AI interviews' };
  function drawUsage() {
    const el = $('#aiusage'); if (!el) return;
    const u = FEEDBACK.usage();
    const tile = (name, b) => `<div class="utile"><span>${name}</span><b>${b.calls}</b><small>${b.calls === 1 ? 'call' : 'calls'} · ${tok(b.tin + b.tout)} tokens · ${money(b.cost)}</small></div>`;
    const models = Object.entries(u.month.byModel);
    el.innerHTML = `<div class="ugrid">${tile('Today', u.today)}${tile('This month', u.month)}${tile('Last 60 days', u.all)}</div>
      ${models.length ? `<table class="utable"><thead><tr><th>Model (this month)</th><th>Calls</th><th>Tokens in / out</th><th>Est. cost</th><th>Of plan cap</th></tr></thead><tbody>${models.map(([m, x]) => { const cap = u.caps[m]; return `<tr><td>${esc(m)}</td><td>${x.calls}</td><td>${tok(x.tin)} / ${tok(x.tout)}</td><td>${money(x.cost)}</td><td>${cap ? (x.cost / cap * 100 < 0.1 ? '<0.1' : (x.cost / cap * 100).toFixed(1)) + '% of $' + cap : 'n/a'}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted">No AI calls yet this month.</p>'}
      ${Object.keys(u.month.byFeature).length ? `<p class="muted">This month: ${Object.entries(u.month.byFeature).map(([f, n]) => `${n} ${FLABEL[f] || f}`).join(' · ')}</p>` : ''}
      <p class="muted">Prices are per-token list prices for OpenCode Go (DeepSeek costs double at peak hours). Go is a flat subscription, so this shows headroom, not what you pay. ${u.all.calls ? '<button class="linkbtn" id="ureset">reset counter</button>' : ''}</p>`;
    const r = $('#ureset'); if (r) r.onclick = () => { if (confirm('Reset the AI usage counter on this device?')) { FEEDBACK.resetUsage(); drawUsage(); } };
  }
  const daysLeftHtml = (days) => (days !== null && days >= 0 ? `<b>${days}</b> day${days === 1 ? '' : 's'} to your interview. ` : '');
  const readinessHtml = () => `<div class="rdy">${TRACKS.map((t) => { const m = mastery(t), d = diagResult() && diagResult().tracks[t.id]; return `<div class="rrow tc" style="--h:${hueOf(t.id)}"><span class="rt">${esc(t.title)}</span><span class="rbar"><i style="width:${m}%"></i></span><span class="rv">${m}%${d ? ` <small>diag ${d.right}/${d.total}</small>` : ''}</span></div>`; }).join('')}</div>`;

  function statsHtml() {
    const att = store.get('attempts', []), okIds = new Set(att.filter((a) => a.ok).map((a) => a.id)), total = allExercises().length;
    const inBudget = att.filter((a) => a.ok && a.secs <= a.limit).length, dh = store.get('designhist', []), st = store.get('stories', []), mk = H.mockSummary();
    return `<div class="stats3"><div><b>${okIds.size}/${total}</b><span>exercises solved against the clock</span></div><div><b>${att.length ? Math.round((att.filter((a) => a.ok).length / att.length) * 100) + '%' : '–'}</b><span>timed attempts that succeeded</span></div><div><b>${dh.length}</b><span>design reps · avg ${dh.length ? Math.round((dh.reduce((n, x) => n + x.score / x.total, 0) / dh.length) * 100) : 0}%</span></div><div><b>${st.length}</b><span>STAR stories</span></div><div><b>${mk.h.length}</b><span>mock answers · avg ${mk.avg}%</span></div></div>`;
  }

  function heatmapHtml() {
    const all = store.get('activity', {}), cells = [], today = new Date(); today.setHours(12);
    const start = new Date(today); start.setDate(today.getDate() - (12 * 7 - 1)); start.setDate(start.getDate() - start.getDay());
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) { const a = all[dstr(d)] || {}, n = (a.practice || 0) + (a.cards || 0) / 3 + (a.drill || 0) * 3 + (a.design || 0) * 4 + (a.story || 0) * 2 + (a.mock || 0) * 2 + (a.est || 0) / 2; cells.push({ d: dstr(d), lv: n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 16 ? 3 : 4, n }); }
    return `<h3>Activity, last 12 weeks</h3><div class="heat">${cells.map((c) => `<i class="lv${c.lv}" title="${c.d}: ${Math.round(c.n)} points"></i>`).join('')}</div>`;
  }

  /* ---------------- diagnostic ---------------- */
  function diagResultsHtml(dr) {
    const rows = TRACKS.filter((t) => dr.tracks[t.id]).map((t) => ({ t, d: dr.tracks[t.id], p: Math.round((dr.tracks[t.id].right / dr.tracks[t.id].total) * 100) })).sort((a, b) => a.p - b.p);
    const weak = rows.slice(0, 3);
    return `<div class="rdy">${rows.map(({ t, d, p }) => `<div class="rrow tc" style="--h:${hueOf(t.id)}"><span class="rt">${esc(t.title)}</span><span class="rbar"><i style="width:${p}%"></i></span><span class="rv">${d.right}/${d.total}</span></div>`).join('')}</div>
      <p><b>Weakest:</b> ${weak.map(({ t }) => `<a href="#/track/${t.id}">${esc(t.title)}</a>`).join(', ')}.</p>
      ${dr.missed && dr.missed.length ? `<details><summary>${dr.missed.length} question${dr.missed.length > 1 ? 's' : ''} to learn from</summary>${dr.missed.map((m) => `<div class="callout"><b>${esc(m.q)}</b><br>Correct: ${m.correct}<br><span class="muted">${m.explain}</span><br><a href="#/lesson/${m.lesson}">Open the lesson</a></div>`).join('')}</details>` : ''}`;
  }

  function startDiag() {
    const qs = [];
    for (const t of TRACKS) {
      const pool = t.lessons.flatMap((l) => l.sections.filter((s) => s.type === 'quiz').map((s) => ({ t, l, s })));
      pool.sort(() => Math.random() - 0.5); qs.push(...pool.slice(0, 3).map((q) => ({ ...q, sh: H.shuffleOpts(q.s) })));
    }
    qs.sort(() => Math.random() - 0.5);
    diag = { qs, i: 0, answers: [], self: store.get('self', {}), phase: 'self' };
    viewPlan();
  }

  function drawDiag() {
    if (diag.phase === 'self') {
      app.innerHTML = `<div class="page-h"><h1>Diagnostic</h1><p>First, rate how you feel about each area (1 = weak, 5 = strong). This tunes your daily plan. Then ${diag.qs.length} questions with no feedback until the end.</p></div>
        <div class="selfrate">${SELF.map(([k, n]) => `<label>${esc(n)}<input type="range" min="1" max="5" step="1" value="${diag.self[k] || 3}" data-k="${k}"><b>${diag.self[k] || 3}</b></label>`).join('')}</div>
        <div class="dbar"><button class="btn primary" id="dbegin">Start the questions</button><button class="btn ghost" id="dcancel">Cancel</button></div>`;
      $$('.selfrate input').forEach((i) => (i.oninput = () => { diag.self[i.dataset.k] = +i.value; i.nextElementSibling.textContent = i.value; }));
      $('#dbegin').onclick = () => { store.set('self', diag.self); diag.phase = 'q'; drawDiag(); };
      $('#dcancel').onclick = () => { diag = null; viewPlan(); };
      return;
    }
    if (diag.i >= diag.qs.length) return finishDiag();
    const { t, s, sh } = diag.qs[diag.i];
    app.innerHTML = `<div class="page-h"><h1>Diagnostic</h1><p>Question ${diag.i + 1} of ${diag.qs.length}. No feedback until the end, so answer from what you actually know.</p></div>
      <div class="pg"><i style="width:${(diag.i / diag.qs.length) * 100}%"></i></div>
      <div class="quiz tc" style="--h:${hueOf(t.id)}"><span class="chip tc">${esc(t.title)}</span><div class="q" style="margin-top:12px">${s.q}</div>
      ${sh.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="l">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}
      <button class="btn ghost" id="dskip" style="margin-top:8px">I don't know</button></div>`;
    $$('.opt', app).forEach((b) => (b.onclick = () => { diag.answers.push(+b.dataset.i); diag.i++; drawDiag(); }));
    $('#dskip').onclick = () => { diag.answers.push(-1); diag.i++; drawDiag(); };
  }

  function finishDiag() {
    const tracks = {}, missed = [];
    diag.qs.forEach(({ t, l, s, sh }, i) => {
      const r = (tracks[t.id] = tracks[t.id] || { right: 0, total: 0 }); r.total++;
      if (diag.answers[i] === sh.answer) r.right++; else missed.push({ q: strip(s.q), correct: s.options[s.answer], explain: s.explain, lesson: l.id });
    });
    store.set('diag', { ts: Date.now(), tracks, missed }); logAct('practice', diag.qs.length); addXp(40, 'Diagnostic complete');
    diag = null; viewPlan();
  }

  /* ---------------- backup ---------------- */
  function exportData() {
    const data = {}; try { Object.keys(localStorage).filter((k) => k.startsWith('sil:')).forEach((k) => (data[k] = localStorage.getItem(k))); } catch {}
    const blob = new Blob([JSON.stringify({ app: 'senior-interview-lab', version: 1, exported: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `interview-lab-progress-${dstr(new Date())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Progress exported');
  }
  function importData(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((txt) => {
      let j; try { j = JSON.parse(txt); } catch { return alert('That file is not valid JSON.'); }
      if (!j || j.app !== 'senior-interview-lab' || !j.data) return alert('That does not look like a progress export from this app.');
      const keys = Object.keys(j.data).filter((k) => k.startsWith('sil:'));
      if (!confirm(`Import ${keys.length} items? This REPLACES your current progress on this device.`)) return;
      try { Object.keys(localStorage).filter((k) => k.startsWith('sil:')).forEach((k) => localStorage.removeItem(k)); keys.forEach((k) => localStorage.setItem(k, j.data[k])); } catch {}
      location.hash = '#/plan'; location.reload();
    });
  }
});
