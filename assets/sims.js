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
   Bank outage: shared pool vs timeout / bulkhead / breaker.
   Calibrated to look like production: log-normal latencies, ~0.3% baseline errors, Poisson arrivals,
   a healthy baseline period, then a scripted incident on one bank. Bank names are fictional.
   ========================================================= */
SIMS.outage = (root) => {
  const BANKS = ['A', 'B', 'C'];
  const BANK = { A: { name: 'Fjord Bank', med: 180, sig: 0.45, color: '#39ff7a' }, B: { name: 'Nordlys Sparebank', med: 260, sig: 0.5, color: '#00e5ff' }, C: { name: 'Havn Bank', med: 340, sig: 0.5, color: '#ffb000' } };
  const cfg = { load: 30, latC: 9000, failC: 10, pool: 64, timeout: false, bulkhead: false, breaker: false, speed: 3, running: true, incidentAt: 20000 };
  const DEADLINE = 5000, BASE_ERR = 0.003, WIN = 10000, SLOW = 2000;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const lognorm = (med, sig) => Math.min(30000, med * Math.exp(sig * gauss()));
  const poisson = (lam) => { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; };
  const pct = (arr, p) => { if (!arr.length) return 0; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
  const fmtT = (ms) => 'T+' + String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  let sim, iv = null;
  const reset = () => {
    sim = { t: 0, q: [], bq: { A: [], B: [], C: [] }, win: { A: [], B: [], C: [] }, sec: { A: { ok: 0, bad: 0 }, B: { ok: 0, bad: 0 }, C: { ok: 0, bad: 0 } }, line: { A: [], B: [], C: [] }, lastSec: 0,
      brk: { state: 'closed', fails: 0, openedAt: 0, probing: false }, total: 0, failed: 0, incTotal: 0, incFailed: 0,
      workers: Array.from({ length: cfg.pool }, (_, i) => ({ free: true, until: 0, req: null, ok: true, home: BANKS[i % 3], start: 0 })) };
  };
  const record = (r, ok, lat) => {
    sim.win[r.bank].push({ t: sim.t, ok, lat }); sim.sec[r.bank][ok ? 'ok' : 'bad']++;
    sim.total++; if (!ok) sim.failed++;
    if (sim.t >= cfg.incidentAt) { sim.incTotal++; if (!ok) sim.incFailed++; }
  };
  const brkResult = (ok, dur) => {
    const b = sim.brk;
    if (ok && dur <= SLOW) { b.state = 'closed'; b.fails = 0; b.probing = false; return; }
    b.fails++; if (b.state === 'half' || b.fails >= 5) { b.state = 'open'; b.openedAt = sim.t; b.probing = false; }
  };
  const step = () => {
    const dt = 100; sim.t += dt;
    const arrivals = [];
    for (const bank of BANKS) { const n = poisson((cfg.load * dt) / 1000); for (let i = 0; i < n; i++) arrivals.push(bank); }
    for (let i = arrivals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arrivals[i], arrivals[j]] = [arrivals[j], arrivals[i]]; }
    for (const bank of arrivals) {
      const r = { bank, t0: sim.t - Math.random() * dt }; /* arrival time is spread inside the tick so latencies are not quantised */
      if (bank === 'C' && cfg.breaker) {
        if (sim.brk.state === 'open' && sim.t - sim.brk.openedAt >= 5000) sim.brk.state = 'half';
        if (sim.brk.state === 'open' || (sim.brk.state === 'half' && sim.brk.probing)) { record(r, false, 0); continue; }
        if (sim.brk.state === 'half') sim.brk.probing = true;
      }
      (cfg.bulkhead ? sim.bq[bank] : sim.q).push(r);
    }
    const expire = (q) => { while (q.length && sim.t - q[0].t0 > DEADLINE) { record(q[0], false, sim.t - q[0].t0); q.shift(); } };
    expire(sim.q); BANKS.forEach((b) => expire(sim.bq[b]));
    for (const w of sim.workers) if (!w.free && sim.t >= w.until) {
      record(w.req, w.ok, w.until - w.req.t0);
      if (w.req.bank === 'C' && cfg.breaker) brkResult(w.ok, w.until - w.start);
      w.free = true; w.req = null;
    }
    for (const w of sim.workers) if (w.free) {
      const q = cfg.bulkhead ? sim.bq[w.home] : sim.q; const r = q.shift(); if (!r) continue;
      const incident = r.bank === 'C' && sim.t >= cfg.incidentAt;
      let svc = incident ? lognorm(cfg.latC, 0.3) : lognorm(BANK[r.bank].med, BANK[r.bank].sig), ok = Math.random() >= BASE_ERR;
      if (!ok) svc = Math.min(svc, 120);
      else if (incident && Math.random() * 100 < cfg.failC) ok = false;
      if (cfg.timeout && svc > 2000) { svc = 2000; ok = false; }
      Object.assign(w, { free: false, req: r, start: sim.t, until: sim.t + Math.max(60, svc), ok });
    }
    while (sim.t - sim.lastSec >= 1000) {
      sim.lastSec += 1000;
      for (const b of BANKS) { const c = sim.sec[b], tot = c.ok + c.bad, prev = sim.line[b].length ? sim.line[b][sim.line[b].length - 1] : 1; sim.line[b].push(tot ? c.ok / tot : prev); sim.sec[b] = { ok: 0, bad: 0 }; if (sim.line[b].length > 120) sim.line[b].shift(); }
    }
    for (const b of BANKS) sim.win[b] = sim.win[b].filter((x) => sim.t - x.t <= WIN);
  };
  root.innerHTML = `
    <div class="sim-ctl"><span class="grp"><b>Scenario</b><button class="btn sm" data-p="0">no protection</button><button class="btn sm" data-p="1">+ timeout</button><button class="btn sm" data-p="2">+ bulkhead</button><button class="btn sm" data-p="3">+ breaker</button><button class="btn sm" data-p="4">all three</button></span></div>
    <div class="sim-ctl">
      <span class="grp"><label class="rng"><span>load per bank <b id="o1"></b> req/s</span><input type="range" min="10" max="60" data-r="load"></label><label class="rng"><span>incident: Havn Bank latency <b id="o2"></b> s</span><input type="range" min="1" max="30" data-r="latC"></label><label class="rng"><span>incident: error rate <b id="o3"></b>%</span><input type="range" min="0" max="100" data-r="failC"></label><label class="rng"><span>worker pool <b id="o4"></b></span><input type="range" min="16" max="128" data-r="pool"></label></span>
      <span class="grp"><label class="chk"><input type="checkbox" data-c="timeout"> 2s call timeout</label><label class="chk"><input type="checkbox" data-c="bulkhead"> bulkhead (pool per bank)</label><label class="chk"><input type="checkbox" data-c="breaker"> circuit breaker on Havn Bank</label></span>
      <span class="grp"><button class="btn sm primary" data-a="pause" id="opause">pause</button><button class="btn sm" data-a="speed" id="ospd"></button><button class="btn sm" data-a="now">trigger incident now</button><button class="btn sm ghost" data-a="reset">restart</button></span></div>
    <div class="ow" id="ow"></div><div class="ob" id="ob"></div>
    <div class="tlc"><div class="tlh"><b>Success rate per second, last 90s</b><span id="tll"></span></div><svg id="tls" viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label="Success rate timeline"></svg></div>
    <div class="sim-note" id="on"></div>`;
  const stat = (b) => {
    const w = sim.win[b], ok = w.filter((x) => x.ok), tot = w.length, lat = ok.map((x) => x.lat);
    return { rate: tot ? ok.length / tot : null, p50: pct(lat, 0.5), p95: pct(lat, 0.95), p99: pct(lat, 0.99), rps: ok.length / (WIN / 1000), inflight: sim.workers.filter((x) => !x.free && x.req.bank === b).length };
  };
  const draw = () => {
    const busy = sim.workers.filter((w) => !w.free).length, queued = cfg.bulkhead ? BANKS.reduce((n, b) => n + sim.bq[b].length, 0) : sim.q.length;
    const incident = sim.t >= cfg.incidentAt;
    $('#ow', root).innerHTML = `<div class="clk"><b>${fmtT(sim.t)}</b><span class="${incident ? 'neg' : 'pos'}">${incident ? `incident since ${fmtT(cfg.incidentAt)}: ${BANK.C.name} is degraded` : `all banks healthy, incident starts at ${fmtT(cfg.incidentAt)}`}</span></div>
      <div class="wgrid">${sim.workers.map((w) => `<i class="wk ${w.free ? '' : 'busy'}" style="--wc:${w.free ? 'transparent' : BANK[w.req.bank].color}" title="${w.free ? 'idle' : 'busy: ' + BANK[w.req.bank].name}"></i>`).join('')}</div>
      <div class="wq">workers busy <b>${busy}/${cfg.pool}</b> · queued <b class="${queued > 20 ? 'neg' : ''}">${queued}</b>${cfg.breaker ? ` · breaker on ${BANK.C.name}: <b class="${sim.brk.state === 'open' ? 'neg' : ''}">${sim.brk.state === 'half' ? 'half-open' : sim.brk.state}</b>` : ''}</div>`;
    const S = Object.fromEntries(BANKS.map((b) => [b, stat(b)]));
    $('#ob', root).innerHTML = BANKS.map((b) => { const x = S[b], low = x.rate !== null && x.rate < 0.97; return `<div class="bcard ${low ? 'bad' : ''}"><div class="bt" style="color:${BANK[b].color}">${BANK[b].name}</div>
      <div class="bnum ${x.rate === null ? '' : low ? 'neg' : 'pos'}">${x.rate === null ? '–' : (x.rate * 100).toFixed(1) + '%'}</div><small>success, last 10s</small>
      <div class="bsub">p50 <b>${Math.round(x.p50)}ms</b> · p95 <b>${Math.round(x.p95)}ms</b> · p99 <b>${Math.round(x.p99)}ms</b></div>
      <div class="bsub"><b>${x.rps.toFixed(1)}</b> ok/s · <b>${x.inflight}</b> in flight</div></div>`; }).join('');
    // timeline
    const nowSec = Math.floor(sim.t / 1000), startSec = Math.max(0, nowSec - 90), X = (sec) => ((sec - startSec) / 90) * 600, Y = (r) => 116 - r * 108;
    const lines = BANKS.map((b) => { const arr = sim.line[b], first = nowSec - arr.length; const pts = arr.map((r, k) => [X(first + k + 1), Y(r)]).filter(([x]) => x >= 0); return pts.length > 1 ? `<polyline fill="none" stroke="${BANK[b].color}" stroke-width="2" points="${pts.map((p) => p.join(',')).join(' ')}"/>` : ''; }).join('');
    const ix = X(cfg.incidentAt / 1000);
    $('#tls', root).innerHTML = `<line x1="0" x2="600" y1="${Y(1)}" y2="${Y(1)}" stroke="var(--line2)" stroke-dasharray="2 4"/><line x1="0" x2="600" y1="${Y(0.5)}" y2="${Y(0.5)}" stroke="var(--line)" stroke-dasharray="2 4"/>${ix >= 0 && ix <= 600 ? `<line x1="${ix}" x2="${ix}" y1="0" y2="120" stroke="var(--bad)" stroke-dasharray="4 3"/><text x="${ix + 4}" y="12" fill="var(--bad)" font-size="10" font-family="monospace">incident</text>` : ''}${lines}`;
    $('#tll', root).innerHTML = BANKS.map((b) => `<span style="color:${BANK[b].color}">■ ${BANK[b].name}</span>`).join(' ');
    // narrative
    const since = sim.incTotal ? (sim.incFailed / sim.incTotal) * 100 : 0, hurt = (S.A.rate !== null && S.A.rate < 0.97) || (S.B.rate !== null && S.B.rate < 0.97);
    let msg;
    if (!incident) msg = `<p>Baseline: ${(100 - (sim.total ? (sim.failed / sim.total) * 100 : 0)).toFixed(2)}% of requests succeed and p95 is a few hundred milliseconds. Watch what happens at ${fmtT(cfg.incidentAt)}.</p>`;
    else if (hurt) msg = `<p class="warn">Healthy banks are failing although nothing is wrong with them. ${BANK.C.name} is holding the shared workers, so requests for other banks wait in the queue until they hit the ${DEADLINE / 1000}s deadline. That is head-of-line blocking, and it is how one slow dependency takes down everything. Since the incident <b>${since.toFixed(1)}%</b> of all requests (${sim.incFailed.toLocaleString()} of ${sim.incTotal.toLocaleString()}) have failed.</p>`;
    else msg = `<p>The healthy banks are unaffected. ${BANK.C.name} is still degraded, but the damage is contained. Since the incident ${since.toFixed(1)}% of all requests have failed (${sim.incFailed.toLocaleString()} of ${sim.incTotal.toLocaleString()}), almost all of them for ${BANK.C.name} itself.${cfg.breaker ? ' The breaker treats errors and calls slower than 2s as failures, and then fails that bank instantly instead of spending workers on it.' : ''}</p>`;
    $('#on', root).innerHTML = msg;
  };
  const sync = () => {
    $('#o1', root).textContent = cfg.load; $('#o2', root).textContent = (cfg.latC / 1000).toFixed(0); $('#o3', root).textContent = cfg.failC; $('#o4', root).textContent = cfg.pool;
    $$('[data-r]', root).forEach((i) => { i.value = { load: cfg.load, latC: cfg.latC / 1000, failC: cfg.failC, pool: cfg.pool }[i.dataset.r]; });
    $$('[data-c]', root).forEach((i) => (i.checked = cfg[i.dataset.c]));
    $('#ospd', root).textContent = 'speed ×' + cfg.speed;
  };
  const preset = (n) => {
    Object.assign(cfg, { timeout: n === 1 || n === 4, bulkhead: n === 2 || n === 4, breaker: n === 3 || n === 4, incidentAt: 20000, running: true });
    $('#opause', root).textContent = 'pause'; sync(); reset(); draw();
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p],[data-a]'); if (!b) return;
    if (b.dataset.p !== undefined) preset(+b.dataset.p);
    const a = b.dataset.a;
    if (a === 'reset') { reset(); cfg.running = true; $('#opause', root).textContent = 'pause'; }
    if (a === 'pause') { cfg.running = !cfg.running; b.textContent = cfg.running ? 'pause' : 'resume'; }
    if (a === 'speed') { cfg.speed = cfg.speed === 1 ? 3 : cfg.speed === 3 ? 10 : 1; sync(); }
    if (a === 'now') cfg.incidentAt = sim.t;
    draw();
  });
  root.addEventListener('input', (e) => {
    const r = e.target.dataset.r; if (!r) return; const v = +e.target.value;
    if (r === 'latC') cfg.latC = v * 1000; else cfg[r] = v;
    if (r === 'pool') reset();
    sync();
  });
  root.addEventListener('change', (e) => { const c = e.target.dataset.c; if (c) { cfg[c] = e.target.checked; if (c === 'bulkhead') reset(); } });
  sync(); reset(); draw();
  iv = setInterval(() => { if (cfg.running) { for (let k = 0; k < cfg.speed; k++) step(); draw(); } }, 100);
  return () => clearInterval(iv);
};

/* =========================================================
   Transaction isolation: two concurrent transactions, Postgres semantics
   ========================================================= */
SIMS.isolation = (root) => {
  const LEVELS = { rc: 'Read committed (default)', rr: 'Repeatable read', ser: 'Serializable' };
  const SCEN = {
    lost: { name: 'Lost update: two withdrawals', setup: 'balance = 100. T1 withdraws 30, T2 withdraws 50. The correct final balance is 20.',
      approaches: { plain: 'read the balance, then write the computed value', forupd: 'SELECT … FOR UPDATE first', atomic: 'UPDATE … SET balance = balance - x' } },
    nonrep: { name: 'Non-repeatable read: a report reads twice', setup: 'balance = 100. T1 (a report) reads it twice. T2 withdraws 30 and commits in between.' },
    phantom: { name: 'Phantom: counting pending payments', setup: '3 payments are pending. T1 counts them twice. T2 inserts a new pending payment and commits in between.' },
    skew: { name: 'Write skew: two doctors on call', setup: 'Alice and Bob are on call. Rule: at least one must stay on call. Each tries to go off call.',
      approaches: { plain: 'count the on-call doctors, then update my own row', forupd: 'SELECT … FOR UPDATE on the on-call rows first' } },
  };
  const st = { scen: 'lost', level: 'rc', appr: 'plain', shown: 0 };
  const T = (who, text, note) => ({ who, text, note });
  function outcome() {
    const { scen, level, appr } = st, snap = level !== 'rc', RETRY = 'ERROR 40001: could not serialize access due to concurrent update';
    if (scen === 'lost') {
      if (appr === 'plain') return level === 'rc'
        ? { steps: [T(1, 'SELECT balance → 100'), T(2, 'SELECT balance → 100'), T(1, 'UPDATE balance = 70 · COMMIT'), T(2, 'UPDATE balance = 50 · COMMIT', 'overwrites T1: computed from a stale 100')], final: 'balance = 50', verdict: 'bad', why: 'Both read 100 before either wrote, so T1’s withdrawal vanished. 30 euros created from nothing. This is a lost update.' }
        : { steps: [T(1, 'SELECT balance → 100'), T(2, 'SELECT balance → 100'), T(1, 'UPDATE balance = 70 · COMMIT'), T(2, 'UPDATE balance = 50', RETRY), T(2, 'ROLLBACK, retry: SELECT → 70'), T(2, 'UPDATE balance = 20 · COMMIT')], final: 'balance = 20', verdict: 'retry', why: 'The database noticed T2’s snapshot was stale and refused the write. The result is correct only because the application retried the transaction.' };
      if (appr === 'forupd') return level === 'rc'
        ? { steps: [T(1, 'SELECT … FOR UPDATE → 100 (row locked)'), T(2, 'SELECT … FOR UPDATE', 'blocks, waiting for T1'), T(1, 'UPDATE balance = 70 · COMMIT'), T(2, 'unblocks, reads the new row → 70'), T(2, 'UPDATE balance = 20 · COMMIT')], final: 'balance = 20', verdict: 'ok', why: 'The lock serialises the two read-modify-write cycles, and Read committed re-reads the latest committed row after waiting.' }
        : { steps: [T(1, 'SELECT … FOR UPDATE → 100 (row locked)'), T(2, 'SELECT … FOR UPDATE', 'blocks, waiting for T1'), T(1, 'UPDATE balance = 70 · COMMIT'), T(2, 'unblocks', RETRY), T(2, 'ROLLBACK, retry: SELECT … FOR UPDATE → 70'), T(2, 'UPDATE balance = 20 · COMMIT')], final: 'balance = 20', verdict: 'retry', why: 'At snapshot levels the locked row has changed since T2’s snapshot, so T2 must restart. Correct, with a retry.' };
      return level === 'rc'
        ? { steps: [T(1, 'UPDATE balance = balance - 30 → 70 (row locked)'), T(2, 'UPDATE balance = balance - 50', 'blocks, waiting for T1'), T(1, 'COMMIT'), T(2, 'unblocks, re-evaluates on 70 → 20'), T(2, 'COMMIT')], final: 'balance = 20', verdict: 'ok', why: 'The best fix: no read in the application at all. The arithmetic happens inside the database against the latest committed value.' }
        : { steps: [T(1, 'UPDATE balance = balance - 30 → 70'), T(2, 'UPDATE balance = balance - 50', 'blocks, waiting for T1'), T(1, 'COMMIT'), T(2, 'unblocks', RETRY), T(2, 'ROLLBACK, retry: UPDATE balance = balance - 50 → 20 · COMMIT')], final: 'balance = 20', verdict: 'retry', why: 'Still correct, but snapshot levels turn the conflict into an error you must retry. At Read committed this needs no retry.' };
    }
    if (scen === 'nonrep') return level === 'rc'
      ? { steps: [T(1, 'SELECT balance → 100'), T(2, 'UPDATE balance = 70 · COMMIT'), T(1, 'SELECT balance → 70', 'a different answer in the same transaction')], final: 'report shows 100 then 70', verdict: 'bad', why: 'Each statement at Read committed sees the latest committed data, so a multi-statement report can be internally inconsistent.' }
      : { steps: [T(1, 'SELECT balance → 100'), T(2, 'UPDATE balance = 70 · COMMIT'), T(1, 'SELECT balance → 100', 'same snapshot as before')], final: 'report shows 100 and 100', verdict: 'ok', why: 'One snapshot for the whole transaction: the report is consistent. This is why long reports belong in Repeatable read.' };
    if (scen === 'phantom') return level === 'rc'
      ? { steps: [T(1, 'SELECT count(*) WHERE status = \'pending\' → 3'), T(2, 'INSERT pending payment · COMMIT'), T(1, 'SELECT count(*) … → 4', 'a new row appeared')], final: 'counts 3 then 4', verdict: 'bad', why: 'A phantom: the set of rows matching the predicate changed under T1.' }
      : { steps: [T(1, 'SELECT count(*) WHERE status = \'pending\' → 3'), T(2, 'INSERT pending payment · COMMIT'), T(1, 'SELECT count(*) … → 3', 'snapshot hides the new row')], final: 'counts 3 and 3', verdict: 'ok', why: 'Postgres’s Repeatable read is snapshot isolation, which also prevents phantoms. (The SQL standard allows them at this level; Postgres is stricter.)' };
    /* write skew */
    if (appr === 'plain') {
      if (level === 'ser') return { steps: [T(1, 'SELECT count(*) WHERE on_call → 2'), T(2, 'SELECT count(*) WHERE on_call → 2'), T(1, 'UPDATE alice SET on_call = false · COMMIT'), T(2, 'UPDATE bob SET on_call = false', 'ERROR 40001: could not serialize access due to read/write dependencies among transactions'), T(2, 'ROLLBACK, retry: count → 1, so refuse to go off call')], final: '1 doctor still on call', verdict: 'retry', why: 'Serializable detects that the two transactions each read what the other wrote, and aborts one. After the retry the rule holds.' };
      return { steps: [T(1, 'SELECT count(*) WHERE on_call → 2'), T(2, 'SELECT count(*) WHERE on_call → 2'), T(1, 'UPDATE alice SET on_call = false · COMMIT'), T(2, 'UPDATE bob SET on_call = false · COMMIT', 'different rows, so no conflict is detected')], final: '0 doctors on call', verdict: 'bad', why: 'Write skew: each transaction was valid on its own snapshot, but together they broke the rule. It survives ' + (level === 'rr' ? 'Repeatable read' : 'Read committed') + '. Only Serializable, row locks or a constraint prevent it.' };
    }
    return level === 'rc'
      ? { steps: [T(1, 'SELECT … WHERE on_call FOR UPDATE → alice, bob (rows locked)'), T(2, 'SELECT … WHERE on_call FOR UPDATE', 'blocks, waiting for T1'), T(1, 'UPDATE alice SET on_call = false · COMMIT'), T(2, 'unblocks, re-reads → only bob on call'), T(2, 'refuses to go off call · ROLLBACK')], final: '1 doctor still on call', verdict: 'ok', why: 'Locking the rows that the decision depends on serialises the two transactions, and Read committed re-reads the committed state after waiting.' }
      : { steps: [T(1, 'SELECT … FOR UPDATE → alice, bob (rows locked)'), T(2, 'SELECT … FOR UPDATE', 'blocks, waiting for T1'), T(1, 'UPDATE alice SET on_call = false · COMMIT'), T(2, 'unblocks', RETRY), T(2, 'ROLLBACK, retry: sees only bob → refuse')], final: '1 doctor still on call', verdict: 'retry', why: 'Correct, with a retry: the rows T2 locked changed after its snapshot was taken.' };
  }
  const apprs = () => SCEN[st.scen].approaches;
  root.innerHTML = `
    <div class="sim-ctl"><span class="grp"><b>Scenario</b><select id="isc">${Object.entries(SCEN).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></span>
      <span class="grp"><b>Isolation</b><select id="ilv">${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></span>
      <span class="grp" id="iap"></span></div>
    <p class="sim-note" id="iset"></p>
    <div class="tx2" id="itl"></div>
    <div class="sim-ctl"><span class="grp"><button class="btn sm primary" data-a="step">Next step</button><button class="btn sm" data-a="all">Play all</button><button class="btn sm ghost" data-a="reset">Reset</button></span></div>
    <div id="ires"></div>`;
  const draw = () => {
    const o = outcome(), sc = SCEN[st.scen];
    $('#iset', root).textContent = sc.setup;
    $('#iap', root).innerHTML = sc.approaches ? `<b>Approach</b><select id="iaps">${Object.entries(sc.approaches).map(([k, v]) => `<option value="${k}" ${k === st.appr ? 'selected' : ''}>${v}</option>`).join('')}</select>` : '';
    const sel = $('#iaps', root); if (sel) sel.onchange = () => { st.appr = sel.value; st.shown = 0; draw(); };
    $('#itl', root).innerHTML = `<div class="tlh2"><span>T1</span><span>T2</span></div>${o.steps.slice(0, st.shown).map((s, i) => `<div class="trow ${s.who === 1 ? 'l' : 'r'}"><span class="n">${i + 1}</span><div class="cell ${s.note && /ERROR/.test(s.note) ? 'err' : ''}"><code>${esc(s.text)}</code>${s.note ? `<small>${esc(s.note)}</small>` : ''}</div></div>`).join('') || '<p class="muted">Press “Next step” to run the timeline.</p>'}`;
    $('#ires', root).innerHTML = st.shown >= o.steps.length ? `<div class="iverdict ${o.verdict}"><b>${o.verdict === 'ok' ? 'Correct' : o.verdict === 'retry' ? 'Correct, after a retry' : 'ANOMALY'}: ${esc(o.final)}</b><p>${esc(o.why)}</p></div>` : '';
  };
  root.addEventListener('change', (e) => {
    if (e.target.id === 'isc') { st.scen = e.target.value; st.appr = 'plain'; st.shown = 0; draw(); }
    if (e.target.id === 'ilv') { st.level = e.target.value; st.shown = 0; draw(); }
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return; const n = outcome().steps.length;
    if (b.dataset.a === 'step') st.shown = Math.min(n, st.shown + 1);
    if (b.dataset.a === 'all') st.shown = n;
    if (b.dataset.a === 'reset') st.shown = 0;
    draw();
  });
  draw();
  return () => {};
};

/* =========================================================
   Many viewers, one upstream: caching strategies
   ========================================================= */
SIMS.edgecache = (root) => {
  const cfg = { viewers: 150, interval: 5, ttl: 4, upMs: 400, strat: 'ttl' };
  const STRATS = { none: 'no cache', ttl: 'TTL cache', sf: 'TTL + single-flight', swr: 'stale-while-revalidate + single-flight' };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pct = (arr, p) => { if (!arr.length) return 0; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
  function simulate() {
    const T = 60000, rand = rng(7), reqs = [];
    for (let v = 0; v < cfg.viewers; v++) { let t = rand() * cfg.interval * 1000; while (t < T) { reqs.push(t); t += cfg.interval * 1000 + (rand() - 0.5) * 400; } }
    reqs.sort((x, y) => x - y);
    const calls = new Array(60).fill(0), lat = [], age = [];
    let entryAt = null, inflightEnd = -1; const pend = [], ttl = cfg.ttl * 1000, up = cfg.upMs;
    const callAt = (t) => { calls[Math.min(59, Math.floor(t / 1000))]++; pend.push(t + up); };
    for (const t of reqs) {
      while (pend.length && pend[0] <= t) entryAt = pend.shift();
      const fresh = entryAt !== null && t < entryAt + ttl;
      if (cfg.strat === 'none') { callAt(t); lat.push(up); age.push(0); continue; }
      if (fresh) { lat.push(5); age.push(t - entryAt); continue; }
      if (cfg.strat === 'ttl') { callAt(t); lat.push(up); age.push(0); continue; }
      const stale = cfg.strat === 'swr' && entryAt !== null && t < entryAt + ttl * 4;
      if (inflightEnd > t) { if (stale) { lat.push(5); age.push(t - entryAt); } else { lat.push(inflightEnd - t); age.push(0); } continue; }
      callAt(t); inflightEnd = t + up;
      if (stale) { lat.push(5); age.push(t - entryAt); } else { lat.push(up); age.push(0); }
    }
    return { calls, total: calls.reduce((a, b) => a + b, 0), peak: Math.max(...calls), p95: pct(lat, 0.95), age95: pct(age, 0.95), n: reqs.length };
  }
  root.innerHTML = `
    <div class="sim-ctl"><span class="grp"><b>Strategy</b>${Object.entries(STRATS).map(([k, v]) => `<button class="btn sm" data-s="${k}">${v}</button>`).join('')}</span></div>
    <div class="sim-ctl"><span class="grp"><label class="rng"><span>viewers <b id="e1"></b></span><input type="range" min="10" max="500" step="10" data-r="viewers"></label><label class="rng"><span>each polls every <b id="e2"></b> s</span><input type="range" min="2" max="15" data-r="interval"></label><label class="rng"><span>cache TTL <b id="e3"></b> s</span><input type="range" min="1" max="30" data-r="ttl"></label><label class="rng"><span>upstream latency <b id="e4"></b> ms</span><input type="range" min="100" max="2500" step="100" data-r="upMs"></label></span></div>
    <div class="ecs" id="ecs"></div><div class="echart"><svg id="ecg" viewBox="0 0 600 130" preserveAspectRatio="none" role="img" aria-label="Upstream calls per second"></svg><div class="eax"><span>0 s</span><span>upstream calls per second, one simulated minute</span><span>60 s</span></div></div>
    <div class="sim-note" id="ecn"></div>`;
  const draw = () => {
    const r = simulate(), rate = (r.n / 60).toFixed(0);
    $$('[data-s]', root).forEach((b) => b.classList.toggle('primary', b.dataset.s === cfg.strat));
    $('#e1', root).textContent = cfg.viewers; $('#e2', root).textContent = cfg.interval; $('#e3', root).textContent = cfg.ttl; $('#e4', root).textContent = cfg.upMs;
    $$('[data-r]', root).forEach((i) => (i.value = cfg[i.dataset.r]));
    const max = Math.max(1, r.peak);
    $('#ecg', root).innerHTML = r.calls.map((c, i) => `<rect x="${i * 10 + 1}" width="8" y="${128 - (c / max) * 120}" height="${(c / max) * 120}" fill="${c === r.peak && c > 3 ? 'var(--bad)' : 'var(--accent)'}"/>`).join('') + `<text x="4" y="12" fill="var(--muted)" font-size="10" font-family="monospace">peak ${r.peak}/s</text>`;
    $('#ecs', root).innerHTML = `<div><b>${rate}</b><span>requests/s from viewers</span></div><div class="${r.total > 600 ? 'neg' : ''}"><b>${r.total.toLocaleString()}</b><span>upstream calls in 60 s</span></div><div class="${r.peak > 20 ? 'neg' : ''}"><b>${r.peak}/s</b><span>peak upstream rate</span></div><div class="${r.p95 > 300 ? 'neg' : ''}"><b>${Math.round(r.p95)} ms</b><span>p95 viewer latency</span></div><div><b>${(r.age95 / 1000).toFixed(1)} s</b><span>p95 data age</span></div>`;
    $('#ecn', root).innerHTML = {
      none: '<p class="warn">Every poll hits the upstream. The call count scales with viewers, which is exactly how you exhaust an API quota or get blocked.</p>',
      ttl: '<p>Most requests are cache hits, but look at the spikes: when the entry expires, every viewer arriving while the refresh is still in flight misses too, and each one calls the upstream (a cache stampede). The slower the upstream, the bigger the spike.</p>',
      sf: '<p>One upstream call per refresh, whatever the number of viewers. The unlucky viewers who arrive during the refresh wait for it, so p95 latency is the upstream latency.</p>',
      swr: '<p>After the first fill nobody waits: expired entries are served instantly while one refresh runs in the background. The cost is data that is a little older (shown as p95 data age). This is Cache-Control: max-age plus stale-while-revalidate.</p>',
    }[cfg.strat];
  };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) { cfg.strat = b.dataset.s; draw(); } });
  root.addEventListener('input', (e) => { const k = e.target.dataset.r; if (k) { cfg[k] = +e.target.value; draw(); } });
  draw();
  return () => {};
};
})();
