# Instruções: Sincronizar Múltiplas Contas Google Ads

## Status Atual

✅ **Mapeamento configurado:**
- `solicite.link` → `591-659-0517`

⚠️ **Pendente:**
- `portalcacesso.online` → Customer ID da segunda conta (precisa descobrir)

## Opção 1: Sincronizar via API do Sync-Server (Recomendado)

Se o sync-server estiver rodando, use a API HTTP:

### 1. Configurar mapeamento do portalacesso.online

Primeiro, descubra o Customer ID da segunda conta Google Ads. Depois:

```bash
curl -X POST https://api.portalcertidao.org/google-ads/map-domain \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "portalcacesso.online",
    "customer_id": "CUSTOMER_ID_DA_CONTA_2",
    "account_name": "Conta Portal Acesso"
  }'
```

### 2. Sincronizar todas as contas via MCC

Se você tem o MCC ID:

```bash
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "mcc_id": "MCC_ID_AQUI",
    "date_from": "2025-12-13",
    "date_to": "2026-01-12"
  }'
```

Ou sincronizar por domain:

```bash
# Sincronizar solicite.link
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "solicite.link",
    "date_from": "2025-12-13",
    "date_to": "2026-01-12"
  }'

# Sincronizar portalacesso.online (após configurar mapeamento)
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "portalcacesso.online",
    "date_from": "2025-12-13",
    "date_to": "2026-01-12"
  }'
```

## Opção 2: Descobrir Customer IDs das Contas

Para descobrir os Customer IDs de todas as contas na MCC:

1. Acesse o Google Ads
2. Vá em **Tools & Settings** → **Account Access**
3. Veja todas as contas listadas
4. O Customer ID está no formato `XXX-XXX-XXXX`

Ou use o script de validação:

```bash
node scripts/validate-google-ads.js
```

## Opção 3: Sincronizar Manualmente

Se você souber os Customer IDs de ambas as contas:

```bash
# 1. Configurar mapeamentos
node -e "
const db = require('./services/funnelDatabase');
db.initDatabase();
db.upsertDomainMapping('solicite.link', '591-659-0517', 'Conta Solicite Link');
db.upsertDomainMapping('portalcacesso.online', 'CUSTOMER_ID_2', 'Conta Portal Acesso');
console.log('✅ Mapeamentos configurados');
"

# 2. Sincronizar cada conta
# Via API ou diretamente no código
```

## Verificar Validação

Após sincronizar, verifique se está tudo funcionando:

```bash
curl "https://api.portalcertidao.org/funnel-validation?date_from=2025-12-13&date_to=2026-01-12" \
  -H "X-API-Key: sua_api_key"
```

Ou acesse a **Aba Coração** na PLATAFORMA e veja a seção "Validação por Domínio".

## Próximos Passos

1. ✅ Mapeamento `solicite.link` já configurado
2. ⏳ Descobrir Customer ID da conta `portalcacesso.online`
3. ⏳ Configurar mapeamento `portalcacesso.online`
4. ⏳ Sincronizar campanhas de ambas as contas
5. ⏳ Verificar validação na Aba Coração

