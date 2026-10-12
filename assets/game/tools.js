/* Small focused workbenches. Each owns its loop and releases it on navigation. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  if (window.MODE !== "gamedev") return;
  const { $, $$, esc, store, app } = H,
    C = GameLab;
  H.routes.push([
    /^#\/play\/(path|ai|shader|performance)$/,
    (kind) =>
      ({ path: pathLab, ai: aiLab, shader: shaderLab, performance: perfLab })[
        kind
      ](),
  ]);
  function layout(title, description, controls) {
    document.title = title + " · Hex Lab";
    app.innerHTML = `<div class="crumbs"><a href="#/play">Build &amp; play</a> / ${title}</div><div class="page-h"><h1>${title}</h1><p>${description}</p></div><div class="gl-layout"><section class="tc gl-stage"><canvas id="toolcanvas" width="640" height="384" aria-label="${title} visualization"></canvas><output id="toolstats" aria-live="polite"></output></section><aside class="tc gl-controls">${controls}<h2>Record your experiment</h2><label class="lbl">Prediction<textarea class="inp" id="tpredict" rows="2"></textarea></label><label class="lbl">Observation / next attempt<textarea class="inp" id="tobserve" rows="3"></textarea></label><button class="btn" id="tsave">Save to notebook</button><output id="tsaved"></output></aside></div>`;
    return $("#toolcanvas");
  }
  function save(title, data, canvas) {
    $("#tsave").onclick = () => {
      const result = GameNotebook.save({
        kind: "experiment",
        title,
        data: {
          route: location.hash,
          ...data(),
          prediction: $("#tpredict").value,
          observation: $("#tobserve").value,
        },
        image: canvas.toDataURL("image/png"),
      });
      $("#tsaved").textContent = result
        ? "Saved in notebook."
        : "Notebook full. Export or remove entries.";
    };
  }
  function pathLab() {
    const saved = store.get("gd:path", {});
    let grid = saved.grid || Array.from({ length: 12 }, () => ".".repeat(20)),
      start = saved.start || [1, 5],
      goal = saved.goal || [18, 5],
      brush = "#",
      count = 0,
      timer = null,
      result = null;
    const canvas = layout(
        "Pathfinding workbench",
        "Paint walls or expensive terrain. Move the start and goal. Watch the search frontier expand; BFS minimises steps, Dijkstra and A* account for terrain cost.",
        `<label class="lbl">Algorithm<select id="palgorithm"><option value="astar">A*</option><option value="dijkstra">Dijkstra</option><option value="bfs">BFS (unweighted)</option></select></label><label class="lbl">Brush<select id="pbrush"><option value="#">Wall</option><option value="~">Terrain (cost 5)</option><option value=".">Erase</option><option value="start">Start</option><option value="goal">Goal</option></select></label><div class="dbar"><button class="btn primary" id="prun">Run search</button><button class="btn" id="pstep">Step search</button><button class="btn" id="pclear">Clear map</button><button class="btn" id="pcompare">Compare all</button></div><div id="pcomparison"></div>`,
      ),
      ctx = canvas.getContext("2d");
    function persist() {
      store.set("gd:path", { grid, start, goal });
    }
    function draw() {
      ctx.clearRect(0, 0, 640, 384);
      const visited = new Set(
          (result?.visited || []).slice(0, count).map((p) => p.join(",")),
        ),
        path = new Set(
          count >= (result?.visited.length || Infinity)
            ? result.path.map((p) => p.join(","))
            : [],
        );
      grid.forEach((row, y) =>
        [...row].forEach((v, x) => {
          const k = [x, y].join(",");
          ctx.fillStyle =
            v === "#" ? "#595264" : v === "~" ? "#836027" : "#171123";
          if (visited.has(k)) ctx.fillStyle = "#614586";
          if (path.has(k)) ctx.fillStyle = "#cc9dff";
          if (k === start.join(",")) ctx.fillStyle = "#62debd";
          if (k === goal.join(",")) ctx.fillStyle = "#ffbf55";
          ctx.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
        }),
      );
      $("#toolstats").textContent = result
        ? `${count}/${result.visited.length} expanded · ${count >= result.visited.length ? (result.path.length ? `path ${result.path.length - 1} steps · cost ${result.cost}` : "No reachable path") : "searching…"}`
        : "Green = start · gold = goal · brown = terrain";
      canvas.dataset.expanded = count;
    }
    function prepare() {
      clearInterval(timer);
      result = C.search(grid, start, goal, $("#palgorithm").value);
      count = 0;
    }
    function step() {
      if (!result) prepare();
      count = Math.min(count + 1, result.visited.length);
      draw();
      if (count === result.visited.length) clearInterval(timer);
    }
    function paint(e) {
      const rect = canvas.getBoundingClientRect(),
        x = Math.floor(((e.clientX - rect.left) / rect.width) * 20),
        y = Math.floor(((e.clientY - rect.top) / rect.height) * 12);
      if (x < 0 || x >= 20 || y < 0 || y >= 12) return;
      clearInterval(timer);
      result = null;
      count = 0;
      if (brush === "start") start = [x, y];
      else if (brush === "goal") goal = [x, y];
      else if (
        [x, y].join(",") !== start.join(",") &&
        [x, y].join(",") !== goal.join(",")
      ) {
        const row = [...grid[y]];
        row[x] = brush;
        grid[y] = row.join("");
      }
      if (brush === "start" || brush === "goal") {
        const row = [...grid[y]];
        row[x] = ".";
        grid[y] = row.join("");
      }
      persist();
      draw();
    }
    canvas.onpointerdown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      paint(e);
    };
    canvas.onpointermove = (e) => {
      if (e.buttons) paint(e);
    };
    $("#pbrush").onchange = () => (brush = $("#pbrush").value);
    $("#prun").onclick = () => {
      prepare();
      timer = setInterval(step, 25);
    };
    $("#pstep").onclick = () => {
      clearInterval(timer);
      step();
    };
    $("#palgorithm").onchange = () => {
      prepare();
      draw();
    };
    $("#pclear").onclick = () => {
      grid = Array.from({ length: 12 }, () => ".".repeat(20));
      result = null;
      count = 0;
      clearInterval(timer);
      persist();
      draw();
    };
    $("#pcompare").onclick = () => {
      $("#pcomparison").innerHTML =
        `<table><tr><th>Search</th><th>Expanded</th><th>Steps</th><th>Terrain cost</th></tr>${[
          "bfs",
          "dijkstra",
          "astar",
        ]
          .map((a) => {
            const r = C.search(grid, start, goal, a),
              cost = r.path
                .slice(1)
                .reduce((n, p) => n + (grid[p[1]][p[0]] === "~" ? 5 : 1), 0);
            return `<tr><td>${a}</td><td>${r.visited.length}</td><td>${r.path.length ? r.path.length - 1 : "—"}</td><td>${r.path.length ? cost : "unreachable"}</td></tr>`;
          })
          .join("")}</table>`;
    };
    save(
      "Pathfinding experiment",
      () => ({ grid, start, goal, algorithm: $("#palgorithm").value, result }),
      canvas,
    );
    draw();
    H.setCleanup(() => clearInterval(timer));
  }
  function aiLab() {
    const defaults = {
        mode: "fsm",
        rules: { detect: 150, attack: 35, flee: 20 },
        tree: [
          { when: "lowHealth", action: "flee" },
          { when: "near", action: "attack" },
          { when: "visible", action: "chase" },
          { when: "always", action: "patrol" },
        ],
      },
      saved = store.get("gd:ai", defaults),
      snapshot = store.get("gd:aiState", {});
    let config = saved,
      enemy = snapshot.enemy || { x: 100, y: 200 },
      player = snapshot.player || { x: 500, y: 200 },
      health = snapshot.health ?? 100,
      active = "patrol",
      paused = false,
      tick = 0,
      timer;
    const canvas = layout(
        "AI workbench",
        "Drag the gold target. Change the enemy’s health and decision rules. The active state or selected tree branch is visible on every tick.",
        `<label class="lbl">Architecture<select id="aimode"><option value="fsm">State machine</option><option value="tree">Priority behaviour tree</option></select></label><label class="lbl">Enemy health<input id="aihealth" type="range" min="0" max="100" value="100"></label><label class="lbl">Decision definition (JSON)<textarea class="inp gl-code" id="aidefinition" rows="12">${esc(JSON.stringify(saved, null, 2))}</textarea></label><button class="btn primary" id="aiapply">Apply definition</button><button class="btn" id="aipause">Pause</button><button class="btn" id="aistep">Step</button><button class="btn" id="aireset">Reset enemy</button><output id="aierror"></output><div id="aitrace"></div>`,
      ),
      ctx = canvas.getContext("2d");
    $("#aimode").value = saved.mode;
    $("#aihealth").value = health;
    function evaluate() {
      const d = Math.hypot(player.x - enemy.x, player.y - enemy.y),
        predicates = {
          lowHealth: health <= config.rules.flee,
          near: d <= config.rules.attack,
          visible: d <= config.rules.detect,
          always: true,
        };
      if ($("#aimode").value === "tree") {
        const selected = config.tree.find((n) => predicates[n.when]);
        active = selected?.action || "idle";
        $("#aitrace").innerHTML = config.tree
          .map(
            (n) =>
              `<p class="${n === selected ? "good" : "muted"}">${n === selected ? "▶" : "·"} ${esc(n.when)} → ${esc(n.action)} (${predicates[n.when] ? "true" : "false"})</p>`,
          )
          .join("");
      } else {
        active = predicates.lowHealth
          ? "flee"
          : predicates.near
            ? "attack"
            : predicates.visible
              ? "chase"
              : "patrol";
        $("#aitrace").textContent =
          `State: ${active}. Priority: low health → attack range → detection range → patrol.`;
      }
      return d;
    }
    function draw() {
      ctx.fillStyle = "#171123";
      ctx.fillRect(0, 0, 640, 384);
      ctx.strokeStyle = "#8065aa";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, config.rules.detect, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffc65a";
      ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
      ctx.fillStyle = active === "flee" ? "#ff7777" : "#bc93ff";
      ctx.fillRect(enemy.x - 12, enemy.y - 12, 24, 24);
      const d = evaluate();
      $("#toolstats").textContent =
        `Tick ${tick} · active ${active} · health ${health} · distance ${d.toFixed(1)}`;
      canvas.dataset.action = active;
    }
    function step() {
      tick++;
      const d = evaluate(),
        dx = (player.x - enemy.x) / (d || 1),
        dy = (player.y - enemy.y) / (d || 1);
      if (active === "chase" || active === "flee") {
        const sign = active === "flee" ? -1 : 1;
        enemy.x = Math.max(12, Math.min(628, enemy.x + sign * dx * 2));
        enemy.y = Math.max(12, Math.min(372, enemy.y + sign * dy * 2));
      } else if (active === "patrol")
        enemy.x = Math.max(12, Math.min(628, enemy.x + Math.sin(tick / 60)));
      draw();
    }
    function drag(e) {
      const rect = canvas.getBoundingClientRect();
      player = {
        x: ((e.clientX - rect.left) / rect.width) * 640,
        y: ((e.clientY - rect.top) / rect.height) * 384,
      };
      draw();
    }
    canvas.onpointerdown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      drag(e);
    };
    canvas.onpointermove = (e) => {
      if (e.buttons) drag(e);
    };
    $("#aihealth").oninput = () => {
      health = Number($("#aihealth").value);
      draw();
    };
    $("#aimode").onchange = draw;
    $("#aipause").onclick = () => {
      paused = !paused;
      $("#aipause").textContent = paused ? "Resume" : "Pause";
    };
    $("#aistep").onclick = () => {
      paused = true;
      step();
    };
    $("#aireset").onclick = () => {
      enemy = { x: 100, y: 200 };
      tick = 0;
      draw();
    };
    $("#aiapply").onclick = () => {
      try {
        const v = JSON.parse($("#aidefinition").value);
        if (
          !v.rules ||
          !["detect", "attack", "flee"].every(
            (k) =>
              Number.isFinite(v.rules[k]) &&
              v.rules[k] >= 0 &&
              v.rules[k] <= 640,
          ) ||
          v.rules.attack > v.rules.detect ||
          !Array.isArray(v.tree) ||
          !v.tree.length ||
          v.tree.length > 20 ||
          v.tree.some(
            (n) =>
              !["lowHealth", "near", "visible", "always"].includes(n.when) ||
              !["flee", "attack", "chase", "patrol", "idle"].includes(n.action),
          )
        )
          throw Error(
            "Use nonnegative thresholds (attack ≤ detect) and supported condition/action names.",
          );
        config = v;
        config.mode = $("#aimode").value;
        store.set("gd:ai", config);
        $("#aierror").textContent = "Definition applied";
        draw();
      } catch (e) {
        $("#aierror").textContent = e.message;
      }
    };
    save(
      "AI experiment",
      () => ({ config, player, enemy, health, active }),
      canvas,
    );
    draw();
    timer = setInterval(() => {
      if (!paused) step();
    }, 1000 / 60);
    H.setCleanup(() => {
      clearInterval(timer);
      store.set("gd:aiState", { player, enemy, health });
    });
  }
  function shaderLab() {
    const examples = {
      flash:
        "precision mediump float;\nuniform vec2 u_resolution;\nuniform float u_time;\nuniform float u_amount;\nvoid main() {\n vec2 uv = gl_FragCoord.xy / u_resolution;\n float shape = step(length(uv - vec2(0.5)), 0.3);\n vec3 base = vec3(0.55, 0.3, 0.9);\n gl_FragColor = vec4(mix(base, vec3(1.0), u_amount) * shape, 1.0);\n}",
      dissolve:
        "precision mediump float;\nuniform vec2 u_resolution;\nuniform float u_time;\nuniform float u_amount;\nvoid main() {\n vec2 uv = floor(gl_FragCoord.xy / 8.0);\n float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);\n float visible = step(u_amount, noise);\n gl_FragColor = vec4(vec3(0.8, 0.4, 1.0) * visible, 1.0);\n}",
      wave: "precision mediump float;\nuniform vec2 u_resolution;\nuniform float u_time;\nuniform float u_amount;\nvoid main() {\n vec2 uv = gl_FragCoord.xy / u_resolution;\n float wave = sin(uv.x * 20.0 + u_time * 2.0) * u_amount * 0.2;\n float stripe = step(abs(uv.y - 0.5 - wave), 0.03);\n gl_FragColor = vec4(vec3(0.3, 0.9, 0.8) * stripe, 1.0);\n}",
    };
    const canvas = layout(
        "Shader playground",
        "Edit a fragment shader. u_resolution, u_time and u_amount are supplied by the lab. Compile errors preserve the last working effect.",
        `<label class="lbl">Example<select id="sexample"><option value="flash">Hit flash</option><option value="dissolve">Dissolve</option><option value="wave">Animated wave</option></select></label><label class="lbl">Amount<input id="samount" type="range" min="0" max="1" step="0.01" value="0.3"></label><label class="lbl">Fragment shader<textarea class="inp gl-code" id="scode" rows="18" spellcheck="false">${esc(store.get("gd:shader", examples.flash))}</textarea></label><button class="btn primary" id="scompile">Compile</button><button class="btn" id="spause">Pause time</button><pre id="serror" role="status"></pre>`,
      ),
      gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    $("#samount").value = store.get("gd:shaderAmount", 0.3);
    $("#samount").oninput = () =>
      store.set("gd:shaderAmount", Number($("#samount").value));
    if (!gl) {
      $("#serror").textContent =
        "WebGL is unavailable on this device. You can still edit and save shader source.";
      save("Shader source", () => ({ source: $("#scode").value }), canvas);
      return;
    }
    let program = null,
      raf,
      stopped = false,
      paused = false,
      time = 0,
      last = 0;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw Error(error);
      }
      return shader;
    }
    function apply() {
      let vert, frag, next;
      try {
        vert = compile(
          gl.VERTEX_SHADER,
          "attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.0,1.0);}",
        );
        frag = compile(gl.FRAGMENT_SHADER, $("#scode").value);
        next = gl.createProgram();
        gl.attachShader(next, vert);
        gl.attachShader(next, frag);
        gl.linkProgram(next);
        if (!gl.getProgramParameter(next, gl.LINK_STATUS))
          throw Error(gl.getProgramInfoLog(next));
        if (program) gl.deleteProgram(program);
        program = next;
        next = null;
        store.set("gd:shader", $("#scode").value);
        $("#serror").textContent = "Compiled successfully";
      } catch (e) {
        $("#serror").textContent = e.message;
      } finally {
        if (vert) gl.deleteShader(vert);
        if (frag) gl.deleteShader(frag);
        if (next) gl.deleteProgram(next);
      }
    }
    function draw(now) {
      if (stopped) return;
      if (!paused && last) time += Math.min(0.1, (now - last) / 1000);
      last = now;
      if (program && !gl.isContextLost()) {
        gl.useProgram(program);
        gl.viewport(0, 0, 640, 384);
        const attr = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), 640, 384);
        gl.uniform1f(gl.getUniformLocation(program, "u_time"), time);
        gl.uniform1f(
          gl.getUniformLocation(program, "u_amount"),
          Number($("#samount").value),
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        $("#toolstats").textContent =
          `time ${time.toFixed(2)}s · amount ${$("#samount").value}`;
      }
      raf = requestAnimationFrame(draw);
    }
    $("#scompile").onclick = apply;
    $("#sexample").onchange = () => {
      $("#scode").value = examples[$("#sexample").value];
      apply();
    };
    $("#spause").onclick = () => {
      paused = !paused;
      $("#spause").textContent = paused ? "Resume time" : "Pause time";
    };
    save(
      "Shader experiment",
      () => ({
        source: $("#scode").value,
        amount: Number($("#samount").value),
      }),
      canvas,
    );
    apply();
    raf = requestAnimationFrame(draw);
    H.setCleanup(() => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (program) gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    });
  }
  function perfLab() {
    const saved = store.get("gd:performance", {});
    let bodies = [],
      seed = 1234,
      frames = [],
      paused = false,
      stopped = false,
      raf,
      result = null;
    const canvas = layout(
        "Performance playground",
        "Increase object count and compare all-pairs collision with a spatial grid. Timings are measured on this device; crowded scenes expose the grid’s worst case.",
        `<label class="lbl">Objects<input id="fcount" type="range" min="50" max="1000" step="50" value="300"></label><label class="lbl">Strategy<select id="fstrategy"><option value="grid">Spatial grid</option><option value="naive">All pairs</option></select></label><label><input type="checkbox" id="fcluster">Cluster objects in one area</label><label class="lbl">Cell size<input id="fcell" type="range" min="16" max="128" step="16" value="48"></label><button class="btn" id="fpause">Pause</button><button class="btn" id="fbenchmark">Benchmark same snapshot</button><div id="fresults"></div><canvas id="fgraph" width="300" height="80" aria-label="Collision timing history"></canvas>`,
      ),
      ctx = canvas.getContext("2d"),
      graph = $("#fgraph").getContext("2d");
    $("#fcount").value = saved.count || 300;
    $("#fstrategy").value = saved.strategy || "grid";
    $("#fcell").value = saved.cell || 48;
    $("#fcluster").checked = !!saved.clustered;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    function reset() {
      seed = 1234;
      bodies = Array.from({ length: Number($("#fcount").value) }, () => ({
        x: random() * ($("#fcluster").checked ? 60 : 630),
        y: random() * ($("#fcluster").checked ? 60 : 374),
        w: 6,
        h: 6,
        vx: random() * 2 - 1,
        vy: random() * 2 - 1,
      }));
      frames = [];
    }
    function measure(useGrid) {
      const t = performance.now(),
        r = C.pairs(bodies, useGrid, Number($("#fcell").value));
      return { ...r, ms: performance.now() - t };
    }
    function draw() {
      if (stopped) return;
      if (!paused) {
        const w = $("#fcluster").checked ? 60 : 630,
          h = $("#fcluster").checked ? 60 : 374;
        bodies.forEach((b) => {
          b.x = Math.max(0, Math.min(w, b.x + b.vx));
          b.y = Math.max(0, Math.min(h, b.y + b.vy));
          if (b.x === 0 || b.x === w) b.vx *= -1;
          if (b.y === 0 || b.y === h) b.vy *= -1;
        });
        result = measure($("#fstrategy").value === "grid");
        frames.push(result.ms);
        if (frames.length > 180) frames.shift();
      }
      ctx.fillStyle = "#171123";
      ctx.fillRect(0, 0, 640, 384);
      ctx.fillStyle = "#bc93ff";
      bodies.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));
      const sorted = [...frames].sort((a, b) => a - b),
        p95 =
          sorted[
            Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
          ] || 0;
      $("#toolstats").textContent = result
        ? `${bodies.length} objects · ${result.candidates} candidate pairs · ${result.hits.length} overlaps · collision ${result.ms.toFixed(2)} ms · p95 ${p95.toFixed(2)} ms · 60fps budget 16.67 ms`
        : "Preparing…";
      canvas.dataset.candidates = result?.candidates || 0;
      graph.fillStyle = "#171123";
      graph.fillRect(0, 0, 300, 80);
      graph.strokeStyle = "#ffbf55";
      graph.beginPath();
      frames.forEach((ms, i) => {
        const x = (i / 180) * 300,
          y = 78 - Math.min(70, ms * 4);
        i ? graph.lineTo(x, y) : graph.moveTo(x, y);
      });
      graph.stroke();
      raf = requestAnimationFrame(draw);
    }
    $("#fcount").oninput = reset;
    $("#fcluster").onchange = reset;
    $("#fpause").onclick = () => {
      paused = !paused;
      $("#fpause").textContent = paused ? "Resume" : "Pause";
    };
    $("#fbenchmark").onclick = () => {
      const a = measure(false),
        b = measure(true);
      $("#fresults").innerHTML =
        `<table><tr><th>Strategy</th><th>Candidates</th><th>Overlaps</th><th>ms</th></tr>${[
          ["All pairs", a],
          ["Grid", b],
        ]
          .map(
            ([n, r]) =>
              `<tr><td>${n}</td><td>${r.candidates}</td><td>${r.hits.length}</td><td>${r.ms.toFixed(2)}</td></tr>`,
          )
          .join(
            "",
          )}</table><p>Same snapshot; ${a.hits.length === b.hits.length ? "both strategies found the same overlaps." : "Mismatch: investigate broad-phase correctness."} Repeat to account for warm-up and timing noise.</p>`;
    };
    save(
      "Performance experiment",
      () => ({
        count: bodies.length,
        strategy: $("#fstrategy").value,
        cell: Number($("#fcell").value),
        clustered: $("#fcluster").checked,
        last: result && {
          candidates: result.candidates,
          overlaps: result.hits.length,
          ms: result.ms,
        },
        samples: frames,
      }),
      canvas,
    );
    reset();
    raf = requestAnimationFrame(draw);
    H.setCleanup(() => {
      stopped = true;
      cancelAnimationFrame(raf);
    });
  }
});
