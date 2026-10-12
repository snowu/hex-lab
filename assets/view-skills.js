/* Skills: per-track mastery from what you actually did — learning, practice, recall.
   The plan page shows one readiness bar per track (lessons + diagnostic); this page breaks
   mastery into components, weakest first, each with the next action that moves it. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  const { $, esc, ic, app, store, TRACKS, lessonPct, itemsOf, hueOf, ring, getProgress } = H;
  H.routes.push([/^#\/skills$/, () => viewSkills()]);

  const PRACTICE = new Set(['code', 'drill', 'bug', 'predict']);
  const pct = (done, total) => (total ? Math.round((done / total) * 100) : null);
  function components(t) {
    const P = getProgress();
    let learnDone = 0, learnTotal = 0, pracDone = 0, pracTotal = 0, recDone = 0, recTotal = 0;
    for (const l of t.lessons) {
      const p = P[l.id] || {};
      for (const { s, k } of itemsOf(l)) {
        if (k[0] === 'h') { recTotal++; if (p[k]) recDone++; }
        else if (PRACTICE.has(s.type)) { pracTotal++; if (p[k]) pracDone++; }
        else { learnTotal++; if (p[k]) learnDone++; }
      }
    }
    return { learn: pct(learnDone, learnTotal), practice: pct(pracDone, pracTotal), recall: pct(recDone, recTotal) };
  }
  const overall = (c) => { const vs = [c.learn, c.practice, c.recall].filter((v) => v !== null); return vs.length ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : 0; };
  const dueIn = (t) => (window.LESSON_SR ? LESSON_SR.due().filter((d) => t.lessons.some((l) => l.id === d.id)) : []);
  function nextAction(t) {
    const due = dueIn(t);
    if (due.length) return { href: due[0].href, label: `Review due: ${due[0].title}` };
    let worst = null, worstPct = 101;
    for (const l of t.lessons) { const p = lessonPct(l); if (p < worstPct) { worstPct = p; worst = l; } }
    if (worst && worstPct < 100) return { href: '#/lesson/' + worst.id, label: `Continue: ${worst.title} (${worstPct}%)` };
    return { href: '#/lesson/' + t.lessons[0].id, label: 'Revisit from the top' };
  }
  const bar = (name, v) => (v === null
    ? `<div class="sk-row"><span>${name}</span><span class="muted">no items</span></div>`
    : `<div class="sk-row"><span>${name}</span><span class="sk-bar"><i style="width:${v}%"></i></span><b>${v}%</b></div>`);

  function viewSkills() {
    document.title = 'Skills · Hex Lab';
    const rows = TRACKS.map((t) => {
      const c = components(t), o = overall(c), due = dueIn(t), act = nextAction(t);
      const weak = [['Learn', c.learn], ['Practice', c.practice], ['Recall', c.recall]].filter(([, v]) => v !== null).sort((a, b) => a[1] - b[1])[0];
      return { t, c, o, due, act, weak };
    }).sort((a, b) => a.o - b.o);
    const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.o, 0) / rows.length) : 0;
    const dueTotal = rows.reduce((a, r) => a + r.due.length, 0);
    app.innerHTML = `<div class="page-h"><h1>Skills</h1><p>Mastery per track from what you actually did: learning the lessons, doing the challenges, recalling the checks. Weakest first — pick the top card and do its next action.</p></div>
    <div class="sk-sum"><span>Average mastery <b>${avg}%</b></span>${dueTotal ? `<a class="chip" href="#/plan">${dueTotal} recall review${dueTotal === 1 ? '' : 's'} due</a>` : '<span class="muted">No recall reviews due. Answer a lesson\u2019s checks to schedule them.</span>'}</div>
    <div class="sk-grid">${rows.map(({ t, c, o, due, act, weak }) => `
      <section class="sk-card tc" style="--h:${hueOf(t.id)}"><div class="sk-top">${ring(o, 52)}<div><h2>${esc(t.title)}</h2><p class="muted">${t.lessons.length} lessons · weakest: ${weak ? weak[0] + ' ' + weak[1] + '%' : '—'}</p></div></div>
      ${bar('Learn', c.learn)}${bar('Practice', c.practice)}${bar('Recall', c.recall)}
      ${due.length ? `<p class="sk-due">${due.length} recall review${due.length === 1 ? '' : 's'} due</p>` : ''}
      <a class="btn sm" href="${act.href}">${esc(act.label)} ${ic('arrow', 14)}</a></section>`).join('')}</div>`;
  }
});
