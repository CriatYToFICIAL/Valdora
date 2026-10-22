import {
  days,
  ingredients,
  names,
  recipes,
  type Ingredient,
  type Line,
  type Person,
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
  type State,
} from "./state";
import { muted, sound, toggleSound } from "./audio";
import type { ValdoraScene } from "./world";
import { paintPizza } from "./pizza-art";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export class UI {
  root = document.querySelector<HTMLDivElement>("#ui")!;
  overlay: HTMLDivElement;
  mode = "menu";
  lines: Line[] = [];
  lineIndex = 0;
  onDone: (() => void) | null = null;
  private hudKey = "";
  private toastTimer = 0;
  constructor(public scene: ValdoraScene) {
    this.root.innerHTML =
      '<div id="hud"></div><div id="hint"></div><div id="toast" role="status"></div><div id="overlay"></div>';
    this.overlay = document.querySelector("#overlay")!;
  }
  get s() {
    return this.scene.state;
  }
  button(id: string, fn: () => void) {
    this.overlay
      .querySelector<HTMLButtonElement>(`#${id}`)
      ?.addEventListener("click", () => {
        sound();
        fn();
      });
  }
  set(html: string, mode: string) {
    this.mode = mode;
    this.overlay.innerHTML = html;
    this.overlay.classList.add("visible");
    this.scene.releaseKeys();
  }
  close() {
    this.mode = "";
    this.overlay.innerHTML = "";
    this.overlay.classList.remove("visible");
    this.scene.releaseKeys();
    this.scene.persist();
  }
  frame(eyebrow: string, title: string, body: string, footer = "") {
    return `<section class="panel"><div class="panel-top"><span class="eyebrow">${eyebrow}</span><button id="close" class="icon" aria-label="Fechar">×</button></div><h2>${title}</h2>${body}${footer}</section>`;
  }
  closable() {
    this.button("close", () => this.close());
  }
  menu() {
    const saved = load();
    this.set(
      `<section class="title-screen"><div class="edition">UM PEQUENO LUGAR PARA RECOMEÇAR</div><div class="logo-mark">✦</div><h1>Valdora</h1><div class="title-rule"><span></span>A primeira fatia<span></span></div><p>Uma chave antiga. Um caderno de receitas.<br>E uma cidade inteira para reencontrar.</p><div class="menu-actions"><button id="new" class="primary">Novo jogo <span>→</span></button><button id="continue" ${saved ? "" : "disabled"}>Continuar ${saved ? `<small>Dia ${saved.day} · ${esc(saved.name)}</small>` : "<small>nenhuma história salva ainda</small>"}</button><button id="credits" class="quiet">Créditos & controles</button></div><div class="menu-note">SETE DIAS · UMA PIZZARIA · UM NOVO COMEÇO</div></section>`,
      "menu",
    );
    this.button("new", () => this.nameScreen(!!saved));
    this.button("continue", () => {
      if (saved) this.scene.startGame(saved);
    });
    this.button("credits", () => this.help(true));
  }
  nameScreen(replacing: boolean) {
    this.set(
      `<section class="panel small"><span class="eyebrow">ANTES DE ABRIR A PORTA</span><h2>Como você se chama?</h2><p>Seu avô deixou uma chave com o seu nome.<br>Agora é hora de voltar para casa.</p><label class="field-label" for="player-name">Seu nome</label><input id="player-name" maxlength="20" placeholder="Alex" autocomplete="off"/><p class="muted">${replacing ? "Começar substituirá o progresso salvo neste navegador." : "O progresso é salvo automaticamente neste navegador."}</p><div class="row"><button id="back">Voltar</button><button id="start" class="primary">Chegar a Valdora →</button></div></section>`,
      "name",
    );
    this.button("back", () => this.menu());
    this.button("start", () =>
      this.scene.newGame(
        (document.querySelector("#player-name") as HTMLInputElement).value,
      ),
    );
    setTimeout(
      () => document.querySelector<HTMLInputElement>("#player-name")?.focus(),
      80,
    );
  }
  dayCard(first = false) {
    const d = days[this.s.day - 1];
    this.set(
      `<section class="day-card"><span class="eyebrow">${first ? "BEM-VINDO A VALDORA" : "UMA NOVA MANHÃ"}</span><div class="day-number">${String(this.s.day).padStart(2, "0")}<span>/ 07</span></div><h2>${d.title}</h2><p>${d.subtitle}</p>${this.s.day > 1 ? '<p class="muted">Rosa deixou uma cesta com os ingredientes básicos do dia.</p>' : '<p class="muted">A pizzaria de seu avô fica logo acima de você.<br>Caminhe até a porta e pressione E.</p>'}<button id="wake" class="primary">${first ? "Guardar a bagagem e seguir" : "Começar o dia"} →</button></section>`,
      "day",
    );
    sound("day");
    this.button("wake", () => this.close());
  }
  dialogue(lines: Line[], done?: () => void) {
    this.lines = lines;
    this.lineIndex = 0;
    this.onDone = done || null;
    this.drawLine();
  }
  drawLine() {
    const line = this.lines[this.lineIndex];
    const person = line.who;
    this.set(
      `<section class="dialogue ${person === "hero" ? "no-portrait" : ""}" aria-live="polite">${person !== "hero" ? `<div class="portrait"><img src="/assets/${person}-portrait.png" alt="Retrato de ${names[person]}"/></div>` : ""}<div class="dialogue-copy"><span class="eyebrow">${person === "hero" ? esc(this.s.name) : names[person]}</span><p>${esc(line.text)}</p><div class="dialogue-bottom"><span>${this.lineIndex + 1} / ${this.lines.length}</span><button id="advance">${this.lineIndex + 1 === this.lines.length ? "Continuar" : "Próxima fala"} <kbd>↵</kbd></button></div></div></section>`,
      "dialogue",
    );
    this.button("advance", () => this.advance());
  }
  advance() {
    if (this.mode !== "dialogue") return;
    sound();
    if (++this.lineIndex < this.lines.length) this.drawLine();
    else {
      const cb = this.onDone;
      this.onDone = null;
      this.close();
      cb?.();
    }
  }
  toast(message: string, error = false) {
    const el = document.querySelector<HTMLDivElement>("#toast")!;
    el.textContent = message;
    el.className = `show ${error ? "error" : ""}`;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (el.className = ""), 4500);
    sound(error ? "bad" : "good");
  }
  hud() {
    const s = this.s;
    const clock = `${Math.floor(s.minute / 60)
      .toString()
      .padStart(2, "0")}:${Math.floor(s.minute % 60)
      .toString()
      .padStart(2, "0")}`;
    const order = s.order;
    const pizza = s.pizza;
    const time = ovenTime(s);
    let oven = "";
    if (pizza?.stage === "oven") {
      const p = Math.min(100, (pizza.seconds / (time + 9)) * 100);
      const good = pizza.seconds >= time && pizza.seconds <= time + 9;
      oven = `<div class="oven-hud"><span>FORNO · ${good ? "RETIRE AGORA" : pizza.seconds > time + 9 ? "PASSOU DO PONTO" : "ASSANDO"} · ${Math.floor(pizza.seconds)}s</span><div class="bake-track"><i style="left:${(time / (time + 9)) * 100}%;width:${(9 / (time + 9)) * 100}%"></i><b style="left:${p}%"></b></div></div>`;
    }
    const html = `<header class="hud-header"><div class="brand">Valdora<span>A PRIMEIRA FATIA</span></div><div class="day-pill"><b>Dia ${String(s.day).padStart(2, "0")}</b><span>${days[s.day - 1].title}</span></div><div class="clock">☀ ${clock}</div><div class="money">R$ ${s.money}</div><button id="bag" title="Inventário e caderno (I)">Caderno <kbd>I</kbd></button><button id="help" aria-label="Controles">?</button></header><aside class="objective"><span class="eyebrow">O QUE VEM AGORA</span><p>${objective(s)}</p>${order ? `<div class="order-note"><b>${order.accepted ? "PEDIDO" : "CLIENTE ESPERANDO"}</b><span>${names[order.person]} · ${recipes[order.recipe].name}</span>${order.accepted ? `<small>${recipes[order.recipe].items.map((i) => ingredients[i].name).join(" + ")}</small>` : "<small>Converse com o cliente no salão.</small>"}</div>` : ""}${pizza && pizza.stage !== "oven" ? `<small class="carrying">${pizza.stage === "assembly" ? "Na bancada" : pizza.stage === "raw" ? "Leve ao forno" : "Pronta para entregar"} · ${recipes[pizza.recipe].name}${pizza.stage === "ready" ? ` (${pizza.quality})` : ""}</small>` : ""}${oven}</aside><footer class="hud-footer"><span>✦ ${this.scene.locationName()}</span><span><kbd>WASD</kbd> mover <kbd>E</kbd> interagir <kbd>↵</kbd> diálogo</span><span class="save-status">${this.scene.saveFailed ? "⚠ Salvamento indisponível" : "◆ salvo neste navegador"}</span></footer>`;
    if (html !== this.hudKey) {
      this.hudKey = html;
      document.querySelector("#hud")!.innerHTML = html;
      document.querySelector("#bag")?.addEventListener("click", () => {
        if (!this.mode) this.journal();
      });
      document.querySelector("#help")?.addEventListener("click", () => {
        if (!this.mode) this.help();
      });
    }
  }
  hint(text: string) {
    const el = document.querySelector("#hint")!;
    el.innerHTML = text ? `<kbd>E</kbd> ${esc(text)}` : "";
  }
  journal() {
    this.set(
      this.frame(
        "CADERNO DO ANTÔNIO",
        "Receitas & pequenas conquistas",
        `<div class="journal-grid"><div><h3>Receitas da família</h3>${this.s.unlocked.map((id) => `<article class="recipe"><b>${recipes[id].name}<span>R$ ${recipes[id].price}</span></b><p>${recipes[id].description}</p><small>${recipes[id].items.map((i) => ingredients[i].name).join(" · ")}</small></article>`).join("")}<h3>Hoje</h3><p>${objective(this.s)}</p><p class="muted">${this.s.dailyServed} / ${quota(this.s)} atendimentos · ${this.s.upgrade ? "Forno com isolamento instalado" : "Forno original do Antônio"}</p></div><div><h3>Na despensa</h3>${Object.entries(
          ingredients,
        )
          .map(
            ([id, i]) =>
              `<div class="stock"><span>${i.name}</span><b>${this.s.inventory[id as Ingredient]}</b></div>`,
          )
          .join(
            "",
          )}<h3>Nesta semana</h3><p>${this.s.sold} pizzas vendidas<br>${this.s.customers} clientes atendidos<br>R$ ${this.s.earned} recebidos<br>${this.s.perfect} pizzas no ponto</p></div></div>`,
      ),
      "journal",
    );
    this.closable();
    const rating = document.createElement("p");
    rating.className = "muted";
    rating.textContent = this.s.customers
      ? `Satisfação da vizinhança: ${Math.round(this.s.satisfaction / this.s.customers)}%`
      : "A primeira avaliação ainda está por vir.";
    this.overlay
      .querySelector(".journal-grid > div:last-child")
      ?.append(rating);
  }
  pizzaGraphic() {
    return '<canvas id="pizza-preview" width="64" height="64" class="pixel-pizza" aria-label="Pizza montada com os ingredientes selecionados"></canvas>';
  }
  kitchen() {
    const s = this.s;
    if (s.day === 1) {
      this.toast("Primeiro, vamos limpar e encontrar o caderno.", true);
      return;
    }
    if (!s.pizza) {
      this.set(
        this.frame(
          "BANCADA DA COZINHA",
          "Toda pizza começa aqui.",
          `<p>Escolha uma receita. Depois, coloque os ingredientes na massa.</p><div class="recipe-options">${s.unlocked.map((id) => `<button id="recipe-${id}"><b>${recipes[id].name}</b><small>${recipes[id].items.map((i) => ingredients[i].name).join(" + ")}</small>${s.order?.recipe === id ? '<span class="tag">PEDIDO ATUAL</span>' : ""}</button>`).join("")}</div>`,
        ),
        "kitchen",
      );
      this.closable();
      for (const id of s.unlocked)
        this.button(`recipe-${id}`, () => {
          beginPizza(s, id);
          this.scene.persist();
          this.kitchen();
        });
      return;
    }
    if (s.pizza.stage !== "assembly") {
      this.toast(
        s.pizza.stage === "raw"
          ? "Pizza montada! Leve ao forno, à esquerda."
          : "Termine a pizza atual. Use o caderno para ver o pedido.",
      );
      return;
    }
    const p = s.pizza;
    this.set(
      this.frame(
        "MÃOS NA MASSA",
        `Pizza de ${recipes[p.recipe].name}`,
        `<div class="assembly-grid"><div>${this.pizzaGraphic()}<p class="muted centered">${p.items.length} / ${recipes[p.recipe].items.length} ingredientes</p></div><div><p class="recipe-reminder">${recipes[p.recipe].items.map((i) => `${p.items.includes(i) ? "✓" : "○"} ${ingredients[i].name}`).join("<br>")}</p><div class="ingredient-buttons">${Object.entries(
          ingredients,
        )
          .map(
            ([id, i]) =>
              `<button id="add-${id}" ${p.items.includes(id as Ingredient) ? "disabled" : ""}><span class="ingredient-dot" style="background:${i.color}"></span>${i.name}<small>${s.inventory[id as Ingredient]} un.</small></button>`,
          )
          .join("")}</div></div></div>`,
        `<div class="row"><button id="discard">Recomeçar</button><button id="assemble" class="primary">Montar e levar →</button></div>`,
      ),
      "kitchen",
    );
    this.closable();
    paintPizza(
      this.overlay.querySelector<HTMLCanvasElement>("#pizza-preview")!,
      p.items,
    );
    for (const id of Object.keys(ingredients) as Ingredient[])
      this.button(`add-${id}`, () => {
        const err = addIngredient(s, id);
        if (err) this.toast(err, true);
        else {
          this.scene.persist();
          this.kitchen();
        }
      });
    this.button("discard", () => {
      discard(s);
      this.kitchen();
    });
    this.button("assemble", () => {
      const err = finishAssembly(s);
      if (err) this.toast(err, true);
      else {
        this.close();
        this.toast("Pizza montada! Caminhe até o forno à esquerda.");
      }
    });
  }
  oven() {
    const p = this.s.pizza;
    this.set(
      this.frame(
        "O CORAÇÃO DA COZINHA",
        "Forno do Antônio",
        `<p>${p?.stage === "oven" ? "A pizza continua assando enquanto esta janela está aberta. Retire na faixa verde." : p?.stage === "raw" ? "Sua pizza está pronta para entrar. A faixa verde indica o ponto certo." : "Monte uma pizza na bancada antes de ligar o forno."}</p><div id="oven-live"></div>`,
        `<div class="row"><button id="leave">Voltar ao salão</button><button id="oven-action" class="primary">${p?.stage === "oven" ? "Retirar pizza" : "Colocar pizza"}</button></div>`,
      ),
      "oven",
    );
    this.closable();
    this.button("leave", () => this.close());
    this.button("oven-action", () => this.scene.useOven());
    this.updateOven();
  }
  updateOven() {
    if (this.mode !== "oven") return;
    const el = document.querySelector("#oven-live");
    if (!el) return;
    const p = this.s.pizza;
    const t = ovenTime(this.s),
      seconds = p?.seconds || 0;
    const status =
      seconds < t
        ? "A massa ainda está crua"
        : seconds <= t + 9
          ? "No ponto! Pode retirar."
          : "Queimou. A próxima vai ficar melhor.";
    el.innerHTML = `<div class="oven-display"><span>${p?.stage === "oven" ? Math.floor(seconds) + "s" : "Pronto para assar"}</span><p>${p?.stage === "oven" ? status : `Ponto ideal: ${t} a ${t + 9} segundos`}</p><div class="bake-track"><i style="left:${(t / (t + 9)) * 100}%;width:${(9 / (t + 9)) * 100}%"></i><b style="left:${Math.min(100, (seconds / (t + 9)) * 100)}%"></b></div></div>`;
  }
  shop() {
    this.set(
      this.frame(
        "MERCEARIA BOA PROSA",
        "Fresquinho, como deve ser.",
        `<p>Pacotes de 3 unidades. Saldo: <b>R$ ${this.s.money}</b></p><div class="shop-list">${Object.entries(
          ingredients,
        )
          .map(
            ([id, i]) =>
              `<button id="buy-${id}"><span class="ingredient-dot" style="background:${i.color}"></span><b>${i.name}</b><small>${this.s.inventory[id as Ingredient]} na despensa</small><strong>3 un. · R$ ${i.price * 3}</strong></button>`,
          )
          .join(
            "",
          )}</div><div class="assistance"><p>Acabou algum ingrediente do pedido? A cesta solidária da Rosa ajuda a recomeçar.</p><button id="rescue">Pedir kit de emergência gratuito</button></div>`,
      ),
      "shop",
    );
    this.closable();
    for (const i of Object.keys(ingredients) as Ingredient[])
      this.button(`buy-${i}`, () => {
        const err = buy(this.s, i);
        this.scene.persist();
        this.shop();
        this.toast(err || "Ingredientes guardados na despensa.", !!err);
      });
    this.button("rescue", () => {
      const err = rescue(this.s);
      this.scene.persist();
      this.shop();
      this.toast(
        err || "Rosa separou um kit. Depois você retribui com uma boa pizza.",
        !!err,
      );
    });
  }
  upgrade() {
    this.set(
      this.frame(
        "UM POUCO DE CARINHO",
        "Mais calor. Menos espera.",
        `<div class="upgrade-icon">♨</div><p>Daniel preparou um kit de isolamento para o forno.</p><p>O tempo ideal passa de <b>16 para 9 segundos</b>.<br>A janela de acerto continua generosa: 9 segundos.</p><p class="muted">Melhoria opcional · disponível a partir do dia 6</p>`,
        `<button id="purchase-upgrade" class="primary" ${this.s.upgrade || this.s.day < 6 ? "disabled" : ""}>${this.s.upgrade ? "✓ Já instalado" : "Instalar por R$ 80"}</button>`,
      ),
      "upgrade",
    );
    this.closable();
    this.button("purchase-upgrade", () => {
      if (this.s.money < 80) {
        this.toast("Faltam algumas pizzas para juntar R$ 80.", true);
        return;
      }
      this.s.money -= 80;
      this.s.upgrade = true;
      this.scene.persist();
      this.upgrade();
      this.toast("Isolamento instalado. Seu forno está mais rápido!");
    });
  }
  repair() {
    const expected = ["off", "wire", "on"][this.s.repairStep];
    this.set(
      this.frame(
        "DANIEL ESTÁ DE OLHO",
        "Um conserto a quatro mãos.",
        `<p>“Primeiro desligue. Depois aperte o conector. Só então pode religar.”</p><div class="repair-steps"><span class="${this.s.repairStep > 0 ? "done" : ""}">1 · Desligar</span><span class="${this.s.repairStep > 1 ? "done" : ""}">2 · Ajustar</span><span>3 · Religar</span></div><div class="recipe-options"><button id="off">Desligar a energia</button><button id="wire">Apertar o conector</button><button id="on">Religar e testar</button></div><p class="muted">Etapa ${this.s.repairStep + 1} de 3 · O forno precisa estar frio e vazio.</p>`,
      ),
      "repair",
    );
    this.closable();
    for (const id of ["off", "wire", "on"])
      this.button(id, () => {
        if (id !== expected) {
          this.toast(
            "Daniel: “Calma. Vamos seguir a ordem, por segurança.”",
            true,
          );
          return;
        }
        this.s.repairStep++;
        if (this.s.repairStep === 3) {
          this.s.repaired = true;
          this.close();
          this.dialogue(
            [
              {
                who: "daniel",
                text: "Pronto. Ouviu? Esse é o som certo. E você levou jeito.",
              },
              {
                who: "hero",
                text: "Obrigado, Daniel. A próxima é por minha conta.",
              },
              {
                who: "daniel",
                text: "De calabresa? Seu avô deixou a receita. Eu… lembro do cheiro.",
              },
            ],
            () => {
              this.scene.persist();
              this.toast("Forno consertado · receita de Calabresa disponível!");
            },
          );
        } else {
          this.scene.persist();
          this.repair();
        }
      });
  }
  sleep() {
    this.set(
      this.frame(
        "O DIA CABE NA MEMÓRIA",
        "Apagar as luzes?",
        `<p>Você atendeu <b>${this.s.dailyServed} clientes</b> hoje.<br>Os ingredientes ficam guardados para amanhã.</p><p class="muted">Pizzas em preparo são encerradas ao dormir. O jogo será salvo.</p>`,
        `<div class="row"><button id="stay">Ainda quero passear</button><button id="sleep" class="primary">Dormir →</button></div>`,
      ),
      "sleep",
    );
    this.closable();
    this.button("stay", () => this.close());
    this.button("sleep", () => this.scene.sleep());
  }
  help(fromMenu = false) {
    this.set(
      this.frame(
        "PARA SE SENTIR EM CASA",
        "Um pequeno guia de Valdora",
        `<div class="journal-grid"><div><h3>Seu dia</h3><p><kbd>WASD</kbd> ou <kbd>↑↓←→</kbd> caminhar<br><kbd>E</kbd> interagir com o objeto mais próximo<br><kbd>Enter</kbd> / <kbd>Espaço</kbd> avançar falas<br><kbd>I</kbd> inventário e receitas<br><kbd>Esc</kbd> fechar painéis</p><p>Portas são interativas. Para encerrar o dia, suba ao apartamento e use a cama. O relógio para nas conversas; às 23h50 ele espera por você.</p><h3>Uma pizza de cada vez</h3><p>Converse com o cliente → bancada → ingredientes → montar → forno → retirar no verde → cliente. O pedido fica no canto da tela.</p><p>Uma pizza crua ou queimada rende menos, mas conta para o dia. Se errou a receita, você pode descartar a pizza no caderno de ajuda.</p><button id="discard-pizza">Descartar pizza atual</button></div><div><h3>Créditos</h3><p>Personagens: Universal LPC Spritesheet Character Generator e seus artistas. <a href="/assets/hero-credits-credits.txt" target="_blank">Protagonista</a> · <a href="/assets/rosa-credits-credits.txt" target="_blank">Rosa</a> · <a href="/assets/lia-credits-credits.txt" target="_blank">Lia</a> · <a href="/assets/daniel-credits-credits.txt" target="_blank">Daniel</a>.</p><p>Cenários: LimeZu — Serene Village Revamped e Modern Interiors Free v2.2. <a href="/assets/Modern-Interiors-LICENSE.txt" target="_blank">Modern Interiors Free: licença não comercial</a>.</p><p>Retratos: fornecidos pelo criador do projeto.<br>Efeitos sonoros: síntese original via Web Audio.</p><button id="sound">Som: ${muted ? "desligado" : "ligado"}</button><p class="muted">Salvamento local automático. Limpar os dados do navegador apaga a partida.</p></div></div>`,
      ),
      "help",
    );
    this.button("close", () => (fromMenu ? this.menu() : this.close()));
    this.button("sound", () => {
      toggleSound();
      this.help(fromMenu);
    });
    this.button("discard-pizza", () => {
      discard(this.s);
      this.scene.persist();
      this.toast(
        "Pizza descartada. Ingredientes de uma montagem inacabada foram devolvidos.",
      );
    });
  }
  conclusion() {
    this.set(
      `<section class="ending panel"><span class="eyebrow">PIZZARIA DO ANTÔNIO · PRIMEIRA SEMANA</span><div class="logo-mark">✦</div><h1>Uma mesa cheia<br>de recomeços.</h1><p>Você devolveu à casa o seu melhor ingrediente: gente.</p><div class="stats"><div><b>${this.s.sold}</b><span>pizzas vendidas</span></div><div><b>R$ ${this.s.earned}</b><span>dinheiro ganho</span></div><div><b>${this.s.customers}</b><span>clientes atendidos</span></div></div><blockquote>Fim da primeira semana. Esta é apenas a primeira fatia da sua história.</blockquote><button id="back-menu" class="primary">Guardar essa história →</button></section>`,
      "ending",
    );
    this.button("back-menu", () => {
      this.scene.running = false;
      this.menu();
    });
  }
}
