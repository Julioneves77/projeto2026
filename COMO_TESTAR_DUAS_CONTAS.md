# Como Testar se as Duas Contas Estão Marcando Corretamente

## 🧪 Teste Rápido (5 minutos)

### Passo 1: Usar GTM Preview Mode

1. No GTM, clique em **"Visualizar"** (Preview) no topo
2. Digite a URL: `https://solicite.link?utm_campaign=teste_conta_1`
3. Clique em **"Conectar"**
4. Uma nova aba abrirá com o site

### Passo 2: Verificar Variáveis

1. No painel do Preview Mode (aba que ficou aberta), vá em **"Variáveis"**
2. Procure por `DLV - utm_campaign`
3. **Deve mostrar:** `teste_conta_1` ✅
4. Procure por `google_ads_account`
5. **Deve mostrar:** `591-659-0517` ✅

### Passo 3: Navegar e Disparar Evento

1. Na aba do site, selecione uma opção no dropdown
2. Clique em "Acessar"
3. Complete o fluxo até chegar na página de pagamento
4. **OU** vá direto para: `https://solicite.link/obrigado?codigo=TESTE123&planoId=padrao`

### Passo 4: Verificar Tags Disparadas

1. No painel do Preview Mode, vá em **"Tags"**
2. Procure pela tag `ADS - Conversão - Payment Completed`
3. Clique nela para ver detalhes
4. Verifique:
   - ✅ Tag disparou? (deve aparecer como "disparada")
   - ✅ Qual Customer ID foi usado? (deve ser `591-659-0517`)

### Passo 5: Testar com Conta 2

1. Feche o Preview Mode
2. Abra Preview novamente
3. Digite: `https://solicite.link?utm_campaign=teste_conta_2`
4. Repita os passos acima
5. Verifique se o Customer ID é `471-059-5347` ✅

---

## 🔍 Verificação no Console do Navegador

### Verificar dataLayer

1. Abra o Console do navegador (F12)
2. Digite: `dataLayer`
3. Pressione Enter
4. Procure por eventos `payment_completed`
5. Verifique se contém: `utm_campaign: "teste_conta_1"` ou `"teste_conta_2"`

### Verificar se utm_campaign está sendo preservado

1. No Console, digite:
```javascript
localStorage.getItem('utm_campaign')
```
2. Deve retornar o valor da campanha ✅

---

## ✅ Checklist de Verificação

### Variáveis:
- [ ] `DLV - utm_campaign` aparece no Preview Mode
- [ ] `google_ads_account` retorna o Customer ID correto baseado na campanha

### Trigger:
- [ ] `CE - payment_completed` dispara quando `utm_campaign` contém "conta_1"
- [ ] `CE - payment_completed` dispara quando `utm_campaign` contém "conta_2"

### Tag:
- [ ] Tag `ADS - Conversão - Payment Completed` dispara
- [ ] Customer ID na tag é `591-659-0517` quando campanha contém "conta_1"
- [ ] Customer ID na tag é `471-059-5347` quando campanha contém "conta_2"

### DataLayer:
- [ ] `utm_campaign` aparece nos eventos
- [ ] `utm_campaign` é preservado durante o fluxo

---

## 🆘 Problemas Comuns

### Problema: `google_ads_account` não retorna nada

**Solução:**
1. Verifique se `DLV - utm_campaign` está sendo preenchido
2. Verifique se a Lookup Table está configurada corretamente
3. Verifique se o nome da campanha contém "conta_1" ou "conta_2"

### Problema: Tag não dispara

**Solução:**
1. Verifique se o trigger está configurado corretamente
2. Verifique se o evento `payment_completed` está sendo disparado
3. Use Preview Mode para ver qual trigger está disparando

### Problema: Tag dispara mas Customer ID está errado

**Solução:**
1. Verifique se a tag está usando `{{google_ads_account}}` no campo "ID da Conta"
2. Verifique se a Lookup Table está retornando o valor correto
3. Use Preview Mode para ver qual valor está sendo usado

---

## 📊 Verificar Conversões no Google Ads

### Após 24 horas:

1. Acesse Google Ads
2. Selecione a conta `591-659-0517`
3. Vá em **"Ferramentas e configurações"** → **"Conversões"**
4. Verifique se conversões estão sendo registradas

5. Repita para conta `471-059-5347`

---

**✅ Se tudo estiver funcionando no Preview Mode, está configurado corretamente!**

