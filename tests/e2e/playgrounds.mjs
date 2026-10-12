import fs from "node:fs";
import {spawnSync} from "node:child_process";
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
  section("native repair scenarios");
  for (const id of ["damage", "stuck", "saves"]) {
    await page.go(url, "#/debug/" + id);
    await page.locator('#gklanguage').waitFor();
    ok(await page.evaluate(id => location.hash === '#/game-kata/debug-' + id, id), id + ' repair opens native exercise');
    ok(await page.locator('#debugcode').count() === 0, id + ' repair uses native code editor');
    await page.locator('#gksolution').click();
    ok(await page.locator('#gkref').isVisible(), id + ' native repair reference available');
  }
  section("native game katas");
  for (const id of await page.evaluate(() => GAME_KATAS.map((k) => k.id))) {
    await page.go(url, '#/game-kata/' + id, 100);
    for (const lang of ['c','zig','cpp']) {
      await page.locator('#gklanguage').selectOption(lang);
      await page.waitForTimeout(400);
      const download = page.waitForEvent('download'); await page.locator('#gkdownload').click(); const file = await download;
      ok(file.suggestedFilename() === id + '.' + (lang === 'cpp' ? 'cpp' : lang), id + '/' + lang + ' file downloadable');
      const text = fs.readFileSync(await file.path(), 'utf8'); ok(text.includes('Tests') && (lang === 'zig' ? text.includes('std.testing') : text.includes('int main')), id + '/' + lang + ' download contains real tests');
    }
    await page.locator('#gkpass').click();
    ok((await page.locator('#gkresult').textContent()).includes('local pass recorded'), id + ' local completion recorded');
  }
  await page.go(url, '#/katas'); ok(await page.locator('#gklanguage').count() === 0 && /Game katas/.test(await page.locator('h1').textContent()), 'Dev Lab katas entry opens native catalog');
  section("full native catalog");
  await page.locator('#gkgroup').selectOption('catalog');
  ok(await page.locator('#gklist .dcard').count() === 139, 'all 139 catalog exercises listed');
  await page.locator('#gkfilter').fill('Alphametics');
  ok(await page.locator('#gklist .dcard').count() === 1, 'catalog search narrows exercises');
  await page.go(url, '#/kata/alphametics');
  await page.locator('#gklanguage').waitFor();
  ok(await page.locator('h1').textContent() === 'Alphametics', 'legacy kata links open native exercises');
  const nativeRequests = [];
  page.on('request', request => nativeRequests.push(request.url()));
  for (const lang of ['c', 'zig', 'cpp']) {
    await page.locator('#gklanguage').selectOption(lang);
    await page.waitForFunction(lang => document.querySelector('#gklanguage')?.value === lang && document.querySelector('#gkcode'), lang);
    await page.locator('#gkcode').fill('// draft for ' + lang);
    await page.waitForTimeout(400);
    const pending = page.waitForEvent('download');
    await page.locator('#gkdownload').click();
    const download = await pending;
    ok(download.suggestedFilename() === 'alphametics-' + lang + '.zip', lang + ' full project ZIP downloadable');
    const result = spawnSync('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; names=z.namelist(); assert "LICENSE" in names and "README.md" in names and "INSTRUCTIONS.md" in names; assert any("test" in n for n in names); assert any("draft for " in z.read(n).decode() for n in names); assert "Alphametics" in z.read("README.md").decode()', await download.path()], {encoding:'utf8'});
    ok(result.status === 0, lang + ' ZIP contains edited source, tests, instructions and license');
  }
  await page.locator('#gklanguage').selectOption('c');
  await page.waitForFunction(() => document.querySelector('#gkcode')?.value === '// draft for c');
  ok(await page.locator('#gkcode').inputValue() === '// draft for c', 'language-specific drafts restored');
  ok(!nativeRequests.some(url => url.includes('/katas/python/')), 'native exercises load native source bundles');
  await page.locator('#gkfile').selectOption('exercise.h');
  const header = await page.locator('#gkcode').inputValue();
  await page.locator('#gkcode').fill(header + '\n// header draft');
  await page.locator('#gkfile').selectOption('exercise.c');
  ok(await page.locator('#gkcode').inputValue() === '// draft for c', 'switching files preserves source draft');
  await page.locator('#gkfile').selectOption('exercise.h');
  ok((await page.locator('#gkcode').inputValue()).endsWith('// header draft'), 'switching files preserves header draft');
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
