# 🔧 Corrigir Lookup Table - google_ads_account

## 🔴 Problema Identificado

No Preview Mode:
- ✅ `DLV - utm_campaign` = `"teste_conta_1"` (funcionando!)
- ❌ `google_ads_account` = `undefined` (não funcionando!)

**Causa:** A Lookup Table está configurada para match exato, mas precisa usar "contém" ou regex.

---

## ✅ SOLUÇÃO: Ajustar Lookup Table

### Passo 1: Abrir Variável google_ads_account

1. No GTM, vá em **"Variáveis"**
2. Clique na variável `google_ads_account`

### Passo 2: Ajustar Configuração da Tabela

**Opção A: Usar Regex (Recomendado)**

Na tabela de lookup, configure assim:

| Entrada (Input) | Saída (Output) |
|-----------------|----------------|
| `.*conta_1.*` | `591-659-0517` |
| `.*conta_2.*` | `471-059-5347` |

**Como fazer:**
1. Clique no campo "Entrada" da primeira linha
2. Selecione **"Regex"** no dropdown (se disponível)
3. Digite: `.*conta_1.*`
4. Saída: `591-659-0517`

**Opção B: Usar Múltiplas Entradas (Alternativa)**

Se não tiver regex, adicione múltiplas linhas:

| Entrada (Input) | Saída (Output) |
|-----------------|----------------|
| `conta_1` | `591-659-0517` |
| `teste_conta_1` | `591-659-0517` |
| `campanha_conta_1` | `591-659-0517` |
| `conta_2` | `471-059-5347` |
| `teste_conta_2` | `471-059-5347` |
| `campanha_conta_2` | `471-059-5347` |

**⚠️ IMPORTANTE:** Adicione TODAS as variações possíveis de nomes de campanha que contenham "conta_1" ou "conta_2".

---

## 🧪 Testar Após Ajustar

1. **Salve a variável** no GTM
2. **No Preview Mode**, clique no evento `payment_completed`
3. **Vá na aba "Variáveis"**
4. **Verifique:**
   - `DLV - utm_campaign` = `"teste_conta_1"` ✅
   - `google_ads_account` = `"591-659-0517"` ✅ (deve aparecer agora!)

---

## 💡 Solução Mais Simples (Se Não Tiver Regex)

Se o GTM não suportar regex na Lookup Table, você pode:

**Opção 1: Criar Variável Custom JavaScript**

1. Crie uma nova variável:
   - **Nome:** `google_ads_account_js`
   - **Tipo:** JavaScript personalizado
   - **Código:**
   ```javascript
   function() {
     var utmCampaign = {{DLV - utm_campaign}};
     if (!utmCampaign) return '';
     
     if (utmCampaign.indexOf('conta_1') !== -1) {
       return '591-659-0517';
     }
     if (utmCampaign.indexOf('conta_2') !== -1) {
       return '471-059-5347';
     }
     
     return '';
   }
   ```

2. Use `{{google_ads_account_js}}` nas tags ao invés de `{{google_ads_account}}`

**Opção 2: Usar Trigger com Regex**

Modifique os triggers para usar regex diretamente nas condições, ao invés de usar Lookup Table.

---

## ✅ Checklist

- [ ] Lookup Table ajustada para usar regex ou múltiplas entradas
- [ ] Variável salva no GTM
- [ ] Testado no Preview Mode
- [ ] `google_ads_account` retorna valor correto
- [ ] Tag usa `{{google_ads_account}}` no campo "ID da Conta"

---

**🎯 Após corrigir, teste novamente no Preview Mode!**

