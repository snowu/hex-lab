import fs from "node:fs";
import { newPage } from "./helpers.mjs";
export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem("sil:mode", '"gamedev"'));
  await page.reload();
  await page.waitForTimeout(250);
  section("all learning workspaces");
  for (const route of [
    "#/play",
    "#/play/mechanics",
    "#/play/debug",
    "#/play/level",
    "#/play/art",
    "#/play/path",
    "#/play/ai",
    "#/play/shader",
    "#/play/performance",
    "#/game-katas",
    "#/projects",
    "#/notebook",
  ]) {
    await page.go(url, route, 200);
    ok(
      (await page.locator("#app").innerText()).length > 100,
      route + " renders",
    );
  }
  ok(
    page.errors.length === 0,
    "no workspace errors " + JSON.stringify(page.errors),
  );
  await page.locator("#searchBtn").click();
  await page.locator("#cq").fill("shader playground");
  ok(
    (await page.locator('#cmdk a[href="#/play/shader"]').count()) === 1,
    "workbenches are searchable",
  );
  await page.keyboard.press("Escape");
  section("mechanics, replay and persistence");
  await page.go(url, "#/play/mechanics");
  await page.locator("#gpause").click();
  const before = Number(
    await page.locator("#gamecanvas").getAttribute("data-tick"),
  );
  await page.waitForTimeout(100);
  ok(
    Number(await page.locator("#gamecanvas").getAttribute("data-tick")) ===
      before,
    "pause freezes simulation",
  );
  await page.locator("#gstep").click();
  await page.waitForTimeout(50);
  ok(
    Number(await page.locator("#gamecanvas").getAttribute("data-tick")) ===
      before + 1,
    "single step advances exactly one tick",
  );
  await page.locator("#gpresetname").fill("test snappy");
  await page.locator("#gsavepreset").click();
  await page.locator('[data-param="jump"]').fill("600");
  await page.locator('[data-param="jump"]').dispatchEvent("input");
  await page.locator("#gpreset").selectOption("test snappy");
  ok(
    (await page.locator('[data-param="jump"]').inputValue()) === "520",
    "saved preset restores parameters",
  );
  await page.locator("#grecord").click();
  await page.locator("#gamecanvas").focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowRight");
  await page.locator("#gpause").click();
  await page.locator("#greplay").click();
  await page.waitForTimeout(550);
  ok(
    /Replay finished/.test(await page.locator("#greport").innerText()),
    "recorded inputs replay and stop",
  );
  const replayX = Number(
    await page.locator("#gamecanvas").getAttribute("data-x"),
  );
  await page.locator("#gfps").selectOption("15");
  await page.locator("#greplay").click();
  await page.waitForTimeout(650);
  ok(
    Math.abs(
      Number(await page.locator("#gamecanvas").getAttribute("data-x")) -
        replayX,
    ) < 0.001,
    "replay is unchanged at a different rendering cap",
  );
  await page
    .locator("#gpredict")
    .fill("More friction should stop movement sooner.");
  await page
    .locator("#gobserve")
    .fill("The recording stops at the same position.");
  await page.locator("#gnotebook").click();
  ok(
    /Saved/.test(await page.locator("#gnoteout").innerText()),
    "experiment and screenshot save",
  );
  await page.go(url, "#/notebook");
  ok(
    (await page.locator(".gl-snapshot").count()) === 1,
    "notebook shows screenshot",
  );
  await page.locator(".gl-note summary").first().click();
  await page
    .locator('[data-field="next"]')
    .fill("Compare a lower friction preset.");
  await page.locator("[data-save]").click();
  await page.reload();
  await page.waitForTimeout(300);
  await page.locator(".gl-note summary").first().click();
  ok(
    (await page.locator('[data-field="next"]').inputValue()) ===
      "Compare a lower friction preset.",
    "notebook edits persist after reload",
  );
  await page.locator("[data-restore]").click();
  ok(
    (await page.locator('[data-param="jump"]').inputValue()) === "520",
    "saved experiment restores controller",
  );
  section("debug and level editor");
  await page.go(url, "#/play/debug");
  await page.locator("#gbug").selectOption("double");
  await page.waitForTimeout(100);
  ok(
    (await page.locator("#gamecanvas").getAttribute("data-bug")) === "double",
    "broken controller selected",
  );
  await page.locator("#gfix").click();
  await page.waitForTimeout(100);
  ok(
    (await page.locator("#gamecanvas").getAttribute("data-bug")) === "",
    "repair restores healthy controller",
  );
  await page.go(url, "#/play/level");
  await page.locator("#gamecanvas").click({ position: { x: 150, y: 80 } });
  const map = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sil:gd:play:level")).level.join(""),
  );
  ok((map.match(/#/g) || []).length > 30, "level painting persists tiles");
  await page.locator("#gedit").click();
  ok(
    /Edit level/.test(await page.locator("#gedit").textContent()),
    "edited map playable",
  );
  section("PNG sprite import");
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 16;
    const g = c.getContext("2d");
    g.fillStyle = "#ff0000";
    g.fillRect(0, 0, 16, 16);
    g.fillStyle = "#00ff00";
    g.fillRect(16, 0, 16, 16);
    return c.toDataURL().split(",")[1];
  });
  await page.go(url, "#/play/art");
  await page.locator("#gsprite").setInputFiles({
    name: "walk.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await page.waitForTimeout(200);
  await page.locator('[data-art="width"]').fill("16");
  await page.locator('[data-art="width"]').dispatchEvent("change");
  await page.locator('[data-art="frames"]').fill("2");
  await page.locator('[data-art="frames"]').dispatchEvent("change");
  ok(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("sil:gd:play:art")).art.frames === 2,
    ),
    "sprite sheet frames persist",
  );
  await page.reload();
  await page.waitForTimeout(250);
  ok(
    /32×16/.test(await page.locator("#gartstatus").innerText()),
    "PNG restored after reload",
  );
  section("pathfinding, AI, shaders and performance");
  await page.go(url, "#/play/path");
  await page.locator("#pstep").click();
  ok(
    Number(await page.locator("#toolcanvas").getAttribute("data-expanded")) ===
      1,
    "path search step expands one node",
  );
  await page.locator("#pcompare").click();
  ok(
    (await page.locator("#pcomparison tr").count()) === 4,
    "all three search strategies compared",
  );
  await page.go(url, "#/play/ai");
  await page.locator("#aihealth").fill("10");
  await page.locator("#aihealth").dispatchEvent("input");
  ok(
    (await page.locator("#toolcanvas").getAttribute("data-action")) === "flee",
    "low health changes AI state",
  );
  await page.locator("#aimode").selectOption("tree");
  ok(
    /lowHealth → flee/.test(await page.locator("#aitrace").innerText()),
    "behaviour tree shows active branch",
  );
  await page.locator("#aidefinition").fill("{}");
  await page.locator("#aiapply").click();
  ok(
    /thresholds/.test(await page.locator("#aierror").innerText()),
    "invalid AI definition rejected",
  );
  await page.go(url, "#/play/shader");
  ok(
    /Compiled successfully|unavailable/.test(
      await page.locator("#serror").innerText(),
    ),
    "shader compiled or unsupported device explained",
  );
  if (/Compiled successfully/.test(await page.locator("#serror").innerText())) {
    await page.locator("#scode").fill("not a shader");
    await page.locator("#scompile").click();
    ok(
      /ERROR|error/i.test(await page.locator("#serror").innerText()),
      "shader compiler returns real errors",
    );
    await page.locator("#sexample").selectOption("wave");
    ok(
      /Compiled successfully/.test(await page.locator("#serror").innerText()),
      "valid effect restores after compile error",
    );
  }
  await page.go(url, "#/play/performance");
  await page.locator("#fpause").click();
  await page.locator("#fbenchmark").click();
  ok(
    /same overlaps/.test(await page.locator("#fresults").innerText()),
    "collision benchmark agrees on results",
  );
  ok(
    (await page.locator("#fresults tr").count()) === 3,
    "measured benchmark compares strategies",
  );
  section("code repair scenarios");
  for (const id of ["damage", "stuck", "saves"]) {
    await page.go(url, "#/debug/" + id);
    await page.locator("#debugrepro").click();
    await page.waitForTimeout(200);
    ok(
      /✗/.test(await page.locator("#debugresult").innerText()),
      id + " broken version reproduced",
    );
    const source = await page.evaluate(
      (id) => GAME_DEBUG_CASES[id].solution,
      id,
    );
    await page.locator("#debugcode").fill(source);
    await page.locator("#debugrun").click();
    await page.waitForTimeout(200);
    ok(
      /Repair verified/.test(await page.locator("#debugresult").innerText()),
      id + " repair verified and saved",
    );
  }
  section("real game kata harness and timeout");
  for (const id of await page.evaluate(() => GAME_KATAS.map((k) => k.id))) {
    await page.go(url, "#/game-kata/" + id, 100);
    await page.locator("#gkrun").click();
    await page.waitForTimeout(150);
    ok(
      !/All tests passed/.test(await page.locator("#gkresult").innerText()),
      id + " starter fails",
    );
    const solution = await page.evaluate(
      (id) => GAME_KATAS.find((k) => k.id === id).solution,
      id,
    );
    await page.locator("#gkcode").fill(solution);
    await page.locator("#gkrun").click();
    await page.waitForTimeout(200);
    ok(
      /All tests passed/.test(await page.locator("#gkresult").innerText()),
      id + " reference passes browser worker",
    );
  }
  await page
    .locator("#gkcode")
    .fill("function smoothCamera(){ while(true){} }");
  await page.locator("#gkrun").click();
  await page.waitForTimeout(2200);
  ok(
    /Stopped after 2 seconds/.test(await page.locator("#gkresult").innerText()),
    "infinite loop worker terminates",
  );
  section("projects and standalone export");
  for (const id of ["pong", "breakout", "platformer", "arena"]) {
    await page.go(url, "#/project/" + id);
    ok((await page.locator("#projectcanvas").count()) === 1, id + " playable");
    ok(
      await page.locator('[data-stage="1"]').isDisabled(),
      id + " later checkpoint gated",
    );
  }
  await page.go(url, "#/project/arena");
  await page.locator("#projectcanvas").focus();
  await page.keyboard.down(" ");
  await page.waitForTimeout(1200);
  await page.keyboard.up(" ");
  ok(
    (await page.locator("#projectcanvas").getAttribute("data-hits")) >= 3,
    "arena firing reaches first checkpoint",
  );
  await page.locator("#jlearn").fill("Cooldown limits fire rate.");
  ok(
    !(await page.locator("#jcomplete").isDisabled()),
    "code pass, playable target and learning note allow completion",
  );
  await page.locator("#jcomplete").click();
  ok(
    !(await page.locator('[data-stage="1"]').isDisabled()),
    "checkpoint completion unlocks next stage",
  );
  const download = page.waitForEvent("download");
  await page.locator("#jexport").click();
  const exported = await download,
    file = "/tmp/game-lab-export.html";
  await exported.saveAs(file);
  const html = fs.readFileSync(file, "utf8");
  ok(
    html.includes("GameProjectRuntime") === false &&
      html.includes("function (canvas, kind") &&
      !html.includes('src="http'),
    "export embeds runtime without external dependencies",
  );
  const exportedPage = await newPage(browser);
  await exportedPage.goto("file://" + file);
  await exportedPage.waitForTimeout(200);
  ok(
    (await exportedPage.locator("canvas").getAttribute("data-hits")) !== null,
    "exported game runs from a local HTML file",
  );
  ok(
    exportedPage.errors.length === 0,
    "exported game has no errors " + JSON.stringify(exportedPage.errors),
  );
  await exportedPage.context().close();
  section("mobile workspaces");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "#/play",
    "#/play/mechanics",
    "#/play/path",
    "#/play/ai",
    "#/play/shader",
    "#/play/performance",
    "#/notebook",
    "#/game-kata/cooldown",
    "#/project/arena",
  ]) {
    await page.go(url, route, 100);
    ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route + " fits phone",
    );
  }
  const startX = Number(
    await page.locator("#projectcanvas").getAttribute("data-x"),
  );
  const touch = page.locator('[data-key="ArrowRight"]');
  const box = await touch.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.up();
  ok(
    Number(await page.locator("#projectcanvas").getAttribute("data-x")) >
      startX,
    "on-screen controls move player",
  );
  ok(page.errors.length === 0, "no page errors " + JSON.stringify(page.errors));
  await page.context().close();
}
