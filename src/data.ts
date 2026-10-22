export type Person = "hero" | "rosa" | "lia" | "daniel";
export type Place = "street" | "pizzeria" | "apartment" | "shop";
export type Ingredient =
  | "massa"
  | "molho"
  | "queijo"
  | "manjericao"
  | "calabresa";
export type RecipeId = "queijo" | "margherita" | "calabresa";
export interface Line {
  who: Person;
  text: string;
}
export const names: Record<Person, string> = {
  hero: "Você",
  rosa: "Dona Rosa",
  lia: "Lia",
  daniel: "Daniel",
};
export const ingredients: Record<
  Ingredient,
  { name: string; price: number; color: string }
> = {
  massa: { name: "Massa", price: 2, color: "#e6bc78" },
  molho: { name: "Molho", price: 2, color: "#b54e43" },
  queijo: { name: "Queijo", price: 3, color: "#f5d882" },
  manjericao: { name: "Manjericão", price: 1, color: "#68a85e" },
  calabresa: { name: "Calabresa", price: 3, color: "#a74742" },
};
export const recipes: Record<
  RecipeId,
  { name: string; items: Ingredient[]; price: number; description: string }
> = {
  queijo: {
    name: "Queijo",
    items: ["massa", "molho", "queijo"],
    price: 24,
    description: "A receita que nunca precisa de apresentação.",
  },
  margherita: {
    name: "Margherita",
    items: ["massa", "molho", "queijo", "manjericao"],
    price: 30,
    description: "Um pouco de verde, um pouco de verão.",
  },
  calabresa: {
    name: "Calabresa",
    items: ["massa", "molho", "queijo", "calabresa"],
    price: 34,
    description: "A favorita de quem conserta o mundo com as mãos.",
  },
};
export const days = [
  {
    title: "A chegada",
    subtitle: "Toda história precisa de uma porta aberta.",
    quota: 0,
  },
  {
    title: "A primeira pizza",
    subtitle: "Farinha no avental. Coragem nas mãos.",
    quota: 1,
  },
  {
    title: "Portas abertas",
    subtitle: "O cheiro bom já chegou à calçada.",
    quota: 3,
  },
  {
    title: "Novos rostos",
    subtitle: "A cidade tem seus próprios temperos.",
    quota: 4,
  },
  {
    title: "Um imprevisto",
    subtitle: "Às vezes, a receita pede uma mão amiga.",
    quota: 4,
  },
  {
    title: "Começando a crescer",
    subtitle: "Uma mesa cheia de possibilidades.",
    quota: 5,
  },
  {
    title: "A primeira semana",
    subtitle: "O melhor ingrediente sempre foi gente.",
    quota: 3,
  },
];
export const introductions: Record<number, Line[]> = {
  1: [
    { who: "hero", text: "Nossa... está pior do que eu imaginava." },
    {
      who: "rosa",
      text: "Olha só… esse jeito de franzir a testa. Você só pode ser o neto do seu Antônio.",
    },
    { who: "hero", text: "Sou eu. A chave ainda funciona. Já o resto…" },
    {
      who: "rosa",
      text: "Seu avô dizia que casa fechada fica triste. Mas nada que uma vassoura e uma boa conversa não resolvam.",
    },
    {
      who: "rosa",
      text: "Sou a Rosa, da casa amarela. Vamos tirar essas caixas, limpar o chão e pôr as cadeiras no lugar? A cozinha está soterrada lá no fundo.",
    },
    { who: "hero", text: "Uma coisa de cada vez. Acho que eu consigo." },
  ],
  2: [
    {
      who: "rosa",
      text: "Bom dia! Trouxe ingredientes. E uma regra muito séria: nunca cozinhe de mau humor. O queijo percebe.",
    },
    {
      who: "hero",
      text: "O caderno começa com pizza de queijo. Parece um bom começo.",
    },
    {
      who: "rosa",
      text: "Na bancada: massa, molho e queijo. Depois leve ao forno. Retire quando a faixa estiver verde; antes fica crua, depois vira carvão.",
    },
    {
      who: "rosa",
      text: "Hoje a primeira cliente sou eu. Pegue meu pedido aqui no salão. Prometo uma crítica quase imparcial.",
    },
  ],
  3: [
    {
      who: "rosa",
      text: "Virei a plaquinha para ABERTO. Pronto, agora é oficial!",
    },
    { who: "hero", text: "E se ninguém vier?" },
    {
      who: "rosa",
      text: "Eu contei para três pessoas. Ou seja: a cidade inteira já sabe. Atenda três pedidos e depois descanse.",
    },
  ],
  4: [
    {
      who: "lia",
      text: "Então é daqui que vem esse cheiro! Sou a Lia, da floricultura. Trouxe manjericão. É uma planta que já nasce querendo virar pizza.",
    },
    {
      who: "hero",
      text: "Tem uma receita de Margherita no caderno. Coincidência?",
    },
    {
      who: "lia",
      text: "Destino gastronômico. A mercearia, na rua à direita, vende tudo para ela. Passe lá e faça uma compra. E sim, eu vim pedir uma.",
    },
  ],
  5: [
    { who: "hero", text: "O forno fez um barulho que não estava no caderno…" },
    {
      who: "daniel",
      text: "Ouvi da oficina. Quando um forno começa a assobiar, não é talento musical.",
    },
    {
      who: "rosa",
      text: "Daniel entende dessas coisas. E fala mais com motores do que com gente.",
    },
    {
      who: "daniel",
      text: "É só um contato solto. Desligue, aperte o conector e religue. Nessa ordem. Eu fico aqui com você.",
    },
  ],
  6: [
    {
      who: "lia",
      text: "Já tem gente marcando encontro aqui. Até a Rosa deixou de chamar isso de “a pizzaria fechada”.",
    },
    {
      who: "rosa",
      text: "Eu nunca disse fechada. Disse temporariamente muito silenciosa.",
    },
    {
      who: "hero",
      text: "O dinheiro está começando a sobrar. Talvez dê para melhorar o forno.",
    },
    {
      who: "daniel",
      text: "Deixei um kit de isolamento na bancada de melhorias. Custa R$ 80. Assa mais rápido. Não faz milagres com pizza esquecida.",
    },
  ],
  7: [
    {
      who: "rosa",
      text: "Hoje faz uma semana. Trouxemos flores, ferramentas e uma fome respeitável.",
    },
    { who: "lia", text: "Flores fui eu. Ferramentas você consegue adivinhar." },
    {
      who: "daniel",
      text: "É uma comemoração. Achei melhor garantir que nada quebrasse.",
    },
    {
      who: "hero",
      text: "Então hoje a casa é nossa. Três pizzas para fechar a semana?",
    },
    {
      who: "rosa",
      text: "E depois olhe o caderno. Seu avô sempre escondia as melhores coisas no fim.",
    },
  ],
};
export const smallTalk: Record<Person, string[]> = {
  hero: [],
  rosa: [
    "Seu avô guardava os trocados numa lata de biscoitos. Os biscoitos? Numa lata de tinta. Não tente entender.",
    "Uma pizzaria sem conversa é só um forno com aluguel.",
    "Hoje a cidade parece um pouquinho menos apressada. Deve ser o cheiro do molho.",
  ],
  lia: [
    "Na floricultura eu escuto todos os segredos da cidade. As samambaias são discretíssimas.",
    "Se um dia fizer pizza de flores, me chama. Para impedir, provavelmente.",
    "Eu passava aqui depois da escola. Seu avô sempre fingia que tinha feito uma pizza a mais.",
  ],
  daniel: [
    "O forno está com um som bom. Sim, isso é um elogio.",
    "Meu primeiro conserto foi a bicicleta do seu avô. Ele pagou em pizza. Foi um bom negócio.",
    "Se precisar, a oficina é logo ali. Bate duas vezes. A campainha está… em manutenção.",
  ],
};
export const ending: Line[] = [
  { who: "hero", text: "Tem uma página dobrada. A letra dele…" },
  {
    who: "hero",
    text: "“Se você está lendo isso, a casa voltou a ter cheiro de pizza. Eu sabia que voltaria.”",
  },
  {
    who: "hero",
    text: "“A massa descansa, o molho apura e as pessoas também precisam do seu tempo. Não tenha pressa de acertar tudo.”",
  },
  {
    who: "hero",
    text: "“Eu pensei que estava construindo um restaurante. No fim, eram as pessoas que estavam construindo a minha vida.”",
  },
  {
    who: "hero",
    text: "“Cuide delas. E deixe uma cadeira para quem ainda vai chegar. Com amor, vô Antônio.”",
  },
  { who: "rosa", text: "Ele ficaria muito orgulhoso. Não só da pizza." },
  {
    who: "hero",
    text: "Acho que… vou ficar. Ainda tem muita gente para sentar à mesa.",
  },
];
