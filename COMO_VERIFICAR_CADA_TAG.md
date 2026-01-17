# Como Verificar Cada Tag no GTM - Guia Prático

## 🎯 Objetivo
Verificar o **CONTEÚDO** de cada tag para encontrar possíveis referências a `userstat.net` ou código de redirecionamento.

---

## 📋 Passo 1: Verificar Tags de Conversão do Google Ads

### Para cada uma das 12 tags `portalcacesso_*`:

1. **Clique na tag** na lista
2. **Procure por estes campos e verifique:**

#### ✅ Campo: "ID da conversão"
- **O que procurar**: Apenas números (ex: `1234567890`)
- **❌ PROBLEMA se contiver:**
  - URLs (ex: `https://userstat.net/...`)
  - Domínios (ex: `userstat.net`)
  - Código JavaScript

#### ✅ Campo: "Valor da conversão"
- **O que procurar**: Vazio ou valores numéricos
- **❌ PROBLEMA se contiver:**
  - Código JavaScript
  - URLs
  - Funções como `window.location`

#### ✅ Campo: "Moeda"
- **O que procurar**: `BRL` ou código válido
- **❌ PROBLEMA se contiver:** Qualquer coisa além de código de moeda

#### ✅ Campo: "Campos de conversão" (se houver)
- **Clique em "Adicionar campo"** se houver campos adicionais
- **Verifique cada campo:**
  - Nome do campo
  - Valor do campo
  - **❌ PROBLEMA se algum valor contiver:**
    - `userstat`
    - `window.location`
    - `document.location`
    - URLs suspeitas

---

## 📋 Passo 2: Verificar "Tag do Google"

1. **Clique na tag "Tag do Google"**
2. **Verifique:**

#### ✅ Campo: "ID de acompanhamento"
- **Deve ser:** `G-XXXXXXXXXX` ou `UA-XXXXXXXXX-X`
- **❌ PROBLEMA se contiver:**
  - `userstat`
  - Domínios suspeitos
  - Código JavaScript

#### ✅ Campo: "Campos a configurar" (se houver)
- **Clique para expandir** se houver campos
- **Verifique cada campo:**
  - Nome do campo
  - Valor do campo
  - **❌ PROBLEMA se algum valor contiver código suspeito**

---

## 📋 Passo 3: Verificar "Vinculador de conversões"

1. **Clique na tag "Vinculador de conversões"**
2. **Verifique:**
   - Esta tag geralmente não tem campos customizados
   - **❌ PROBLEMA se houver campos adicionais com código suspeito**

---

## 📋 Passo 4: Verificar Tags Ocultas (CRÍTICO!)

### 4.1 Verificar Tags Desativadas

1. Na página de Tags, procure por um **filtro** ou **dropdown** no topo
2. Selecione **"Desativadas"** ou **"Pausadas"**
3. **Verifique TODAS as tags desativadas:**
   - Clique em cada uma
   - Verifique o conteúdo
   - **❌ PROBLEMA se encontrar tags Custom HTML/JavaScript desativadas**

### 4.2 Verificar Tags em Pastas

1. Verifique se há **pastas** no GTM
2. Clique em cada pasta
3. Verifique tags dentro das pastas

---

## 📋 Passo 5: Verificar Variáveis (11 variáveis)

1. **Clique em "Variáveis"** no menu lateral
2. **Para cada uma das 11 variáveis:**

#### Se for Variável Customizada:
- **Clique na variável**
- **Verifique:**
  - Tipo da variável
  - Valor padrão (se houver)
  - **❌ PROBLEMA se contiver:**
    - URLs com `userstat`
    - Código JavaScript
    - Redirecionamentos

#### Se for Variável Built-in:
- Geralmente são seguras
- Mas verifique se foram modificadas

---

## 📋 Passo 6: Verificar Triggers em Detalhe

### Para triggers com filtros (especialmente):

1. **Clique no trigger** (ex: `portalcacesso_page_view`)
2. **Verifique o filtro:**
   - ✅ **BOM**: `source é igual a portalcacesso`
   - ❌ **PROBLEMA se o filtro contiver:**
     - Referências a domínios externos
     - Código JavaScript
     - Condições suspeitas

### Para todos os triggers:

1. Verifique o **"Tipo de evento"**
2. Verifique as **"Condições"**
3. **❌ PROBLEMA se encontrar:**
   - Código JavaScript nas condições
   - URLs suspeitas
   - Referências a domínios externos

---

## 📋 Passo 7: Comparar Versões

1. **Clique em "Versões"**
2. **Clique na Versão 3 (ativa)**
3. **Compare com Versão 2:**

#### O que verificar:
- **Tags adicionadas** na Versão 3
- **Tags modificadas** na Versão 3
- **Variáveis modificadas**
- **Triggers modificados**

#### Se encontrar mudanças:
- Clique em cada mudança
- Verifique o que foi alterado
- **❌ PROBLEMA se encontrar:**
  - Adição de código JavaScript
  - Adição de URLs suspeitas
  - Modificações que possam causar redirecionamento

---

## 🔍 O Que Procurar Especificamente

### Código Suspeito:
```
window.location = "https://userstat.net/..."
document.location = "..."
location.href = "..."
window.open("https://userstat.net/...")
```

### URLs Suspeitas:
```
userstat.net
userstat.com
stat.net
```

### Em Qualquer Campo:
- Código JavaScript
- URLs completas
- Funções de redirecionamento

---

## ✅ Checklist Rápido de Verificação

Use este checklist enquanto verifica:

### Tags (14 tags):
- [ ] Todas as 12 tags de conversão verificadas
- [ ] Tag do Google verificada
- [ ] Vinculador de conversões verificado
- [ ] Tags desativadas verificadas
- [ ] Tags em pastas verificadas

### Variáveis (11 variáveis):
- [ ] Todas as variáveis verificadas
- [ ] Nenhuma variável com código suspeito
- [ ] Nenhuma variável com URLs suspeitas

### Triggers (12 triggers):
- [ ] Todos os triggers verificados
- [ ] Filtros verificados
- [ ] Condições verificadas

### Versões:
- [ ] Versão 3 verificada
- [ ] Comparação com Versão 2 feita
- [ ] Mudanças identificadas

---

## 🚨 Se Encontrar Problemas

### Ação Imediata:

1. **NÃO DELETE** a tag/variável/trigger
2. **DESATIVE** primeiro
3. **ANOTE** todos os detalhes:
   ```
   TAG/VARIÁVEL/TRIGGER: [Nome]
   ONDE ENCONTRADO: [Campo específico]
   CÓDIGO SUSPEITO: [Copie o código]
   DATA: [Data da verificação]
   ```
4. **TESTE** se o problema desaparece
5. **PUBLIQUE** nova versão sem o elemento suspeito

---

## 📝 Template de Documentação

Use este template para documentar cada verificação:

```
═══════════════════════════════════════════════════
TAG: [Nome da Tag]
TIPO: [Tipo]
DATA: [Data/Hora]
═══════════════════════════════════════════════════

CAMPOS VERIFICADOS:
□ ID da conversão: [Valor] ✅/❌
□ Valor da conversão: [Valor] ✅/❌
□ Moeda: [Valor] ✅/❌
□ Campos adicionais: [Lista] ✅/❌

PROBLEMAS ENCONTRADOS:
[Descreva aqui]

AÇÃO TOMADA:
[O que foi feito]
═══════════════════════════════════════════════════
```

---

## 🎯 Próximos Passos Após Verificação

### Se NÃO encontrar problemas:

1. ✅ Continue monitorando
2. ✅ Execute testes no navegador
3. ✅ Verifique outras possíveis fontes

### Se ENCONTRAR problemas:

1. ❌ Desative elementos suspeitos
2. ❌ Publique versão limpa
3. ❌ Teste imediatamente
4. ❌ Monitore por 24-48 horas

---

**💡 DICA**: Use o arquivo `CHECKLIST_VERIFICACAO_GTM.md` para acompanhar seu progresso!

