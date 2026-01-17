# Guia Completo: Aba Coração - Validação de Funil

## 📋 Visão Geral

A aba **Coração** é o sistema de análise e diagnóstico automático do funil de conversão. Ela identifica gargalos, calcula métricas de performance e sugere ações baseadas em dados reais coletados do seu funil.

---

## 🎯 O Que a Aba Coração Faz?

### Funcionalidades Principais:

1. **Diagnóstico Automático de Gargalos**
   - Identifica onde está o problema no funil
   - Sugere ações específicas para cada gargalo

2. **Cálculo de Métricas de Performance**
   - CPA (Custo por Aquisição)
   - ROI (Retorno sobre Investimento)
   - Taxas de conversão por etapa
   - Gasto sem conversão

3. **Semáforo de Status**
   - 🟢 VALIDADO: Funil funcionando bem
   - 🟡 OBSERVAÇÃO: Aguardando mais dados
   - 🔴 ALERTA: Problema detectado
   - 🔴 DESCARTE: Campanha não viável

4. **Análise por Campanha**
   - Métricas individuais por campanha do Google Ads
   - Comparação de performance
   - Ações sugeridas por campanha

---

## 📊 Como Funciona o Funil

### Etapas do Funil (em ordem):

1. **Links View** - Visualizações nas páginas de links
2. **CTA Click** - Cliques no botão "Solicitar Certidão"
3. **Portal View** - Visualizações no PortalCertidao.org
4. **Form Start** - Início do preenchimento do formulário
5. **Form Submit** - Envio bem-sucedido do formulário
6. **PIX View** - Visualização da página de pagamento
7. **PIX Initiated** - Início do processo de pagamento
8. **Payment Confirmed** - Pagamento confirmado ✅

### Como os Eventos São Coletados:

Os eventos são coletados automaticamente quando:
- Usuário visita páginas de links (SOLICITE LINK)
- Usuário clica em botões CTA
- Usuário acessa o Portal
- Usuário preenche formulário
- Usuário visualiza/inicia pagamento PIX
- Pagamento é confirmado via webhook Pagar.me

---

## 🔍 Entendendo os Indicadores

### 1. Status do Funil (Semáforo)

#### 🟢 VALIDADO
**Quando aparece:**
- Pelo menos 1 pagamento confirmado
- CPA ≤ R$ 39,90 (valor do ticket)
- ROI ≥ 1.2

**O que significa:**
- Funil está funcionando corretamente
- Campanha é viável economicamente
- Continue investindo nesta campanha

#### 🟡 OBSERVAÇÃO
**Quando aparece:**
- Gasto acumulado < R$ 39,90
- Ainda não há pagamentos confirmados
- OU dados insuficientes para diagnóstico

**O que significa:**
- Aguarde mais dados antes de tomar decisão
- Sistema está coletando informações
- Normal no início de uma campanha

#### 🔴 ALERTA
**Quando aparece:**
- Gasto acumulado ≥ R$ 39,90 (1× ticket)
- Nenhum pagamento confirmado ainda

**O que significa:**
- Há um problema no funil
- Investigar gargalo identificado
- Ajustar campanha antes de continuar gastando

#### 🔴 DESCARTE
**Quando aparece:**
- Gasto acumulado ≥ R$ 79,80 (2× ticket) sem pagamentos
- OU CPA > R$ 39,90
- OU ROI < 1.2

**O que significa:**
- Campanha não é viável economicamente
- Considere pausar ou ajustar drasticamente
- Não continue investindo sem correções

---

### 2. Gargalos Identificados

O sistema identifica automaticamente onde está o problema:

#### TRÁFEGO
**Sintoma:** Há gasto em campanhas, mas nenhuma visualização nas páginas de links

**Causa provável:**
- Anúncio não está atraindo cliques relevantes
- Palavras-chave muito genéricas
- Segmentação incorreta

**Ação sugerida:**
- Ajustar anúncio, palavra-chave ou segmentação
- Melhorar qualidade do anúncio
- Revisar público-alvo

#### LINKS
**Sintoma:** Muitas visualizações, mas poucos cliques no botão CTA (< 10%)

**Causa provável:**
- Headline não está atraindo
- CTA não está claro ou visível
- Página não está alinhada com o anúncio

**Ação sugerida:**
- Ajustar headline e CTA
- Melhorar alinhamento entre anúncio e página
- Testar diferentes textos de CTA

#### PORTAL
**Sintoma:** Muitas visualizações do Portal, mas poucos iniciam formulário (< 30%)

**Causa provável:**
- Falta de confiança
- Textos não estão claros
- Portal não transmite credibilidade

**Ação sugerida:**
- Ajustar textos e clareza
- Adicionar elementos de confiança (selos, depoimentos)
- Melhorar credibilidade do Portal

#### FORMULÁRIO
**Sintoma:** Muitos iniciam formulário, mas poucos completam (< 50%)

**Causa provável:**
- Formulário muito longo
- Campos muito complexos
- Erros de validação impedindo conclusão

**Ação sugerida:**
- Simplificar campos
- Reduzir fricção
- Corrigir validações se houver erros

#### PIX
**Sintoma:** Muitos visualizam/iniciam PIX, mas poucos pagam (< 30%)

**Causa provável:**
- Falta de confiança no pagamento
- Copy de segurança insuficiente
- Fricção no processo de pagamento

**Ação sugerida:**
- Ajustar copy de segurança
- Melhorar fechamento no PIX
- Simplificar processo de pagamento

---

### 3. Métricas Principais

#### Gasto sem Conversão
**O que é:** Valor gasto em campanhas sem gerar pagamentos confirmados

**Como interpretar:**
- Mostra quantos "tickets queimados" (gasto ÷ R$ 39,90)
- Se > 1× ticket sem pagamento = investigar
- Se > 2× ticket sem pagamento = considerar pausar

#### Pagamentos
**O que é:** Número de pagamentos confirmados no período

**Como interpretar:**
- Meta: pelo menos 1 pagamento para validar funil
- Quanto mais, melhor
- Comparar com gasto para calcular ROI

#### CPA (Custo por Aquisição)
**O que é:** Quanto custa cada pagamento confirmado (Gasto ÷ Pagamentos)

**Como interpretar:**
- Ideal: ≤ R$ 39,90 (valor do ticket)
- Se > R$ 39,90 = campanha não é viável
- Quanto menor, melhor

#### ROI (Retorno sobre Investimento)
**O que é:** Quanto você ganha para cada R$ 1 investido

**Como calcular:** (Pagamentos × R$ 39,90) ÷ Gasto

**Como interpretar:**
- Mínimo aceitável: 1.2 (ganha 20% a mais do que investiu)
- Ideal: > 2.0 (dobra o investimento)
- Se < 1.2 = campanha não é viável

---

## 📈 Como Usar a Aba Coração

### Passo 1: Selecionar Período

1. No topo da página, você verá dois campos de data:
   - **De:** Data inicial
   - **Até:** Data final

2. **Padrão:** Últimos 30 dias

3. **Dica:** Para campanhas novas, use períodos menores (7 dias) para análise mais rápida

### Passo 2: Atualizar Dados

1. Clique no botão **"Atualizar"** após selecionar o período
2. Aguarde o carregamento (ícone de loading)
3. Os dados serão atualizados automaticamente

### Passo 3: Interpretar os Resultados

#### Verificar Status do Semáforo:
- 🟢 VALIDADO = Continue investindo
- 🟡 OBSERVAÇÃO = Aguarde mais dados
- 🔴 ALERTA = Investigar e ajustar
- 🔴 DESCARTE = Pausar ou ajustar drasticamente

#### Identificar Gargalo:
- Veja o card "Gargalo Dominante"
- Leia o diagnóstico
- Siga a ação sugerida

#### Analisar Métricas:
- Compare CPA com valor do ticket (R$ 39,90)
- Verifique se ROI está acima de 1.2
- Monitore "Gasto sem Conversão"

### Passo 4: Analisar por Campanha

1. Role até a seção **"Tabela por Campanha"**
2. Veja métricas individuais de cada campanha
3. Compare performance entre campanhas
4. Identifique quais campanhas estão funcionando
5. Pause ou ajuste campanhas com status 🔴 DESCARTE

---

## 🔄 Sincronização com Google Ads

### Como Sincronizar Custos:

1. Na aba Coração, você verá um botão **"Sincronizar Google Ads"** (se for admin)
2. Clique no botão
3. Aguarde alguns minutos (pode levar tempo dependendo do volume)
4. Os custos serão atualizados automaticamente
5. Métricas (CPA, ROI) serão recalculadas

### Quando Sincronizar:

- **Primeira vez:** Após configurar credenciais do Google Ads
- **Diariamente:** Para ter dados atualizados
- **Após ajustes:** Quando fizer mudanças nas campanhas
- **Antes de análises:** Antes de tomar decisões importantes

### O Que É Sincronizado:

- Custos das campanhas
- Cliques
- Impressões
- Dados por data e campanha

---

## 📊 Gráfico do Funil

### O Que Mostra:

O gráfico de barras mostra a quantidade de eventos em cada etapa do funil.

### Como Interpretar:

1. **Barras devem diminuir gradualmente** (funil normal)
2. **Queda brusca** = indica gargalo naquela etapa
3. **Barras muito pequenas** = poucos dados (normal no início)
4. **Última barra (Payment)** = conversões reais

### Cores:

- Azul claro → Azul escuro = Etapas iniciais
- Verde = Pagamentos confirmados (objetivo final)

---

## 🎯 Tabela por Campanha

### Colunas da Tabela:

1. **Status** (emoji): 🟢 🟡 🔴
2. **Campanha:** Nome/ID da campanha
3. **Gasto:** Total gasto no período
4. **Pagamentos:** Número de pagamentos confirmados
5. **ROI:** Retorno sobre investimento
6. **CPA:** Custo por aquisição
7. **Gargalo:** Onde está o problema (se houver)
8. **Ação Sugerida:** O que fazer para melhorar

### Como Usar:

1. **Ordenar mentalmente** por ROI (maior para menor)
2. **Identificar campanhas** com 🔴 DESCARTE
3. **Focar ações** nas campanhas com maior potencial
4. **Pausar campanhas** que não estão funcionando

---

## ⚙️ Configurações Necessárias

### Para Funcionar Completamente:

1. **Coleta de Eventos (Obrigatório):**
   - Feature flag: `COLLECTOR_ENABLED=true` (ou não definido)
   - Banco de dados SQLite funcionando
   - Eventos sendo coletados automaticamente

2. **Google Ads Sync (Opcional mas Recomendado):**
   - Credenciais configuradas no `.env`
   - `ADS_SYNC_ENABLED=true`
   - Sincronização periódica

3. **Feature Flag:**
   - `VITE_FUNNEL_HEART_ENABLED` não deve ser `false`
   - Aba aparece apenas para usuários `admin`

---

## 🚨 Troubleshooting

### Problema: "Nenhum dado disponível"

**Causas possíveis:**
- Período selecionado não tem eventos
- Coletor de eventos desabilitado
- Banco de dados não inicializado

**Solução:**
1. Verificar se `COLLECTOR_ENABLED` não está como `false`
2. Verificar se há eventos no período selecionado
3. Tentar período maior (últimos 60 dias)
4. Verificar logs do servidor

### Problema: "CPA e ROI sempre N/A"

**Causas possíveis:**
- Google Ads não sincronizado
- Nenhum custo registrado
- Nenhum pagamento confirmado

**Solução:**
1. Sincronizar Google Ads
2. Verificar se há custos no período
3. Aguardar pagamentos confirmados

### Problema: "Gargalo sempre null"

**Causas possíveis:**
- Dados insuficientes
- Funil está fluindo bem
- Eventos não estão sendo coletados corretamente

**Solução:**
1. Verificar se eventos estão sendo coletados
2. Aguardar mais dados
3. Verificar instrumentação (GTM/tracking)

### Problema: "Status sempre OBSERVAÇÃO"

**Causas possíveis:**
- Período muito curto
- Poucos dados coletados
- Nenhum pagamento ainda

**Solução:**
1. Aguardar mais tempo
2. Verificar se eventos estão sendo coletados
3. Verificar se pagamentos estão sendo confirmados

---

## 💡 Dicas de Uso

### Para Campanhas Novas:

1. **Aguarde pelo menos 3-7 dias** antes de analisar
2. **Sincronize Google Ads** diariamente
3. **Monitore "Gasto sem Conversão"** - se passar de R$ 39,90 sem pagamento, investigue
4. **Use períodos menores** (7 dias) para análise mais rápida

### Para Campanhas Estabelecidas:

1. **Analise semanalmente** com períodos de 7-14 dias
2. **Compare campanhas** na tabela
3. **Foque nas campanhas** com melhor ROI
4. **Ajuste ou pause** campanhas com 🔴 DESCARTE

### Para Otimização:

1. **Identifique o gargalo** dominante
2. **Siga a ação sugerida** pelo sistema
3. **Aguarde 3-7 dias** após ajustes
4. **Compare resultados** antes e depois
5. **Repita o processo** até validar o funil

---

## 📋 Checklist de Uso Diário

- [ ] Acessar aba Coração
- [ ] Selecionar período (últimos 7-30 dias)
- [ ] Clicar em "Atualizar"
- [ ] Verificar status do semáforo
- [ ] Identificar gargalo (se houver)
- [ ] Verificar métricas (CPA, ROI)
- [ ] Analisar tabela por campanha
- [ ] Sincronizar Google Ads (se necessário)
- [ ] Tomar ações baseadas nos dados

---

## 🎓 Exemplos Práticos

### Exemplo 1: Campanha Nova (3 dias)

**Dados:**
- Gasto: R$ 25,00
- Pagamentos: 0
- Status: 🟡 OBSERVAÇÃO
- Gargalo: null

**Interpretação:**
- Normal para campanha nova
- Aguardar mais dados
- Continuar monitorando

**Ação:**
- Aguardar mais 4-7 dias
- Sincronizar Google Ads diariamente
- Não tomar decisões ainda

### Exemplo 2: Campanha com Problema (7 dias)

**Dados:**
- Gasto: R$ 120,00
- Pagamentos: 0
- Status: 🔴 DESCARTE
- Gargalo: TRÁFEGO

**Interpretação:**
- Gasto alto sem conversão (3× ticket)
- Problema no tráfego (anúncio não converte)
- Campanha não viável

**Ação:**
- Pausar campanha imediatamente
- Revisar anúncio e palavras-chave
- Ajustar segmentação
- Criar nova campanha com ajustes

### Exemplo 3: Campanha Funcionando (14 dias)

**Dados:**
- Gasto: R$ 200,00
- Pagamentos: 8
- CPA: R$ 25,00
- ROI: 1.6
- Status: 🟢 VALIDADO
- Gargalo: null

**Interpretação:**
- Funil validado!
- CPA abaixo do ticket (ótimo)
- ROI acima do mínimo (1.2)
- Campanha viável

**Ação:**
- Continuar investindo
- Aumentar orçamento se possível
- Replicar estratégia em outras campanhas

---

## 🔗 Integrações

### Google Ads:
- Sincronização de custos
- Análise por campanha
- Cálculo de CPA e ROI

### Pagar.me:
- Confirmação de pagamentos
- Evento `payment_confirmed` automático

### Banco de Dados:
- Armazenamento de eventos
- Cálculo de métricas
- Histórico completo

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do servidor: `npx pm2 logs sync-server`
2. Verificar se eventos estão sendo coletados
3. Verificar se Google Ads está sincronizado
4. Verificar feature flags no `.env`

---

## ✅ Resumo Rápido

**A aba Coração serve para:**
- ✅ Identificar onde está o problema no funil
- ✅ Calcular se campanha é viável (CPA, ROI)
- ✅ Sugerir ações específicas para melhorar
- ✅ Comparar performance entre campanhas
- ✅ Tomar decisões baseadas em dados reais

**Use quando:**
- Quer validar se uma campanha funciona
- Precisa identificar problemas no funil
- Quer otimizar conversões
- Precisa decidir onde investir

**Não use para:**
- Análise de campanhas muito novas (< 3 dias)
- Decisões sem dados suficientes
- Análise de períodos muito longos (> 90 dias)

---

**Última atualização:** 2026-01-12
**Versão:** 1.0

