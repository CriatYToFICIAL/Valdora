import Phaser from "phaser";
import {
  ending,
  introductions,
  names,
  recipes,
  smallTalk,
  type Person,
  type Place,
} from "./data";
import {
  bake,
  canSleep,
  cleaning,
  fresh,
  introDone,
  load,
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
import { buildMap, locations, type MapResult, type Spot } from "./maps";
import { UI } from "./ui";
import { sound } from "./audio";
export class ValdoraScene extends Phaser.Scene {
  state: State = fresh("Alex");
  ui!: UI;
  running = false;
  saveFailed = false;
  hero!: Phaser.GameObjects.Sprite;
  shadow!: Phaser.GameObjects.Ellipse;
  carry!: Phaser.GameObjects.Text;
  map!: MapResult;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  direction = 2;
  nearest: Spot | null = null;
  npcs = new Map<Person, Phaser.GameObjects.Sprite>();
  bubbles = new Map<Person, Phaser.GameObjects.Text>();
  private saveTimer = 0;
  private alarm = false;
  private transition = false;
  private bubbleTimer = 0;
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
    for (const key of ["village", "interiors", "rooms"])
      this.load.image(key, `/assets/${key}.png`);
    this.load.on("loaderror", (file: { key: string }) =>
      console.error("Falha ao carregar recurso:", file.key),
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
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ENTER,SPACE,ESC,I",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.ui = new UI(this);
    this.drawWorld();
    this.ui.menu();
    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      if (event.repeat) return;
      if (
        (event.code === "Enter" || event.code === "Space") &&
        this.ui.mode === "dialogue"
      ) {
        event.preventDefault();
        this.ui.advance();
        return;
      }
      if (
        event.code === "Escape" &&
        this.ui.mode &&
        !["menu", "name", "dialogue", "day", "ending"].includes(this.ui.mode)
      )
        this.ui.close();
      if (event.code === "KeyI" && this.running && !this.ui.mode)
        this.ui.journal();
      if (
        event.code === "KeyE" &&
        this.running &&
        !this.ui.mode &&
        !this.transition
      )
        this.interact();
    });
    window.addEventListener("pagehide", () => {
      if (this.running) this.persist();
    });
    // Read-only inspectable scene for browser QA, restricted to Vite's development server.
    if (import.meta.env.DEV)
      (window as unknown as { valdora: ValdoraScene }).valdora = this;
  }
  releaseKeys() {
    if (this.keys) for (const key of Object.values(this.keys)) key.reset();
  }
  locationName() {
    return locations[this.state.place];
  }
  newGame(name: string) {
    this.startGame(fresh(name), true);
  }
  startGame(s: State, first = false) {
    this.state = s;
    this.state.satisfaction ??= 0;
    startOrder(s);
    this.running = true;
    this.direction = 2;
    this.drawWorld();
    this.persist();
    if (s.complete) this.ui.conclusion();
    else if (first) this.ui.dayCard(true);
    else {
      this.ui.close();
      this.checkIntroduction();
    }
  }
  drawWorld() {
    this.children.removeAll(true);
    this.npcs.clear();
    this.bubbles.clear();
    this.map = buildMap(this, this.state);
    for (const spot of this.map.spots.filter((v) => v.kind === "npc")) {
      this.add
        .ellipse(spot.x, spot.y + 1, 30, 12, 0x142622, 0.25)
        .setDepth(spot.y - 1);
      const sprite = this.add
        .sprite(spot.x, spot.y + 6, `${spot.person}-idle`, 26)
        .setOrigin(0.5, 1)
        .setDepth(spot.y);
      sprite.play(`${spot.person}-idle-2`);
      this.npcs.set(spot.person!, sprite);
      const text = this.add
        .text(spot.x, spot.y - 66, "", {
          fontFamily: "monospace",
          fontSize: 12,
          color: "#fff0d0",
          backgroundColor: "#2c473b",
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5, 1)
        .setDepth(spot.y + 100);
      this.bubbles.set(spot.person!, text);
    }
    this.shadow = this.add.ellipse(
      this.state.x,
      this.state.y + 1,
      28,
      10,
      0x142622,
      0.28,
    );
    this.hero = this.add
      .sprite(this.state.x, this.state.y + 6, "hero-idle", 26)
      .setOrigin(0.5, 1);
    this.hero.play("hero-idle-2");
    this.carry = this.add
      .text(this.state.x, this.state.y - 58, "●", {
        fontSize: 22,
        color: "#f1c265",
        stroke: "#65422c",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12, 0, 0);
    this.cameras.main.setBackgroundColor("#192e30");
    this.nearest = null;
    this.updateNpcBubbles();
  }
  checkIntroduction() {
    if (
      this.state.place === "pizzeria" &&
      !this.state.introduced.includes(this.state.day)
    ) {
      this.ui.dialogue(introductions[this.state.day], () => {
        introDone(this.state);
        this.persist();
        this.updateNpcBubbles();
      });
    }
  }
  travel(to: Place) {
    if (this.transition) return;
    this.transition = true;
    this.persist();
    this.ui.hint("");
    this.cameras.main.fadeOut(180, 21, 40, 38);
    this.time.delayedCall(190, () => {
      const from = this.state.place;
      this.state.place = to;
      const spawn: Record<Place, [number, number]> = {
        street: from === "shop" ? [1064, 470] : [472, 476],
        pizzeria: from === "apartment" ? [920, 610] : [560, 630],
        apartment: [560, 620],
        shop: [560, 620],
      };
      [this.state.x, this.state.y] = spawn[to];
      this.drawWorld();
      this.cameras.main.fadeIn(220, 21, 40, 38);
      this.transition = false;
      this.persist();
      this.checkIntroduction();
    });
  }
  persist() {
    if (!this.running) return;
    if (this.hero) {
      this.state.x = this.hero.x;
      this.state.y = this.hero.y - 6;
    }
    this.saveFailed = !save(this.state);
  }
  blocked(x: number, y: number) {
    return (
      x < 20 ||
      x > this.map.width - 20 ||
      y < 30 ||
      y > this.map.height - 20 ||
      this.map.solids.some(
        (r) =>
          x + 10 > r.x &&
          x - 10 < r.x + r.w &&
          y + 4 > r.y &&
          y - 7 < r.y + r.h,
      )
    );
  }
  update(_time: number, delta: number) {
    if (!this.ui || !this.hero) return;
    if (!this.running) {
      this.ui.hint("");
      return;
    }
    const dt = Math.min(delta / 1000, 0.05);
    const paused = !!this.ui.mode && !["oven"].includes(this.ui.mode);
    if (!paused && !this.transition) {
      tick(this.state, dt);
      if (!this.ui.mode) {
        let dx =
            Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
            Number(this.keys.A.isDown || this.keys.LEFT.isDown),
          dy =
            Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
            Number(this.keys.W.isDown || this.keys.UP.isDown);
        if (dx || dy) {
          if (dx) this.direction = dx < 0 ? 1 : 3;
          else this.direction = dy < 0 ? 0 : 2;
          const len = Math.hypot(dx, dy);
          dx = (dx / len) * 170 * dt;
          dy = (dy / len) * 170 * dt;
          let x = this.hero.x,
            y = this.hero.y - 6;
          if (!this.blocked(x + dx, y)) x += dx;
          if (!this.blocked(x, y + dy)) y += dy;
          this.hero.setPosition(x, y + 6);
          this.hero.play(`hero-walk-${this.direction}`, true);
        } else this.hero.play(`hero-idle-${this.direction}`, true);
      } else this.hero.play(`hero-idle-${this.direction}`, true);
      if (
        this.state.pizza?.stage === "oven" &&
        this.state.pizza.seconds >= ovenTime(this.state) &&
        !this.alarm
      ) {
        this.alarm = true;
        sound("good");
        this.ui.toast("A pizza está no ponto! Retire do forno.");
      }
    } else this.hero.play(`hero-idle-${this.direction}`, true);
    this.hero.setDepth(this.hero.y);
    this.shadow
      .setPosition(this.hero.x, this.hero.y - 5)
      .setDepth(this.hero.y - 1);
    this.carry
      .setPosition(this.hero.x, this.hero.y - 67)
      .setDepth(this.hero.y + 1)
      .setVisible(
        !!this.state.pizza && ["raw", "ready"].includes(this.state.pizza.stage),
      );
    this.findNearest();
    this.ui.hint(
      !this.ui.mode && this.nearest ? this.spotLabel(this.nearest) : "",
    );
    this.ui.hud();
    this.ui.updateOven();
    this.saveTimer += dt;
    if (this.saveTimer > 4) {
      this.saveTimer = 0;
      this.persist();
    }
    this.bubbleTimer += dt;
    if (this.bubbleTimer > 1) {
      this.bubbleTimer = 0;
      this.updateNpcBubbles();
    }
  }
  findNearest() {
    let distance = 88;
    this.nearest = null;
    for (const spot of this.map.spots) {
      const d = Phaser.Math.Distance.Between(
        this.hero.x,
        this.hero.y - 6,
        spot.x,
        spot.y,
      );
      if (d < distance) {
        distance = d;
        this.nearest = spot;
      }
    }
  }
  spotLabel(spot: Spot) {
    const order = this.state.order;
    if (spot.kind === "npc" && order && order.person === spot.person)
      return order.accepted
        ? "Entregar pedido / conversar"
        : `Receber pedido de ${names[spot.person!]}`;
    return spot.label;
  }
  updateNpcBubbles() {
    for (const [p, b] of this.bubbles) {
      const order = this.state.order;
      const active = order?.person === p;
      b.setText(
        active
          ? order.accepted
            ? `Uma de ${recipes[order.recipe].name.toLowerCase()}!`
            : "Olá! Posso pedir?"
          : this.state.day === 7
            ? "Uma semana! ✦"
            : "",
      );
      b.setVisible(!!b.text);
    }
  }
  interact() {
    this.findNearest();
    const spot = this.nearest;
    if (!spot) {
      this.ui.toast("Chegue um pouco mais perto para interagir.");
      return;
    }
    sound();
    switch (spot.kind) {
      case "door":
        this.travel(spot.to!);
        break;
      case "npc":
        this.talk(spot.person!);
        break;
      case "clean":
        this.clean(spot);
        break;
      case "book":
        this.readBook();
        break;
      case "bench":
        this.ui.kitchen();
        break;
      case "oven":
        if (this.state.day === 5 && !this.state.repaired) this.ui.repair();
        else if (this.state.pizza?.stage === "ready")
          this.ui.toast("Você está carregando uma pizza. Entregue ao cliente.");
        else this.ui.oven();
        break;
      case "shop":
        this.ui.shop();
        break;
      case "upgrade":
        this.ui.upgrade();
        break;
      case "bed":
        if (canSleep(this.state)) this.ui.sleep();
        else
          this.ui.dialogue([
            {
              who: "hero",
              text:
                this.state.day === 7
                  ? "Antes de descansar, quero terminar a comemoração e ler o caderno."
                  : `Ainda tenho algo para fazer. ${objective(this.state)}`,
            },
          ]);
        break;
    }
  }
  clean(spot: Spot) {
    if (this.state.cleaned.includes(spot.id)) return;
    this.state.cleaned.push(spot.id);
    const x = this.hero.x,
      y = this.hero.y;
    this.state.x = x;
    this.state.y = y - 6;
    this.drawWorld();
    this.persist();
    sound("good");
    this.ui.toast(
      this.state.cleaned.length === cleaning.length
        ? "Pronto! Debaixo das caixas havia um caderno na cozinha."
        : `${spot.label === "Organizar cadeira" ? "Cadeira no lugar!" : "Mais um cantinho arrumado!"} · ${this.state.cleaned.length}/${cleaning.length}`,
    );
  }
  readBook() {
    const s = this.state;
    if (s.day === 1) {
      if (s.cleaned.length < cleaning.length) {
        this.ui.dialogue([
          {
            who: "hero",
            text: "O balcão está coberto de coisas. Primeiro vou terminar a limpeza.",
          },
        ]);
        return;
      }
      this.ui.dialogue(
        [
          {
            who: "hero",
            text: "“Receitas do Antônio”. O caderno do vô! Tem molho seco na capa… e anotações nas margens.",
          },
          {
            who: "rosa",
            text: "Ele dizia que receita boa era a que a gente compartilhava. Guarde com carinho.",
          },
          {
            who: "hero",
            text: "Pizza de queijo. Vou começar por ela amanhã. Hoje, preciso encontrar a cama lá em cima.",
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
  talk(p: Person) {
    const s = this.state,
      order = s.order;
    if (s.place === "pizzeria" && order?.person === p) {
      if (!order.accepted) {
        this.ui.dialogue(
          [
            {
              who: p,
              text: `${p === "rosa" ? "Meu pedido vem com uma pitadinha de saudade." : p === "lia" ? "Depois de regar tanta planta, agora é minha vez." : "Hoje a oficina deu fome."} Uma pizza de ${recipes[order.recipe].name.toLowerCase()}, por favor.`,
            },
            { who: "hero", text: "Pode deixar. Vou preparar uma caprichada." },
          ],
          () => {
            order.accepted = true;
            this.persist();
            this.updateNpcBubbles();
          },
        );
        return;
      }
      if (s.pizza?.stage === "ready") {
        const result = serve(s);
        if (result.error) {
          this.ui.toast(result.error, true);
          return;
        }
        // Depart, then return/arrive for the next order. State is saved with no active customer during this interval.
        const sprite = this.npcs.get(p);
        if (sprite) {
          sprite.play(`${p}-walk-2`);
          this.tweens.add({
            targets: sprite,
            y: 700,
            alpha: 0,
            duration: 1100,
            onComplete: () => {
              if (sprite.active) {
                const pos = this.map.spots.find((v) => v.person === p);
                sprite
                  .setPosition(pos?.x || 470, (pos?.y || 440) + 6)
                  .setAlpha(1)
                  .play(`${p}-idle-2`);
              }
            },
          });
        }
        this.ui.dialogue(
          [
            { who: p, text: result.text! },
            {
              who: "hero",
              text: `Obrigado por vir! +R$ ${result.amount}${s.dailyServed >= quota(s) ? " · Os pedidos de hoje estão concluídos." : ""}`,
            },
          ],
          () => {
            startOrder(s);
            this.persist();
            this.updateNpcBubbles();
          },
        );
        sound("good");
        this.persist();
        return;
      }
      this.ui.dialogue([
        {
          who: p,
          text: `Sem pressa, ${s.name}. Minha pizza é de ${recipes[order.recipe].name.toLowerCase()}. ${s.pizza?.stage === "oven" ? "O forno já está cheirando bem!" : "Eu espero aqui."}`,
        },
      ]);
      return;
    }
    this.ui.dialogue([
      {
        who: p,
        text:
          smallTalk[p][(s.day + (s.sold % 3)) % smallTalk[p].length] ||
          "Que bom estar em casa.",
      },
    ]);
  }
  useOven() {
    const s = this.state;
    let error: string | null;
    if (s.pizza?.stage === "oven") {
      error = takePizza(s);
      if (!error) {
        this.ui.close();
        this.ui.toast(
          `Pizza ${s.pizza!.quality}! Leve ao cliente no salão.`,
          s.pizza!.quality !== "perfeita",
        );
      }
    } else {
      error = bake(s);
      if (!error) {
        this.alarm = false;
        this.ui.oven();
        sound("good");
      }
    }
    if (error) this.ui.toast(error, true);
    this.persist();
  }
  sleep() {
    this.ui.close();
    if (!nextDay(this.state)) return;
    this.drawWorld();
    this.persist();
    this.ui.dayCard();
  }
}
