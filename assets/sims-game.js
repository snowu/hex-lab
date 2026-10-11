/* Interactive simulations for the game dev section. Each registers window.SIMS.<id> = (root) => dispose(), like assets/sims.js. */
(() => {
'use strict';
const SIMS = (window.SIMS = window.SIMS || {});
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const G = { ink: '#e6dcf7', dim: '#6f6094', acc: '#b98cff', amb: '#ffb000', cy: '#00e5ff', pink: '#ff6ac1', bg: '#07040d' };
const rangeHtml = (id, label, min, max, val, step = 1) => `<label class="rng"><span>${label} <b id="${id}v">${val}</b></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
const ptr = (cv, e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * cv.width, y: ((e.clientY - r.top) / r.height) * cv.height }; };

/* =========================================================
   Fixed vs variable timestep: same jump, different frame rates
   ========================================================= */
const GRAV = 1500, JV = 600, FIXED = 1 / 60;
function jump(fps, fixed) {
  const dt = 1 / fps; let y = 0, v = JV, acc = 0, t = 0, apex = 0; const pts = [[0, 0]];
  for (let n = 0; n < 5000 && !(t > 0 && y < 0); n++) {
    if (fixed) { acc += dt; while (acc >= FIXED) { y += v * FIXED; v -= GRAV * FIXED; acc -= FIXED; } } else { y += v * dt; v -= GRAV * dt; }
    t += dt; apex = Math.max(apex, y); pts.push([t, y]);
  }
  return { apex, pts, t };
}
SIMS.gdloop = (root) => {
  let fps = 30;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('fps', 'frame rate', 10, 144, fps)}</span><span class="grp"><span id="leg"></span></span></div>
    <canvas class="gsim" width="640" height="260"></canvas><div class="sim-note" id="tab"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  function draw() {
    const ref = jump(2000, false), a = jump(fps, false), b = jump(fps, true);
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 260);
    const sx = 600 / 1.4, sy = 210 / (ref.apex * 1.15);
    const line = (r, col) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); r.pts.forEach(([t, y], i) => { const X = 20 + t * sx, Y = 240 - Math.max(0, y) * sy; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); g.fillStyle = col; r.pts.forEach(([t, y]) => g.fillRect(18 + t * sx, 238 - Math.max(0, y) * sy, 4, 4)); };
    g.strokeStyle = G.dim; g.beginPath(); g.moveTo(20, 240); g.lineTo(620, 240); g.stroke();
    g.setLineDash([5, 5]); line(ref, G.dim); g.setLineDash([]); line(a, G.amb); line(b, G.acc);
    $('#fpsv', root).textContent = fps;
    $('#leg', root).innerHTML = `<span style="color:${G.amb}">■ variable dt</span> &nbsp; <span style="color:${G.acc}">■ fixed 60 Hz</span> &nbsp; <span style="color:${G.dim}">■ ideal</span>`;
    const pct = (x) => ((x / ref.apex - 1) * 100).toFixed(1) + '%';
    $('#tab', root).innerHTML = `<p>Jump apex at <b>${fps} fps</b>: variable dt <b>${a.apex.toFixed(1)} px</b> (${pct(a.apex)} vs ideal), fixed step <b>${b.apex.toFixed(1)} px</b> (${pct(b.apex)}). Same code, same input. Only the frame rate changed. Dots are frames.</p>`;
  }
  root.addEventListener('input', (e) => { if (e.target.id === 'fps') { fps = +e.target.value; draw(); } });
  draw(); return () => {};
};

/* =========================================================
   Tunneling: discrete vs swept collision
   ========================================================= */
SIMS.gdcollide = (root) => {
  let speed = 1800, swept = false;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('spd', 'bullet speed px/s', 300, 6000, speed, 100)}</span><span class="grp"><label class="chk"><input type="checkbox" id="sw"> swept test</label></span></div>
    <canvas class="gsim" width="640" height="150"></canvas><div class="sim-note" id="out"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  const WALL = { x: 470, w: 8 }, B = 8, DT = 1 / 60;
  function draw() {
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 150);
    g.fillStyle = G.pink; g.fillRect(WALL.x, 20, WALL.w, 110);
    let x = 20, hit = false, frames = 0; const seen = [];
    while (x < 640 && !hit && frames < 400) {
      const nx = x + speed * DT; frames++;
      if (swept) { if (x + B <= WALL.x && nx + B >= WALL.x) { x = WALL.x - B; hit = true; } else x = nx; }
      else { x = nx; if (x + B > WALL.x && x < WALL.x + WALL.w) hit = true; }
      seen.push(x);
    }
    seen.forEach((px, i) => { g.globalAlpha = 0.25 + 0.75 * (i / seen.length); g.fillStyle = hit && i === seen.length - 1 ? G.acc : G.amb; g.fillRect(px, 70, B, B); });
    g.globalAlpha = 1;
    $('#spdv', root).textContent = speed;
    $('#out', root).innerHTML = hit ? `<p><b style="color:${G.acc}">Hit.</b> The bullet is ${B}px wide, the wall ${WALL.w}px, and it moves ${(speed * DT).toFixed(0)} px per frame.</p>` : `<p><b style="color:${G.pink}">Tunneled through.</b> It moves ${(speed * DT).toFixed(0)} px per frame, more than the wall and bullet together (${WALL.w + B}px), so no frame ever sees them overlap.</p>`;
  }
  root.addEventListener('input', (e) => { if (e.target.id === 'spd') { speed = +e.target.value; draw(); } });
  root.addEventListener('change', (e) => { if (e.target.id === 'sw') { swept = e.target.checked; draw(); } });
  draw(); return () => {};
};

/* =========================================================
   Easing curves and frame-rate independent smoothing
   ========================================================= */
const EASE = {
  linear: (t) => t, 'ease-in quad': (t) => t * t, 'ease-out cubic': (t) => 1 - (1 - t) ** 3, 'ease-in-out sine': (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  smoothstep: (t) => t * t * (3 - 2 * t), 'ease-out back': (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2, 'ease-out bounce': (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
};
SIMS.gdease = (root) => {
  let name = 'ease-out cubic', raf = 0, t0 = performance.now();
  root.innerHTML = `<div class="sim-ctl"><span class="grp"><b>Curve</b><select id="cv">${Object.keys(EASE).map((k) => `<option ${k === name ? 'selected' : ''}>${k}</option>`).join('')}</select></span></div>
    <canvas class="gsim" width="640" height="220"></canvas>
    <div class="sim-note" id="sm"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  /* smoothing table: frames to reach 90% of the target when you do pos += (target-pos) * 0.1 each frame vs the exp form */
  const frames = (fps, mode) => { let p = 0, n = 0; const dt = 1 / fps; while (p < 0.9 && n < 5000) { p += (1 - p) * (mode === 'naive' ? 0.1 : 1 - Math.exp(-6 * dt)); n++; } return n; };
  $('#sm', root).innerHTML = `<table><tr><th>frame rate</th><th>naive <code>lerp(p, t, 0.1)</code></th><th>damped <code>1 - exp(-k·dt)</code></th></tr>${[30, 60, 144].map((f) => `<tr><td>${f} fps</td><td>${(frames(f, 'naive') / f).toFixed(2)} s</td><td>${(frames(f, 'exp') / f).toFixed(2)} s</td></tr>`).join('')}</table><p>Time to cover 90% of the distance. The naive version is tied to the frame rate, the exponential one is not.</p>`;
  function frame(now) {
    const f = EASE[name], T = ((now - t0) / 1000) % 2.2, u = clamp(T / 1.6, 0, 1);
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 220);
    g.strokeStyle = G.dim; g.strokeRect(20.5, 20.5, 180, 150);
    g.strokeStyle = G.acc; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 60; i++) { const x = 20 + (i / 60) * 180, y = 170 - clamp(f(i / 60), -0.3, 1.4) * 150; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = G.amb; g.fillRect(16 + u * 180, 166 - clamp(f(u), -0.3, 1.4) * 150, 8, 8);
    g.strokeStyle = G.dim; g.lineWidth = 1; g.strokeRect(240.5, 90.5, 360, 40);
    g.fillStyle = G.cy; g.fillRect(244 + f(u) * 330, 98, 24, 24);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  root.addEventListener('change', (e) => { if (e.target.id === 'cv') name = e.target.value; });
  return () => cancelAnimationFrame(raf);
};

/* =========================================================
   Juice: the same click with and without feedback
   ========================================================= */
SIMS.gdjuice = (root) => {
  const opt = { shake: false, hitstop: false, parts: false, squash: false, flash: false, sound: false };
  root.innerHTML = `<div class="sim-ctl"><span class="grp"><b>Feedback</b>${Object.keys(opt).map((k) => `<label class="chk"><input type="checkbox" data-o="${k}"> ${k}</label>`).join('')}</span><span class="grp"><button class="btn sm ghost" id="all">all on</button><button class="btn sm ghost" id="none">all off</button></span></div>
    <canvas class="gsim touch" width="640" height="260"></canvas><div class="sim-note"><p>Click or tap the block. Its hit does exactly the same thing every time (the counter goes up by one). Everything you turn on is only feedback.</p></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  let hits = 0, shake = 0, freeze = 0, sq = 0, flash = 0, parts = [], last = performance.now(), raf = 0, ac = null;
  const blip = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), v = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(520 + Math.random() * 120, ac.currentTime); o.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.09); v.gain.setValueAtTime(0.05, ac.currentTime); v.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1); o.connect(v); v.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.1); } catch { /* no audio */ } };
  cv.addEventListener('pointerdown', (e) => {
    const p = ptr(cv, e); if (Math.hypot(p.x - 320, p.y - 130) > 70) return; hits++;
    if (opt.shake) shake = 10; if (opt.hitstop) freeze = 0.07; if (opt.squash) sq = 1; if (opt.flash) flash = 1; if (opt.sound) blip();
    if (opt.parts) for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, s = 80 + Math.random() * 220; parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.5 + Math.random() * 0.3, c: [G.acc, G.amb, G.cy][i % 3] }); }
  });
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const run = freeze <= 0; freeze -= dt;
    if (run) { shake = Math.max(0, shake - dt * 40); sq = Math.max(0, sq - dt * 5); flash = Math.max(0, flash - dt * 6); parts.forEach((p) => { p.life -= dt; p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); parts = parts.filter((p) => p.life > 0); }
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 260);
    g.save(); if (shake) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    const w = 110 * (1 + 0.35 * sq), h = 110 * (1 - 0.3 * sq);
    g.fillStyle = flash > 0 ? '#ffffff' : G.acc; g.fillRect(320 - w / 2, 185 - h, w, h);
    parts.forEach((p) => { g.fillStyle = p.c; g.fillRect(p.x, p.y, 5, 5); });
    g.restore(); g.fillStyle = G.ink; g.font = '14px JetBrains Mono, monospace'; g.fillText('hits: ' + hits, 14, 24);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  root.addEventListener('change', (e) => { const k = e.target.dataset.o; if (k) opt[k] = e.target.checked; });
  const setAll = (v) => { $$('[data-o]', root).forEach((c) => { c.checked = v; opt[c.dataset.o] = v; }); };
  $('#all', root).onclick = () => setAll(true); $('#none', root).onclick = () => setAll(false);
  return () => cancelAnimationFrame(raf);
};

/* =========================================================
   Cellular automata caves
   ========================================================= */
SIMS.gdcave = (root) => {
  const W = 64, H = 40; let fill = 45, seed = 7, grid = [];
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('fill', 'initial wall %', 30, 60, fill)}</span><span class="grp"><button class="btn sm primary" id="step">smooth 1 step</button><button class="btn sm" id="new">new seed</button><button class="btn sm" id="keep">keep largest cave</button><button class="btn sm ghost" id="reset">reset noise</button></span></div>
    <canvas class="gsim px" width="${W}" height="${H}" style="width:100%"></canvas><div class="sim-note" id="stat"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d'); let steps = 0;
  const reset = () => { const r = rng32(seed); grid = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 1 : r() * 100 < fill ? 1 : 0))); steps = 0; };
  const nb = (x, y) => { let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) { const a = x + i, b = y + j; n += a < 0 || b < 0 || a >= W || b >= H ? 1 : grid[b][a]; } return n; };
  const regions = () => { const seen = Array.from({ length: H }, () => Array(W).fill(0)), out = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!grid[y][x] && !seen[y][x]) { const cells = [], q = [[x, y]]; seen[y][x] = 1; while (q.length) { const [a, b] = q.pop(); cells.push([a, b]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([i, j]) => { const c = a + i, d = b + j; if (c >= 0 && d >= 0 && c < W && d < H && !grid[d][c] && !seen[d][c]) { seen[d][c] = 1; q.push([c, d]); } }); } out.push(cells); } return out.sort((p, q) => q.length - p.length); };
  function draw() {
    const rs = regions(), big = new Set(rs[0] ? rs[0].map(([x, y]) => y * W + x) : []);
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, wall = grid[y][x], main = big.has(y * W + x); const c = wall ? [28, 18, 48] : main ? [185, 140, 255] : [255, 176, 0]; img.data.set([...c, 255], i); }
    g.putImageData(img, 0, 0);
    const open = grid.flat().filter((v) => !v).length;
    $('#fillv', root).textContent = fill;
    $('#stat', root).innerHTML = `<p>After <b>${steps}</b> smoothing step${steps === 1 ? '' : 's'}: <b>${rs.length}</b> separate cave${rs.length === 1 ? '' : 's'}, <b>${Math.round((open / (W * H)) * 100)}%</b> open. Violet is the largest cave, amber is disconnected pockets a player could never reach. Rule: a cell becomes wall if 5 or more of its 8 neighbours are walls.</p>`;
  }
  reset(); draw();
  root.addEventListener('input', (e) => { if (e.target.id === 'fill') { fill = +e.target.value; reset(); draw(); } });
  $('#step', root).onclick = () => { const nx = grid.map((row, y) => row.map((_, x) => (x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 1 : nb(x, y) >= 5 ? 1 : 0))); grid = nx; steps++; draw(); };
  $('#new', root).onclick = () => { seed = (seed * 7919 + 13) % 100000; reset(); draw(); };
  $('#reset', root).onclick = () => { reset(); draw(); };
  $('#keep', root).onclick = () => { const rs = regions(); rs.slice(1).forEach((c) => c.forEach(([x, y]) => { grid[y][x] = 1; })); draw(); };
  return () => {};
};

/* =========================================================
   Pixel editor
   ========================================================= */
const PAL16 = ['#00000000', '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86'];
const HEART = ['0000000000000000', '0000000000000000', '0001111001111000', '0013333113333100', '0133333333333310', '0133353333333310', '0133533333333310', '0133333333333310', '0013333333333100', '0001333333331000', '0000133333310000', '0000013333100000', '0000001331000000', '0000000110000000', '0000000000000000', '0000000000000000'];
SIMS.pxedit = (root) => {
  const KEY = 'sil:pxart'; let N = 16, tool = 'pen', col = 3, mirror = false, down = false, lastP = null, hist = [];
  let px = HEART.map((r) => [...r].map((c) => parseInt(c, 16)));
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.n && s.px) { N = s.n; px = s.px; } } catch { /* fresh */ }
  const SZ = 512;
  root.innerHTML = `<div class="sim-ctl"><span class="grp"><b>Tool</b>${[['pen', 'pencil'], ['erase', 'eraser'], ['fill', 'fill'], ['pick', 'pick']].map(([k, n]) => `<button class="btn sm" data-t="${k}">${n}</button>`).join('')}<label class="chk"><input type="checkbox" id="mir"> mirror</label></span>
    <span class="grp"><b>Canvas</b>${[8, 16, 32].map((n) => `<button class="btn sm" data-n="${n}">${n}</button>`).join('')}<button class="btn sm ghost" id="undo">undo</button><button class="btn sm ghost" id="clr">clear</button><button class="btn sm primary" id="png">save PNG</button></span></div>
    <div class="gwrap"><canvas class="gsim px touch" id="ed" width="${SZ}" height="${SZ}" style="width:min(100%,${SZ}px);cursor:crosshair"></canvas>
    <div class="gside"><div class="swatches" id="sw"></div><p>Real size:<br><canvas class="gsim px" id="pv" style="width:auto"></canvas> <canvas class="gsim px" id="pv2" style="width:auto"></canvas></p><p id="msg">Draw with pencil. Your art is saved in this browser.</p></div></div>`;
  const ed = $('#ed', root), g = ed.getContext('2d'), pv = $('#pv', root), pv2 = $('#pv2', root);
  const hex = (i) => PAL16[i];
  $('#sw', root).innerHTML = PAL16.map((c, i) => `<button type="button" data-c="${i}" aria-label="colour ${i}" style="background:${i ? c : 'repeating-conic-gradient(#888 0 25%,#ccc 0 50%) 0 0/10px 10px'}"></button>`).join('');
  function render() {
    const cell = SZ / N; g.clearRect(0, 0, SZ, SZ);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = (x + y) % 2 ? '#1d1630' : '#150f26'; g.fillRect(x * cell, y * cell, cell, cell); if (px[y][x]) { g.fillStyle = hex(px[y][x]); g.fillRect(x * cell, y * cell, cell, cell); } }
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; for (let i = 1; i < N; i++) { g.beginPath(); g.moveTo(i * cell + .5, 0); g.lineTo(i * cell + .5, SZ); g.moveTo(0, i * cell + .5); g.lineTo(SZ, i * cell + .5); g.stroke(); }
    for (const c of [pv, pv2]) { c.width = N; c.height = N; const k = c.getContext('2d'); k.clearRect(0, 0, N, N); px.forEach((r, y) => r.forEach((v, x) => { if (v) { k.fillStyle = hex(v); k.fillRect(x, y, 1, 1); } })); }
    pv.style.width = N + 'px'; pv.style.height = N + 'px'; pv2.style.width = N * 3 + 'px'; pv2.style.height = N * 3 + 'px';
    $$('[data-t]', root).forEach((b) => b.classList.toggle('primary', b.dataset.t === tool)); $$('[data-n]', root).forEach((b) => b.classList.toggle('primary', +b.dataset.n === N));
    $$('#sw button', root).forEach((b) => b.classList.toggle('on', +b.dataset.c === col));
    try { localStorage.setItem(KEY, JSON.stringify({ n: N, px })); } catch { /* ignore */ }
  }
  const snap = () => { hist.push(JSON.stringify(px)); if (hist.length > 60) hist.shift(); };
  const put = (x, y, v) => { if (x < 0 || y < 0 || x >= N || y >= N) return; px[y][x] = v; if (mirror) px[y][N - 1 - x] = v; };
  const line = (a, b, v) => { let x0 = a.x, y0 = a.y; const dx = Math.abs(b.x - x0), dy = -Math.abs(b.y - y0), sx = x0 < b.x ? 1 : -1, sy = y0 < b.y ? 1 : -1; let err = dx + dy; for (;;) { put(x0, y0, v); if (x0 === b.x && y0 === b.y) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } };
  const fill = (x, y, v) => { const t = px[y][x]; if (t === v) return; const q = [[x, y]]; while (q.length) { const [a, b] = q.pop(); if (a < 0 || b < 0 || a >= N || b >= N || px[b][a] !== t) continue; put(a, b, v); q.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); } };
  const cellAt = (e) => { const p = ptr(ed, e); return { x: clamp(Math.floor(p.x / (SZ / N)), 0, N - 1), y: clamp(Math.floor(p.y / (SZ / N)), 0, N - 1) }; };
  ed.addEventListener('pointerdown', (e) => {
    e.preventDefault(); ed.setPointerCapture(e.pointerId); const c = cellAt(e);
    if (tool === 'pick') { col = px[c.y][c.x]; tool = 'pen'; return render(); }
    snap(); down = true; lastP = c;
    if (tool === 'fill') { fill(c.x, c.y, col); down = false; } else line(c, c, tool === 'erase' ? 0 : col);
    render();
  });
  ed.addEventListener('pointermove', (e) => { if (!down) return; const c = cellAt(e); line(lastP, c, tool === 'erase' ? 0 : col); lastP = c; render(); });
  const up = () => { down = false; }; ed.addEventListener('pointerup', up); ed.addEventListener('pointercancel', up);
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]'); if (t) { tool = t.dataset.t; render(); }
    const c = e.target.closest('[data-c]'); if (c) { col = +c.dataset.c; if (tool === 'pick') tool = 'pen'; render(); }
    const n = e.target.closest('[data-n]'); if (n) { const M = +n.dataset.n; if (M !== N) { snap(); const old = px; px = Array.from({ length: M }, (_, y) => Array.from({ length: M }, (_, x) => (old[y] && old[y][x]) || 0)); N = M; render(); } }
  });
  $('#mir', root).onchange = (e) => { mirror = e.target.checked; };
  $('#undo', root).onclick = () => { const s = hist.pop(); if (s) { px = JSON.parse(s); N = px.length; render(); } };
  $('#clr', root).onclick = () => { snap(); px = Array.from({ length: N }, () => Array(N).fill(0)); render(); };
  $('#png', root).onclick = () => { const o = document.createElement('canvas'); o.width = o.height = N * 16; const k = o.getContext('2d'); k.imageSmoothingEnabled = false; k.drawImage(pv, 0, 0, N * 16, N * 16); o.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `sprite-${N}x${N}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); $('#msg', root).textContent = `Saved ${N}x${N} sprite, upscaled 16x with no smoothing.`; }); };
  render(); return () => {};
};

/* =========================================================
   Colour ramps and hue shifting
   ========================================================= */
const hsl2hex = (h, s, l) => { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
SIMS.pxramp = (root) => {
  let hue = 140, sat = 55, n = 5, shift = 25, lo = 18, hi = 85;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('hue', 'base hue', 0, 359, hue)}${rangeHtml('sat', 'saturation', 10, 100, sat)}</span><span class="grp">${rangeHtml('n', 'steps', 3, 8, n)}${rangeHtml('shift', 'hue shift °', 0, 60, shift)}</span></div>
    <div class="gwrap"><canvas class="gsim px" id="a" width="32" height="32" style="width:min(46%,256px)"></canvas><canvas class="gsim px" id="b" width="32" height="32" style="width:min(46%,256px)"></canvas></div>
    <div id="rows"></div><div class="sim-note" id="hint"></div>`;
  /* Hue shifting: highlights drift toward warm yellow (60 degrees), shadows toward cool blue (240), by the shortest way round the colour wheel. */
  const toward = (h, target, amt) => { const d = ((target - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), amt); };
  const ramp = (sh) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1), l = lo + (hi - lo) * t, k = Math.abs(t - 0.5) * 2, h = t >= 0.5 ? toward(hue, 60, sh * k) : toward(hue, 240, sh * k); return hsl2hex(h, sat * (0.75 + 0.5 * Math.sin(Math.PI * t)), l); });
  const sphere = (cv, cols) => {
    const k = cv.getContext('2d'), N = 32; k.clearRect(0, 0, N, N); const L = { x: -0.5, y: -0.6, z: 0.62 };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const nx = (x - 15.5) / 14, ny = (y - 15.5) / 14, d = nx * nx + ny * ny; if (d > 1) continue; const nz = Math.sqrt(1 - d), lam = Math.max(0, nx * L.x + ny * L.y + nz * L.z), idx = Math.min(cols.length - 1, Math.floor(lam * cols.length)); k.fillStyle = cols[idx]; k.fillRect(x, y, 1, 1); }
  };
  function draw() {
    const A = ramp(0), B = ramp(shift);
    sphere($('#a', root), A); sphere($('#b', root), B);
    const row = (name, cols) => `<div><small style="font-family:var(--mono);color:var(--muted)">${name}</small><div class="ramp">${cols.map((c) => `<i style="background:${c}"></i>`).join('')}</div><div class="ramp-lab">${cols.map((c) => `<span>${c.slice(1)}</span>`).join('')}</div></div>`;
    $('#rows', root).innerHTML = row('left: same hue, only lightness changes', A) + row('right: hue shifts (shadows cooler, lights warmer)', B);
    ['hue', 'sat', 'n', 'shift'].forEach((k) => { $('#' + k + 'v', root).textContent = { hue, sat, n, shift }[k]; });
    $('#hint', root).innerHTML = '<p>The right ball reads as lit by a warm light with cool shadows. The left one looks like a grey ball tinted green. Pure lightness ramps are the most common reason pixel art looks flat.</p>';
  }
  root.addEventListener('input', (e) => { const m = { hue: (v) => (hue = v), sat: (v) => (sat = v), n: (v) => (n = v), shift: (v) => (shift = v) }[e.target.id]; if (m) { m(+e.target.value); draw(); } });
  draw(); return () => {};
};

/* =========================================================
   Dithering
   ========================================================= */
const BAYER = { 2: [[0, 2], [3, 1]], 4: [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], 8: null };
BAYER[8] = Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => { const b = BAYER[4]; return b[y % 4][x % 4] * 4 + [[0, 2], [3, 1]][Math.floor(y / 4)][Math.floor(x / 4)]; }));
SIMS.pxdither = (root) => {
  let levels = 3, pat = 'bayer4';
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('lv', 'colours', 2, 8, levels)}</span><span class="grp"><b>Pattern</b><select id="pt">${[['none', 'none (banding)'], ['bayer2', 'ordered 2×2'], ['bayer4', 'ordered 4×4'], ['bayer8', 'ordered 8×8'], ['noise', 'random noise']].map(([k, n]) => `<option value="${k}" ${k === pat ? 'selected' : ''}>${n}</option>`).join('')}</select></span></div>
    <canvas class="gsim px" id="c" width="96" height="40" style="width:100%"></canvas><div class="sim-note"><p>A smooth gradient squeezed into just a few colours. With no dithering you get hard bands. Ordered dithering trades them for a regular pattern that the eye blends. Noise is cheap but looks dirty. Use it sparingly by hand: a few rows of checkerboard at a ramp boundary, not everywhere.</p></div>`;
  const cv = $('#c', root), g = cv.getContext('2d');
  function draw() {
    const W = 96, H = 40, img = g.createImageData(W, H), r = rng32(3), m = pat.startsWith('bayer') ? BAYER[+pat.slice(5)] : null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = x / (W - 1), th = !m ? (pat === 'noise' ? r() : 0.5) : (m[y % m.length][x % m.length] + 0.5) / (m.length * m.length);
      const s = v * (levels - 1), base = Math.floor(s), q = pat === 'none' ? Math.round(s) : base + (s - base > th ? 1 : 0), out = Math.round((clamp(q, 0, levels - 1) / (levels - 1)) * 255);
      img.data.set([Math.round(out * 0.6), Math.round(out * 0.35), out, 255], (y * W + x) * 4);
    }
    g.putImageData(img, 0, 0); $('#lvv', root).textContent = levels;
  }
  root.addEventListener('input', (e) => { if (e.target.id === 'lv') { levels = +e.target.value; draw(); } });
  root.addEventListener('change', (e) => { if (e.target.id === 'pt') { pat = e.target.value; draw(); } });
  draw(); return () => {};
};

/* =========================================================
   Sprite animation: squash and stretch, frame count, fps
   ========================================================= */
SIMS.pxanim = (root) => {
  let frames = 8, fps = 10, squash = true, raf = 0, last = performance.now(), t = 0;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('fr', 'frames', 2, 12, frames)}${rangeHtml('fp', 'fps', 2, 24, fps)}</span><span class="grp"><label class="chk"><input type="checkbox" id="sq" checked> squash &amp; stretch</label></span></div>
    <div class="gwrap"><canvas class="gsim px" id="main" width="32" height="32" style="width:min(100%,256px)"></canvas><div class="gside"><p>Sprite sheet (the frames that actually exist):</p><canvas class="gsim px" id="sheet" style="width:100%"></canvas><p id="info"></p></div></div>`;
  const cv = $('#main', root), sheet = $('#sheet', root);
  function drawFrame(k, i, ox = 0) {
    const ph = i / frames, h = Math.abs(Math.sin(Math.PI * ph)), air = h * 12;
    const grounded = 1 - h, sx = squash ? 1 + 0.35 * Math.pow(grounded, 4) - 0.12 * h : 1, sy = squash ? 1 - 0.3 * Math.pow(grounded, 4) + 0.2 * h : 1;
    const rw = 7 * sx, rh = 7 * sy, cx = ox + 16, cy = 26 - rh - air;
    k.fillStyle = 'rgba(0,0,0,.45)'; const sw = Math.round(6 * (1 - h * 0.4)); k.fillRect(Math.round(cx - sw), 27, sw * 2, 2);
    for (let y = Math.floor(cy - rh); y <= Math.ceil(cy + rh); y++) for (let x = Math.floor(cx - rw); x <= Math.ceil(cx + rw); x++) {
      const dx = (x + .5 - cx) / rw, dy = (y + .5 - cy) / rh, d = dx * dx + dy * dy; if (d > 1) continue;
      k.fillStyle = d > 0.72 ? '#257179' : dx + dy < -0.5 ? '#a7f070' : '#38b764'; k.fillRect(x, y, 1, 1);
    }
    k.fillStyle = '#1a1c2c'; k.fillRect(Math.round(cx - rw * 0.4), Math.round(cy - rh * 0.2), 1, 2); k.fillRect(Math.round(cx + rw * 0.3), Math.round(cy - rh * 0.2), 1, 2);
  }
  function build() {
    sheet.width = 32 * frames; sheet.height = 32; const k = sheet.getContext('2d'); k.clearRect(0, 0, sheet.width, 32);
    for (let i = 0; i < frames; i++) { const c = document.createElement('canvas'); c.width = 32; c.height = 32; drawFrame(c.getContext('2d'), i); k.drawImage(c, i * 32, 0); }
    $('#info', root).textContent = `${frames} frames at ${fps} fps = ${(frames / fps).toFixed(2)} s per bounce.`;
  }
  function loop(now) {
    t += (now - last) / 1000; last = now; const i = Math.floor(t * fps) % frames, k = cv.getContext('2d');
    k.clearRect(0, 0, 32, 32); k.fillStyle = '#150e24'; k.fillRect(0, 28, 32, 4); drawFrame(k, i);
    raf = requestAnimationFrame(loop);
  }
  build(); raf = requestAnimationFrame(loop);
  root.addEventListener('input', (e) => { if (e.target.id === 'fr') { frames = +e.target.value; $('#frv', root).textContent = frames; build(); } if (e.target.id === 'fp') { fps = +e.target.value; $('#fpv', root).textContent = fps; build(); } });
  root.addEventListener('change', (e) => { if (e.target.id === 'sq') { squash = e.target.checked; build(); } });
  return () => cancelAnimationFrame(raf);
};

/* =========================================================
   Integrators: explicit Euler vs semi-implicit vs velocity Verlet
   ========================================================= */
SIMS.gdintegrate = (root) => {
  let k = 4, dt = 0.05;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('kk', 'stiffness k', 1, 30, k)}${rangeHtml('dtv', 'time step ms', 5, 300, 50, 5)}</span><span class="grp"><span id="leg"></span></span></div>
    <canvas class="gsim" width="640" height="300"></canvas><div class="sim-note" id="note"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d'), T = 10;
  const COL = { exact: G.dim, explicit: G.pink, semi: G.amb, verlet: G.cy };
  const sim = (kind) => {
    let x = 1, v = 0; const out = [{ t: 0, x, e: 1 }], e0 = 0.5 * k, n = Math.min(2000, Math.ceil(T / dt));
    for (let i = 1; i <= n; i++) {
      if (kind === 'explicit') { const a = -k * x; x += v * dt; v += a * dt; }
      else if (kind === 'semi') { v += -k * x * dt; x += v * dt; }
      else { const a = -k * x; x += v * dt + 0.5 * a * dt * dt; const a2 = -k * x; v += 0.5 * (a + a2) * dt; }
      out.push({ t: i * dt, x, e: (0.5 * v * v + 0.5 * k * x * x) / e0 });
    }
    return out;
  };
  function plot(x0, w, title, key, lo, hi, series) {
    g.strokeStyle = G.dim; g.lineWidth = 1; g.strokeRect(x0 + .5, 20.5, w, 250);
    g.fillStyle = G.ink; g.font = '12px JetBrains Mono, monospace'; g.fillText(title, x0, 14);
    const Y = (v) => 270 - ((clamp(v, lo, hi) - lo) / (hi - lo)) * 250;
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(x0, Y(key === 'e' ? 1 : 0)); g.lineTo(x0 + w, Y(key === 'e' ? 1 : 0)); g.stroke();
    for (const [name, pts] of series) { g.strokeStyle = COL[name]; g.lineWidth = name === 'exact' ? 1 : 2; g.setLineDash(name === 'exact' ? [4, 4] : []); g.beginPath(); pts.forEach((p, i) => { const X = x0 + (p.t / T) * w, YY = Y(p[key]); i ? g.lineTo(X, YY) : g.moveTo(X, YY); }); g.stroke(); }
    g.setLineDash([]);
  }
  function draw() {
    const w = Math.sqrt(k), exact = Array.from({ length: 200 }, (_, i) => { const t = (i / 199) * T; return { t, x: Math.cos(w * t), e: 1 }; });
    const ex = sim('explicit'), se = sim('semi'), ve = sim('verlet');
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 300);
    plot(10, 300, 'position over 10 s', 'x', -1.6, 1.6, [['exact', exact], ['explicit', ex], ['semi', se], ['verlet', ve]]);
    plot(330, 300, 'energy / starting energy', 'e', 0, 3, [['explicit', ex], ['semi', se], ['verlet', ve]]);
    $('#kkv', root).textContent = k; $('#dtvv', root).textContent = Math.round(dt * 1000);
    $('#leg', root).innerHTML = Object.entries({ exact: 'exact', explicit: 'explicit Euler', semi: 'semi-implicit', verlet: 'Verlet' }).map(([n, l]) => `<span style="color:${COL[n]}">■ ${l}</span>`).join(' &nbsp; ');
    const worst = (a) => Math.max(...a.map((p) => Math.abs(p.e - 1)));
    $('#note', root).innerHTML = `<p>Worst energy error over the run: explicit <b>${(worst(ex) * 100).toFixed(0)}%</b>, semi-implicit <b>${(worst(se) * 100).toFixed(1)}%</b>, Verlet <b>${(worst(ve) * 100).toFixed(2)}%</b>. A frictionless spring should keep its energy forever.</p>`;
  }
  root.addEventListener('input', (e) => { if (e.target.id === 'kk') k = +e.target.value; if (e.target.id === 'dtv') dt = +e.target.value / 1000; draw(); });
  draw(); return () => {};
};

/* =========================================================
   Grid raycast (DDA)
   ========================================================= */
SIMS.gdraycast = (root) => {
  const W = 24, H = 14, S = 26; let walls = new Set(), edit = false, ox = 2.5, oy = 7.5, tx = 20, ty = 4, moveOrigin = false, drag = null;
  const r = rng32(5); for (let i = 0; i < 40; i++) walls.add(Math.floor(r() * W) + ',' + Math.floor(r() * H));
  walls.delete(Math.floor(ox) + ',' + Math.floor(oy));
  root.innerHTML = `<div class="sim-ctl"><span class="grp"><label class="chk"><input type="checkbox" id="ed"> paint walls (click cells)</label><label class="chk"><input type="checkbox" id="mo"> drag the origin instead</label><button class="btn sm" id="rnd">random walls</button><button class="btn sm ghost" id="clr">clear</button></span></div>
    <canvas class="gsim touch" width="${W * S}" height="${H * S}"></canvas><div class="sim-note" id="out"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  const dda = () => {
    let dx = tx - ox, dy = ty - oy; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    let cx = Math.floor(ox), cy = Math.floor(oy); const visited = [[cx, cy]], inf = Infinity;
    const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, tdx = dx ? Math.abs(1 / dx) : inf, tdy = dy ? Math.abs(1 / dy) : inf;
    let tmx = dx ? (dx > 0 ? cx + 1 - ox : ox - cx) * tdx : inf, tmy = dy ? (dy > 0 ? cy + 1 - oy : oy - cy) * tdy : inf, t = 0;
    if (walls.has(cx + ',' + cy)) return { visited, hit: [cx, cy], t: 0, dx, dy };
    for (let i = 0; i < 200; i++) {
      if (tmx < tmy) { t = tmx; cx += sx; tmx += tdx; } else { t = tmy; cy += sy; tmy += tdy; }
      if (cx < 0 || cy < 0 || cx >= W || cy >= H) return { visited, hit: null, t, dx, dy };
      visited.push([cx, cy]); if (walls.has(cx + ',' + cy)) return { visited, hit: [cx, cy], t, dx, dy };
    }
    return { visited, hit: null, t, dx, dy };
  };
  function draw() {
    g.fillStyle = G.bg; g.fillRect(0, 0, W * S, H * S);
    const res = dda(); const vis = new Set(res.visited.map((c) => c.join(',')));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = x + ',' + y; g.fillStyle = walls.has(k) ? '#3b2a63' : vis.has(k) ? 'rgba(185,140,255,.28)' : '#0d0919'; g.fillRect(x * S + 1, y * S + 1, S - 2, S - 2);
    }
    if (res.hit) { g.strokeStyle = G.amb; g.lineWidth = 2; g.strokeRect(res.hit[0] * S + 2, res.hit[1] * S + 2, S - 4, S - 4); }
    const end = res.hit ? res.t : 40; g.strokeStyle = G.cy; g.lineWidth = 2; g.beginPath(); g.moveTo(ox * S, oy * S); g.lineTo((ox + res.dx * end) * S, (oy + res.dy * end) * S); g.stroke();
    g.fillStyle = G.acc; g.beginPath(); g.arc(ox * S, oy * S, 5, 0, 6.3); g.fill();
    $('#out', root).innerHTML = res.hit ? `<p>Hit cell <b>(${res.hit[0]}, ${res.hit[1]})</b> at distance <b>${res.t.toFixed(2)}</b> cells after visiting only <b>${res.visited.length}</b> cells. Sampling every 0.05 cells would need about <b>${Math.ceil(res.t / 0.05)}</b> lookups.</p>` : `<p>No wall in the way (the ray left the grid). The DDA visited <b>${res.visited.length}</b> cells.</p>`;
  }
  const cellOf = (e) => { const p = ptr(cv, e); return { x: p.x / S, y: p.y / S }; };
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); const c = cellOf(e); if (edit) { const k = Math.floor(c.x) + ',' + Math.floor(c.y); walls.has(k) ? walls.delete(k) : walls.add(k); } else if (moveOrigin) { drag = 'o'; ox = clamp(c.x, 0.01, W - 0.01); oy = clamp(c.y, 0.01, H - 0.01); } else { drag = 't'; tx = c.x; ty = c.y; } draw(); });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const c = cellOf(e); if (drag === 'o') { ox = clamp(c.x, 0.01, W - 0.01); oy = clamp(c.y, 0.01, H - 0.01); } else { tx = c.x; ty = c.y; } draw(); });
  const up = () => { drag = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  root.addEventListener('change', (e) => { if (e.target.id === 'ed') edit = e.target.checked; if (e.target.id === 'mo') moveOrigin = e.target.checked; });
  $('#rnd', root).onclick = () => { walls = new Set(); const q = rng32(Math.floor(Math.random() * 1e6)); for (let i = 0; i < 45; i++) walls.add(Math.floor(q() * W) + ',' + Math.floor(q() * H)); walls.delete(Math.floor(ox) + ',' + Math.floor(oy)); draw(); };
  $('#clr', root).onclick = () => { walls = new Set(); draw(); };
  draw(); return () => {};
};

/* =========================================================
   Boids: separation, alignment, cohesion
   ========================================================= */
SIMS.gdboids = (root) => {
  const cfg = { sep: 1.5, ali: 1.0, coh: 1.0, rad: 60 }; let raf = 0, last = performance.now(), target = null;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('sep', 'separation', 0, 3, 1.5, 0.1)}${rangeHtml('ali', 'alignment', 0, 3, 1, 0.1)}${rangeHtml('coh', 'cohesion', 0, 3, 1, 0.1)}${rangeHtml('rad', 'sight radius', 20, 140, 60, 5)}</span><span class="grp"><button class="btn sm ghost" id="rs">scatter</button></span></div>
    <canvas class="gsim touch" width="640" height="320"></canvas><div class="sim-note"><p>Each boid only looks at neighbours inside its sight radius. Move the pointer over the canvas: boids are drawn toward it.</p></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d'), W = 640, H = 320, r = rng32(11);
  let B = []; const scatter = () => { B = Array.from({ length: 70 }, () => { const a = r() * 6.28; return { x: r() * W, y: r() * H, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 }; }); }; scatter();
  cv.addEventListener('pointermove', (e) => { const p = ptr(cv, e); target = p; }); cv.addEventListener('pointerleave', () => { target = null; });
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const b of B) {
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
      for (const o of B) { if (o === b) continue; const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); if (d < cfg.rad) { n++; ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d < cfg.rad * 0.4 && d > 0) { sx -= dx / d * (1 - d / (cfg.rad * 0.4)); sy -= dy / d * (1 - d / (cfg.rad * 0.4)); } } }
      let fx = sx * cfg.sep * 120, fy = sy * cfg.sep * 120;
      if (n) { fx += (ax / n - b.vx) * cfg.ali * 1.5 + (cx / n - b.x) * cfg.coh * 0.8; fy += (ay / n - b.vy) * cfg.ali * 1.5 + (cy / n - b.y) * cfg.coh * 0.8; }
      if (target) { fx += (target.x - b.x) * 0.5; fy += (target.y - b.y) * 0.5; }
      b.vx += fx * dt; b.vy += fy * dt; const sp = Math.hypot(b.vx, b.vy) || 1, cl = clamp(sp, 40, 90); b.vx = b.vx / sp * cl; b.vy = b.vy / sp * cl;
    }
    g.fillStyle = G.bg; g.fillRect(0, 0, W, H);
    for (const b of B) {
      b.x = (b.x + b.vx * dt + W) % W; b.y = (b.y + b.vy * dt + H) % H;
      const a = Math.atan2(b.vy, b.vx); g.save(); g.translate(b.x, b.y); g.rotate(a); g.fillStyle = G.acc; g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, 4); g.lineTo(-5, -4); g.closePath(); g.fill(); g.restore();
    }
    if (target) { g.strokeStyle = G.amb; g.beginPath(); g.arc(target.x, target.y, 8, 0, 6.3); g.stroke(); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  root.addEventListener('input', (e) => { const k = e.target.id; if (k in cfg) { cfg[k] = +e.target.value; $('#' + k + 'v', root).textContent = cfg[k]; } });
  $('#rs', root).onclick = scatter;
  return () => cancelAnimationFrame(raf);
};

/* =========================================================
   Value noise and fractal noise (octaves)
   ========================================================= */
const hash2 = (x, y, s) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (t) => t * t * (3 - 2 * t);
const vnoise = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
SIMS.gdnoise = (root) => {
  const cfg = { scale: 6, oct: 4, pers: 50, seed: 3, bands: true, warp: false };
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('scale', 'frequency', 1, 20, 6)}${rangeHtml('oct', 'octaves', 1, 6, 4)}${rangeHtml('pers', 'persistence %', 20, 80, 50, 5)}${rangeHtml('seed', 'seed', 1, 50, 3)}</span><span class="grp"><label class="chk"><input type="checkbox" id="bands" checked> terrain colours</label><label class="chk"><input type="checkbox" id="warp"> domain warp</label></span></div>
    <canvas class="gsim px" width="160" height="100" style="width:100%"></canvas><div class="sim-note"><p>One octave of value noise is smooth blobs. Each extra octave doubles the frequency and shrinks the amplitude, adding finer detail. Persistence is how fast the amplitude shrinks.</p></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  const PAL = [[0, [20, 40, 110]], [0.38, [30, 80, 170]], [0.45, [220, 200, 140]], [0.5, [60, 150, 70]], [0.68, [40, 100, 50]], [0.78, [120, 110, 100]], [0.9, [235, 235, 240]]];
  function draw() {
    const img = g.createImageData(160, 100), p = cfg.pers / 100;
    for (let y = 0; y < 100; y++) for (let x = 0; x < 160; x++) {
      let u = (x / 160) * cfg.scale, v = (y / 100) * cfg.scale * 0.625;
      if (cfg.warp) { const wx = vnoise(u * 0.7 + 17, v * 0.7, cfg.seed + 99), wy = vnoise(u * 0.7, v * 0.7 + 31, cfg.seed + 7); u += (wx - 0.5) * 2; v += (wy - 0.5) * 2; }
      let amp = 1, f = 1, sum = 0, norm = 0; for (let o = 0; o < cfg.oct; o++) { sum += vnoise(u * f, v * f, cfg.seed + o) * amp; norm += amp; amp *= p; f *= 2; }
      const n = sum / norm; let c;
      if (!cfg.bands) { const gv = Math.round(n * 255); c = [gv, gv, gv]; } else { c = PAL[0][1]; for (const [t, col] of PAL) if (n >= t) c = col; }
      img.data.set([...c, 255], (y * 160 + x) * 4);
    }
    g.putImageData(img, 0, 0); for (const k of ['scale', 'oct', 'pers', 'seed']) $('#' + k + 'v', root).textContent = cfg[k];
  }
  root.addEventListener('input', (e) => { const k = e.target.id; if (['scale', 'oct', 'pers', 'seed'].includes(k)) { cfg[k] = +e.target.value; draw(); } });
  root.addEventListener('change', (e) => { if (e.target.id === 'bands') cfg.bands = e.target.checked; if (e.target.id === 'warp') cfg.warp = e.target.checked; draw(); });
  draw(); return () => {};
};

/* =========================================================
   Transform hierarchy: order of operations and shear
   ========================================================= */
SIMS.gdtransform = (root) => {
  const cfg = { a1: 35, a2: -40, a3: 25, sx: 1, order: 'trs' };
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('a1', 'shoulder °', -180, 180, 35)}${rangeHtml('a2', 'elbow °', -180, 180, -40)}${rangeHtml('a3', 'wrist °', -180, 180, 25)}</span><span class="grp">${rangeHtml('sx', 'parent x-scale', 0.4, 2.5, 1, 0.1)}<b>Order</b><select id="order"><option value="trs">translate · rotate · scale (correct)</option><option value="rts">rotate · translate · scale (wrong)</option></select></span></div>
    <canvas class="gsim" width="640" height="300"></canvas><div class="sim-note" id="note"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  const I = [1, 0, 0, 1, 0, 0], mul = (p, c) => [p[0] * c[0] + p[2] * c[1], p[1] * c[0] + p[3] * c[1], p[0] * c[2] + p[2] * c[3], p[1] * c[2] + p[3] * c[3], p[0] * c[4] + p[2] * c[5] + p[4], p[1] * c[4] + p[3] * c[5] + p[5]];
  const T = (x, y) => [1, 0, 0, 1, x, y], R = (d) => { const a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; }, Sc = (x, y) => [x, 0, 0, y, 0, 0];
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  function draw() {
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 300);
    const L = 90, node = (parent, angle, off, sc) => cfg.order === 'trs' ? mul(parent, mul(T(off, 0), mul(R(angle), sc))) : mul(parent, mul(R(angle), mul(T(off, 0), sc)));
    const root0 = mul(T(120, 150), Sc(cfg.sx, 1)), m1 = node(root0, cfg.a1, 0, I), m2 = node(m1, cfg.a2, L, I), m3 = node(m2, cfg.a3, L, I);
    const pts = [[0, 0], [L, 0]].map((p) => ap(m1, ...p)), pts2 = [[0, 0], [L, 0]].map((p) => ap(m2, ...p)), pts3 = [[0, 0], [60, 0]].map((p) => ap(m3, ...p));
    const seg = (a, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(...a[0]); g.lineTo(...a[1]); g.stroke(); };
    const axes = (m) => { const o = ap(m, 0, 0), x = ap(m, 24, 0), y = ap(m, 0, 24); g.lineWidth = 2; g.strokeStyle = G.pink; g.beginPath(); g.moveTo(...o); g.lineTo(...x); g.stroke(); g.strokeStyle = G.cy; g.beginPath(); g.moveTo(...o); g.lineTo(...y); g.stroke(); };
    seg(pts, G.acc, 8); seg(pts2, G.amb, 6); seg(pts3, G.ink, 4); axes(m1); axes(m2); axes(m3);
    g.fillStyle = G.ink; for (const p of [pts[0], pts2[0], pts3[0], pts3[1]]) g.fillRect(p[0] - 3, p[1] - 3, 6, 6);
    const hand = pts3[1], det = (m) => m[0] * m[3] - m[1] * m[2], skew = Math.abs(m3[0] * m3[2] + m3[1] * m3[3]) / (Math.hypot(m3[0], m3[1]) * Math.hypot(m3[2], m3[3]) || 1);
    $('#note', root).innerHTML = `<p>Hand position in the world: <b>(${hand[0].toFixed(0)}, ${hand[1].toFixed(0)})</b>. Magenta is each node's x axis, cyan its y axis. ${skew > 0.05 ? `<span style="color:${G.amb}">The axes of the last node are no longer perpendicular (shear): a non-uniform scale on a rotated child.</span>` : 'All axes are perpendicular.'}</p>`;
    for (const k of ['a1', 'a2', 'a3', 'sx']) $('#' + k + 'v', root).textContent = cfg[k];
  }
  root.addEventListener('input', (e) => { const k = e.target.id; if (k in cfg && k !== 'order') { cfg[k] = +e.target.value; draw(); } });
  root.addEventListener('change', (e) => { if (e.target.id === 'order') { cfg.order = e.target.value; draw(); } });
  draw(); return () => {};
};

/* =========================================================
   Event queue: producer, consumer, a full buffer and the policy for it
   ========================================================= */
SIMS.gdqueue = (root) => {
  const cfg = { cap: 8, prod: 6, cons: 4, policy: 'drop-new' }; let q = [], dropped = 0, handled = 0, made = 0, acc1 = 0, acc2 = 0, last = performance.now(), raf = 0, burst = 0;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('cap', 'capacity', 2, 20, 8)}${rangeHtml('prod', 'events produced /s', 1, 20, 6)}${rangeHtml('cons', 'handled /s', 1, 20, 4)}</span><span class="grp"><b>When full</b><select id="policy"><option value="drop-new">drop the new event</option><option value="drop-old">drop the oldest</option></select><button class="btn sm" id="burst">burst ×10</button><button class="btn sm ghost" id="rs">reset</button></span></div>
    <canvas class="gsim" width="640" height="130"></canvas><div class="sim-note" id="note"></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d');
  const push = () => { made++; if (q.length >= cfg.cap) { dropped++; if (cfg.policy === 'drop-old') { q.shift(); q.push(made); } } else q.push(made); };
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; acc1 += dt * cfg.prod; acc2 += dt * cfg.cons;
    while (acc1 >= 1) { acc1 -= 1; push(); } while (burst > 0) { burst--; push(); } while (acc2 >= 1) { acc2 -= 1; if (q.length) { q.shift(); handled++; } }
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 130);
    const w = Math.min(60, 600 / cfg.cap);
    for (let i = 0; i < cfg.cap; i++) { const x = 20 + i * w; g.strokeStyle = G.dim; g.strokeRect(x + .5, 30.5, w - 6, 50); if (i < q.length) { g.fillStyle = G.acc; g.fillRect(x + 3, 33, w - 12, 44); g.fillStyle = '#07040d'; g.font = '11px JetBrains Mono, monospace'; g.fillText(q[i], x + 5, 60); } }
    g.fillStyle = G.dim; g.font = '12px JetBrains Mono, monospace'; g.fillText('oldest ←', 20, 100); g.fillText('→ newest', 20 + (cfg.cap - 1) * w - 10, 100);
    $('#note', root).innerHTML = `<p>produced <b>${made}</b> · handled <b>${handled}</b> · waiting <b>${q.length}</b> · <span style="color:${dropped ? G.pink : G.ink}">dropped <b>${dropped}</b></span>. If events arrive faster than they are handled, no capacity is big enough: decide what is allowed to be lost.</p>`;
    for (const k of ['cap', 'prod', 'cons']) $('#' + k + 'v', root).textContent = cfg[k];
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  root.addEventListener('input', (e) => { const k = e.target.id; if (k in cfg && k !== 'policy') { cfg[k] = +e.target.value; if (k === 'cap') q = q.slice(-cfg.cap); } });
  root.addEventListener('change', (e) => { if (e.target.id === 'policy') cfg.policy = e.target.value; });
  $('#burst', root).onclick = () => { burst += 10; }; $('#rs', root).onclick = () => { q = []; dropped = handled = made = 0; };
  return () => cancelAnimationFrame(raf);
};

/* =========================================================
   Netcode: prediction, reconciliation and interpolation
   ========================================================= */
SIMS.gdnet = (root) => {
  const cfg = { rtt: 160, jit: 30, loss: 5, rate: 15, delay: 100, predict: true, interp: true }; let raf = 0, last = performance.now(), tick = 0, acc = 0, auto = true, dir = 0;
  root.innerHTML = `<div class="sim-ctl"><span class="grp">${rangeHtml('rtt', 'round trip ms', 20, 400, 160, 10)}${rangeHtml('jit', 'jitter ms', 0, 100, 30, 5)}${rangeHtml('loss', 'packet loss %', 0, 30, 5)}</span><span class="grp">${rangeHtml('rate', 'snapshots /s', 5, 30, 15)}${rangeHtml('delay', 'interpolation delay ms', 0, 300, 100, 10)}</span>
    <span class="grp"><label class="chk"><input type="checkbox" id="predict" checked> client prediction</label><label class="chk"><input type="checkbox" id="interp" checked> interpolate others</label><button class="btn sm" id="kick">server pushes me (+60)</button></span></div>
    <canvas class="gsim" width="640" height="260"></canvas><div class="sim-note"><p>Row 1 is you. Grey is the server's truth, the coloured box is what you see. Row 2 is another player as you see them. Everything moves on its own back and forth; use <b>server pushes me</b> to create a misprediction and watch the correction.</p></div>`;
  const cv = $('canvas', root), g = cv.getContext('2d'), DT = 1 / 60, SPEED = 2.2, LO = 20, HI = 600;
  let serverX = 100, serverSeq = 0, clientX = 100, seq = 0, pending = [], toServer = [], toClient = [], remoteX = 100, remoteDir = 1, snaps = [], shown = 100, simT = 0, naiveX = 100, err = 0;
  const rnd = rng32(9), lat = () => Math.max(0, cfg.rtt / 2 + (rnd() - 0.5) * 2 * cfg.jit) / 1000;
  const input = () => (auto ? (Math.floor(simT / 1.6) % 2 ? -1 : 1) : dir);
  function step() {
    simT += DT; const d = input();
    // client: send input, predict
    seq++; const inp = { seq, d }; if (rnd() * 100 >= cfg.loss) toServer.push({ at: simT + lat(), inp }); pending.push(inp);
    if (cfg.predict) { clientX = clamp(clientX + d * SPEED, LO, HI); }
    // server: process arrived inputs in order
    toServer.sort((a, b) => a.at - b.at); while (toServer.length && toServer[0].at <= simT) { const m = toServer.shift(); serverX = clamp(serverX + m.inp.d * SPEED, LO, HI); serverSeq = Math.max(serverSeq, m.inp.seq); }
    // remote player moves on the server and snapshots are sent at the snapshot rate
    remoteX += remoteDir * 1.6; if (remoteX > HI || remoteX < LO) { remoteDir *= -1; remoteX = clamp(remoteX, LO, HI); }
    tick++; if (tick % Math.max(1, Math.round(60 / cfg.rate)) === 0 && rnd() * 100 >= cfg.loss) toClient.push({ at: simT + lat(), t: simT, me: serverX, ack: serverSeq, other: remoteX });
    toClient.sort((a, b) => a.at - b.at);
    while (toClient.length && toClient[0].at <= simT) {
      const s = toClient.shift(); snaps.push({ t: s.t, x: s.other }); if (snaps.length > 60) snaps.shift(); naiveX = s.me;
      pending = pending.filter((p) => p.seq > s.ack);
      if (cfg.predict) { let x = s.me; for (const p of pending) x = clamp(x + p.d * SPEED, LO, HI); err = x - clientX; clientX = x; }
    }
    // what is drawn for the remote player
    if (cfg.interp) { const rt = simT - cfg.delay / 1000 - cfg.rtt / 2000; let a = null, b = null; for (const s of snaps) { if (s.t <= rt) a = s; else { b = s; break; } } shown = a && b ? a.x + (b.x - a.x) * ((rt - a.t) / (b.t - a.t || 1)) : (a ? a.x : (snaps[0] ? snaps[0].x : shown)); }
    else if (snaps.length) shown = snaps[snaps.length - 1].x;
  }
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now; while (acc >= DT) { acc -= DT; step(); }
    g.fillStyle = G.bg; g.fillRect(0, 0, 640, 260);
    g.fillStyle = G.dim; g.font = '12px JetBrains Mono, monospace'; g.fillText('you', 8, 18); g.fillText('another player, as you see them', 8, 148);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.strokeRect(LO - 8.5, 28.5, HI - LO + 17, 90); g.strokeRect(LO - 8.5, 158.5, HI - LO + 17, 90);
    g.fillStyle = 'rgba(150,150,170,.55)'; g.fillRect(serverX - 12, 62, 24, 24);
    const mine = cfg.predict ? clientX : naiveX; g.fillStyle = cfg.predict ? G.cy : G.pink; g.fillRect(mine - 10, 66, 20, 20);
    if (cfg.predict && Math.abs(err) > 0.5) { g.fillStyle = G.amb; g.fillText('correction ' + err.toFixed(0) + ' px', mine + 16, 56); err *= 0.97; }
    g.fillStyle = G.dim; g.fillRect(shown - 12, 190, 24, 24); g.fillStyle = cfg.interp ? G.acc : G.amb; g.fillRect(shown - 10, 192, 20, 20);
    for (const s of snaps.slice(-12)) { g.fillStyle = 'rgba(185,140,255,.5)'; g.fillRect(s.x - 2, 226, 4, 10); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  root.addEventListener('input', (e) => { const k = e.target.id; if (k in cfg && typeof cfg[k] === 'number') { cfg[k] = +e.target.value; $('#' + k + 'v', root).textContent = cfg[k]; } });
  root.addEventListener('change', (e) => { if (e.target.id === 'predict') { cfg.predict = e.target.checked; clientX = serverX; pending = []; } if (e.target.id === 'interp') cfg.interp = e.target.checked; });
  $('#kick', root).onclick = () => { toClient.length = 0; serverX = clamp(serverX + 60, LO, HI); };
  return () => cancelAnimationFrame(raf);
};
})();
