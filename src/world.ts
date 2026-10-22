import Phaser from "phaser";
import {
  ending,
  introductions,
  names,
  recipes,
  smallTalk,
  type Place,
} from "./data";
import {
  bake,
  canSleep,
  cleaning,
  fresh,
  introDone,
  nextDay,
  objective,
  ovenTime,
  quota,
  save,
  serve,
  startOrder,
  takePizza,
  tick,
  type State,
} from "./state";
import {
  buildMap,
  buildings,
  locations,
  type MapData,
  type Spot,
  type Door,
} from "./maps";
import { inside, slide } from "./navigation";
import { ids, updateResidents, type NpcId } from "./actors";
import { Lighting } from "./lighting";
import { SilhouetteShadow } from "./shadows";
import { ObjectShadows } from "./object-shadows";
import { atmosphere } from "./lighting";
import { UI } from "./ui";
import { sound, ambience } from "./audio";
export class ValdoraScene extends Phaser.Scene {
  state: State = fresh("Alex");
  ui!: UI;
  running = false;
  saveFailed = false;
  hero!: Phaser.GameObjects.Sprite;
  map!: MapData;
  lighting!: Lighting;
  heroShadow!: SilhouetteShadow;
  objectShadows!: ObjectShadows;
  windowGlows: Phaser.GameObjects.Image[] = [];
  box!: Phaser.GameObjects.Graphics;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  direction = 2;
  nearest: Spot | null = null;
  nearNpc: NpcId | null = null;
  transition = false;
  npcs = new Map<NpcId, Phaser.GameObjects.Sprite>();
  npcShadows = new Map<NpcId, SilhouetteShadow>();
  npcBubbles = new Map<NpcId, Phaser.GameObjects.Text>();
  thought!: Phaser.GameObjects.Text;
  carry!: Phaser.GameObjects.Text;
  arrow!: Phaser.GameObjects.Text;
  ovenLabel!: Phaser.GameObjects.Text;
  ovenMeter!: Phaser.GameObjects.Graphics;
  private ringClock = 0;
  private saveClock = 0;
  private footsteps = 0;
  private doorLock = 1;
  private introDelay = 0;
  private readySignal = false;
  private thoughtTimer = 0;
  constructor() {
    super("Valdora");
  }
  preload() {
    for (const p of ["hero", "rosa", "lia", "daniel"])
      for (const a of ["walk", "idle"])
        this.load.spritesheet(`${p}-${a}`, `/assets/${p}-${a}.png`, {
          frameWidth: 64,
          frameHeight: 64,
        });
    for (const k of [
      "house",
      "inside",
      "kitchen",
      "country",
      "cabinets",
      "stairs",
      "grass",
      "dirt",
      "tree",
      "trunk",
      "barrel",
      "signs",
      "floors",
    ])
      this.load.image(k, `/assets/lpc/${k}.png`);
    this.load.on("loaderror", (f: { key: string }) =>
      console.error("Recurso não carregado:", f.key),
    );
  }
  create() {
    for (const p of ["hero", "rosa", "lia", "daniel"])
      for (let dir = 0; dir < 4; dir++)
        for (const a of ["walk", "idle"])
          this.anims.create({
            key: `${p}-${a}-${dir}`,
            frames: this.anims.generateFrameNumbers(`${p}-${a}`, {
              start: dir * 13,
              end: dir * 13 + (a === "walk" ? 8 : 1),
            }),
            frameRate: a === "walk" ? 11 : 2,
            repeat: -1,
          });
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ENTER,SPACE,ESC,I,SHIFT",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.ui = new UI(this);
    this.drawWorld();
    this.ui.menu();
    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || e.repeat) return;
      if (this.ui.mode) {
        this.ui.key(e);
        return;
      }
      if (!this.running || this.transition) return;
      if (e.code === "KeyE") this.interact();
      if (e.code === "KeyI") this.ui.journal();
      if (e.code === "Escape") this.ui.help();
    });
    window.addEventListener("pagehide", () => this.persist());
    if (import.meta.env.DEV)
      (window as unknown as { valdora: ValdoraScene }).valdora = this;
  }
  releaseKeys() {
    if (this.keys) for (const k of Object.values(this.keys)) k.reset();
  }
  locationName() {
    return locations[this.state.place];
  }
  newGame(name: string) {
    this.startGame(fresh(name), true);
  }
  startGame(s: State, first = false) {
    this.state = s;
    this.running = true;
    startOrder(s);
    this.drawWorld();
    this.persist();
    if (s.complete) this.ui.conclusion();
    else if (first) this.ui.dayCard(true);
    else this.ui.close();
    sound("day");
  }
  drawWorld() {
    if (this.lighting) this.lighting.destroy();
    this.children.removeAll(true);
    this.npcs.clear();
    this.npcShadows.clear();
    this.npcBubbles.clear();
    this.map = buildMap(this, this.state);
    this.objectShadows = new ObjectShadows(this);
    this.windowGlows = [];
    if (this.state.place === "street")
      for (const b of buildings) {
        for (const [x, sourceX] of [
          [b.x + 32, 224],
          ...(b.w >= 224 ? [[b.x + b.w - 64, 256]] : []),
        ]) {
          const key = "window-emission-" + sourceX;
          if (!this.textures.exists(key)) {
            const texture = this.textures.createCanvas(key, 32, 64)!,
              ctx = texture.context;
            ctx.drawImage(
              this.textures.get("house").getSourceImage() as HTMLImageElement,
              sourceX,
              0,
              32,
              64,
              0,
              0,
              32,
              64,
            );
            const data = ctx.getImageData(0, 0, 32, 64);
            for (let i = 0; i < data.data.length; i += 4) {
              const isPane =
                data.data[i + 3] > 0 &&
                data.data[i] < 55 &&
                data.data[i + 1] < 55 &&
                data.data[i + 2] < 75;
              data.data[i] = 255;
              data.data[i + 1] = 210;
              data.data[i + 2] = 139;
              data.data[i + 3] = isPane ? 255 : 0;
            }
            ctx.putImageData(data, 0, 0);
            texture.refresh();
          }
          this.windowGlows.push(
            this.add
              .image(x, b.y + 105, key)
              .setOrigin(0)
              .setDepth(b.y + 194),
          );
        }
      }
    this.hero = this.add
      .sprite(this.state.x, this.state.y + 4, "hero-idle", 26)
      .setOrigin(0.5, 1)
      .play(`hero-idle-${this.direction}`);
    this.heroShadow = new SilhouetteShadow(this, "hero");
    this.thought = this.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: 9,
        color: "#38342f",
        backgroundColor: "#f1e5bd",
        padding: { x: 7, y: 5 },
        wordWrap: { width: 190 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(9000)
      .setVisible(false);
    this.carry = this.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: 10,
        color: "#ffe1a0",
        backgroundColor: "#634e35",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(7000);
    this.box = this.add.graphics();
    this.box.fillStyle(0x6b472f).fillRect(-10, -6, 21, 13);
    this.box.fillStyle(0xc39a61).fillRect(-10, -6, 20, 8);
    this.box.fillStyle(0xe8cb8a).fillRect(-9, -5, 18, 1);
    this.box.fillStyle(0x8c4c35).fillRect(-3, -3, 7, 4);
    this.box.fillStyle(0x604333).fillRect(-10, 1, 20, 1);
    this.arrow = this.add
      .text(0, 0, "➤", {
        fontFamily: "monospace",
        fontSize: 16,
        color: "#f6d994",
        stroke: "#3d3a35",
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(9001)
      .setVisible(false);
    this.ovenLabel = this.add
      .text(480, 91, "", {
        fontFamily: "monospace",
        fontSize: 8,
        color: "#f5e3b1",
        backgroundColor: "#3d3432",
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(7000);
    this.ovenMeter = this.add.graphics().setDepth(7001);
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height);
    this.cameras.main.startFollow(this.hero, true, 0.18, 0.18);
    this.cameras.main.roundPixels = true;
    this.lighting = new Lighting(this);
    this.doorLock = 0.8;
    this.syncNpcs();
  }
  syncNpcs() {
    for (const id of ids) {
      const r = this.state.npcs[id];
      let sprite = this.npcs.get(id);
      if (r.place !== this.state.place) {
        sprite?.destroy();
        this.npcs.delete(id);
        this.npcBubbles.get(id)?.destroy();
        this.npcBubbles.delete(id);
        this.npcShadows.get(id)?.image.destroy();
        this.npcShadows.delete(id);
        continue;
      }
      if (!sprite) {
        sprite = this.add
          .sprite(r.x, r.y + 4, `${id}-idle`, 26)
          .setOrigin(0.5, 1);
        this.npcs.set(id, sprite);
        this.npcShadows.set(id, new SilhouetteShadow(this, id));
        this.npcBubbles.set(
          id,
          this.add
            .text(0, 0, "", {
              fontFamily: "monospace",
              fontSize: 8,
              color: "#f8eac4",
              backgroundColor: "#4c5140",
              padding: { x: 4, y: 3 },
            })
            .setOrigin(0.5, 1),
        );
      }
      sprite
        .setPosition(Math.round(r.x), Math.round(r.y + 4))
        .setDepth(r.y + 4)
        .play(`${id}-${r.moving ? "walk" : "idle"}-${r.direction}`, true);
      this.npcShadows
        .get(id)!
        .update(
          sprite,
          this.state.minute,
          this.state.place !== "street",
          this.map.lights,
        );
      const o = this.state.order,
        waiting =
          o &&
          o.kind !== "delivery" &&
          o.person === id &&
          Math.hypot(r.x - 320, r.y - 286) < 24;
      this.npcBubbles
        .get(id)!
        .setPosition(sprite.x, sprite.y - 65)
        .setDepth(sprite.y + 10)
        .setText(
          waiting
            ? o!.accepted
              ? recipes[o!.recipe].name
              : "Posso pedir?"
            : "",
        )
        .setVisible(!!waiting);
    }
  }
  update(_time: number, delta: number) {
    if (!this.ui || !this.hero) return;
    const dt = Math.min(delta / 1000, 0.07);
    this.ui.update(dt);
    if (!this.running) return;
    const active = !this.ui.mode || this.ui.mode === "thought";
    if (active && !this.transition) {
      tick(this.state, dt);
      if (this.state.order?.kind === "delivery" && !this.state.order.accepted) {
        this.ringClock += dt;
        if (this.ringClock > 4) {
          sound("phone");
          this.ringClock = 0;
        }
      } else this.ringClock = 0;
      this.doorLock = Math.max(0, this.doorLock - dt);
      let dx =
          Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
          Number(this.keys.A.isDown || this.keys.LEFT.isDown),
        dy =
          Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
          Number(this.keys.W.isDown || this.keys.UP.isDown);
      if (dx || dy) {
        if (Math.abs(dx) > Math.abs(dy)) this.direction = dx < 0 ? 1 : 3;
        else if (dy) this.direction = dy < 0 ? 0 : 2;
        const len = Math.hypot(dx, dy),
          speed = this.keys.SHIFT.isDown ? 172 : 112;
        [this.state.x, this.state.y] = slide(
          this.map,
          this.state.x,
          this.state.y,
          (dx / len) * speed * dt,
          (dy / len) * speed * dt,
        );
        this.hero.play(`hero-walk-${this.direction}`, true);
        this.hero.anims.timeScale = this.keys.SHIFT.isDown ? 1.5 : 1;
        this.footsteps += dt;
        if (this.footsteps > (this.keys.SHIFT.isDown ? 0.22 : 0.34)) {
          sound("step");
          this.footsteps = 0;
        }
      } else this.hero.play(`hero-idle-${this.direction}`, true);
      updateResidents(this.state, dt);
      if (!this.doorLock) {
        const door = this.map.doors.find((d) =>
          inside(this.state.x, this.state.y, d),
        );
        if (door) this.travel(door);
      }
      this.introDelay += dt;
      if (this.introDelay > 0.3) {
        this.introDelay = 0;
        this.checkIntroduction();
      }
      if (
        this.state.pizza?.stage === "oven" &&
        this.state.pizza.seconds >= ovenTime(this.state) &&
        !this.readySignal
      ) {
        this.readySignal = true;
        sound("oven");
        this.ui.toast("A borda dourou. Hora de tirar!");
      }
    } else this.hero.play(`hero-idle-${this.direction}`, true);
    this.hero
      .setPosition(Math.round(this.state.x), Math.round(this.state.y + 4))
      .setDepth(this.state.y + 4);
    this.heroShadow.update(
      this.hero,
      this.state.minute,
      this.state.place !== "street",
      this.map.lights,
    );
    this.syncNpcs();
    if (this.thoughtTimer > 0) {
      this.thoughtTimer -= dt;
      this.thought.setPosition(this.hero.x, this.hero.y - 66);
      if (this.thoughtTimer <= 0) this.thought.setVisible(false);
    }
    const p = this.state.pizza;
    this.carry
      .setPosition(this.hero.x, this.hero.y - 57)
      .setText(
        p?.stage === "boxed"
          ? ""
          : p && ["ready", "raw"].includes(p.stage)
            ? "◉ PIZZA"
            : "",
      );
    this.box
      .setPosition(this.hero.x + 8, this.hero.y - 25)
      .setDepth(this.hero.y + 1)
      .setVisible(p?.stage === "boxed");
    this.ovenLabel.setVisible(
      this.state.place === "pizzeria" && p?.stage === "oven",
    );
    this.ovenMeter.clear();
    if (p?.stage === "oven") {
      this.ovenLabel.setText(
        p.seconds < ovenTime(this.state)
          ? `ASSANDO ${Math.floor(p.seconds)}s`
          : p.seconds <= ovenTime(this.state) + 9
            ? "✦ NO PONTO!"
            : "PASSOU DO PONTO",
      );
      const t = ovenTime(this.state),
        good = p.seconds >= t && p.seconds <= t + 9;
      this.ovenLabel.setColor(
        good ? "#bfe18b" : p.seconds > t + 9 ? "#ed9b78" : "#f5e3b1",
      );
      if (this.state.place === "pizzeria") {
        this.ovenMeter.fillStyle(0x554638).fillRect(458, 98, 44, 5);
        this.ovenMeter
          .fillStyle(0xa6bd69)
          .fillRect(459 + (42 * t) / (t + 9), 99, (42 * 9) / (t + 9), 3);
        this.ovenMeter
          .fillStyle(0xffebc0)
          .fillRect(459 + Math.min(41, (42 * p.seconds) / (t + 9)), 97, 1, 7);
      }
    }
    this.findNearest();
    this.ui.hint(
      active
        ? this.nearNpc
          ? `E · ${names[this.nearNpc]}`
          : this.nearest
            ? `E · ${this.nearest.label}`
            : ""
        : "",
    );
    this.updateDeliveryMarker();
    this.lighting.update(
      dt,
      this.state.minute,
      this.state.place !== "street",
      this.map.lights,
    );
    this.objectShadows.update(
      dt,
      this.state.minute,
      this.state.place,
      this.map.lights,
    );
    const nightAmount = Math.max(
      0,
      (atmosphere(this.state.minute).darkness - 0.16) / 0.65,
    );
    for (const glow of this.windowGlows) glow.setAlpha(nightAmount);
    this.ui.hud();
    ambience(dt, this.state.minute, this.state.place === "street");
    this.saveClock += dt;
    if (this.saveClock > 3) {
      this.saveClock = 0;
      this.persist();
    }
  }
  think(text: string, seconds = 3.7) {
    this.thought.setText(text).setVisible(true);
    this.thoughtTimer = seconds;
  }
  findNearest() {
    this.nearest = null;
    this.nearNpc = null;
    let dist = 45;
    for (const p of this.map.spots) {
      const d = Math.hypot(this.state.x - p.x, this.state.y - p.y);
      if (d < dist) {
        dist = d;
        this.nearest = p;
      }
    }
    for (const id of ids) {
      const r = this.state.npcs[id];
      if (r.place === this.state.place) {
        const d = Math.hypot(this.state.x - r.x, this.state.y - r.y);
        if (d < dist) {
          this.nearNpc = id;
          this.nearest = null;
          dist = d;
        }
      }
    }
    const o = this.state.order;
    if (o?.kind === "delivery" && this.state.pizza?.stage === "boxed") {
      const a = this.map.spots.find((p) => p.address === o.destination);
      if (a && Math.hypot(a.x - this.state.x, a.y - this.state.y) < 65) {
        this.nearNpc = null;
        this.nearest = a;
      }
    }
  }
  interact() {
    this.findNearest();
    if (this.nearNpc) {
      this.talk(this.nearNpc);
      return;
    }
    const p = this.nearest;
    if (!p) {
      this.think("Um pouco mais perto…", 1.5);
      return;
    }
    sound("tap");
    switch (p.kind) {
      case "clean":
        this.clean(p);
        break;
      case "book":
        this.readBook();
        break;
      case "bench":
        if (this.state.day < 2) this.think("Primeiro, uma boa limpeza.");
        else this.ui.kitchen();
        break;
      case "oven":
        this.useOven();
        break;
      case "pack":
        if (this.state.pizza?.stage === "ready") {
          this.state.pizza.stage = "boxed";
          this.ui.toast("Pizza embalada! Siga o marcador dourado.");
          sound("box");
          this.persist();
        } else this.think("Asse uma pizza antes de embalar.");
        break;
      case "phone":
        this.answerPhone();
        break;
      case "bed":
        if (canSleep(this.state)) this.ui.sleep();
        else
          this.think(
            this.state.day === 7
              ? "Quero terminar a festa e ler o caderno."
              : objective(this.state),
          );
        break;
      case "shop":
        this.ui.shop();
        break;
      case "stock":
        this.ui.journal();
        break;
      case "upgrade":
        this.ui.upgrade();
        break;
      case "address":
        if (
          this.state.order?.kind === "delivery" &&
          this.state.order.accepted &&
          this.state.order.destination === p.address
        )
          this.deliver();
        else this.think(p.label);
        break;
    }
  }
  useOven() {
    const s = this.state;
    if (s.day === 5 && !s.repaired) {
      this.ui.repair();
      return;
    }
    if (s.pizza?.stage === "oven") {
      takePizza(s);
      sound(s.pizza.quality === "perfeita" ? "good" : "bad");
      this.ui.toast(
        `Pizza ${s.pizza.quality}. ${s.order?.kind === "delivery" ? "Embale na bancada ao lado." : "Leve ao cliente."}`,
      );
    } else {
      const e = bake(s);
      if (e) this.think(e);
      else {
        this.readySignal = false;
        sound("bake");
        this.ui.toast("No forno! Retire quando a borda dourar.");
      }
    }
    this.persist();
  }
  answerPhone() {
    const o = this.state.order;
    if (o?.kind !== "delivery") {
      this.think("Nenhuma ligação agora. O silêncio também tem seu valor.");
      return;
    }
    if (o.accepted) {
      this.think(
        `Entrega: ${recipes[o.recipe].name} · ${buildings.find((b) => b.place === o.destination)?.address}`,
      );
      return;
    }
    this.ui.dialogue(
      [
        {
          who: o.person,
          text: `Alô? Aqui é ${names[o.person]}. Você faz entrega? Uma de ${recipes[o.recipe].name.toLowerCase()}, por favor. Estou em ${buildings.find((b) => b.place === o.destination)?.address}. Sem pressa; ainda estou pondo a mesa.`,
        },
        {
          who: "hero",
          text: "Missão fora da cozinha. Assar, embalar e levar. Vamos nessa.",
        },
      ],
      () => {
        o.accepted = true;
        this.persist();
        sound("order");
      },
    );
  }
  deliver() {
    const result = serve(this.state);
    if (result.error) {
      this.think(result.error);
      return;
    }
    sound("coins");
    this.ui.toast(`Entrega feita! +R$ ${result.amount}`);
    this.think("Uma pizza quentinha e um caminho novo conhecido.");
    startOrder(this.state);
    this.persist();
  }
  talk(id: NpcId) {
    const s = this.state,
      o = s.order;
    if (
      o?.person === id &&
      o.kind === "delivery" &&
      o.accepted &&
      s.place === o.destination
    ) {
      this.deliver();
      return;
    }
    if (o?.person === id && o.kind !== "delivery" && s.place === "pizzeria") {
      if (!o.accepted) {
        this.ui.dialogue(
          [
            {
              who: id,
              text: `${id === "rosa" ? "A mesa estava com saudade de mim." : id === "lia" ? "Hoje consegui almoçar antes de esquecer de novo." : "Fechei a oficina. Agora é a vez do forno trabalhar."} Uma de ${recipes[o.recipe].name.toLowerCase()}, por favor.`,
            },
          ],
          () => {
            o.accepted = true;
            this.persist();
            sound("order");
          },
        );
        return;
      }
      if (s.pizza && ["ready", "boxed"].includes(s.pizza.stage)) {
        const r = serve(s);
        if (r.error) this.think(r.error);
        else {
          this.ui.dialogue([{ who: id, text: r.text! }], () => {
            startOrder(s);
            this.persist();
          });
          sound("coins");
          this.ui.toast(`+R$ ${r.amount} · Obrigado pela visita!`);
          this.persist();
        }
        return;
      }
      this.ui.dialogue([
        {
          who: id,
          text: `Uma de ${recipes[o.recipe].name.toLowerCase()}, lembra? Vou aproveitar a espera para descansar um pouco.`,
        },
      ]);
      return;
    }
    this.ui.dialogue([
      {
        who: id,
        text: smallTalk[id][(s.day + s.dailyServed) % smallTalk[id].length],
      },
    ]);
  }
  checkIntroduction() {
    const s = this.state;
    if (this.ui.mode || s.place !== "pizzeria" || s.introduced.includes(s.day))
      return;
    const main = s.day === 4 ? "lia" : s.day === 5 ? "daniel" : "rosa";
    if (s.npcs[main].place !== "pizzeria") return;
    if (s.day === 7 && ids.some((id) => s.npcs[id].place !== "pizzeria"))
      return;
    this.ui.dialogue(introductions[s.day], () => {
      introDone(s);
      this.persist();
    });
  }
  clean(p: Spot) {
    if (this.state.cleaned.includes(p.id)) return;
    this.state.cleaned.push(p.id);
    sound("clean");
    this.drawWorld();
    this.think(
      p.id.startsWith("cadeira")
        ? "Agora sim. Uma cadeira para a próxima conversa."
        : this.state.cleaned.length === cleaning.length
          ? "O chão apareceu. E o caderno também."
          : "Um cantinho de cada vez.",
    );
    this.persist();
  }
  readBook() {
    const s = this.state;
    if (s.day === 1) {
      if (s.cleaned.length < cleaning.length) {
        this.think("O caderno está preso debaixo dessa bagunça.");
        return;
      }
      if (!s.introduced.includes(1)) {
        this.think("A Rosa chegou. Quero ouvir o que ela tem para contar.");
        return;
      }
      this.ui.dialogue(
        [
          {
            who: "hero",
            text: "“Receitas do Antônio”. Tem manchas de molho e uma folha de manjericão entre as páginas.",
          },
          {
            who: "rosa",
            text: "Ele anotava o que cada pessoa gostava. A receita era só metade da página. A outra metade era gente.",
          },
          {
            who: "hero",
            text: "Então amanhã eu começo pela primeira. Hoje… acho que já mereci conhecer a cama lá em cima.",
          },
        ],
        () => {
          s.book = true;
          this.persist();
        },
      );
    } else if (s.day === 7 && s.dailyServed >= quota(s)) {
      this.ui.dialogue(ending, () => {
        s.complete = true;
        this.persist();
        this.ui.conclusion();
      });
    } else this.ui.journal();
  }
  travel(door: Door) {
    if (this.transition) return;
    this.transition = true;
    this.releaseKeys();
    sound("door");
    this.cameras.main.fadeOut(140, 23, 28, 28);
    this.time.delayedCall(155, () => {
      this.state.place = door.to;
      [this.state.x, this.state.y] = door.spawn;
      this.drawWorld();
      this.cameras.main.fadeIn(170, 23, 28, 28);
      this.transition = false;
      this.doorLock = 1;
      this.persist();
    });
  }
  sleep() {
    this.ui.close();
    if (!nextDay(this.state)) return;
    this.drawWorld();
    this.persist();
    this.ui.dayCard();
    sound("day");
  }
  persist() {
    if (this.running) this.saveFailed = !save(this.state);
  }
  updateDeliveryMarker() {
    const o = this.state.order;
    if (
      o?.kind !== "delivery" ||
      !o.accepted ||
      this.state.pizza?.stage !== "boxed"
    ) {
      this.arrow.setVisible(false);
      return;
    }
    let target: [number, number];
    if (this.state.place === "street") {
      const b = buildings.find((b) => b.place === o.destination)!;
      target = [b.door[0], b.door[1] + 30];
    } else if (this.state.place === o.destination)
      target = [this.state.npcs[o.person].x, this.state.npcs[o.person].y];
    else {
      const d =
        this.map.doors.find((d) => d.to === "street") || this.map.doors[0];
      target = [d.x + d.w / 2, d.y];
    }
    const cam = this.cameras.main,
      px = target[0] - cam.scrollX,
      py = target[1] - cam.scrollY,
      cx = Math.max(24, Math.min(616, px)),
      cy = Math.max(48, Math.min(350, py));
    this.arrow
      .setPosition(cx, cy)
      .setRotation(Math.atan2(py - cy, px - cx))
      .setVisible(true);
  }
}
