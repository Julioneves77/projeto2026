# Análise: Coleta de GCLID para Google Ads

**Data:** 2026-02-27  
**Objetivo:** Verificar se o GCLID está sendo coletado corretamente para envio de conversões offline ao Google Ads.

---

## 1. Resumo Executivo

| Item | Status | Observação |
|------|--------|------------|
| Captura na URL | ✅ OK | gclid.js carrega antes do React |
| Persistência (cookie/localStorage) | ✅ OK | 90 dias, path /, SameSite=Lax |
| Inclusão no ticket | ✅ OK | Via formData ou fallback getStoredClickId() |
| Registro no webhook Pagar.me | ✅ OK | ticket.dadosFormulario.gclid |
| Exportação para Google Sheets | ✅ OK | Formato Google Ads Offline Conversions |
| Suporte wbraid/gbraid (iOS 14+) | ✅ OK | Prioridade: gclid > wbraid > gbraid |

**Conclusão:** O fluxo está implementado corretamente no **GUIA_CENTRAL** (guia-central.online).

---

## 2. Fluxo Completo

```
1. Usuário clica no anúncio Google Ads
   → Google adiciona ?gclid=XXX na URL de destino

2. Usuário acessa https://www.guia-central.online/?gclid=XXX
   → gclid.js (carregado no <head> antes do React) executa captureFromUrl()
   → Armazena em: cookie gc_gclid (90 dias) + localStorage gc_click_attribution

3. Usuário preenche formulário (CertificateForm) e vai para pagamento
   → formData não inclui gclid (formulário é controlado por React state)
   → Não há problema: mapFormDataToTicket usa getStoredClickId() como fallback

4. Payment.tsx chama createTicket(formData, ...)
   → mapFormDataToTicket: formData.gclid vazio → getStoredClickId() lê cookie/localStorage
   → dadosFormulario['gclid'] = valor do click ID
   → Ticket criado com gclid em dadosFormulario

5. Usuário paga via PIX → Webhook Pagar.me (order.paid)
   → sync-server busca ticket, lê ticket.dadosFormulario.gclid
   → gclidSheetsDb.upsertConversion() registra conversão (status PENDING ou PENDING_NO_CLICKID)

6. Exportação para Google Sheets (manual ou automática)
   → sheetsExportService formata: Google Click ID, Conversion Name, Conversion Time, etc.
   → Planilha importada no Google Ads para conversões offline
```

---

## 3. Arquivos Envolvidos

| Arquivo | Função |
|---------|--------|
| `GUIA_CENTRAL/index.html` | Carrega `/gclid.js` antes do React |
| `GUIA_CENTRAL/public/gclid.js` | Captura gclid/wbraid/gbraid da URL, persiste, injeta em forms |
| `GUIA_CENTRAL/src/lib/gclid.ts` | Wrapper React para window.gclidUtils |
| `GUIA_CENTRAL/src/lib/ticketService.ts` | mapFormDataToTicket inclui gclid via formData ou getStoredClickId() |
| `GUIA_CENTRAL/src/pages/CertificateForm.tsx` | attachHiddenGclidToForms() ao renderizar form |
| `sync-server.js` | Webhook Pagar.me registra conversão com gclid |
| `services/gclidSheetsDatabase.js` | SQLite de conversões |
| `services/sheetsExportService.js` | Exporta para Google Sheets no formato Google Ads |

---

## 4. Pontos de Atenção

### 4.1 Fluxo PrePayment → Payment (window.location.href)

O PrePayment usa `window.location.href` para ir ao Payment, causando **reload completo**. O `formData` é salvo em `sessionStorage` e **não inclui gclid**. Porém, o `mapFormDataToTicket` usa `getStoredClickId()` que lê do **cookie** (`gc_gclid`) ou **localStorage** (`gc_click_attribution`). O cookie persiste no reload. ✅ **OK**

### 4.2 Formulário controlado vs. hidden inputs

O CertificateForm usa estado React (`formData`). O `attachHiddenGclidToForms` adiciona `input[name="gclid"]` ao DOM, mas esse valor **não** entra no `formData` ao submeter (o submit usa `handleSubmit` com `finalFormData = { ...formData }`). O fallback `getStoredClickId()` no ticketService resolve isso. ✅ **OK**

### 4.3 PORTAL (portalcacesso) não tem gclid.js

O projeto **PORTAL** (outro frontend de certidões) **não** carrega `gclid.js`. Se houver tráfego Google Ads para o PORTAL, o GCLID **não** será capturado. Recomendação: adicionar gclid.js ao PORTAL se for usado em campanhas.

### 4.4 Validação do GCLID para exportação

O `sheetsExportService` considera conversões **não exportáveis** se:
- `gclid` vazio ou com menos de 10 caracteres
- `gclid` contém caracteres inválidos (apenas `[A-Za-z0-9_-]`)
- Conversões de teste (TEST-CONN, TESTE123, etc.)

---

## 5. Como Testar

### Teste rápido no navegador

1. Acesse: `https://www.guia-central.online/?gclid=TESTE123`
2. Abra o Console (F12) e execute: `window.gclidUtils.__GCLID_DEBUG()`
3. Deve retornar algo como:
   ```js
   { storedData: { gclid: "TESTE123", ... }, getStoredClickId: { value: "TESTE123", type: "GCLID" }, ... }
   ```

### Teste fluxo completo

1. Acesse com `?gclid=MEUTESTE456`
2. Preencha o formulário e complete até gerar o PIX (não precisa pagar)
3. Na plataforma admin: **Conversões (GCLID)** → verificar se existe conversão com o GCLID usado
4. Ou via API: `GET /api/admin/sheets/diagnostic` (campo `recentTicketsWithGclid`)

### Documentação detalhada

Ver: `docs/COMO_VERIFICAR_GCLID.md`

---

## 6. Requisitos no Google Ads

Para o Google Ads enviar o GCLID automaticamente:

1. **URL final do anúncio** deve ser `https://www.guia-central.online` (ou com UTM)
2. **Rastreamento de conversões** configurado no Google Ads
3. Usuário deve **clicar no anúncio** (não digitar a URL manualmente)

---

## 7. Recomendações

1. **Manter** a ordem de carregamento: `gclid.js` antes do React no `index.html`
2. **Opcional:** Incluir `gclid` e `clickIdType` em `finalFormData` no `handleSubmit` do CertificateForm (belt-and-suspenders), lendo de `window.gclidUtils.getStoredClickId()` antes de navegar
3. **Se usar PORTAL em campanhas:** Adicionar `gclid.js` e lógica equivalente no ticketService do PORTAL
4. **Monitorar** o campo `recentTicketsWithGclid` no diagnóstico para ver % de tickets com GCLID
