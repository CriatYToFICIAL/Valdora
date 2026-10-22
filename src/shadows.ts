import Phaser from "phaser";
import { atmosphere } from "./lighting";
import type { Lamp } from "./maps";
export class SilhouetteShadow {
  image: Phaser.GameObjects.Image;
  texture: Phaser.Textures.CanvasTexture;
  private frame = "";
  constructor(scene: Phaser.Scene, id: string) {
    const key = "shadow-" + id;
    this.texture = (
      scene.textures.exists(key)
        ? scene.textures.get(key)
        : scene.textures.createCanvas(key, 64, 64)
    ) as Phaser.Textures.CanvasTexture;
    this.image = scene.add.image(0, 0, key).setOrigin(0.5, 1);
  }
  update(
    sprite: Phaser.GameObjects.Sprite,
    minute: number,
    indoor: boolean,
    lights: Lamp[],
  ) {
    const f = sprite.frame,
      key = sprite.texture.key + ":" + f.name;
    if (key !== this.frame) {
      this.frame = key;
      const ctx = this.texture.context;
      ctx.clearRect(0, 0, 64, 64);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(
        f.source.image as HTMLImageElement,
        f.cutX,
        f.cutY,
        f.cutWidth,
        f.cutHeight,
        0,
        0,
        64,
        64,
      );
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#111927";
      ctx.fillRect(0, 0, 64, 64);
      ctx.globalCompositeOperation = "source-over";
      this.texture.refresh();
    }
    const a = atmosphere(minute, indoor);
    let dx = a.sunX,
      dy = 0.6,
      len = a.sunLength,
      alpha = 0.2;
    if (a.night || indoor) {
      const l = lights.reduce<Lamp | null>(
        (b, l) =>
          !b ||
          Math.hypot(sprite.x - l.x, sprite.y - l.y) <
            Math.hypot(sprite.x - b.x, sprite.y - b.y)
            ? l
            : b,
        null,
      );
      if (l) {
        dx = (sprite.x - l.x) / 90;
        dy = (sprite.y - l.y) / 90;
        len = Math.min(0.8, Math.hypot(dx, dy) * 0.4);
        alpha = indoor ? 0.2 : 0.27;
      } else alpha = 0.08;
    }
    this.image
      .setPosition(Math.round(sprite.x), Math.round(sprite.y - 4))
      .setDepth(sprite.y - 2)
      .setRotation(Math.atan2(dy, dx) + Math.PI / 2)
      .setScale(1, 0.25 + len * 0.45)
      .setAlpha(alpha);
  }
}
