# Passo a Passo Detalhado: Criar Tags Separadas para Duas Contas

## Objetivo

Criar duas tags separadas no GTM, uma para cada conta Google Ads, para que cada conversão seja enviada para a conta correta baseado no `utm_campaign`.

**Contas:**
- Conta 1: `591-659-0517`
- Conta 2: `471-059-5347`

---

## 📋 ANTES DE COMEÇAR

### O que você precisa ter:

1. **IDs de Conversão do Google Ads:**
   - ID da conversão da Conta 1 (`591-659-0517`)
   - ID da conversão da Conta 2 (`471-059-5347`)

   **Como obter:**
   - Acesse Google Ads → Ferramentas e configurações → Conversões
   - Selecione cada conta
   - Copie o ID de conversão de cada uma

2. **Variável `DLV - utm_campaign` já criada** ✅ (você já tem)

---

## 🎯 PASSO 1: Criar Triggers Separados

### 1.1 Criar Trigger para Conta 1

1. No GTM, vá em **"Acionadores"** (Triggers)
2. Clique em **"Novo"** (New)
3. Configure:
   - **Nome:** `CE - payment_completed - Conta 1`
   - **Tipo de acionador:** Clique em "Escolher tipo de acionador"
   - Selecione: **"Evento personalizado"** (Custom Event)
   - **Nome do evento:** Digite exatamente: `payment_completed`
   - **Este acionador é disparado em:** Selecione **"Alguns eventos personalizados"**
   - **Condições:** Clique em **"Adicionar condição"**
     - Primeira condição:
       - Variável: `{{DLV - utm_campaign}}`
       - Operador: **"contém"** (contains)
       - Valor: `conta_1`
     - Clique em **"OK"**
4. Clique em **"Salvar"**

**✅ Trigger criado: `CE - payment_completed - Conta 1`**

---

### 1.2 Criar Trigger para Conta 2

1. Clique em **"Novo"** novamente
2. Configure:
   - **Nome:** `CE - payment_completed - Conta 2`
   - **Tipo de acionador:** **"Evento personalizado"** (Custom Event)
   - **Nome do evento:** `payment_completed`
   - **Este acionador é disparado em:** **"Alguns eventos personalizados"**
   - **Condições:** Clique em **"Adicionar condição"**
     - Variável: `{{DLV - utm_campaign}}`
     - Operador: **"contém"** (contains)
     - Valor: `conta_2`
     - Clique em **"OK"**
3. Clique em **"Salvar"**

**✅ Trigger criado: `CE - payment_completed - Conta 2`**

---

## 🏷️ PASSO 2: Criar Tag para Conta 1

### 2.1 Criar Nova Tag

1. No GTM, vá em **"Tags"**
2. Clique em **"Nova"** (New)

### 2.2 Configurar Tag

1. **Nome da Tag:**
   - Digite: `ADS - Conversão - Payment Completed - Conta 1`

2. **Tipo de Tag:**
   - Clique em **"Escolher tipo de tag"**
   - Procure e selecione: **"Acompanhamento de conversões do Google Ads"**
   - Se não encontrar, procure por: **"Google Ads Conversion Tracking"**

3. **Configurações do Google Ads:**

   **Código de conversão (Conversion ID):**
   - Digite o **ID da conversão da Conta 1**
   - Exemplo: `17595619347` (use o ID real da sua conta)
   - **⚠️ IMPORTANTE:** Este é o ID da conversão específica, não o Customer ID!

   **Rótulo de conversão (Conversion Label):**
   - Digite: `pMaxCKGcwtsbEJOwn8ZB` (ou o rótulo da conversão da Conta 1)
   - **OU** deixe em branco se não tiver

   **Valor da conversão:**
   - Clique no ícone de variável (blocos empilhados)
   - Selecione: `{{DLV - value}}`
   - **OU** deixe em branco se não usar valor

   **Código da moeda:**
   - Digite: `BRL`

4. **Acionamento (Trigger):**
   - Clique em **"Escolher um acionador"**
   - Selecione: `CE - payment_completed - Conta 1`

5. **Configurações Avançadas (Opcional):**
   - Deixe os padrões

6. Clique em **"Salvar"**

**✅ Tag criada: `ADS - Conversão - Payment Completed - Conta 1`**

---

## 🏷️ PASSO 3: Criar Tag para Conta 2

### 3.1 Criar Nova Tag

1. Clique em **"Nova"** novamente

### 3.2 Configurar Tag

1. **Nome da Tag:**
   - Digite: `ADS - Conversão - Payment Completed - Conta 2`

2. **Tipo de Tag:**
   - **"Acompanhamento de conversões do Google Ads"**

3. **Configurações do Google Ads:**

   **Código de conversão (Conversion ID):**
   - Digite o **ID da conversão da Conta 2**
   - Exemplo: `[ID da conversão da Conta 471-059-5347]`
   - **⚠️ IMPORTANTE:** Este é o ID da conversão específica da Conta 2!

   **Rótulo de conversão:**
   - Digite o rótulo da conversão da Conta 2
   - **OU** deixe em branco

   **Valor da conversão:**
   - `{{DLV - value}}` ou deixe em branco

   **Código da moeda:**
   - `BRL`

4. **Acionamento:**
   - Selecione: `CE - payment_completed - Conta 2`

5. Clique em **"Salvar"**

**✅ Tag criada: `ADS - Conversão - Payment Completed - Conta 2`**

---

## 🗑️ PASSO 4: Desativar Tag Antiga (Opcional)

Se você tinha uma tag antiga que estava usando `{{google_ads_account_js}}`:

1. Vá em **"Tags"**
2. Encontre a tag antiga `ADS - Conversão - Payment Completed`
3. Clique nos três pontos (⋯) ao lado
4. Selecione **"Pausar"** ou **"Excluir"**
5. **OU** apenas deixe ela desativada (não vai disparar se não tiver trigger)

---

## ✅ PASSO 5: Verificar Configuração

### Checklist:

**Triggers:**
- [ ] `CE - payment_completed - Conta 1` criado
- [ ] `CE - payment_completed - Conta 2` criado

**Tags:**
- [ ] `ADS - Conversão - Payment Completed - Conta 1` criada
- [ ] `ADS - Conversão - Payment Completed - Conta 2` criada
- [ ] Cada tag usa o trigger correto
- [ ] Cada tag tem o ID de conversão correto

---

## 🧪 PASSO 6: Testar no Preview Mode

### Teste 1: Conta 1

1. Abra **GTM Preview Mode**
2. Acesse: `https://solicite.link?utm_campaign=teste_conta_1`
3. No Console do navegador, execute:
   ```javascript
   dataLayer.push({
     event: 'payment_completed',
     utm_campaign: 'teste_conta_1',
     funnel_step: 'payment_success',
     source: 'links',
     value: 'padrao'
   });
   ```
4. No Preview Mode:
   - Clique no evento `payment_completed`
   - Vá na aba **"Tags"**
   - Verifique se a tag `ADS - Conversão - Payment Completed - Conta 1` disparou ✅
   - Verifique se a tag `ADS - Conversão - Payment Completed - Conta 2` NÃO disparou ✅

### Teste 2: Conta 2

1. Feche o Preview Mode
2. Abra novamente
3. Acesse: `https://solicite.link?utm_campaign=teste_conta_2`
4. No Console, execute:
   ```javascript
   dataLayer.push({
     event: 'payment_completed',
     utm_campaign: 'teste_conta_2',
     funnel_step: 'payment_success',
     source: 'links',
     value: 'padrao'
   });
   ```
5. No Preview Mode:
   - Verifique se a tag `ADS - Conversão - Payment Completed - Conta 2` disparou ✅
   - Verifique se a tag `ADS - Conversão - Payment Completed - Conta 1` NÃO disparou ✅

---

## 📊 PASSO 7: Publicar no GTM

### 7.1 Revisar

1. No GTM, vá em **"Visão geral"** (Overview)
2. Verifique se há mudanças pendentes
3. Revise todas as tags e triggers criados

### 7.2 Publicar

1. No canto superior direito, clique em **"Enviar"** (Submit)
2. **Nome da Versão:** Digite: `Tags separadas para duas contas - [Data]`
3. **Descrição:** Digite: `Criadas tags e triggers separados para diferenciar contas 591-659-0517 e 471-059-5347`
4. Clique em **"Publicar"** (Publish)

---

## ✅ Resultado Esperado

Após seguir todos os passos:

- ✅ Quando `utm_campaign` contém `conta_1` → Tag da Conta 1 dispara
- ✅ Quando `utm_campaign` contém `conta_2` → Tag da Conta 2 dispara
- ✅ Cada conversão vai para a conta correta
- ✅ Fácil de debugar e manter

---

## 🆘 Troubleshooting

### Problema: Tag não dispara

**Verifique:**
1. O trigger está configurado corretamente?
2. A condição do trigger está correta?
3. `utm_campaign` está presente no dataLayer?
4. Use Preview Mode para ver qual condição está falhando

### Problema: Tag dispara para conta errada

**Verifique:**
1. O trigger está usando a condição correta?
2. O `utm_campaign` contém `conta_1` ou `conta_2`?
3. Use Preview Mode para ver qual trigger está disparando

### Problema: ID de conversão incorreto

**Solução:**
1. Verifique no Google Ads qual é o ID correto
2. Atualize o campo "Código de conversão" na tag
3. Salve e teste novamente

---

## 📝 Notas Importantes

1. **IDs de Conversão:** Cada conta precisa ter seu próprio ID de conversão criado no Google Ads
2. **Nomenclatura:** Use nomes claros para facilitar identificação
3. **Testes:** Sempre teste no Preview Mode antes de publicar
4. **Backup:** Use "Criar versão" antes de fazer mudanças grandes

---

**✅ Pronto! Siga estes passos e tudo funcionará corretamente!**

