# Debug: PIX não está gerando no modo local

## Problema
O QR Code PIX não está sendo gerado quando a aplicação roda em modo local.

## Causas Possíveis

### 1. Sync-Server requer API Key
O sync-server está configurado com `SYNC_SERVER_API_KEY`, então todas as requisições precisam incluir essa chave.

**Solução:**
- Opção A: Remover a API Key do sync-server (apenas para desenvolvimento)
  - Edite o arquivo `.env` na raiz do projeto
  - Comente ou remova a linha `SYNC_SERVER_API_KEY=...`
  - Reinicie o sync-server

- Opção B: Configurar a API Key no frontend
  - Crie um arquivo `.env.local` em `verificacao assistida/`
  - Adicione: `VITE_SYNC_SERVER_API_KEY=sua-chave-aqui`
  - Reinicie o servidor de desenvolvimento

### 2. Sync-Server não está rodando
Verifique se o sync-server está rodando na porta 3001:
```bash
lsof -ti:3001
```

Se não estiver rodando:
```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
node sync-server.js
```

### 3. CORS não está configurado
O sync-server deve permitir requisições de `http://localhost:8080` (porta padrão do Vite).

Verifique no `.env` do sync-server:
```env
CORS_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000
```

Ou deixe como `*` para desenvolvimento:
```env
CORS_ORIGINS=*
```

## Como Verificar

1. **Abra o Console do Navegador (F12)**
   - Procure por erros de rede
   - Verifique se a requisição está sendo feita para `http://localhost:3001/transactions/pix`
   - Veja o status da resposta

2. **Teste Manualmente**
   ```bash
   curl -X POST http://localhost:3001/transactions/pix \
     -H "Content-Type: application/json" \
     -d '{"amount":3990,"customer":{"name":"Teste","email":"teste@teste.com","document_number":"12345678900"}}'
   ```

3. **Verifique os Logs do Sync-Server**
   - O sync-server deve mostrar logs quando recebe requisições
   - Procure por mensagens de erro ou autenticação

## Configuração Recomendada para Desenvolvimento Local

### Arquivo `.env` na raiz do projeto (sync-server)
```env
NODE_ENV=development
PORT=3001
CORS_ORIGINS=*
# Comentar ou remover SYNC_SERVER_API_KEY para desenvolvimento
# SYNC_SERVER_API_KEY=
```

### Arquivo `.env.local` em `verificacao assistida/`
```env
VITE_SYNC_SERVER_URL=http://localhost:3001
# VITE_SYNC_SERVER_API_KEY=  # Não necessário se sync-server não tiver API Key
```

## Logs Úteis

O código agora inclui logs detalhados. Procure no console do navegador por:
- `📦 [Pagar.me] Criando transação PIX via sync-server...`
- `📤 [Pagar.me] Payload enviado:`
- `📥 [Pagar.me] Resposta recebida:`
- `✅ [Pagar.me] Transação criada via sync-server:`
- `❌ [Pagar.me] Erro ao criar transação:`

Esses logs mostram exatamente onde está o problema.

