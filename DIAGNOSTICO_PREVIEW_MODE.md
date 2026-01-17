# Diagnóstico: Tags Não Estão Disparando

## 📊 O Que Vejo no Preview Mode

### ✅ Tags que ESTÃO disparando:
- Vinculador de conversões ✅
- Tag do Google AW-17595619347 ✅
- Tag do Google AW-17580634459 ✅

### ❌ Tags que NÃO estão disparando:
- ADS - Conversão - Portal Checkout (Proxy) ❌
- ADS - Conversão - Payment Completed ❌

### 📋 Eventos que aparecem:
- links_access_clicked ✅
- links_option_selected ✅
- Janela carregada ✅
- DOM pronto ✅

---

## 🔍 O Que Verificar Agora

### 1. Verificar se evento payment_completed está sendo disparado

**No Preview Mode:**
1. Clique no evento `links_access_clicked` na barra lateral
2. Vá na aba **"Camada de dados"** (Data Layer)
3. Verifique se há algum evento `payment_completed` na lista

**Se não houver:**
- O evento `payment_completed` ainda não foi disparado
- Isso é normal se você ainda não completou o fluxo até a página de obrigado

---

### 2. Verificar se utm_campaign está no dataLayer

**No Preview Mode:**
1. Clique em qualquer evento (ex: `links_access_clicked`)
2. Vá na aba **"Variáveis"**
3. Procure por `DLV - utm_campaign`
4. **Deve mostrar:** O valor do utm_campaign (ex: `teste_conta_1`)

**Se não aparecer:**
- O utm_campaign não está sendo capturado
- Verifique se você acessou com `?utm_campaign=teste_conta_1` na URL

---

### 3. Verificar variável google_ads_account

**No Preview Mode:**
1. Clique em qualquer evento
2. Vá na aba **"Variáveis"**
3. Procure por `google_ads_account`
4. **Deve mostrar:** `591-659-0517` ou `471-059-5347`

**Se não aparecer ou estiver vazio:**
- A Lookup Table não está funcionando
- Verifique se o nome da campanha contém "conta_1" ou "conta_2"

---

### 4. Verificar trigger da tag

**No GTM (não no Preview):**
1. Vá em **"Tags"**
2. Abra a tag `ADS - Conversão - Payment Completed`
3. Verifique qual trigger está configurado
4. Clique no trigger para ver as condições

**Deve ter:**
- Evento: `payment_completed`
- Condição: `{{DLV - utm_campaign}}` contém "conta_1" OU contém "conta_2"

---

## 🧪 Como Testar payment_completed

### Opção 1: Completar o fluxo completo
1. No Preview Mode, vá até a página de obrigado:
   `https://solicite.link/obrigado?codigo=TESTE123&planoId=padrao`
2. Isso deve disparar o evento `payment_completed`
3. Verifique se a tag dispara

### Opção 2: Disparar manualmente no Console
1. Abra o Console do navegador (F12)
2. Execute:
```javascript
dataLayer.push({
  event: 'payment_completed',
  utm_campaign: 'teste_conta_1',
  funnel_step: 'payment_success',
  source: 'links',
  value: 'padrao'
});
```
3. Volte ao Preview Mode e verifique se a tag disparou

---

## ✅ Checklist de Verificação

- [ ] Evento `payment_completed` aparece no Preview Mode?
- [ ] `DLV - utm_campaign` mostra um valor?
- [ ] `google_ads_account` mostra `591-659-0517` ou `471-059-5347`?
- [ ] Trigger da tag está configurado corretamente?
- [ ] Tag está usando `{{google_ads_account}}` no campo "ID da Conta"?

---

## 🆘 Problemas Comuns

### Problema: Tag não dispara mesmo com evento payment_completed

**Possíveis causas:**
1. Trigger não está configurado corretamente
2. Condição do trigger não está sendo atendida
3. Tag não está publicada (ainda em rascunho)

**Solução:**
1. Verifique o trigger da tag
2. Use Preview Mode para ver qual condição está falhando
3. Publique a versão no GTM

### Problema: utm_campaign não aparece

**Solução:**
1. Acesse com `?utm_campaign=teste_conta_1` na URL
2. Verifique o Console: `localStorage.getItem('utm_campaign')`
3. Verifique o dataLayer: `console.log(dataLayer)`

---

**💡 Próximo passo: Clique no evento `links_access_clicked` no Preview Mode e vá na aba "Variáveis" para verificar se `DLV - utm_campaign` e `google_ads_account` estão aparecendo.**

