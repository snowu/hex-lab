/* This runtime has no app dependencies and is embedded into standalone HTML exports. */
window.GameProjectRuntime = function (canvas, kind, options = {}) {
  const ctx = canvas.getContext("2d"),
    C = window.GameLab,
    W = 640,
    H = 384,
    keys = {},
    stats = {
      hits: 0,
      score: 0,
      kills: 0,
      won: false,
      lost: false,
      health: 100,
      opponent: 0,
      deaths: 0,
      ticks: 0,
    };
  let raf,
    stopped = false,
    paused = false,
    last = 0,
    accumulator = 0,
    paddle = 260,
    opponentPaddle = 260,
    ball = { x: 320, y: 180, vx: 170, vy: -160 },
    bricks = [],
    enemies = [],
    shots = [],
    cooldown = 0,
    seed = 1234,
    spawnTimer = 0,
    player = { x: 320, y: 192 },
    platformer =
      kind === "platformer"
        ? C.create(
            {
              ...C.DEFAULTS,
              speed: options.speed || 230,
              jump: options.jump || 520,
            },
            options.level || C.DEFAULT_LEVEL,
          )
        : null,
    sprite = null;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (options.art?.data) {
    sprite = new Image();
    sprite.src = options.art.data;
  }
  function reset() {
    Object.assign(stats, {
      hits: 0,
      score: 0,
      kills: 0,
      won: false,
      lost: false,
      health: 100,
      opponent: 0,
      deaths: 0,
      ticks: 0,
    });
    paddle = 260;
    opponentPaddle = 260;
    ball = { x: 320, y: 180, vx: 170, vy: -160 };
    bricks = Array.from({ length: 12 }, (_, i) => ({
      x: 64 + (i % 6) * 86,
      y: 45 + Math.floor(i / 6) * 30,
      w: 78,
      h: 20,
      alive: true,
    }));
    enemies = [];
    shots = [];
    cooldown = 0;
    spawnTimer = 0;
    seed = 1234;
    player = { x: 320, y: 192 };
    if (platformer) platformer = C.create(platformer.config, platformer.level);
  }
  const move = () => ({
    left: !!(keys.ArrowLeft || keys.a),
    right: !!(keys.ArrowRight || keys.d),
    jump: !!(keys[" "] || keys.ArrowUp),
    up: !!(keys.w || keys.ArrowUp),
    down: !!(keys.s || keys.ArrowDown),
  });
  function tick(dt) {
    if (stats.won || stats.lost) return;
    stats.ticks++;
    const input = move();
    if (kind === "platformer") {
      C.step(platformer, input);
      stats.hits = platformer.jumps;
      stats.deaths = platformer.deaths;
      stats.won = platformer.won;
    } else if (kind === "arena") {
      player.x = Math.max(
        10,
        Math.min(
          W - 10,
          player.x + (input.right - input.left) * (options.speed || 180) * dt,
        ),
      );
      player.y = Math.max(
        10,
        Math.min(
          H - 10,
          player.y + (input.down - input.up) * (options.speed || 180) * dt,
        ),
      );
      spawnTimer -= dt;
      cooldown -= dt;
      if (spawnTimer <= 0 && enemies.length < 20) {
        const edge = Math.floor(random() * 4);
        enemies.push({
          x: edge === 0 ? 0 : edge === 1 ? W : random() * W,
          y: edge === 2 ? 0 : edge === 3 ? H : random() * H,
        });
        spawnTimer = options.interval || 0.8;
      }
      if (input.jump && cooldown <= 0 && enemies.length) {
        const e = [...enemies].sort(
            (a, b) =>
              Math.hypot(a.x - player.x, a.y - player.y) -
              Math.hypot(b.x - player.x, b.y - player.y),
          )[0],
          distance = Math.hypot(e.x - player.x, e.y - player.y) || 1;
        shots.push({
          x: player.x,
          y: player.y,
          vx: ((e.x - player.x) / distance) * 350,
          vy: ((e.y - player.y) / distance) * 350,
        });
        cooldown = options.cooldown || 0.25;
        stats.hits++;
      }
      enemies.forEach((e) => {
        const d = Math.hypot(player.x - e.x, player.y - e.y) || 1;
        e.x += ((player.x - e.x) / d) * 45 * dt;
        e.y += ((player.y - e.y) / d) * 45 * dt;
        if (d < 16) {
          stats.deaths++;
          stats.health -= 25;
          stats.lost = stats.health <= 0;
          e.dead = true;
        }
      });
      shots.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const e = enemies.find(
          (e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 12,
        );
        if (e) {
          e.dead = true;
          p.dead = true;
          stats.kills++;
        }
      });
      enemies = enemies.filter((e) => !e.dead);
      shots = shots.filter(
        (p) => !p.dead && p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H,
      );
      stats.won = stats.kills >= 10;
    } else {
      const size = options.paddle || 110;
      paddle = Math.max(
        0,
        Math.min(
          W - size,
          paddle + (input.right - input.left) * (options.speed || 360) * dt,
        ),
      );
      const oldY = ball.y;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < 7) {
        ball.x = 7;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x > W - 7) {
        ball.x = W - 7;
        ball.vx = -Math.abs(ball.vx);
      }
      if (
        ball.vy > 0 &&
        oldY + 7 <= H - 28 &&
        ball.y + 7 >= H - 28 &&
        ball.x >= paddle &&
        ball.x <= paddle + size
      ) {
        ball.y = H - 35;
        ball.vy = -Math.abs(ball.vy);
        ball.vx = ((ball.x - (paddle + size / 2)) / size) * 360;
        stats.hits++;
      }
      if (kind === "pong") {
        const target = ball.x - 50;
        opponentPaddle += Math.max(
          -100 * dt,
          Math.min(100 * dt, target - opponentPaddle),
        );
        opponentPaddle = Math.max(0, Math.min(W - 100, opponentPaddle));
        if (
          ball.vy < 0 &&
          oldY - 7 >= 28 &&
          ball.y - 7 <= 28 &&
          ball.x >= opponentPaddle &&
          ball.x <= opponentPaddle + 100
        ) {
          ball.y = 35;
          ball.vy = Math.abs(ball.vy);
        }
        if (ball.y < -10) {
          stats.score++;
          ball = { x: 320, y: 180, vx: stats.score % 2 ? -170 : 170, vy: 160 };
        }
        stats.won = stats.score >= 3;
      } else {
        if (ball.y < 7) {
          ball.y = 7;
          ball.vy = Math.abs(ball.vy);
        }
        for (const brick of bricks)
          if (
            brick.alive &&
            ball.x + 7 > brick.x &&
            ball.x - 7 < brick.x + brick.w &&
            ball.y + 7 > brick.y &&
            ball.y - 7 < brick.y + brick.h
          ) {
            brick.alive = false;
            ball.vy *= -1;
            stats.score++;
            break;
          }
        stats.won = stats.score >= bricks.length;
      }
      if (ball.y > H + 10) {
        stats.deaths++;
        if (kind === "pong") {
          stats.opponent++;
          stats.lost = stats.opponent >= 3;
        }
        ball = { x: paddle + size / 2, y: H - 70, vx: 120, vy: -170 };
      }
    }
    options.onUpdate?.({ ...stats });
  }
  function draw() {
    ctx.fillStyle = options.background || "#100d1a";
    ctx.fillRect(0, 0, W, H);
    if (kind === "platformer") {
      const s = platformer;
      ctx.save();
      ctx.translate(-Math.max(0, Math.min(128, s.camera)), 0);
      s.blocks.forEach((b) => {
        ctx.fillStyle = "#5f477d";
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });
      s.level.forEach((r, y) =>
        [...r].forEach((v, x) => {
          if (v === "G") {
            ctx.fillStyle = "#ffbf55";
            ctx.fillRect(x * 32 + 8, y * 32, 20, 28);
          }
        }),
      );
      ctx.fillStyle = "#6a9ce2";
      ctx.fillRect(s.platform.x, s.platform.y, s.platform.w, s.platform.h);
      ctx.fillStyle = "#ff7777";
      s.enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.w, e.h));
      ctx.fillStyle = "#ffbf55";
      s.pickups
        .filter((p) => !p.taken)
        .forEach((p) => ctx.fillRect(p.x, p.y, p.w, p.h));
      drawPlayer(s.p.x, s.p.y, s.p.w, s.p.h);
      ctx.restore();
    } else if (kind === "arena") {
      drawPlayer(player.x - 10, player.y - 10, 20, 20);
      ctx.fillStyle = "#ff7070";
      enemies.forEach((e) => ctx.fillRect(e.x - 8, e.y - 8, 16, 16));
      ctx.fillStyle = "#ffbf55";
      shots.forEach((p) => ctx.fillRect(p.x - 3, p.y - 3, 6, 6));
    } else {
      ctx.fillStyle = options.color || "#c69bff";
      ctx.fillRect(paddle, H - 28, options.paddle || 110, 12);
      ctx.fillStyle = "#ffbf55";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
      ctx.fill();
      if (kind === "pong") {
        ctx.fillStyle = "#70d9d0";
        ctx.fillRect(opponentPaddle, 16, 100, 12);
      } else
        bricks
          .filter((b) => b.alive)
          .forEach((b) => {
            ctx.fillStyle = "#8060ad";
            ctx.fillRect(b.x, b.y, b.w, b.h);
          });
    }
    ctx.fillStyle = "#f0e8ff";
    ctx.font = "14px monospace";
    ctx.fillText(
      `hits ${stats.hits} · score ${stats.score} · kills ${stats.kills} · ${kind === "arena" ? "health " + stats.health : "falls " + stats.deaths}`,
      12,
      H - 4,
    );
    if (stats.lost) {
      ctx.fillStyle = "#ff7777";
      ctx.font = "24px monospace";
      ctx.fillText("Round lost. Restart and try again.", 100, 190);
    }
    if (stats.won) {
      ctx.font = "24px monospace";
      ctx.fillText("Playable goal completed!", 150, 190);
    }
    canvas.dataset.score = stats.score;
    canvas.dataset.kills = stats.kills;
    canvas.dataset.hits = stats.hits;
    canvas.dataset.won = stats.won;
    canvas.dataset.x =
      kind === "arena"
        ? player.x
        : kind === "platformer"
          ? platformer.p.x
          : paddle;
  }
  function drawPlayer(x, y, w, h) {
    if (sprite?.complete && sprite.naturalWidth && options.art) {
      const a = options.art,
        index = Math.floor((stats.ticks / 60) * a.fps) % a.frames,
        cols = Math.floor(sprite.width / a.width);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sprite,
        (index % cols) * a.width,
        Math.floor(index / cols) * a.height,
        a.width,
        a.height,
        x + w / 2 - a.pivotX * 2,
        y + h - a.pivotY * 2,
        a.width * 2,
        a.height * 2,
      );
    } else {
      ctx.fillStyle = options.color || "#c69bff";
      ctx.fillRect(x, y, w, h);
    }
  }
  function frame(now) {
    if (stopped) return;
    accumulator += last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (paused) accumulator = 0;
    while (accumulator >= 1 / 60) {
      tick(1 / 60);
      accumulator -= 1 / 60;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function handle(event, pressed) {
    if (document.activeElement !== canvas) return;
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        " ",
        "w",
        "a",
        "s",
        "d",
      ].includes(event.key)
    ) {
      event.preventDefault();
      keys[event.key] = pressed;
    }
  }
  const keydown = (e) => handle(e, true),
    keyup = (e) => handle(e, false),
    clear = () => Object.keys(keys).forEach((k) => (keys[k] = false));
  canvas.tabIndex = 0;
  canvas.onclick = () => canvas.focus();
  canvas.addEventListener("blur", clear);
  addEventListener("keydown", keydown);
  addEventListener("keyup", keyup);
  addEventListener("blur", clear);
  reset();
  raf = requestAnimationFrame(frame);
  return {
    stats,
    snapshot() {
      return JSON.parse(
        JSON.stringify({
          player,
          ball,
          paddle,
          opponentPaddle,
          enemies,
          bricks,
          platformer: platformer && { p: platformer.p, tick: platformer.tick },
          stats,
        }),
      );
    },
    restart: reset,
    pause(value) {
      paused = value;
    },
    hold(key, value) {
      keys[key] = value;
    },
    dispose() {
      stopped = true;
      cancelAnimationFrame(raf);
      removeEventListener("keydown", keydown);
      removeEventListener("keyup", keyup);
      removeEventListener("blur", clear);
      canvas.removeEventListener("blur", clear);
    },
  };
};
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  if (window.MODE !== "gamedev") return;
  const { $, $$, esc, store, app } = H;
  const projects = [
    {
      id: "pong",
      title: "Pong",
      description:
        "Input, movement, bounds, collision response and a playable win condition.",
      steps: [
        {
          title: "Move and return",
          text: "Move the paddle with arrows or A/D. Return the ball once. Inspect how the edge of the paddle changes its horizontal velocity.",
          metric: "hits",
          target: 1,
          kata: "movement",
          lesson: "gd-vectors",
        },
        {
          title: "Tune control",
          text: "Change paddle width or movement speed. Return the ball three times and write down which setting gives you more control.",
          metric: "hits",
          target: 3,
          kata: "cooldown",
          lesson: "gd-loop",
        },
        {
          title: "Finish and ship",
          text: "Earn three points, test restart and pause, then export a playable HTML file. Record what you would improve next.",
          metric: "score",
          target: 3,
          kata: "tile-collision",
          lesson: "prod-release",
        },
      ],
    },
    {
      id: "breakout",
      title: "Breakout",
      description:
        "Extend a paddle game with a destructible board, scoring and a finish state.",
      steps: [
        {
          title: "Hit a brick",
          text: "Break one brick. Watch the collision response and identify why a destroyed brick must leave the collision set.",
          metric: "score",
          target: 1,
          kata: "tile-collision",
          lesson: "gd-collision",
        },
        {
          title: "Build momentum",
          text: "Break four bricks. Tune paddle width and speed to make recovery fair. Compare the result with Pong.",
          metric: "score",
          target: 4,
          kata: "animation",
          lesson: "gd-juice",
        },
        {
          title: "Clear and export",
          text: "Clear all twelve bricks. Test the finish state and restart. Export the game and keep a short postmortem.",
          metric: "score",
          target: 12,
          kata: "inventory",
          lesson: "prod-release",
        },
      ],
    },
    {
      id: "platformer",
      title: "A platformer room",
      description:
        "Combine jump eligibility, camera motion, art, tile collision and level design.",
      steps: [
        {
          title: "Jump and land",
          text: "Make two jumps. Visit the mechanics lab to compare jump buffering and coyote time; solve the buffered-jump kata.",
          metric: "hits",
          target: 2,
          kata: "jump-buffer",
          lesson: "phy-controllers",
        },
        {
          title: "Tune and draw",
          text: "Make five jumps with your chosen speed and jump strength. Import art in the art lab; this project can use that saved sprite.",
          metric: "hits",
          target: 5,
          kata: "camera",
          lesson: "px-anim",
        },
        {
          title: "Ship a room",
          text: "Reach the gold flag. You can use the map from the level sandbox. Export, reopen the file, and record what you learned.",
          metric: "won",
          target: true,
          kata: "tile-collision",
          lesson: "prod-release",
        },
      ],
    },
    {
      id: "arena",
      title: "A small wave arena",
      description:
        "Spawn enemies, aim projectiles, manage cooldowns and survive a reproducible wave.",
      steps: [
        {
          title: "Move and shoot",
          text: "Move with arrows or WASD. Hold Space to fire at the closest enemy. Fire three shots and inspect the cooldown.",
          metric: "hits",
          target: 3,
          kata: "cooldown",
          lesson: "gd-core-loop",
        },
        {
          title: "Shape a wave",
          text: "Defeat three enemies. Change spawn interval or fire cooldown and observe how pressure changes.",
          metric: "kills",
          target: 3,
          kata: "waves",
          lesson: "ai-fun",
        },
        {
          title: "Finish a round",
          text: "Defeat ten enemies. Record one fairness improvement, test pause/restart and export the playable game.",
          metric: "kills",
          target: 10,
          kata: "animation",
          lesson: "prod-release",
        },
      ],
    },
  ];
  H.routes.push(
    [/^#\/projects$/, list],
    [/^#\/project\/(pong|breakout|platformer|arena)$/, view],
  );
  function list() {
    document.title = "Build-along games · Hex Lab";
    const all = store.get("gd:projects", {});
    app.innerHTML = `<div class="page-h"><h1>Build-along games</h1><p>Work through playable checkpoints in this order. Solve the linked code kata, reach the playable target, keep a learning note, then export a standalone version.</p></div><p><a class="btn" href="#/native-projects">Build a game powered by your C, Zig or C++ code →</a></p><div class="dgrid">${projects.map((p, i) => `<a class="dcard tc" href="#/project/${p.id}"><span class="chip">${i + 1} · ${Object.keys(all[p.id]?.completed || {}).length}/3 checkpoints</span><h2>${p.title}</h2><p>${p.description}</p></a>`).join("")}</div>`;
  }
  function view(id) {
    const project = projects.find((p) => p.id === id),
      all = store.get("gd:projects", {}),
      saved = all[id] || { completed: {}, stage: 0, options: {} };
    let stage = Math.min(2, saved.stage || 0),
      runtime,
      paused = false;
    document.title = project.title + " · Build-along games";
    app.innerHTML = `<div class="crumbs"><a href="#/projects">Build-along games</a> / ${project.title}</div><div class="page-h"><h1>${project.title}</h1><p>${project.description}</p></div><div class="filters">${project.steps.map((step, i) => `<button class="fchip ${i === stage ? "on" : ""}" data-stage="${i}" ${i > 0 && !saved.completed[i - 1] ? "disabled" : ""}>${i + 1}. ${step.title}${saved.completed[i] ? " ✓" : ""}</button>`).join("")}</div><div class="gl-layout"><section class="tc gl-stage"><canvas id="projectcanvas" width="640" height="384" aria-label="Playable ${project.title}"></canvas><div class="gl-touch"><button data-key="ArrowLeft">◀</button><button data-key="ArrowRight">▶</button>${id === "arena" ? '<button data-key="ArrowUp">▲</button><button data-key="ArrowDown">▼</button>' : ""}<button data-key=" ">${id === "arena" ? "Shoot" : "Jump"}</button></div><div class="dbar"><button class="btn" id="jrestart">Restart</button><button class="btn" id="jpause">Pause</button><button class="btn" id="jexport">Export playable HTML</button><button class="btn" id="jsource">Read runtime source</button></div><output id="jstats"></output><pre class="gl-source" id="jreference" hidden></pre></section><aside class="tc gl-controls"><h2 id="jtitle"></h2><p id="jtask"></p><div id="jlinks"></div><h2>Tune your game</h2>${[
      [
        "speed",
        "Movement speed",
        id === "arena" ? 180 : id === "platformer" ? 230 : 360,
        50,
        800,
        10,
      ],
      ["paddle", "Paddle width", 110, 40, 250, 10],
      ["jump", "Jump impulse", 520, 300, 900, 10],
      ["interval", "Spawn interval (seconds)", 0.8, 0.2, 3, 0.1],
      ["cooldown", "Fire cooldown (seconds)", 0.25, 0.05, 1, 0.05],
    ]
      .filter(
        ([key]) =>
          key === "speed" ||
          (["pong", "breakout"].includes(id)
            ? key === "paddle"
            : id === "platformer"
              ? key === "jump"
              : ["interval", "cooldown"].includes(key)),
      )
      .map(
        ([key, title, value, min, max, step]) =>
          `<label class="lbl">${title}<input class="inp" type="number" data-option="${key}" value="${saved.options[key] ?? value}" min="${min}" max="${max}" step="${step}"></label>`,
      )
      .join(
        "",
      )}<label class="lbl">Player / paddle colour<input type="color" id="jcolor" value="${saved.options.color || "#c69bff"}"></label>${id === "platformer" ? `<label><input type="checkbox" id="jlevel" ${saved.options.level ? "checked" : ""}>Use saved level sandbox map</label>` : ""}${["platformer", "arena"].includes(id) ? `<label><input type="checkbox" id="jart" ${saved.options.art ? "checked" : ""}>Use saved sprite from art lab</label><a href="#/play/art">Import or tune your sprite</a>` : ""}<button class="btn" id="japply">Apply and restart</button><label class="lbl">What did you learn? What will you change next?<textarea class="inp" id="jlearn" rows="4">${esc(saved.note || "")}</textarea></label><button class="btn primary" id="jcomplete" disabled>Complete checkpoint</button><output id="jresult"></output></aside></div>`;
    const canvas = $("#projectcanvas");
    function options() {
      return {
        ...saved.options,
        onUpdate(stats) {
          const step = project.steps[stage],
            reached =
              step.target === true
                ? stats[step.metric] === true
                : stats[step.metric] >= step.target;
          const codeDone = !!store.get("gd:kataPasses", {})[step.kata],
            noteDone = !!$("#jlearn").value.trim();
          $("#jcomplete").disabled =
            !!saved.completed[stage] || !(reached && codeDone && noteDone);
          $("#jresult").textContent = saved.completed[stage]
            ? "Checkpoint saved. Continue to the next step or export your game."
            : reached
              ? !codeDone
                ? "Playable target reached. Solve the linked code kata to complete this checkpoint."
                : !noteDone
                  ? "Playable target reached. Add a learning note to finish."
                  : "Ready to save this checkpoint."
              : "";
          $("#jstats").textContent =
            `Checkpoint ${stage + 1}: ${step.metric} ${stats[step.metric]} / ${step.target} · ${stats.won ? "goal complete" : stats.lost ? "round lost · restart to try again" : "playing"}`;
        },
      };
    }
    function showStage() {
      const step = project.steps[stage];
      $("#jtitle").textContent = step.title;
      $("#jtask").textContent = step.text;
      $("#jlinks").innerHTML =
        `<a href="#/game-kata/${step.kata}">Practise the code kata</a> · <a href="#/lesson/${step.lesson}">Read the lesson</a>`;
      runtime?.dispose();
      runtime = GameProjectRuntime(canvas, id, options());
      paused = false;
      $("#jpause").textContent = "Pause";
    }
    $$("[data-stage]").forEach(
      (button) =>
        (button.onclick = () => {
          stage = Number(button.dataset.stage);
          saved.stage = stage;
          all[id] = saved;
          store.set("gd:projects", all);
          $$("[data-stage]").forEach((b) =>
            b.classList.toggle("on", b === button),
          );
          $("#jcomplete").disabled = true;
          showStage();
        }),
    );
    $("#jrestart").onclick = () => {
      runtime.restart();
      $("#jcomplete").disabled = true;
    };
    $("#jpause").onclick = () => {
      paused = !paused;
      runtime.pause(paused);
      $("#jpause").textContent = paused ? "Resume" : "Pause";
    };
    $$("[data-key]").forEach((button) => {
      button.onpointerdown = (e) => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        runtime.hold(button.dataset.key, true);
      };
      button.onpointerup = button.onpointercancel = () =>
        runtime.hold(button.dataset.key, false);
    });
    $("#japply").onclick = () => {
      for (const field of $$("[data-option]")) {
        if (!field.checkValidity()) {
          field.reportValidity();
          return;
        }
        saved.options[field.dataset.option] = Number(field.value);
      }
      saved.options.color = $("#jcolor").value;
      if ($("#jlevel"))
        saved.options.level = $("#jlevel").checked
          ? store.get("gd:play:level", {}).level
          : undefined;
      if ($("#jart"))
        saved.options.art = $("#jart").checked
          ? store.get("gd:play:art", {}).art
          : undefined;
      all[id] = saved;
      store.set("gd:projects", all);
      $("#jcomplete").disabled = true;
      showStage();
    };
    $("#jlearn").oninput = () => {
      saved.note = $("#jlearn").value;
      all[id] = saved;
      store.set("gd:projects", all);
      options().onUpdate(runtime.stats);
    };
    $("#jcomplete").onclick = () => {
      if (saved.completed[stage]) return;
      saved.completed[stage] = {
        ts: Date.now(),
        stats: { ...runtime.stats },
        note: $("#jlearn").value,
      };
      all[id] = saved;
      store.set("gd:projects", all);
      GameNotebook.save({
        kind: "project",
        title: `${project.title}: ${project.steps[stage].title}`,
        observation: $("#jlearn").value,
        data: {
          project: id,
          stage,
          stats: { ...runtime.stats },
          options: saved.options,
        },
        image: canvas.toDataURL("image/png"),
      });
      GameNotebook.outcome(
        `project-${id}-${stage}`,
        `Built ${project.title}: ${project.steps[stage].title}`,
      );
      H.logAct("build");
      $("#jresult").textContent =
        "Checkpoint saved. Continue to the next step or export your game.";
      const next = $(`[data-stage="${stage + 1}"]`);
      if (next) next.disabled = false;
    };
    $("#jsource").onclick = () => {
      $("#jreference").hidden = !$("#jreference").hidden;
      $("#jreference").textContent = GameProjectRuntime.toString();
    };
    $("#jexport").onclick = async () => {
      try {
        const response = await fetch("assets/game/core.js");
        if (!response.ok) throw Error("Could not load export runtime");
        const core = await response.text(),
          config = JSON.stringify(saved.options).replace(/</g, "\\u003c");
        const source = `${core}\nconst game = (${GameProjectRuntime.toString()})(document.querySelector('canvas'), ${JSON.stringify(id)}, ${config}); document.querySelector('#restart').onclick=()=>game.restart(); let paused=false; document.querySelector('#pause').onclick=()=>{paused=!paused;game.pause(paused)}; document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);game.hold(b.dataset.key,true)};b.onpointerup=b.onpointercancel=()=>game.hold(b.dataset.key,false)});`;
        GameDownload(
          `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${project.title}</title><style>body{background:#100d1a;color:#eee;font:16px system-ui;max-width:800px;margin:auto;padding:16px}canvas{width:100%;image-rendering:pixelated;touch-action:none}button{padding:14px;margin:4px}p{line-height:1.5}</style><h1>${project.title}</h1><p>Arrow keys / WASD to move; Space to jump or shoot. Click the game first. Built with Hex Lab.</p><canvas width="640" height="384" tabindex="0"></canvas><div><button data-key="ArrowLeft">Left</button><button data-key="ArrowRight">Right</button><button data-key="ArrowUp">Up</button><button data-key="ArrowDown">Down</button><button data-key=" ">Jump / shoot</button><button id="restart">Restart</button><button id="pause">Pause</button></div><script>${source.replace(/<\/script/gi, "<\\/script")}<\/script></html>`,
          `${id}-game.html`,
          "text/html",
        );
        $("#jresult").textContent =
          "Exported. Open the HTML file in a browser; it needs no server or dependencies.";
      } catch (e) {
        $("#jresult").textContent = e.message;
      }
    };
    showStage();
    H.setCleanup(() => runtime.dispose());
  }
});
