/* Deterministic simulation shared by the playground, tests and exported projects. */
(function (root) {
  "use strict";
  const TILE = 32,
    DT = 1 / 60;
  const DEFAULTS = {
    acceleration: 1800,
    friction: 1500,
    speed: 230,
    jump: 520,
    gravity: 1250,
    coyote: 0.1,
    buffer: 0.12,
    camera: 8,
    bug: "",
  };
  const DEFAULT_LEVEL = [
    "........................",
    "........................",
    "........................",
    "........................",
    "....................G...",
    "...............###......",
    "..........###...........",
    "........................",
    "......###...............",
    "........................",
    "S.......................",
    "######...###############",
  ];
  function tiles(level) {
    return level.flatMap((row, y) =>
      [...row].flatMap((c, x) =>
        c === "#" ? [{ x: x * TILE, y: y * TILE, w: TILE, h: TILE }] : [],
      ),
    );
  }
  const overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function spawn(level) {
    for (let y = 0; y < level.length; y++) {
      const x = level[y].indexOf("S");
      if (x >= 0) return { x: x * TILE + 5, y: y * TILE - 4 };
    }
    return { x: 40, y: 250 };
  }
  function create(config = {}, level = DEFAULT_LEVEL) {
    const pos = spawn(level);
    return {
      config: { ...DEFAULTS, ...config },
      level: [...level],
      blocks: tiles(level),
      p: { ...pos, w: 22, h: 28, vx: 0, vy: 0, grounded: false },
      previous: { ...pos },
      tick: 0,
      lastGround: -999,
      lastJump: -999,
      jumpHeld: false,
      won: false,
      deaths: 0,
      jumps: 0,
      contacts: [],
      camera: 0,
      coins: 0,
      enemies: level.flatMap((r, y) =>
        [...r].flatMap((v, x) =>
          v === "E"
            ? [{ x: x * TILE, home: x * TILE, y: y * TILE, w: 24, h: 28 }]
            : [],
        ),
      ),
      pickups: level.flatMap((r, y) =>
        [...r].flatMap((v, x) =>
          v === "P"
            ? [{ x: x * TILE + 8, y: y * TILE + 8, w: 16, h: 16, taken: false }]
            : [],
        ),
      ),
      platform: { x: 220, y: 260, w: 72, h: 12 },
      riding: false,
    };
  }
  function reset(s) {
    Object.assign(s.p, spawn(s.level), { vx: 0, vy: 0, grounded: false });
    s.previous = { x: s.p.x, y: s.p.y };
    s.lastGround = -999;
    s.lastJump = -999;
    s.riding = false;
  }
  function moveAxis(p, amount, axis, blocks, contacts, swept = true) {
    const start = p[axis];
    p[axis] += amount;
    for (const b of blocks) {
      const cross =
        axis === "x"
          ? p.y < b.y + b.h && p.y + p.h > b.y
          : p.x < b.x + b.w && p.x + p.w > b.x;
      const size = axis === "x" ? p.w : p.h,
        near = b[axis],
        far = near + (axis === "x" ? b.w : b.h);
      const crossed =
        cross &&
        (amount > 0
          ? start + size <= near && p[axis] + size >= near
          : start >= far && p[axis] <= far);
      if ((swept && crossed) || overlap(p, b)) {
        p[axis] = amount > 0 ? near - size : far;
        if (axis === "y" && amount > 0) p.grounded = true;
        p[axis === "x" ? "vx" : "vy"] = 0;
        contacts.push({
          x: p.x + p.w / 2,
          y: p.y + p.h / 2,
          nx: axis === "x" ? -Math.sign(amount) : 0,
          ny: axis === "y" ? -Math.sign(amount) : 0,
        });
      }
    }
  }
  function step(s, input = {}, dt = DT) {
    const p = s.p,
      c = s.config;
    s.previous = { x: p.x, y: p.y };
    s.tick++;
    s.contacts = [];
    const oldX = s.platform.x;
    s.platform.x = 220 + Math.sin(s.tick * DT * 1.2) * 70;
    if (s.riding && c.bug !== "platform") p.x += s.platform.x - oldX;
    if (input.jump && (!s.jumpHeld || c.bug === "double")) s.lastJump = s.tick;
    s.jumpHeld = !!input.jump;
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    p.vx = direction
      ? Math.max(
          -c.speed,
          Math.min(c.speed, p.vx + direction * c.acceleration * dt),
        )
      : Math.sign(p.vx) * Math.max(0, Math.abs(p.vx) - c.friction * dt);
    if (
      s.tick - s.lastJump <= c.buffer / DT &&
      (p.grounded || s.tick - s.lastGround <= c.coyote / DT)
    ) {
      p.vy = -c.jump;
      p.grounded = false;
      s.lastJump = -999;
      if (c.bug !== "double") s.lastGround = -999;
      s.jumps++;
    }
    p.vy += c.gravity * dt;
    p.grounded = false;
    const blocks = [...s.blocks, s.platform];
    moveAxis(p, p.vx * dt, "x", blocks, s.contacts, c.bug !== "tunnel");
    moveAxis(p, p.vy * dt, "y", blocks, s.contacts, c.bug !== "tunnel");
    s.riding =
      p.grounded &&
      Math.abs(p.y + p.h - s.platform.y) < 0.01 &&
      p.x + p.w > s.platform.x &&
      p.x < s.platform.x + s.platform.w;
    if (p.grounded) s.lastGround = s.tick;
    const goal = s.level.flatMap((r, y) =>
      [...r].flatMap((v, x) =>
        v === "G" ? [{ x: x * TILE, y: y * TILE, w: TILE, h: TILE }] : [],
      ),
    );
    s.enemies.forEach((e) => (e.x = e.home + Math.sin(s.tick * DT * 2) * 20));
    s.pickups.forEach((coin) => {
      if (!coin.taken && overlap(p, coin)) {
        coin.taken = true;
        s.coins++;
      }
    });
    if (s.enemies.some((e) => overlap(p, e))) {
      s.deaths++;
      reset(s);
    }
    if (goal.some((g) => overlap(p, g))) s.won = true;
    if (p.y > s.level.length * TILE + 100) {
      s.deaths++;
      reset(s);
    }
    s.camera +=
      (Math.max(0, p.x - 240) - s.camera) * Math.min(1, c.camera * dt);
    return s;
  }
  function replay(config, level, inputs) {
    const s = create(config, level);
    for (const input of inputs) step(s, input);
    return s;
  }
  function search(grid, start, goal, algorithm = "astar") {
    const width = grid[0].length,
      height = grid.length,
      key = (p) => p[1] * width + p[0];
    const open = [{ p: start, g: 0 }],
      came = new Map(),
      costs = new Map([[key(start), 0]]),
      visited = [],
      closed = new Set();
    const heuristic = (p) =>
      algorithm === "astar"
        ? Math.abs(p[0] - goal[0]) + Math.abs(p[1] - goal[1])
        : 0;
    while (open.length) {
      if (algorithm !== "bfs")
        open.sort((a, b) => a.g + heuristic(a.p) - b.g - heuristic(b.p));
      const cur = open.shift(),
        k = key(cur.p);
      if (closed.has(k)) continue;
      closed.add(k);
      visited.push(cur.p);
      if (k === key(goal)) {
        const path = [cur.p];
        while (came.has(key(path[0]))) path.unshift(came.get(key(path[0])));
        return { visited, path, cost: cur.g };
      }
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ]) {
        const p = [cur.p[0] + dx, cur.p[1] + dy];
        if (
          p[0] < 0 ||
          p[1] < 0 ||
          p[0] >= width ||
          p[1] >= height ||
          grid[p[1]][p[0]] === "#"
        )
          continue;
        const g =
            cur.g +
            (algorithm === "bfs" ? 1 : grid[p[1]][p[0]] === "~" ? 5 : 1),
          next = key(p);
        if (g < (costs.get(next) ?? Infinity)) {
          costs.set(next, g);
          came.set(next, cur.p);
          open.push({ p, g });
        }
      }
    }
    return { visited, path: [], cost: Infinity };
  }
  function pairs(bodies, useGrid, cellSize = 48) {
    const candidates = [],
      seen = new Set(),
      buckets = new Map();
    if (!useGrid) {
      for (let i = 0; i < bodies.length; i++)
        for (let j = i + 1; j < bodies.length; j++) candidates.push([i, j]);
    } else
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        for (
          let y = Math.floor(b.y / cellSize);
          y <= Math.floor((b.y + b.h) / cellSize);
          y++
        )
          for (
            let x = Math.floor(b.x / cellSize);
            x <= Math.floor((b.x + b.w) / cellSize);
            x++
          ) {
            const key = x + "," + y,
              bucket = buckets.get(key) || [];
            for (const j of bucket) {
              const id = j + ":" + i;
              if (!seen.has(id)) {
                seen.add(id);
                candidates.push([j, i]);
              }
            }
            bucket.push(i);
            buckets.set(key, bucket);
          }
      }
    return {
      candidates: candidates.length,
      hits: candidates.filter(([i, j]) => overlap(bodies[i], bodies[j])),
    };
  }
  const api = {
    TILE,
    DT,
    DEFAULTS,
    DEFAULT_LEVEL,
    create,
    step,
    reset,
    replay,
    search,
    pairs,
    overlap,
  };
  root.GameLab = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
