import type Phaser from "phaser";
import type { Lamp } from "./maps";
export function atmosphere(minute: number, indoors = false) {
  const h = (minute % 1440) / 60;
  const keys = indoors
    ? [
        [0, 26, 22, 34, 0.33],
        [6, 44, 35, 33, 0.12],
        [9, 255, 232, 193, 0],
        [16, 255, 222, 169, 0.02],
        [19, 48, 30, 37, 0.22],
        [24, 26, 22, 34, 0.33],
      ]
    : [
        [0, 12, 24, 61, 0.75],
        [5, 23, 35, 67, 0.7],
        [7, 236, 196, 140, 0.12],
        [10, 255, 247, 223, 0],
        [16, 248, 206, 153, 0.05],
        [18, 170, 86, 68, 0.28],
        [20, 17, 30, 68, 0.65],
        [24, 12, 24, 61, 0.75],
      ];
  let a = keys[0],
    b = keys[1];
  for (let i = 1; i < keys.length; i++)
    if (h >= keys[i][0]) {
      a = keys[i];
      b = keys[Math.min(i + 1, keys.length - 1)];
    }
  const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]),
    lerp = (i: number) => a[i] + (b[i] - a[i]) * t;
  return {
    color: `rgb(${Math.round(lerp(1))},${Math.round(lerp(2))},${Math.round(lerp(3))})`,
    darkness: lerp(4),
    sunX: Math.cos(((h - 6) / 12) * Math.PI),
    sunLength: indoors ? 0.3 : 0.25 + Math.abs(h - 13) / 14,
    night: h >= 19 || h < 6,
  };
}
let serial = 0;
export class Lighting {
  texture: Phaser.Textures.CanvasTexture;
  image: Phaser.GameObjects.Image;
  private elapsed = 0;
  constructor(private scene: Phaser.Scene) {
    const key = "light-" + ++serial;
    this.texture = scene.textures.createCanvas(key, 640, 400)!;
    this.image = scene.add
      .image(0, 0, key)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(8000);
  }
  update(dt: number, minute: number, indoors: boolean, lights: Lamp[]) {
    this.elapsed += dt;
    if (this.elapsed < 0.08) return;
    this.elapsed = 0;
    const a = atmosphere(minute, indoors),
      ctx = this.texture.context,
      camera = this.scene.cameras.main;
    ctx.clearRect(0, 0, 640, 400);
    ctx.fillStyle = a.color;
    ctx.globalAlpha = a.darkness;
    ctx.fillRect(0, 0, 640, 400);
    ctx.globalAlpha = 1;
    const power = indoors ? 0.5 : Math.max(0, (a.darkness - 0.1) / 0.65);
    for (const l of lights) {
      const x = l.x - camera.scrollX,
        y = l.y - camera.scrollY;
      if (x < -150 || x > 790 || y < -150 || y > 550) continue;
      ctx.globalCompositeOperation = "destination-out";
      const grad = ctx.createRadialGradient(x, y, 4, x, y, l.radius);
      grad.addColorStop(0, `rgba(0,0,0,${Math.min(0.97, power * l.power)})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - l.radius, y - l.radius, l.radius * 2, l.radius * 2);
      ctx.globalCompositeOperation = "source-over";
      const glow = ctx.createRadialGradient(x, y, 0, x, y, l.radius * 0.6);
      glow.addColorStop(0, `rgba(255,187,92,${power * 0.14})`);
      glow.addColorStop(1, "rgba(255,180,90,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - l.radius, y - l.radius, l.radius * 2, l.radius * 2);
    }
    this.texture.refresh();
  }
  destroy() {
    this.image.destroy();
    this.texture.destroy();
  }
}
