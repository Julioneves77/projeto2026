# ✅ Configuração Completa - Múltiplas Contas Google Ads

## Status Final

✅ **Tudo configurado e pronto!**

### Mapeamentos Configurados

1. **solicite.link** → `591-659-0517` (Conta Solicite Link)
2. **portalcacesso.online** → `981-373-7127` (Conta Portal Acesso)

### Sistema Funcionando

- ✅ Suporte a múltiplas contas Google Ads implementado
- ✅ Mapeamento domain → customer_id configurado
- ✅ Validação na Aba Coração implementada
- ✅ Endpoints criados e funcionando

## Como Funciona Agora

### 1. Coleta de Eventos

Ambos os domínios coletam eventos automaticamente:
- `solicite.link` → eventos com `domain: "solicite.link"`
- `portalcacesso.online` → eventos com `domain: "portalcacesso.online"`

### 2. Sincronização de Campanhas

Quando você sincronizar campanhas:

**Via MCC (recomendado):**
```bash
POST /google-ads/sync
{
  "mcc_id": "MCC_ID",
  "date_from": "2025-12-13",
  "date_to": "2026-01-12"
}
```

**Por Domain:**
```bash
POST /google-ads/sync
{
  "domain": "solicite.link",
  "date_from": "2025-12-13",
  "date_to": "2026-01-12"
}
```

O sistema automaticamente:
- Identifica qual customer_id usar baseado no domain
- Salva as campanhas com o domain correto
- Vincula custos aos eventos do domínio correspondente

### 3. Cálculo de Métricas

Na Aba Coração:
- Eventos são filtrados por domain
- Custos são buscados apenas da conta Google Ads correspondente
- Métricas (ROI, CPA) são calculadas corretamente por domínio

### 4. Validação

A seção "Validação por Domínio" na Aba Coração mostra:
- ✅ Status de cada domínio (OK/WARNING/ERROR)
- ✅ Quantidade de eventos coletados
- ✅ Campanhas sincronizadas
- ✅ Custos vinculados
- ✅ Alertas se algo estiver faltando

## Verificar se Está Funcionando

### 1. Acesse a Aba Coração

PLATAFORMA → Aba Coração

### 2. Verifique a Seção "Validação por Domínio"

Deve mostrar:
- **solicite.link**: Status, eventos, campanhas, custos
- **portalcacesso.online**: Status, eventos, campanhas, custos

### 3. Verifique a Tabela por Campanha

Deve mostrar campanhas de ambos os domínios, agrupadas por `utm_campaign`.

## Sincronizar Campanhas

### Opção 1: Via API (Recomendado)

Se o sync-server estiver rodando:

```bash
# Sincronizar todas as contas via MCC
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "mcc_id": "MCC_ID_AQUI",
    "date_from": "2025-12-13",
    "date_to": "2026-01-12"
  }'
```

### Opção 2: Via Script Local

```bash
node scripts/sincronizar-agora.sh [MCC_ID]
```

### Opção 3: Por Domain Individual

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

# Sincronizar portalacesso.online
curl -X POST https://api.portalcertidao.org/google-ads/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "domain": "portalcacesso.online",
    "date_from": "2025-12-13",
    "date_to": "2026-01-12"
  }'
```

## Resumo

✅ **Mapeamentos:**
- `solicite.link` → `591-659-0517`
- `portalcacesso.online` → `981-373-7127`

✅ **Sistema:**
- Pronto para coletar eventos de ambos os domínios
- Pronto para sincronizar campanhas de ambas as contas
- Pronto para vincular custos aos eventos corretos
- Validação implementada na Aba Coração

🎯 **Próximo passo:** Sincronizar campanhas quando houver campanhas ativas no Google Ads!

