// Supplemental rendering checks. Scene positions/time are staged deliberately;
// this script does not stand in for the full narrative browser regression.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const output = process.env.QA_OUTPUT || "/tmp/valdora-visual-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(r.status() + " " + r.url());
});
try {
  await page.goto(process.env.QA_URL || "http://127.0.0.1:5180");
  await page.click("#new");
  await page.click("#start");
  await page.click("#wake");
  const places = [
    "street",
    "pizzeria",
    "apartment",
    "shop",
    "rosaHome",
    "florist",
    "workshop",
  ];
  for (const place of places) {
    const counts = await page.evaluate((place) => {
      const g = window.valdora;
      g.ui.close();
      g.state.day = 4;
      g.state.introduced = [1, 2, 3, 4];
      g.state.book = true;
      g.state.place = place;
      g.state.x = 320;
      g.state.y = 448;
      g.drawWorld();
      g.update(0, 16);
      return ["rosa", "lia", "daniel"].map((id) => ({
        id,
        count: g.children.list.filter(
          (c) => c.type === "Sprite" && c.texture.key.startsWith(id + "-"),
        ).length,
        expected: g.state.npcs[id].place === place ? 1 : 0,
      }));
    }, place);
    for (const c of counts)
      assert.equal(c.count, c.expected, place + "/" + c.id);
  }
  for (const [hour, name] of [
    [12, "daylight"],
    [18, "sunset"],
    [23, "night"],
    [3, "dawn"],
  ]) {
    await page.evaluate((hour) => {
      const g = window.valdora;
      g.state.place = "street";
      g.state.x = 624;
      g.state.y = 560;
      g.state.minute = hour * 60;
      g.drawWorld();
      g.cameras.main.stopFollow();
      g.cameras.main.centerOn(600, 630);
      for (let i = 0; i < 15; i++) g.update(0, 16);
    }, hour);
    await page.waitForTimeout(180);
    await page.screenshot({ path: `${output}/${name}.png` });
  }
  const mask = await page.evaluate(() => {
    const ctx = window.valdora.heroShadow.texture.context,
      data = ctx.getImageData(0, 0, 64, 64).data;
    let opaque = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) opaque++;
    return opaque;
  });
  assert.ok(
    mask > 20 && mask < 2000,
    "Shadow uses the sprite silhouette rather than an opaque rectangle",
  );
  await page.evaluate(() => {
    const g = window.valdora;
    g.state.place = "pizzeria";
    g.state.minute = 23 * 60;
    g.state.x = 352;
    g.state.y = 344;
    g.state.cleaned = [
      "caixa-1",
      "caixa-2",
      "caixa-3",
      "poeira-1",
      "poeira-2",
      "cadeira-1",
      "cadeira-2",
      "cozinha",
    ];
    g.drawWorld();
    for (let i = 0; i < 10; i++) g.update(0, 16);
  });
  await page.waitForTimeout(180);
  await page.screenshot({ path: output + "/interior-night.png" });
  assert.equal(
    await page.evaluate(() =>
      ["interiors", "rooms", "village"].some((k) =>
        window.valdora.textures.exists(k),
      ),
    ),
    false,
  );
  // Verify the final production build through the Python-only launcher.
  await page.goto("http://127.0.0.1:8000");
  await page.click("#new");
  await page.fill("#player-name", "Sol");
  await page.click("#start");
  await page.click("#wake");
  await page.locator(".time-hud").waitFor();
  assert.equal(await page.evaluate(() => window.valdora), undefined);
  const start = await page.evaluate(
    () => JSON.parse(localStorage.getItem("valdora.week.v2")).x,
  );
  await page.keyboard.down("d");
  await page.waitForTimeout(1200);
  await page.keyboard.up("d");
  await page.keyboard.press("i");
  await page.locator(".journal-grid").waitFor();
  await page.keyboard.press("Escape");
  assert.ok(
    (await page.evaluate(
      () => JSON.parse(localStorage.getItem("valdora.week.v2")).x,
    )) > start,
  );
  await page.reload();
  await page.click("#continue");
  await page.locator(".time-hud").waitFor();
  assert.deepEqual(errors, []);
  await writeFile(
    output + "/result.json",
    JSON.stringify(
      {
        passed: true,
        rendererIdentityChecks: 7,
        silhouettePixels: mask,
        productionLauncher: "Python 3 stdlib",
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: seven-map renderer identity, silhouette mask, day/night captures, Python production launcher, keyboard and save/reload.",
  );
} catch (e) {
  console.error(errors);
  await page.screenshot({ path: output + "/failure.png" }).catch(() => {});
  throw e;
} finally {
  await browser.close();
}
