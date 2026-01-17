# Guia Completo: Configurar GTM para portalacesso.online

## Objetivo

Configurar todas as tags, triggers e conversões no Google Tag Manager (GTM-5M37FK67) para rastrear eventos do `portalcacesso.online` e enviar para o Google Ads.

**GTM Container:** GTM-5M37FK67  
**Domínio:** portalacesso.online  
**Eventos:** 12 eventos `portalcacesso_*`

---

## 📋 Lista de Eventos

### Eventos Visíveis (Portal Acesso)
1. `portalcacesso_page_view` - Home page carregada
2. `portalcacesso_option_selected` - Serviço selecionado no dropdown
3. `portalcacesso_access_clicked` - Botão "Acessar" clicado
4. `portalcacesso_how_it_works_clicked` - Cards "Como funciona" clicados

### Eventos Silenciosos (Portal Certidão)
5. `portalcacesso_form_started` - Formulário iniciado
6. `portalcacesso_form_progress_25` - 25% do formulário preenchido
7. `portalcacesso_form_progress_50` - 50% do formulário preenchido
8. `portalcacesso_form_progress_75` - 75% do formulário preenchido
9. `portalcacesso_form_submitted` - Formulário submetido
10. `portalcacesso_checkout_viewed` - Página de pagamento visualizada
11. `portalcacesso_payment_initiated` - PIX gerado
12. `portalcacesso_payment_completed` - **⭐ CONVERSÃO PRINCIPAL** - Pagamento confirmado

---

## 🔧 PASSO 1: Acessar Google Tag Manager

1. Acesse: https://tagmanager.google.com
2. Faça login com sua conta Google
3. Selecione o container: **GTM-5M37FK67**

---

## 📊 PASSO 2: Criar Variáveis (se necessário)

### 2.1 Verificar Variáveis Existentes

1. No menu lateral, clique em **"Variables"** (Variáveis)
2. Verifique se já existem estas variáveis:
   - `{{value}}` - Para capturar valor da conversão
   - `{{ticketCodigo}}` - Para código do ticket
   - `{{plano}}` - Para tipo de plano
   - `{{tipoCertidao}}` - Para tipo de certidão

### 2.2 Criar Variável `{{value}}` (se não existir)

**IMPORTANTE:** Esta variável é necessária para a conversão principal.

1. Clique em **"New"** (Nova variável)
2. Clique em **"User-Defined Variables"**
3. Clique em **"New"**
4. Configure:
   - **Nome da Variável:** `value`
   - **Tipo:** Data Layer Variable
   - **Nome da Variável do Data Layer:** `value`
   - **Formato do Valor:** Texto
5. Clique em **"Save"**

---

## 🎯 PASSO 3: Criar Triggers (Gatilhos)

### 3.1 Acessar Triggers

1. No menu lateral, clique em **"Triggers"** (Gatilhos)
2. Clique em **"New"** (Novo)

### 3.2 Criar Trigger: portalcacesso_page_view

1. **Nome do Trigger:** `portalcacesso_page_view`
2. **Tipo de Trigger:** Escolha **"Custom Event"** (Evento Personalizado)
3. **Nome do Evento:** `portalcacesso_page_view`
4. **Este trigger dispara em:** Todos os eventos personalizados
5. **Condições (Opcional):**
   - Adicionar condição: `source equals portalcacesso`
6. Clique em **"Save"**

### 3.3 Criar Trigger: portalcacesso_option_selected

1. **Nome:** `portalcacesso_option_selected`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_option_selected`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.4 Criar Trigger: portalcacesso_access_clicked

1. **Nome:** `portalcacesso_access_clicked`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_access_clicked`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.5 Criar Trigger: portalcacesso_how_it_works_clicked

1. **Nome:** `portalcacesso_how_it_works_clicked`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_how_it_works_clicked`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.6 Criar Trigger: portalcacesso_form_started

1. **Nome:** `portalcacesso_form_started`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_form_started`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.7 Criar Trigger: portalcacesso_form_progress_25

1. **Nome:** `portalcacesso_form_progress_25`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_form_progress_25`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.8 Criar Trigger: portalcacesso_form_progress_50

1. **Nome:** `portalcacesso_form_progress_50`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_form_progress_50`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.9 Criar Trigger: portalcacesso_form_progress_75

1. **Nome:** `portalcacesso_form_progress_75`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_form_progress_75`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.10 Criar Trigger: portalcacesso_form_submitted

1. **Nome:** `portalcacesso_form_submitted`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_form_submitted`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.11 Criar Trigger: portalcacesso_checkout_viewed

1. **Nome:** `portalcacesso_checkout_viewed`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_checkout_viewed`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.12 Criar Trigger: portalcacesso_payment_initiated

1. **Nome:** `portalcacesso_payment_initiated`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_payment_initiated`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

### 3.13 Criar Trigger: portalcacesso_payment_completed

1. **Nome:** `portalcacesso_payment_completed`
2. **Tipo:** Custom Event
3. **Nome do Evento:** `portalcacesso_payment_completed`
4. **Condições:** `source equals portalcacesso` (opcional)
5. Clique em **"Save"**

**✅ Ao final, você deve ter 12 triggers criados**

---

## 🏷️ PASSO 4: Criar Conversões no Google Ads

### 4.1 Acessar Google Ads

1. Acesse: https://ads.google.com
2. Faça login com sua conta Google
3. Selecione a conta do Google Ads para `portalcacesso.online` (Customer ID: 981-373-7127)

### 4.2 Criar Conversão Principal: portalcacesso_payment_completed

1. **Acessar Conversões:**
   - No menu superior, clique em **"Ferramentas e configurações"** (ícone de chave inglesa)
   - Em "Medição", clique em **"Conversões"**

2. **Criar Nova Conversão:**
   - Clique no botão **"+"** (mais) no canto superior esquerdo
   - Selecione: **"Site"** como fonte da conversão

3. **Configurações Básicas:**
   - **Nome:** `Portal Acesso - Pagamento Confirmado`
   - **Categoria:** Selecione **"Compra"** ou **"Venda"**
   - **Valor:** Selecione **"Usar valores diferentes para cada conversão"**
   - **Contar:** Selecione **"Uma conversão por clique"**
   - **Janela de clique:** 30 dias
   - **Janela de visualização:** 1 dia

4. **Categoria de Conversão:**
   - **Tipo:** **Primária** ⭐
   - **Incluir em "Conversões":** ✅ Marcar
   - **Atribuir valor:** ✅ Marcar
   - **Otimizar:** ✅ Marcar (usar para otimização de campanhas)

5. **Configurações de Atribuição:**
   - **Modelo de atribuição:** Último clique do Google Ads
   - **Valor padrão:** Deixar em branco (valor virá do dataLayer)

6. **Clique em "Criar e continuar"**

7. **Copiar o ID de Conversão:**
   - Anote o **ID de Conversão** gerado (formato: números, ex: 17797972696)
   - Você precisará deste ID para configurar a tag no GTM

### 4.3 Criar Conversões Secundárias (Opcional)

Para os outros eventos, você pode criar conversões secundárias se quiser rastreá-las separadamente:

**Exemplo para `portalcacesso_option_selected`:**

1. Clique em **"+"** novamente
2. Selecione **"Site"**
3. Configure:
   - **Nome:** `Portal Acesso - Serviço Selecionado`
   - **Categoria:** **"Outro"**
   - **Valor:** Não usar valor
   - **Contar:** Uma conversão por clique
   - **Janela de clique:** 30 dias
   - **Categoria de conversão:** **Secundária** (não primária)
   - **Incluir em "Conversões":** ✅ Marcar
   - **Atribuir valor:** ❌ Desmarcar
   - **Otimizar:** ❌ Desmarcar (não usar para otimização)

4. Copie o ID de Conversão gerado

**Repita para outros eventos conforme necessário:**
- Portal Acesso - Acesso Clicado
- Portal Acesso - Formulário Iniciado
- Portal Acesso - Formulário Submetido
- Portal Acesso - Checkout Visualizado

**⚠️ IMPORTANTE:** Você não precisa criar conversão para TODOS os eventos. Crie apenas para os que quiser rastrear separadamente. O mais importante é a conversão principal `portalcacesso_payment_completed`.

---

## 🎯 PASSO 5: Criar Tags no GTM

### 5.1 Acessar Tags

1. No menu lateral, clique em **"Tags"** (Tags)
2. Clique em **"New"** (Nova)

### 5.2 Tag: portalcacesso_payment_completed (CONVERSÃO PRINCIPAL)

**⭐ Esta é a tag mais importante!**

1. **Nome da Tag:** `portalcacesso_payment_completed`

2. **Configuração da Tag:**
   - Clique em "Escolher tipo de tag"
   - Procure e selecione: **"Google Ads: Conversão de evento"**
   - Se não encontrar, procure por: **"Google Ads Event Conversion"**

3. **Configurações do Google Ads:**
   - **ID da Conta:** Digite: `981-373-7127` (Customer ID do portalacesso.online)
   - **ID de Conversão:** Cole o ID da conversão principal criada no Passo 4.2
   - **Valor de Conversão:** 
     - Selecione: **"Usar valor de variável do Data Layer"**
     - Variável: Selecione `{{value}}`
     - **OU** configure valores fixos usando condições:
       - Se `value = "premium"` → Valor: 69.80
       - Se `value = "prioridade"` → Valor: 59.80
       - Se `value = "padrao"` → Valor: 39.90
   - **Moeda:** BRL (Real Brasileiro)

4. **Trigger:**
   - Clique em "Escolher um gatilho"
   - Selecione: `portalcacesso_payment_completed`

5. **Configurações Avançadas:**
   - **Tag Firing Priority:** 100 (maior prioridade)
   - **Tag Firing Options:** Deixe padrão

6. **Campos Adicionais (Opcional):**
   - Você pode adicionar campos personalizados:
     - `ticketCodigo`: `{{ticketCodigo}}`
     - `planId`: `{{plano}}`
     - `certificateType`: `{{tipoCertidao}}`

7. Clique em **"Save"**

### 5.3 Tag: portalcacesso_page_view

1. **Nome:** `portalcacesso_page_view`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (Se criou conversão secundária, cole o ID. Caso contrário, deixe em branco ou não crie esta tag)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_page_view`
8. Clique em **"Save"**

**⚠️ NOTA:** Se você não criou conversão secundária para este evento, você pode:
- **Opção A:** Não criar esta tag (evento não será enviado ao Google Ads)
- **Opção B:** Criar a tag sem ID de conversão (apenas para rastreamento no GTM)

### 5.4 Tag: portalcacesso_option_selected

1. **Nome:** `portalcacesso_option_selected`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_option_selected`
8. Clique em **"Save"**

### 5.5 Tag: portalcacesso_access_clicked

1. **Nome:** `portalcacesso_access_clicked`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_access_clicked`
8. Clique em **"Save"**

### 5.6 Tag: portalcacesso_how_it_works_clicked

1. **Nome:** `portalcacesso_how_it_works_clicked`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_how_it_works_clicked`
8. Clique em **"Save"**

### 5.7 Tag: portalcacesso_form_started

1. **Nome:** `portalcacesso_form_started`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_form_started`
8. Clique em **"Save"**

### 5.8 Tag: portalcacesso_form_progress_25

1. **Nome:** `portalcacesso_form_progress_25`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_form_progress_25`
8. Clique em **"Save"**

### 5.9 Tag: portalcacesso_form_progress_50

1. **Nome:** `portalcacesso_form_progress_50`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_form_progress_50`
8. Clique em **"Save"**

### 5.10 Tag: portalcacesso_form_progress_75

1. **Nome:** `portalcacesso_form_progress_75`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_form_progress_75`
8. Clique em **"Save"**

### 5.11 Tag: portalcacesso_form_submitted

1. **Nome:** `portalcacesso_form_submitted`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_form_submitted`
8. Clique em **"Save"**

### 5.12 Tag: portalcacesso_checkout_viewed

1. **Nome:** `portalcacesso_checkout_viewed`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_checkout_viewed`
8. Clique em **"Save"**

### 5.13 Tag: portalcacesso_payment_initiated

1. **Nome:** `portalcacesso_payment_initiated`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** `981-373-7127`
4. **ID de Conversão:** (ID da conversão secundária, se criou)
5. **Valor:** Não usar valor
6. **Moeda:** BRL
7. **Trigger:** `portalcacesso_payment_initiated`
8. Clique em **"Save"**

**✅ Ao final, você deve ter pelo menos 1 tag criada (a principal), e até 12 tags se criar todas**

---

## 🔗 PASSO 6: Verificar Vinculador de Conversões

### 6.1 Verificar se Existe Tag "Conversion Linker"

1. No menu lateral, clique em **"Tags"**
2. Procure por uma tag chamada **"Google Ads: Vinculador de conversões"** ou **"Conversion Linker"**

### 6.2 Se Não Existir, Criar Vinculador de Conversões

1. Clique em **"New"**
2. **Nome da Tag:** `Google Ads - Conversion Linker`
3. **Tipo:** Escolha **"Google Ads: Vinculador de conversões"**
4. **ID da Conta:** `981-373-7127`
5. **Trigger:** Selecione **"All Pages"** (Todas as páginas)
6. Clique em **"Save"**

**⚠️ IMPORTANTE:** Esta tag é essencial para o rastreamento de conversões funcionar corretamente!

---

## ✅ PASSO 7: Publicar Versão no GTM

### 7.1 Revisar Configuração

1. No canto superior direito, clique em **"Preview"** (Visualizar)
2. Digite a URL: `https://portalacesso.online`
3. Clique em **"Connect"**
4. Navegue pelo site e verifique se os eventos estão sendo disparados
5. Feche o Preview

### 7.2 Publicar

1. No canto superior direito, clique em **"Submit"** (Enviar)
2. **Nome da Versão:** Digite: `Configuração portalacesso.online - [Data]`
3. **Descrição:** Digite: `Adicionado triggers e tags para eventos portalcacesso_*`
4. Clique em **"Publish"** (Publicar)

---

## 🧪 PASSO 8: Testar Configuração

### 8.1 Testar no Site

1. Acesse: https://portalacesso.online
2. Abra o Console do Desenvolvedor (F12)
3. Vá para a aba **"Console"**
4. Digite: `dataLayer`
5. Pressione Enter
6. Você deve ver um array com eventos. Procure por eventos `portalcacesso_*`

### 8.2 Usar GTM Preview Mode

1. No GTM, clique em **"Preview"**
2. Digite: `https://portalacesso.online`
3. Clique em **"Connect"**
4. Navegue pelo site
5. No painel do Preview, você verá:
   - Tags que foram disparadas
   - Triggers que foram acionados
   - Variáveis do dataLayer

### 8.3 Verificar Conversões no Google Ads

1. Aguarde algumas horas após a publicação
2. Acesse o Google Ads
3. Vá em **"Ferramentas e configurações"** → **"Conversões"**
4. Verifique se as conversões estão sendo registradas

---

## 📋 Checklist Final

### Variáveis:
- [ ] Variável `{{value}}` criada (se necessário)

### Triggers (12 triggers):
- [ ] `portalcacesso_page_view`
- [ ] `portalcacesso_option_selected`
- [ ] `portalcacesso_access_clicked`
- [ ] `portalcacesso_how_it_works_clicked`
- [ ] `portalcacesso_form_started`
- [ ] `portalcacesso_form_progress_25`
- [ ] `portalcacesso_form_progress_50`
- [ ] `portalcacesso_form_progress_75`
- [ ] `portalcacesso_form_submitted`
- [ ] `portalcacesso_checkout_viewed`
- [ ] `portalcacesso_payment_initiated`
- [ ] `portalcacesso_payment_completed`

### Conversões no Google Ads:
- [ ] Conversão principal `portalcacesso_payment_completed` criada
- [ ] IDs de conversão anotados

### Tags no GTM:
- [ ] Tag `portalcacesso_payment_completed` criada e configurada
- [ ] Outras tags criadas (conforme necessário)
- [ ] Tag "Conversion Linker" verificada/criada

### Publicação:
- [ ] Versão publicada no GTM
- [ ] Testes realizados
- [ ] Conversões verificadas no Google Ads

---

## 🆘 Troubleshooting

### Problema: Tags não estão disparando

**Solução:**
1. Verifique se os triggers estão configurados corretamente
2. Use o GTM Preview Mode para debugar
3. Verifique se o nome do evento no trigger corresponde exatamente ao nome no dataLayer
4. Verifique se a condição `source equals portalcacesso` não está bloqueando eventos

### Problema: Conversões não aparecem no Google Ads

**Solução:**
1. Aguarde até 24 horas (pode levar tempo para aparecer)
2. Verifique se o ID de conversão está correto na tag
3. Verifique se o Customer ID (`981-373-7127`) está correto
4. Verifique se a tag "Conversion Linker" está ativa
5. Teste usando o GTM Preview Mode

### Problema: Valor da conversão está incorreto

**Solução:**
1. Verifique se a variável `{{value}}` está configurada corretamente
2. Verifique se o valor está sendo enviado no dataLayer
3. Use o GTM Preview Mode para ver o valor da variável `{{value}}`

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Use o GTM Preview Mode para debugar
2. Verifique o Console do navegador para erros
3. Consulte a documentação do Google Tag Manager: https://support.google.com/tagmanager

---

**✅ Pronto! Após seguir todos os passos, o portalacesso.online estará totalmente configurado para rastrear eventos e enviar conversões para o Google Ads.**

