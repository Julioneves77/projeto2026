# Variáveis de Ambiente - Produção

Este arquivo documenta as variáveis de ambiente necessárias para o build de produção.

## Configuração para Build de Produção

Para fazer o build com as variáveis de produção, execute:

```bash
VITE_SYNC_SERVER_URL=https://plataforma.portalcertidao.org/api npm run build
```

Ou crie um arquivo `.env.production` (não versionado) com:

```env
VITE_SYNC_SERVER_URL=https://plataforma.portalcertidao.org/api
VITE_SYNC_SERVER_API_KEY=sua-chave-api-aqui
```

## Variáveis Obrigatórias

### `VITE_SYNC_SERVER_URL`
URL do servidor de sincronização que integra com a plataforma e Pagar.me.

**Produção:**
```env
VITE_SYNC_SERVER_URL=https://plataforma.portalcertidao.org/api
```

## Variáveis Opcionais

### `VITE_SYNC_SERVER_API_KEY`
Chave de API para autenticação no sync-server (se necessário).

```env
VITE_SYNC_SERVER_API_KEY=sua-chave-api-aqui
```

## Notas

- As variáveis que começam com `VITE_` são expostas ao código do frontend durante o build
- Não commite o arquivo `.env.production` com credenciais reais
- As variáveis são incorporadas no build e não podem ser alteradas após o build

