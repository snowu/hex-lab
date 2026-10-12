/* Notebook keys use sil: so normal backup and optional cloud sync include them. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push((H) => {
  if (window.MODE !== "gamedev") return;
  const { $, $$, esc, store, app } = H,
    KEY = "gd:notebook",
    OUTCOMES = "gd:outcomes";
  const entries = () => store.get(KEY, []);
  window.GameNotebook = {
    save(entry) {
      const all = entries();
      all.unshift({
        id: crypto.randomUUID(),
        ts: Date.now(),
        prediction: "",
        observation: "",
        decision: "",
        bugs: "",
        next: "",
        ...entry,
      });
      if (all.length > 40) return false;
      try {
        localStorage.setItem("sil:" + KEY, JSON.stringify(all));
        if (window.CLOUD) CLOUD.markDirty();
        H.logAct("build");
        return true;
      } catch {
        return false;
      }
    },
    outcome(id, label) {
      const all = store.get(OUTCOMES, {});
      if (all[id]) return;
      all[id] = { label, ts: Date.now() };
      store.set(OUTCOMES, all);
      H.addXp(40, label);
    },
  };
  H.routes.push([/^#\/notebook$/, view]);
  function view() {
    document.title = "Project notebook · Hex Lab";
    const all = entries(),
      outcomes = Object.values(store.get(OUTCOMES, {}));
    app.innerHTML = `<div class="page-h"><h1>Project notebook</h1><p>Keep evidence of what you built, what broke, and what you will try next. Experiments and screenshots save here; normal backup and cloud sync include this notebook.</p></div><section class="tc brk"><h2>Demonstrated outcomes</h2>${outcomes.length ? `<ul>${outcomes.map((o) => `<li>${esc(o.label)} · ${new Date(o.ts).toLocaleDateString()}</li>`).join("")}</ul>` : "<p>Reach a goal, solve a kata or finish a project checkpoint to record an outcome.</p>"}</section>
      <div class="dbar"><button class="btn primary" id="nnew">New project note</button><button class="btn" id="nexport">Export notebook</button><a class="btn" href="#/plan">Full backup &amp; sync</a><span class="muted">${all.length}/40 saved entries</span></div><div id="nentries">${
        all
          .map(
            (e) =>
              `<details class="tc gl-note" data-note="${e.id}"><summary>${esc(e.title)} <small>${new Date(e.ts).toLocaleString()} · ${esc(e.kind)}</small></summary>${e.image?.startsWith("data:image/png;base64,") ? `<img class="gl-snapshot" alt="Saved experiment screenshot" src="${esc(e.image)}">` : ""}<label class="lbl">Title<input class="inp" data-field="title" value="${esc(e.title)}" maxlength="120"></label>${[
                ["prediction", "Prediction"],
                ["observation", "What happened"],
                ["decision", "Decision and reason"],
                ["bugs", "Bugs discovered"],
                ["next", "What I will try next"],
              ]
                .map(
                  ([key, label]) =>
                    `<label class="lbl">${label}<textarea class="inp" data-field="${key}" rows="3">${esc(e[key] || e.data?.[key] || "")}</textarea></label>`,
                )
                .join(
                  "",
                )}<div class="dbar"><button class="btn" data-save>Save note</button>${e.kind === "experiment" && (e.data?.route || e.data?.config) ? '<button class="btn" data-restore>Restore experiment</button>' : ""}<button class="btn" data-delete>Delete entry</button></div><output data-status></output></details>`,
          )
          .join("") ||
        '<p class="muted">No entries yet. Save an experiment in any playground, or start a project note.</p>'
      }</div>`;
    $("#nnew").onclick = () => {
      if (
        GameNotebook.save({
          kind: "project",
          title: "Untitled project",
          data: {},
        })
      )
        view();
      else H.toast("Notebook full. Export or delete an entry first.");
    };
    $("#nexport").onclick = () =>
      download(
        JSON.stringify(
          {
            app: "game-dev-notebook",
            version: 1,
            entries: all,
            outcomes: store.get(OUTCOMES, {}),
          },
          null,
          2,
        ),
        "game-dev-notebook.json",
        "application/json",
      );
    $$("[data-note]").forEach((box) => {
      const entry = all.find((e) => e.id === box.dataset.note);
      $("[data-save]", box).onclick = () => {
        $$("[data-field]", box).forEach(
          (field) => (entry[field.dataset.field] = field.value),
        );
        try {
          localStorage.setItem("sil:" + KEY, JSON.stringify(all));
          if (window.CLOUD) CLOUD.markDirty();
          $("[data-status]", box).textContent = "Saved";
        } catch {
          $("[data-status]", box).textContent =
            "Storage is full. Export or remove an entry before saving.";
        }
      };
      $("[data-delete]", box).onclick = () => {
        store.set(
          KEY,
          all.filter((e) => e.id !== entry.id),
        );
        view();
      };
      const restore = $("[data-restore]", box);
      if (restore)
        restore.onclick = () => {
          const route = entry.data.route || "#/play/mechanics",
            kind = route.split("/").pop();
          if (["mechanics", "debug", "level", "art"].includes(kind))
            store.set("gd:play:" + kind, entry.data);
          else if (kind === "path") store.set("gd:path", entry.data);
          else if (kind === "ai") {
            store.set("gd:ai", entry.data.config);
            store.set("gd:aiState", entry.data);
          } else if (kind === "shader") {
            store.set("gd:shader", entry.data.source);
            store.set("gd:shaderAmount", entry.data.amount ?? 0.3);
          } else if (kind === "performance")
            store.set("gd:performance", entry.data);
          location.hash = route;
        };
    });
  }
  function download(text, filename, type) {
    const url = URL.createObjectURL(new Blob([text], { type })),
      link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.GameDownload = download;
});
