# Configuração GTM Portal Acesso - Passo a Passo Detalhado

## Objetivo
Configurar todas as tags, triggers e variáveis no Google Tag Manager (GTM-W7PVKNQS) para rastrear eventos do Portal Acesso e otimizar campanhas no Google Ads.

**GTM ID:** GTM-W7PVKNQS  
**Domínio Portal Acesso:** portalcacesso.online  
**Domínio Portal Certidão:** portalcertidao.org (eventos silenciosos)

---

## 📋 Eventos Implementados (12 eventos)

### Portal Acesso (Visível - 4 eventos)
1. `portalcacesso_page_view` - Home page carregada
2. `portalcacesso_option_selected` - Serviço selecionado no dropdown
3. `portalcacesso_access_clicked` - Botão "Acessar" clicado
4. `portalcacesso_how_it_works_clicked` - Cards "Como funciona" clicados

### Portal Certidão (Silencioso - 8 eventos)
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

### 1.1 Login
1. Acesse: https://tagmanager.google.com
2. Faça login com sua conta Google
3. Selecione o container: **GTM-W7PVKNQS**

### 1.2 Navegação
- No menu lateral esquerdo, você verá:
  - **Tags** (Tags)
  - **Triggers** (Gatilhos)
  - **Variables** (Variáveis)
  - **Folders** (Pastas)

---

## 📊 PASSO 2: Criar Variáveis no GTM

### 2.1 Acessar Variáveis

1. No menu lateral, clique em **"Variables"** (Variáveis)
2. Na área principal, clique em **"New"** (Nova variável)
3. Você verá uma lista de variáveis pré-configuradas

### 2.2 Criar Variável: funnel_step

**Passo a passo:**

1. Clique em **"User-Defined Variables"** (Variáveis Definidas pelo Usuário)
2. Clique em **"New"** (Nova)
3. Configure:
   - **Nome da Variável:** `funnel_step`
   - **Tipo de Variável:** Clique em "Variável de Data Layer"
   - **Nome da variável do Data Layer:** Digite exatamente: `funnel_step`
   - **Versão do Data Layer:** Selecione "Versão 2"
   - **Valor padrão:** Deixe em branco
4. Clique em **"Save"** (Salvar)

**Repetir este processo para todas as variáveis abaixo:**

### 2.3 Criar Variável: source

- **Nome:** `source`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `source`
- **Versão:** Versão 2

### 2.4 Criar Variável: certificateType

- **Nome:** `certificateType`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `certificateType`
- **Versão:** Versão 2

### 2.5 Criar Variável: planId

- **Nome:** `planId`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `planId`
- **Versão:** Versão 2

### 2.6 Criar Variável: ticketCodigo

- **Nome:** `ticketCodigo`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `ticketCodigo`
- **Versão:** Versão 2

### 2.7 Criar Variável: value

- **Nome:** `value`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `value`
- **Versão:** Versão 2

### 2.8 Criar Variável: price

- **Nome:** `price`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `price`
- **Versão:** Versão 2

### 2.9 Criar Variável: serviceId

- **Nome:** `serviceId`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `serviceId`
- **Versão:** Versão 2

### 2.10 Criar Variável: serviceName

- **Nome:** `serviceName`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `serviceName`
- **Versão:** Versão 2

### 2.11 Criar Variável: progress

- **Nome:** `progress`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `progress`
- **Versão:** Versão 2

### 2.12 Criar Variável: planName

- **Nome:** `planName`
- **Tipo:** Variável de Data Layer
- **Nome da variável do Data Layer:** `planName`
- **Versão:** Versão 2

**✅ Ao final, você deve ter 12 variáveis criadas**

---

## 🎯 PASSO 3: Criar Triggers no GTM

### 3.1 Acessar Triggers

1. No menu lateral, clique em **"Triggers"** (Gatilhos)
2. Clique em **"New"** (Novo)

### 3.2 Criar Trigger: portalcacesso_page_view

**Passo a passo detalhado:**

1. **Nome do Trigger:** Digite: `portalcacesso_page_view`
2. **Tipo de Trigger:** Clique em "Evento Personalizado"
3. **Configuração:**
   - **Nome do Evento:** Digite exatamente: `portalcacesso_page_view`
   - **Este trigger dispara em:** Selecione "Todos os eventos personalizados"
4. **Condições (opcional):** Pode adicionar condição se quiser filtrar por `source = portalcacesso`
   - Clique em "Adicionar condição"
   - Variável: `{{source}}`
   - Operador: `equals`
   - Valor: `portalcacesso`
5. Clique em **"Save"** (Salvar)

**Repetir este processo para todos os triggers abaixo:**

### 3.3 Criar Trigger: portalcacesso_option_selected

- **Nome:** `portalcacesso_option_selected`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_option_selected`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.4 Criar Trigger: portalcacesso_access_clicked

- **Nome:** `portalcacesso_access_clicked`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_access_clicked`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.5 Criar Trigger: portalcacesso_how_it_works_clicked

- **Nome:** `portalcacesso_how_it_works_clicked`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_how_it_works_clicked`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.6 Criar Trigger: portalcacesso_form_started

- **Nome:** `portalcacesso_form_started`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_form_started`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.7 Criar Trigger: portalcacesso_form_progress_25

- **Nome:** `portalcacesso_form_progress_25`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_form_progress_25`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.8 Criar Trigger: portalcacesso_form_progress_50

- **Nome:** `portalcacesso_form_progress_50`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_form_progress_50`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.9 Criar Trigger: portalcacesso_form_progress_75

- **Nome:** `portalcacesso_form_progress_75`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_form_progress_75`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.10 Criar Trigger: portalcacesso_form_submitted

- **Nome:** `portalcacesso_form_submitted`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_form_submitted`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.11 Criar Trigger: portalcacesso_checkout_viewed

- **Nome:** `portalcacesso_checkout_viewed`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_checkout_viewed`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.12 Criar Trigger: portalcacesso_payment_initiated

- **Nome:** `portalcacesso_payment_initiated`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_payment_initiated`
- **Este trigger dispara em:** Todos os eventos personalizados

### 3.13 Criar Trigger: portalcacesso_payment_completed ⭐

- **Nome:** `portalcacesso_payment_completed`
- **Tipo:** Evento Personalizado
- **Nome do Evento:** `portalcacesso_payment_completed`
- **Este trigger dispara em:** Todos os eventos personalizados
- **Condições (recomendado):** Adicionar condição `{{source}} equals portalcacesso`

**✅ Ao final, você deve ter 12 triggers criados**

---

## 🏷️ PASSO 4: Criar Tags no GTM

### 4.1 Acessar Tags

1. No menu lateral, clique em **"Tags"** (Tags)
2. Clique em **"New"** (Nova)

### 4.2 Configurar Conexão com Google Ads

**IMPORTANTE:** Antes de criar as tags, você precisa:

1. Ter uma conta do Google Ads ativa
2. Ter o ID da Conta do Google Ads (formato: XXX-XXX-XXXX)
3. Criar conversões no Google Ads (ver PASSO 5)

---

### 4.3 Tag: portalcacesso_page_view

**Passo a passo detalhado:**

1. **Nome da Tag:** Digite: `portalcacesso_page_view`

2. **Configuração da Tag:**
   - Clique em "Escolher tipo de tag"
   - Procure e selecione: **"Google Ads: Conversão de evento"**
   - Se não encontrar, procure por: **"Google Ads Event Conversion"**

3. **Configurações do Google Ads:**
   - **ID da Conta:** Digite seu ID da Conta do Google Ads (formato: XXX-XXX-XXXX)
   - **ID de Conversão:** 
     - Se já criou conversão no Google Ads: Cole o ID aqui 17797972696
     - Se ainda não criou: Deixe em branco por enquanto (criaremos no PASSO 5)
   - **Valor de Conversão:** 
     - Selecione: **"Não usar valor"**
   - **Moeda:** BRL (Real Brasileiro)

4. **Trigger:**
   - Clique em "Escolher um gatilho"
   - Selecione: `portalcacesso_page_view`

5. **Configurações Avançadas (Opcional):**
   - **Tag Firing Priority:** Deixe padrão (0)
   - **Tag Firing Options:** Deixe padrão

6. Clique em **"Save"** (Salvar)

**Observações:**
- Este é um evento de visualização de página
- Pode ser usado para remarketing
- Não é conversão principal

---

### 4.4 Tag: portalcacesso_option_selected

1. **Nome:** `portalcacesso_option_selected`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_option_selected`
7. **Salvar**

---

### 4.5 Tag: portalcacesso_access_clicked

1. **Nome:** `portalcacesso_access_clicked`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_access_clicked`
7. **Salvar**

**Observações:**
- Evento importante de interação
- Indica interesse do usuário

---

### 4.6 Tag: portalcacesso_how_it_works_clicked

1. **Nome:** `portalcacesso_how_it_works_clicked`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_how_it_works_clicked`
7. **Salvar**

---

### 4.7 Tag: portalcacesso_form_started

1. **Nome:** `portalcacesso_form_started`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_form_started`
7. **Salvar**

**Observações:**
- Evento importante para otimização
- Indica início do processo de conversão

---

### 4.8 Tag: portalcacesso_form_progress_25

1. **Nome:** `portalcacesso_form_progress_25`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_form_progress_25`
7. **Salvar**

---

### 4.9 Tag: portalcacesso_form_progress_50

1. **Nome:** `portalcacesso_form_progress_50`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_form_progress_50`
7. **Salvar**

---

### 4.10 Tag: portalcacesso_form_progress_75

1. **Nome:** `portalcacesso_form_progress_75`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_form_progress_75`
7. **Salvar**

---

### 4.11 Tag: portalcacesso_form_submitted

1. **Nome:** `portalcacesso_form_submitted`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_form_submitted`
7. **Salvar**

**Observações:**
- Evento importante para otimização
- Indica que usuário completou formulário

---

### 4.12 Tag: portalcacesso_checkout_viewed

1. **Nome:** `portalcacesso_checkout_viewed`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_checkout_viewed`
7. **Salvar**

**Observações:**
- Evento importante para otimização
- Indica que usuário chegou na página de pagamento

---

### 4.13 Tag: portalcacesso_payment_initiated

1. **Nome:** `portalcacesso_payment_initiated`
2. **Tipo:** Google Ads: Conversão de evento
3. **ID da Conta:** [Seu ID do Google Ads]
4. **ID de Conversão:** [Criar conversão secundária no Google Ads]
5. **Valor:** Não usar valor
6. **Trigger:** `portalcacesso_payment_initiated`
7. **Salvar**

**Observações:**
- Evento importante para otimização
- Indica que PIX foi gerado

---

### 4.14 Tag: portalcacesso_payment_completed ⭐ CONVERSÃO PRINCIPAL

**Passo a passo detalhado:**

1. **Nome da Tag:** Digite: `portalcacesso_payment_completed`

2. **Configuração da Tag:**
   - Tipo: **Google Ads: Conversão de evento**

3. **Configurações do Google Ads:**
   - **ID da Conta:** [Seu ID do Google Ads]
   - **ID de Conversão:** 
     - **IMPORTANTE:** Use o ID da conversão PRINCIPAL criada no Google Ads
     - Este será o ID da conversão mais importante
   - **Valor de Conversão:** 
     - Selecione: **"Usar valor de variável do Data Layer"**
     - Variável: Selecione `{{value}}`
     - **OU** configure valores fixos:
       - Se `value = "premium"` → Valor: 69.80
       - Se `value = "prioridade"` → Valor: 59.80
       - Se `value = "padrao"` → Valor: 39.90
   - **Moeda:** BRL (Real Brasileiro)

4. **Trigger:**
   - Selecione: `portalcacesso_payment_completed`

5. **Configurações Avançadas:**
   - **Tag Firing Priority:** 100 (maior prioridade)
   - **Tag Firing Options:** Deixe padrão

6. **Campos Adicionais (Opcional):**
   - Você pode adicionar campos personalizados:
     - `ticketCodigo`: `{{ticketCodigo}}`
     - `planId`: `{{planId}}`
     - `certificateType`: `{{certificateType}}`

7. Clique em **"Save"** (Salvar)

**Observações CRÍTICAS:**
- ⭐ **ESTA É A CONVERSÃO PRINCIPAL**
- Deve ser configurada como conversão primária no Google Ads
- Valor da conversão baseado em `value` (premium/prioridade/padrao)
- Configurar janela de atribuição: 30 dias
- Contar: Uma conversão por clique

---

## 📊 PASSO 5: Criar Conversões no Google Ads

### 5.1 Acessar Google Ads

1. Acesse: https://ads.google.com
2. Faça login com sua conta Google
3. Selecione sua conta do Google Ads

### 5.2 Criar Conversão Principal: portalcacesso_payment_completed

**Passo a passo detalhado:**

1. **Acessar Conversões:**
   - No menu superior, clique em **"Ferramentas e configurações"** (ícone de chave inglesa)
   - Em "Medição", clique em **"Conversões"**

2. **Criar Nova Conversão:**
   - Clique no botão **"+"** (mais) no canto superior esquerdo
   - Selecione: **"Site"** como fonte da conversão

3. **Configurações Básicas:**
   - **Nome:** Digite: `Portal Acesso - Pagamento Confirmado`
   - **Categoria:** Selecione **"Compra/Venda"**
   - **Valor:** 
     - Selecione: **"Usar valor diferente para cada conversão"**
     - Isso permite valores diferentes baseados no plano (premium/prioridade/padrao)
   - **Contar:** Selecione **"Uma conversão por clique"**
   - **Janela de clique:** Selecione **"30 dias"**
   - **Janela de visualização:** Selecione **"1 dia"**
   - **Categoria de conversão:** Selecione **"Primária"** ⭐
   - **Atribuição:** 
     - Selecione: **"Usar modelo de atribuição do Google Ads"**
     - OU escolha modelo específico (recomendado: "Dados do modelo de atribuição")

4. **Configurações Avançadas:**
   - **Incluir em "Conversões":** ✅ Marcar (SIM)
   - **Atribuir valor:** ✅ Marcar (SIM)
   - **Otimizar:** ✅ Marcar (SIM) - Para otimização de campanhas

5. **Salvar:**
   - Clique em **"Criar e continuar"**
   - **IMPORTANTE:** Copie o **ID de Conversão** gerado (formato: AW-XXXXXXXXX/XXXXXXX)
   - Este ID será usado nas Tags do GTM

6. **Instruções de Instalação:**
   - O Google Ads mostrará instruções de instalação
   - **IGNORE** essas instruções (já estamos usando GTM)
   - Apenas copie o ID de Conversão

### 5.3 Criar Conversões Secundárias (Opcional)

Para eventos de interação (não conversão principal), você pode criar conversões secundárias:

**Para cada evento de interação:**

1. Clique em **"+"** novamente
2. Selecione **"Site"**
3. Configure:
   - **Nome:** Exemplo: `Portal Acesso - Serviço Selecionado`
   - **Categoria:** Selecione **"Outro"**
   - **Valor:** Não usar valor
   - **Contar:** Uma conversão por clique
   - **Janela de clique:** 30 dias
   - **Categoria de conversão:** **Secundária** (não primária)
   - **Incluir em "Conversões":** ✅ Marcar
   - **Atribuir valor:** ❌ Desmarcar (não atribuir valor)
   - **Otimizar:** ❌ Desmarcar (não usar para otimização)

4. Copie o ID de Conversão gerado
5. Use este ID na Tag correspondente no GTM

**Conversões Secundárias Recomendadas:**
- Portal Acesso - Serviço Selecionado (para `portalcacesso_option_selected`)
- Portal Acesso - Acesso Clicado (para `portalcacesso_access_clicked`)
- Portal Acesso - Formulário Iniciado (para `portalcacesso_form_started`)
- Portal Acesso - Formulário Submetido (para `portalcacesso_form_submitted`)
- Portal Acesso - Checkout Visualizado (para `portalcacesso_checkout_viewed`)

**Observação:** Você não precisa criar conversão para TODOS os eventos. Crie apenas para os que quiser rastrear separadamente.

---

## 🔗 PASSO 6: Vincular Tags com IDs de Conversão

### 6.1 Atualizar Tags com IDs de Conversão

Após criar as conversões no Google Ads:

1. Volte ao GTM
2. Para cada Tag criada:
   - Clique na Tag
   - No campo **"ID de Conversão"**, cole o ID correspondente
   - Salve a Tag

### 6.2 Mapeamento de Tags e Conversões

| Tag no GTM | Conversão no Google Ads | Tipo |
|------------|------------------------|------|
| `portalcacesso_payment_completed` | Portal Acesso - Pagamento Confirmado | **Primária** ⭐ |
| `portalcacesso_option_selected` | Portal Acesso - Serviço Selecionado | Secundária |
| `portalcacesso_access_clicked` | Portal Acesso - Acesso Clicado | Secundária |
| `portalcacesso_form_started` | Portal Acesso - Formulário Iniciado | Secundária |
| `portalcacesso_form_submitted` | Portal Acesso - Formulário Submetido | Secundária |
| `portalcacesso_checkout_viewed` | Portal Acesso - Checkout Visualizado | Secundária |

**Observação:** Para eventos de progresso (25%, 50%, 75%) e outros, você pode criar conversões secundárias ou simplesmente não criar conversão (apenas rastrear via GTM).

---

## 📤 PASSO 7: Publicar Container no GTM

### 7.1 Revisar Alterações

1. No GTM, clique em **"Enviar"** (botão no canto superior direito)
2. Você verá um resumo de todas as alterações:
   - Tags criadas
   - Triggers criados
   - Variáveis criadas

### 7.2 Adicionar Nome e Descrição da Versão

1. **Nome da Versão:** Digite: `Configuração Portal Acesso - Eventos GTM`
2. **Descrição:** Digite: `Implementação completa de eventos GTM para Portal Acesso. 12 eventos configurados.`

### 7.3 Publicar

1. Clique em **"Publicar"**
2. Aguarde confirmação de publicação
3. ✅ Container publicado com sucesso!

---

## 🧪 PASSO 8: Testar Configuração

### 8.1 Usar GTM Preview Mode

**Passo a passo detalhado:**

1. **Ativar Preview Mode:**
   - No GTM, clique em **"Preview"** (botão no canto superior direito)
   - Uma nova aba/janela abrirá

2. **Conectar ao Site:**
   - Na janela do Preview, digite a URL: `https://portalcacesso.online`
   - Clique em **"Conectar"**

3. **Navegar pelo Site:**
   - O site abrirá em uma nova aba
   - No Preview Mode, você verá todos os eventos sendo disparados

4. **Testar Cada Evento:**

   **a) Testar portalcacesso_page_view:**
   - Ao carregar a página inicial, verifique no Preview Mode:
     - Tag `portalcacesso_page_view` deve disparar
     - Variáveis devem estar preenchidas

   **b) Testar portalcacesso_option_selected:**
   - Clique no dropdown de serviços
   - Selecione um serviço (ex: "Certidão Criminal Federal")
   - No Preview Mode, verifique:
     - Tag `portalcacesso_option_selected` deve disparar
     - Variáveis `serviceId` e `serviceName` devem estar preenchidas

   **c) Testar portalcacesso_access_clicked:**
   - Após selecionar serviço, clique no botão "Acessar"
   - No Preview Mode, verifique:
     - Tag `portalcacesso_access_clicked` deve disparar
     - Você será redirecionado para Portal Certidão

   **d) Testar Eventos no Portal Certidão:**
   - No Portal Certidão, preencha o formulário
   - No Preview Mode, verifique eventos sendo disparados:
     - `portalcacesso_form_started`
     - `portalcacesso_form_progress_25` (ao preencher ~25% dos campos)
     - `portalcacesso_form_progress_50` (ao preencher ~50% dos campos)
     - `portalcacesso_form_progress_75` (ao preencher ~75% dos campos)
     - `portalcacesso_form_submitted` (ao clicar em "Emitir Certidão")

   **e) Testar Eventos de Pagamento:**
   - Na página de pagamento, verifique:
     - `portalcacesso_checkout_viewed` (ao carregar página)
     - `portalcacesso_payment_initiated` (quando PIX é gerado)
     - `portalcacesso_payment_completed` (após confirmar pagamento)

5. **Verificar Variáveis:**
   - No Preview Mode, clique em cada evento
   - Verifique se todas as variáveis estão preenchidas corretamente:
     - `funnel_step`
     - `source` (deve ser "portalcacesso")
     - `certificateType`
     - `planId`
     - `ticketCodigo` (nos eventos de pagamento)
     - `value` (no evento payment_completed)

6. **Verificar Tags Disparadas:**
   - No Preview Mode, verifique se as Tags estão disparando
   - Se alguma Tag não disparar, verifique:
     - Se o Trigger está correto
     - Se as condições do Trigger estão corretas
     - Se o ID de Conversão está correto

### 8.2 Verificar no Console do Navegador

1. Abra o Console do Navegador (F12)
2. Procure por logs:
   - `[portalcacessoDataLayer] Evento disparado:` (eventos silenciosos)
   - `[dataLayer] Evento disparado:` (eventos do Portal Acesso)
3. Verifique se os eventos estão sendo disparados corretamente

### 8.3 Verificar dataLayer

1. No Console do Navegador, digite: `dataLayer`
2. Você verá um array com todos os eventos disparados
3. Verifique se os eventos têm a estrutura correta:
   ```javascript
   {
     event: "portalcacesso_page_view",
     funnel_stage: "portalcacesso",
     funnel_step: "home_view",
     source: "portalcacesso",
     timestamp: 1704585600000,
     ...
   }
   ```

---

## 📊 PASSO 9: Verificar Conversões no Google Ads

### 9.1 Aguardar Processamento

- ⏰ **IMPORTANTE:** Conversões podem levar 24-48 horas para aparecer no Google Ads
- Isso é normal e esperado

### 9.2 Verificar Conversões

1. Acesse Google Ads → **Conversões**
2. Clique na conversão **"Portal Acesso - Pagamento Confirmado"**
3. Verifique:
   - **Status:** Deve estar "Ativo"
   - **Última conversão:** Deve mostrar data/hora recente
   - **Total de conversões:** Deve aumentar conforme pagamentos são confirmados

### 9.3 Verificar Relatórios

1. Acesse Google Ads → **Relatórios** → **Conversões**
2. Você verá:
   - Número de conversões por dia
   - Valor das conversões
   - Taxa de conversão
   - Custo por conversão

### 9.4 Verificar no GTM

1. No GTM, vá em **Tags**
2. Clique em cada Tag
3. Verifique se está **"Publicada"** e **"Ativa"**

---

## 🔍 PASSO 10: Troubleshooting

### Problema: Eventos não estão disparando

**Soluções:**

1. **Verificar GTM instalado:**
   - Abra `https://portalcacesso.online`
   - Verifique se o código GTM está no `<head>` (deve estar)
   - Use extensão "Tag Assistant" do Chrome para verificar

2. **Verificar origem:**
   - No Console, digite: `localStorage.getItem('payment_origin')`
   - Deve retornar `"portalcacesso"` se veio do Portal Acesso
   - Se retornar `null` ou `"solicite"`, os eventos silenciosos não dispararão

3. **Verificar dataLayer:**
   - No Console, digite: `dataLayer`
   - Verifique se eventos estão sendo adicionados ao array
   - Se não houver eventos, verifique o código JavaScript

4. **Verificar Triggers:**
   - No GTM Preview Mode, verifique se Triggers estão disparando
   - Se Trigger não disparar, verifique:
     - Nome do evento está correto (case-sensitive)
     - Condições do Trigger estão corretas

### Problema: Tags não estão disparando

**Soluções:**

1. **Verificar Trigger vinculado:**
   - Abra a Tag no GTM
   - Verifique se o Trigger correto está selecionado
   - Verifique se o Trigger está publicado

2. **Verificar ID de Conversão:**
   - Verifique se o ID de Conversão está correto
   - Formato correto: `AW-XXXXXXXXX/XXXXXXX`

3. **Verificar condições:**
   - Se o Trigger tem condições, verifique se estão corretas
   - Teste removendo condições temporariamente para debug

### Problema: Conversões não aparecem no Google Ads

**Soluções:**

1. **Aguardar 24-48 horas:**
   - Conversões podem levar até 48 horas para aparecer
   - Isso é normal

2. **Verificar se Tag está publicada:**
   - No GTM, verifique se a Tag está publicada
   - Verifique se o Container está publicado

3. **Verificar ID de Conversão:**
   - Verifique se o ID está correto na Tag
   - Verifique se a conversão existe no Google Ads

4. **Verificar se eventos estão disparando:**
   - Use GTM Preview Mode para verificar
   - Verifique Console do navegador

### Problema: Eventos disparando para origem errada

**Soluções:**

1. **Verificar parâmetro na URL:**
   - URL deve conter `?source=portalcacesso`
   - Exemplo: `https://portalcertidao.org/certidao/federais?type=criminal&source=portalcacesso`

2. **Verificar localStorage:**
   - No Console: `localStorage.getItem('payment_origin')`
   - Deve retornar `"portalcacesso"`

3. **Verificar referrer:**
   - No Console: `document.referrer`
   - Deve conter `portalcacesso.online`

---

## ✅ Checklist Final de Configuração

### Variáveis GTM
- [ ] `funnel_step` criada
- [ ] `source` criada
- [ ] `certificateType` criada
- [ ] `planId` criada
- [ ] `ticketCodigo` criada
- [ ] `value` criada
- [ ] `price` criada
- [ ] `serviceId` criada
- [ ] `serviceName` criada
- [ ] `progress` criada
- [ ] `planName` criada

### Triggers GTM
- [ ] `portalcacesso_page_view` criado
- [ ] `portalcacesso_option_selected` criado
- [ ] `portalcacesso_access_clicked` criado
- [ ] `portalcacesso_how_it_works_clicked` criado
- [ ] `portalcacesso_form_started` criado
- [ ] `portalcacesso_form_progress_25` criado
- [ ] `portalcacesso_form_progress_50` criado
- [ ] `portalcacesso_form_progress_75` criado
- [ ] `portalcacesso_form_submitted` criado
- [ ] `portalcacesso_checkout_viewed` criado
- [ ] `portalcacesso_payment_initiated` criado
- [ ] `portalcacesso_payment_completed` criado

### Tags GTM
- [ ] `portalcacesso_page_view` criada e vinculada
- [ ] `portalcacesso_option_selected` criada e vinculada
- [ ] `portalcacesso_access_clicked` criada e vinculada
- [ ] `portalcacesso_how_it_works_clicked` criada e vinculada
- [ ] `portalcacesso_form_started` criada e vinculada
- [ ] `portalcacesso_form_progress_25` criada e vinculada
- [ ] `portalcacesso_form_progress_50` criada e vinculada
- [ ] `portalcacesso_form_progress_75` criada e vinculada
- [ ] `portalcacesso_form_submitted` criada e vinculada
- [ ] `portalcacesso_checkout_viewed` criada e vinculada
- [ ] `portalcacesso_payment_initiated` criada e vinculada
- [ ] `portalcacesso_payment_completed` criada e vinculada ⭐

### Conversões Google Ads
- [ ] Conversão principal criada: "Portal Acesso - Pagamento Confirmado"
- [ ] ID de Conversão copiado
- [ ] ID vinculado à Tag `portalcacesso_payment_completed`
- [ ] Conversões secundárias criadas (opcional)

### Testes
- [ ] GTM Preview Mode testado
- [ ] Todos os eventos verificados no Preview Mode
- [ ] Variáveis verificadas no Preview Mode
- [ ] Tags verificadas no Preview Mode
- [ ] Console do navegador verificado
- [ ] dataLayer verificado

### Publicação
- [ ] Container GTM publicado
- [ ] Versão nomeada e descrita
- [ ] Alterações revisadas antes de publicar

### Verificação Final
- [ ] Conversões aparecem no Google Ads (após 24-48h)
- [ ] Valores de conversão corretos
- [ ] Atribuições corretas
- [ ] Campanhas otimizadas usando conversões

---

## 📝 Estrutura de Dados dos Eventos

### Exemplo Completo: portalcacesso_payment_completed

```javascript
{
  event: "portalcacesso_payment_completed",
  funnel_stage: "portalcacesso",
  funnel_step: "payment_success",
  source: "portalcacesso",
  timestamp: 1704585600000,
  ticketCodigo: "TKT-2026-001234",
  plano: "premium",
  planId: "premium",
  planName: "Certidão Premium WhatsApp",
  tipoCertidao: "Certidão Negativa Criminal Federal",
  email: "cliente@email.com",
  value: "premium",
  price: 69.80,
  eventCategory: "Pagamento",
  eventAction: "Confirmado",
  eventLabel: "Certidão Negativa Criminal Federal"
}
```

### Exemplo: portalcacesso_option_selected

```javascript
{
  event: "portalcacesso_option_selected",
  funnel_stage: "portalcacesso",
  funnel_step: "service_selected",
  source: "portalcacesso",
  timestamp: 1704585600000,
  serviceId: "acesso-criminal-federal",
  serviceName: "Certidão Criminal Federal"
}
```

### Exemplo: portalcacesso_form_progress_50

```javascript
{
  event: "portalcacesso_form_progress_50",
  funnel_stage: "portalcacesso",
  funnel_step: "form_progress_50",
  source: "portalcacesso",
  timestamp: 1704585600000,
  progress: 50,
  certificateType: "Certidão Negativa Criminal Federal"
}
```

---

## 🎯 Configuração Avançada (Opcional)

### Configurar Valores Dinâmicos para Conversão Principal

Para a Tag `portalcacesso_payment_completed`, você pode configurar valores dinâmicos:

1. No GTM, abra a Tag `portalcacesso_payment_completed`
2. Em **"Valor de Conversão"**, selecione **"Usar valor de variável do Data Layer"**
3. Variável: `{{value}}`
4. **OU** configure valores fixos usando condições:
   - Se `{{value}} equals premium` → Valor: 69.80
   - Se `{{value}} equals prioridade` → Valor: 59.80
   - Se `{{value}} equals padrao` → Valor: 39.90

### Criar Pastas no GTM (Organização)

Para organizar melhor:

1. No GTM, vá em **"Folders"** (Pastas)
2. Crie pastas:
   - **"Portal Acesso - Eventos Visíveis"**
   - **"Portal Acesso - Eventos Silenciosos"**
   - **"Portal Acesso - Conversões"**
3. Mova Tags para pastas correspondentes

### Configurar Filtros de Debug

Para facilitar debug:

1. Crie uma Variável: `{{Debug Mode}}`
2. Configure para retornar `true` quando `?debug=true` estiver na URL
3. Use esta variável em condições de Tags para debug

---

## 📞 Suporte e Recursos

### Documentação Oficial
- Google Tag Manager: https://support.google.com/tagmanager
- Google Ads: https://support.google.com/google-ads

### Ferramentas Úteis
- **GTM Preview Mode:** Para testar tags em tempo real
- **Google Tag Assistant:** Extensão do Chrome para verificar tags
- **Google Analytics Debugger:** Para debug de eventos

### Verificação Rápida
- Console do navegador: `dataLayer` para ver eventos
- GTM Preview Mode: Para ver tags disparando
- Google Ads → Conversões: Para ver conversões registradas

---

## 🔄 Manutenção

### Verificações Regulares

1. **Semanalmente:**
   - Verificar se conversões estão sendo registradas
   - Verificar valores de conversão
   - Verificar se eventos estão disparando

2. **Mensalmente:**
   - Revisar relatórios de conversão no Google Ads
   - Otimizar campanhas baseado em dados
   - Verificar se novas funcionalidades precisam de eventos

3. **Quando Adicionar Novos Eventos:**
   - Criar Variável (se necessário)
   - Criar Trigger
   - Criar Tag
   - Criar Conversão no Google Ads (se necessário)
   - Testar no Preview Mode
   - Publicar Container

---

**Última atualização:** Janeiro 2026  
**GTM ID:** GTM-W7PVKNQS  
**Versão do Documento:** 1.0
