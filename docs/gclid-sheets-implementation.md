# GCLID + Conversões + Google Sheets — Implementação

## Configuração em Produção (resumo)

1. **Gerar chave de criptografia:**
   ```bash
   ./scripts/gen-sheets-key.sh
   ```
2. Adicionar `SHEETS_CREDENTIALS_ENCRYPTION_KEY` ao `.env` do servidor.
3. Na aba Conversões: colar JSON da Service Account, Spreadsheet ID, compartilhar planilha com `client_email` como Editor.
4. Opcional: `TZ=America/Sao_Paulo` no .env.

---

## Levantamento do Projeto (Fase 0)

### Frontend guia-central.online
- **Pasta:** `GUIA_CENTRAL/`
- **Stack:** React 18, Vite 5, TypeScript, Tailwind
- **Rotas:** `/`, `/certidao/:category`, `/pagamento`, `/obrigado`, etc.
- **Entry:** `GUIA_CENTRAL/index.html` → `src/main.tsx`

### Formulários e API
- **Ticket Service:** `GUIA_CENTRAL/src/lib/ticketService.ts`
  - `createTicket()` faz POST para `{VITE_SYNC_SERVER_URL}/tickets`
  - `mapFormDataToTicket()` monta o ticket com `dadosFormulario`
- **Formulário principal:** `GUIA_CENTRAL/src/pages/CertificateForm.tsx`
- **Fluxo:** CertificateForm → PrePayment → Payment (createTicket chamado em Payment.tsx ao gerar PIX)

### Backend (sync-server)
- **Arquivo:** `sync-server.js` (raiz do projeto)
- **Porta:** 3001 (ou `PORT` env)
- **Tickets:** `tickets-data.json` (JSON em arquivo)
- **Webhook Pagar.me:** `POST /webhooks/pagarme` (linhas ~2348–2665)
- **Fluxo pago:** evento `order.paid` → busca ticket por `metadata.ticket_id` ou `orderCode` → atualiza status para `EM_OPERACAO` → enfileira Plexi → envia confirmação

### Banco de dados
- **Tickets:** JSON em arquivo (`tickets-data.json`)
- **Funil:** SQLite com `better-sqlite3` em `services/funnelDatabase.js`
- **Arquivo:** `funnel-database.db`
- **GCLID/Sheets:** Novo SQLite `gclid-sheets.db` em `services/gclidSheetsDatabase.js`

### Plataforma (admin)
- **Pasta:** `PLATAFORMA/`
- **Login:** `PLATAFORMA/src/components/Login.tsx`, `useAuth.tsx`
- **Auth:** localStorage + API Key (`X-API-Key`) para sync-server
- **Rotas:** Index com abas (dashboard, tickets, relatorios, etc.)
- **Header:** `PLATAFORMA/src/components/Header.tsx` — menu com `menuItems`

### Configurações
- **Env:** `.env`, `GUIA_CENTRAL/.env.production`
- **URL produção:** `VITE_SYNC_SERVER_URL=https://www.guia-central.online/api` (proxy Nginx para 127.0.0.1:3001)

---

## Variáveis de Ambiente

```env
# Obrigatória em produção para criptografia do JSON da Service Account
SHEETS_CREDENTIALS_ENCRYPTION_KEY=<32 bytes em base64>

# Opcional - timezone para conversões
TZ=America/Sao_Paulo
```

Para gerar a chave:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Formato Google Sheets (Google Ads Offline Conversions)

Cabeçalho exato (linha 1):
```
Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
```

- **Conversion Time:** `YYYY-MM-DD HH:MM:SS` (America/Sao_Paulo)
- **Conversion Value:** número com ponto decimal (ex: `39.90`)
- **Conversion Currency:** `BRL`

---

## Como Compartilhar o Google Sheets

1. Crie uma planilha no Google Sheets
2. Na aba de configuração "Conversões (Sheets/Google Ads)", copie o **e-mail da Service Account** (exibido após colar o JSON)
3. No Google Sheets: **Compartilhar** → adicione o e-mail como **Editor**
4. Cole o **Spreadsheet ID** na aba (da URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`)

---

## Teste End-to-End

1. Acessar `https://guia-central.online/?gclid=TESTE123`
2. Preencher e enviar formulário até gerar PIX
3. Confirmar no banco que ticket tem `dadosFormulario.gclid = "TESTE123"`
4. Simular/confirmar pagamento pelo webhook Pagar.me
5. Confirmar criação de `offline_conversions` com status PENDING
6. Na aba admin: colar JSON, Spreadsheet ID, clicar "Testar conexão" (OK)
7. Clicar "Exportar agora"
8. Ver no Google Sheets: linha 1 = cabeçalho, linha 2 = dados
9. Reexecutar export: não duplicar (idempotência)

---

## Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `GUIA_CENTRAL/public/gclid.js` | Script vanilla para captura de gclid (cookie) |
| `GUIA_CENTRAL/src/lib/gclid.ts` | Utilitário TypeScript getGclid() |
| `GUIA_CENTRAL/index.html` | Script gclid.js carregado no head |
| `GUIA_CENTRAL/src/lib/ticketService.ts` | Inclusão de gclid em dadosFormulario |
| `services/gclidSheetsDatabase.js` | Tabelas sheets_integrations, offline_conversions |
| `services/sheetsEncryption.js` | Criptografia AES-256-GCM |
| `services/sheetsExportService.js` | Exportação para Google Sheets |
| `sync-server.js` | Webhook cria conversão; endpoints admin; cron |
| `PLATAFORMA/src/components/ConversoesSheets.tsx` | Nova aba admin |
| `PLATAFORMA/src/components/Header.tsx` | Item de menu |
| `PLATAFORMA/src/pages/Index.tsx` | Case conversoes-sheets |
| `.env.example` | SHEETS_CREDENTIALS_ENCRYPTION_KEY, TZ |
