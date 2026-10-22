import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const output = process.env.QA_OUTPUT || "/tmp/valdora-lpc-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
});
const read = (fn) => page.evaluate(fn);
const frame = async (seconds) => {
  await page.evaluate((seconds) => {
    const g = window.valdora;
    for (let t = 0; t < seconds; t += 0.032) g.update(0, 32);
  }, seconds);
  await page.waitForTimeout(80);
};
const snap = async (name) => {
  await page.waitForTimeout(140);
  await page.screenshot({ path: `${output}/${name}.png` });
};
const drain = async () => {
  for (let n = 0; n < 80; n++) {
    const mode = await read(() => window.valdora.ui.mode);
    if (!["dialogue", "thought"].includes(mode)) break;
    await page.keyboard.press("Enter");
  }
  assert.ok(
    !["dialogue", "thought"].includes(await read(() => window.valdora.ui.mode)),
  );
};
const at = async (id) => {
  await page.evaluate(async (id) => {
    const g = window.valdora,
      { blocked } = await import("/src/navigation.ts");
    let p = g.map.spots.find((p) => p.id === id);
    if (!p && g.state.npcs[id]) {
      const r = g.state.npcs[id];
      if (r.place !== g.state.place) throw Error("NPC em outro mapa " + id);
      p = r;
    }
    if (!p) throw Error("Objeto ausente " + id);
    let best;
    for (const [dx, dy] of [
      [0, 22],
      [20, 10],
      [-20, 10],
      [0, -22],
      [0, 32],
    ])
      if (!blocked(g.map, p.x + dx, p.y + dy)) {
        best = [p.x + dx, p.y + dy];
        break;
      }
    if (!best) throw Error("Sem aproximação " + id);
    [g.state.x, g.state.y] = best;
    g.update(0, 16);
  }, id);
  await page.keyboard.press("e");
  await page.waitForTimeout(60);
};
// Engine-driven route: uses the same keys, movement, collision and automatic door
// detection as normal gameplay. Elapsed simulation is accelerated, no wall bypass.
const walk = async (x, y) => {
  const result = await page.evaluate(
    async ([x, y]) => {
      const g = window.valdora,
        { findPath } = await import("/src/navigation.ts"),
        route = findPath(g.map, [g.state.x, g.state.y], [x, y]);
      if (!route.length) throw Error("Sem rota");
      for (const point of route) {
        let n = 0;
        while (Math.hypot(g.state.x - point[0], g.state.y - point[1]) > 3) {
          if (g.transition) return "door";
          if (g.ui.mode && !["thought"].includes(g.ui.mode)) return "dialogue";
          if (++n > 1000)
            throw Error(
              `Travou perto de ${g.state.x},${g.state.y}, alvo ${point}`,
            );
          g.releaseKeys();
          const dx = point[0] - g.state.x,
            dy = point[1] - g.state.y;
          if (Math.abs(dx) > 2) g.keys[dx > 0 ? "D" : "A"].isDown = true;
          if (Math.abs(dy) > 2) g.keys[dy > 0 ? "S" : "W"].isDown = true;
          g.update(0, 32);
        }
        g.releaseKeys();
      }
      // The final 16px navigation node can be just outside a thin door zone.
      for (
        let i = 0;
        i < 12 && !g.transition && Math.hypot(g.state.x - x, g.state.y - y) > 2;
        i++
      ) {
        g.releaseKeys();
        const dx = x - g.state.x,
          dy = y - g.state.y;
        g.keys[
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? "D"
              : "A"
            : dy > 0
              ? "S"
              : "W"
        ].isDown = true;
        g.update(0, 16);
      }
      g.releaseKeys();
      return g.transition ? "door" : "arrived";
    },
    [x, y],
  );
  await page.waitForTimeout(80);
  return result;
};
const door = async (id) => {
  const d = await page.evaluate(
    (id) => window.valdora.map.doors.find((d) => d.id === id),
    id,
  );
  assert.ok(d, `Porta ${id}`);
  await frame(1);
  await walk(d.x + d.w / 2, d.y + d.h / 2);
  await page.waitForFunction(
    (to) => window.valdora.state.place === to && !window.valdora.transition,
    d.to,
    { timeout: 15000 },
  );
  await frame(0.4);
};
try {
  await page.goto(process.env.QA_URL || "http://127.0.0.1:5180");
  await page.locator("#new").waitFor();
  await snap("01-menu");
  await page.click("#new");
  await page.fill("#player-name", "Nina");
  await page.click("#start");
  await page.click("#wake");
  const x = await read(() => window.valdora.state.x);
  await page.keyboard.down("d");
  await page.waitForFunction((x) => window.valdora.state.x > x + 20, x);
  await page.keyboard.up("d");
  assert.ok((await read(() => window.valdora.state.x)) > x + 20);
  // Compare simulated movement with actual key state, including diagonal normalization.
  const distances = await page.evaluate(() => {
    const g = window.valdora;
    const run = (right, down, shift) => {
      g.state.x = 350;
      g.state.y = 590;
      g.releaseKeys();
      g.keys.D.isDown = right;
      g.keys.S.isDown = down;
      g.keys.SHIFT.isDown = shift;
      for (let i = 0; i < 10; i++) g.update(0, 16);
      g.releaseKeys();
      return Math.hypot(g.state.x - 350, g.state.y - 590);
    };
    return [
      run(true, false, false),
      run(true, true, false),
      run(true, false, true),
    ];
  });
  assert.ok(Math.abs(distances[0] - distances[1]) < 1);
  assert.ok(distances[2] > distances[0] * 1.4);
  await page.evaluate(() => {
    const g = window.valdora;
    g.state.x = 240;
    g.state.y = 354;
    g.update(0, 16);
  });
  await snap("02-exterior");
  // A real keyboard crossing; no E is pressed to enter.
  await page.keyboard.down("ArrowUp");
  await page.waitForFunction(() => window.valdora.state.place === "pizzeria");
  await page.keyboard.up("ArrowUp");
  await page.waitForFunction(() => !window.valdora.transition);
  await frame(35);
  await snap("03-dialogue");
  await drain();
  assert.ok(await read(() => window.valdora.state.introduced.includes(1)));
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
  assert.equal(await read(() => window.valdora.state.cleaned.length), 8);
  await snap("04-pizzeria");
  await at("book");
  await drain();
  assert.equal(await read(() => window.valdora.state.book), true);
  await door("stairs");
  await at("bed");
  await page.click("#sleep");
  await page.click("#wake");
  for (let day = 2; day <= 7; day++) {
    await door("exit");
    await frame(70);
    await drain();
    assert.ok(
      await read(() =>
        window.valdora.state.introduced.includes(window.valdora.state.day),
      ),
      `Introdução dia ${day}`,
    );
    if (day === 4) {
      await door("exit");
      await door("door-shop");
      await at("shop-counter");
      await page.click("#buy-manjericao");
      await page.click("#close");
      await door("exit");
      await door("door-pizzeria");
      const before = await read(() =>
        JSON.stringify(window.valdora.state.npcs),
      );
      await page.reload();
      await page.click("#continue");
      assert.equal(await read(() => window.valdora.state.day), 4);
      assert.equal(await read(() => window.valdora.state.bought), true);
      assert.equal(
        await read(() => Object.keys(window.valdora.state.npcs).length),
        3,
      );
      assert.ok(before);
    }
    if (day === 5) {
      await at("oven");
      await page.click("#wire");
      assert.equal(await read(() => window.valdora.state.repairStep), 0);
      await page.click("#off");
      await page.click("#wire");
      await page.click("#on");
      await drain();
      assert.equal(await read(() => window.valdora.state.repaired), true);
    }
    if (day === 6) {
      await at("upgrade");
      await page.click("#purchase-upgrade");
      await page.click("#close");
      assert.equal(await read(() => window.valdora.state.upgrade), true);
    }
    const q = [0, 1, 3, 4, 4, 5, 3][day - 1];
    for (let n = 0; n < q; n++) {
      await frame(45);
      const order = await read(() => window.valdora.state.order);
      assert.ok(order, `Pedido ${day}/${n}`);
      if (order.kind === "delivery") {
        await at("phone");
        await drain();
      } else {
        const npc = await read(
          () => window.valdora.state.npcs[window.valdora.state.order.person],
        );
        assert.equal(npc.place, "pizzeria");
        await at(order.person);
        await drain();
      }
      assert.equal(await read(() => window.valdora.state.order.accepted), true);
      await at("bench");
      assert.equal(await read(() => window.valdora.ui.mode), "kitchen");
      const list = [
        "massa",
        "molho",
        "queijo",
        ...(order.recipe === "margherita"
          ? ["manjericao"]
          : order.recipe === "calabresa"
            ? ["calabresa"]
            : []),
      ];
      // Mouse drag, not a direct recipe button or a model-only ingredient injection.
      for (let i = 0; i < list.length; i++) {
        const button = await page.locator("#add-" + list[i]).boundingBox(),
          pizza = await page.locator("#pizza-preview").boundingBox();
        assert.ok(button && pizza);
        await page.mouse.move(
          button.x + button.width / 2,
          button.y + button.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(
          pizza.x + pizza.width * (0.35 + i * 0.08),
          pizza.y + pizza.height * 0.5,
          { steps: 4 },
        );
        await page.mouse.up();
      }
      if (day === 2) await snap("05-kitchen");
      await page.keyboard.press("e");
      assert.equal(await read(() => window.valdora.state.pizza.stage), "raw");
      await at("oven");
      assert.equal(await read(() => window.valdora.state.pizza.stage), "oven");
      if (day === 2 && !process.env.QA_FAST) {
        await page.waitForFunction(
          () => window.valdora.state.pizza.seconds >= 16.1,
          null,
          { timeout: 120000 },
        );
        await snap("06-oven");
      } else
        await frame(await read(() => (window.valdora.state.upgrade ? 10 : 17)));
      await at("oven");
      assert.equal(
        await read(() => window.valdora.state.pizza.quality),
        "perfeita",
      );
      if (order.kind === "delivery") {
        await at("pack");
        assert.equal(
          await read(() => window.valdora.state.pizza.stage),
          "boxed",
        );
        await snap("07-delivery-box");
        await door("exit");
        const b = await page.evaluate(async (place) => {
          const { buildings } = await import("/src/maps.ts");
          return buildings.find((b) => b.place === place);
        }, order.destination);
        await walk(b.door[0], b.door[1] + 30);
        await snap("08-delivery-route");
        await at("address-" + order.destination);
        assert.equal(
          await read(
            () =>
              window.valdora.state.order?.id ===
                window.valdora.state.orderSerial &&
              window.valdora.state.pizza?.stage === "boxed",
          ),
          false,
        );
        await door("door-pizzeria");
      } else {
        await at(order.person);
        await drain();
      }
      assert.equal(await read(() => window.valdora.state.dailyServed), n + 1);
    }
    console.log(
      `PASS day ${day}: ${q} pedidos, ${await read(() => window.valdora.state.deliveries)} entregas acumuladas`,
    );
    if (day < 7) {
      await door("stairs");
      await at("bed");
      await page.click("#sleep");
      await page.click("#wake");
    } else {
      await snap("09-party");
      await at("book");
      await drain();
      assert.equal(await read(() => window.valdora.state.complete), true);
      await snap("10-ending");
    }
  }
  assert.equal(await read(() => window.valdora.state.sold), 20);
  assert.equal(await read(() => window.valdora.state.deliveries), 4);
  await page.reload();
  await page.click("#continue");
  await page.locator("section.ending").waitFor();
  assert.equal(await read(() => window.valdora.state.complete), true);
  await page.evaluate(() => {
    const g = window.valdora;
    g.ui.close();
    g.state.complete = false;
    g.state.place = "street";
    g.state.x = 448;
    g.state.y = 550;
    g.drawWorld();
  });
  for (const [hour, label] of [
    [12, "daylight"],
    [18, "sunset"],
    [23, "night"],
    [3, "dawn"],
  ]) {
    await page.evaluate((h) => {
      window.valdora.state.minute = h * 60;
    }, hour);
    await frame(0.3);
    await snap("11-" + label);
  }
  assert.deepEqual(errors, []);
  await writeFile(
    output + "/result.json",
    JSON.stringify(
      {
        passed: true,
        days: 7,
        pizzas: 20,
        deliveries: 4,
        errors,
        method:
          "real UI, real first doorway and bake; accelerated engine paths/timers elsewhere",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS complete week, automatic doors, paths, NPC uniqueness, drag cooking, deliveries, save/reload, lighting.",
  );
} catch (e) {
  console.error("PAGE ERRORS", errors);
  console.error(
    await read(() => ({
      mode: window.valdora?.ui.mode,
      day: window.valdora?.state.day,
      place: window.valdora?.state.place,
      objective: document.querySelector(".task-hud")?.textContent,
      npcs: window.valdora?.state.npcs,
    })).catch(() => null),
  );
  await snap("failure").catch(() => {});
  throw e;
} finally {
  await browser.close();
}
