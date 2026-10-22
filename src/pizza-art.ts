import type { Ingredient } from "./data";
// The supplied packs have no layered pizza assembly. Draw this diagram in a 64px
// buffer and enlarge with nearest-neighbour, matching the world's pixel grid.
export function paintPizza(
  canvas: HTMLCanvasElement,
  items: Ingredient[],
  placements: { item: Ingredient; x: number; y: number }[] = [],
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;
  if (!items.includes("massa")) {
    ctx.fillStyle = "#cdb78a";
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const d = Math.hypot(x - 31.5, y - 31.5);
        if (d > 27 && d < 28 && (x + y) % 6 < 3) ctx.fillRect(x, y, 1, 1);
      }
    return;
  }
  const sauce = items.includes("molho"),
    cheese = items.includes("queijo");
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const r = Math.hypot(x - 31.5, y - 31.5),
        seed = (x * 71 + y * 13) % 29;
      if (r > 29) continue;
      let c =
        r > 27
          ? "#9e643c"
          : r > 25
            ? "#d29750"
            : seed < 5
              ? "#edc67b"
              : "#f5d593";
      if (sauce && r < 24) c = seed < 5 ? "#b84a3d" : "#cb5942";
      if (cheese && r < 22 + (seed < 3 ? 1 : 0))
        c = seed < 7 ? "#eab65b" : seed < 12 ? "#f9df88" : "#f3ce6b";
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  const spots = [
    [22, 20],
    [40, 21],
    [31, 32],
    [20, 42],
    [43, 41],
  ];
  const placed = (item: Ingredient) =>
    placements.filter((p) => p.item === item).length
      ? placements
          .filter((p) => p.item === item)
          .map((p) => [Math.round(14 + p.x * 36), Math.round(14 + p.y * 36)])
      : spots;
  if (items.includes("calabresa"))
    for (const [cx, cy] of placed("calabresa"))
      for (let yy = -4; yy <= 4; yy++)
        for (let xx = -4; xx <= 4; xx++)
          if (xx * xx + yy * yy < 18) {
            ctx.fillStyle =
              xx * xx + yy * yy > 10
                ? "#8e4235"
                : (xx + yy) % 3 === 0
                  ? "#e4a175"
                  : "#b95440";
            ctx.fillRect(cx + xx, cy + yy, 1, 1);
          }
  if (items.includes("manjericao"))
    for (const [cx, cy] of placed("manjericao")) {
      ctx.fillStyle = "#487c42";
      for (let yy = -4; yy <= 4; yy++)
        for (let xx = -3; xx <= 3; xx++)
          if (Math.abs(xx + yy * 0.4) < 2 && xx * xx + yy * yy < 19)
            ctx.fillRect(cx + xx, cy + yy, 1, 1);
      ctx.fillStyle = "#7eac57";
      ctx.fillRect(cx, cy - 2, 1, 5);
    }
}
