/* Playable platformer mechanics, replay, sprite import and tile editing. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  if (window.MODE !== "gamedev") return;
  const C = window.GameLab,
    { $, $$, esc, store, app } = H;
  const presets = () => store.get("gd:presets", {});
  const record = (kind, title, data, canvas) =>
    window.GameNotebook.save({
      kind,
      title,
      data,
      image: canvas ? canvas.toDataURL("image/png") : "",
    });
  H.routes.push(
    [/^#\/play$/, () => hub()],
    [/^#\/play\/(mechanics|debug|level|art)$/, (kind) => playground(kind)],
  );
  function hub() {
    document.title = "Build & play · Game Dev Lab";
    const tools = [
      [
        "mechanics",
        "Mechanics lab",
        "Tune a playable controller. Pause, step, replay and compare two configurations.",
      ],
      [
        "debug",
        "Debug playground",
        "Reproduce broken movement and collisions, inspect the evidence, then repair the game.",
      ],
      [
        "level",
        "Level sandbox",
        "Paint tiles, spawn and goals. Play immediately and record attempts and failures.",
      ],
      [
        "art",
        "Art to game",
        "Import a sprite sheet, set pivots and frames, then play with your own art.",
      ],
      [
        "path",
        "Pathfinding",
        "Draw a weighted map and compare BFS, Dijkstra and A*.",
      ],
      [
        "ai",
        "AI workbench",
        "Edit state rules or a behaviour tree and inspect active decisions.",
      ],
      [
        "shader",
        "Shader playground",
        "Edit GLSL effects with live uniforms and compiler feedback.",
      ],
      [
        "performance",
        "Performance playground",
        "Compare collision strategies and inspect actual frame costs.",
      ],
    ];
    app.innerHTML = `<div class="page-h"><h1>Build &amp; play</h1><p>Predict what will happen, change one thing, play it, and save what you learned.</p></div><div class="dgrid">${tools.map(([id, title, text]) => `<a class="dcard tc" href="#/play/${id}"><h2>${title}</h2><p>${text}</p></a>`).join("")}<a class="dcard tc" href="#/projects"><h2>Build-along games</h2><p>Pong → Breakout → platformer room → wave arena. Play checkpoints and export your game.</p></a><a class="dcard tc" href="#/game-katas"><h2>Game katas</h2><p>Write small mechanics and run real tests in an isolated worker.</p></a><a class="dcard tc" href="#/notebook"><h2>Project notebook</h2><p>Experiments, screenshots, bugs, decisions and your next attempt.</p></a></div>`;
  }
  function playground(kind) {
    document.title = `${kind} lab · Game Dev Lab`;
    const saved = store.get("gd:play:" + kind, {}),
      config = { ...C.DEFAULTS, ...saved.config },
      level = saved.level || C.DEFAULT_LEVEL;
    let s = C.create(config, level),
      b = C.create(
        { ...config, ...(saved.compare || {}), jump: 600, friction: 500 },
        level,
      ),
      paused = false,
      stopped = false,
      accumulator = 0,
      last = 0,
      raf,
      speed = 1,
      playback = null,
      frame = 0,
      inputs = saved.inputs || [],
      recording = !saved.inputs?.length,
      editing = kind === "level",
      brush = "#",
      sprite = null,
      art = saved.art || null,
      compare = false;
    const held = { left: false, right: false, jump: false },
      costs = [],
      failures = [],
      diagnostics = new Set();
    const names = {
      mechanics: "Mechanics lab",
      debug: "Debug playground",
      level: "Level sandbox",
      art: "Art to game",
    };
    app.innerHTML = `<div class="crumbs"><a href="#/play">Build &amp; play</a> / ${names[kind]}</div><div class="page-h"><h1>${names[kind]}</h1><p>Reach the gold flag. Arrow keys or A/D move, Space jumps. Click the canvas first. On a phone, use the buttons below.</p></div>
      <div class="gl-layout"><section class="tc gl-stage"><canvas id="gamecanvas" width="640" height="384" tabindex="0" aria-label="Playable platformer"></canvas><div class="gl-touch" aria-label="Game controls"><button data-hold="left" aria-label="Move left">◀</button><button data-hold="right" aria-label="Move right">▶</button><button data-hold="jump">Jump</button></div>
      <div class="dbar"><button class="btn" id="gpause">Pause</button><button class="btn" id="gstep">Single step</button><button class="btn" id="grestart">Restart</button><label>Speed <select id="gspeed"><option value="1">1×</option><option value="0.25">¼×</option><option value="0.1">⅒×</option></select></label><label>Render cap <select id="gfps"><option>15</option><option>30</option><option selected>60</option><option>144</option></select> fps</label><label><input type="checkbox" id="ginterpolate" checked> Interpolate drawing</label><label><input type="checkbox" id="goverlay" checked> Collision overlay</label></div><output id="gstats" aria-live="off"></output><canvas id="ggraph" width="768" height="70" aria-label="Recent vertical velocity graph"></canvas>
      <div class="dbar"><button class="btn" id="grecord">Start new recording</button><button class="btn" id="greplay">Replay inputs</button><button class="btn" id="gcompare">Compare A / B</button></div><p id="greport" class="muted">Recording tick inputs. Replays use the same starting level and settings.</p></section>
      <aside class="tc gl-controls"><h2>Controller</h2>${[
        ["acceleration", 100, 4000, 100],
        ["friction", 0, 3000, 50],
        ["speed", 50, kind === "debug" ? 10000 : 700, 10],
        ["jump", 100, 900, 10],
        ["gravity", 200, kind === "debug" ? 10000 : 2500, 50],
        ["coyote", 0, 0.3, 0.01],
        ["buffer", 0, 0.3, 0.01],
        ["camera", 0, 20, 1],
      ]
        .map(
          ([key, min, max, step]) =>
            `<label class="lbl">${key} <output data-value="${key}">${s.config[key]}</output><input data-param="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${s.config[key]}"></label>`,
        )
        .join("")}
      <label class="lbl">Preset name<input class="inp" id="gpresetname" maxlength="60" placeholder="Floaty / snappy / experiment 1"></label><div class="dbar"><button class="btn" id="gsavepreset">Save A</button><button class="btn" id="gsetb">Use A as B</button></div><label class="lbl">Load saved preset<select id="gpreset"><option value="">Choose…</option>${Object.keys(
        presets(),
      )
        .map((n) => `<option>${esc(n)}</option>`)
        .join("")}</select></label>
      ${kind === "debug" ? `<h2>Code repair cases</h2><p><a href="#/debug/damage">Duplicate damage</a> · <a href="#/debug/stuck">Stuck enemy</a> · <a href="#/debug/saves">Corrupted saves</a></p><h2>Reproduce a controller bug</h2><select id="gbug"><option value="">Healthy controller</option><option value="double">Jump consumed more than once</option><option value="tunnel">Fast movement misses a wall</option><option value="platform">Moving platform leaves rider behind</option><option value="jitter">Simulation tied to render frames</option></select><p id="gclue">Choose a bug, write a prediction, and inspect the overlay and replay.</p><button class="btn" id="gfix">Apply repair</button><output id="gfixreport"></output>` : ""}
      ${kind === "level" ? `<h2>Paint a level</h2><select id="gbrush"><option value="#">Solid tile</option><option value=".">Erase</option><option value="S">Player spawn</option><option value="G">Goal</option><option value="E">Patrolling enemy</option><option value="P">Pickup</option></select><button class="btn" id="gedit">Play this level</button><button class="btn" id="glevelreset">Reset map</button><p class="muted">Spawn and goal are unique. Paint while editing, then play. Red markers show recent falls.</p>` : ""}
      <details ${kind === "art" ? "open" : ""}><summary>Your sprite and animation</summary><label class="lbl">PNG sprite or sheet<input id="gsprite" type="file" accept="image/png"></label><p id="gartstatus" class="muted">Default silhouette. Import a PNG exported from Pixel Forge.</p>${[
        ["width", "Frame width", 16],
        ["height", "Frame height", 16],
        ["frames", "Frames", 1],
        ["fps", "Animation fps", 8],
        ["pivotX", "Pivot X", 8],
        ["pivotY", "Pivot Y", 16],
      ]
        .map(
          ([id, label, value]) =>
            `<label class="lbl">${label}<input class="inp" data-art="${id}" type="number" min="${id.startsWith("pivot") ? -2048 : 1}" max="2048" value="${art?.[id] ?? value}"></label>`,
        )
        .join(
          "",
        )}<label><input type="checkbox" id="gartanimate" checked> Animate</label><p><a href="#/forge">Open Pixel Forge</a></p></details>
      <h2>Experiment note</h2><label class="lbl">Prediction<textarea class="inp" id="gpredict" rows="2" placeholder="If I increase friction…"></textarea></label><label class="lbl">Observation<textarea class="inp" id="gobserve" rows="2" placeholder="What happened, and what will I try next?"></textarea></label><button class="btn primary" id="gnotebook">Save experiment &amp; screenshot</button><output id="gnoteout"></output></aside></div>`;
    const canvas = $("#gamecanvas"),
      ctx = canvas.getContext("2d"),
      graph = $("#ggraph").getContext("2d");
    let origin = saved.origin || {
      config: { ...s.config },
      level: [...s.level],
    };
    function persist() {
      store.set("gd:play:" + kind, {
        config: s.config,
        compare: b.config,
        level: s.level,
        art,
      });
    }
    function restart() {
      origin = { config: { ...s.config }, level: [...s.level] };
      s = C.create(origin.config, origin.level);
      b = C.create(b.config, origin.level);
      inputs = [];
      frame = 0;
      playback = null;
      accumulator = 0;
      recording = true;
    }
    function tick(dt = C.DT) {
      const input = playback ? playback[frame] : { ...held };
      if (playback && !input) {
        paused = true;
        $("#gpause").textContent = "Resume";
        $("#greport").textContent =
          `Replay finished: ${frame} ticks, ${s.jumps} jumps, ${s.deaths} falls.`;
        return;
      }
      const oldDeaths = s.deaths,
        oldPos = { x: s.p.x, y: s.p.y };
      C.step(s, input, dt);
      if (compare) C.step(b, input, dt);
      if (recording && !playback && inputs.length < 18000)
        inputs.push({ ...input });
      frame++;
      costs.push(s.p.vy);
      if (costs.length > 180) costs.shift();
      if (s.deaths > oldDeaths) {
        failures.push(oldPos);
        if (failures.length > 30) failures.shift();
      }
      if (s.won && !diagnostics.has("won")) {
        diagnostics.add("won");
        H.logAct("build");
        window.GameNotebook.outcome(
          "built-controller",
          "Reached a platformer goal",
        );
      }
      if (s.config.bug === "double" && s.jumps > 1 && held.jump)
        diagnostics.add("Repeated jump while button held");
    }
    function draw() {
      ctx.fillStyle = "#100d1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      if (editing) ctx.scale(canvas.width / (s.level[0].length * C.TILE), 1);
      const cam = editing
        ? 0
        : Math.min(
            Math.max(0, s.camera),
            Math.max(0, s.level[0].length * C.TILE - canvas.width),
          );
      ctx.translate(-cam, 0);
      s.level.forEach((row, y) =>
        [...row].forEach((tile, x) => {
          if (tile === "#") {
            ctx.fillStyle = "#564178";
            ctx.fillRect(x * 32, y * 32, 32, 32);
            ctx.strokeStyle = "#8065aa";
            ctx.strokeRect(x * 32, y * 32, 32, 32);
          }
          if (tile === "G") {
            ctx.fillStyle = "#ffc65a";
            ctx.fillRect(x * 32 + 10, y * 32, 4, 32);
            ctx.fillRect(x * 32 + 14, y * 32, 16, 12);
          }
          if (editing && tile === "S") {
            ctx.fillStyle = "#79e4ac";
            ctx.fillRect(x * 32 + 8, y * 32, 16, 28);
          }
        }),
      );
      ctx.fillStyle = "#ff7777";
      s.enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.w, e.h));
      ctx.fillStyle = "#ffbf55";
      s.pickups
        .filter((p) => !p.taken)
        .forEach((p) => ctx.fillRect(p.x, p.y, p.w, p.h));
      ctx.fillStyle = "#718ee0";
      ctx.fillRect(s.platform.x, s.platform.y, s.platform.w, s.platform.h);
      const alpha = paused ? 1 : Math.min(1, accumulator / C.DT);
      const p =
        $("#ginterpolate").checked && s.config.bug !== "jitter"
          ? {
              ...s.p,
              x: s.previous.x + (s.p.x - s.previous.x) * alpha,
              y: s.previous.y + (s.p.y - s.previous.y) * alpha,
            }
          : s.p;
      if (sprite && art) {
        const index = $("#gartanimate").checked
            ? Math.floor((s.tick / 60) * art.fps) % art.frames
            : 0,
          cols = Math.floor(sprite.width / art.width),
          sx = (index % cols) * art.width,
          sy = Math.floor(index / cols) * art.height;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          sprite,
          sx,
          sy,
          art.width,
          art.height,
          p.x + p.w / 2 - art.pivotX * 2,
          p.y + p.h - art.pivotY * 2,
          art.width * 2,
          art.height * 2,
        );
      } else {
        ctx.fillStyle = "#c69bff";
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
      if (compare) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#70e3cf";
        ctx.fillRect(b.p.x, b.p.y, b.p.w, b.p.h);
        ctx.globalAlpha = 1;
      }
      if ($("#goverlay").checked) {
        ctx.strokeStyle = "#f3e5ff";
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        s.contacts.forEach((v) => {
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(v.x + v.nx * 24, v.y + v.ny * 24);
          ctx.stroke();
        });
      }
      failures.forEach((v) => {
        ctx.fillStyle = "#ff6666";
        ctx.fillRect(v.x, Math.min(378, v.y), 5, 5);
      });
      if (editing) {
        ctx.strokeStyle = "#ffffff20";
        for (let x = 0; x <= 768; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 384);
          ctx.stroke();
        }
      }
      ctx.restore();
      if (s.won) {
        ctx.fillStyle = "#ffc65a";
        ctx.font = "20px monospace";
        ctx.fillText(
          "Goal reached! Try a new route or tune your controller.",
          20,
          35,
        );
      }
      $("#gstats").textContent =
        `${editing ? "Editing · " : ""}Tick ${s.tick} · x ${p.x.toFixed(1)} · y ${p.y.toFixed(1)} · vy ${p.vy.toFixed(1)} · ${p.grounded ? "grounded" : "airborne"} · jumps ${s.jumps} · falls ${s.deaths} · pickups ${s.coins}${compare ? ` · B x ${b.p.x.toFixed(1)} / y ${b.p.y.toFixed(1)}` : ""}`;
      canvas.dataset.tick = s.tick;
      canvas.dataset.x = p.x;
      canvas.dataset.jumps = s.jumps;
      canvas.dataset.bug = s.config.bug;
      graph.fillStyle = "#171123";
      graph.fillRect(0, 0, 768, 70);
      graph.strokeStyle = "#c69bff";
      graph.beginPath();
      costs.forEach((v, i) => {
        const x = (i / 180) * 768,
          y = 35 + Math.max(-33, Math.min(33, v / 25));
        i ? graph.lineTo(x, y) : graph.moveTo(x, y);
      });
      graph.stroke();
      graph.fillStyle = "#ddd";
      graph.font = "11px monospace";
      graph.fillText("vertical velocity · tick history", 8, 12);
    }
    let renderElapsed = 0;
    function animate(now) {
      if (stopped) return;
      const elapsed = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      renderElapsed += elapsed;
      const render = renderElapsed >= 1 / Number($("#gfps").value);
      if (!paused && !editing) {
        if (s.config.bug === "jitter") {
          if (render) tick(renderElapsed * speed);
        } else {
          accumulator += elapsed * speed;
          while (accumulator >= C.DT) {
            tick();
            accumulator -= C.DT;
            if (paused) break;
          }
        }
      }
      if (render) {
        draw();
        renderElapsed = 0;
      }
      raf = requestAnimationFrame(animate);
    }
    function key(event, value) {
      if (event.target !== canvas) return;
      const map = {
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
        " ": "jump",
        ArrowUp: "jump",
      };
      if (map[event.key]) {
        event.preventDefault();
        held[map[event.key]] = value;
      }
    }
    const down = (e) => key(e, true),
      up = (e) => key(e, false),
      clear = () => Object.keys(held).forEach((k) => (held[k] = false));
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    addEventListener("blur", clear);
    canvas.addEventListener("blur", clear);
    $$("[data-hold]").forEach((button) => {
      button.onpointerdown = (e) => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        held[button.dataset.hold] = true;
      };
      button.onpointerup = button.onpointercancel = () =>
        (held[button.dataset.hold] = false);
    });
    $("#gpause").onclick = () => {
      paused = !paused;
      accumulator = 0;
      $("#gpause").textContent = paused ? "Resume" : "Pause";
    };
    $("#gstep").onclick = () => {
      paused = true;
      $("#gpause").textContent = "Resume";
      tick();
      draw();
    };
    $("#grestart").onclick = restart;
    $("#gspeed").onchange = (e) => (speed = Number(e.target.value));
    $$("[data-param]").forEach(
      (range) =>
        (range.oninput = () => {
          s.config[range.dataset.param] = Number(range.value);
          $(`[data-value="${range.dataset.param}"]`).textContent = range.value;
          playback = null;
          recording = false;
          $("#greport").textContent =
            "Settings changed. Start a new recording for a reproducible comparison.";
          persist();
        }),
    );
    $("#grecord").onclick = () => {
      restart();
      paused = false;
      $("#gpause").textContent = "Pause";
      $("#greport").textContent = "Recording from spawn with current settings.";
    };
    $("#greplay").onclick = () => {
      if (!inputs.length) return H.toast("Record some play first");
      playback = inputs.map((i) => ({ ...i }));
      s = C.create(origin.config, origin.level);
      b = C.create(b.config, origin.level);
      recording = false;
      frame = 0;
      accumulator = 0;
      paused = false;
      editing = false;
      $("#gpause").textContent = "Pause";
      $("#greport").textContent = "Replaying recorded tick inputs.";
    };
    $("#gcompare").onclick = () => {
      compare = !compare;
      $("#gcompare").textContent = compare ? "Hide B (cyan)" : "Compare A / B";
      b = C.create(b.config, s.level);
      $("#greport").textContent =
        "Restart or replay to compare from the same spawn. A is violet; B is cyan.";
    };
    $("#gsetb").onclick = () => {
      b = C.create(s.config, s.level);
      persist();
      H.toast("B captured. Change A, then restart or replay.");
    };
    $("#gsavepreset").onclick = () => {
      const name = $("#gpresetname").value.trim();
      if (!name) return H.toast("Name your preset first");
      const all = presets();
      all[name] = { ...s.config };
      store.set("gd:presets", all);
      $("#gpreset").innerHTML =
        '<option value="">Choose…</option>' +
        Object.keys(all)
          .map((n) => `<option>${esc(n)}</option>`)
          .join("");
      H.toast("Preset saved");
    };
    $("#gpreset").onchange = () => {
      const c = presets()[$("#gpreset").value];
      if (!c) return;
      s.config = { ...c };
      $$("[data-param]").forEach((range) => {
        range.value = c[range.dataset.param];
        $(`[data-value="${range.dataset.param}"]`).textContent = range.value;
      });
      restart();
      persist();
    };
    if (kind === "debug") {
      const clues = {
        double:
          "Hold Jump near the ground. Watch the jump counter: a press must be consumed once, and grace time must expire after jumping.",
        tunnel:
          "Set speed high and gravity high. A discrete overlap check can skip a thin surface. Compare a swept check.",
        platform:
          "Stand on the blue platform. Who owns its displacement when the player is grounded on it?",
        jitter:
          "Compare replay at 1× and ¼×. Render duration should not determine simulation steps.",
      };
      $("#gbug").onchange = () => {
        s.config.bug = $("#gbug").value;
        $("#gclue").textContent =
          clues[s.config.bug] || "Healthy fixed-step controller.";
        restart();
      };
      $("#gfix").onclick = () => {
        const bug = s.config.bug;
        if (!bug) return H.toast("Choose a broken controller first");
        s.config.bug = "";
        restart();
        $("#gbug").value = "";
        $("#gfixreport").textContent =
          "Repair applied. Repeat your reproduction and compare the result.";
        record(
          "bug",
          `Repaired ${bug}`,
          {
            bug,
            prediction: $("#gpredict").value,
            observation: $("#gobserve").value,
          },
          canvas,
        );
        window.GameNotebook.outcome(
          "fixed-" + bug,
          "Applied and inspected controller repair: " + bug,
        );
      };
    }
    function paint(e) {
      if (!editing) return;
      const rect = canvas.getBoundingClientRect(),
        x = Math.floor(((e.clientX - rect.left) / rect.width) * 24),
        y = Math.floor(((e.clientY - rect.top) / rect.height) * 12);
      if (x < 0 || x >= 24 || y < 0 || y >= 12) return;
      const rows = s.level.map((r) => [...r]);
      if (brush === "S" || brush === "G")
        rows.forEach((r) =>
          r.forEach((v, i) => {
            if (v === brush) r[i] = ".";
          }),
        );
      rows[y][x] = brush;
      s = C.create(
        s.config,
        rows.map((r) => r.join("")),
      );
      persist();
    }
    canvas.onpointerdown = (e) => {
      canvas.focus();
      if (editing) {
        canvas.setPointerCapture(e.pointerId);
        paint(e);
      }
    };
    canvas.onpointermove = (e) => {
      if (e.buttons) paint(e);
    };
    if (kind === "level") {
      $("#gbrush").onchange = () => (brush = $("#gbrush").value);
      $("#gedit").onclick = () => {
        editing = !editing;
        $("#gedit").textContent = editing ? "Play this level" : "Edit level";
        if (!editing) {
          restart();
          paused = false;
        }
      };
      $("#glevelreset").onclick = () => {
        s = C.create(s.config);
        persist();
      };
    }
    function loadSprite(data) {
      const image = new Image();
      image.onload = () => {
        sprite = image;
        $("#gartstatus").textContent =
          `${image.width}×${image.height} PNG loaded. Frame dimensions must fit the sheet.`;
      };
      image.src = data;
    }
    if (art?.data) loadSprite(art.data);
    function updateArt() {
      if (!sprite) return;
      const next = Object.fromEntries(
        $$("[data-art]").map((el) => [el.dataset.art, Number(el.value)]),
      );
      if (
        !Object.values(next).every(Number.isFinite) ||
        ![next.width, next.height, next.frames].every(Number.isInteger) ||
        next.width < 1 ||
        next.height < 1 ||
        next.frames < 1 ||
        next.fps < 1 ||
        next.width > sprite.width ||
        next.height > sprite.height ||
        next.frames >
          Math.floor(sprite.width / next.width) *
            Math.floor(sprite.height / next.height)
      ) {
        $("#gartstatus").textContent =
          "Invalid frame dimensions or frame count for this sheet.";
        return;
      }
      art = { ...art, ...next };
      persist();
    }
    $$("[data-art]").forEach((input) => (input.onchange = updateArt));
    $("#gsprite").onchange = async () => {
      const file = $("#gsprite").files[0];
      if (!file) return;
      if (file.type !== "image/png" || file.size > 1024 * 1024) {
        $("#gartstatus").textContent = "Choose a PNG under 1 MiB.";
        return;
      }
      try {
        const bitmap = await createImageBitmap(file);
        if (bitmap.width > 2048 || bitmap.height > 2048) {
          bitmap.close();
          throw Error("Maximum sheet size is 2048×2048.");
        }
        const reader = new FileReader();
        reader.onload = () => {
          art = {
            data: reader.result,
            width: bitmap.width,
            height: bitmap.height,
            frames: 1,
            fps: 8,
            pivotX: bitmap.width / 2,
            pivotY: bitmap.height,
          };
          $$("[data-art]").forEach(
            (input) => (input.value = art[input.dataset.art]),
          );
          bitmap.close();
          loadSprite(art.data);
          persist();
        };
        reader.readAsDataURL(file);
      } catch (e) {
        $("#gartstatus").textContent = e.message || "Could not read this PNG.";
      }
    };
    $("#gnotebook").onclick = () => {
      const saved = record(
        "experiment",
        names[kind],
        {
          route: "#/play/" + kind,
          config: s.config,
          level: s.level,
          art,
          prediction: $("#gpredict").value,
          observation: $("#gobserve").value,
          inputs,
          origin,
          falls: failures,
        },
        canvas,
      );
      $("#gnoteout").textContent = saved
        ? "Saved in project notebook."
        : "Storage is full. Export or remove old notebook entries.";
      persist();
    };
    raf = requestAnimationFrame(animate);
    H.setCleanup(() => {
      stopped = true;
      cancelAnimationFrame(raf);
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
      removeEventListener("blur", clear);
      persist();
    });
  }
});
