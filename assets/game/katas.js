(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  if (window.MODE !== "gamedev") return;
  const { $, $$, esc, store, app } = H,
    items = GAME_KATAS,
    reviews = () => store.get("gd:kataReviews", {}),
    DAY = 864e5;
  let worker = null,
    timeout = null;
  function due() {
    const r = reviews();
    return items
      .filter((k) => r[k.id]?.due <= Date.now())
      .map((k) => ({ name: k.title, slug: k.id, href: "#/game-kata/" + k.id }));
  }
  window.GAME_KATA_SR = { due };
  H.routes.push([/^#\/game-katas$/, list], [/^#\/game-kata\/([\w-]+)$/, view]);
  function list() {
    document.title = "Game katas · Game Dev Lab";
    const all = reviews();
    app.innerHTML = `<div class="page-h"><h1>Game katas</h1><p>Original JavaScript exercises for real game mechanics. Run tests in your browser, then try the technique in a playground or your own engine.</p></div><div class="dbar"><a class="btn" href="#/katas">General code katas</a><a class="btn" href="#/play/mechanics">Try mechanics in a game</a></div><div class="dgrid">${items.map((k) => `<a class="dcard tc" href="#/game-kata/${k.id}"><h2>${esc(k.title)}</h2><p>${esc(k.prompt)}</p><span class="chip">${all[k.id] ? (all[k.id].due <= Date.now() ? "Review due" : "Solved · review scheduled") : "Not yet solved"}</span></a>`).join("")}</div>`;
  }
  function stop() {
    worker?.terminate();
    worker = null;
    clearTimeout(timeout);
  }
  function view(id) {
    const k = items.find((k) => k.id === id);
    if (!k) return list();
    document.title = k.title + " · Game katas";
    const r = reviews()[id];
    app.innerHTML = `<div class="crumbs"><a href="#/game-katas">Game katas</a> / ${esc(k.title)}</div><div class="page-h"><h1>${esc(k.title)}</h1><p>${esc(k.prompt)}</p></div><p class="muted">${r ? (r.due <= Date.now() ? "Review due: solve again from scratch." : "Next review: " + new Date(r.due).toLocaleDateString()) : "First pass schedules a review in two days."}</p><section class="tc brk"><label class="lbl">solution.js<textarea class="inp gl-code" id="gkcode" rows="12" spellcheck="false">${esc(store.get("gd:kata:" + id, k.starter))}</textarea></label><div class="dbar"><button class="btn primary" id="gkrun">Run tests</button><button class="btn" id="gkreset">Reset starter</button><button class="btn" id="gkhint">Hint</button><button class="btn" id="gksolution">Reference</button><button class="btn" id="gkshaky">Mark shaky</button>${H.askBtn(`I am learning ${k.title}. ${k.prompt} Give me a hint about the approach and edge cases; do not solve it.`, "Ask tutor")}</div><p id="gkhintout" hidden>${esc(k.hint)}</p><pre id="gkref" hidden><code>${esc(k.solution)}</code></pre><output id="gkresult" role="status"></output><details><summary>Test cases</summary><pre>${esc(JSON.stringify(k.tests, null, 2))}</pre></details><a href="#/lesson/${k.lesson}">Related lesson</a></section>`;
    $("#gkcode").oninput = () => store.set("gd:kata:" + id, $("#gkcode").value);
    $("#gkreset").onclick = () => {
      $("#gkcode").value = k.starter;
      store.set("gd:kata:" + id, k.starter);
    };
    $("#gkhint").onclick = () =>
      ($("#gkhintout").hidden = !$("#gkhintout").hidden);
    $("#gksolution").onclick = () => ($("#gkref").hidden = !$("#gkref").hidden);
    $("#gkshaky").onclick = () => {
      const all = reviews();
      all[id] = { box: 0, due: Date.now() + DAY };
      store.set("gd:kataReviews", all);
      $("#gkresult").textContent = "Review scheduled for tomorrow.";
    };
    $("#gkrun").onclick = () => {
      stop();
      const button = $("#gkrun"),
        out = $("#gkresult");
      button.disabled = true;
      out.textContent = "Running…";
      store.set("gd:kata:" + id, $("#gkcode").value);
      worker = new Worker("assets/game/kata-worker.js");
      timeout = setTimeout(() => {
        stop();
        button.disabled = false;
        out.textContent =
          "Stopped after 2 seconds. Check for an infinite loop.";
      }, 2000);
      worker.onmessage = ({ data }) => {
        stop();
        button.disabled = false;
        if (data.error) {
          out.textContent = data.error;
          return;
        }
        out.innerHTML = data.results
          .map(
            (r) =>
              `<p class="${r.pass ? "good" : "bad"}">${r.pass ? "✓" : "✗"} Case ${r.index + 1}: expected ${esc(r.expected)} · got ${esc(r.actual)}</p>`,
          )
          .join("");
        if (data.results.every((r) => r.pass)) {
          const all = reviews(),
            previous = all[id],
            now = Date.now();
          const firstPass = !store.get("gd:outcomes", {})["kata-" + id];
          if (firstPass || !previous || previous.due <= now) {
            const box = firstPass
              ? 0
              : previous
                ? Math.min(4, previous.box + 1)
                : 0;
            all[id] = { box, due: now + [2, 5, 14, 30, 60][box] * DAY };
            store.set("gd:kataReviews", all);
            H.logAct("kata");
            GameNotebook.outcome("kata-" + id, "Solved game kata: " + k.title);
          }
          out.insertAdjacentHTML(
            "beforeend",
            "<p>All tests passed. Review scheduled.</p>",
          );
        }
      };
      worker.onerror = () => {
        stop();
        button.disabled = false;
        out.textContent = "Could not run the worker. Reload and try again.";
      };
      worker.postMessage({
        name: k.name,
        tests: k.tests,
        code: $("#gkcode").value,
      });
    };
    H.setCleanup(stop);
  }
});
