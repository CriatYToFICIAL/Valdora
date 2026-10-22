import type Phaser from "phaser";
import type { Place } from "./data";
import type { State } from "./state";
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Door extends Rect {
  id: string;
  to: Place;
  spawn: [number, number];
}
export interface Spot {
  id: string;
  x: number;
  y: number;
  label: string;
  kind:
    | "clean"
    | "bench"
    | "oven"
    | "book"
    | "bed"
    | "shop"
    | "upgrade"
    | "phone"
    | "pack"
    | "address"
    | "stock";
  address?: string;
}
export interface Lamp {
  x: number;
  y: number;
  radius: number;
  color: string;
  power: number;
}
export interface MapData {
  width: number;
  height: number;
  solids: Rect[];
  doors: Door[];
  spots: Spot[];
  lights: Lamp[];
  spawn: [number, number];
}
export interface Building {
  x: number;
  y: number;
  w: number;
  place: Place;
  name: string;
  address: string;
  door: [number, number];
  tint: number;
}
export const locations: Record<Place, string> = {
  street: "Rua das Oliveiras",
  pizzeria: "Pizzaria do Antônio",
  apartment: "Apartamento",
  shop: "Mercearia Boa Prosa",
  rosaHome: "Casa de Dona Rosa",
  florist: "Floricultura da Lia",
  workshop: "Oficina do Daniel",
};
export const buildings: Building[] = [
  {
    x: 128,
    y: 112,
    w: 224,
    place: "pizzeria",
    name: "PIZZARIA DO ANTÔNIO",
    address: "Oliveiras, 12",
    door: [240, 304],
    tint: 0xffffff,
  },
  {
    x: 704,
    y: 144,
    w: 224,
    place: "florist",
    name: "FLOR DA VILA",
    address: "Oliveiras, 18",
    door: [816, 336],
    tint: 0xc6dfca,
  },
  {
    x: 64,
    y: 560,
    w: 192,
    place: "rosaHome",
    name: "DONA ROSA",
    address: "Oliveiras, 7",
    door: [160, 752],
    tint: 0xffe0a7,
  },
  {
    x: 704,
    y: 560,
    w: 224,
    place: "shop",
    name: "BOA PROSA",
    address: "Oliveiras, 21",
    door: [816, 752],
    tint: 0xc3d9e2,
  },
  {
    x: 432,
    y: 16,
    w: 192,
    place: "workshop",
    name: "OFICINA",
    address: "Oliveiras, 3",
    door: [528, 208],
    tint: 0xd2cac5,
  },
];
const trees = [
  [8, 4],
  [100, 0],
  [760, 0],
  [920, 8],
  [24, 240],
  [928, 336],
  [0, 784],
  [892, 744],
  [352, 600],
  [460, 756],
  [928, 768],
  [992, 560],
  [32, 416],
  [944, 80],
  [304, 8],
];
export { trees };
const benches = [
    [400, 504],
    [592, 392],
  ],
  lamps = [
    [368, 336],
    [656, 512],
    [304, 736],
    [944, 528],
    [672, 256],
  ],
  tables = [
    [120, 288],
    [440, 288],
    [120, 400],
    [440, 400],
  ];
const spot = (
  id: string,
  x: number,
  y: number,
  label: string,
  kind: Spot["kind"],
  extra: Partial<Spot> = {},
): Spot => ({ id, x, y, label, kind, ...extra });
export function describeMap(place: Place, s?: Pick<State, "cleaned">): MapData {
  const m: MapData = {
      width: 640,
      height: 512,
      solids: [],
      doors: [],
      spots: [],
      lights: [],
      spawn: [320, 448],
    },
    solid = (x: number, y: number, w: number, h: number) =>
      m.solids.push({ x, y, w, h });
  if (place === "street") {
    m.width = 1056;
    m.height = 928;
    m.spawn = [240, 384];
    solid(0, 0, 32, 928);
    solid(1024, 0, 32, 928);
    solid(0, 0, 1056, 32);
    solid(0, 896, 1056, 32);
    for (const b of buildings) {
      solid(b.x, b.y + 76, b.w, 106);
      m.doors.push({
        id: "door-" + b.place,
        x: b.door[0] - 14,
        y: b.door[1] - 7,
        w: 28,
        h: 19,
        to: b.place,
        spawn: [320, 445],
      });
      m.spots.push(
        spot(
          "address-" + b.place,
          b.door[0],
          b.door[1] + 30,
          b.address,
          "address",
          { address: b.place },
        ),
      );
      m.lights.push({
        x: b.door[0],
        y: b.door[1] - 60,
        radius: 80,
        color: "#ffd494",
        power: 0.8,
      });
      if (b.place === "rosaHome" || b.place === "florist") {
        solid(b.x, b.door[1] + 40, b.door[0] - b.x - 28, 8);
        solid(b.door[0] + 28, b.door[1] + 40, b.x + b.w - b.door[0] - 28, 8);
      }
    }
    for (const [x, y] of trees) solid(x + 36, y + 108, 22, 25);
    solid(496, 430, 60, 42);
    for (const [x, y] of benches) solid(x, y + 16, 64, 20);
    for (const [x, y] of lamps) {
      solid(x - 5, y - 4, 10, 10);
      m.lights.push({ x, y: y - 62, radius: 116, color: "#ffcf8c", power: 1 });
    }
    return m;
  }
  solid(0, 0, 640, 117);
  solid(0, 0, 52, 512);
  solid(588, 0, 52, 512);
  solid(0, 480, 640, 32);
  const from = buildings.find((b) => b.place === place);
  m.doors.push({
    id: "exit",
    x: 306,
    y: 470,
    w: 28,
    h: 15,
    to: place === "apartment" ? "pizzeria" : "street",
    spawn:
      place === "apartment"
        ? [544, 390]
        : [from?.door[0] || 240, (from?.door[1] || 304) + 30],
  });
  m.lights.push(
    { x: 150, y: 130, radius: 105, color: "#ffda9c", power: 0.65 },
    { x: 500, y: 130, radius: 110, color: "#ffda9c", power: 0.65 },
  );
  if (place === "pizzeria") {
    solid(128, 134, 96, 40);
    solid(256, 134, 96, 40);
    solid(448, 124, 64, 50);
    solid(224, 230, 192, 22);
    for (const [x, y] of tables) {
      solid(x + 6, y + 18, 52, 30);
      solid(x - 20, y + 25, 19, 18);
      solid(x + 66, y + 25, 19, 18);
    }
    m.spots.push(
      spot("bench", 304, 194, "Bancada · montar pizza", "bench"),
      spot("oven", 480, 194, "Forno · colocar / retirar", "oven"),
      spot("book", 224, 194, "Caderno do Antônio", "book"),
      spot("pack", 400, 194, "Embalar para viagem", "pack"),
      spot("phone", 404, 278, "Atender telefone", "phone"),
      spot("upgrade", 558, 256, "Melhoria do forno", "upgrade"),
      spot("stock", 174, 194, "Despensa", "stock"),
    );
    m.doors.push({
      id: "stairs",
      x: 532,
      y: 358,
      w: 26,
      h: 25,
      to: "apartment",
      spawn: [320, 445],
    });
    m.lights.push(
      { x: 480, y: 143, radius: 110, color: "#ff984d", power: 0.9 },
      { x: 152, y: 314, radius: 70, color: "#ffdba3", power: 0.6 },
      { x: 466, y: 314, radius: 70, color: "#ffdba3", power: 0.6 },
    );
    const dirty: [string, number, number, string][] = [
      ["caixa-1", 264, 362, "Guardar caixa"],
      ["caixa-2", 376, 354, "Guardar caixa"],
      ["caixa-3", 534, 423, "Guardar caixa"],
      ["poeira-1", 192, 348, "Varrer o chão"],
      ["poeira-2", 406, 425, "Varrer o chão"],
      ["cadeira-1", 112, 354, "Arrumar cadeira"],
      ["cadeira-2", 490, 378, "Arrumar cadeira"],
      ["cozinha", 358, 191, "Liberar a cozinha"],
    ];
    for (const [id, x, y, label] of dirty)
      if (!s?.cleaned.includes(id)) {
        m.spots.push(spot(id, x, y, label, "clean"));
        if (id.startsWith("caixa")) solid(x - 12, y - 16, 24, 24);
      }
  } else if (place === "apartment") {
    solid(128, 152, 56, 85);
    solid(432, 142, 80, 30);
    solid(448, 298, 64, 36);
    m.spots.push(
      spot("bed", 208, 232, "Dormir até amanhã", "bed"),
      spot("book", 420, 332, "Ler o caderno", "book"),
    );
  } else if (place === "shop") {
    for (const x of [112, 208, 432, 528]) solid(x, 134, 32, 62);
    solid(208, 294, 224, 24);
    m.spots.push(
      spot("shop-counter", 320, 348, "Ingredientes · comprar", "shop"),
    );
  } else {
    solid(112, 142, 96, 40);
    solid(448, 146, 64, 72);
    solid(256, 300, 64, 32);
  }
  return m;
}
export function crop(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  px: number,
  py: number,
  depth = py + h,
  tint = 0xffffff,
) {
  const texture = scene.textures.get(key),
    f = `${x},${y},${w},${h}`;
  if (!texture.has(f)) texture.add(f, 0, x, y, w, h);
  return scene.add
    .image(px, py, key, f)
    .setOrigin(0)
    .setDepth(depth)
    .setTint(tint);
}
export function buildMap(scene: Phaser.Scene, s: State): MapData {
  const m = describeMap(s.place, s),
    g = scene.add.graphics().setDepth(-90);
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    c: number,
    d = -80,
  ) => scene.add.rectangle(x, y, w, h, c).setOrigin(0).setDepth(d);
  const tile = (
    key: string,
    tx: number,
    ty: number,
    x: number,
    y: number,
    w: number,
    h: number,
    d = -70,
  ) => {
    const t = scene.textures.get(key),
      f = `${tx},${ty},32,32`;
    if (!t.has(f)) t.add(f, 0, tx, ty, 32, 32);
    return scene.add.tileSprite(x, y, w, h, key, f).setOrigin(0).setDepth(d);
  };
  const label = (
    x: number,
    y: number,
    text: string,
    size = 8,
    color = "#f4dfad",
    bg = "#3c372e",
  ) =>
    scene.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: size,
        color,
        backgroundColor: bg,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(y + 50);
  const f = (
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    px: number,
    py: number,
    base = py + h,
  ) => crop(scene, key, x, y, w, h, px, py, base);
  const pot = (x: number, y: number, flower = false) => {
    f("grass", 0, 0, 32, 32, x - 4, y - 17, y + 21);
    const d = scene.add.graphics().setDepth(y + 22);
    d.fillStyle(0x754c3d).fillRect(x + 6, y + 11, 12, 10);
    d.fillStyle(0xb27d53).fillRect(x + 4, y + 9, 16, 4);
    d.fillStyle(0xcb9969).fillRect(x + 6, y + 10, 3, 2);
    if (flower) {
      d.fillStyle(0xf0be82).fillRect(x + 12, y - 12, 3, 3);
      d.fillStyle(0xcd7d93).fillRect(x + 3, y - 4, 3, 3);
      d.fillStyle(0xf3e1b7).fillRect(x + 13, y - 11, 1, 1);
    }
  };
  const chair = (x: number, y: number) =>
    f("country", 64, 0, 32, 32, x, y, y + 30);
  const counter = (x: number, y: number, width: number) => {
    for (let xx = x; xx < x + width; xx += 32) {
      f("cabinets", 96, 272, 32, 48, xx, y, y + 48);
      rect(xx, y + 8, 32, 6, 0xc59765, y + 49);
    }
  };
  if (s.place === "street") {
    g.fillStyle(0x477a3f).fillRect(0, 0, m.width, m.height);
    for (let y = 32; y < 896; y += 32)
      for (let x = 32; x < 1024; x += 32) {
        const h = (x * 37 + y * 13) % 107;
        if (h < 13) f("grass", (h % 3) * 32, 160, 32, 32, x, y, -89);
      }
    const path = (x: number, y: number, w: number, h: number) => {
      rect(x - 3, y - 3, w + 6, h + 6, 0x74805a, -85);
      tile("floors", 160, 192, x, y, w, h, -84);
    };
    path(208, 296, 64, 152);
    path(208, 416, 640, 64);
    path(784, 328, 64, 120);
    path(304, 448, 64, 384);
    path(608, 448, 64, 384);
    path(784, 752, 64, 80);
    path(144, 800, 704, 48);
    path(504, 200, 48, 248);
    path(416, 384, 256, 192);
    path(144, 752, 64, 80);
    for (const b of buildings) {
      rect(b.x + 12, b.y + 176, b.w + 12, 24, 0x314e38, -60);
      for (let col = 0; col < b.w / 32; col++)
        for (let row = 0; row < 3; row++)
          f(
            "house",
            (col === 0 ? 0 : col === b.w / 32 - 1 ? 2 : 1) * 32,
            row * 32,
            32,
            32,
            b.x + col * 32,
            b.y + 96 + row * 32,
            b.y + 190,
          ).setTint(b.tint);
      for (let col = 0; col < b.w / 32; col++)
        for (let row = 0; row < 3; row++) {
          const sx = (col === 0 ? 0 : col === b.w / 32 - 1 ? 2 : 1) * 32,
            sy =
              row === 0
                ? 96
                : row === 1
                  ? col === 0 || col === b.w / 32 - 1
                    ? 128
                    : 160
                  : 160;
          f("house", sx, sy, 32, 32, b.x + col * 32, b.y + row * 32, b.y + 190);
        }
      f("house", 96, 0, 32, 48, b.door[0] - 16, b.door[1] - 48, b.y + 192);
      f("house", 224, 0, 32, 64, b.x + 32, b.y + 105, b.y + 193);
      if (b.w >= 224)
        f("house", 256, 0, 32, 64, b.x + b.w - 64, b.y + 105, b.y + 193);
      rect(b.door[0] - 21, b.door[1] - 3, 42, 7, 0xb3a68a, b.door[1] - 1);
      label(b.x + b.w / 2, b.y + 101, b.name).setDepth(b.y + 196);
      label(b.door[0], b.door[1] + 17, b.address, 7, "#ede4c3", "#545c40");
      pot(b.x + 4, b.door[1] - 14, b.place === "florist");
      pot(b.x + b.w - 26, b.door[1] - 14, true);
      if (b.place === "rosaHome" || b.place === "florist")
        for (let x = b.x; x < b.x + b.w; x += 16)
          if (Math.abs(x - b.door[0]) > 30) {
            rect(x, b.door[1] + 26, 4, 23, 0xbca17a, b.door[1] + 49);
            rect(x, b.door[1] + 33, 16, 4, 0x977853, b.door[1] + 50);
          }
    }
    for (const [x, y] of trees) {
      scene.add
        .ellipse(x + 49, y + 131, 90, 28, 0x213f2d, 0.28)
        .setDepth(y + 105);
      f("trunk", 0, 0, 64, 96, x, y + 48, y + 139);
      f("tree", x % 3 === 0 ? 96 : 0, 0, 96, 96, x, y, y + 140);
    }
    for (const [x, y] of benches) {
      rect(x + 4, y + 4, 58, 8, 0xc09261, y + 30);
      rect(x, y + 17, 64, 11, 0x8c5e43, y + 31);
      rect(x + 7, y + 27, 5, 11, 0x4d4137, y + 32);
      rect(x + 51, y + 27, 5, 11, 0x4d4137, y + 32);
    }
    for (const [x, y] of lamps) {
      const l = scene.add.graphics().setDepth(y + 8);
      l.fillStyle(0x363c40)
        .fillRect(x - 3, y - 68, 6, 72)
        .fillRect(x - 7, y - 2, 14, 5);
      l.fillStyle(0x6c5d45)
        .fillRect(x - 10, y - 76, 20, 5)
        .fillRect(x - 8, y - 70, 16, 22);
      l.fillStyle(0xe7d397).fillRect(x - 5, y - 67, 10, 15);
    }
    rect(484, 426, 86, 54, 0x596847, -75);
    rect(490, 432, 74, 42, 0x795c45, -74);
    for (let i = 0; i < 7; i++)
      pot(496 + (i % 4) * 16, 430 + Math.floor(i / 4) * 24, true);
    f("barrel", 0, 0, 32, 48, 920, 716, 764);
    f("barrel", 0, 0, 32, 48, 946, 736, 784);
    label(424, 606, "PRAÇA DO CORETO");
    pot(376, 552, true);
    pot(628, 552, true);
  } else {
    g.fillStyle(0x181e24).fillRect(0, 0, 640, 512);
    tile("inside", 0, 128, 48, 112, 544, 368, -80);
    for (let x = 48; x < 592; x += 32) {
      f("inside", 32, 0, 32, 32, x, 48, 110);
      f("inside", 32, 32, 32, 32, x, 80, 111);
      f("inside", 32, 64, 32, 32, x, 112, 115);
    }
    rect(42, 48, 6, 434, 0x3f2d2b, 490);
    rect(592, 48, 6, 434, 0x3f2d2b, 490);
    rect(42, 480, 260, 6, 0x3f2d2b, 490);
    rect(338, 480, 260, 6, 0x3f2d2b, 490);
    f("house", 96, 0, 32, 64, 304, 427, 426);
    label(320, 494, "↓ " + (s.place === "apartment" ? "PIZZARIA" : "RUA"), 7);
    f("house", 256, 0, 32, 48, 96, 66, 116);
    f("house", 256, 0, 32, 48, 512, 66, 116);
    if (s.place === "pizzeria") {
      f("cabinets", 96, 0, 32, 80, 128, 98, 180);
      f("cabinets", 32, 96, 32, 80, 164, 98, 180);
      counter(256, 130, 96);
      counter(384, 130, 48);
      counter(224, 208, 192);
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++)
          f("house", 32, 32, 32, 32, 448 + x * 32, 104 + y * 32, 179);
      rect(458, 128, 44, 33, 0x342b2c, 180);
      rect(466, 120, 28, 12, 0x342b2c, 181);
      rect(464, 150, 32, 7, 0xc6713e, 182);
      rect(472, 144, 16, 10, 0xf8c775, 183);
      rect(446, 164, 68, 7, 0x5b4b42, 184);
      label(480, 107, "FORNO", 7);
      label(300, 127, "BANCADA", 7);
      rect(216, 147, 16, 13, 0xa37845, 179);
      rect(218, 149, 13, 9, 0xe8d8a4, 180);
      rect(223, 149, 1, 9, 0xa37845, 181);
      rect(392, 222, 13, 7, 0x2c3037, 261);
      rect(395, 216, 7, 8, 0x825b45, 262);
      label(396, 212, "☎", 9);
      for (const [x, y] of tables) {
        rect(x + 8, y + 26, 5, 22, 0x573c2d, y + 49);
        rect(x + 51, y + 26, 5, 22, 0x573c2d, y + 49);
        f("cabinets", 0, 272, 64, 32, x, y, y + 50);
        rect(x + 18, y + 4, 28, 18, 0xb5bea3, y + 51);
        if (x !== 120 || y !== 288 || s.cleaned.includes("cadeira-1"))
          chair(x - 26, y + 9);
        if (x !== 440 || y !== 400 || s.cleaned.includes("cadeira-2"))
          chair(x + 64, y + 9);
        f("cabinets", 128, 32, 32, 24, x + 16, y + 1, y + 53);
      }
      f("stairs", 64, 368, 64, 80, 528, 320, 410);
      label(551, 321, "↑ QUARTO", 7);
      rect(544, 211, 25, 18, 0x6b5145, 241);
      rect(552, 205, 10, 7, 0x3a3937, 242);
      rect(546, 212, 21, 2, 0xb89469, 243);
      rect(555, 216, 4, 4, 0xc3b7a0, 244);
      label(557, 193, "MELHORIA", 6);
      pot(64, 434, true);
      pot(560, 434, true);
      f("cabinets", 32, 0, 32, 80, 544, 104, 184);
      for (const p of m.spots.filter((p) => p.kind === "clean")) {
        if (p.id.startsWith("caixa") || p.id === "cozinha") {
          rect(p.x - 12, p.y - 24, 25, 25, 0x835c3a, p.y);
          rect(p.x - 10, p.y - 22, 21, 6, 0xb38b56, p.y + 1);
          rect(p.x - 2, p.y - 24, 3, 25, 0xc2a470, p.y + 2);
        } else if (p.id.startsWith("poeira")) {
          for (let i = 0; i < 8; i++)
            rect(
              p.x - 16 + ((i * 17) % 31),
              p.y - 3 + ((i * 7) % 11),
              4,
              2,
              0x57473a,
              p.y,
            );
        } else chair(p.x - 12, p.y - 35);
      }
      if (s.day === 7)
        for (let x = 120; x < 560; x += 32)
          rect(x, 56, 8, 11, x % 64 === 56 ? 0xcc8d78 : 0xdcc185, 119);
    } else if (s.place === "apartment") {
      f("country", 0, 16, 64, 112, 120, 129, 244);
      f("cabinets", 32, 0, 32, 80, 432, 104, 184);
      counter(448, 290, 64);
      chair(420, 310);
      pot(544, 168, true);
      label(320, 96, "UM CANTINHO PARA RECOMEÇAR", 7);
      f("cabinets", 128, 0, 32, 28, 464, 299, 343);
    } else if (s.place === "shop") {
      for (const x of [112, 208, 432, 528])
        f("cabinets", 32, 0, 32, 80, x, 112, 204);
      counter(208, 274, 224);
      pot(80, 409, true);
      pot(552, 409, true);
      label(320, 262, "INGREDIENTES DA VILA");
    } else {
      f("cabinets", 32, 0, 32, 80, 112, 108, 190);
      counter(256, 280, 64);
      chair(332, 294);
      pot(500, 215, s.place === "florist");
      pot(470, 207, true);
      f("country", 0, 16, 64, 112, 448, 128, 244);
      if (s.place === "florist")
        for (let i = 0; i < 6; i++) pot(120 + i * 35, 220, true);
      label(320, 90, locations[s.place].toUpperCase());
    }
  }
  return m;
}
