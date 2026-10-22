import type { MapData, Rect } from "./maps";
export function inside(x: number, y: number, r: Rect) {
  return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
}
export function blocked(map: MapData, x: number, y: number, radius = 7) {
  return (
    x < radius ||
    y < radius ||
    x > map.width - radius ||
    y > map.height - radius ||
    map.solids.some(
      (r) =>
        x + radius > r.x &&
        x - radius < r.x + r.w &&
        y + 3 > r.y &&
        y - 5 < r.y + r.h,
    )
  );
}
export function slide(
  map: MapData,
  x: number,
  y: number,
  dx: number,
  dy: number,
): [number, number] {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 5));
  for (let i = 0; i < steps; i++) {
    if (!blocked(map, x + dx / steps, y)) x += dx / steps;
    if (!blocked(map, x, y + dy / steps)) y += dy / steps;
  }
  return [x, y];
}
export function findPath(
  map: MapData,
  start: [number, number],
  goal: [number, number],
): [number, number][] {
  // A door is walkable only when it is the intended destination. Otherwise a
  // route past another shop could accidentally enter it on the way elsewhere.
  map = {
    ...map,
    solids: [
      ...map.solids,
      ...map.doors.filter(
        (d) =>
          Math.hypot(goal[0] - d.x - d.w / 2, goal[1] - d.y - d.h / 2) > 24,
      ),
    ],
  };
  const step = 16,
    key = (x: number, y: number) => x + "," + y;
  const nearest = (p: [number, number]): [number, number] => {
    let best: [number, number] = [
        Math.round(p[0] / step) * step,
        Math.round(p[1] / step) * step,
      ],
      dist = Infinity;
    for (let y = -3; y <= 3; y++)
      for (let x = -3; x <= 3; x++) {
        const a = Math.round(p[0] / step) * step + x * step,
          b = Math.round(p[1] / step) * step + y * step,
          d = Math.hypot(a - p[0], b - p[1]);
        if (!blocked(map, a, b) && d < dist) {
          best = [a, b];
          dist = d;
        }
      }
    return best;
  };
  const a = nearest(start),
    b = nearest(goal),
    queue = [a],
    seen = new Map<string, string | null>([[key(...a), null]]);
  let found = false;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p[0] === b[0] && p[1] === b[1]) {
      found = true;
      break;
    }
    for (const [dx, dy] of [
      [0, step],
      [step, 0],
      [0, -step],
      [-step, 0],
    ]) {
      const n: [number, number] = [p[0] + dx, p[1] + dy],
        k = key(...n);
      if (!seen.has(k) && !blocked(map, ...n)) {
        seen.set(k, key(...p));
        queue.push(n);
      }
    }
  }
  if (!found) return [];
  const route: [number, number][] = [];
  let k: string | null = key(...b);
  while (k) {
    route.unshift(k.split(",").map(Number) as [number, number]);
    k = seen.get(k) || null;
  }
  return route.filter(
    (p, i) =>
      i === route.length - 1 ||
      i === 0 ||
      (route[i - 1][0] !== route[i + 1][0] &&
        route[i - 1][1] !== route[i + 1][1]),
  );
}
