# Guia Simples: Configurar Duas Contas Google Ads

## Objetivo

Fazer com que cada conta Google Ads receba suas conversões corretamente, de forma SIMPLES.

**Contas:**
- Conta 1: `591-659-0517`
- Conta 2: `471-059-5347`

---

## 🎯 SOLUÇÃO SIMPLES (3 Passos)

### PASSO 1: Criar Variável utm_campaign (2 minutos)

1. Vá em **"Variáveis"** → **"Nova"**
2. Configure:
   - **Nome:** `DLV - utm_campaign`
   - **Tipo:** Variável da camada de dados
   - **Nome da Variável do Data Layer:** `utm_campaign`
3. Clique em **"Salvar"**

✅ **Pronto!** Agora o GTM consegue ler `utm_campaign`.

---

### PASSO 2: Modificar Tags Existentes (5 minutos)

Para cada tag que você já tem (ex: `payment_completed`):

1. Clique na tag existente
2. No campo **"ID da Conta"**, ao invés de colocar um número fixo, use uma **condição**:

**Opção A: Usar Lookup Table (Mais fácil)**

1. Crie uma variável nova:
   - **Nome:** `google_ads_account`
   - **Tipo:** Tabela de consulta
   - **Entrada:** `{{DLV - utm_campaign}}`
   - **Tabela:** Preencha assim:
     ```
     Se utm_campaign contém "conta_1" → 591-659-0517
     Se utm_campaign contém "conta_2" → 471-059-5347
     ```
   - **Valor Padrão:** (deixe em branco)

2. Na tag, no campo **"ID da Conta"**, digite: `{{google_ads_account}}`

**Opção B: Usar Condição Direta (Mais simples, mas menos flexível)**

Modifique o trigger da tag para ter duas condições:
- Condição 1: `{{DLV - utm_campaign}}` contém "conta_1" → Tag usa ID `591-659-0517`
- Condição 2: `{{DLV - utm_campaign}}` contém "conta_2" → Tag usa ID `471-059-5347`

**Mas isso requer duplicar tags... então vamos com Opção A!**

---

### PASSO 3: Atualizar Triggers (2 minutos)

Para cada trigger existente, adicione uma condição:

1. Clique no trigger (ex: `payment_completed`)
2. Adicione condição:
   - `{{DLV - utm_campaign}}` não está vazio
   - **OU** se quiser ser mais específico:
     - `{{DLV - utm_campaign}}` contém "conta_1" **OU** contém "conta_2"

---

## ✅ PRONTO!

Agora:
- Quando `utm_campaign` contém "conta_1" → Conversão vai para `591-659-0517`
- Quando `utm_campaign` contém "conta_2" → Conversão vai para `471-059-5347`

---

## 🧪 Como Testar

1. Acesse: `https://solicite.link?utm_campaign=teste_conta_1`
2. Complete o fluxo até pagamento
3. Use GTM Preview Mode para ver se a tag disparou com Customer ID correto

---

## 📝 Importante

**Como nomear suas campanhas:**

Para que funcione automaticamente, suas campanhas no Google Ads devem ter nomes que contenham:
- "conta_1" ou "conta1" → Vai para `591-659-0517`
- "conta_2" ou "conta2" → Vai para `471-059-5347`

**Exemplos:**
- ✅ `campanha_conta_1_janeiro` → Conta 1
- ✅ `teste_conta_2` → Conta 2
- ✅ `conta1_pesquisa` → Conta 1
- ✅ `conta2_display` → Conta 2

---

## 🆘 Se Não Funcionar

1. Verifique se `utm_campaign` está aparecendo no dataLayer (use Preview Mode)
2. Verifique se o nome da campanha contém "conta_1" ou "conta_2"
3. Verifique se a Lookup Table está configurada corretamente

---

**É isso! Muito mais simples, não é? 😊**

