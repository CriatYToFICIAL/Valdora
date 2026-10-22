import {
  days,
  ingredients,
  names,
  recipes,
  type Ingredient,
  type Line,
  type RecipeId,
} from "./data";
import {
  addIngredient,
  beginPizza,
  buy,
  discard,
  finishAssembly,
  load,
  objective,
  ovenTime,
  quota,
  rescue,
} from "./state";
import { buildings } from "./maps";
import { muted, sound, toggleSound } from "./audio";
import { paintPizza } from "./pizza-art";
import type { ValdoraScene } from "./world";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export class UI {
  root = document.querySelector<HTMLDivElement>("#ui")!;
  overlay!: HTMLDivElement;
  mode = "menu";
  lines: Line[] = [];
  index = 0;
  typed = 0;
  callback: (() => void) | undefined;
  selected: Ingredient | null = null;
  private hudValue = "";
  private toastClock = 0;
  private thoughtClock = 0;
  constructor(public scene: ValdoraScene) {
    this.root.innerHTML =
      '<div id="logical-ui"><div id="hud"></div><div id="hint"></div><div id="toast" role="status"></div><div id="overlay"></div></div>';
    this.overlay = document.querySelector("#overlay")!;
    new ResizeObserver(() => this.resize()).observe(this.root);
    this.resize();
  }
  resize() {
    const el = document.querySelector<HTMLDivElement>("#logical-ui")!;
    el.style.transform = `scale(${this.root.clientWidth / 640})`;
  }
  get s() {
    return this.scene.state;
  }
  button(id: string, fn: () => void) {
    this.overlay
      .querySelector<HTMLButtonElement>("#" + id)
      ?.addEventListener("click", () => {
        sound("tap");
        fn();
      });
  }
  set(html: string, mode: string) {
    this.mode = mode;
    this.overlay.innerHTML = html;
    this.overlay.className = "visible " + mode;
    this.scene.releaseKeys();
  }
  close() {
    this.mode = "";
    this.overlay.className = "";
    this.overlay.innerHTML = "";
    this.scene.thought?.setVisible(false);
    this.scene.releaseKeys();
    this.scene.persist();
  }
  frame(title: string, html: string, footer = "") {
    return `<section class="rpg-panel"><header><h2>${title}</h2><button id="close" aria-label="Fechar">×</button></header>${html}${footer}</section>`;
  }
  closable() {
    this.button("close", () => this.close());
  }
  menu() {
    const saved = load();
    this.set(
      `<div class="menu-scene"><span class="overline">UMA CHAVE. UMA CIDADE. UM RECOMEÇO.</span><h1>VALDORA</h1><p class="subtitle">A primeira fatia</p><nav><button id="new">▶ Novo jogo</button><button id="continue" ${saved ? "" : "disabled"}>Continuar${saved ? ` · dia ${saved.day}` : ""}</button><button id="credits">Guia & créditos</button></nav><small>PRIMEIRA SEMANA · EDIÇÃO LPC</small></div>`,
      "menu",
    );
    this.button("new", () => this.name(!!saved));
    this.button("continue", () => {
      if (saved) this.scene.startGame(saved);
    });
    this.button("credits", () => this.help(true));
  }
  name(replace: boolean) {
    this.set(
      this.frame(
        "O nome na chave",
        `<p>Seu avô deixou a pizzaria para você.<br>Como os vizinhos vão chamar você?</p><input id="player-name" maxlength="20" value="Alex" aria-label="Nome do protagonista"/><small>${replace ? "Uma nova história substituirá o slot desta edição. O save da versão anterior será preservado." : "Seu progresso é salvo neste navegador."}</small>`,
        `<button id="start">Chegar a Valdora →</button>`,
      ),
      "name",
    );
    this.button("close", () => this.menu());
    this.button("start", () =>
      this.scene.newGame(
        this.overlay.querySelector<HTMLInputElement>("#player-name")!.value,
      ),
    );
  }
  dayCard(first = false) {
    const d = days[this.s.day - 1];
    this.set(
      `<section class="rpg-panel day-card"><span class="overline">${first ? "A ESTRADA TERMINA AQUI" : "UMA NOVA MANHÃ"}</span><h2>Dia ${this.s.day} · ${d.title}</h2><p>${d.subtitle}</p><small>${first ? "A pizzaria fica logo ao norte. Entre caminhando pela porta." : "Rosa deixou ingredientes básicos. Os pequenos erros também cabem nesta semana."}</small><button id="wake">${first ? "Guardar a bagagem" : "Levantar"} →</button></section>`,
      "day",
    );
    this.button("wake", () => this.close());
  }
  dialogue(lines: Line[], done?: () => void) {
    this.lines = lines;
    this.index = 0;
    this.callback = done;
    this.drawLine();
  }
  drawLine() {
    const line = this.lines[this.index];
    this.typed = 0;
    if (line.who === "hero") {
      this.set(
        '<button id="advance" class="thought-next" aria-label="Avançar pensamento">↵</button>',
        "thought",
      );
      this.scene.think(line.text, 6);
      this.thoughtClock = Math.max(2.5, line.text.length / 35);
      this.button("advance", () => this.advance());
      return;
    }
    this.scene.thought.setVisible(false);
    this.set(
      `<section class="dialogue" aria-live="polite"><div class="portrait"><img src="/assets/${line.who}-portrait.png" alt="${names[line.who]}"/></div><div class="dialogue-copy"><b>${names[line.who]}</b><p id="speech"></p><button id="advance" aria-label="Avançar diálogo">▼ <kbd>↵</kbd></button></div></section>`,
      "dialogue",
    );
    this.button("advance", () => this.advance());
  }
  advance() {
    if (!["thought", "dialogue"].includes(this.mode)) return;
    const line = this.lines[this.index];
    if (this.mode === "dialogue" && this.typed < line.text.length) {
      this.typed = line.text.length;
      this.overlay.querySelector("#speech")!.textContent = line.text;
      return;
    }
    if (++this.index < this.lines.length) this.drawLine();
    else {
      const cb = this.callback;
      this.callback = undefined;
      this.close();
      cb?.();
    }
  }
  update(dt: number) {
    if (this.mode === "dialogue") {
      const line = this.lines[this.index];
      this.typed = Math.min(line.text.length, this.typed + dt * 45);
      const speech = this.overlay.querySelector("#speech");
      if (speech)
        speech.textContent = line.text.slice(0, Math.ceil(this.typed));
    }
    if (this.mode === "thought") {
      this.thoughtClock -= dt;
      if (this.thoughtClock <= 0) this.advance();
    }
    if (this.toastClock > 0) {
      this.toastClock -= dt;
      if (this.toastClock <= 0)
        document.querySelector("#toast")!.className = "";
    }
  }
  key(e: KeyboardEvent) {
    if (
      ["Enter", "Space"].includes(e.code) &&
      ["dialogue", "thought"].includes(this.mode)
    ) {
      e.preventDefault();
      this.advance();
      return;
    }
    if (e.code === "Escape" && !["menu", "day", "ending"].includes(this.mode)) {
      this.close();
      return;
    }
    if (this.mode === "kitchen") {
      const n = Number(e.key) - 1;
      if (n >= 0 && n < 5) {
        this.putIngredient(Object.keys(ingredients)[n] as Ingredient, 0.5, 0.5);
        return;
      }
      if (e.code === "KeyE" || e.code === "Enter") this.finishPizza();
    }
  }
  toast(text: string, error = false) {
    const el = document.querySelector("#toast")!;
    el.textContent = text;
    el.className = "show" + (error ? " error" : "");
    this.toastClock = 3.6;
    if (error) sound("bad");
  }
  hud() {
    const s = this.s,
      h = Math.floor((s.minute % 1440) / 60),
      m = Math.floor(s.minute % 60),
      order = s.order;
    const current = order
      ? order.kind === "delivery"
        ? order.accepted
          ? `Entrega · ${recipes[order.recipe].name} · ${buildings.find((b) => b.place === order.destination)?.address}`
          : "☎ O telefone está tocando"
        : order.accepted
          ? `Pedido · ${recipes[order.recipe].name}`
          : "Um cliente está chegando ao balcão."
      : "";
    const text = `<div class="time-hud"><b>D${s.day}</b> ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} <span>${h >= 19 || h < 6 ? "☾" : "☀"}</span></div><div class="wallet">R$ ${s.money} <button id="bag" aria-label="Caderno">▤ I</button></div><div class="task-hud">${escape(objective(s))}${current ? `<small>${escape(current)}</small>` : ""}</div><div class="save-indicator" title="${this.scene.saveFailed ? "Salvamento indisponível" : "Salvo localmente"}">${this.scene.saveFailed ? "!" : "◆"}</div>`;
    if (text !== this.hudValue) {
      this.hudValue = text;
      document.querySelector("#hud")!.innerHTML = text;
      document.querySelector("#bag")?.addEventListener("click", () => {
        if (!this.mode) this.journal();
      });
    }
  }
  hint(text: string) {
    document.querySelector("#hint")!.textContent = text;
  }
  journal() {
    this.set(
      this.frame(
        "Caderno do Antônio",
        `<div class="journal-grid"><div><h3>Receitas</h3>${this.s.unlocked.map((id) => `<article><b>${recipes[id].name} <em>R$ ${recipes[id].price}</em></b><p>${recipes[id].items.map((i) => ingredients[i].name).join(" · ")}</p></article>`).join("")}<small>Hoje: ${this.s.dailyServed}/${quota(this.s)} pedidos<br>Forno: ${this.s.upgrade ? "isolamento novo" : "original do Antônio"}</small></div><div><h3>Despensa</h3>${Object.entries(
          ingredients,
        )
          .map(
            ([id, i]) =>
              `<div class="stock"><span>${i.name}</span><b>${this.s.inventory[id as Ingredient]}</b></div>`,
          )
          .join(
            "",
          )}<p>${this.s.sold} pizzas · ${this.s.deliveries} entregas<br>R$ ${this.s.earned} recebidos</p><small>Satisfação: ${this.s.customers ? Math.round(this.s.satisfaction / this.s.customers) : 100}%</small></div></div>`,
        `<div class="actions"><button id="discard">Descartar pizza atual</button><button id="guide">Controles</button></div>`,
      ),
      "journal",
    );
    this.closable();
    this.button("discard", () => {
      discard(this.s);
      this.scene.persist();
      this.toast("Montagens inacabadas devolvem os ingredientes.");
    });
    this.button("guide", () => this.help());
  }
  kitchen() {
    const s = this.s;
    if (s.pizza && s.pizza.stage !== "assembly") {
      this.scene.think("Termine a pizza que está preparando primeiro.");
      return;
    }
    if (!s.pizza) {
      const recipe = s.order?.recipe || s.unlocked[0];
      beginPizza(s, recipe);
    }
    const p = s.pizza!;
    this.set(
      `<section class="kitchen-station"><header><b>BANCADA · ${recipes[p.recipe].name.toUpperCase()}</b><button id="close">×</button></header><div class="recipe-note">${recipes[p.recipe].items.map((i) => `${p.items.includes(i) ? "✓" : "○"} ${ingredients[i].name}`).join("　")}</div><div class="worktop"><canvas id="pizza-preview" width="64" height="64" aria-label="Arraste ingredientes para montar a pizza"></canvas><span class="flour">✧</span></div><div class="ingredient-tray">${Object.entries(
        ingredients,
      )
        .map(
          ([id, i], n) =>
            `<button class="ingredient" id="add-${id}" data-item="${id}" ${p.items.includes(id as Ingredient) && !["calabresa", "manjericao"].includes(id) ? "disabled" : ""}><i style="--ingredient:${i.color}">${["◯", "▰", "▧", "❧", "●"][n]}</i><span>${i.name}</span><small>${n + 1} · ${s.inventory[id as Ingredient]} un.</small></button>`,
        )
        .join(
          "",
        )}</div><footer><span>ARRASTE PARA A MASSA · ou teclas 1–5</span><button id="restart">Recomeçar</button><button id="assemble">E · Levar pizza</button></footer></section>`,
      "kitchen",
    );
    this.closable();
    paintPizza(
      this.overlay.querySelector("#pizza-preview")!,
      p.items,
      p.toppings,
    );
    for (const id of Object.keys(ingredients) as Ingredient[]) {
      const button = this.overlay.querySelector<HTMLButtonElement>(
        "#add-" + id,
      )!;
      button.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.selected = id;
        button.classList.add("selected");
      });
    }
    const canvas =
      this.overlay.querySelector<HTMLCanvasElement>("#pizza-preview")!;
    canvas.addEventListener("pointerup", (e) => {
      if (this.selected) {
        const r = canvas.getBoundingClientRect();
        this.putIngredient(
          this.selected,
          (e.clientX - r.left) / r.width,
          (e.clientY - r.top) / r.height,
        );
      }
    });
    this.button("restart", () => {
      discard(s);
      this.kitchen();
    });
    this.button("assemble", () => this.finishPizza());
  }
  putIngredient(item: Ingredient, x: number, y: number) {
    if (this.mode !== "kitchen") return;
    const e =
      this.s.pizza?.items.includes(item) &&
      ["calabresa", "manjericao"].includes(item)
        ? null
        : addIngredient(this.s, item);
    if (e) {
      this.toast(e, true);
      return;
    }
    this.s.pizza!.toppings ??= [];
    this.s.pizza!.toppings.push({ item, x, y });
    this.selected = null;
    sound("box");
    this.scene.persist();
    this.kitchen();
  }
  finishPizza() {
    const e = finishAssembly(this.s);
    if (e) {
      this.toast(e, true);
      return;
    }
    this.close();
    this.scene.think("Montada. Agora, o forno.");
  }
  shop() {
    this.set(
      this.frame(
        "Mercearia Boa Prosa",
        `<p>Pacotes de três · saldo R$ ${this.s.money}</p><div class="shop-list">${Object.entries(
          ingredients,
        )
          .map(
            ([id, i]) =>
              `<button id="buy-${id}"><i style="color:${i.color}">◆</i> ${i.name}<small>${this.s.inventory[id as Ingredient]} na despensa</small><b>R$ ${i.price * 3}</b></button>`,
          )
          .join(
            "",
          )}</div><small>Se faltar ingrediente, a cesta solidária da Rosa ajuda a recomeçar.</small>`,
        `<button id="rescue">Pedir um kit de emergência gratuito</button>`,
      ),
      "shop",
    );
    this.closable();
    for (const id of Object.keys(ingredients) as Ingredient[])
      this.button("buy-" + id, () => {
        const e = buy(this.s, id);
        this.scene.persist();
        this.shop();
        this.toast(e || "Ingredientes guardados na despensa.", !!e);
        sound("coins");
      });
    this.button("rescue", () => {
      const e = rescue(this.s);
      this.scene.persist();
      this.shop();
      this.toast(e || "Rosa separou um kit para você.", !!e);
    });
  }
  upgrade() {
    this.set(
      this.frame(
        "Um forno com fôlego novo",
        `<p>Daniel pode instalar um isolamento.<br>O ponto ideal passa de <b>16 para 9 segundos</b>.</p><small>Disponível a partir do dia 6 · melhoria opcional</small>`,
        `<button id="purchase-upgrade" ${this.s.day < 6 || this.s.upgrade ? "disabled" : ""}>${this.s.upgrade ? "✓ Instalado" : "Instalar · R$ 80"}</button>`,
      ),
      "upgrade",
    );
    this.closable();
    this.button("purchase-upgrade", () => {
      if (this.s.money < 80) {
        this.toast("Ainda faltam algumas pizzas.", true);
        return;
      }
      this.s.money -= 80;
      this.s.upgrade = true;
      this.scene.persist();
      this.upgrade();
      sound("good");
    });
  }
  repair() {
    this.set(
      this.frame(
        "Daniel trouxe a caixa de ferramentas",
        `<p>“Desligue. Ajuste o contato. Só depois religue.”</p><div class="repair-diagram"><span>⌁ ENERGIA</span><span>◇ CONTATO</span><span>♨ TESTE</span></div><p>Etapa ${this.s.repairStep + 1}/3</p><div class="actions"><button id="off">Desligar</button><button id="wire">Apertar contato</button><button id="on">Religar</button></div>`,
      ),
      "repair",
    );
    this.closable();
    for (const id of ["off", "wire", "on"])
      this.button(id, () => {
        if (id !== ["off", "wire", "on"][this.s.repairStep]) {
          this.toast("Daniel: “Calma. Uma coisa de cada vez.”", true);
          return;
        }
        this.s.repairStep++;
        sound("box");
        if (this.s.repairStep === 3) {
          this.s.repaired = true;
          this.close();
          this.dialogue(
            [
              {
                who: "daniel",
                text: "Pronto. Agora parece forno, não chaleira. Você levou jeito.",
              },
              {
                who: "hero",
                text: "Deu certo. E eu não precisei fingir que entendo de fios.",
              },
            ],
            () => this.scene.persist(),
          );
        } else this.repair();
        this.scene.persist();
      });
  }
  sleep() {
    this.set(
      this.frame(
        "Fechar os olhos?",
        `<p>${this.s.dailyServed} pedidos concluídos hoje.<br>Amanhã a cozinha acorda com você.</p><small>Pizzas em preparo são encerradas ao dormir.</small>`,
        `<button id="sleep">Dormir até amanhã →</button>`,
      ),
      "sleep",
    );
    this.closable();
    this.button("sleep", () => this.scene.sleep());
  }
  help(menu = false) {
    this.set(
      this.frame(
        "Um guia para se sentir em casa",
        `<div class="journal-grid"><div><h3>Controles</h3><p>WASD / setas · andar<br>Shift · correr<br>E · conversar / usar<br>I · caderno<br>Enter / espaço · texto<br>Esc · voltar</p><p>Entre nas portas caminhando. Suba ao apartamento e use a cama para avançar o dia.</p><h3>Uma pizza</h3><p>Cliente → bancada → arrastar ingredientes → forno → retirar no ponto → servir.</p><h3>Entrega</h3><p>Telefone → cozinhar → embalar → seguir o marcador → E no endereço correto.</p></div><div><h3>Créditos</h3><p>Mundo LPC: Lanea Zimmerman (Sharm) e Daniel Armstrong (HughSpectrum), CC BY-SA 3.0.</p><p>Personagens: Universal LPC. <a href="/assets/hero-credits-credits.txt" target="_blank">Autores do protagonista</a>, <a href="/assets/rosa-credits-credits.txt" target="_blank">Rosa</a>, <a href="/assets/lia-credits-credits.txt" target="_blank">Lia</a>, <a href="/assets/daniel-credits-credits.txt" target="_blank">Daniel</a>.</p><p>Retratos fornecidos pelo criador. Efeitos e ambiente sonoro sintetizados para Valdora.</p><a href="/assets/lpc/LICENSE-CC-BY-SA-3.0.txt" target="_blank">Licença dos cenários</a><p>O save anterior permanece intacto. Esta edição usa um novo slot.</p><button id="sound">Som ${muted ? "desligado" : "ligado"}</button></div></div>`,
      ),
      "help",
    );
    this.button("close", () => (menu ? this.menu() : this.close()));
    this.button("sound", () => {
      toggleSound();
      this.help(menu);
    });
  }
  conclusion() {
    this.set(
      `<section class="rpg-panel ending"><span class="overline">O ANTÔNIO TERIA GUARDADO UMA MESA</span><h2>A primeira semana</h2><p>A casa voltou a ter cheiro de pizza.<br>E a cidade voltou a ter um lugar para ficar.</p><div class="summary"><div><b>${this.s.sold}</b>pizzas</div><div><b>${this.s.deliveries}</b>entregas</div><div><b>R$ ${this.s.earned}</b>recebidos</div></div><p class="final-line">Fim da primeira semana. Esta é apenas a primeira fatia da sua história.</p><button id="back-menu">Guardar esta história →</button></section>`,
      "ending",
    );
    this.button("back-menu", () => {
      this.scene.running = false;
      this.menu();
    });
  }
}
