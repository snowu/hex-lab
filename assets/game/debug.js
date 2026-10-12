/* Reproducible repair exercises; code uses the same isolated worker as game katas. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  if (window.MODE !== "gamedev") return;
  const { $, esc, app, store } = H;
  const cases = {
    damage: {
      title: "Duplicate damage",
      prompt:
        "A projectile reports the same hit during several ticks. Each hit ID must reduce health only once. Reproduce the bug, then repair applyHits without mutating events.",
      name: "applyHits",
      lesson: "gd-collision",
      starter:
        "function applyHits(health, events) {\n  for (const event of events) health -= event.damage;\n  return Math.max(0, health);\n}",
      solution:
        "function applyHits(health,events) { const seen=new Set(); for(const e of events) if(!seen.has(e.id)){health-=e.damage;seen.add(e.id)} return Math.max(0,health); }",
      tests: [
        { args: [100, [{ id: 1, damage: 10 }]], expected: 90 },
        {
          args: [
            100,
            [
              { id: 1, damage: 10 },
              { id: 1, damage: 10 },
              { id: 1, damage: 10 },
            ],
          ],
          expected: 90,
        },
        {
          args: [
            100,
            [
              { id: 1, damage: 10 },
              { id: 2, damage: 20 },
            ],
          ],
          expected: 70,
        },
        { args: [5, [{ id: 1, damage: 10 }]], expected: 0 },
      ],
    },
    stuck: {
      title: "An enemy stuck behind a wall",
      prompt:
        "The enemy moves straight toward its goal and stops at a wall. Repair findPath to search four neighbours and return a shortest path including start and goal. # is blocked; return [] if unreachable.",
      name: "findPath",
      lesson: "ai-pathing",
      starter:
        'function findPath(grid, start, goal) {\n const path=[start], p=[...start];\n while(p[0]!==goal[0]) { p[0]+=Math.sign(goal[0]-p[0]); if(grid[p[1]][p[0]]==="#") return []; path.push([...p]); }\n return path;\n}',
      solution:
        'function findPath(grid,start,goal) { const q=[[start]],seen=new Set([start.join(",")]); while(q.length){const path=q.shift(),p=path[path.length-1];if(p[0]===goal[0]&&p[1]===goal[1])return path;for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const n=[p[0]+dx,p[1]+dy],key=n.join(",");if(n[0]>=0&&n[1]>=0&&n[1]<grid.length&&n[0]<grid[0].length&&grid[n[1]][n[0]]!=="#"&&!seen.has(key)){seen.add(key);q.push([...path,n])}}}return [];}',
      tests: [
        {
          args: [
            [".#.", "..."],
            [0, 0],
            [2, 0],
          ],
          expected: [
            [0, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [2, 0],
          ],
        },
        {
          args: [["..."], [0, 0], [2, 0]],
          expected: [
            [0, 0],
            [1, 0],
            [2, 0],
          ],
        },
        { args: [[".#."], [0, 0], [2, 0]], expected: [] },
      ],
    },
    saves: {
      title: "An old or corrupted save",
      prompt:
        "Version 1 used coins; version 2 uses gold. Repair loadSave to return {version:2,gold}. Accept only versions 1/2 and a nonnegative finite numeric amount. Reject invalid JSON or data with RangeError. Never silently discard progress.",
      name: "loadSave",
      lesson: "gd-data-saves",
      starter:
        "function loadSave(text) {\n const data=JSON.parse(text);\n return {version:2,gold:data.gold || 0};\n}",
      solution:
        'function loadSave(text) { let data; try { data=JSON.parse(text); } catch { throw new RangeError("invalid save"); } if(!data||![1,2].includes(data.version))throw new RangeError("unsupported version");const gold=data.version===1?data.coins:data.gold;if(typeof gold!=="number"||!Number.isFinite(gold)||gold<0)throw new RangeError("invalid amount");return {version:2,gold}; }',
      tests: [
        {
          args: ['{"version":1,"coins":42}'],
          expected: { version: 2, gold: 42 },
        },
        { args: ['{"version":2,"gold":0}'], expected: { version: 2, gold: 0 } },
        { args: ["broken"], throws: "RangeError" },
        { args: ['{"version":2,"gold":-5}'], throws: "RangeError" },
        { args: ['{"version":3,"gold":50}'], throws: "RangeError" },
      ],
    },
  };
  let worker, timer;
  H.routes.push([/^#\/debug\/(damage|stuck|saves)$/, view]);
  function view(id) {
    const task = cases[id];
    document.title = task.title + " · Debug playground";
    app.innerHTML = `<div class="crumbs"><a href="#/play/debug">Debug playground</a> / ${task.title}</div><div class="page-h"><h1>${task.title}</h1><p>${esc(task.prompt)}</p></div><div class="gl-layout"><section class="tc gl-stage"><canvas id="debugcanvas" width="640" height="240" aria-label="Bug reproduction"></canvas><output id="debugresult" role="status">Run the broken starter to reproduce the failure.</output><button class="btn" id="debugrepro">Reproduce broken version</button><a class="btn" href="#/lesson/${task.lesson}">Related lesson</a></section><aside class="tc gl-controls"><label class="lbl">Repair the function<textarea class="inp gl-code" id="debugcode" rows="14" spellcheck="false">${esc(store.get("gd:debug:" + id, task.starter))}</textarea></label><button class="btn primary" id="debugrun">Test repair</button><button class="btn" id="debugref">Show reference</button><pre id="debugsolution" hidden>${esc(task.solution)}</pre><label class="lbl">Diagnosis and next experiment<textarea class="inp" id="debugnote" rows="3"></textarea></label><details><summary>Reproduction cases</summary><pre>${esc(JSON.stringify(task.tests, null, 2))}</pre></details></aside></div>`;
    const canvas = $("#debugcanvas"),
      ctx = canvas.getContext("2d");
    function draw(results = []) {
      ctx.fillStyle = "#171123";
      ctx.fillRect(0, 0, 640, 240);
      ctx.font = "16px monospace";
      ctx.fillStyle = "#eee";
      if (id === "damage") {
        const r = results[1],
          value = r ? Number(r.actual) : 100;
        ctx.fillText(
          "Three reports · one projectile ID · expected health 90",
          15,
          35,
        );
        ctx.fillStyle = "#ff7777";
        ctx.fillRect(30, 80, Math.max(0, value) * 5, 35);
        ctx.fillStyle = "#eee";
        ctx.fillText(`Actual health: ${value}`, 30, 145);
      } else if (id === "stuck") {
        const path = results[0] && JSON.parse(results[0].actual || "[]");
        for (let y = 0; y < 2; y++)
          for (let x = 0; x < 3; x++) {
            ctx.fillStyle = y === 0 && x === 1 ? "#666" : "#342346";
            ctx.fillRect(40 + x * 65, 40 + y * 65, 60, 60);
          }
        if (Array.isArray(path)) {
          ctx.strokeStyle = "#7ee5bb";
          ctx.beginPath();
          path.forEach(([x, y], i) =>
            i
              ? ctx.lineTo(70 + x * 65, 70 + y * 65)
              : ctx.moveTo(70 + x * 65, 70 + y * 65),
          );
          ctx.stroke();
        }
        ctx.fillStyle = "#eee";
        ctx.fillText(
          path?.length
            ? "Enemy found a route around the wall"
            : "Enemy cannot find a route",
          280,
          100,
        );
      } else {
        ctx.fillText("Old save: version 1 · coins 42", 20, 50);
        ctx.fillStyle = "#ffbf55";
        ctx.fillText("Loaded: " + (results[0]?.actual || "(not run)"), 20, 100);
        ctx.fillStyle = "#eee";
        ctx.fillText("Malformed saves must be rejected explicitly.", 20, 155);
      }
    }
    function stop() {
      worker?.terminate();
      clearTimeout(timer);
    }
    function run(code, repair) {
      stop();
      $("#debugresult").textContent = "Running reproduction…";
      worker = new Worker("assets/game/kata-worker.js");
      timer = setTimeout(() => {
        stop();
        $("#debugresult").textContent =
          "Stopped after 2 seconds. Check for a loop.";
      }, 2000);
      worker.onmessage = ({ data }) => {
        stop();
        if (data.error) {
          $("#debugresult").textContent = data.error;
          return;
        }
        try {
          draw(data.results);
        } catch {
          /* non-path returns are reported by tests below */
        }
        const passed = data.results.every((r) => r.pass);
        $("#debugresult").innerHTML = data.results
          .map(
            (r) =>
              `<p class="${r.pass ? "good" : "bad"}">${r.pass ? "✓" : "✗"} Case ${r.index + 1}: ${esc(r.actual)} · expected ${esc(r.expected)}</p>`,
          )
          .join("");
        if (repair && passed) {
          GameNotebook.outcome("debug-" + id, "Fixed bug: " + task.title);
          GameNotebook.save({
            kind: "bug",
            title: task.title,
            bugs: task.prompt,
            decision: $("#debugnote").value,
            data: { code, results: data.results },
            image: canvas.toDataURL("image/png"),
          });
          $("#debugresult").insertAdjacentHTML(
            "beforeend",
            "<p>Repair verified and saved in notebook.</p>",
          );
        }
      };
      worker.onerror = () => {
        stop();
        $("#debugresult").textContent = "Worker could not run.";
      };
      worker.postMessage({ name: task.name, code, tests: task.tests });
    }
    $("#debugrepro").onclick = () => run(task.starter, false);
    $("#debugrun").onclick = () => {
      store.set("gd:debug:" + id, $("#debugcode").value);
      run($("#debugcode").value, true);
    };
    $("#debugref").onclick = () =>
      ($("#debugsolution").hidden = !$("#debugsolution").hidden);
    draw();
    H.setCleanup(stop);
  }
  window.GAME_DEBUG_CASES = cases;
});
