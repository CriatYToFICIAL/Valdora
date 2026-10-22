// Browser regression using the installed Chromium. No extra browser download is required.
// Traverses real UI; position is moved to interaction spots and later bake timers are accelerated.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const output = process.env.QA_OUTPUT || "/tmp/valdora-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text() + ' ' + m.location().url);
});
page.on('response',r=>{if(r.status()>=400)console.error('HTTP',r.status(),r.url());});
const snap = async (name) => page.screenshot({ path: `${output}/${name}.png` });
const value = async (fn) => page.evaluate(fn);
const reachable = async () => {
  const missing = await page.evaluate(() => {
    const g = window.valdora,
      step = 16;
    const start = g.state.place === "street" ? [304, 608] : [560, 640];
    const queue = [start],
      seen = new Set([start.join(",")]);
    for (let n = 0; n < queue.length; n++) {
      const [x, y] = queue[n];
      for (const [dx, dy] of [
        [step, 0],
        [-step, 0],
        [0, step],
        [0, -step],
      ]) {
        const nx = x + dx,
          ny = y + dy,
          key = nx + "," + ny;
        if (!seen.has(key) && !g.blocked(nx, ny)) {
          seen.add(key);
          queue.push([nx, ny]);
        }
      }
    }
    return g.map.spots
      .filter((s) => !queue.some(([x, y]) => Math.hypot(s.x - x, s.y - y) < 72))
      .map((s) => s.id);
  });
  assert.deepEqual(
    missing,
    [],
    "All interaction spots must be reachable around collisions",
  );
};
const drain = async () => {
  for (let n = 0; n < 20 && (await page.locator("#advance").count()); n++)
    await page.locator("#advance").click();
};
const at = async (id) => {
  await page.evaluate((id) => {
    const g = window.valdora;
    const spot = g.map.spots.find((s) => s.id === id);
    if (!spot) throw Error("Missing spot " + id);
    g.hero.setPosition(spot.x, spot.y + 6);
    g.cameras.main.centerOn(spot.x, spot.y);
    g.cameras.main.stopFollow();
  }, id);
  await page.keyboard.press("e");
  await page.waitForTimeout(100);
};
const door = async (id) => {
  const to = await page.evaluate(
    (id) => window.valdora.map.spots.find((s) => s.id === id).to,
    id,
  );
  await at(id);
  await page.waitForFunction(
    (to) => window.valdora.state.place === to && !window.valdora.transition,
    to,
  );
  await page.waitForTimeout(150);
  await reachable();
};
try {
  await page.goto(process.env.QA_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(() => !!window.valdora?.ui);
  await snap("01-menu");
  await page.locator("#new").click();
  await page.locator("#player-name").fill("Nina");
  await page.locator("#start").click();
  await page.locator("#wake").click();
  // Actual keyboard movement and collision, before accelerated spot-based regression.
  const initial = await value(() => window.valdora.hero.x);
  await page.keyboard.down("d");
  await page.waitForFunction((x) => window.valdora.hero.x > x + 30, initial);
  await page.keyboard.up("d");
  assert.ok((await value(() => window.valdora.hero.x)) > initial + 25);
  await page.evaluate(() => window.valdora.hero.setPosition(120, 400));
  await page.keyboard.down("a");
  await page.waitForTimeout(900);
  await page.keyboard.up("a");
  assert.ok((await value(() => window.valdora.hero.x)) >= 20);
  await door("to-pizzeria");
  await page.locator("#advance").click();
  await snap("02-arrival-dialogue");
  await drain();
  for (const id of [
    "caixa-1",
    "caixa-2",
    "caixa-3",
    "poeira-1",
    "poeira-2",
    "cadeira-1",
    "cadeira-2",
    "cozinha",
  ])
    await at(id);
  assert.equal(await value(() => window.valdora.state.cleaned.length), 8);
  await snap("03-cleaned");
  await at("book");
  await drain();
  await door("to-apartment");
  await at("bed");
  await page.locator("#sleep").click();
  assert.equal(await value(() => window.valdora.state.day), 2);
  await page.locator("#wake").click();
  for (let day = 2; day <= 7; day++) {
    await door("to-pizzeria");
    await drain();
    if (day === 4) {
      await door("to-street");
      await door("to-shop");
      await at("shop-counter");
      await page.locator("#buy-manjericao").click();
      await page.locator("#close").click();
      await door("to-street");
      await door("to-pizzeria");
      await page.reload();
      await page.locator("#continue").click();
      assert.equal(await value(() => window.valdora.state.day), 4);
      assert.equal(await value(() => window.valdora.state.bought), true);
    }
    if (day === 5) {
      await at("oven");
      await page.locator("#wire").click();
      assert.equal(await value(() => window.valdora.state.repairStep), 0);
      await page.locator("#off").click();
      await page.locator("#wire").click();
      await page.locator("#on").click();
      await drain();
      assert.equal(await value(() => window.valdora.state.repaired), true);
    }
    if (day === 6) {
      await at("upgrade");
      await page.locator("#purchase-upgrade").click();
      await page.locator("#close").click();
      assert.equal(await value(() => window.valdora.state.upgrade), true);
    }
    const quota = [0, 1, 3, 4, 4, 5, 3][day - 1];
    for (let n = 0; n < quota; n++) {
      const order = await value(() => window.valdora.state.order);
      assert.ok(order, "Customer spawned");
      await at(order.person);
      await drain();
      assert.equal(
        await value(() => window.valdora.state.order.accepted),
        true,
      );
      await at("bench");
      await page.locator(`#recipe-${order.recipe}`).click();
      for (const i of [
        "massa",
        "molho",
        "queijo",
        ...(order.recipe === "margherita"
          ? ["manjericao"]
          : order.recipe === "calabresa"
            ? ["calabresa"]
            : []),
      ])
        await page.locator(`#add-${i}`).click();
      if (day === 2) await snap("04-pizza-assembly");
      await page.locator("#assemble").click();
      await at("oven");
      await page.locator("#oven-action").click();
      if (day === 2) {
        await page.waitForFunction(
          () => window.valdora.state.pizza.seconds >= 16.1,
          {},
          { timeout: 120000 },
        );
        await snap("05-oven-green");
      } else
        await page.evaluate(() => {
          window.valdora.state.pizza.seconds = window.valdora.state.upgrade
            ? 10
            : 17;
        });
      await page.locator("#oven-action").click();
      assert.equal(
        await value(() => window.valdora.state.pizza.quality),
        "perfeita",
      );
      await at(order.person);
      await drain();
      assert.equal(await value(() => window.valdora.state.dailyServed), n + 1);
    }
    console.log(
      `Day ${day}: ${quota} orders, money R$ ${await value(() => window.valdora.state.money)}`,
    );
    if (day < 7) {
      await door("to-apartment");
      await at("bed");
      await page.locator("#sleep").click();
      await page.locator("#wake").click();
    } else {
      await snap("06-celebration");
      await at("book");
      await drain();
      assert.equal(await value(() => window.valdora.state.complete), true);
      await snap("07-conclusion");
    }
  }
  assert.equal(await value(() => window.valdora.state.sold), 20);
  assert.equal(errors.length, 0, errors.join("\n"));
  await page.reload();
  await page.locator("#continue").click();
  assert.ok(await page.locator(".ending").isVisible());
  console.log(
    "PASS: 7 days, 20 pizzas, cleaning, portraits, shop, repair, upgrade, save/reload, conclusion.",
  );
  console.log("Screenshots:", output);
} catch (error) {
  console.error("Browser errors:", errors);
  console.error(
    "UI state:",
    await page
      .evaluate(() => ({
        mode: window.valdora?.ui.mode,
        place: window.valdora?.state.place,
        day: window.valdora?.state.day,
        hero: [window.valdora?.hero.x, window.valdora?.hero.y],
      }))
      .catch(() => null),
  );
  await snap("failure").catch(() => {});
  throw error;
} finally {
  await browser.close();
}
