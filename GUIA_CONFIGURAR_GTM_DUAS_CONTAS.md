# Guia Completo: Configurar GTM para Duas Contas Google Ads no solicite.link

## Objetivo

Configurar o GTM-5M37FK67 para que duas contas Google Ads marquem corretamente suas conversões no `solicite.link`, diferenciando qual conta deve receber cada conversão baseado na campanha (utm_campaign).

**Contas Google Ads:**
- Conta 1: `591-659-0517`
- Conta 2: `471-059-5347`

**GTM Container:** GTM-5M37FK67  
**Domínio:** solicite.link

---

## 📋 Eventos do solicite.link

Os seguintes eventos são disparados no `solicite.link`:
- `links_option_selected` - Opção selecionada no dropdown
- `links_access_clicked` - Botão "Acessar" clicado
- `payment_completed` - **⭐ CONVERSÃO PRINCIPAL** - Pagamento confirmado

Todos os eventos agora incluem `utm_campaign` no dataLayer quando disponível.

---

## 🔧 PASSO 1: Acessar Google Tag Manager

1. Acesse: https://tagmanager.google.com
2. Faça login com sua conta Google
3. Selecione o container: **GTM-5M37FK67**

---

## 📊 PASSO 2: Criar Variáveis no GTM

### 2.1 Criar Variável: utm_campaign

1. No menu lateral, clique em **"Variables"** (Variáveis)
2. Clique em **"New"** (Nova variável)
3. Clique em **"User-Defined Variables"**
4. Clique em **"New"**
5. Configure:
   - **Nome da Variável:** `utm_campaign`
   - **Tipo:** Data Layer Variable
   - **Nome da Variável do Data Layer:** `utm_campaign`
   - **Formato do Valor:** Texto
   - **Valor Padrão:** (deixar em branco)
6. Clique em **"Save"**

### 2.2 Criar Variável: google_ads_account (Lookup Table)

Esta variável mapeia `utm_campaign` para o Customer ID correto.

1. Clique em **"New"** novamente
2. Clique em **"User-Defined Variables"**
3. Clique em **"New"**
4. Configure:
   - **Nome da Variável:** `google_ads_account`
   - **Tipo:** Lookup Table
   - **Input Variable:** Selecione `{{utm_campaign}}`
   - **Tabela de Lookup:**
     - **Input:** Nome da campanha (ex: `campanha_conta_1`)
     - **Output:** Customer ID correspondente (ex: `591-659-0517`)
   
   **Exemplo de configuração:**
   
   | Input (utm_campaign) | Output (Customer ID) |
   |---------------------|---------------------|
   | campanha_conta_1 | 591-659-0517 |
   | campanha_conta_1_variante | 591-659-0517 |
   | campanha_conta_2 | 471-059-5347 |
   | campanha_conta_2_variante | 471-059-5347 |
   
   **⚠️ IMPORTANTE:** Você precisa preencher esta tabela com TODAS as campanhas de cada conta. Se uma campanha não estiver na tabela, a tag não disparará.
   
   **Valor Padrão:** (deixar em branco ou definir um padrão se necessário)
   
5. Clique em **"Save"**

---

## 🎯 PASSO 3: Criar Triggers Condicionais

### 3.1 Trigger: links_option_selected - Conta 1

1. No menu lateral, clique em **"Triggers"** (Gatilhos)
2. Clique em **"New"** (Novo)
3. Configure:
   - **Nome do Trigger:** `links_option_selected - Conta 1`
   - **Tipo de Trigger:** Custom Event
   - **Nome do Evento:** `links_option_selected`
   - **Este trigger dispara em:** Alguns eventos personalizados
   - **Condições:**
     - `{{utm_campaign}}` contém `campanha_conta_1` (ou use regex/match conforme suas campanhas)
     - **OU** configure múltiplas condições com OR para todas as campanhas da Conta 1
4. Clique em **"Save"**

### 3.2 Trigger: links_option_selected - Conta 2

1. Clique em **"New"** novamente
2. Configure:
   - **Nome do Trigger:** `links_option_selected - Conta 2`
   - **Tipo de Trigger:** Custom Event
   - **Nome do Evento:** `links_option_selected`
   - **Este trigger dispara em:** Alguns eventos personalizados
   - **Condições:**
     - `{{utm_campaign}}` contém `campanha_conta_2` (ou use regex/match conforme suas campanhas)
     - **OU** configure múltiplas condições com OR para todas as campanhas da Conta 2
3. Clique em **"Save"**

### 3.3 Trigger: links_access_clicked - Conta 1

1. **Nome:** `links_access_clicked - Conta 1`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `links_access_clicked`
4. **Condições:** `{{utm_campaign}}` corresponde às campanhas da Conta 1
5. Clique em **"Save"**

### 3.4 Trigger: links_access_clicked - Conta 2

1. **Nome:** `links_access_clicked - Conta 2`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `links_access_clicked`
4. **Condições:** `{{utm_campaign}}` corresponde às campanhas da Conta 2
5. Clique em **"Save"**

### 3.5 Trigger: payment_completed - Conta 1

1. **Nome:** `payment_completed - Conta 1`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `payment_completed`
4. **Condições:** `{{utm_campaign}}` corresponde às campanhas da Conta 1
5. Clique em **"Save"**

### 3.6 Trigger: payment_completed - Conta 2

1. **Nome:** `payment_completed - Conta 2`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `payment_completed`
4. **Condições:** `{{utm_campaign}}` corresponde às campanhas da Conta 2
5. Clique em **"Save"**

**✅ Ao final, você deve ter 6 triggers criados (3 eventos × 2 contas)**

---

## 🏷️ PASSO 4: Criar Conversões no Google Ads

### 4.1 Criar Conversões na Conta 1 (591-659-0517)

1. Acesse: https://ads.google.com
2. Selecione a conta: **591-659-0517**
3. Vá em **"Ferramentas e configurações"** → **"Conversões"**
4. Clique em **"+"** → **"Site"**
5. Configure:
   - **Nome:** `Solicite Link - Pagamento Confirmado (Conta 1)`
   - **Categoria:** Compra/Venda
   - **Valor:** Usar valores diferentes para cada conversão
   - **Contar:** Uma conversão por clique
   - **Janela de clique:** 30 dias
   - **Tipo:** Primária ⭐
6. Copie o **ID de Conversão** gerado

### 4.2 Criar Conversões na Conta 2 (471-059-5347)

1. Selecione a conta: **471-059-5347**
2. Repita os passos acima
3. **Nome:** `Solicite Link - Pagamento Confirmado (Conta 2)`
4. Copie o **ID de Conversão** gerado

**⚠️ IMPORTANTE:** Anote os IDs de conversão de cada conta. Você precisará deles para configurar as tags.

---

## 🎯 PASSO 5: Criar Tags no GTM

### 5.1 Tag: payment_completed - Conta 1

**⭐ Esta é a tag mais importante!**

1. No menu lateral, clique em **"Tags"** (Tags)
2. Clique em **"New"** (Nova)
3. Configure:
   - **Nome da Tag:** `payment_completed - Conta 1`
   - **Tipo:** Google Ads: Conversão de evento
   - **ID da Conta:** `591-659-0517`
   - **ID de Conversão:** (Cole o ID da conversão da Conta 1)
   - **Valor de Conversão:** 
     - Selecione: **"Usar valor de variável do Data Layer"**
     - Variável: `{{value}}`
     - **OU** configure valores fixos:
       - Se `value = "premium"` → Valor: 69.80
       - Se `value = "prioridade"` → Valor: 59.80
       - Se `value = "padrao"` → Valor: 39.90
   - **Moeda:** BRL (Real Brasileiro)
   - **Trigger:** Selecione `payment_completed - Conta 1`
4. Clique em **"Save"**

### 5.2 Tag: payment_completed - Conta 2

1. Clique em **"New"** novamente
2. Configure:
   - **Nome da Tag:** `payment_completed - Conta 2`
   - **Tipo:** Google Ads: Conversão de evento
   - **ID da Conta:** `471-059-5347`
   - **ID de Conversão:** (Cole o ID da conversão da Conta 2)
   - **Valor de Conversão:** Usar valor de variável do Data Layer (`{{value}}`)
   - **Moeda:** BRL
   - **Trigger:** Selecione `payment_completed - Conta 2`
3. Clique em **"Save"**

### 5.3 Tag: links_option_selected - Conta 1

1. **Nome:** `links_option_selected - Conta 1`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `591-659-0517`
4. **ID de Conversão:** (Se criou conversão secundária, cole o ID. Caso contrário, deixe em branco ou não crie esta tag)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `links_option_selected - Conta 1`
8. Clique em **"Save"**

### 5.4 Tag: links_option_selected - Conta 2

1. **Nome:** `links_option_selected - Conta 2`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `471-059-5347`
4. **ID de Conversão:** (Se criou conversão secundária, cole o ID)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `links_option_selected - Conta 2`
8. Clique em **"Save"**

### 5.5 Tag: links_access_clicked - Conta 1

1. **Nome:** `links_access_clicked - Conta 1`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `591-659-0517`
4. **ID de Conversão:** (Se criou conversão secundária, cole o ID)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `links_access_clicked - Conta 1`
8. Clique em **"Save"**

### 5.6 Tag: links_access_clicked - Conta 2

1. **Nome:** `links_access_clicked - Conta 2`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `471-059-5347`
4. **ID de Conversão:** (Se criou conversão secundária, cole o ID)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `links_access_clicked - Conta 2`
8. Clique em **"Save"**

**✅ Ao final, você deve ter pelo menos 2 tags criadas (payment_completed para cada conta), e até 6 tags se criar todas**

---

## 🔗 PASSO 6: Verificar Vinculador de Conversões

### 6.1 Verificar se Existe Tag "Conversion Linker"

1. No menu lateral, clique em **"Tags"**
2. Procure por uma tag chamada **"Google Ads: Vinculador de conversões"** ou **"Conversion Linker"**

### 6.2 Se Não Existir, Criar Vinculador de Conversões

**⚠️ IMPORTANTE:** O Conversion Linker precisa ser configurado para funcionar com AMBAS as contas. Você pode criar dois Conversion Linkers ou usar um único que funcione para ambas.

**Opção A: Um único Conversion Linker (Recomendado)**

1. Clique em **"New"**
2. **Nome da Tag:** `Google Ads - Conversion Linker`
3. **Tipo:** Google Ads: Vinculador de conversões
4. **ID da Conta:** Deixe em branco ou use uma das contas (o linker funciona para todas)
5. **Trigger:** Selecione **"All Pages"** (Todas as páginas)
6. Clique em **"Save"**

**Opção B: Dois Conversion Linkers (Alternativa)**

Crie um Conversion Linker para cada conta, cada um com trigger condicional baseado em `utm_campaign`.

---

## ✅ PASSO 7: Publicar Versão no GTM

### 7.1 Revisar Configuração

1. No canto superior direito, clique em **"Preview"** (Visualizar)
2. Digite a URL: `https://solicite.link?utm_campaign=campanha_conta_1`
3. Clique em **"Connect"**
4. Navegue pelo site e verifique se os eventos estão sendo disparados
5. Verifique se as tags corretas estão disparando baseado no `utm_campaign`
6. Feche o Preview

### 7.2 Publicar

1. No canto superior direito, clique em **"Submit"** (Enviar)
2. **Nome da Versão:** Digite: `Configuração duas contas Google Ads - [Data]`
3. **Descrição:** Digite: `Tags condicionais baseadas em utm_campaign para diferenciar contas 591-659-0517 e 471-059-5347`
4. Clique em **"Publish"** (Publicar)

---

## 🧪 PASSO 8: Testar Configuração

### 8.1 Testar com Campanha da Conta 1

1. Acesse: `https://solicite.link?utm_campaign=campanha_conta_1`
2. Abra o Console do Desenvolvedor (F12)
3. Vá para a aba **"Console"**
4. Digite: `dataLayer`
5. Verifique se `utm_campaign` está presente nos eventos
6. Complete o fluxo até o pagamento
7. Verifique no GTM Preview Mode se a tag da Conta 1 disparou

### 8.2 Testar com Campanha da Conta 2

1. Acesse: `https://solicite.link?utm_campaign=campanha_conta_2`
2. Repita os passos acima
3. Verifique se a tag da Conta 2 disparou

### 8.3 Verificar Conversões no Google Ads

1. Aguarde algumas horas após a publicação
2. Acesse o Google Ads
3. Selecione cada conta separadamente
4. Vá em **"Ferramentas e configurações"** → **"Conversões"**
5. Verifique se as conversões estão sendo registradas na conta correta

---

## 📋 Checklist Final

### Variáveis:
- [ ] Variável `{{utm_campaign}}` criada
- [ ] Variável `{{google_ads_account}}` criada (Lookup Table)
- [ ] Tabela de lookup preenchida com todas as campanhas

### Triggers (6 triggers):
- [ ] `links_option_selected - Conta 1`
- [ ] `links_option_selected - Conta 2`
- [ ] `links_access_clicked - Conta 1`
- [ ] `links_access_clicked - Conta 2`
- [ ] `payment_completed - Conta 1`
- [ ] `payment_completed - Conta 2`

### Conversões no Google Ads:
- [ ] Conversão principal criada na Conta 1 (591-659-0517)
- [ ] Conversão principal criada na Conta 2 (471-059-5347)
- [ ] IDs de conversão anotados

### Tags no GTM:
- [ ] Tag `payment_completed - Conta 1` criada e configurada
- [ ] Tag `payment_completed - Conta 2` criada e configurada
- [ ] Outras tags criadas (conforme necessário)
- [ ] Tag "Conversion Linker" verificada/criada

### Publicação:
- [ ] Versão publicada no GTM
- [ ] Testes realizados com campanhas de ambas as contas
- [ ] Conversões verificadas no Google Ads

---

## 🆘 Troubleshooting

### Problema: Tags não estão disparando

**Solução:**
1. Verifique se os triggers estão configurados corretamente
2. Use o GTM Preview Mode para debugar
3. Verifique se o nome do evento no trigger corresponde exatamente ao nome no dataLayer
4. Verifique se `utm_campaign` está presente no dataLayer (use Preview Mode)
5. Verifique se a condição do trigger está correta (regex/match)

### Problema: Conversões aparecem na conta errada

**Solução:**
1. Verifique se a Lookup Table está correta
2. Verifique se os triggers estão usando as condições corretas
3. Verifique se `utm_campaign` está sendo preservado durante o fluxo
4. Use o GTM Preview Mode para ver qual tag está disparando

### Problema: utm_campaign não está no dataLayer

**Solução:**
1. Verifique se o usuário chegou com `utm_campaign` na URL
2. Verifique se `utm_campaign` está sendo preservado no localStorage
3. Verifique o Console do navegador para erros
4. Teste o fluxo completo desde o início

### Problema: Conversões não aparecem no Google Ads

**Solução:**
1. Aguarde até 24 horas (pode levar tempo para aparecer)
2. Verifique se o ID de conversão está correto na tag
3. Verifique se o Customer ID está correto na tag
4. Verifique se a tag "Conversion Linker" está ativa
5. Teste usando o GTM Preview Mode

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Use o GTM Preview Mode para debugar
2. Verifique o Console do navegador para erros
3. Consulte a documentação do Google Tag Manager: https://support.google.com/tagmanager

---

## 📝 Notas Importantes

1. **Mapeamento de Campanhas:** Você precisa mapear TODAS as campanhas de cada conta na Lookup Table. Se uma campanha não estiver mapeada, a tag não disparará.

2. **Preservação de utm_campaign:** O código agora preserva `utm_campaign` durante todo o fluxo entre domínios (solicite.link → portalcertidao.org → solicite.link).

3. **Testes:** Sempre teste com campanhas reais de ambas as contas antes de considerar concluído.

4. **Conversões Secundárias:** Você pode criar conversões secundárias para `links_option_selected` e `links_access_clicked` se quiser rastreá-las separadamente, mas não é obrigatório.

---

**✅ Pronto! Após seguir todos os passos, cada conta Google Ads receberá suas conversões corretamente baseado na campanha (utm_campaign).**

