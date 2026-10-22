import {
  days,
  ingredients,
  recipes,
  type Ingredient,
  type RecipeId,
  type Person,
  type Place,
} from "./data";
import { residents, ids, type Resident, type NpcId } from "./actors";
import { buildings, describeMap, locations } from "./maps";
import { blocked } from "./navigation";
export interface Pizza {
  recipe: RecipeId;
  items: Ingredient[];
  stage: "assembly" | "raw" | "oven" | "ready" | "boxed";
  toppings?: { item: Ingredient; x: number; y: number }[];
  seconds: number;
  quality: "perfeita" | "crua" | "queimada";
}
export interface Order {
  id: number;
  person: Exclude<Person, "hero">;
  recipe: RecipeId;
  accepted: boolean;
  waited: number;
  kind?: "counter" | "delivery";
  destination?: Place;
}
export interface State {
  version: 2;
  name: string;
  day: number;
  minute: number;
  money: number;
  inventory: Record<Ingredient, number>;
  unlocked: RecipeId[];
  cleaned: string[];
  book: boolean;
  introduced: number[];
  repaired: boolean;
  repairStep: number;
  upgrade: boolean;
  bought: boolean;
  dailyServed: number;
  sold: number;
  earned: number;
  customers: number;
  perfect: number;
  satisfaction: number;
  pizza: Pizza | null;
  order: Order | null;
  orderSerial: number;
  complete: boolean;
  place: Place;
  x: number;
  y: number;
  npcs: Record<NpcId, Resident>;
  deliveries: number;
  deliveredToday: number;
}
export const SAVE_KEY = "valdora.week.v2";
export const cleaning = [
  "caixa-1",
  "caixa-2",
  "caixa-3",
  "poeira-1",
  "poeira-2",
  "cadeira-1",
  "cadeira-2",
  "cozinha",
];
export function fresh(name: string): State {
  return {
    version: 2,
    name: name.trim().slice(0, 20) || "Alex",
    day: 1,
    minute: 8 * 60,
    money: 60,
    inventory: { massa: 6, molho: 6, queijo: 6, manjericao: 2, calabresa: 2 },
    unlocked: ["queijo"],
    cleaned: [],
    book: false,
    introduced: [],
    repaired: false,
    repairStep: 0,
    upgrade: false,
    bought: false,
    dailyServed: 0,
    sold: 0,
    earned: 0,
    customers: 0,
    perfect: 0,
    satisfaction: 0,
    pizza: null,
    order: null,
    orderSerial: 0,
    complete: false,
    place: "street",
    x: 240,
    y: 384,
    npcs: residents(),
    deliveries: 0,
    deliveredToday: 0,
  };
}
export function quota(s: State) {
  return days[s.day - 1].quota;
}
export function canSleep(s: State): boolean {
  if (s.day === 1) return s.book;
  if (!s.introduced.includes(s.day) || s.dailyServed < quota(s)) return false;
  if (s.day === 4 && !s.bought) return false;
  if (s.day === 5 && !s.repaired) return false;
  return s.day < 7;
}
export function objective(s: State): string {
  if (s.complete) return "A primeira semana está guardada no coração.";
  if (!s.introduced.includes(s.day))
    return s.place === "pizzeria"
      ? "Seu vizinho está vindo ajudar. Pode explorar enquanto espera."
      : "Entre na pizzaria e encontre seus vizinhos.";
  if (s.day === 1) {
    if (s.cleaned.length < cleaning.length)
      return `Restaure a pizzaria · ${s.cleaned.length}/${cleaning.length}`;
    if (!s.book) return "Leia o caderno na cozinha.";
    return "Suba ao apartamento e durma.";
  }
  if (s.day === 5 && !s.repaired)
    return "Conserte o forno com Daniel · interaja com o forno.";
  if (s.day === 4 && !s.bought)
    return "Visite a mercearia e compre ingredientes.";
  if (s.order) {
    const o = s.order,
      p = s.pizza;
    if (!o.accepted)
      return o.kind === "delivery"
        ? "Atenda o telefone na ponta do balcão."
        : "Receba o cliente no balcão.";
    if (!p || p.stage === "assembly")
      return "Monte a receita na bancada da cozinha.";
    if (p.stage === "raw") return "Leve a pizza ao forno. Use E para colocar.";
    if (p.stage === "oven")
      return "Acompanhe o forno. Retire quando a borda dourar.";
    if (o.kind === "delivery" && p.stage === "ready")
      return "Embale a pizza na bancada à esquerda do forno.";
    if (o.kind === "delivery")
      return "Siga o marcador e entregue com E no endereço correto.";
    return "Sirva a pizza ao cliente que fez o pedido.";
  }
  if (s.dailyServed < quota(s))
    return `Atenda os pedidos · ${s.dailyServed}/${quota(s)}${s.day === 2 ? " · Dona Rosa está esperando" : ""}`;
  if (s.day === 7) return "Converse com seus amigos e leia o caderno do avô.";
  return "Dia cumprido! Explore ou durma no apartamento.";
}
export function startOrder(s: State): void {
  if (
    s.day < 2 ||
    s.order ||
    s.dailyServed >= quota(s) ||
    !s.introduced.includes(s.day)
  )
    return;
  const people: Exclude<Person, "hero">[] =
    s.day === 2
      ? ["rosa"]
      : s.day === 3
        ? ["rosa", "daniel", "rosa"]
        : ["lia", "daniel", "rosa"];
  const person = people[s.dailyServed % people.length];
  const delivery =
    (s.day === 4 && s.dailyServed === 0) ||
    (s.day === 5 && s.dailyServed === 2) ||
    (s.day === 6 && s.dailyServed === 1) ||
    (s.day === 7 && s.dailyServed === 1);
  const available = s.unlocked;
  const recipe =
    s.day === 2
      ? "queijo"
      : s.day === 4 && s.dailyServed === 0
        ? "margherita"
        : available[(s.dailyServed + s.day) % available.length];
  s.order = {
    id: ++s.orderSerial,
    person: delivery ? (s.day % 2 === 0 ? "rosa" : "daniel") : person,
    recipe,
    accepted: false,
    waited: 0,
    kind: delivery ? "delivery" : "counter",
    ...(delivery
      ? { destination: (s.day % 2 === 0 ? "rosaHome" : "workshop") as Place }
      : {}),
  };
}
export function beginPizza(s: State, recipe: RecipeId): string | null {
  if (s.pizza)
    return "Você já está preparando uma pizza. Termine ou descarte primeiro.";
  if (!s.unlocked.includes(recipe)) return "Essa página ainda está fechada.";
  s.pizza = {
    recipe,
    items: [],
    stage: "assembly",
    seconds: 0,
    quality: "crua",
  };
  return null;
}
export function addIngredient(s: State, item: Ingredient): string | null {
  if (!s.pizza || s.pizza.stage !== "assembly")
    return "Abra uma pizza na bancada.";
  if (s.pizza.items.includes(item)) return "Esse ingrediente já está na pizza.";
  if (s.inventory[item] <= 0)
    return `Acabou ${ingredients[item].name.toLowerCase()}. Passe na mercearia.`;
  s.inventory[item]--;
  s.pizza.items.push(item);
  return null;
}
export function finishAssembly(s: State): string | null {
  if (!s.pizza || s.pizza.stage !== "assembly")
    return "Nenhuma pizza na bancada.";
  const required = recipes[s.pizza.recipe].items;
  if (
    required.length !== s.pizza.items.length ||
    required.some((i) => !s.pizza!.items.includes(i))
  )
    return "Confira o caderno: os ingredientes precisam corresponder à receita. Você pode recomeçar sem perder os ingredientes.";
  s.pizza.stage = "raw";
  return null;
}
export function discard(s: State) {
  if (s.pizza?.stage === "assembly")
    for (const i of s.pizza.items) s.inventory[i]++;
  s.pizza = null;
}
export function ovenTime(s: State) {
  return s.upgrade ? 9 : 16;
}
export function bake(s: State): string | null {
  if (s.day === 5 && !s.repaired)
    return "O forno precisa do conserto de Daniel.";
  if (!s.pizza || s.pizza.stage !== "raw")
    return "Monte uma pizza na bancada e traga até aqui.";
  s.pizza.stage = "oven";
  s.pizza.seconds = 0;
  return null;
}
export function takePizza(s: State): string | null {
  if (s.pizza?.stage !== "oven") return "O forno está vazio.";
  const t = ovenTime(s);
  s.pizza.quality =
    s.pizza.seconds < t
      ? "crua"
      : s.pizza.seconds <= t + 9
        ? "perfeita"
        : "queimada";
  s.pizza.stage = "ready";
  return null;
}
export function serve(s: State): {
  error?: string;
  amount?: number;
  text?: string;
} {
  if (!s.order?.accepted)
    return { error: "Converse com o cliente para receber o pedido." };
  if (s.order.kind === "delivery") {
    const b = buildings.find((b) => b.place === s.order!.destination);
    if (
      s.place !== s.order.destination &&
      !(
        s.place === "street" &&
        b &&
        Math.hypot(s.x - b.door[0], s.y - b.door[1] - 30) < 65
      )
    )
      return {
        error: "Esta não é a residência do pedido. Siga o marcador dourado.",
      };
  } else if (s.place !== "pizzeria")
    return { error: "Seu cliente está esperando na pizzaria." };
  if (!s.pizza || !["ready", "boxed"].includes(s.pizza.stage))
    return { error: "Sua pizza ainda não saiu do forno." };
  if (s.pizza.recipe !== s.order.recipe)
    return {
      error: `O pedido é ${recipes[s.order.recipe].name}. Guarde esta pizza ou prepare a receita certa.`,
    };
  if (s.order.kind === "delivery" && s.pizza.stage !== "boxed")
    return { error: "Embale a pizza na bancada de viagem antes de sair." };
  const quality = s.pizza.quality;
  const tip = quality === "perfeita" && s.order.waited < 180 ? 4 : 0;
  const amount =
    Math.round(
      recipes[s.pizza.recipe].price * (quality === "perfeita" ? 1 : 0.5),
    ) + tip;
  const rating = Math.max(
    30,
    (quality === "perfeita" ? 100 : quality === "crua" ? 60 : 45) -
      Math.floor(Math.max(0, s.order.waited - 180) / 15),
  );
  s.satisfaction += rating;
  s.money += amount;
  s.earned += amount;
  s.sold++;
  s.customers++;
  s.dailyServed++;
  if (s.order.kind === "delivery") {
    s.deliveries++;
    s.deliveredToday++;
  }
  if (quality === "perfeita") s.perfect++;
  s.npcs[s.order.person].departing = true;
  s.order = null;
  s.pizza = null;
  return {
    amount,
    text:
      quality === "perfeita"
        ? "Borda douradinha! Seu avô ia pedir mais uma."
        : quality === "crua"
          ? "Ficou um pouco crua. Da próxima vez, espere a faixa verde."
          : "Passou do ponto. Acontece! Da próxima, tire na faixa verde.",
  };
}
export function buy(s: State, i: Ingredient): string | null {
  const price = ingredients[i].price * 3;
  if (s.money < price)
    return "Dinheiro insuficiente. O kit solidário cobre as receitas do dia.";
  s.money -= price;
  s.inventory[i] += 3;
  s.bought = true;
  return null;
}
export function rescue(s: State): string | null {
  const needed = (
    s.order ? recipes[s.order.recipe].items : ["massa", "molho", "queijo"]
  ) as Ingredient[];
  if (needed.every((i) => s.inventory[i] > 0))
    return "Você já tem ingredientes para uma pizza. A Rosa guarda os kits para emergências.";
  for (const i of needed) s.inventory[i] = Math.max(s.inventory[i], 2);
  s.bought = true;
  return null;
}
export function nextDay(s: State): boolean {
  if (!canSleep(s)) return false;
  s.day++;
  s.minute = 480;
  s.dailyServed = 0;
  s.deliveredToday = 0;
  s.pizza = null;
  s.order = null;
  s.place = "apartment";
  s.x = 320;
  s.y = 400;
  // Rosa leaves enough basic staples for the day's required service; specialty goods remain purchasable.
  for (const i of ["massa", "molho", "queijo"] as Ingredient[])
    s.inventory[i] = Math.max(s.inventory[i], quota(s) + 1);
  if (s.day >= 4) {
    s.inventory.manjericao = Math.max(s.inventory.manjericao, 3);
    s.inventory.calabresa = Math.max(s.inventory.calabresa, 3);
  }
  return true;
}
export function introDone(s: State) {
  if (!s.introduced.includes(s.day)) s.introduced.push(s.day);
  if (s.day >= 4 && !s.unlocked.includes("margherita"))
    s.unlocked.push("margherita");
  if (s.day >= 5 && !s.unlocked.includes("calabresa"))
    s.unlocked.push("calabresa");
  startOrder(s);
}
export function tick(s: State, seconds: number) {
  s.minute = Math.min(29 * 60 + 30, s.minute + seconds * 4);
  if (s.order?.accepted) s.order.waited += seconds;
  if (s.pizza?.stage === "oven") s.pizza.seconds += seconds;
}
export function save(s: State): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function load(): State | null {
  try {
    const previous = !localStorage.getItem(SAVE_KEY);
    const s = JSON.parse(
      localStorage.getItem(SAVE_KEY) ||
        localStorage.getItem("valdora.week.v1") ||
        "null",
    );
    if (
      !s ||
      ![1, 2].includes(s.version) ||
      !Number.isInteger(s.day) ||
      s.day < 1 ||
      s.day > 7 ||
      typeof s.name !== "string" ||
      ![
        "street",
        "pizzeria",
        "apartment",
        "shop",
        "rosaHome",
        "florist",
        "workshop",
      ].includes(s.place) ||
      !Number.isFinite(s.x) ||
      !Number.isFinite(s.y) ||
      !Number.isFinite(s.minute) ||
      !s.inventory ||
      Object.keys(ingredients).some(
        (i) => !Number.isFinite(s.inventory[i]) || s.inventory[i] < 0,
      ) ||
      !Array.isArray(s.cleaned) ||
      !Array.isArray(s.introduced) ||
      !Array.isArray(s.unlocked) ||
      s.unlocked.some((id: string) => !(id in recipes)) ||
      !Number.isFinite(s.money) ||
      s.money < 0 ||
      [
        "dailyServed",
        "sold",
        "earned",
        "customers",
        "perfect",
        "satisfaction",
        "orderSerial",
      ].some((k) => !Number.isFinite(s[k]) || s[k] < 0)
    )
      return null;
    if (previous) {
      s.place = "apartment";
      s.x = 320;
      s.y = 400;
    }
    s.version = 2;
    s.npcs ??= residents();
    for (const id of ids) {
      const r = s.npcs[id];
      if (
        !r ||
        r.id !== id ||
        !(r.place in locations) ||
        !Number.isFinite(r.x) ||
        !Number.isFinite(r.y) ||
        ![0, 1, 2, 3].includes(r.direction)
      ) {
        s.npcs[id] = residents()[id];
        continue;
      }
      if (
        !Array.isArray(r.route) ||
        r.route.some(
          (p: unknown) =>
            !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite),
        )
      ) {
        r.route = [];
        r.target = "";
      }
      if (blocked(describeMap(r.place, s), r.x, r.y)) {
        [r.x, r.y] = describeMap(r.place, s).spawn;
        r.route = [];
        r.target = "";
      }
    }
    const map = describeMap(s.place, s);
    if (blocked(map, s.x, s.y)) {
      [s.x, s.y] = map.spawn;
    }
    s.deliveries ??= 0;
    s.deliveredToday ??= 0;
    if (s.order && !s.order.kind) s.order.kind = "counter";
    return s;
  } catch {
    return null;
  }
}
