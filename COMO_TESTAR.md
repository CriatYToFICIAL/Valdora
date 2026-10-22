# Jogar Valdora sem instalar Node

1. No GitHub, abra `downloads/Valdora-jogavel.zip` e clique no botão de baixar o arquivo bruto (**Download raw file**).
2. Extraia o ZIP. Você terá uma pasta chamada **Valdora-LPC**.
3. Abra essa pasta no seu computador.
4. No **Windows**, abra `JOGAR.cmd` (requer Python 3 instalado). No **Linux/macOS**, abra um terminal nessa pasta e execute:

   ```bash
   python3 JOGAR.py
   ```

5. O navegador abre automaticamente. Se não abrir, copie o endereço que aparece no terminal, como `http://127.0.0.1:8000`.
6. Mantenha o terminal aberto enquanto joga. Para encerrar, use **Ctrl+C**.

Esta opção usa o jogo já compilado. **Não precisa de Node, npm, nvm, conta ou conexão com a internet durante a partida.** Requer Python 3 e um navegador atual. Se `python3` não existir, instale Python 3 pelo gerenciador do seu sistema ou pelo site oficial python.org. No Windows, o iniciador usa `py -3`.

Não abra `index.html` diretamente: o jogo precisa do servidor local que o iniciador abre para você.

## Controles

- WASD / setas: andar; Shift: correr.
- Caminhe pela porta para entrar ou sair; não precisa apertar E.
- E: conversar, limpar, forno, telefone, embalar, servir e entregar.
- Arraste ingredientes para a pizza na bancada (ou use 1–5); E leva a pizza montada.
- Enter / espaço: revelar ou avançar diálogo.
- I: caderno e inventário. Esc: fechar painel / guia.

No primeiro dia, a pizzaria fica ao norte do ponto de chegada. Rosa caminha até lá para ajudar. Limpe os oito pontos, leia o caderno na cozinha, suba pela escada à direita e use a cama.

## Para quem quer editar o projeto

Baixe o código pelo botão **Code → Download ZIP**, extraia e abra o terminal na pasta que contém `package.json`.

Requer Node **22.12 ou superior**. Confira com `node --version`. O `nvm` é opcional; o erro “nvm não encontrado” apenas indica que esse gerenciador não está instalado.

```bash
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite na mesma máquina do terminal. Para compilar e gerar o pacote:

```bash
npm run build
npm run package:game
```

## Sobre localhost, cloud e o salvamento

`localhost` aponta para a máquina onde seu navegador está aberto. Um servidor iniciado na cloud não aparece automaticamente no seu computador. O ZIP acima resolve isso rodando o jogo no seu computador, sem depender de um painel de preview cloud.

O progresso é salvo no navegador por endereço e porta. Use o mesmo endereço nas próximas partidas e escolha **Continuar**. Limpar os dados do navegador remove o save. A edição nova preserva o slot antigo quando ele existe no mesmo endereço.
