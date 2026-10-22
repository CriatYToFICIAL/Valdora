# Créditos — edição LPC reconstruída

## Cenários LPC

**Fonte oficial:** [OpenGameArt / LiberatedPixelCup](https://github.com/OpenGameArt/LiberatedPixelCup), commit `f61104a1ecc54e7bce54b82ada7d7ba4c41bc524`.

- **Lanea Zimmerman (Sharm):** `house`, `inside`, `kitchen`, `country`, `cabinets`, `stairs`, `grass`, `dirt`, `treetop`, `trunk`, `barrel` e `signs`.
- **Daniel Armstrong (HughSpectrum):** `castlefloors`.

São 13 PNGs copiados sem alteração dos pixels originais. O [manifesto](public/assets/lpc/manifest.json) registra nome local, caminho original, autor, URL, commit e SHA-256 de cada arquivo. Os nomes locais `tree.png` e `floors.png` correspondem a `treetop.png` e `castlefloors.png`.

O repositório oferece CC BY-SA 3.0 / GPL 3.0. **Nesta edição é escolhida CC BY-SA 3.0 para esses recursos.** Ela permite uso comercial e adaptação, exige atribuição, indicação das alterações e compartilhamento das adaptações da arte sob a mesma licença. Não significa domínio público nem licença comercial irrestrita.

Texto completo: [CC BY-SA 3.0](public/assets/lpc/LICENSE-CC-BY-SA-3.0.txt). [Autores originais](public/assets/lpc/AUTHORS.md).

**Adaptações visuais de Valdora:** recortes em tempo de execução, composição modular das casas, interiores, caminhos e jardins; tintas de fachada; máscaras e projeções de sombra; luz de janelas; integração de forno, bancadas e outros detalhes originais. As composições e adaptações da arte LPC desta edição são disponibilizadas sob CC BY-SA 3.0, com seus arquivos-fonte de montagem no repositório (`src/maps.ts` e módulos de renderização). Isso não altera os direitos dos demais recursos ou do código de sistemas.

As páginas OpenGameArt e Kenney retornaram HTTP 403 na máquina de desenvolvimento. Não se afirma que os pacotes individuais listados na proposta foram baixados. O subconjunto utilizado veio do repositório oficial acima, cuja licença e autores foram inspecionados.

## Personagens originais do projeto

Protagonista, Dona Rosa, Lia e Daniel foram fornecidos pelo criador de Valdora, usando o [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator).

Os ZIPs originais, configurações e spritesheets completos estão preservados em `ProjetoValdora`. O jogo usa arquivos `standard/walk.png` e `standard/idle.png` extraídos byte a byte, sem substituir os personagens.

Autores, camadas, links, notas e licenças completas:

- [Protagonista](public/assets/hero-credits-credits.txt)
- [Dona Rosa](public/assets/rosa-credits-credits.txt)
- [Lia](public/assets/lia-credits-credits.txt)
- [Daniel](public/assets/daniel-credits-credits.txt)

Entre os artistas estão bluecarrot16, ElizaWy, JaidynReiman, Benjamin K. Smith (BenCreating), Stephen Challener (Redshrike), Johannes Sjölund (wulax), Mandi Paugh e os demais nomes registrados por camada nos arquivos originais. Os CSVs e metadados também estão preservados.

As opções variam por camada, incluindo OGA-BY 3.0, CC-BY 3.0, CC-BY-SA 3.0 e CC0. Não se impõe uma licença única a todo o personagem. Todas as atribuições originais permanecem no pacote. Referências dos termos: [OGA-BY 3.0](https://static.opengameart.org/OGA-BY-3.0.txt), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) e [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

## Retratos

Retratos RGBA de Rosa, Lia e Daniel fornecidos pelo criador do projeto. Exibidos com proporção e transparência originais. Os direitos permanecem com seus respectivos titulares; não se atribui uma licença de terceiros presumida a esses arquivos.

## Elementos e áudio de Valdora

Caixas, telefone, pequenos detalhes de jardim, montagem interativa da pizza e interface foram implementados para o projeto. Não foram copiados de Stardew Valley, Fields of Mistria ou Good Pizza, Great Pizza. As imagens desses jogos foram usadas somente como referências de composição, escala e atmosfera.

Todos os efeitos e o ambiente sonoro desta edição são sintetizados em execução via Web Audio. Não foram importados arquivos Kenney, músicas ou sons de outros jogos.

Phaser: Richard Davey / Photon Storm e contribuidores, licença MIT. Vite e TypeScript são ferramentas de desenvolvimento com suas próprias licenças. O aviso do Phaser acompanha o pacote jogável em `assets/legal/phaser-LICENSE.md`.

## Recursos aposentados

**Modern Interiors Free v2.2** (não comercial) e **Serene Village Revamped** não são recursos do produto reconstruído. A versão anterior e seus arquivos permanecem recuperáveis pelo commit `7f2cca5` / branch `archive/prototipo-v1`. Nenhum desses PNGs é incluído no novo build ou no ZIP jogável.
