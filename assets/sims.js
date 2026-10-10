/* Interactive simulations. Each SIMS.<id> = (root) => dispose() */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PAL = ['#39ff7a', '#00e5ff', '#ffb000', '#ff6ac1', '#b08cff', '#ff7a59', '#7dffb2', '#6ab0ff', '#ffd166', '#ff9ec7'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fnv(str) { /* FNV-1a + murmur3 finalizer: plain FNV clusters similar strings, which would skew the ring */
  let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0;
}
const SIMS = (window.SIMS = {});

/* =========================================================
   Kafka: keys -> partitions -> consumer group
   ========================================================= */
SIMS.kafka = (root) => {
  const KEYS = ['pay-1', 'pay-2', 'pay-3', 'pay-4', 'pay-5'];
  const color = (k) => PAL[KEYS.indexOf(k) % PAL.length];
  let parts = 4, cons = 2, hot = false, auto = false, seq = 0, timer = null;
  let P = Array.from({ length: parts }, () => []);
  const assign = () => {
    const out = {}, base = Math.floor(parts / cons), extra = parts % cons; let n = 0;
    for (let i = 0; i < cons; i++) { const c = base + (i < extra ? 1 : 0); out['c' + (i + 1)] = Array.from({ length: c }, (_, k) => n + k); n += c; }
    return out;
  };
  let prev = assign();
  const send = (k) => P[fnv(k) % parts].push({ key: k, n: ++seq, done: false });
  const randKey = () => (hot && Math.random() < 0.8 ? 'pay-1' : KEYS[Math.floor(Math.random() * KEYS.length)]);
  const step = () => Object.values(assign()).forEach((ps) => ps.forEach((p) => { const m = P[p].find((x) => !x.done); if (m) m.done = true; }));
  const reset = () => { P = Array.from({ length: parts }, () => []); seq = 0; prev = assign(); };
  function render() {
    const a = assign(), owner = {}; Object.entries(a).forEach(([c, ps]) => ps.forEach((p) => (owner[p] = c)));
    const moved = new Set(); Object.entries(a).forEach(([c, ps]) => ps.forEach((p) => { const old = Object.entries(prev).find(([, q]) => q.includes(p)); if (!old || old[0] !== c) moved.add(p); }));
    prev = a;
    const lag = P.map((q) => q.filter((m) => !m.done).length), total = lag.reduce((x, y) => x + y, 0);
    const span = {}; P.forEach((q, i) => q.forEach((m) => ((span[m.key] = span[m.key] || new Set()).add(i))));
    const split = Object.entries(span).filter(([, s]) => s.size > 1);
    const idle = Math.max(0, cons - parts);
    const hotP = total >= 8 ? lag.findIndex((l) => l / total > 0.6) : -1;
    root.innerHTML = `
      <div class="sim-ctl">
        <span class="grp"><b>Produce</b>${KEYS.map((k) => `<button class="btn sm kbtn" data-k="${k}" style="--kc:${color(k)}">${k}</button>`).join('')}<button class="btn sm" data-act="rand">random ×10</button><label class="chk"><input type="checkbox" data-chk="hot" ${hot ? 'checked' : ''}> hot key</label></span>
        <span class="grp"><b>Topic</b><button class="btn sm" data-act="addp" ${parts >= 8 ? 'disabled' : ''}>+ partition (${parts})</button></span>
        <span class="grp"><b>Consumers</b><button class="btn sm" data-act="cm" ${cons <= 1 ? 'disabled' : ''}>−</button><span class="num">${cons}</span><button class="btn sm" data-act="cp" ${cons >= 10 ? 'disabled' : ''}>+</button></span>
        <span class="grp"><button class="btn sm primary" data-act="step">Process 1 / partition</button><label class="chk"><input type="checkbox" data-chk="auto" ${auto ? 'checked' : ''}> auto</label><button class="btn sm ghost" data-act="reset">reset</button></span>
      </div>
      <div class="kp" style="grid-template-columns:repeat(${parts},minmax(0,1fr))">${P.map((q, i) => `
        <div class="kcol ${moved.has(i) ? 'flash' : ''} ${i === hotP ? 'hotp' : ''}"><div class="kh"><b>P${i}</b><span class="chip ${owner[i] ? 'good' : ''}">${owner[i] || 'unassigned'}</span></div>
          <div class="kb">${q.length > 16 ? `<small>+${q.length - 16} older</small>` : ''}${q.slice(-16).map((m) => `<i class="m ${m.done ? 'd' : ''}" style="--kc:${color(m.key)}" title="${m.key} #${m.n}">${m.n}</i>`).join('')}</div>
          <div class="kf">lag <b>${lag[i]}</b></div></div>`).join('')}</div>
      <div class="kcons">${Object.entries(a).map(([c, ps]) => `<span class="chip ${ps.length ? 'tc' : 'hot'}">${c}: ${ps.length ? ps.map((p) => 'P' + p).join(' ') : 'IDLE'}</span>`).join('')}</div>
      <div class="sim-note">
        ${idle ? `<p class="warn">${idle} consumer${idle > 1 ? 's are' : ' is'} idle: within a group, one partition is read by at most one consumer, so parallelism is capped at the partition count.</p>` : ''}
        ${split.map(([k, s]) => `<p class="warn">${k} now spans ${[...s].map((x) => 'P' + x).join(' and ')}. Per-key ordering is no longer guaranteed. This is why changing the partition count is risky.</p>`).join('')}
        ${hotP >= 0 ? `<p class="warn">Hot partition: P${hotP} holds ${Math.round((lag[hotP] / total) * 100)}% of the backlog while other consumers sit nearly idle. Adding consumers will not help.</p>` : ''}
        ${!idle && !split.length && hotP < 0 ? `<p>Messages with the same key always hash to the same partition, so they are consumed in order.</p>` : ''}
      </div>`;
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k],[data-act]'); if (!b) return;
    if (b.dataset.k) send(b.dataset.k);
    else switch (b.dataset.act) {
      case 'rand': for (let i = 0; i < 10; i++) send(randKey()); break;
      case 'addp': parts++; P.push([]); break;
      case 'cp': cons++; break; case 'cm': cons--; break;
      case 'step': step(); break;
      case 'reset': parts = 4; cons = 2; reset(); break;
    }
    render();
  });
  root.addEventListener('change', (e) => {
    const c = e.target.dataset.chk; if (!c) return;
    if (c === 'hot') hot = e.target.checked;
    if (c === 'auto') { auto = e.target.checked; clearInterval(timer); if (auto) timer = setInterval(() => { step(); render(); }, 700); }
  });
  render();
  return () => clearInterval(timer);
};

/* =========================================================
   Circuit breaker
   ========================================================= */
SIMS.breaker = (root) => {
  const cfg = { threshold: 3, cooldown: 4, down: false, auto: false };
  const S = { state: 'closed', fails: 0, openedAt: 0, log: [], reached: 0, fast: 0 };
  const now = () => performance.now();
  const elapsed = () => now() - S.openedAt;
  const shown = () => (S.state === 'half' || (S.state === 'open' && elapsed() >= cfg.cooldown * 1000) ? 'half-open' : S.state);
  const push = (x) => { S.log.push(x); if (S.log.length > 48) S.log.shift(); };
  const send = () => {
    if (S.state === 'open') { if (elapsed() >= cfg.cooldown * 1000) S.state = 'half'; else { S.fast++; push('x'); return; } }
    S.reached++;
    if (!cfg.down) { S.state = 'closed'; S.fails = 0; push('ok'); }
    else { S.fails++; push('f'); if (S.state === 'half' || S.fails >= cfg.threshold) { S.state = 'open'; S.openedAt = now(); } }
  };
  root.innerHTML = `
    <div class="sim-ctl">
      <span class="grp"><button class="btn sm primary" data-a="send">Send request</button><label class="chk"><input type="checkbox" data-c="auto"> auto (4/s)</label><button class="btn sm ghost" data-a="reset">reset</button></span>
      <span class="grp"><b>Dependency</b><button class="btn sm" data-a="toggle" id="dep"></button></span>
      <span class="grp"><label class="rng"><span>failure threshold <b id="thv">3</b></span><input type="range" min="1" max="8" value="3" data-r="threshold"></label><label class="rng"><span>cooldown <b id="cdv">4s</b></span><input type="range" min="1" max="10" value="4" data-r="cooldown"></label></span>
    </div>
    <div class="bk"><div class="bn" data-s="closed"><b>CLOSED</b><small>requests flow</small></div><span class="ba">fails ≥ threshold →</span><div class="bn" data-s="open"><b>OPEN</b><small>fail fast</small></div><span class="ba">cooldown over →</span><div class="bn" data-s="half-open"><b>HALF-OPEN</b><small>one probe</small></div></div>
    <div class="bcd"><span id="bcdl"></span><span class="bbar"><i id="bcdb"></i></span></div>
    <div class="blog" id="blog"></div>
    <div class="bcnt" id="bcnt"></div>
    <div class="sim-note"><p><span class="lg ok"></span> reached dependency, succeeded &nbsp; <span class="lg f"></span> reached dependency, failed &nbsp; <span class="lg x"></span> rejected instantly by the open breaker (dependency untouched)</p></div>`;
  const upd = () => {
    const st = shown();
    $$('.bn', root).forEach((n) => n.classList.toggle('on', n.dataset.s === st));
    $('#dep', root).textContent = cfg.down ? 'DOWN (failing)' : 'UP (healthy)'; $('#dep', root).classList.toggle('bad', cfg.down);
    const rem = S.state === 'open' ? Math.max(0, cfg.cooldown * 1000 - elapsed()) : 0;
    $('#bcdl', root).textContent = S.state === 'open' ? (rem > 0 ? `cooldown ${(rem / 1000).toFixed(1)}s` : 'cooldown over: next request is the probe') : st === 'half-open' ? 'next request is the probe' : `consecutive failures: ${S.fails} / ${cfg.threshold}`;
    $('#bcdb', root).style.width = S.state === 'open' ? (100 - (rem / (cfg.cooldown * 1000)) * 100) + '%' : '0%';
    $('#blog', root).innerHTML = S.log.map((x) => `<i class="lg ${x}"></i>`).join('');
    $('#bcnt', root).innerHTML = `<span><b>${S.reached}</b> calls reached the dependency</span><span><b>${S.fast}</b> calls rejected instantly (load shed)</span>`;
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'send') send();
    if (b.dataset.a === 'toggle') cfg.down = !cfg.down;
    if (b.dataset.a === 'reset') { Object.assign(S, { state: 'closed', fails: 0, openedAt: 0, log: [], reached: 0, fast: 0 }); }
    upd();
  });
  root.addEventListener('input', (e) => {
    const r = e.target.dataset.r; if (!r) return; cfg[r] = +e.target.value;
    $('#thv', root).textContent = cfg.threshold; $('#cdv', root).textContent = cfg.cooldown + 's'; upd();
  });
  root.addEventListener('change', (e) => { if (e.target.dataset.c === 'auto') cfg.auto = e.target.checked; });
  let tick = 0;
  const iv = setInterval(() => { tick++; if (cfg.auto && tick % 3 === 0) send(); upd(); }, 83);
  upd();
  return () => clearInterval(iv);
};

/* =========================================================
   Consistent hashing ring
   ========================================================= */
SIMS.ring = (root) => {
  const NK = 90, keys = Array.from({ length: NK }, (_, i) => 'key-' + i);
  let nodes = ['N1', 'N2', 'N3'], vn = 20, nextId = 4, last = null;
  const ncolor = (n) => PAL[(+n.slice(1) - 1) % PAL.length];
  const ringPts = () => nodes.flatMap((n) => Array.from({ length: vn }, (_, i) => ({ h: fnv(n + '#' + i), n }))).sort((a, b) => a.h - b.h);
  const ownerRing = (pts, k) => { if (!pts.length) return null; const h = fnv(k); let lo = 0, hi = pts.length; while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].h < h) lo = m + 1; else hi = m; } return pts[lo % pts.length].n; };
  const assignRing = () => { const pts = ringPts(); return Object.fromEntries(keys.map((k) => [k, ownerRing(pts, k)])); };
  const assignMod = () => Object.fromEntries(keys.map((k) => [k, nodes[fnv(k) % nodes.length]]));
  let curRing = assignRing(), curMod = assignMod();
  const change = (fn) => {
    const r0 = curRing, m0 = curMod; fn(); curRing = assignRing(); curMod = assignMod();
    const mv = (a, b) => keys.filter((k) => a[k] !== b[k]).length;
    last = { ring: mv(r0, curRing), mod: mv(m0, curMod) };
    draw();
  };
  const ang = (h) => (h / 4294967296) * Math.PI * 2 - Math.PI / 2;
  const pos = (h, r) => [150 + Math.cos(ang(h)) * r, 150 + Math.sin(ang(h)) * r];
  root.innerHTML = `
    <div class="sim-ctl"><span class="grp"><button class="btn sm primary" data-a="add">+ add node</button><button class="btn sm" data-a="rm">− remove last node</button><button class="btn sm ghost" data-a="reset">reset</button></span>
      <span class="grp"><label class="rng"><span>virtual nodes per node <b id="vnv">${vn}</b></span><input type="range" min="1" max="100" value="${vn}" id="vn"></label></span></div>
    <div class="rg"><svg id="rsvg" viewBox="0 0 300 300" role="img" aria-label="Hash ring"></svg><div id="rinfo"></div></div>`;
  function draw() {
    const pts = ringPts();
    const ticks = pts.map((p) => { const [x1, y1] = pos(p.h, 108), [x2, y2] = pos(p.h, 120); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ncolor(p.n)}" stroke-width="2"/>`; }).join('');
    const dots = keys.map((k) => { const [x, y] = pos(fnv(k), 96); return `<circle cx="${x}" cy="${y}" r="3" fill="${ncolor(curRing[k])}" opacity=".9"/>`; }).join('');
    $('#rsvg', root).innerHTML = `<circle cx="150" cy="150" r="114" fill="none" stroke="var(--line2)" stroke-width="1"/>${ticks}${dots}<text x="150" y="146" text-anchor="middle" fill="var(--muted)" font-size="11" font-family="monospace">${NK} keys</text><text x="150" y="162" text-anchor="middle" fill="var(--accent)" font-size="13" font-family="monospace">${nodes.length} node${nodes.length > 1 ? 's' : ''}</text>`;
    const cnt = Object.fromEntries(nodes.map((n) => [n, 0])); keys.forEach((k) => cnt[curRing[k]]++);
    const ideal = NK / nodes.length;
    $('#rinfo', root).innerHTML = `<div class="rbars">${nodes.map((n) => `<div class="rb"><span style="color:${ncolor(n)}">${n}</span><span class="bar"><i style="width:${(cnt[n] / NK) * 100 * Math.min(4, nodes.length) / Math.min(4, nodes.length)}%;background:${ncolor(n)}"></i></span><b>${cnt[n]}</b></div>`).join('')}</div>
      <p class="muted">Ideal share: ${ideal.toFixed(1)} keys per node. ${nodes.length > 1 ? `Spread: ${Math.min(...Object.values(cnt))}–${Math.max(...Object.values(cnt))}.` : ''}</p>
      ${last ? `<div class="rmv"><div><small>keys moved by the last change</small></div>
        <div class="mvrow"><span>consistent hashing</span><span class="bar"><i style="width:${(last.ring / NK) * 100}%;background:var(--accent)"></i></span><b>${last.ring} (${Math.round((last.ring / NK) * 100)}%)</b></div>
        <div class="mvrow"><span>hash(key) mod N</span><span class="bar"><i style="width:${(last.mod / NK) * 100}%;background:var(--bad)"></i></span><b>${last.mod} (${Math.round((last.mod / NK) * 100)}%)</b></div></div>` : '<p class="muted">Add or remove a node and compare how many keys have to move.</p>'}`;
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'add' && nodes.length < 10) change(() => nodes.push('N' + nextId++));
    if (b.dataset.a === 'rm' && nodes.length > 1) change(() => nodes.pop());
    if (b.dataset.a === 'reset') { nodes = ['N1', 'N2', 'N3']; nextId = 4; vn = 20; $('#vn', root).value = 20; $('#vnv', root).textContent = 20; curRing = assignRing(); curMod = assignMod(); last = null; draw(); }
  });
  $('#vn', root).addEventListener('input', (e) => { vn = +e.target.value; $('#vnv', root).textContent = vn; curRing = assignRing(); last = null; draw(); });
  draw();
  return () => {};
};

/* =========================================================
   Token bucket rate limiter
   ========================================================= */
SIMS.bucket = (root) => {
  const cfg = { cap: 5, rate: 2, auto: false, autoRate: 5 };
  let tokens = cfg.cap, ok = 0, rej = 0, log = [], last = performance.now(), raf = 0, acc = 0;
  root.innerHTML = `
    <div class="sim-ctl"><span class="grp"><button class="btn sm primary" data-a="one">Send request</button><button class="btn sm" data-a="burst">Burst ×10</button><button class="btn sm ghost" data-a="reset">reset</button></span>
      <span class="grp"><label class="chk"><input type="checkbox" data-c="auto"> auto traffic</label><label class="rng"><span>rate <b id="arv">5</b>/s</span><input type="range" min="1" max="20" value="5" data-r="autoRate"></label></span>
      <span class="grp"><label class="rng"><span>capacity <b id="cpv">5</b></span><input type="range" min="1" max="12" value="5" data-r="cap"></label><label class="rng"><span>refill <b id="rfv">2</b>/s</span><input type="range" min="1" max="10" value="2" data-r="rate"></label></span></div>
    <div class="tb-cells" id="tbc"></div>
    <div class="tb-stat" id="tbs"></div>
    <div class="blog" id="tbl"></div>
    <div class="sim-note"><p><span class="lg ok"></span> allowed &nbsp; <span class="lg f"></span> rejected (HTTP 429). Capacity is the burst you tolerate; refill rate is the sustained throughput.</p></div>`;
  const req = () => { if (tokens >= 1) { tokens -= 1; ok++; log.push('ok'); } else { rej++; log.push('f'); } if (log.length > 60) log.shift(); };
  const draw = () => {
    $('#tbc', root).innerHTML = Array.from({ length: cfg.cap }, (_, i) => `<i class="tc-cell"><u style="height:${clamp(tokens - i, 0, 1) * 100}%"></u></i>`).join('');
    $('#tbs', root).innerHTML = `<span><b>${tokens.toFixed(1)}</b> / ${cfg.cap} tokens</span><span><b>${ok}</b> allowed</span><span><b>${rej}</b> rejected</span><span>reject rate <b>${ok + rej ? Math.round((rej / (ok + rej)) * 100) : 0}%</b></span>`;
    $('#tbl', root).innerHTML = log.map((x) => `<i class="lg ${x}"></i>`).join('');
  };
  const loop = (t) => {
    const dt = Math.min(0.25, (t - last) / 1000); last = t;
    tokens = Math.min(cfg.cap, tokens + dt * cfg.rate);
    if (cfg.auto) { acc += dt * cfg.autoRate; while (acc >= 1) { acc -= 1; req(); } }
    draw(); raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'one') req(); if (b.dataset.a === 'burst') for (let i = 0; i < 10; i++) req();
    if (b.dataset.a === 'reset') { tokens = cfg.cap; ok = rej = 0; log = []; }
  });
  root.addEventListener('input', (e) => {
    const r = e.target.dataset.r; if (!r) return; cfg[r] = +e.target.value;
    $('#arv', root).textContent = cfg.autoRate; $('#cpv', root).textContent = cfg.cap; $('#rfv', root).textContent = cfg.rate; tokens = Math.min(tokens, cfg.cap);
  });
  root.addEventListener('change', (e) => { if (e.target.dataset.c === 'auto') cfg.auto = e.target.checked; });
  return () => cancelAnimationFrame(raf);
};

/* =========================================================
   Bank outage: shared pool vs timeout / bulkhead / breaker
   ========================================================= */
SIMS.outage = (root) => {
  const BANKS = ['A', 'B', 'C'], BC = { A: '#39ff7a', B: '#00e5ff', C: '#ffb000' };
  const cfg = { load: 20, latC: 6000, failC: 0, pool: 12, timeout: false, bulkhead: false, breaker: false, speed: 1, running: true };
  let sim, iv = null;
  const reset = () => {
    sim = { t: 0, q: [], bq: { A: [], B: [], C: [] }, carry: { A: 0, B: 0, C: 0 }, win: { A: [], B: [], C: [] },
      brk: { state: 'closed', fails: 0, openedAt: 0, probing: false },
      workers: Array.from({ length: cfg.pool }, (_, i) => ({ free: true, until: 0, req: null, ok: true, home: BANKS[i % 3] })) };
  };
  const record = (r, ok, lat) => { sim.win[r.bank].push({ t: sim.t, ok, lat }); };
  const brkOpen = () => sim.brk.state === 'open' && sim.t - sim.brk.openedAt < 3000;
  const brkResult = (ok, lat) => {
    const b = sim.brk, bad = !ok || lat > 2000;
    if (!bad) { b.state = 'closed'; b.fails = 0; b.probing = false; return; }
    b.fails++; if (b.state === 'half' || b.fails >= 5) { b.state = 'open'; b.openedAt = sim.t; b.probing = false; }
  };
  const step = () => {
    const dt = 100; sim.t += dt;
    // arrivals
    const arrivals = [];
    for (const bank of BANKS) {
      sim.carry[bank] += (cfg.load * dt) / 1000; const n = Math.floor(sim.carry[bank]); sim.carry[bank] -= n;
      for (let i = 0; i < n; i++) arrivals.push(bank);
    }
    for (let i = arrivals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arrivals[i], arrivals[j]] = [arrivals[j], arrivals[i]]; } /* fair interleaving */
    {
      for (const bank of arrivals) {
        const r = { bank, t0: sim.t };
        if (bank === 'C' && cfg.breaker) {
          if (sim.brk.state === 'open' && sim.t - sim.brk.openedAt >= 3000) sim.brk.state = 'half';
          if (sim.brk.state === 'open' || (sim.brk.state === 'half' && sim.brk.probing)) { record(r, false, 0); continue; }
          if (sim.brk.state === 'half') sim.brk.probing = true;
        }
        (cfg.bulkhead ? sim.bq[bank] : sim.q).push(r);
      }
    }
    // expire queued > 2s
    const expire = (q) => { while (q.length && sim.t - q[0].t0 > 2000) { record(q[0], false, sim.t - q[0].t0); q.shift(); } };
    expire(sim.q); BANKS.forEach((b) => expire(sim.bq[b]));
    const qcap = (q) => { while (q.length > 300) { record(q[0], false, 0); q.shift(); } };
    qcap(sim.q); BANKS.forEach((b) => qcap(sim.bq[b]));
    // completions
    for (const w of sim.workers) if (!w.free && sim.t >= w.until) {
      const lat = sim.t - w.req.t0; record(w.req, w.ok, lat);
      if (w.req.bank === 'C' && cfg.breaker) brkResult(w.ok, sim.t - w.start);
      w.free = true; w.req = null;
    }
    // dispatch
    for (const w of sim.workers) if (w.free) {
      const q = cfg.bulkhead ? sim.bq[w.home] : sim.q; const r = q.shift(); if (!r) continue;
      const base = r.bank === 'C' ? cfg.latC : 100; let svc = base * (0.8 + Math.random() * 0.4), ok = !(r.bank === 'C' && Math.random() * 100 < cfg.failC);
      if (cfg.timeout && svc > 1000) { svc = 1000; ok = false; }
      w.free = false; w.req = r; w.start = sim.t; w.until = sim.t + Math.max(100, svc); w.ok = ok;
    }
  };
  root.innerHTML = `
    <div class="sim-ctl"><span class="grp"><b>Scenario</b><button class="btn sm" data-p="0">no protection</button><button class="btn sm" data-p="1">+ timeout</button><button class="btn sm" data-p="2">+ bulkhead</button><button class="btn sm" data-p="3">+ breaker</button><button class="btn sm" data-p="4">all three</button></span></div>
    <div class="sim-ctl">
      <span class="grp"><label class="rng"><span>load per bank <b id="o1">20</b>/s</span><input type="range" min="5" max="40" value="20" data-r="load"></label><label class="rng"><span>bank C latency <b id="o2">6.0</b>s</span><input type="range" min="1" max="20" value="60" data-r="latC"></label><label class="rng"><span>bank C error rate <b id="o3">0</b>%</span><input type="range" min="0" max="100" value="0" data-r="failC"></label><label class="rng"><span>worker pool <b id="o4">12</b></span><input type="range" min="3" max="30" value="12" data-r="pool"></label></span>
      <span class="grp"><label class="chk"><input type="checkbox" data-c="timeout"> 1s timeout</label><label class="chk"><input type="checkbox" data-c="bulkhead"> bulkhead (pool per bank)</label><label class="chk"><input type="checkbox" data-c="breaker"> circuit breaker on C</label></span>
      <span class="grp"><button class="btn sm primary" data-a="pause" id="opause">pause</button><button class="btn sm" data-a="speed" id="ospd">speed ×1</button><button class="btn sm ghost" data-a="reset">reset</button></span></div>
    <div class="ow" id="ow"></div><div class="ob" id="ob"></div><div class="sim-note" id="on"></div>`;
  const stats = (b) => { const w = sim.win[b].filter((x) => sim.t - x.t <= 5000); const ok = w.filter((x) => x.ok), tot = w.length; return { rate: tot ? ok.length / tot : 1, lat: ok.length ? ok.reduce((s, x) => s + x.lat, 0) / ok.length : 0, tps: ok.length / 5, tot }; };
  const draw = () => {
    for (const b of BANKS) sim.win[b] = sim.win[b].filter((x) => sim.t - x.t <= 5000);
    $('#ow', root).innerHTML = `<div class="wgrid">${sim.workers.map((w) => `<i class="wk ${w.free ? '' : 'busy'}" style="--wc:${w.free ? 'transparent' : BC[w.req.bank]}" title="${w.free ? 'idle' : 'busy: bank ' + w.req.bank}"></i>`).join('')}</div>
      <div class="wq">queued: ${cfg.bulkhead ? BANKS.map((b) => `<span style="color:${BC[b]}">${b}:${sim.bq[b].length}</span>`).join(' ') : `<span>${sim.q.length}</span> (shared FIFO)`}${cfg.breaker ? ` · breaker on C: <b class="${sim.brk.state === 'open' ? 'neg' : ''}">${sim.brk.state === 'half' ? 'half-open' : sim.brk.state}</b>` : ''}</div>`;
    const S = Object.fromEntries(BANKS.map((b) => [b, stats(b)]));
    $('#ob', root).innerHTML = BANKS.map((b) => `<div class="bcard ${S[b].rate < 0.8 ? 'bad' : ''}"><div class="bt" style="color:${BC[b]}">Bank ${b}${b === 'C' ? ' <small>(the problem bank)</small>' : ''}</div>
      <div class="bnum ${S[b].rate < 0.8 ? 'neg' : 'pos'}">${Math.round(S[b].rate * 100)}%</div><small>success (last 5s)</small>
      <div class="bsub">avg latency <b>${S[b].lat ? (S[b].lat / 1000).toFixed(2) + 's' : '–'}</b> · <b>${S[b].tps.toFixed(1)}</b> ok/s</div></div>`).join('');
    const hurt = S.A.rate < 0.8 || S.B.rate < 0.8;
    $('#on', root).innerHTML = hurt
      ? `<p class="warn">Healthy banks A and B are failing even though nothing is wrong with them. Bank C is hogging the shared workers, so their requests wait in the queue until they expire. This is head-of-line blocking, and it is how one slow dependency takes down everything.</p>`
      : (sim.t > 8000 && cfg.latC > 1500 ? `<p>A and B are healthy. Bank C is still slow, but the damage is contained.${cfg.breaker ? ' The breaker counts errors and calls slower than 2s as failures and then fails C instantly instead of spending workers on it.' : ''}</p>` : `<p>Press a scenario button and watch the worker pool (each square is a worker) and the three banks' success rates.</p>`);
  };
  const preset = (n) => {
    Object.assign(cfg, { load: 20, latC: 6000, failC: 0, pool: 12, timeout: n === 1 || n === 4, bulkhead: n === 2 || n === 4, breaker: n === 3 || n === 4 });
    sync(); reset(); cfg.running = true; $('#opause', root).textContent = 'pause';
  };
  const sync = () => {
    $('#o1', root).textContent = cfg.load; $('#o2', root).textContent = (cfg.latC / 1000).toFixed(1); $('#o3', root).textContent = cfg.failC; $('#o4', root).textContent = cfg.pool;
    $$('[data-r]', root).forEach((i) => { const m = { load: cfg.load, latC: cfg.latC / 100, failC: cfg.failC, pool: cfg.pool }[i.dataset.r]; i.value = m; });
    $$('[data-c]', root).forEach((i) => (i.checked = cfg[i.dataset.c]));
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p],[data-a]'); if (!b) return;
    if (b.dataset.p !== undefined) preset(+b.dataset.p);
    if (b.dataset.a === 'reset') reset();
    if (b.dataset.a === 'pause') { cfg.running = !cfg.running; b.textContent = cfg.running ? 'pause' : 'resume'; }
    if (b.dataset.a === 'speed') { cfg.speed = cfg.speed === 1 ? 3 : 1; b.textContent = 'speed ×' + cfg.speed; }
    draw();
  });
  root.addEventListener('input', (e) => {
    const r = e.target.dataset.r; if (!r) return; const v = +e.target.value;
    if (r === 'latC') cfg.latC = v * 100; else cfg[r] = v;
    if (r === 'pool') reset(); sync();
  });
  root.addEventListener('change', (e) => { const c = e.target.dataset.c; if (c) { cfg[c] = e.target.checked; if (c === 'bulkhead') reset(); } });
  reset(); preset(0);
  iv = setInterval(() => { if (cfg.running) { for (let i = 0; i < cfg.speed; i++) step(); draw(); } }, 100);
  return () => clearInterval(iv);
};
})();
