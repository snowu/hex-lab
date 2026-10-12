/* Story bank: write STAR stories, see coverage gaps, practise delivering them out loud. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  const { $, $$, esc, store, ic, app, addXp, logAct, toast, fmtClock, confetti } = H;
  H.routes.push([/^#\/stories$/, () => viewStories()]);

  const COMP = [
    { id: 'ownership', name: 'Ownership', qs: ['Tell me about a time you took ownership of something outside your remit.', 'Describe a project you drove end to end.'] },
    { id: 'conflict', name: 'Disagreement', qs: ['Tell me about a time you disagreed with a teammate or manager.', 'Describe a conflict over a technical decision and how it ended.'] },
    { id: 'failure', name: 'Failure', qs: ['Tell me about a mistake you made that had real impact.', 'Describe a project that failed or was cancelled.'] },
    { id: 'leadership', name: 'Mentoring & leading', qs: ['Tell me about a time you mentored or unblocked someone.', 'How have you raised the bar for your team?'] },
    { id: 'ambiguity', name: 'Ambiguity', qs: ['Describe delivering something with unclear requirements.', 'How do you decide when you do not have enough information?'] },
    { id: 'tradeoffs', name: 'Technical trade-offs', qs: ['Tell me about a hard technical decision and the trade-offs you weighed.', 'Describe choosing a simpler solution over a more elegant one.'] },
    { id: 'incident', name: 'Incident under pressure', qs: ['Walk me through a production incident you owned.', 'Tell me about debugging something hard under time pressure.'] },
    { id: 'influence', name: 'Influence without authority', qs: ['Tell me about convincing people who did not report to you.', 'How did you get buy-in for a change others resisted?'] },
    { id: 'deadline', name: 'Deadlines & priorities', qs: ['Tell me about delivering under a tight deadline.', 'How do you prioritise when everything is urgent?'] },
    { id: 'quality', name: 'Quality & reliability', qs: ['Describe how you improved quality or reliability.', 'Tell me about pushing back on shipping something unsafe.'] },
    { id: 'customer', name: 'Customer / stakeholder', qs: ['Tell me about a decision you made for the user or customer.', 'Describe working with a difficult stakeholder.'] },
    { id: 'growth', name: 'Learning & feedback', qs: ['Tell me about something you learned recently and applied.', 'Describe feedback that changed how you work.'] },
  ];
  const FIELDS = [['s', 'Situation', 'Context in one or two sentences: where, when, what was at stake.'], ['t', 'Task', 'What exactly was YOUR responsibility or goal?'], ['a', 'Action', 'What YOU did, step by step. Use "I", name the decisions and the trade-offs.'], ['r', 'Result', 'The outcome with a number: latency, money, time, incidents, adoption.'], ['l', 'Reflection', 'What you learned or changed afterwards (a habit, a test, a process).']];
  const stories = () => store.get('stories', []);
  const save = (arr) => store.set('stories', arr);
  const wc = (t) => (String(t || '').trim().match(/\S+/g) || []).length;
  let mode = { v: 'list' };
  const draftKey = 'storyDraft';
  const preserveDraft = (draft) => store.set(draftKey, { ...draft, tags: [...(draft.tags || [])], draftSaved: Date.now() });

  function coach(st) {
    const total = ['s', 't', 'a', 'r', 'l'].reduce((n, k) => n + wc(st[k]), 0);
    const I = (String(st.a || '').match(/\bI\b|\bI'/g) || []).length, we = (String(st.a || '').match(/\bwe\b|\bour\b/gi) || []).length;
    const checks = [
      { ok: total >= 160 && total <= 360, label: `Length ${total} words (aim 160-360, about 2 minutes aloud)` },
      { ok: /\d/.test(st.r || ''), label: 'The result contains a number' },
      { ok: wc(st.a) >= 40 && !(we > I * 2 && I < 3), label: wc(st.a) < 40 ? 'The action is thin: describe what YOU did' : we > I * 2 && I < 3 ? 'Too much "we": say what I did' : 'Action uses "I" and has substance' },
      { ok: wc(st.l) >= 12, label: 'A reflection (what you learned or changed)' },
      { ok: wc(st.s) + wc(st.t) <= Math.max(40, total * 0.4), label: 'Context is short (situation + task under 40% of the story)' },
    ];
    return { total, checks, score: checks.filter((c) => c.ok).length };
  }

  function viewStories() {
    document.title = 'Story bank · Senior Interview Lab';
    if (mode.v === 'edit') return drawEdit();
    if (mode.v === 'practice') return drawPractice();
    const arr = stories(), filter = mode.filter || '';
    const count = (cid) => arr.filter((s) => (s.tags || []).includes(cid)).length;
    const shown = filter ? arr.filter((s) => (s.tags || []).includes(filter)) : arr, fc = COMP.find((c) => c.id === filter);
    app.innerHTML = `<div class="page-h"><h1>Story bank</h1><p>Behavioral rounds are won with prepared stories. Write 6-8 strong ones, tag what each shows, and practise them aloud until they are 2 minutes and sound natural. One good story covers several questions.</p></div>
      ${store.get(draftKey, null) ? `<div class="callout"><b>Unfinished story: ${esc(store.get(draftKey, {}).title || 'Untitled')}</b><p>Your writing is saved on this device. Resume it before starting another story.</p><button class="btn primary" id="sresume">Resume draft</button><button class="btn ghost" id="sdiscard">Discard draft</button></div>` : ''}
      <section><div class="ph"><h2>Coverage</h2><span class="muted">${COMP.filter((c) => count(c.id)).length}/${COMP.length} competencies have a story</span></div>
        <div class="cov">${COMP.map((c) => `<button class="covc ${count(c.id) ? 'has' : 'gap'} ${filter === c.id ? 'on' : ''}" data-c="${c.id}"><b>${esc(c.name)}</b><small>${count(c.id) ? count(c.id) + ' stor' + (count(c.id) > 1 ? 'ies' : 'y') : 'no story yet'}</small></button>`).join('')}</div>
        ${fc ? `<div class="callout"><b>${esc(fc.name)}.</b> Typical questions:<ul>${fc.qs.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>${count(fc.id) ? 'Which of your stories answers it best?' : 'You have no story for this yet. Write one.'} <button class="btn sm ghost" id="covclear">show all</button></div>` : ''}</section>
      <section><div class="ph"><h2>${fc ? esc(fc.name) + ' stories' : 'Your stories'}</h2><button class="btn primary" id="snew">${ic('mic', 15)} New story</button></div>
        ${shown.length ? `<div class="sgrid">${shown.map((s) => { const c = coach(s); return `<div class="scard"><div class="stop"><h3>${esc(s.title || 'Untitled')}</h3><span class="chip ${c.score >= 4 ? 'good' : c.score >= 3 ? '' : 'hot'}">structure ${c.score}/5</span></div>
          <div class="tags">${(s.tags || []).map((t) => `<span class="chip">${esc((COMP.find((x) => x.id === t) || { name: t }).name)}</span>`).join('') || '<span class="muted">no tags</span>'}</div>
          <p class="muted">${esc((s.s || '').slice(0, 130))}${(s.s || '').length > 130 ? '…' : ''}</p>
          ${s.nextPractice ? `<div class="callout"><b>Next attempt</b><p>${esc(s.nextPractice)}</p></div>` : ''}${s.practiceHistory?.length ? `<p class="muted">Last attempt: ${fmtClock(s.practiceHistory.at(-1).seconds)} · ${s.practiceHistory.at(-1).peeked ? 'outline used' : 'without outline'}</p>` : ''}
          <div class="sbtn"><button class="btn sm" data-e="${s.id}">Edit</button><button class="btn sm primary" data-p="${s.id}">${ic('play', 13)} Practise</button><button class="btn sm ghost" data-d="${s.id}">Delete</button><span class="muted">practised ${s.practised || 0}×</span></div></div>`; }).join('')}</div>`
        : `<div class="empty"><div class="big">${ic('mic', 30)}</div><h2 style="margin:0 0 6px">${fc ? 'No story for this yet' : 'No stories yet'}</h2><p style="color:var(--muted);margin:0">Start with the one you are proudest of, or the one you dread being asked about.</p></div>`}</section>`;
    const resume = $('#sresume'); if (resume) resume.onclick = () => { mode = { v: 'edit', draft: store.get(draftKey, {}) }; viewStories(); };
    const discard = $('#sdiscard'); if (discard) discard.onclick = () => { if (confirm('Discard the unfinished draft? Saved stories are kept.')) { store.set(draftKey, null); viewStories(); } };
    $$('.covc').forEach((b) => (b.onclick = () => { mode.filter = mode.filter === b.dataset.c ? '' : b.dataset.c; viewStories(); }));
    const cc = $('#covclear'); if (cc) cc.onclick = () => { mode.filter = ''; viewStories(); };
    $('#snew').onclick = () => { if (store.get(draftKey, null)) { toast('Resume or discard your unfinished draft first'); return; } mode = { v: 'edit', draft: { id: 'st' + Date.now().toString(36), title: '', tags: filter ? [filter] : [], s: '', t: '', a: '', r: '', l: '', created: Date.now() } }; viewStories(); };
    $$('[data-e]').forEach((b) => (b.onclick = () => { if (store.get(draftKey, null)) { toast('Resume or discard your unfinished draft first'); return; } mode = { v: 'edit', draft: { ...stories().find((s) => s.id === b.dataset.e) } }; viewStories(); }));
    $$('[data-p]').forEach((b) => (b.onclick = () => { mode = { v: 'practice', id: b.dataset.p }; viewStories(); }));
    $$('[data-d]').forEach((b) => (b.onclick = () => { if (confirm('Delete this story?')) { save(stories().filter((s) => s.id !== b.dataset.d)); viewStories(); } }));
  }

  function drawEdit() {
    const d = mode.draft;
    preserveDraft(d);
    app.innerHTML = `<div class="crumbs"><a href="#/stories" id="sback">${ic('home', 14)} Story bank</a> ${ic('arrow', 12)} <span>${d.title ? esc(d.title) : 'new story'}</span></div>
      <div class="edit"><div class="form">
        <label class="lbl">Title (just for you)</label><input id="stitle" class="inp" value="${esc(d.title)}" placeholder="e.g. Cut checkout p99 from 4s to 0.9s">
        <label class="lbl">What does it show? (tag every competency it can answer)</label>
        <div class="tagsel">${COMP.map((c) => `<button type="button" class="fchip ${(d.tags || []).includes(c.id) ? 'on' : ''}" data-t="${c.id}">${esc(c.name)}</button>`).join('')}</div>
        ${FIELDS.map(([k, n, h]) => `<label class="lbl">${n} <span class="wcnt" data-w="${k}"></span></label><div class="muted fh">${esc(h)}</div><textarea class="inp" data-k="${k}" rows="${k === 'a' ? 6 : 3}">${esc(d[k] || '')}</textarea>`).join('')}
        <div class="dbar"><button class="btn primary" id="ssave">${ic('check', 15)} Save story</button><button class="btn ghost" id="scancel">Keep draft &amp; return</button><span class="muted" role="status">Draft saved on this device</span></div>
        <div id="sfbk"></div>
      </div><aside class="coach"><h3>Story structure check</h3><div id="cbody"></div><p class="muted">These checks describe structure, not interview readiness. A concrete qualitative outcome can be useful too. Prepare to explain alternatives, your contribution, and what you would change.</p></aside></div>`;
    const upd = () => {
      FIELDS.forEach(([k]) => { $(`.wcnt[data-w="${k}"]`).textContent = wc(d[k]) + ' words'; });
      const c = coach(d);
      $('#cbody').innerHTML = `<div class="cscore"><b>${c.score}/5</b><span class="rbar"><i style="width:${c.score * 20}%"></i></span></div><ul class="chk5">${c.checks.map((x) => `<li class="${x.ok ? 'ok' : ''}">${ic(x.ok ? 'check' : 'x', 13, 3)} ${esc(x.label)}</li>`).join('')}</ul>`;
    };
    $('#stitle').oninput = (e) => { d.title = e.target.value; preserveDraft(d); };
    $$('textarea[data-k]').forEach((t) => (t.oninput = () => { d[t.dataset.k] = t.value; preserveDraft(d); upd(); }));
    $$('.tagsel .fchip').forEach((b) => (b.onclick = () => { const t = b.dataset.t; d.tags = (d.tags || []).includes(t) ? d.tags.filter((x) => x !== t) : [...(d.tags || []), t]; b.classList.toggle('on'); preserveDraft(d); }));
    $('#ssave').onclick = () => {
      if (!(d.title || '').trim()) return toast('Give the story a title');
      const arr = stories(), i = arr.findIndex((s) => s.id === d.id); d.updated = Date.now();
      if (i >= 0) arr[i] = { ...arr[i], ...d }; else { arr.push(d); addXp(20, 'Story saved'); }
      save(arr); store.set(draftKey, null); mode = { v: 'list' }; viewStories();
    };
    $('#scancel').onclick = $('#sback').onclick = (e) => { e.preventDefault(); mode = { v: 'list' }; viewStories(); };
    if (window.FEEDBACK) FEEDBACK.mount($('#sfbk'), { kind: 'story', prompt: 'Behavioural story' + (d.title ? ': ' + d.title : '') + '. Competencies: ' + (d.tags || []).join(', '), getAnswer: () => FIELDS.map(([k, n]) => n + ': ' + (d[k] || '')).join('\n') });
    upd();
  }

  function drawPractice() {
    const st = stories().find((s) => s.id === mode.id); if (!st) { mode = { v: 'list' }; return viewStories(); }
    const eligible = COMP.filter((c) => (st.tags || []).includes(c.id));
    const comp = eligible[Math.floor(Math.random() * eligible.length)] || COMP[0], q = comp.qs[Math.floor(Math.random() * comp.qs.length)], limit = 150;
    let peeked = false;
    let t0 = null, iv = null, secs = 0;
    app.innerHTML = `<div class="crumbs"><a href="#/stories" id="pback">${ic('home', 14)} Story bank</a> ${ic('arrow', 12)} <span>practise</span></div>
      <section class="qcard tc brk"><span class="chip tc">${esc(comp.name)}</span><div class="qq">${esc(q)}</div>
        <p class="muted">Answer out loud using your story. Target 2:00, hard stop at 2:30. Do not read it.</p>
        <div class="timer"><span class="tm" id="ptm">00:00</span><span class="tb" id="ptb"><i style="width:0"></i></span></div>
        <div class="dbar"><button class="btn primary" id="pstart">${ic('play', 15)} Start answering</button><button class="btn" id="pdone" disabled>${ic('check', 15)} I'm done</button><button class="btn ghost" id="ppeek">Peek at my outline</button></div>
        <div id="poutline" hidden><ul class="outl">${FIELDS.map(([k, n]) => `<li><b>${n}:</b> ${esc((st[k] || '').split(/(?<=[.!?])\s/)[0] || '')}</li>`).join('')}</ul></div>
        <div id="pself"></div></section>`;
    const tick = () => { if (!$('#ptm')) { clearInterval(iv); return; } secs = Math.floor((Date.now() - t0) / 1000); $('#ptm').textContent = fmtClock(secs); $('#ptb i').style.width = Math.min(100, (secs / limit) * 100) + '%'; $('#ptb').classList.toggle('over', secs > limit); };
    $('#pstart').onclick = () => { if (iv) return; t0 = Date.now(); iv = setInterval(tick, 400); $('#pstart').disabled = true; $('#pdone').disabled = false; };
    $('#ppeek').onclick = () => { peeked = true; $('#poutline').hidden = false; $('#ppeek').disabled = true; };
    $('#pdone').onclick = () => {
      clearInterval(iv); iv = null; tick();
      const list = [`Under 2:30 (you took ${fmtClock(secs)})`, 'Clear situation in the first 20 seconds', 'I said what I did, not what we did', 'Gave a concrete number in the result', 'Ended with what I learned', 'Did not read from the page'];
      $('#pself').innerHTML = `<h3>Self-check</h3><ul class="rubric" id="prub">${list.map((x, i) => `<li role="checkbox" tabindex="0" aria-checked="${i === 0 && secs <= limit}" class="${i === 0 && secs <= limit ? 'hit' : ''}"><span class="cb">${ic('check', 12, 3.4)}</span><span>${esc(x)}</span></li>`).join('')}</ul><p class="muted">Self-reported reflection, not a scored interview. ${peeked ? 'You opened the outline; try the next attempt without it.' : 'Use the checks to choose one thing to improve.'}</p><label class="lbl" for="pnext">One specific change for your next attempt</label><textarea class="inp" id="pnext" rows="3" placeholder="e.g. Explain why I rejected the migration before describing the result."></textarea><div class="dbar"><button class="btn primary" id="psave">Save practice</button></div>`;
      $$('#prub li').forEach((li) => { li.onclick = () => { li.classList.toggle('hit'); li.setAttribute('aria-checked', String(li.classList.contains('hit'))); }; li.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); li.click(); } }; });
      $('#psave').onclick = () => {
        const arr = stories(), s = arr.find((x) => x.id === st.id); s.practised = (s.practised || 0) + 1; s.lastPractised = Date.now(); s.lastScore = $$('#prub li.hit').length; s.nextPractice = $('#pnext').value.trim(); s.practiceHistory = [...(s.practiceHistory || []), { at: Date.now(), seconds: secs, question: q, checked: $$('#prub li').map((li) => li.classList.contains('hit')), peeked, next: s.nextPractice }].slice(-20); save(arr);
        logAct('story'); addXp(15, 'Story practised'); mode = { v: 'list' }; viewStories();
      };
    };
    $('#pback').onclick = (e) => { e.preventDefault(); clearInterval(iv); mode = { v: 'list' }; viewStories(); };
    H.setCleanup(() => clearInterval(iv));
  }
});
