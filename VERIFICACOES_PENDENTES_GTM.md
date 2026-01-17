# Verificações Pendentes no GTM

## ✅ Status Atual

**Tags verificadas**: 12/14 ✅  
**Status**: Todas as tags verificadas parecem corretas  
**Problemas encontrados**: Nenhum nas tags verificadas

---

## ⚠️ Verificações que Ainda Precisam ser Feitas

### 1. 🔴 PRIORIDADE ALTA: Variável {{value}}

**Onde verificar:**
- Tag: `portalcacesso_payment_completed`
- Campo: "Valor da conversão" = `{{value}}`

**Como verificar:**
1. No GTM, vá em **"Variáveis"** no menu lateral
2. Procure pela variável chamada **`value`**
3. Clique nela
4. Verifique:
   - **Tipo da variável**: Qual é o tipo? (Constante, JavaScript, etc.)
   - **Valor padrão**: O que contém?
   - **❌ PROBLEMA se contiver:**
     - URLs com `userstat.net`
     - Código JavaScript
     - Funções de redirecionamento

**O que fazer se encontrar problema:**
- Anote o valor exato da variável
- Se contiver código suspeito, modifique ou desative a tag que a usa

---

### 2. 🔴 PRIORIDADE ALTA: Tag "Tag do Google"

**Como verificar:**
1. Na lista de Tags, clique em **"Tag do Google"**
2. Verifique os seguintes campos:

#### Campo: "ID de acompanhamento"
- **Deve ser**: `G-XXXXXXXXXX` ou `UA-XXXXXXXXX-X`
- **❌ PROBLEMA se contiver:**
  - `userstat`
  - Domínios suspeitos
  - Código JavaScript

#### Campo: "Campos a configurar" (se houver)
- Clique para expandir se houver campos adicionais
- Verifique cada campo:
  - Nome do campo
  - Valor do campo
  - **❌ PROBLEMA se algum valor contiver código suspeito**

---

### 3. 🔴 PRIORIDADE ALTA: Tag "Vinculador de conversões"

**Como verificar:**
1. Na lista de Tags, clique em **"Vinculador de conversões"**
2. Verifique:
   - Esta tag geralmente não tem campos customizados
   - **❌ PROBLEMA se houver campos adicionais com código suspeito**

---

### 4. 🟡 PRIORIDADE MÉDIA: Todas as 11 Variáveis

**Como verificar:**
1. No GTM, vá em **"Variáveis"** no menu lateral
2. Você verá uma lista com 11 variáveis
3. **Para cada variável:**

#### Se for Variável Customizada:
- Clique na variável
- Verifique:
  - **Tipo**: Qual é o tipo?
  - **Valor padrão**: O que contém?
  - **❌ PROBLEMA se contiver:**
    - URLs com `userstat`
    - Código JavaScript
    - Redirecionamentos

#### Se for Variável Built-in:
- Geralmente são seguras
- Mas verifique se foram modificadas

**Variáveis importantes para verificar especialmente:**
- `value` (usada em payment_completed)
- Qualquer variável customizada
- Variáveis que possam conter URLs

---

### 5. 🟡 PRIORIDADE MÉDIA: Tags Desativadas/Pausadas

**Como verificar:**
1. Na página de Tags, procure por um **filtro** ou **dropdown** no topo
2. Selecione **"Desativadas"** ou **"Pausadas"**
3. **Verifique TODAS as tags desativadas:**
   - Clique em cada uma
   - Verifique o conteúdo
   - **❌ PROBLEMA se encontrar:**
     - Tags Custom HTML
     - Tags Custom JavaScript
     - Tags com código suspeito

---

## 📋 Checklist de Verificação Rápida

Use este checklist enquanto verifica:

### Variáveis:
- [ ] Variável `value` verificada ✅/❌
- [ ] Todas as outras 10 variáveis verificadas ✅/❌
- [ ] Nenhuma variável com código suspeito ✅/❌

### Tags Restantes:
- [ ] Tag "Tag do Google" verificada ✅/❌
- [ ] Tag "Vinculador de conversões" verificada ✅/❌
- [ ] Tags desativadas verificadas ✅/❌

---

## 🎯 Ordem de Verificação Recomendada

1. **Primeiro**: Verificar variável `{{value}}` (usada em payment_completed)
2. **Segundo**: Verificar tag "Tag do Google"
3. **Terceiro**: Verificar tag "Vinculador de conversões"
4. **Quarto**: Verificar todas as outras variáveis
5. **Quinto**: Verificar tags desativadas

---

## 📝 Template para Documentar Verificações

Use este template para cada verificação:

```
═══════════════════════════════════════════════════
ELEMENTO: [Nome]
TIPO: [Variável/Tag/Trigger]
DATA: [Data/Hora]
═══════════════════════════════════════════════════

CONFIGURAÇÃO:
[Descreva a configuração encontrada]

VALORES VERIFICADOS:
- Campo 1: [Valor] ✅/❌
- Campo 2: [Valor] ✅/❌

PROBLEMAS ENCONTRADOS:
[Descreva se houver]

AÇÃO TOMADA:
[O que foi feito]
═══════════════════════════════════════════════════
```

---

## ✅ Resultado Esperado

Após completar todas as verificações:

- ✅ Todas as 14 tags verificadas
- ✅ Todas as 11 variáveis verificadas
- ✅ Tags desativadas verificadas
- ✅ Nenhum problema encontrado OU problemas identificados e corrigidos

---

## 🚨 Se Encontrar Problemas

### Se encontrar código suspeito:

1. **NÃO DELETE** imediatamente
2. **DESATIVE** primeiro
3. **ANOTE** todos os detalhes
4. **TESTE** se o problema desaparece
5. **PUBLIQUE** nova versão sem o elemento suspeito

---

**💡 DICA**: Use o arquivo `CHECKLIST_VERIFICACAO_GTM.md` para acompanhar seu progresso!

