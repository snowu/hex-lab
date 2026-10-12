import { newPage } from "./helpers.mjs";
export default async function ({ url, browser, ok }) {
  const p = await newPage(browser);
  await p.goto(url);
  await p.evaluate(() => localStorage.setItem("sil:mode", '"gamedev"'));
  await p.reload();
  await p.go(url, "#/play/shader");
  ok(
    (await p.locator("#serror").textContent()).includes(
      "Compiled successfully",
    ),
    "real WebGL shader compiles",
  );
  const pixel = () =>
    p.evaluate(() => {
      const g = document.querySelector("#toolcanvas").getContext("webgl");
      const data = new Uint8Array(4);
      g.readPixels(320, 192, 1, 1, g.RGBA, g.UNSIGNED_BYTE, data);
      return [...data];
    });
  await p.locator("#samount").fill("0");
  await p.waitForTimeout(100);
  const base = await pixel();
  await p.locator("#samount").fill("1");
  await p.waitForTimeout(100);
  const flash = await pixel();
  ok(
    flash[0] > base[0] && flash[1] > base[1] && flash[2] >= base[2],
    "uniform changes rendered pixel colours",
  );
  await p.locator("#scode").fill("broken shader");
  await p.locator("#scompile").click();
  ok(
    /ERROR/.test(await p.locator("#serror").textContent()),
    "actual compiler error shown",
  );
  await p.waitForTimeout(100);
  ok(
    JSON.stringify(await pixel()) === JSON.stringify(flash),
    "compile failure keeps last working shader",
  );
  for (const effect of ["dissolve", "wave"]) {
    await p.locator("#sexample").selectOption(effect);
    ok(
      (await p.locator("#serror").textContent()).includes(
        "Compiled successfully",
      ),
      effect + " compiles",
    );
  }
  await p.locator("#tsave").click();
  ok(
    (await p.locator("#tsaved").textContent()).includes("Saved"),
    "WebGL screenshot saved in notebook",
  );
  await p.screenshot({ path: "/tmp/game-lab-shader.png", fullPage: true });
  ok(
    p.errors.length === 0,
    "shader has no browser errors " + JSON.stringify(p.errors),
  );
  await p.context().close();
}
