# Reconstrução LPC — registro de implementação

Base anterior preservada no commit `7f2cca5` e na branch local `archive/prototipo-v1`. Desenvolvimento em `rebuild/lpc-week`; sem sobrescrever o save v1.

## Auditoria

Reaproveitáveis: os oito arquivos LPC walk/idle, os três retratos transparentes, os créditos individuais, a representação de receitas e parte das regras de consumo, qualidade, preços e estoque. O teste das regras anteriores demonstra sua consistência isolada, mas não comprova qualidade espacial ou visual.

Substituir: mapas por recortes LimeZu com escalas distintas; colisões separadas da composição; cópias locais dos NPCs; movimentação/portas que exigem E; interfaces extensas em HTML; preparo baseado exclusivamente em botões; iluminação ausente; relógio limitado antes da madrugada. Não havia entregas nem rotinas globais.

## Recursos

OpenGameArt e Kenney retornaram HTTP 403 na política de rede do ambiente. Os domínios foram registrados no rascunho, mas isso não aplica a política na máquina. Não foram baixados pacotes dessas páginas. Foi possível obter o repositório oficial **OpenGameArt/LiberatedPixelCup**, commit `f61104a1ecc54e7bce54b82ada7d7ba4c41bc524`. O subconjunto de Sharm e HughSpectrum utiliza CC BY-SA 3.0 (uma das opções da licença dual do repositório), que permite uso comercial com atribuição e compartilhamento das adaptações da arte sob a mesma licença. Arquivos originais, autores, caminhos e SHA-256 estão em `public/assets/lpc/manifest.json`.

O produto reconstruído não deve carregar ou distribuir os PNGs Modern Interiors. Os arquivos originais enviados permanecem no histórico/fonte, com sua licença, para recuperação da versão anterior.

## Etapas implementadas

- **A — Auditoria/base:** versão anterior preservada, personagens e retratos intactos; recursos incompatíveis retirados da distribuição; manifesto LPC com licença, autores e hashes; save v2 com leitura segura do v1.
- **B — Mundo:** rua compacta e sete mapas, interiores e fachadas LPC, colisores dos pés, oito direções, corrida, deslizamento, câmera e portas automáticas. HUD compacto, caderno e diálogos com retratos.
- **C — Vida:** identidades globais únicas, rotinas com caminhos e transições inclusive fora da câmera, prioridades narrativas; iluminação contínua exterior/interior, fontes locais, sombras projetadas de silhuetas e objetos; áudio procedural original.
- **D — Chegada:** pensamentos em balões, Rosa caminha até a pizzaria, oito ações de limpeza alteram o cenário, descoberta do caderno e cama para avançar.
- **E — Restaurante:** ingredientes arrastáveis sobre pizza gráfica, inventário, cozimento contínuo no mundo, feedback, atendimento, telefone, caixa carregada, marcador de destino, entregas, compras e melhoria opcional.
- **F — Semana:** sete dias integrados, 20 pedidos incluindo quatro entregas, três receitas, conserto interativo com Daniel, festa, carta de Antônio e resumo. Salvamento inclui localização, pedidos, pizza, NPCs e eventos.

As regras, os mapas e o navegador foram exercitados durante a implementação. A regressão final percorreu a semana inteira; o teste complementar conferiu produção, identidade dos NPCs e iluminação. Métodos, capturas e limites estão em [VALIDACAO.md](VALIDACAO.md).

## Limites e próximos ajustes

A região é pequena e há um pedido ativo por vez. Luzes e sombras são aproximações 2D. Não foram incorporadas músicas ou bibliotecas externas de áudio. O objetivo de 30–60 minutos e a qualidade subjetiva de ritmo, som e dificuldade aguardam avaliação humana. Não há suporte a toque, romance, agricultura, multiplayer ou expansão urbana nesta semana.

O pacote compilado inclui um iniciador Python para evitar a dependência de Node no computador de quem só deseja jogar. Os scripts de navegador precisam de Chromium; não foram testados todos os navegadores ou sistemas operacionais físicos.
