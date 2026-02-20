# Verificação: Certidões guia-central.online → Plexi (plataforma.portalcertidao.org)

**Data da verificação:** 11/02/2026

---

## Certidões disponíveis no guia-central.online

| # | Certidão | Categoria | tipoCertidao enviado | Plexi Registry | Status |
|---|----------|-----------|----------------------|----------------|--------|
| 1 | Certidão Negativa Criminal Federal | federais (criminal) | Certidão Negativa Criminal Federal | CRIMINAL_FEDERAL | ✅ Configurado |
| 2 | Certidão Negativa Criminal Estadual | estaduais | Certidão Negativa Criminal Estadual | CRIMINAL_ESTADUAL | ✅ Configurado |
| 3 | Antecedentes Criminais de Polícia Federal | policia-federal | Antecedentes - Polícia Federal | ANTECEDENTES_PF | ✅ Configurado |
| 4 | Certidão de Quitação Eleitoral | federais (eleitoral) | Certidão Negativa Eleitoral ou Certidão Negativa Eleitoral (UF) | ELEITORAL_NEGATIVA | ✅ Configurado |
| 5 | Certidão Negativa Cível Federal | federais (civel) | Certidão Negativa Cível Federal | CIVEL_FEDERAL | ✅ Configurado |
| 6 | Certidão Negativa Cível Estadual | estaduais (civel) | Certidão Negativa Cível Estadual | CIVEL_ESTADUAL | ✅ Configurado |
| 7 | Certidão Negativa de Débitos (CND) | cnd | CND - Certidão Negativa de Débitos | CND | ✅ Configurado |
| 8 | Certidão CPF Regular | cpf-regular | Situação Cadastral do CPF | CPF_REGULAR | ✅ Configurado |

---

## Resumo

**Todas as 8 certidões do guia-central.online estão configuradas para envio à Plexi na plataforma.**

### Correção aplicada
- **Certidão Eleitoral com estado**: O formulário envia "Certidão Negativa Eleitoral (SP)" quando o cliente escolhe um estado. O `getRegistryKey` foi ajustado para remover o sufixo entre parênteses e fazer o match correto com ELEITORAL_NEGATIVA.

---

## Estados suportados por tipo

### Criminal Estadual (9 estados)
SP, RJ, MG, RS, ES, PA, DF, BA, CE

### Criminal Estadual – estados não suportados pela Plexi
AC, AL, AM, AP, GO, MA, MS, MT, PB, PE, PI, PR, RN, RO, RR, SE, TO

**Observação:** O guia-central permite selecionar todos os estados exceto MG e PR. Tickets de estados não suportados pela Plexi (ex: AC, AL) receberão erro ao ir para EM_OPERACAO: *"Estado XX não suportado para Criminal Estadual"*.

### Cível Federal / Cível Estadual / Eleitoral
Endpoints genéricos da Plexi – suportam todos os estados.

### Criminal Federal
Suporta todos os estados via TRF (TRF1 a TRF6).
