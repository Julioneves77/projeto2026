# ✅ Checklist: Adicionar Novo Domínio na Aba Coração

## 📋 Informações do Novo Domínio

**Domínio:** ___________________________  
**Tipo:** [ ] Landing Page | [ ] Portal Completo | [ ] Outro: ___________  
**URL do Sync-Server:** ___________________________

---

## 🔧 Implementação Técnica

### 1. Biblioteca de Tracking

- [ ] Criar arquivo `src/lib/funnelTracker.ts` (copiar de `template-funnelTracker.ts`)
- [ ] Verificar se funções estão corretas:
  - [ ] `getFunnelId()` - Gera/recupera UUID único
  - [ ] `trackEvent()` - Envia eventos para backend
  - [ ] `addFunnelIdToUrl()` - Repassa funnel_id entre domínios

### 2. Configuração de Ambiente

- [ ] Criar/editar `.env` ou `.env.local`
- [ ] Configurar `VITE_SYNC_SERVER_URL` (ex: `https://api.portalcertidao.org`)
- [ ] Configurar `VITE_COLLECTOR_ENABLED=true`
- [ ] (Opcional) Configurar `VITE_SYNC_SERVER_API_KEY` se necessário

### 3. Implementação de Eventos

#### Landing Page / Página de Links

- [ ] `trackEvent('links_view')` - Quando página carrega
- [ ] `trackEvent('links_cta_click')` - Quando botão CTA é clicado
- [ ] Repassar `funnel_id` ao redirecionar para Portal

#### Portal / Formulário

- [ ] `trackEvent('portal_view')` - Quando página do Portal carrega
- [ ] `trackEvent('form_start')` - Quando usuário começa a preencher formulário
- [ ] `trackEvent('form_submit_success')` - Quando formulário é enviado com sucesso
- [ ] `trackEvent('form_submit_error')` - Quando há erro ao enviar formulário
- [ ] Salvar `funnel_id` no ticket quando formulário é enviado
- [ ] Repassar `funnel_id` ao redirecionar para pagamento

#### Página de Pagamento

- [ ] `trackEvent('pix_view')` - Quando página de pagamento carrega
- [ ] `trackEvent('pix_initiated')` - Quando PIX é gerado
- [ ] `trackEvent('payment_confirmed')` - Quando pagamento é confirmado
  - [ ] Implementar no webhook do Pagar.me
  - [ ] Vincular ao `ticket_id` correto

---

## 🔗 Integração com Google Ads

### 4. UTM Parameters

- [ ] Adicionar `utm_campaign` nas URLs de destino
- [ ] Adicionar `utm_term` (opcional mas recomendado)
- [ ] Garantir que `utm_campaign` seja extraído e enviado nos eventos

**Exemplo de URL:**
```
https://portalcertidao.org/certidao?utm_campaign=nome-da-campanha&utm_term=termo-1&funnel_id=...
```

### 5. Sincronização Google Ads

- [ ] Verificar se campanhas Google Ads estão sendo sincronizadas
- [ ] Verificar se `utm_campaign` nas URLs corresponde ao nome da campanha no Google Ads
- [ ] Testar sincronização: `/google-ads/sync`

---

## 🧪 Testes

### 6. Teste de Eventos

- [ ] Abrir página no navegador
- [ ] Abrir Console (F12)
- [ ] Verificar logs: `[FunnelTracker] Evento enviado: ...`
- [ ] Navegar pelo funil completo
- [ ] Verificar se todos os eventos foram enviados

### 7. Teste no Banco de Dados

```bash
# No servidor
sqlite3 funnel-database.db "SELECT * FROM funnel_events WHERE domain = 'seu-dominio.com' ORDER BY timestamp DESC LIMIT 10;"
```

- [ ] Verificar se eventos aparecem no banco
- [ ] Verificar se `funnel_id` está sendo persistido
- [ ] Verificar se `utm_campaign` está sendo salvo

### 8. Teste na Aba Coração

- [ ] Acessar PLATAFORMA → Aba Coração
- [ ] Selecionar período com eventos do novo domínio
- [ ] Verificar se dados aparecem no Resumo Geral
- [ ] Verificar se campanha aparece na Tabela por Campanha (se tiver `utm_campaign`)

---

## 📊 Validação Final

### 9. Verificar Métricas

- [ ] **Resumo Geral** mostra dados do novo domínio
- [ ] **Gargalo Dominante** identifica corretamente
- [ ] **Ação Sugerida** é relevante
- [ ] **Tabela por Campanha** mostra campanhas do novo domínio
- [ ] **Gráfico do Funil** mostra todas as etapas

### 10. Verificar Fluxo Completo

- [ ] Landing Page → Portal → Formulário → Pagamento
- [ ] `funnel_id` é mantido em todo o fluxo
- [ ] Eventos são enviados em cada etapa
- [ ] Pagamento confirmado vincula ao evento correto

---

## 🎯 Eventos Críticos

Certifique-se de que estes eventos estão sendo coletados:

1. ⭐ **`payment_confirmed`** - CONVERSÃO PRINCIPAL
2. `form_submit_success` - Formulário completo
3. `form_start` - Interesse demonstrado
4. `links_view` - Tráfego chegando
5. `pix_initiated` - Pagamento iniciado

---

## 📝 Observações

**Data de Implementação:** ___________  
**Responsável:** ___________  
**Status:** [ ] Em Desenvolvimento | [ ] Testando | [ ] Produção

**Problemas Encontrados:**
- _________________________________________________
- _________________________________________________

**Próximos Passos:**
- _________________________________________________
- _________________________________________________

---

## ✅ Assinatura

**Implementado por:** ___________  
**Data:** ___________  
**Aprovado por:** ___________  
**Data:** ___________

