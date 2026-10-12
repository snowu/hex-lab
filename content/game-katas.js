/* Original game mechanics exercises. JavaScript runs locally in an isolated Worker. */
window.GAME_KATAS = [
  {
    id: "cooldown",
    title: "Cooldowns without frame counts",
    lesson: "gd-loop",
    prompt:
      "Return the remaining cooldown in seconds after dt. Clamp at zero. Reject negative dt with RangeError.",
    name: "cooldown",
    starter: "function cooldown(remaining, dt) {\n  return remaining;\n}",
    solution:
      'function cooldown(remaining, dt) { if (dt < 0) throw new RangeError("negative dt"); return Math.max(0, remaining - dt); }',
    hint: "Subtract elapsed seconds; the timer must never become negative.",
    tests: [
      { args: [2, 0.25], expected: 1.75 },
      { args: [0.1, 0.2], expected: 0 },
      { args: [0, 0], expected: 0 },
      { args: [1, -1], throws: "RangeError" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory stacking",
    lesson: "gd-data-saves",
    prompt:
      "Return {slots, leftover} after adding count items to slot quantities. Fill existing stacks first, then empty slots. Stack capacity is max. Do not mutate slots.",
    name: "stackItems",
    starter:
      "function stackItems(slots, count, max) {\n  return {slots, leftover: count};\n}",
    solution:
      "function stackItems(slots, count, max) { const out = [...slots]; for (const empty of [false, true]) for (let i=0; i<out.length; i++) { if ((out[i]===0)!==empty) continue; const add=Math.min(count,max-out[i]); out[i]+=add; count-=add; } return {slots:out,leftover:count}; }",
    hint: "Use two passes: partly full stacks, then empty slots. Work on a copy.",
    tests: [
      { args: [[3, 0, 4], 5, 5], expected: { slots: [5, 2, 5], leftover: 0 } },
      { args: [[5, 5], 3, 5], expected: { slots: [5, 5], leftover: 3 } },
      { args: [[0, 0], 11, 5], expected: { slots: [5, 5], leftover: 1 } },
      { args: [[2], 0, 5], expected: { slots: [2], leftover: 0 } },
    ],
  },
  {
    id: "waves",
    title: "Wave scheduling",
    lesson: "gd-core-loop",
    prompt:
      "Return spawn times for count enemies starting at start seconds, separated by interval. count=0 returns an empty array. Reject negative count or interval with RangeError.",
    name: "spawnTimes",
    starter: "function spawnTimes(count, start, interval) {\n  return [];\n}",
    solution:
      "function spawnTimes(count,start,interval) { if(count<0 || interval<0) throw new RangeError(); return Array.from({length:count},(_,i)=>start+i*interval); }",
    hint: "Each enemy has an index. Compute its timestamp directly from that index.",
    tests: [
      { args: [4, 2, 0.5], expected: [2, 2.5, 3, 3.5] },
      { args: [0, 1, 1], expected: [] },
      { args: [3, 5, 0], expected: [5, 5, 5] },
      { args: [-1, 0, 1], throws: "RangeError" },
      { args: [1, 0, -1], throws: "RangeError" },
    ],
  },
  {
    id: "animation",
    title: "Animation state transitions",
    lesson: "px-anim",
    prompt:
      "Return dead if health <= 0, then hurt if hit, then jump if not grounded, then run if abs(speed) > 0.1, otherwise idle. Priority matters.",
    name: "animationState",
    starter:
      'function animationState(health, hit, grounded, speed) {\n  return "idle";\n}',
    solution:
      'function animationState(health,hit,grounded,speed) { return health<=0?"dead":hit?"hurt":!grounded?"jump":Math.abs(speed)>0.1?"run":"idle"; }',
    hint: "Put irreversible or overriding states before movement states.",
    tests: [
      { args: [0, true, false, 10], expected: "dead" },
      { args: [10, true, false, 10], expected: "hurt" },
      { args: [10, false, false, 0], expected: "jump" },
      { args: [10, false, true, -2], expected: "run" },
      { args: [10, false, true, 0.1], expected: "idle" },
    ],
  },
  {
    id: "tile-collision",
    title: "Tile collision queries",
    lesson: "gd-collision",
    prompt:
      "Return [x,y] coordinates of solid # tiles overlapped by a rectangle {x,y,w,h}. Tiles are size units. Touching an edge is not overlap. Ignore coordinates outside the grid.",
    name: "solidTiles",
    starter: "function solidTiles(grid, rect, size) {\n  return [];\n}",
    solution:
      'function solidTiles(grid,r,size) { const out=[]; for(let y=0;y<grid.length;y++) for(let x=0;x<grid[y].length;x++) if(grid[y][x]==="#" && r.x<(x+1)*size && r.x+r.w>x*size && r.y<(y+1)*size && r.y+r.h>y*size) out.push([x,y]); return out; }',
    hint: "Compare the rectangle with each solid tile using strict overlap inequalities.",
    tests: [
      {
        args: [["##", ".#"], { x: 0, y: 0, w: 16, h: 16 }, 16],
        expected: [[0, 0]],
      },
      {
        args: [["##", ".#"], { x: 15, y: 15, w: 2, h: 2 }, 16],
        expected: [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
      },
      { args: [["#"], { x: -16, y: 0, w: 16, h: 16 }, 16], expected: [] },
      { args: [["."], { x: 0, y: 0, w: 16, h: 16 }, 16], expected: [] },
    ],
  },
  {
    id: "jump-buffer",
    title: "Consume a buffered jump",
    lesson: "phy-controllers",
    prompt:
      "Return true when the press is unconsumed, pressAge <= buffer and groundedAge <= coyote. Negative ages mean no recorded event and must return false.",
    name: "canJump",
    starter:
      "function canJump(pressAge, groundedAge, consumed, buffer, coyote) {\n  return false;\n}",
    solution:
      "function canJump(p,g,consumed,buffer,coyote) { return !consumed && p>=0 && g>=0 && p<=buffer && g<=coyote; }",
    hint: "A held button must not create a second press. Check all eligibility conditions.",
    tests: [
      { args: [0.05, 0.05, false, 0.1, 0.1], expected: true },
      { args: [0.1, 0.1, false, 0.1, 0.1], expected: true },
      { args: [0, 0, true, 0.1, 0.1], expected: false },
      { args: [0.2, 0, false, 0.1, 0.1], expected: false },
      { args: [-1, 0, false, 0.1, 0.1], expected: false },
    ],
  },
  {
    id: "movement",
    title: "Acceleration and braking",
    lesson: "gd-vectors",
    prompt:
      "Return the velocity after approaching target by at most acceleration * dt. Do not overshoot. Inputs use pixels and seconds.",
    name: "approachVelocity",
    starter:
      "function approachVelocity(current, target, acceleration, dt) {\n  return target;\n}",
    solution:
      "function approachVelocity(c,t,a,dt) { const change=a*dt; return c<t?Math.min(t,c+change):Math.max(t,c-change); }",
    hint: "Choose a direction, then clamp the proposed velocity against the target.",
    tests: [
      { args: [0, 100, 200, 0.1], expected: 20 },
      { args: [90, 100, 200, 0.1], expected: 100 },
      { args: [-100, 0, 200, 0.1], expected: -80 },
      { args: [10, -100, 200, 0.1], expected: -10 },
      { args: [5, 5, 200, 1], expected: 5 },
    ],
  },
  {
    id: "camera",
    title: "Frame-independent camera smoothing",
    lesson: "gd-camera",
    prompt:
      "Return current + (target-current) * (1-exp(-rate*dt)). This exponential smoothing should produce the same result when time is split into smaller steps.",
    name: "smoothCamera",
    starter:
      "function smoothCamera(current, target, rate, dt) {\n  return current;\n}",
    solution:
      "function smoothCamera(c,t,rate,dt) { return c+(t-c)*(1-Math.exp(-rate*dt)); }",
    hint: "Use an exponential decay factor instead of a constant per-frame percentage.",
    tests: [
      { args: [0, 100, 0, 1], expected: 0 },
      { args: [10, 10, 5, 1], expected: 10 },
      {
        args: [0, 100, 2, 0.5],
        expected: 63.212055882855765,
        tolerance: 0.000001,
      },
      { args: [0, 100, 2, 0], expected: 0 },
    ],
  },
];
