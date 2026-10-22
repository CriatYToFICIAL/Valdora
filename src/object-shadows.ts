import type Phaser from "phaser";
import { atmosphere } from "./lighting";
import { buildings, trees, type Lamp } from "./maps";
import type { Place } from "./data";
export class ObjectShadows {
  graphics: Phaser.GameObjects.Graphics;
  private timer = 0;
  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(-62);
  }
  update(dt: number, time: number, place: Place, lights: Lamp[]) {
    this.timer += dt;
    if (this.timer < 0.1) return;
    this.timer = 0;
    this.graphics.clear();
    const a = atmosphere(time, place !== "street");
    const casts =
      place === "street"
        ? buildings
            .map((b) => ({
              x: b.x + b.w / 2,
              y: b.y + 192,
              w: b.w,
              height: 120,
            }))
            .concat(
              trees.map(([x, y]) => ({
                x: x + 48,
                y: y + 132,
                w: 65,
                height: 110,
              })),
            )
        : [
            { x: 152, y: 336, w: 54, height: 32 },
            { x: 472, y: 336, w: 54, height: 32 },
            { x: 152, y: 448, w: 54, height: 32 },
            { x: 472, y: 448, w: 54, height: 32 },
          ];
    for (const c of casts) {
      let dx = a.sunX * c.height * a.sunLength * 0.5,
        dy = c.height * a.sunLength * 0.25,
        alpha = 0.16;
      if (a.night || place !== "street") {
        const l = lights.reduce<Lamp | null>(
          (b, l) =>
            !b ||
            Math.hypot(c.x - l.x, c.y - l.y) < Math.hypot(c.x - b.x, c.y - b.y)
              ? l
              : b,
          null,
        );
        if (l) {
          const d = Math.max(60, Math.hypot(c.x - l.x, c.y - l.y));
          dx = ((c.x - l.x) / d) * c.height * 0.4;
          dy = ((c.y - l.y) / d) * c.height * 0.3;
          alpha = 0.14;
        } else alpha = 0.06;
      }
      this.graphics.fillStyle(0x18262e, alpha).fillPoints(
        [
          { x: c.x - c.w / 2, y: c.y },
          { x: c.x + c.w / 2, y: c.y },
          { x: c.x + c.w / 2 + dx, y: c.y + dy },
          { x: c.x - c.w / 2 + dx, y: c.y + dy },
        ],
        true,
      );
    }
  }
}
