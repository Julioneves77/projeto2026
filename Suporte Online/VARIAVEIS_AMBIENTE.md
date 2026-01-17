# Variáveis de Ambiente - Verificação Assistida

Este arquivo documenta as variáveis de ambiente necessárias para o funcionamento da aplicação.

## Configuração

Crie um arquivo `.env` ou `.env.local` na raiz do projeto `verificacao assistida/` com as seguintes variáveis:

## Variáveis Obrigatórias

### `VITE_SYNC_SERVER_URL`
URL do servidor de sincronização que integra com a plataforma e Pagar.me.

**Produção:**
```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
```

**Desenvolvimento Local:**
```env
VITE_SYNC_SERVER_URL=http://localhost:3001
```

## Variáveis Opcionais

### `VITE_SYNC_SERVER_API_KEY`
Chave de API para autenticação no sync-server (se necessário).

```env
VITE_SYNC_SERVER_API_KEY=sua-chave-api-aqui
```

## Exemplo de Arquivo .env

```env
# Servidor de Sincronização
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org

# API Key (opcional)
# VITE_SYNC_SERVER_API_KEY=sua-chave-api-aqui
```

## Notas

- As variáveis que começam com `VITE_` são expostas ao código do frontend
- Não commite o arquivo `.env` com credenciais reais
- Use `.env.example` como template para outros desenvolvedores
- Em produção, configure essas variáveis no ambiente de hospedagem

