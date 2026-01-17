# Guia: Múltiplas Contas Google Ads e Domínios

## Visão Geral

Este sistema agora suporta **múltiplas contas Google Ads** e **múltiplos domínios de anúncios**, permitindo que você gerencie diferentes campanhas de diferentes contas Google Ads de forma independente.

## Arquitetura

```
┌─────────────────┐         ┌─────────────────┐
│  solicite.link  │────────▶│                 │
│  (Google Ads 1) │         │ portalcertidao  │
└─────────────────┘         │      .org       │
                            │                 │
┌─────────────────┐         │  (Sync Server)  │
│portalacesso.online│───────▶│                 │
│  (Google Ads 2) │         │                 │
└─────────────────┘         └─────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │  Aba Coração     │
                            │  (Validação)     │
                            └─────────────────┘
```

## Configuração Inicial

### 1. Adicionar Conta Google Ads à MCC

**Importante:** Para usar a API do Google Ads com múltiplas contas, todas as contas devem estar sob uma MCC (Manager Account).

1. Acesse o Google Ads
2. Vá em **Tools & Settings** → **Account Access**
3. Adicione a conta secundária à MCC existente

### 2. Configurar Mapeamento Domain → Customer ID

Use o script de configuração:

```bash
node scripts/setup-multiple-accounts.js
```

Ou use a API diretamente:

```bash
curl -X POST https://api.portalcertidao.org/google-ads/map-domain \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "portalcacesso.online",
    "customer_id": "123-456-7890",
    "account_name": "Conta Portal Acesso"
  }'
```

**Mapeamentos necessários:**
- `solicite.link` → Customer ID da conta 1
- `portalcacesso.online` → Customer ID da conta 2

### 3. Configurar PORTAL_ACESSO

O `PORTAL_ACESSO` já está configurado com `funnelTracker.ts`. Verifique o `.env`:

```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_COLLECTOR_ENABLED=true
```

## Sincronização de Campanhas

### Sincronizar Todas as Contas (via MCC)

```bash
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "mcc_id": "123-456-7890",
    "date_from": "2026-01-01",
    "date_to": "2026-01-31"
  }'
```

### Sincronizar Conta Específica por Domain

```bash
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "portalcacesso.online",
    "date_from": "2026-01-01",
    "date_to": "2026-01-31"
  }'
```

### Sincronizar Conta Específica por Customer ID

```bash
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "customer_id": "123-456-7890",
    "date_from": "2026-01-01",
    "date_to": "2026-01-31"
  }'
```

## Validação na Aba Coração

A **Aba Coração** agora mostra uma seção de **Validação por Domínio** que verifica:

1. ✅ **Eventos sendo coletados** - Quantos eventos foram coletados por domínio
2. ✅ **Campanhas sincronizadas** - Se as campanhas estão sendo sincronizadas
3. ✅ **Custos vinculados** - Se os custos estão sendo vinculados corretamente aos eventos
4. ✅ **Mapeamento configurado** - Se o domain está mapeado para um customer_id

### Status de Validação

- 🟢 **OK** - Tudo funcionando corretamente
- 🟡 **WARNING** - Algum problema detectado (ex: domain não mapeado, campanhas sem custos)
- 🔴 **ERROR** - Erro crítico (ex: nenhum evento coletado)

### Verificar Validação via API

```bash
curl -X GET "https://api.portalcertidao.org/funnel-validation?date_from=2026-01-01&date_to=2026-01-31" \
  -H "X-API-Key: sua_api_key"
```

## Endpoints Disponíveis

### POST /google-ads/map-domain
Mapear domain para customer_id

**Body:**
```json
{
  "domain": "portalcacesso.online",
  "customer_id": "123-456-7890",
  "account_name": "Conta Portal Acesso"
}
```

### GET /google-ads/domain-mappings
Listar todos os mapeamentos domain → customer_id

### GET /funnel-validation
Validar configuração do funil por domínio

**Query Params:**
- `date_from` (opcional) - Data inicial (YYYY-MM-DD)
- `date_to` (opcional) - Data final (YYYY-MM-DD)

### POST /google-ads/sync
Sincronizar campanhas (agora aceita `domain`)

**Body:**
```json
{
  "domain": "portalcacesso.online",  // Novo: aceita domain
  "customer_id": "123-456-7890",     // Ou customer_id
  "mcc_id": "123-456-7890",          // Ou mcc_id
  "date_from": "2026-01-01",
  "date_to": "2026-01-31"
}
```

### GET /funnel-analytics
Calcular métricas (agora filtra por `domain`)

**Query Params:**
- `domain` (opcional) - Filtrar por domínio específico
- `utm_campaign` (opcional) - Filtrar por campanha
- `date_from` (opcional) - Data inicial
- `date_to` (opcional) - Data final

## Fluxo de Dados

1. **Eventos do Funil:**
   - `solicite.link` → envia eventos com `domain: "solicite.link"`
   - `portalcacesso.online` → envia eventos com `domain: "portalcacesso.online"`

2. **Sincronização Google Ads:**
   - Sincronizar conta 1 (solicite.link) → salvar com `customer_id` da conta 1 + `domain: "solicite.link"`
   - Sincronizar conta 2 (portalcacesso.online) → salvar com `customer_id` da conta 2 + `domain: "portalcacesso.online"`

3. **Cálculo de Métricas:**
   - Buscar eventos filtrados por `domain` e `utm_campaign`
   - Buscar custos filtrados por `customer_id` correspondente ao `domain`
   - Calcular métricas (ROI, CPA) por domínio/campanha

## Checklist de Configuração

- [ ] Conta Google Ads 2 adicionada à MCC
- [ ] Mapeamento `solicite.link` → Customer ID 1 configurado
- [ ] Mapeamento `portalcacesso.online` → Customer ID 2 configurado
- [ ] PORTAL_ACESSO configurado com `VITE_COLLECTOR_ENABLED=true`
- [ ] PORTAL_ACESSO configurado com `VITE_SYNC_SERVER_URL` correto
- [ ] Testado sincronização de ambas as contas
- [ ] Validado na Aba Coração que tudo está funcionando

## Troubleshooting

### Domain não mapeado
**Erro:** `Domain não está mapeado para nenhum customer_id`

**Solução:** Use `POST /google-ads/map-domain` para configurar o mapeamento.

### Campanhas não aparecem na Aba Coração
**Possíveis causas:**
1. Domain não está mapeado
2. Campanhas não foram sincronizadas
3. `utm_campaign` não corresponde ao nome da campanha no Google Ads

**Solução:**
1. Verificar mapeamento: `GET /google-ads/domain-mappings`
2. Sincronizar campanhas: `POST /google-ads/sync`
3. Verificar validação: `GET /funnel-validation`

### Custos não vinculados aos eventos
**Possíveis causas:**
1. `utm_campaign` nas URLs não corresponde ao nome da campanha
2. Domain não está mapeado corretamente
3. Campanhas não foram sincronizadas no período

**Solução:**
1. Verificar se `utm_campaign` nas URLs é igual ao nome da campanha no Google Ads
2. Verificar mapeamento domain → customer_id
3. Sincronizar campanhas para o período correto

## Próximos Passos

1. Adicionar conta Google Ads 2 à MCC (se ainda não estiver)
2. Configurar mapeamentos usando `scripts/setup-multiple-accounts.js`
3. Sincronizar campanhas de ambas as contas
4. Verificar validação na Aba Coração
5. Monitorar métricas por domínio separadamente

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sync-server: `pm2 logs sync-server`
2. Verifique a validação: `GET /funnel-validation`
3. Verifique os mapeamentos: `GET /google-ads/domain-mappings`

