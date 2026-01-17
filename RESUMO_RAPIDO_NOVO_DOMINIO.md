# 🚀 Resumo Rápido: Adicionar Novo Domínio na Aba Coração

## ⚡ O que precisa fazer (3 passos)

### 1️⃣ Implementar Coleta de Eventos

Copie o arquivo `template-funnelTracker.ts` para seu novo domínio e use nas páginas:

```typescript
import { trackEvent } from '@/lib/funnelTracker';

// Na landing page
useEffect(() => {
  trackEvent('links_view');
}, []);

// No botão CTA
const handleClick = () => {
  trackEvent('links_cta_click');
};

// No formulário (quando usuário começa a preencher)
trackEvent('form_start');

// Quando formulário é enviado
trackEvent('form_submit_success', { ticket_id: 'TKT-123' });

// Na página de pagamento
trackEvent('pix_view');
trackEvent('pix_initiated');

// Quando pagamento é confirmado (no webhook)
trackEvent('payment_confirmed', { ticket_id: 'TKT-123' });
```

### 2️⃣ Configurar Variáveis de Ambiente

No `.env` do novo domínio:

```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_COLLECTOR_ENABLED=true
```

### 3️⃣ Usar UTM Campaign nas URLs

Para aparecer na tabela por campanha:

```
https://portalcertidao.org/certidao?utm_campaign=nome-da-campanha&funnel_id=...
```

---

## 📊 Eventos Necessários

| Evento | Quando Disparar | Obrigatório |
|--------|----------------|-------------|
| `links_view` | Página de links carrega | ✅ Sim |
| `links_cta_click` | Botão CTA clicado | ✅ Sim |
| `portal_view` | Portal carrega | ✅ Sim |
| `form_start` | Usuário começa formulário | ✅ Sim |
| `form_submit_success` | Formulário enviado | ✅ Sim |
| `pix_view` | Página de pagamento carrega | ✅ Sim |
| `pix_initiated` | PIX gerado | ✅ Sim |
| `payment_confirmed` | Pagamento confirmado | ⭐ **CRÍTICO** |

---

## ✅ Como Validar que Está Funcionando

### Teste Rápido:

1. **Acesse o novo domínio**
2. **Navegue pelo funil completo**
3. **Abra Console (F12)** - deve ver logs: `[FunnelTracker] Evento enviado: ...`
4. **Acesse PLATAFORMA → Aba Coração**
5. **Selecione período com os eventos**
6. **Deve aparecer dados no resumo!**

### Verificar no Banco:

```bash
sqlite3 funnel-database.db "SELECT domain, event_type, COUNT(*) FROM funnel_events WHERE domain = 'seu-dominio.com' GROUP BY event_type;"
```

---

## 🎯 O que Aparece na Aba Coração

### Quando há eventos coletados:

✅ **Resumo Geral:**
- Status do Funil (semáforo)
- Gasto sem Conversão
- Pagamentos
- ROI

✅ **Gargalo Dominante:**
- Identificado automaticamente
- Diagnóstico
- Ação Sugerida

✅ **Tabela por Campanha:**
- Aparece quando há `utm_campaign`
- Mostra métricas por campanha
- Mostra gargalo e ação por campanha

---

## 📝 Checklist Mínimo

- [ ] `funnelTracker.ts` implementado
- [ ] `.env` configurado
- [ ] Eventos sendo disparados
- [ ] `funnel_id` sendo persistido
- [ ] `utm_campaign` nas URLs
- [ ] Pagamentos vinculados aos eventos

**Pronto!** Após isso, o domínio aparecerá automaticamente na Aba Coração! 🎉

---

## 📚 Documentação Completa

- **Guia Completo:** `GUIA_ADICIONAR_NOVO_DOMINIO_ABA_CORACAO.md`
- **Template:** `template-funnelTracker.ts`
- **Checklist:** `CHECKLIST_NOVO_DOMINIO.md`

