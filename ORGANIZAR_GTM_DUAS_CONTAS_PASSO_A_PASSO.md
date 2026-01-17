# Organizar GTM para Duas Contas - Passo a Passo Prático

## Situação Atual

Você já tem configurado no GTM-5M37FK67:
- **Variáveis existentes:**
  - DLV - funnel_stage
  - DLV - funnel_step
  - DLV - sid
  - DLV - source

- **Variáveis incorporadas ativas:**
  - Event
  - Page Hostname
  - Page Path
  - Page URL
  - Referrer

## Objetivo

Organizar o GTM para que duas contas Google Ads recebam conversões corretamente:
- **Conta 1:** `591-659-0517`
- **Conta 2:** `471-059-5347`

---

## 📊 PASSO 1: Criar Variável utm_campaign

### 1.1 Criar Nova Variável

1. Na seção **"Variáveis definidas pelo usuário"**, clique em **"Nova"**
2. Configure:
   - **Nome da Variável:** `DLV - utm_campaign`
   - **Tipo:** Variável da camada de dados (Data Layer Variable)
   - **Nome da Variável do Data Layer:** `utm_campaign`
   - **Formato do Valor:** Texto
   - **Valor Padrão:** (deixar em branco)
3. Clique em **"Salvar"**

**✅ Agora você terá:** `DLV - utm_campaign` junto com as outras variáveis DLV

---

## 📊 PASSO 2: Criar Variável google_ads_account (Lookup Table)

Esta variável vai mapear `utm_campaign` para o Customer ID correto.

### 2.1 Criar Lookup Table

1. Na seção **"Variáveis definidas pelo usuário"**, clique em **"Nova"**
2. Configure:
   - **Nome da Variável:** `google_ads_account`
   - **Tipo:** Tabela de consulta (Lookup Table)
   - **Variável de entrada:** Selecione `{{DLV - utm_campaign}}`
   - **Tabela de consulta:** Clique em **"Adicionar linha"** para cada campanha

### 2.2 Preencher Tabela de Mapeamento

**⚠️ IMPORTANTE:** Você precisa listar TODAS as campanhas de cada conta aqui.

**Exemplo de configuração:**

| Entrada (utm_campaign) | Saída (Customer ID) |
|------------------------|---------------------|
| campanha_conta_1 | 591-659-0517 |
| campanha_conta_1_variante_a | 591-659-0517 |
| campanha_conta_1_variante_b | 591-659-0517 |
| campanha_conta_2 | 471-059-5347 |
| campanha_conta_2_variante_a | 471-059-5347 |
| campanha_conta_2_variante_b | 471-059-5347 |

**Como preencher:**
1. Clique em **"Adicionar linha"**
2. **Entrada:** Digite o nome exato da campanha (ex: `campanha_conta_1`)
3. **Saída:** Digite o Customer ID correspondente (ex: `591-659-0517`)
4. Repita para todas as campanhas

**Valor Padrão:** (deixar em branco - se não encontrar match, não dispara tag)

3. Clique em **"Salvar"**

**✅ Agora você terá:** `google_ads_account` que retorna o Customer ID baseado na campanha

---

## 🎯 PASSO 3: Verificar Triggers Existentes

### 3.1 Verificar Triggers Atuais

1. No menu lateral, clique em **"Acionadores"** (Triggers)
2. Anote quais triggers você já tem para os eventos:
   - `links_option_selected`
   - `links_access_clicked`
   - `payment_completed`

### 3.2 Estratégia de Organização

Você tem duas opções:

**Opção A: Duplicar Triggers (Recomendado)**
- Criar triggers separados para cada conta
- Exemplo: `payment_completed - Conta 1` e `payment_completed - Conta 2`
- Cada trigger tem condição baseada em `utm_campaign`

**Opção B: Usar Lookup Table nas Tags**
- Manter triggers existentes
- Usar variável `{{google_ads_account}}` nas tags para determinar Customer ID
- Mais simples, mas menos controle

**Vou guiá-lo pela Opção A (mais controle):**

---

## 🎯 PASSO 4: Criar Triggers Condicionais

### 4.1 Para Cada Trigger Existente, Criar Versão para Conta 1 e Conta 2

**Exemplo: payment_completed**

#### Trigger: payment_completed - Conta 1

1. Clique em **"Novo"**
2. Configure:
   - **Nome:** `payment_completed - Conta 1`
   - **Tipo:** Evento personalizado
   - **Nome do Evento:** `payment_completed`
   - **Este acionador dispara em:** Alguns eventos personalizados
   - **Condições:**
     - Adicionar condição: `{{DLV - utm_campaign}}` corresponde a regex `.*conta_1.*`
     - **OU** adicione múltiplas condições com OR para cada campanha da Conta 1:
       - `{{DLV - utm_campaign}}` igual a `campanha_conta_1`
       - `{{DLV - utm_campaign}}` igual a `campanha_conta_1_variante_a`
       - etc.
3. Clique em **"Salvar"**

#### Trigger: payment_completed - Conta 2

1. Clique em **"Novo"**
2. Configure:
   - **Nome:** `payment_completed - Conta 2`
   - **Tipo:** Evento personalizado
   - **Nome do Evento:** `payment_completed`
   - **Este acionador dispara em:** Alguns eventos personalizados
   - **Condições:**
     - `{{DLV - utm_campaign}}` corresponde a regex `.*conta_2.*`
     - **OU** adicione condições OR para cada campanha da Conta 2
3. Clique em **"Salvar"**

**Repita para:**
- `links_option_selected - Conta 1` e `links_option_selected - Conta 2`
- `links_access_clicked - Conta 1` e `links_access_clicked - Conta 2`

**✅ Ao final, você terá 6 triggers (3 eventos × 2 contas)**

---

## 🏷️ PASSO 5: Verificar e Organizar Tags Existentes

### 5.1 Verificar Tags Atuais

1. No menu lateral, clique em **"Tags"**
2. Anote quais tags você já tem:
   - Tags para `payment_completed`
   - Tags para `links_option_selected`
   - Tags para `links_access_clicked`

### 5.2 Estratégia de Organização

**Se você já tem tags configuradas:**

**Opção 1: Duplicar Tags (Recomendado)**
- Criar tags separadas para cada conta
- Cada tag usa seu próprio trigger e Customer ID

**Opção 2: Modificar Tags Existentes**
- Usar variável `{{google_ads_account}}` no campo "ID da Conta"
- Manter triggers existentes (mas adicionar condições de `utm_campaign`)

**Vou guiá-lo pela Opção 1 (mais claro e fácil de debugar):**

---

## 🏷️ PASSO 6: Criar Tags Duplicadas

### 6.1 Tag: payment_completed - Conta 1

1. Clique em **"Nova"**
2. Configure:
   - **Nome:** `payment_completed - Conta 1`
   - **Tipo:** Google Ads: Conversão de evento
   - **ID da Conta:** `591-659-0517`
   - **ID de Conversão:** (Cole o ID da conversão da Conta 1)
   - **Valor de Conversão:** 
     - Selecione: **"Usar valor de variável do Data Layer"**
     - Variável: `{{DLV - value}}` (se existir) ou configure valores fixos
   - **Moeda:** BRL
   - **Acionador:** Selecione `payment_completed - Conta 1`
3. Clique em **"Salvar"**

### 6.2 Tag: payment_completed - Conta 2

1. Clique em **"Nova"**
2. Configure:
   - **Nome:** `payment_completed - Conta 2`
   - **Tipo:** Google Ads: Conversão de evento
   - **ID da Conta:** `471-059-5347`
   - **ID de Conversão:** (Cole o ID da conversão da Conta 2)
   - **Valor de Conversão:** Usar valor de variável do Data Layer
   - **Moeda:** BRL
   - **Acionador:** Selecione `payment_completed - Conta 2`
3. Clique em **"Salvar"**

**Repita para outros eventos se necessário:**
- `links_option_selected - Conta 1` e `links_option_selected - Conta 2`
- `links_access_clicked - Conta 1` e `links_access_clicked - Conta 2`

---

## 🔗 PASSO 7: Verificar Conversion Linker

### 7.1 Verificar se Existe

1. Na lista de Tags, procure por **"Google Ads: Vinculador de conversões"** ou **"Conversion Linker"**

### 7.2 Se Não Existir, Criar

1. Clique em **"Nova"**
2. Configure:
   - **Nome:** `Google Ads - Conversion Linker`
   - **Tipo:** Google Ads: Vinculador de conversões
   - **ID da Conta:** (Deixe em branco ou use uma das contas - funciona para ambas)
   - **Acionador:** Todas as páginas
3. Clique em **"Salvar"**

---

## 📋 PASSO 8: Organizar em Pastas (Opcional mas Recomendado)

Para facilitar a organização, você pode criar pastas:

### 8.1 Criar Pastas

1. No menu lateral, clique em **"Pastas"**
2. Clique em **"Nova"**
3. Crie as seguintes pastas:
   - `Conta 1 - 591-659-0517`
   - `Conta 2 - 471-059-5347`

### 8.2 Mover Tags e Triggers para Pastas

1. Vá em **"Tags"**
2. Para cada tag da Conta 1, clique nos três pontos → **"Mover"** → Selecione `Conta 1 - 591-659-0517`
3. Repita para tags da Conta 2 → `Conta 2 - 471-059-5347`
4. Faça o mesmo para os Triggers

---

## ✅ PASSO 9: Checklist de Organização

### Variáveis:
- [ ] `DLV - utm_campaign` criada
- [ ] `google_ads_account` criada (Lookup Table)
- [ ] Tabela de lookup preenchida com TODAS as campanhas

### Triggers:
- [ ] `payment_completed - Conta 1` criado
- [ ] `payment_completed - Conta 2` criado
- [ ] `links_option_selected - Conta 1` criado (se necessário)
- [ ] `links_option_selected - Conta 2` criado (se necessário)
- [ ] `links_access_clicked - Conta 1` criado (se necessário)
- [ ] `links_access_clicked - Conta 2` criado (se necessário)

### Tags:
- [ ] `payment_completed - Conta 1` criada e configurada
- [ ] `payment_completed - Conta 2` criada e configurada
- [ ] Outras tags criadas conforme necessário
- [ ] Conversion Linker verificado/criado

### Conversões no Google Ads:
- [ ] Conversão criada na Conta 1 (591-659-0517)
- [ ] Conversão criada na Conta 2 (471-059-5347)
- [ ] IDs de conversão anotados e configurados nas tags

### Organização:
- [ ] Pastas criadas (opcional)
- [ ] Tags e triggers organizados em pastas (opcional)

---

## 🧪 PASSO 10: Testar

### 10.1 Usar GTM Preview Mode

1. Clique em **"Visualizar"** no topo
2. Digite: `https://solicite.link?utm_campaign=campanha_conta_1`
3. Clique em **"Conectar"**
4. Navegue pelo site e complete o fluxo
5. Verifique se:
   - `utm_campaign` aparece no dataLayer
   - O trigger correto dispara (`payment_completed - Conta 1`)
   - A tag correta dispara (`payment_completed - Conta 1`)
   - O Customer ID correto é usado (`591-659-0517`)

### 10.2 Testar com Conta 2

1. Repita com: `https://solicite.link?utm_campaign=campanha_conta_2`
2. Verifique se a tag da Conta 2 dispara

---

## 🆘 Troubleshooting

### Problema: Tags não disparam

**Solução:**
1. Verifique se `{{DLV - utm_campaign}}` está sendo preenchido (use Preview Mode)
2. Verifique se a campanha está na Lookup Table
3. Verifique se as condições do trigger estão corretas
4. Verifique se o nome do evento está correto

### Problema: Tag dispara para conta errada

**Solução:**
1. Verifique a Lookup Table - pode ter erro de digitação
2. Verifique as condições dos triggers
3. Use Preview Mode para ver qual trigger está disparando

### Problema: utm_campaign não aparece no dataLayer

**Solução:**
1. Verifique se o usuário chegou com `utm_campaign` na URL
2. Verifique o Console do navegador para erros
3. Teste o fluxo completo desde o início

---

## 📝 Notas Importantes

1. **Nomenclatura Consistente:** Use sempre o mesmo padrão de nomes:
   - Variáveis: `DLV - nome`
   - Triggers: `evento - Conta X`
   - Tags: `evento - Conta X`

2. **Lookup Table:** Mantenha atualizada! Sempre que criar uma nova campanha, adicione na tabela.

3. **Testes:** Sempre teste com campanhas reais antes de considerar concluído.

4. **Backup:** Antes de fazer mudanças grandes, use "Criar versão" para ter um backup.

---

**✅ Pronto! Após seguir estes passos, seu GTM estará organizado para duas contas Google Ads.**

