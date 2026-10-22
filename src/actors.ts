import type { Place, Person } from "./data";
import type { State } from "./state";
import { buildings, describeMap } from "./maps";
import { blocked, findPath, slide } from "./navigation";
export type NpcId = Exclude<Person, "hero">;
export interface Resident {
  id: NpcId;
  place: Place;
  x: number;
  y: number;
  direction: number;
  activity: string;
  route: [number, number][];
  target: string;
  moving: boolean;
  departing?: boolean;
}
export const ids: NpcId[] = ["rosa", "lia", "daniel"];
export const homes: Record<NpcId, Place> = {
  rosa: "rosaHome",
  lia: "florist",
  daniel: "workshop",
};
export function residents(): Record<NpcId, Resident> {
  return {
    rosa: {
      id: "rosa",
      place: "street",
      x: 208,
      y: 362,
      direction: 3,
      activity: "visitando",
      route: [],
      target: "",
      moving: false,
    },
    lia: {
      id: "lia",
      place: "florist",
      x: 248,
      y: 240,
      direction: 2,
      activity: "cuidando das flores",
      route: [],
      target: "",
      moving: false,
    },
    daniel: {
      id: "daniel",
      place: "workshop",
      x: 336,
      y: 240,
      direction: 1,
      activity: "trabalhando",
      route: [],
      target: "",
      moving: false,
    },
  };
}
export function targetFor(
  s: State,
  id: NpcId,
): { place: Place; x: number; y: number; activity: string } {
  const order = s.order;
  if (order?.person === id) {
    if (order.kind === "delivery")
      return {
        place: order.destination!,
        x: 320,
        y: 352,
        activity: "aguardando entrega",
      };
    return {
      place: "pizzeria",
      x: 320,
      y: 286,
      activity: "aguardando no balcão",
    };
  }
  if (
    s.day === 7 ||
    (s.day === 1 && id === "rosa" && !s.book) ||
    (s.day === 5 && id === "daniel" && !s.repaired)
  )
    return {
      place: "pizzeria",
      x: id === "rosa" ? 356 : id === "lia" ? 390 : 418,
      y: 348,
      activity: s.day === 7 ? "comemorando" : "ajudando você",
    };
  if (s.npcs[id].departing)
    return { place: homes[id], x: 320, y: 352, activity: "voltando para casa" };
  const mandatory: NpcId =
    s.day === 4 ? "lia" : s.day === 5 ? "daniel" : "rosa";
  if (
    (!s.introduced.includes(s.day) && (s.day === 7 || id === mandatory)) ||
    s.day === 7
  )
    return {
      place: "pizzeria",
      x: id === "rosa" ? 356 : id === "lia" ? 390 : 418,
      y: 348,
      activity: "visitando você",
    };
  const h = (s.minute % 1440) / 60;
  if (h < 8 || h >= 21)
    return { place: homes[id], x: 320, y: 352, activity: "em casa" };
  if (id === "rosa") {
    if (h < 11)
      return { place: "shop", x: 472, y: 242, activity: "fazendo compras" };
    if (h < 17)
      return { place: "street", x: 456, y: 548, activity: "na praça" };
    if (h < 20)
      return {
        place: "pizzeria",
        x: 390,
        y: 354,
        activity: "dando uma passadinha",
      };
  }
  if (id === "lia" && h >= 17 && h < 20)
    return { place: "street", x: 634, y: 554, activity: "passeando" };
  if (id === "daniel" && h >= 18 && h < 21)
    return {
      place: "street",
      x: 556,
      y: 596,
      activity: "descansando da oficina",
    };
  return {
    place: homes[id],
    x: id === "lia" ? 248 : 336,
    y: 240,
    activity: id === "lia" ? "cuidando das flores" : "trabalhando",
  };
}
export function updateResidents(s: State, dt: number) {
  for (const id of ids) {
    const r = s.npcs[id],
      goal = targetFor(s, id),
      m = describeMap(r.place, s);
    r.activity = goal.activity;
    if (
      r.departing &&
      r.place === homes[id] &&
      Math.hypot(r.x - 320, r.y - 352) < 24
    )
      r.departing = false;
    let local: [number, number] = [goal.x, goal.y],
      door = m.doors[0];
    if (r.place !== goal.place) {
      if (r.place === "street") {
        const building =
          buildings.find((b) => b.place === goal.place) || buildings[0];
        door = m.doors.find((d) => d.to === building.place)!;
      } else
        door =
          m.doors.find((d) => d.to === goal.place) ||
          m.doors.find((d) => d.to === "street") ||
          m.doors[0];
      local = [door.x + door.w / 2, door.y + door.h / 2];
    }
    const token = goal.place + ":" + local.join(",");
    if (
      r.target !== token ||
      (!r.route.length && Math.hypot(r.x - local[0], r.y - local[1]) > 22)
    ) {
      r.target = token;
      r.route = findPath(m, [r.x, r.y], local);
      if (
        r.route[0] &&
        Math.hypot(r.x - r.route[0][0], r.y - r.route[0][1]) < 10
      )
        r.route.shift();
    }
    r.moving = false;
    const next = r.route[0];
    if (next) {
      const dx = next[0] - r.x,
        dy = next[1] - r.y,
        len = Math.hypot(dx, dy),
        amount = Math.min(len, 76 * dt);
      if (len < 2) r.route.shift();
      else {
        const [x, y] = slide(
          m,
          r.x,
          r.y,
          (dx / len) * amount,
          (dy / len) * amount,
        );
        // The player has priority in narrow passages. NPCs wait instead of clipping through them.
        const distance = Math.hypot(x - s.x, y - s.y),
          previous = Math.hypot(r.x - s.x, r.y - s.y);
        if (
          s.place !== r.place ||
          distance > 15 ||
          (previous < 15 && distance > previous)
        ) {
          r.x = x;
          r.y = y;
          r.moving = true;
          r.direction =
            Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 3) : dy < 0 ? 0 : 2;
        }
        if (Math.abs(x - r.x) + Math.abs(y - r.y) < 0.001 && blocked(m, x, y)) {
          r.target = "";
          r.route = [];
        }
      }
    }
    if (
      r.place !== goal.place &&
      Math.hypot(r.x - local[0], r.y - local[1]) < 23
    ) {
      r.place = door.to;
      [r.x, r.y] = door.spawn;
      r.route = [];
      r.target = "";
    }
  }
}
