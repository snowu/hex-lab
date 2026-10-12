import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  C = require("../assets/game/core.js");
let checks = 0;
const check = (title, fn) => {
  fn();
  checks++;
  console.log("PASS " + title);
};
check("fixed-step input replay is deterministic", () => {
  const input = Array.from({ length: 240 }, (_, i) => ({
    right: i < 150,
    jump: i === 25 || i === 100,
  }));
  const a = C.replay({}, C.DEFAULT_LEVEL, input),
    b = C.replay({}, C.DEFAULT_LEVEL, input);
  assert.deepEqual(a, b);
  assert.equal(a.tick, 240);
});
check("holding jump does not consume more than one press", () => {
  const s = C.create();
  for (let i = 0; i < 10; i++) C.step(s);
  for (let i = 0; i < 90; i++) C.step(s, { jump: true });
  assert.equal(s.jumps, 1);
});
check("buffered press fires on landing", () => {
  const s = C.create();
  s.p.y = 310;
  s.p.vy = 200;
  C.step(s, { jump: true });
  for (let i = 0; i < 6; i++) C.step(s);
  assert.equal(s.jumps, 1);
  assert.ok(s.p.vy < 0);
});
check("swept collision stops a fast falling body", () => {
  const level = ["S...", "....", "####", "...."];
  const s = C.create({}, level);
  s.p.x = 40;
  s.p.y = 0;
  s.p.vy = 10000;
  C.step(s);
  assert.equal(s.p.y, 64 - s.p.h);
  assert.equal(s.p.vy, 0);
});
check("discrete debug variant reproduces tunneling", () => {
  const level = ["S...", "....", "####", "...."];
  const s = C.create({ bug: "tunnel" }, level);
  s.p.x = 40;
  s.p.y = 0;
  s.p.vy = 10000;
  C.step(s);
  assert.ok(s.p.y > 64);
});
check("weighted search trades steps for cost", () => {
  const grid = [".....", ".~~~.", "....."];
  const bfs = C.search(grid, [0, 1], [4, 1], "bfs"),
    d = C.search(grid, [0, 1], [4, 1], "dijkstra"),
    a = C.search(grid, [0, 1], [4, 1], "astar");
  assert.equal(bfs.path.length - 1, 4);
  assert.equal(d.cost, 6);
  assert.equal(a.cost, d.cost);
  assert.ok(a.visited.length <= d.visited.length);
});
check("unreachable path terminates", () => {
  const result = C.search([".#."], [0, 0], [2, 0]);
  assert.equal(result.path.length, 0);
  assert.equal(result.cost, Infinity);
});
check("spatial grid preserves all collisions across cell boundaries", () => {
  let seed = 5;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const bodies = Array.from({ length: 200 }, () => ({
    x: random() * 640 - 20,
    y: random() * 384 - 20,
    w: random() * 90 + 1,
    h: random() * 90 + 1,
  }));
  const normal = C.pairs(bodies, false)
    .hits.map(([a, b]) => `${Math.min(a, b)}:${Math.max(a, b)}`)
    .sort();
  for (const size of [16, 48, 128])
    assert.deepEqual(
      C.pairs(bodies, true, size)
        .hits.map(([a, b]) => `${Math.min(a, b)}:${Math.max(a, b)}`)
        .sort(),
      normal,
    );
});
check("default platformer level has a reachable goal", () => {
  const s = C.create();
  for (let i = 0; i < 60; i++) C.step(s, { right: s.p.x < 130 });
  for (const target of [235, 360, 515, 650]) {
    C.step(s, { jump: true, right: true });
    for (let i = 0; i < 150; i++) {
      C.step(s, { right: s.p.x < target });
      if (s.won || s.p.grounded) break;
    }
  }
  assert.equal(s.won, true);
  assert.equal(s.deaths, 0);
});
check("level pickups are collected once and enemies cause a reset", () => {
  const s = C.create({}, ["SP.E", "####"]);
  s.p.x = 34;
  s.p.y = 0;
  C.step(s);
  C.step(s);
  assert.equal(s.coins, 1);
  s.p.x = s.enemies[0].x;
  s.p.y = 0;
  C.step(s);
  assert.equal(s.deaths, 1);
});
const projectSource = fs.readFileSync(
  new URL("../assets/game/projects.js", import.meta.url),
  "utf8",
);
function projectRuntime(kind) {
  let next,
    now = 0;
  const ctx = new Proxy({}, { get: () => () => {} }),
    canvas = {
      dataset: {},
      getContext: () => ctx,
      addEventListener() {},
      removeEventListener() {},
    };
  const world = vm.createContext({
    window: { GameLab: C, LAB_VIEWS: [] },
    document: {},
    requestAnimationFrame(fn) {
      next = fn;
      return 1;
    },
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {},
  });
  vm.runInContext(projectSource, world);
  const game = world.window.GameProjectRuntime(canvas, kind);
  return {
    game,
    advance() {
      now += 1000 / 60;
      next(now);
    },
  };
}
check("all build-along runtimes advance, pause and restart", () => {
  for (const kind of ["pong", "breakout", "platformer", "arena"]) {
    const { game, advance } = projectRuntime(kind);
    for (let i = 0; i < 20; i++) advance();
    assert.ok(game.stats.ticks >= 18);
    game.pause(true);
    const before = game.stats.ticks;
    for (let i = 0; i < 10; i++) advance();
    assert.equal(game.stats.ticks, before);
    game.restart();
    assert.equal(game.stats.ticks, 0);
    game.dispose();
  }
});
check("arena can be won by aiming and moving", () => {
  const { game, advance } = projectRuntime("arena");
  game.hold(" ", true);
  for (let i = 0; i < 2400 && !game.stats.won && !game.stats.lost; i++) {
    advance();
  }
  assert.equal(game.stats.won, true, JSON.stringify(game.stats));
  assert.ok(game.stats.kills >= 10);
  game.dispose();
});
for (const kind of ["pong", "breakout"])
  check(kind + " has a reachable win condition", () => {
    const { game, advance } = projectRuntime(kind);
    for (let i = 0; i < 12000 && !game.stats.won && !game.stats.lost; i++) {
      const state = game.snapshot(),
        ball = state.ball;
      let x = ball.x;
      if (ball.vy > 0 && kind === "breakout") {
        x += (ball.vx * (349 - ball.y)) / ball.vy;
        while (x < 7 || x > 633) x = x < 7 ? 14 - x : 1266 - x;
      }
      const brick = kind === "breakout" && state.bricks.find((b) => b.alive);
      const aim = brick
        ? Math.max(-45, Math.min(45, (brick.x + 39 - x) * 0.16))
        : Math.sin(i / 100) * 25;
      const target = x - 55 + (kind === "pong" ? aim : -aim);
      game.hold(
        "ArrowRight",
        state.paddle < target - (kind === "pong" ? 3 : 2),
      );
      game.hold("ArrowLeft", state.paddle > target + (kind === "pong" ? 3 : 2));
      advance();
    }
    assert.equal(game.stats.won, true, JSON.stringify(game.stats));
    game.dispose();
  });
console.log(`${checks} game checks passed`);
