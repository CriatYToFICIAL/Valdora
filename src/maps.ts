import Phaser from "phaser";
import type { Place, Person } from "./data";
import { cleaning, type State } from "./state";
export interface Spot {
  id: string;
  x: number;
  y: number;
  label: string;
  kind:
    | "door"
    | "npc"
    | "clean"
    | "book"
    | "bench"
    | "oven"
    | "bed"
    | "shop"
    | "upgrade";
  to?: Place;
  person?: Person;
}
export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface MapResult {
  spots: Spot[];
  solids: Solid[];
  width: number;
  height: number;
}
export const locations: Record<Place, string> = {
  street: "Rua das Oliveiras",
  pizzeria: "Pizzaria do Antônio",
  apartment: "Seu cantinho",
  shop: "Mercearia Boa Prosa",
};
export function buildMap(scene: Phaser.Scene, s: State): MapResult {
  const spots: Spot[] = [],
    solids: Solid[] = [];
  const width = s.place === "street" ? 1600 : 1152,
    height = s.place === "street" ? 1088 : 768;
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    c: number,
    depth = 0,
  ) => scene.add.rectangle(x, y, w, h, c).setOrigin(0).setDepth(depth);
  const crop = (
    sheet: string,
    x: number,
    y: number,
    w: number,
    h: number,
    px: number,
    py: number,
    depth = py,
    scale = 2,
  ) => {
    const key = `${x}-${y}-${w}-${h}`;
    const tx = scene.textures.get(sheet);
    if (!tx.has(key)) tx.add(key, 0, x * 16, y * 16, w * 16, h * 16);
    return scene.add
      .image(px, py, sheet, key)
      .setOrigin(0)
      .setScale(scale)
      .setDepth(depth);
  };
  const solid = (x: number, y: number, w: number, h: number) =>
    solids.push({ x, y, w, h });
  const tiled = (
    sheet: string,
    tx: number,
    ty: number,
    x: number,
    y: number,
    w: number,
    h: number,
    depth = -20,
    tw = 1,
    th = 1,
  ) => {
    const key = `${tx}-${ty}-${tw}-${th}`;
    const texture = scene.textures.get(sheet);
    if (!texture.has(key))
      texture.add(key, 0, tx * 16, ty * 16, tw * 16, th * 16);
    return scene.add
      .tileSprite(x, y, w / 2, h / 2, sheet, key)
      .setOrigin(0)
      .setScale(2)
      .setDepth(depth);
  };
  const label = (
    x: number,
    y: number,
    text: string,
    color = "#fff0c8",
    size = 13,
  ) =>
    scene.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: size,
        color,
        backgroundColor: "#233e36",
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(y + 100);
  const spot = (
    id: string,
    x: number,
    y: number,
    text: string,
    kind: Spot["kind"],
    extra: Partial<Spot> = {},
  ) => spots.push({ id, x, y, label: text, kind, ...extra });
  const plant = (x: number, y: number) => {
    crop("interiors", 10, 44, 2, 3, x, y, y + 88);
    solid(x + 8, y + 64, 42, 24);
  };
  const npc = (p: Person, x: number, y: number) =>
    spot(
      p,
      x,
      y,
      p === "rosa" ? "Dona Rosa" : p === "lia" ? "Lia" : "Daniel",
      "npc",
      { person: p },
    );
  if (s.place === "street") {
    tiled("village", 4, 1, 0, 0, width, height);
    tiled("village", 10, 2, 32, 480, width - 64, 224, -19);
    for (const [x, wide] of [
      [440, 128],
      [1040, 96],
    ])
      tiled("village", 10, 2, x, 384, wide, 416, -18);
    const house = (
      x: number,
      y: number,
      tx: number,
      ty: number,
      w: number,
      h: number,
      name: string,
    ) => {
      crop("village", tx, ty, w, h, x, y, y + h * 48, 3);
      solid(x + 8, y + 82, w * 48 - 16, h * 48 - 96);
      label(x + w * 24, y - 18, name);
    };
    house(352, 192, 0, 25, 5, 4, "PIZZARIA DO ANTÔNIO");
    house(992, 224, 0, 29, 3, 4, "MERCEARIA");
    house(96, 768, 6, 37, 4, 4, "CASA DA ROSA");
    house(1250, 772, 10, 41, 5, 4, "FLORICULTURA");
    spot("to-pizzeria", 472, 448, "Entrar na pizzaria", "door", {
      to: "pizzeria",
    });
    spot("to-shop", 1064, 448, "Entrar na mercearia", "door", { to: "shop" });
    for (const [x, y] of [
      [64, 96],
      [190, 140],
      [700, 160],
      [800, 260],
      [1280, 150],
      [1440, 288],
      [650, 810],
      [800, 890],
      [1140, 880],
      [20, 800],
      [1440, 960],
    ]) {
      crop("village", 10, 15, 3, 3, x, y, y + 90);
      solid(x + 28, y + 64, 34, 27);
    }
    for (let x = 120; x < 1500; x += 160) {
      crop("village", 2 + (x % 3), 12, 1, 1, x, 730, 739);
      crop("village", 2, 14, 1, 1, x + 32, 760, 770);
    }
    for (let x = 96; x < 320; x += 32)
      crop("village", 5, 15, 1, 1, x, 420, 445);
    for (let x = 32; x < 1540; x += 96) {
      crop("village", 10, 15, 3, 3, x, 0, 90);
      solid(x + 28, 64, 34, 27);
    }
    crop("village", 10, 0, 4, 4, 1200, 30, 0);
    crop("village", 0, 13, 1, 1, 710, 570, 605);
    label(728, 548, "VALDORA", "#f4d08b", 17);
    npc("lia", 1180, 618);
    npc("daniel", 840, 480);
    npc("rosa", 300, 715);
    label(500, 950, "Uma cidade pequena. Um novo começo.", "#eee0b9", 15);
  } else {
    rect(0, 0, width, height, 0x192e30, -30);
    // Continuous wood floor and warm plaster, composed from the room builder.
    tiled("rooms", 4, 11, 96, 128, 960, 576, -20, 2, 1);
    tiled("rooms", 5, 7, 96, 64, 960, 96, -18);
    rect(88, 64, 8, 640, 0x4c4039, -10);
    rect(1056, 64, 8, 640, 0x4c4039, -10);
    rect(88, 704, 976, 12, 0x4c4039, -10);
    solid(0, 0, width, 150);
    solid(0, 0, 100, height);
    solid(1052, 0, 100, height);
    solid(0, 704, width, 64);
    for (const x of [160, 800]) crop("interiors", 1, 28, 3, 2, x, 86, 153);
    label(576, 94, locations[s.place].toUpperCase(), "#f4d08b", 15);
    if (s.place === "pizzeria") {
      // Kitchen along the back wall. All work stations are reachable from the same clear aisle.
      for (let x = 320; x <= 704; x += 96) {
        crop("interiors", 0, 57, 3, 2, x, 168, 230);
        solid(x, 178, 96, 44);
      }
      crop("interiors", 7, 49, 2, 4, 848, 152, 280);
      solid(850, 174, 62, 90);
      crop("rooms", 11, 5, 3, 2, 128, 210, 250);
      crop("interiors", 8, 20, 2, 2, 128, 164, 270, 3);
      solid(136, 174, 80, 82);
      label(880, 158, "DESPENSA", "#e6cf95", 10);
      label(180, 160, "FORNO");
      label(424, 163, "BANCADA");
      label(686, 163, "RECEITAS");
      spot("oven", 180, 286, "Usar o forno", "oven");
      spot("bench", 420, 264, "Preparar pizza", "bench");
      spot("book", 680, 264, "Caderno do avô", "book");
      crop("interiors", 11, 12, 1, 1, 664, 184, 235);
      for (const [x, y] of [
        [272, 400],
        [736, 400],
        [272, 560],
        [736, 560],
      ]) {
        crop("interiors", 1, 10, 3, 3, x, y, y + 80);
        solid(x + 4, y + 12, 88, 62);
        crop("interiors", 4, 21, 1, 2, x - 32, y + 20, y + 70);
        solid(x - 30, y + 36, 28, 18);
        crop("interiors", 4, 21, 1, 2, x + 98, y + 20, y + 70);
        solid(x + 100, y + 36, 28, 18);
        crop("interiors", 11, 13, 1, 1, x + 32, y + 26, y + 85);
      }
      crop("interiors", 5, 25, 2, 2, 936, 332, 390);
      solid(940, 354, 56, 32);
      plant(976, 570);
      plant(120, 580);
      spot("upgrade", 966, 422, "Melhorar forno", "upgrade");
      label(968, 330, "MELHORIAS", "#e6cf95", 11);
      spot("to-street", 560, 670, "Sair para a rua", "door", { to: "street" });
      label(560, 710, "↓ RUA");
      for (let step = 0; step < 5; step++) {
        crop("rooms", 4, 13, 2, 1, 956, 508 + step * 18, 590 + step);
        rect(956, 530 + step * 18, 64, 3, 0x5f5141, 591 + step);
      }
      spot("to-apartment", 950, 570, "Subir ao apartamento", "door", {
        to: "apartment",
      });
      label(966, 490, "↑ QUARTO", "#fff0c8", 10);
      for (let i = 0; i < cleaning.length; i++)
        if (!s.cleaned.includes(cleaning[i])) {
          const points = [
            [478, 370],
            [600, 485],
            [860, 590],
            [410, 580],
            [632, 340],
            [200, 480],
            [690, 590],
            [525, 276],
          ];
          const [x, y] = points[i];
          if (i < 3 || i === 7)
            crop("interiors", 0, 59, 2, 2, x - 24, y - 40, y);
          else if (i < 5) {
            for (let j = 0; j < 5; j++)
              rect(x - 22 + j * 9, y - 2 + (j % 2) * 5, 9, 3, 0x675248, y);
          } else crop("interiors", 2, 23, 1, 1, x - 16, y - 28, y);
          spot(
            cleaning[i],
            x,
            y,
            i < 3 || i === 7
              ? "Recolher caixas"
              : i < 5
                ? "Limpar o chão"
                : "Organizar cadeira",
            "clean",
          );
        }
      npc("rosa", 470, 440);
      if (s.day >= 4) npc("lia", 650, 484);
      if (s.day >= 3) npc("daniel", 820, 520);
      if (s.day === 7) {
        for (let x = 180; x < 1000; x += 64) {
          rect(x, 142, 24, 12, x % 128 === 52 ? 0xc66854 : 0xe4c16c, 300);
        }
      }
    } else if (s.place === "apartment") {
      crop("interiors", 5, 1, 4, 7, 224, 168, 365);
      solid(232, 192, 112, 150);
      spot("bed", 370, 350, "Dormir e encerrar o dia", "bed");
      crop("interiors", 0, 69, 4, 4, 728, 168, 290);
      solid(730, 200, 125, 72);
      plant(920, 200);
      crop("interiors", 7, 15, 4, 3, 480, 370, 0);
      crop("interiors", 6, 23, 3, 1, 776, 450, 478);
      solid(776, 450, 96, 28);
      label(
        576,
        610,
        "Aqui, até o silêncio tem cheiro de casa.",
        "#e9d3a6",
        13,
      );
      spot("to-pizzeria", 560, 670, "Descer para a pizzaria", "door", {
        to: "pizzeria",
      });
      label(560, 710, "↓ PIZZARIA");
      spot("book", 835, 510, "Reler o caderno", "book");
    } else {
      for (const x of [144, 336, 640, 832]) {
        crop("interiors", 12, 69, 3, 5, x, 168, 325);
        solid(x, 182, 96, 120);
      }
      for (let x = 256; x < 832; x += 64) {
        crop("interiors", 3, 59, 2, 2, x, 436, 489);
        solid(x, 442, 64, 48);
      }
      spot("shop-counter", 540, 535, "Comprar ingredientes", "shop");
      label(560, 428, "INGREDIENTES FRESQUINHOS", "#fff0c8", 12);
      plant(936, 550);
      npc("rosa", 800, 360);
      spot("to-street", 560, 670, "Sair para a rua", "door", { to: "street" });
      label(560, 710, "↓ RUA");
    }
  }
  return { spots, solids, width, height };
}
