import test from "node:test";
import assert from "node:assert/strict";
import { buildings, describeMap } from "../src/maps";
import { blocked, findPath, slide } from "../src/navigation";
import {
  fresh,
  introDone,
  save,
  load,
  SAVE_KEY,
  startOrder,
  beginPizza,
  addIngredient,
  finishAssembly,
  bake,
  tick,
  takePizza,
  serve,
} from "../src/state";
import { ids, targetFor, updateResidents } from "../src/actors";
import { atmosphere } from "../src/lighting";
import { recipes, type Place } from "../src/data";
const places: Place[] = [
  "street",
  "pizzeria",
  "apartment",
  "shop",
  "rosaHome",
  "florist",
  "workshop",
];
test("todos os objetos e portas são alcançáveis, sem atravessar mobília", () => {
  const s = fresh("A");
  for (const place of places) {
    const map = describeMap(place, s);
    for (const p of [
      ...map.spots,
      ...map.doors.map((d) => ({
        id: d.id,
        x: d.x + d.w / 2,
        y: d.y + d.h / 2,
      })),
    ]) {
      const route = findPath(map, map.spawn, [p.x, p.y]);
      assert.ok(route.length, `${place}/${p.id} sem caminho`);
      assert.ok(
        Math.hypot(route.at(-1)![0] - p.x, route.at(-1)![1] - p.y) < 44,
        `${place}/${p.id} distante`,
      );
      for (let i = 1; i < route.length; i++) {
        let [x, y] = route[i - 1],
          n = route[i];
        const length = Math.hypot(n[0] - x, n[1] - y);
        for (let t = 0; t <= length; t += 4) {
          const xx = x + ((n[0] - x) * t) / length,
            yy = y + ((n[1] - y) * t) / length;
          assert.ok(!blocked(map, xx, yy), `${place} caminho corta obstáculo`);
        }
      }
    }
  }
});
test("deslizar em uma parede mantém o movimento livre no outro eixo", () => {
  const m = describeMap("apartment");
  const p = slide(m, 60, 260, -40, 40);
  assert.ok(p[0] >= 59);
  assert.ok(p[1] > 290);
  assert.ok(!blocked(m, ...p));
});
test("Rosa caminha e muda de mapa; identidades continuam únicas fora da cena", () => {
  const s = fresh("A");
  let moved = false;
  for (let n = 0; n < 1200; n++) {
    updateResidents(s, 0.05);
    moved ||= s.npcs.rosa.x !== 208;
    for (const id of ids) {
      const r = s.npcs[id];
      assert.ok(
        !blocked(describeMap(r.place, s), r.x, r.y),
        `${id} atravessou móvel em ${r.place}`,
      );
    }
  }
  assert.ok(moved);
  assert.equal(s.npcs.rosa.place, "pizzeria");
  assert.equal(Object.keys(s.npcs).length, 3);
  s.introduced = [1];
  s.book = true;
  s.minute = 22 * 60;
  for (const id of ids)
    assert.equal(
      targetFor(s, id).place,
      { rosa: "rosaHome", lia: "florist", daniel: "workshop" }[id],
    );
});
test("horário altera ambiente, extensão solar e iluminação interior sem filtro externo indiscriminado", () => {
  const noon = atmosphere(720),
    dusk = atmosphere(1080),
    night = atmosphere(1380),
    dawn = atmosphere(180);
  assert.ok(noon.darkness < dusk.darkness && dusk.darkness < night.darkness);
  assert.ok(dusk.sunLength > noon.sunLength);
  assert.notEqual(dawn.color, noon.color);
  assert.ok(atmosphere(1380, true).darkness < night.darkness);
});
test("entrega exige caixa e endereço correto, paga uma vez e permanece serializável", () => {
  const s = fresh("A");
  s.day = 4;
  introDone(s);
  s.order!.accepted = true;
  beginPizza(s, s.order!.recipe);
  for (const i of recipes[s.order!.recipe].items) addIngredient(s, i);
  finishAssembly(s);
  bake(s);
  tick(s, 17);
  takePizza(s);
  s.place = "workshop";
  assert.match(serve(s).error!, /residência/);
  s.place = s.order!.destination!;
  assert.match(serve(s).error!, /Embale/);
  s.pizza!.stage = "boxed";
  const r = serve(s);
  assert.ok(r.amount! > 0);
  assert.equal(s.deliveries, 1);
  assert.ok(serve(s).error);
  assert.equal(s.deliveries, 1);
});
test("migração mantém o slot v1 e preserva pedidos, dinheiro e narrativa em ponto seguro", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => values.get(k) || null,
      setItem: (k: string, v: string) => values.set(k, v),
    },
    configurable: true,
  });
  const old = {
    ...fresh("Sol"),
    version: 1,
    day: 4,
    money: 123,
    introduced: [1, 2, 3, 4],
    place: "street",
    x: 900,
    y: 800,
  };
  delete (old as Partial<typeof old>).npcs;
  values.set("valdora.week.v1", JSON.stringify(old));
  const original = values.get("valdora.week.v1");
  const s = load()!;
  assert.equal(s.version, 2);
  assert.equal(s.money, 123);
  assert.equal(s.place, "apartment");
  assert.equal(Object.keys(s.npcs).length, 3);
  assert.ok(save(s));
  assert.equal(values.get("valdora.week.v1"), original);
  assert.ok(values.has(SAVE_KEY));
});
