# Valdora — A primeira fatia

Protótipo jogável em português brasileiro, feito com TypeScript, Phaser 3.90 e Vite 7. Uma semana para devolver vida à pizzaria do avô Antônio.

## Iniciar

Requer Node.js **22.12+** (validado com Node 24) e npm.

```bash
npm ci
npm run dev
```

Abra o endereço indicado pelo Vite no seu navegador. Para gerar e servir uma versão de produção:

```bash
npm run build
npm run preview
```

Não há backend, chaves, contas ou serviços externos. Depois de instalar as dependências, o jogo e todos os recursos são servidos localmente. É necessário teclado; não há controles de toque nesta versão.

## Jogar

- **WASD / setas:** caminhar.
- **E:** interagir com a porta, personagem ou objeto mais próximo. O nome da interação aparece embaixo.
- **Enter / Espaço:** próxima fala. Também é possível clicar no botão.
- **I:** inventário, receitas e progresso.
- **Esc:** fechar painéis.

Escolha um nome no menu. A pizzaria é a casa de telhado vermelho acima do ponto de chegada. A mercearia fica à direita. No salão, as escadas à direita levam ao apartamento; a cama encerra o dia após cumprir o objetivo.

### Uma pizza, do pedido à mesa

1. Converse com o cliente indicado no painel de objetivo.
2. Vá à bancada no fundo do salão. Selecione a receita e adicione os ingredientes certos.
3. Confirme a montagem e caminhe até o forno à esquerda.
4. Coloque a pizza. Ela continua assando com o painel do forno aberto ou enquanto você anda pelo mundo.
5. Retire na faixa verde: **16–25 segundos** no forno original, **9–18 segundos** após a melhoria.
6. Volte ao cliente e pressione E para entregar. O pedido rende dinheiro; uma pizza perfeita e rápida rende gorjeta.

Receitas erradas não são entregues automaticamente. Uma montagem inacabada pode ser reiniciada com devolução dos ingredientes. No botão **?**, é possível descartar qualquer pizza atual. Pizzas cruas ou queimadas rendem menos, mas contam para a progressão.

### Os sete dias

| Dia | História e objetivo                                                      |
| --- | ------------------------------------------------------------------------ |
| 1   | Chegada, conversa com Rosa, oito tarefas de limpeza, caderno e descanso. |
| 2   | Primeira pizza, servida para Dona Rosa.                                  |
| 3   | Abertura, três pedidos.                                                  |
| 4   | Lia, Margherita, visita à mercearia e quatro pedidos.                    |
| 5   | Conserto interativo com Daniel, Calabresa e quatro pedidos.              |
| 6   | Cinco pedidos e melhoria opcional do forno por R$ 80.                    |
| 7   | Comemoração com os três amigos, três pedidos, carta do avô e resumo.     |

São **20 pedidos** ao todo. O ritmo depende da exploração e leitura; a duração de 30–60 minutos é uma meta de design, ainda precisa de medição com jogadores. Não há fim automático do expediente: às 23h50 o relógio aguarda você. O relógio e o forno pausam em conversas e painéis de consulta; o painel do próprio forno mantém o cozimento ativo.

Rosa deixa uma reposição básica diária. Se faltar um ingrediente do pedido, a cesta solidária da mercearia oferece um kit gratuito. Isso permite recuperar erros sem reiniciar a semana. A melhoria é opcional e não bloqueia a história.

## Salvamento

Salvamento automático em `localStorage`, chave `valdora.week.v1`: dia, horário, nome, posição, dinheiro, ingredientes, receitas, limpeza, história, conserto, melhoria, pedidos, pizza e estatísticas. Salva nas interações, mudanças de dia e periodicamente. **Continuar** restaura a partida, inclusive uma pizza no forno; o tempo fechado não queima a pizza. Uma nova partida substitui o slot depois da confirmação no formulário de nome. Limpar os dados do navegador apaga a partida. Saves inválidos são ignorados; armazenamento indisponível é indicado na interface.

## Estrutura

- `src/data.ts`: diálogos, personagens, calendário narrativo, ingredientes e receitas.
- `src/state.ts`: estado serializável e regras puras de inventário, cozinha, pedidos, economia, calendário e salvamento.
- `src/maps.ts`: composição dos quatro mapas com recortes dos tilesets, colisões e pontos de interação.
- `src/world.ts`: cena Phaser, personagens, animações, câmera, movimento, transições e coordenação da história.
- `src/ui.ts`: menus, retratos, diálogos, inventário, compras e painéis de interação.
- `src/pizza-art.ts`: diagrama interativo de montagem em resolução de 64 pixels.
- `src/audio.ts`: efeitos sintetizados locais; botão de som no guia.
- `ProjetoValdora/`: arquivos originais fornecidos, preservados.
- `public/assets/`: recursos extraídos, créditos e relatório de inspeção.

Os assets de execução já estão incluídos. Para refazer a extração a partir dos ZIPs originais, use `npm run assets` com Python 3 e Pillow instalados. O script não altera os originais e verifica o tamanho e as células preenchidas das animações.

## Recursos e proporções

Os quatro spritesheets completos medem **832×3456**. Os ZIPs contêm arquivos `standard/walk.png` e `standard/idle.png` separados, ambos **832×256**, com células **64×64** e 13 colunas. A inspeção do canal alfa confirmou caminhada nas colunas **0–8** e idle nas colunas **0–1**; as demais colunas são transparentes. As quatro linhas são **cima, esquerda, baixo, direita**. O jogo usa os arquivos separados e não os índices dos spritesheets completos.

Personagens no mundo usam escala 1, base dos pés como âncora e ordenação por profundidade. Os tiles de **16×16** são ampliados por 2; as fachadas por 3 para aproximar portas da altura dos personagens. Sem interpolação. Os retratos originais RGBA têm dimensões diferentes (Rosa 1263×1245, Lia 1292×1217, Daniel 1310×1201) e são exibidos com `object-fit: contain`, preservando proporção e transparência. A interface de montagem usa pixels desenhados em um canvas de 64×64 porque os pacotes não contêm camadas separadas para os ingredientes.

Confira [CREDITS.md](CREDITS.md) antes de redistribuir ou comercializar.

## Validação

```bash
npm test
npm run build
```

Os testes de regras cobrem a semana inteira, receitas, consumo e devolução, cozimento, economia, recuperação de falta de ingredientes, progressão e salvamento.

O [registro da validação executada](docs/VALIDACAO.md) inclui resultados, limites da automação e capturas do jogo.

Com o servidor de desenvolvimento ativo e Chromium instalado:

```bash
node scripts/browser-qa.mjs
```

O teste usa `/usr/bin/chromium` por padrão; `CHROMIUM_PATH`, `QA_URL` e `QA_OUTPUT` permitem alterar navegador, servidor e diretório de capturas. Exercita botões, diálogos, limpeza, compras, conserto, melhoria, 20 pedidos e conclusão; recarrega a página durante a semana e ao final. Verifica movimento por teclado, colisão de borda e acessibilidade dos pontos de interação por busca no mapa de colisões. Para reduzir a duração, posiciona o personagem junto aos pontos de interação e acelera os cozimentos após a primeira pizza, que é assada em tempo de jogo real. Portanto, não equivale a uma sessão manual integral ou a um teste de duração com jogadores.

## Limites desta versão

- Um pedido ativo por vez, usando os três NPCs fornecidos como clientes recorrentes; não há multidão ou sistema de filas.
- Rotina dos moradores simples; sem pathfinding ou agenda individual completa. A saída após atendimento é animada.
- Limpeza instantânea por interação e conserto em três etapas; sem minijogos complexos.
- Mapas compactos, áudio de feedback e sem trilha musical. Sem controles de toque.
- A duração e a dificuldade precisam de playtest humano; a automação garante regras e percurso narrativo, não a qualidade subjetiva do ritmo.
- **Modern Interiors Free v2.2 é somente não comercial.** O ZIP de Serene Village não inclui texto de licença: confirme os termos da distribuição com LimeZu antes de publicar. Originais e créditos individuais LPC foram preservados.

Não foram desenvolvidos agricultura, romance, expansão urbana, multiplayer ou administração avançada.
