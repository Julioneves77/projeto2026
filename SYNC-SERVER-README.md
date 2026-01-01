# Servidor de Sincronização de Tickets

Servidor simples que sincroniza tickets entre PORTAL (localhost:3000) e PLATAFORMA (localhost:8081).

## Como usar

### Iniciar o servidor

```bash
npm run sync-server
```

Ou diretamente:

```bash
node sync-server.js
```

O servidor rodará em `http://localhost:3001`

## Endpoints

- `GET /health` - Health check
- `GET /tickets` - Listar todos os tickets
- `GET /tickets/:id` - Buscar ticket específico
- `POST /tickets` - Criar novo ticket
- `PUT /tickets/:id` - Atualizar ticket existente

## Dados

Os tickets são salvos em `tickets-data.json` na raiz do projeto.

## Notas

- O servidor precisa estar rodando para a integração funcionar
- Se o servidor não estiver disponível, PORTAL e PLATAFORMA usarão localStorage como fallback
- O servidor suporta CORS para permitir requisições de diferentes portas

