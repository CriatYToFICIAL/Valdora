# Validação do protótipo

Executada em 22/10/2026 no ambiente atual. Não implica publicação do ambiente nem validação em uma nova máquina.

## Resultados

- `npm ci --cache /tmp/valdora-npm --no-audit --no-fund`: concluído com o lockfile.
- `npm test`: **5 testes passaram**, nenhum falhou, foi ignorado ou ficou pendente.
- `npm run build`: TypeScript e bundle de produção passaram. O Vite avisa sobre o tamanho do bundle do Phaser (~1,26 MB sem gzip); isso não impede a compilação.
- `node scripts/browser-qa.mjs`: **sete dias e 20 pedidos concluídos** no Chromium, incluindo limpeza, caderno, receitas, compras, conserto, melhoria, carta final e resumo.
- Salvamento/carregamento verificados por recarga no dia 4 e após a conclusão da semana.
- Movimento por teclado, colisão de borda e acesso a todos os pontos de interação verificados. A busca de acessibilidade considera as colisões do mapa.
- A execução final não registrou erros JavaScript nem falhas HTTP.
- Smoke test adicional do build de produção: menu, nome, movimento, caderno, save/continue e painel de ajuda em viewport de 800 pixels passaram; sem erros de página ou falhas HTTP.
- Os oito PNGs de caminhada/idle e os três retratos usados conferem byte a byte com os originais. Dimensões, células e direções estão documentadas no README e em `public/assets/inspection.json`.

## Limites da automação

O teste usa os controles e os botões da interface. Para percorrer a história em tempo reduzido, posiciona o protagonista junto aos pontos de interação e acelera o relógio do forno após a primeira pizza. A primeira pizza espera a janela real de cozimento do jogo. Isso valida os sistemas e a sequência narrativa, mas não equivale a caminhar manualmente por toda a semana.

Os efeitos Web Audio foram acionados sem erros de execução; não houve avaliação auditiva humana. As capturas foram inspecionadas para conferir sprites, retrato, composição, interface, montagem e conclusão. A duração de 30–60 minutos e o equilíbrio subjetivo de dificuldade ainda precisam de playtest humano.

## Capturas da execução

- [Diálogo com Dona Rosa](capturas/dialogo.png)
- [Montagem da primeira pizza](capturas/cozinha.png)
- [Resumo da primeira semana](capturas/conclusao.png)

## Ambiente reutilizável

`install_script` e `start_skill` foram salvos no rascunho da configuração. O primeiro reproduz instalação, testes e build; o segundo descreve como reiniciar o servidor e validar o fluxo sem criar outro worktree. Essa configuração ainda precisa ser revisada, salva e publicada pelo usuário nas configurações do ambiente. Não foi afirmada restauração em uma nova tarefa.
