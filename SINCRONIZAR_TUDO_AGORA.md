# 🚀 Sincronizar Tudo Agora

## Status Atual

✅ **Implementação completa:**
- Sistema suporta múltiplas contas Google Ads
- Mapeamento `solicite.link` → `591-659-0517` configurado
- Validação na Aba Coração implementada

⏳ **Pendente:**
- Descobrir Customer ID da conta `portalcacesso.online`
- Configurar mapeamento `portalcacesso.online`
- Sincronizar campanhas

## Como Descobrir o Customer ID da Segunda Conta

### Opção 1: Via Google Ads Interface

1. Acesse https://ads.google.com
2. Vá em **Tools & Settings** (⚙️) → **Account Access**
3. Veja todas as contas listadas
4. O Customer ID está no formato `XXX-XXX-XXXX` ao lado de cada conta

### Opção 2: Via Google Ads API

Se você tem acesso ao Google Ads, pode listar todas as contas:

```bash
# O MCC ID geralmente é o mesmo número mas usado de forma diferente
# Tente usar o mesmo número sem hífens ou com formato diferente
```

## Configurar e Sincronizar

### Passo 1: Configurar Mapeamento do portalacesso.online

Depois de descobrir o Customer ID da segunda conta:

```bash
node -e "
const db = require('./services/funnelDatabase');
db.initDatabase();
db.upsertDomainMapping('portalcacesso.online', 'CUSTOMER_ID_AQUI', 'Conta Portal Acesso');
console.log('✅ Mapeamento configurado!');
"
```

**Substitua `CUSTOMER_ID_AQUI` pelo Customer ID real da segunda conta.**

### Passo 2: Sincronizar Campanhas

#### Opção A: Via Sync-Server (se estiver rodando)

```bash
# Sincronizar solicite.link
curl -X POST http://localhost:3001/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "solicite.link",
    "date_from": "2025-12-13",
    "date_to": "2026-01-12"
  }'

# Sincronizar portalacesso.online (após configurar mapeamento)
curl -X POST http://localhost:3001/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "portalcacesso.online",
    "date_from": "2025-12-13",
    "date_to": "2026-01-12"
  }'
```

#### Opção B: Via Script Local

```bash
# Sincronizar solicite.link
node -e "
require('dotenv').config();
const googleAds = require('./services/googleAdsService');
const db = require('./services/funnelDatabase');
db.initDatabase();

const dateFrom = '2025-12-13';
const dateTo = '2026-01-12';

googleAds.syncCampaigns('591-659-0517', dateFrom, dateTo).then(campaigns => {
  const mapping = db.getAllDomainMappings().find(m => m.customer_id === '591-659-0517');
  const domain = mapping ? mapping.domain : null;
  
  let saved = 0;
  campaigns.forEach(c => {
    c.domain = domain;
    db.upsertCampaign(c);
    saved++;
  });
  
  console.log(\`✅ \${campaigns.length} campanha(s) sincronizada(s) para \${domain || 'solicite.link'}\`);
}).catch(err => {
  console.error('❌ Erro:', err.message);
});
"
```

### Passo 3: Verificar Validação

Acesse a **PLATAFORMA → Aba Coração** e verifique:
- ✅ Seção "Validação por Domínio" mostra status de cada domínio
- ✅ Eventos sendo coletados
- ✅ Campanhas sincronizadas
- ✅ Custos vinculados corretamente

## Resumo Rápido

**O que já está funcionando:**
1. ✅ Sistema configurado para múltiplas contas
2. ✅ `solicite.link` mapeado para `591-659-0517`
3. ✅ Validação na Aba Coração implementada

**O que falta:**
1. ⏳ Descobrir Customer ID da conta `portalcacesso.online`
2. ⏳ Configurar mapeamento `portalcacesso.online`
3. ⏳ Sincronizar campanhas de ambas as contas

**Depois disso, tudo funcionará automaticamente!** 🎉

