# Verificação Detalhada das Tags do GTM

## 📊 Análise das Imagens Fornecidas

### ✅ Tags Visíveis (14 tags encontradas)

Todas as tags visíveis são do tipo:
- **Acompanhamento de conversões do Google Ads** (12 tags)
- **Tag do Google** (1 tag)
- **Vinculador de conversões** (1 tag)

**Observação**: Nenhuma tag do tipo "Custom HTML" ou "Custom JavaScript" está visível na lista, o que é **BOM**.

---

## 🔍 Verificação Necessária: Tags que Precisam ser Inspecionadas

### ⚠️ IMPORTANTE: Verificar Conteúdo de Cada Tag

Mesmo que as tags pareçam legítimas, **é necessário verificar o conteúdo de cada uma** para garantir que não há código suspeito.

---

## 📋 Passo a Passo para Verificar Cada Tag

### Passo 1: Verificar Tags de Conversão do Google Ads

Para cada uma das 12 tags de conversão (`portalcacesso_*`):

1. **Clique na tag** na lista
2. **Verifique os seguintes campos:**

#### Campo: "ID da conversão"
- ✅ Deve conter apenas números (ex: `1234567890`)
- ❌ **PROBLEMA** se contiver URLs ou domínios suspeitos
- ❌ **PROBLEMA** se contiver `userstat.net` ou similar

#### Campo: "Valor da conversão"
- ✅ Deve estar vazio ou conter valores numéricos
- ❌ **PROBLEMA** se contiver código JavaScript ou URLs

#### Campo: "Moeda"
- ✅ Deve ser "BRL" ou código de moeda válido
- ❌ **PROBLEMA** se contiver código suspeito

#### Campo: "Campos de conversão"
- ✅ Verifique cada campo adicional
- ❌ **PROBLEMA** se algum campo contiver código JavaScript ou URLs suspeitas

---

### Passo 2: Verificar "Tag do Google"

1. **Clique na tag "Tag do Google"**
2. **Verifique:**

#### Campo: "ID de acompanhamento"
- ✅ Deve ser algo como `G-XXXXXXXXXX` ou `UA-XXXXXXXXX-X`
- ❌ **PROBLEMA** se contiver `userstat` ou domínios suspeitos

#### Campo: "Campos a configurar"
- ✅ Verifique cada campo adicional
- ❌ **PROBLEMA** se algum campo contiver código suspeito

---

### Passo 3: Verificar "Vinculador de conversões"

1. **Clique na tag "Vinculador de conversões"**
2. **Verifique:**
   - ✅ Esta tag geralmente não precisa de configuração adicional
   - ❌ **PROBLEMA** se houver campos customizados com código suspeito

---

### Passo 4: Verificar Tags Ocultas ou Desativadas

⚠️ **CRÍTICO**: Verificar tags que não aparecem na lista principal:

1. No GTM, vá em **"Tags"**
2. Clique no **filtro** (ícone de funil) no topo da tabela
3. Selecione **"Desativadas"** ou **"Pausadas"**
4. Verifique se há tags desativadas que possam estar causando problemas

---

### Passo 5: Verificar Variáveis

1. **Clique em "Variáveis"** no menu lateral
2. **Verifique TODAS as 11 variáveis:**

#### Variáveis Customizadas:
- ❌ **PROBLEMA** se alguma variável contiver:
  - URLs com `userstat.net`
  - Código JavaScript com redirecionamentos
  - Valores que possam ser usados para redirecionamento

#### Variáveis Built-in:
- ✅ Geralmente são seguras
- ⚠️ Verifique se foram modificadas

---

### Passo 6: Verificar Triggers em Detalhe

Para cada trigger (especialmente os que têm filtros):

1. **Clique no trigger** (ex: `portalcacesso_page_view`)
2. **Verifique o filtro:**
   - ✅ Filtro: `source é igual a portalcacesso` - **CORRETO**
   - ❌ **PROBLEMA** se o filtro contiver:
     - Referências a domínios suspeitos
     - Código JavaScript
     - Condições que possam causar redirecionamento

---

### Passo 7: Verificar Histórico de Versões

1. **Clique em "Versões"** (já visível na imagem)
2. **Compare Versão 3 (ativa) com Versão 2:**

#### Verificar Mudanças:
- Clique na **Versão 3**
- Compare com a **Versão 2**
- **Procure por:**
  - Tags adicionadas
  - Tags modificadas
  - Variáveis modificadas
  - Triggers modificados

#### Se encontrar mudanças suspeitas:
- Anote quais tags/variáveis/triggers foram alterados
- Verifique o conteúdo específico dessas alterações

---

## 🔴 Checklist de Verificação Rápida

Use este checklist enquanto verifica:

### Tags:
- [ ] Todas as 14 tags verificadas individualmente
- [ ] Nenhuma tag Custom HTML encontrada
- [ ] Nenhuma tag Custom JavaScript encontrada
- [ ] IDs de conversão verificados (apenas números)
- [ ] Campos adicionais verificados (sem código suspeito)
- [ ] Tags desativadas verificadas

### Variáveis:
- [ ] Todas as 11 variáveis verificadas
- [ ] Nenhuma variável com URLs suspeitas
- [ ] Nenhuma variável com código JavaScript

### Triggers:
- [ ] Todos os 12 triggers verificados
- [ ] Filtros verificados (apenas condições legítimas)
- [ ] Nenhum trigger com código suspeito

### Versões:
- [ ] Versão 3 comparada com Versão 2
- [ ] Mudanças identificadas e verificadas

---

## 🎯 O Que Procurar Especificamente

### Sinais de Problema:

1. **Código JavaScript em campos de texto:**
   ```
   window.location = "https://userstat.net/..."
   document.location = "..."
   location.href = "..."
   ```

2. **URLs suspeitas:**
   ```
   userstat.net
   userstat.com
   stat.net
   ```

3. **Variáveis com valores suspeitos:**
   - URLs completas em variáveis
   - Código JavaScript em variáveis

4. **Triggers com condições suspeitas:**
   - Condições que verificam domínios externos
   - Condições que executam código

---

## 📝 Template de Verificação

Use este template para documentar suas verificações:

```
TAG: [Nome da Tag]
TIPO: [Tipo da Tag]
STATUS: [Ativa/Desativada]
VERIFICADO EM: [Data/Hora]

CAMPOS VERIFICADOS:
- Campo 1: [Valor] ✅/❌
- Campo 2: [Valor] ✅/❌
- Campo 3: [Valor] ✅/❌

PROBLEMAS ENCONTRADOS:
[Descreva qualquer problema encontrado]

AÇÃO TOMADA:
[O que foi feito para corrigir]
```

---

## 🚨 Se Encontrar Problemas

### Se encontrar código suspeito em uma tag:

1. **NÃO DELETE** a tag imediatamente
2. **DESATIVE** a tag primeiro
3. **ANOTE** todos os detalhes:
   - Nome da tag
   - Tipo da tag
   - Onde o código suspeito foi encontrado
   - Quando foi criada/modificada
4. **TESTE** se o problema desaparece após desativar
5. **PUBLIQUE** uma nova versão sem a tag suspeita

---

## ✅ Próximos Passos Após Verificação

1. **Se não encontrar problemas nas tags:**
   - Verifique outros possíveis pontos de entrada
   - Execute monitoramento no navegador
   - Verifique se há outros serviços de tracking

2. **Se encontrar problemas:**
   - Siga o guia em `PASSO_A_PASSO_CORRIGIR_USERSTAT.md`
   - Desative tags suspeitas
   - Publique versão limpa
   - Teste e monitore

---

## 🔧 Ferramentas de Apoio

Execute estes comandos para ajudar na verificação:

```bash
# Monitorar em tempo real
node scripts/security-monitor.js --once

# Verificar scripts externos
node scripts/verify-external-scripts.js

# Monitoramento no navegador
# Use o script em scripts/browser-monitor.js
```

---

**Última atualização**: 13 de Janeiro de 2026  
**Status**: Guia de verificação detalhada

