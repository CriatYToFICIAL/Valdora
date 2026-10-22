# Validação da reconstrução LPC

Executada em 22/10/2026, em Chromium headless. Estes resultados não substituem um playtest humano integral.

## Resultados

- `npm test`: **11 testes passaram**. Cobrem receitas, consumo, economia, semana, salvamento/migração, acessibilidade dos sete mapas, colisão com deslizamento, rotinas fora da câmera, iluminação e entrega com pagamento único.
- `npm run build`: TypeScript e produção passaram. O Vite informa o tamanho elevado do bundle do Phaser (~1,27 MB sem gzip); a compilação é concluída.
- `node scripts/browser-qa.mjs`: **sete dias, 20 pizzas e quatro entregas concluídos**. Inclui primeira entrada automática por teclado, oito limpezas, caderno, montagem por arraste, primeiro cozimento em tempo real, clientes, compras, conserto, melhoria, festa, carta e resumo.
- Salvamento/recarregamento verificados no dia 4 e após a conclusão da semana.
- As rotas exercitadas encontraram e permitiram corrigir uma conexão de caminho e uma reentrada indevida na mercearia. A navegação evita portas intermediárias que não sejam o destino.
- Execução final sem erros JavaScript ou respostas HTTP de erro.
- `node scripts/visual-qa.mjs`: renderização dos três NPCs conferida nos sete mapas, de acordo com a identidade global; máscara da sombra do protagonista com 943 pixels de silhueta. Capturas de meio-dia, pôr do sol, noite, madrugada e interior noturno.
- O teste complementar abriu o build pelo iniciador Python: novo jogo, nome, movimento por teclado, caderno, salvamento, recarga e continuar passaram. O build não expõe o acesso de diagnóstico do desenvolvimento.
- Os oito PNGs walk/idle e os três retratos permanecem idênticos aos originais. Os 13 PNGs LPC importados conferem com os hashes do manifesto. Nenhuma textura LimeZu antiga é carregada ou está em `dist`.

## Método e limites

O teste da semana usa os controles da interface, arrasta ingredientes com o mouse e espera o primeiro cozimento real. Para reduzir a execução, aproxima o personagem de estações e acelera tempos e deslocamentos posteriores pelo próprio motor. As rotas de portas e entregas usam a navegação e as colisões do jogo. As capturas adicionais de iluminação posicionam deliberadamente câmera, personagem e horário; não representam a passagem de um dia inteiro em tempo real.

Os efeitos Web Audio foram acionados sem erros; não houve avaliação auditiva humana. As capturas foram inspecionadas para conferir composição, escala, recortes, retratos, interface e luzes. A duração de 30–60 minutos, o conforto dos controles e o equilíbrio para iniciantes ainda precisam de playtest humano. Não foi testada uma máquina física Windows/macOS ou controle por toque.

## Capturas e relatórios

- [Exterior](capturas/exterior.png), [pizzaria](capturas/pizzaria.png), [diálogo](capturas/dialogo.png) e [cozinha](capturas/cozinha.png).
- [Entrega](capturas/entrega.png) e [conclusão](capturas/conclusao.png).
- [Entardecer](capturas/entardecer.png), [noite](capturas/noite.png), [madrugada](capturas/madrugada.png) e [interior à noite](capturas/interior-noite.png).
- [Resultado da semana](capturas/semana.json) e [verificações visuais/produção](capturas/visual.json).

## Ambiente reutilizável

A configuração salva é um rascunho, não prova publicação nem restauração em uma nova tarefa. O pacote jogável usa Python 3; o desenvolvimento usa Node 22.12+. Não são necessárias credenciais ou serviços externos.
