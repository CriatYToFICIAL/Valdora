# Como baixar e testar Valdora

## Opção mais simples: rodar no ambiente cloud

1. Baixe e extraia o pacote `valdora-completo.zip`.
2. No terminal do ambiente, entre na pasta extraída:

   ```bash
   cd Valdora
   npm ci
   npm run dev -- --host 0.0.0.0 --port 5174
   ```

3. No painel do ambiente, abra **Ports / Preview / Open port**.
4. Abra a porta `5174` em **Open in browser**.
5. O jogo aparecerá com o menu inicial. Use **Novo jogo**.

Não use `localhost:5174` no navegador do seu computador: `localhost` aponta para o computador onde o navegador está aberto. Use o endereço gerado pelo botão de preview da porta cloud.

## Rodar no seu computador

1. Instale Node.js 22 ou superior.
2. Extraia o pacote e abra um terminal na pasta `Valdora`.
3. Execute:

   ```bash
   npm ci
   npm run dev
   ```

4. Abra o endereço informado pelo Vite, normalmente `http://localhost:5173/`.

## Controles

- `WASD` ou setas: andar
- `E`: interagir
- `Enter` ou `Espaço`: avançar diálogos
- `I`: caderno e inventário
- `Esc`: fechar painéis

O pacote contém `dist/` compilado, mas o fluxo recomendado é usar `npm run dev`, que mantém o jogo editável.
