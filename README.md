# Valdora — A primeira fatia · reconstrução LPC

Uma pequena cidade, uma pizzaria herdada e sete dias para encontrar o caminho de casa. Jogo 2D top-down para navegador em português brasileiro, com os quatro personagens LPC e retratos originais do projeto.

Esta edição reconstrói o mundo, a interface e a simulação. Os cenários usam um subconjunto do **Liberated Pixel Cup oficial**, com licença **CC BY-SA 3.0**. **Modern Interiors e Serene Village não são carregados nem distribuídos no pacote jogável desta edição.** Veja [CREDITS.md](CREDITS.md).

## Jogar sem instalar Node

Baixe [`downloads/Valdora-jogavel.zip`](downloads/Valdora-jogavel.zip), extraia a pasta **Valdora-LPC** e abra `JOGAR.cmd` no Windows ou execute, no Linux/macOS:

```bash
python3 JOGAR.py
```

O iniciador usa apenas Python 3, abre o navegador e mantém um servidor no seu próprio computador. Deixe o terminal aberto. Para detalhes, consulte [COMO_TESTAR.md](COMO_TESTAR.md). O ZIP só aparece no repositório depois da geração do pacote de produção.

## Desenvolver

Requer Node.js **22.12+** e npm; `.nvmrc` seleciona Node 22 para quem usa nvm.

```bash
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite **na mesma máquina em que o servidor está rodando**. O `localhost` de uma máquina cloud não aponta para o seu computador. Este projeto não depende de backend, chaves, serviços externos ou downloads durante a partida.

```bash
npm test
npm run build
npm run package:game
```

O último comando gera o ZIP jogável a partir de `dist`. A pasta `dist` não precisa ser versionada; o pacote em `downloads` inclui o build, o iniciador e os créditos.

## Controles

| Tecla / gesto                     | Ação                                                    |
| --------------------------------- | ------------------------------------------------------- |
| WASD / setas                      | Andar em oito direções                                  |
| Shift                             | Correr                                                  |
| Caminhar pela porta               | Entrar ou sair automaticamente                          |
| E                                 | Conversar, limpar, usar equipamentos, servir e entregar |
| Enter / espaço                    | Revelar a fala inteira ou avançar                       |
| I                                 | Caderno, receitas, inventário e estatísticas            |
| Esc                               | Fechar painel / abrir guia                              |
| Arrastar ingrediente para a pizza | Montagem na bancada                                     |
| Teclas 1–5 na bancada             | Alternativa acessível ao arraste                        |

## Primeira semana

| Dia | História e jogo                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Caminhe até a pizzaria, conheça Rosa, conclua oito tarefas de limpeza, encontre o caderno e durma no apartamento. As cadeiras são recolocadas; caixas e sujeira desaparecem permanentemente. |
| 2   | Rosa ensina a primeira receita e faz o pedido de teste.                                                                                                                                      |
| 3   | Inauguração: três pedidos no balcão, com clientes que chegam e saem.                                                                                                                         |
| 4   | Lia, Margherita, compra de ingredientes e primeira entrega por telefone.                                                                                                                     |
| 5   | Daniel ajuda no conserto do forno em três etapas; receita de Calabresa e mais uma entrega.                                                                                                   |
| 6   | Cinco pedidos, entrega e melhoria opcional do forno por R$ 80.                                                                                                                               |
| 7   | Festa com os três moradores, últimos pedidos e entrega, mensagem do avô e resumo.                                                                                                            |

São **20 pedidos, incluindo quatro entregas**. Entre as tarefas, você pode conversar, explorar a praça, entrar nas lojas e visitar os moradores. O dia avança pela cama do apartamento. Os objetivos essenciais impedem pular acidentalmente a história.

### Cozinhar e atender

O cliente caminha até o balcão. Converse com E para anotar o pedido. A bancada fica atrás do balcão; há uma passagem à direita. Arraste massa, molho, queijo e os complementos corretos para a pizza. Manjericão e Calabresa podem ser distribuídos em vários pontos usando a mesma porção. Use E para terminar a montagem.

Leve ao forno e pressione E para colocar. A pizza continua assando enquanto você anda. O indicador sobre o forno muda no ponto certo: **16–25 segundos**, ou **9–18** após a melhoria. Pressione E novamente para retirar e volte ao cliente. Uma pizza fora do ponto rende menos e recebe uma reação diferente, mas não bloqueia o dia.

O caderno permite descartar uma pizza incorreta. Uma montagem inacabada devolve seus ingredientes. Rosa repõe os ingredientes básicos a cada manhã; a mercearia possui um kit gratuito para recuperar a falta de ingredientes do pedido.

### Entregar

Quando o telefone tocar, use E na ponta direita do balcão. Prepare a receita, asse e use a bancada **à esquerda do forno** para embalar. A caixa aparece nas mãos do protagonista. Saia caminhando pela porta e siga o marcador dourado até o endereço. Use E junto à entrada correta, ou converse com o destinatário dentro da residência. A entrega só paga no destino correto e só pode ser concluída uma vez. Não há prazo de falha punitivo.

## Um mundo que continua fora da câmera

Cada morador tem uma identidade global e um único estado: mapa, posição, direção, caminho e atividade. O renderizador só desenha quem está no mapa atual. Rotinas de trabalho, praça, visitas e casa continuam sendo simuladas nos outros mapas.

Os moradores usam os mesmos colisores dos pés e descrições de obstáculos que o protagonista. As rotas evitam móveis e portas que não sejam o destino. Eventos essenciais têm prioridade sobre os horários: Rosa acompanha a restauração; Daniel permanece até o conserto; a festa reúne os três. Isso evita perder um NPC obrigatório por estar tarde.

O relógio percorre manhã, tarde, entardecer, noite e madrugada. A iluminação interpola cor e intensidade, com máscaras radiais para janelas, postes e forno, emissão quente de janelas e sombras projetadas. A sombra do protagonista usa a silhueta do frame atual; direção e extensão consideram sol ou fonte local próxima. Interiores recebem outro tratamento de luz. Não há simulação física de sombras 3D.

Efeitos e ambiente sonoro são sintetizados localmente: passos, portas, limpeza, cozinha, forno, moedas, telefone, caixas e menus; pássaros de dia e grilos à noite. O som pode ser desligado no guia. As bibliotecas externas de áudio não foram baixadas, pois as páginas retornaram bloqueio de rede.

## Salvamento e recuperação da versão anterior

O novo slot é `valdora.week.v2`, em `localStorage`. Registra dia, horário, mapa, posição, ingredientes, receitas, dinheiro, pedidos, pizza, entregas, NPCs, limpeza, conserto, melhoria e eventos. Salva nas interações e periodicamente. O tempo com o jogo fechado não queima pizzas.

Se existir um save v1 no **mesmo endereço e porta**, ele pode ser lido e convertido para um ponto seguro no novo mapa, mantendo dinheiro, inventário e história. O slot v1 permanece intacto. Navegadores e endereços/portas diferentes possuem armazenamentos separados.

A implementação anterior está no commit `7f2cca5` e na branch `archive/prototipo-v1`. Ela inclui os recursos e a documentação antigos para recuperação; não corresponde ao produto reconstruído.

## Arquitetura

- `maps.ts`: composição LPC, geometria, entradas, endereços e estações.
- `navigation.ts`: colisores dos pés, deslizamento e busca de caminhos.
- `actors.ts`: identidades, rotinas, prioridades narrativas e viagens entre mapas.
- `world.ts`: cena Phaser, controles, animações, interações e coordenação.
- `state.ts`: regras serializáveis de receitas, pedidos, economia, calendário e save/migração.
- `data.ts`: receitas, ingredientes, moradores e diálogos da semana.
- `lighting.ts`, `shadows.ts`, `object-shadows.ts`: ambiente, luzes e projeções.
- `ui.ts`, `game.css`, `pizza-art.ts`: HUD compacto, diálogos, retratos e bancada interativa.
- `audio.ts`: efeitos e ambiente gerados via Web Audio.

Os PNGs dos personagens e os retratos não foram alterados. O script `npm run assets` extrai novamente somente os personagens originais. `scripts/import_lpc.py` reproduz a importação do subconjunto de cenários a partir do repositório oficial; o manifesto inclui SHA-256, autores, caminhos, commit e licença.

## Validação e limites

Consulte [docs/RECONSTRUCAO.md](docs/RECONSTRUCAO.md) para auditoria, origem dos recursos e etapas, e [docs/VALIDACAO.md](docs/VALIDACAO.md) para os testes efetivamente executados e as capturas. Com o servidor dev ativo:

```bash
QA_URL=http://127.0.0.1:5173 npm run test:browser
```

O script usa Chromium em `/usr/bin/chromium` (ajustável por `CHROMIUM_PATH`). A primeira porta e o primeiro cozimento são testados em tempo real; depois, rotas do motor e tempos de simulação são acelerados. Posicionamentos auxiliares aproximam o personagem das estações para testar as interações. Isso não equivale a um playtest humano integral.

Esta é uma região compacta, com três moradores e um pedido ativo por vez. As sombras são aproximações 2D. O tempo dos eventos, a qualidade subjetiva do som e o equilíbrio para jogadores iniciantes ainda precisam de avaliação humana. Não há toque/mobile, romances, agricultura, multiplayer ou expansão urbana.
