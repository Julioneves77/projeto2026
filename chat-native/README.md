# Chat Nativo - Guia Central

Chat widget para o site [guia-central.online](https://guia-central.online). Roteador determinístico, sem banco de dados, stateless, totalmente isolado.

## Estrutura

```
chat-native/
├── server/
│   ├── server.js      # Backend Express + endpoint /api/chat
│   ├── config.js      # MODEL_NAME, MAX_OUTPUT_TOKENS, SYSTEM_PROMPT
│   ├── package.json
│   └── .env.example
├── public/
│   ├── chat-widget.js
│   ├── chat-widget.css
│   └── index.html     # Página demo
└── README.md
```

## Como rodar localmente

1. Entre na pasta do servidor:
   ```bash
   cd chat-native/server
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. (Opcional) Crie o arquivo `.env` para variáveis como `SITE_BASE_URL`:
   ```bash
   cp .env.example .env
   ```
   O chat usa roteador determinístico e não requer OpenAI para funcionar.

4. Inicie o servidor:
   ```bash
   npm start
   ```

5. Acesse no navegador: **http://localhost:3000**

   - A página demo carrega o widget automaticamente.
   - Clique em "Ajuda" para abrir o chat.

## Configuração

### Segurança

- O arquivo `.env` **nunca** deve ser commitado (está no `.gitignore`).
- Se a chave `OPENAI_API_KEY` (quando usada) tiver sido exposta, **rotacione-a imediatamente** no painel da OpenAI.
- Nunca logue chaves ou tokens no console.

### Configuração

O roteador está em `server/server.js`. Para alterar URLs base, use `SITE_BASE_URL` no `.env`.

## Como hospedar e embutir no site

### 1. Hospedar o backend e os arquivos estáticos

- Hospede o servidor Node.js (ou use um serviço como Railway, Render, Fly.io, etc.).
- Garanta que os arquivos de `public/` sejam servidos na mesma origem do backend (o Express já faz isso com `express.static`).

### 2. Embutir no site guia-central.online

**Não altere arquivos existentes.** Adicione apenas estas duas linhas no HTML do site (por exemplo, antes do `</body>`):

```html
<link rel="stylesheet" href="https://SEU-DOMINIO/chat-widget.css">
<script defer src="https://SEU-DOMINIO/chat-widget.js"></script>
```

Substitua `SEU-DOMINIO` pela URL onde o chat está hospedado (ex: `https://chat.guia-central.online` ou `https://seu-servidor.com`).

### 3. API em origem diferente (opcional)

Se o widget estiver em um domínio e a API em outro, defina a base da API antes de carregar o script:

```html
<link rel="stylesheet" href="https://SEU-DOMINIO/chat-widget.css">
<script>
  window.GC_CHAT_API_BASE = "https://api-do-chat.exemplo.com";
</script>
<script defer src="https://SEU-DOMINIO/chat-widget.js"></script>
```

## Endpoint

- **POST** `/api/chat`
- **Body:** `{ "message": "texto do usuário" }`
- **Response:** `{ "msg": "texto formatado", "service_id": "...", "service_label": "...", "kind": "answer|choice|finalidade", "url": "..." }`

## CORS

O backend permite apenas:
- `https://guia-central.online`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Serviços do site (8 únicos)

1. Certidão Negativa Criminal Federal  
2. Certidão Negativa Criminal Estadual  
3. Antecedentes Criminais da Polícia Federal  
4. Certidão de Quitação Eleitoral  
5. Certidão Negativa Cível Federal  
6. Certidão Negativa Cível Estadual  
7. Certidão Negativa de Débitos (CND)  
8. Certidão CPF Regular  
