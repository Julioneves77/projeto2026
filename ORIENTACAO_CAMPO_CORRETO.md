# 🎯 Orientação: Qual Campo Usar no GTM

## ❌ ERRO Identificado

Na tag `ADS - Conversão - Payment Completed`, você está usando `{{google_ads_account_js}}` no campo **"Código de conversão"**.

**Isso está ERRADO!**

---

## ✅ CAMPO CORRETO

O campo **"Código de conversão"** deve conter o **ID da conversão específica** (ex: `17595619347`), não o Customer ID.

O **Customer ID** (`591-659-0517` ou `471-059-5347`) deve ir em outro campo.

---

## 🔍 Verificar Campos da Tag

Na tag `ADS - Conversão - Payment Completed`, procure por um campo chamado:

- **"ID da Conta"** ou **"Account ID"** ou **"Customer ID"**

**Esse é o campo correto para usar `{{google_ads_account_js}}`!**

---

## 📋 Configuração Correta da Tag

### Campos que devem estar assim:

1. **"Código de conversão"** (Conversion ID):
   - Deve ter: `17595619347` (ID da conversão específica)
   - **NÃO** use variável aqui!

2. **"ID da Conta"** ou **"Account ID"** (se existir):
   - Deve ter: `{{google_ads_account_js}}`
   - **ESSE é o campo correto!**

3. **"Rótulo de conversão"** (Conversion Label):
   - Deve ter: `pMaxCKGcwtsbEJOwn8ZB`
   - Está correto ✅

4. **"Valor da conversão"**:
   - Pode usar: `{{DLV - value}}` ou deixar vazio

---

## ⚠️ Se Não Existir Campo "ID da Conta"

Se a tag do Google Ads não tiver um campo separado para "ID da Conta", você tem duas opções:

### Opção 1: Criar Tags Separadas (Mais Simples)

Crie duas tags diferentes:

**Tag 1:**
- Nome: `ADS - Conversão - Payment Completed - Conta 1`
- Código de conversão: `[ID da conversão da Conta 1]`
- Trigger: `CE - payment_completed - Conta 1` (criar trigger separado)

**Tag 2:**
- Nome: `ADS - Conversão - Payment Completed - Conta 2`
- Código de conversão: `[ID da conversão da Conta 2]`
- Trigger: `CE - payment_completed - Conta 2` (criar trigger separado)

### Opção 2: Usar Lookup Table Corrigida

Se quiser manter uma única tag, corrija a Lookup Table para usar regex ou múltiplas entradas.

---

## 🎯 RECOMENDAÇÃO: Opção 1 (Tags Separadas)

**Por quê?**
- Mais simples de configurar
- Mais fácil de debugar
- Mais claro qual conta está recebendo cada conversão
- Não depende de Lookup Table funcionando

**Como fazer:**

1. **Criar Trigger para Conta 1:**
   - Nome: `CE - payment_completed - Conta 1`
   - Tipo: Evento personalizado
   - Nome do evento: `payment_completed`
   - Condição: `{{DLV - utm_campaign}}` contém `conta_1`

2. **Criar Trigger para Conta 2:**
   - Nome: `CE - payment_completed - Conta 2`
   - Tipo: Evento personalizado
   - Nome do evento: `payment_completed`
   - Condição: `{{DLV - utm_campaign}}` contém `conta_2`

3. **Criar Tag para Conta 1:**
   - Nome: `ADS - Conversão - Payment Completed - Conta 1`
   - Tipo: Google Ads: Conversão de evento
   - Código de conversão: `[ID da conversão da Conta 591-659-0517]`
   - Trigger: `CE - payment_completed - Conta 1`

4. **Criar Tag para Conta 2:**
   - Nome: `ADS - Conversão - Payment Completed - Conta 2`
   - Tipo: Google Ads: Conversão de evento
   - Código de conversão: `[ID da conversão da Conta 471-059-5347]`
   - Trigger: `CE - payment_completed - Conta 2`

5. **Desativar ou deletar a tag antiga** que estava usando `{{google_ads_account_js}}`

---

## ✅ Checklist

- [ ] Verificar se existe campo "ID da Conta" na tag
- [ ] Se existir, usar `{{google_ads_account_js}}` nesse campo
- [ ] Se não existir, criar tags separadas (Opção 1)
- [ ] Criar triggers separados para cada conta
- [ ] Criar tags separadas para cada conta
- [ ] Testar no Preview Mode

---

**💡 RECOMENDO: Use a Opção 1 (Tags Separadas) - é mais simples e confiável!**

