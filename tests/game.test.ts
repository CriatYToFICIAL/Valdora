import test from "node:test";
import assert from "node:assert/strict";
import { recipes, type Ingredient } from "../src/data";
import {
  addIngredient,
  bake,
  beginPizza,
  buy,
  canSleep,
  cleaning,
  discard,
  finishAssembly,
  fresh,
  introDone,
  load,
  nextDay,
  ovenTime,
  quota,
  rescue,
  save,
  serve,
  startOrder,
  takePizza,
  tick,
  SAVE_KEY,
} from "../src/state";

test("a semana completa pode ser concluída, inclusive com forno melhorado e compras", () => {
  const s = fresh("João");
  introDone(s);
  assert.equal(canSleep(s), false);
  s.cleaned = [...cleaning];
  s.book = true;
  let sales = 0;
  for (let day = 2; day <= 7; day++) {
    assert.equal(nextDay(s), true);
    assert.equal(s.day, day);
    assert.equal(s.dailyServed, 0);
    introDone(s);
    if (day === 4) {
      assert.equal(buy(s, "manjericao"), null);
      assert.ok(s.unlocked.includes("margherita"));
    }
    if (day === 5) {
      s.repaired = true;
      s.repairStep = 3;
      assert.ok(s.unlocked.includes("calabresa"));
    }
    if (day === 6) {
      assert.ok(s.money >= 80);
      s.money -= 80;
      s.upgrade = true;
      assert.equal(ovenTime(s), 9);
    }
    while (s.dailyServed < quota(s)) {
      startOrder(s);
      assert.ok(s.order);
      s.order!.accepted = true;
      const r = s.order!.recipe;
      assert.equal(beginPizza(s, r), null);
      for (const i of recipes[r].items) {
        if (!s.inventory[i]) assert.equal(rescue(s), null);
        assert.equal(addIngredient(s, i), null);
      }
      assert.equal(finishAssembly(s), null);
      assert.equal(bake(s), null);
      tick(s, ovenTime(s) + 1);
      assert.equal(takePizza(s), null);
      assert.equal(s.pizza?.quality, "perfeita");
      s.place = "pizzeria";
      if (s.order!.kind === "delivery") {
        s.pizza!.stage = "boxed";
        s.place = s.order!.destination!;
      }
      const result = serve(s);
      assert.ok(result.amount! > 0);
      assert.equal(result.error, undefined);
      sales++;
    }
    assert.equal(canSleep(s), day < 7);
  }
  assert.equal(s.sold, 20);
  assert.equal(s.customers, sales);
  assert.equal(s.perfect, 20);
  assert.equal(s.deliveries, 4);
  assert.ok(s.earned > 500);
  assert.equal(nextDay(s), false);
});
test("receitas exigem ingredientes exatos e montagem devolve ingredientes ao recomeçar", () => {
  const s = fresh("A");
  const before = { ...s.inventory };
  beginPizza(s, "queijo");
  addIngredient(s, "queijo");
  assert.match(finishAssembly(s)!, /ingredientes/);
  assert.match(addIngredient(s, "queijo")!, /já/);
  addIngredient(s, "calabresa");
  discard(s);
  assert.deepEqual(s.inventory, before);
  beginPizza(s, "queijo");
  for (const i of ["massa", "molho", "queijo", "manjericao"] as Ingredient[])
    addIngredient(s, i);
  assert.ok(finishAssembly(s));
});
test("forno distingue cru, perfeito e queimado; pedido errado não some", () => {
  for (const [seconds, quality] of [
    [5, "crua"],
    [16, "perfeita"],
    [25, "perfeita"],
    [26, "queimada"],
  ] as const) {
    const s = fresh("A");
    s.place = "pizzeria";
    s.day = 3;
    introDone(s);
    s.order!.accepted = true;
    s.order!.recipe = "queijo";
    beginPizza(s, "queijo");
    recipes.queijo.items.forEach((i) => addIngredient(s, i));
    finishAssembly(s);
    bake(s);
    tick(s, seconds);
    takePizza(s);
    assert.equal(s.pizza!.quality, quality);
    const r = serve(s);
    assert.ok(r.amount! > 0);
    assert.equal(s.dailyServed, 1);
  }
  const s = fresh("A");
  s.place = "pizzeria";
  s.day = 4;
  introDone(s);
  s.place = s.order!.destination!;
  s.order!.accepted = true;
  s.pizza = {
    recipe: "queijo",
    items: [],
    stage: "ready",
    seconds: 20,
    quality: "perfeita",
  };
  assert.match(serve(s).error!, /Margherita/);
  assert.ok(s.pizza);
  assert.ok(s.order);
});
test("falência, relógio tarde e defeito não tornam a semana impossível", () => {
  const s = fresh("A");
  s.day = 4;
  introDone(s);
  s.money = 0;
  for (const i of Object.keys(s.inventory) as Ingredient[]) s.inventory[i] = 0;
  assert.match(buy(s, "massa")!, /insuficiente/);
  assert.equal(rescue(s), null);
  assert.equal(s.bought, true);
  for (const i of recipes[s.order!.recipe].items) assert.ok(s.inventory[i] > 0);
  tick(s, 100000);
  assert.equal(s.minute, 1770);
  s.day = 5;
  beginPizza(s, "queijo");
  recipes.queijo.items.forEach((i) => addIngredient(s, i));
  finishAssembly(s);
  assert.match(bake(s)!, /conserto/);
  s.repaired = true;
  assert.equal(bake(s), null);
});
test("salva e restaura inventário, forno, narrativa e progresso; save corrompido é ignorado", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      setItem: (k: string, v: string) => values.set(k, v),
      getItem: (k: string) => values.get(k) || null,
    },
    configurable: true,
  });
  const s = fresh("Luz");
  s.day = 5;
  s.cleaned = [...cleaning];
  s.book = true;
  s.upgrade = true;
  introDone(s);
  s.repaired = true;
  beginPizza(s, "calabresa");
  recipes.calabresa.items.forEach((i) => addIngredient(s, i));
  finishAssembly(s);
  bake(s);
  tick(s, 6);
  assert.equal(save(s), true);
  assert.deepEqual(load(), s);
  const restored = load()!;
  tick(restored, 4);
  takePizza(restored);
  assert.equal(restored.pizza!.quality, "perfeita");
  values.set(SAVE_KEY, '{"version":1,"day":99}');
  assert.equal(load(), null);
  values.set(SAVE_KEY, "broken");
  assert.equal(load(), null);
});
