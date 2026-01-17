# Guia: Adicionar Novo Domínio na Aba Coração

## 📋 O que é necessário para um domínio aparecer na Aba Coração?

Para que um novo domínio apareça na **Aba Coração** e seja possível validar a estrutura do funil, você precisa implementar a **coleta de eventos do funil** no novo domínio.

---

## 🎯 Requisitos Essenciais

### 1. Coletar Eventos do Funil

O novo domínio precisa enviar eventos para o endpoint `/funnel-events` do sync-server.

**Eventos Obrigatórios:**
- `funnel_id` (UUID único por sessão)
- `event_type` (tipo do evento)
- `utm_campaign` (opcional mas recomendado - para agrupar por campanha)
- `domain` (opcional - identifica o domínio)
- `ticket_id` (opcional - para vincular a pagamentos)

**Eventos Permitidos:**
1. `links_view` - Visualização de página de links
2. `links_cta_click` - Clique no botão CTA da página de links
3. `portal_view` - Visualização do Portal
4. `form_start` - Início do preenchimento do formulário
5. `form_submit_success` - Formulário enviado com sucesso
6. `form_submit_error` - Erro ao enviar formulário
7. `pix_view` - Visualização da página de pagamento PIX
8. `pix_initiated` - PIX gerado/iniciado
9. `payment_confirmed` - Pagamento confirmado ⭐ **CONVERSÃO PRINCIPAL**

---

## 🔧 Implementação no Novo Domínio

### Passo 1: Criar Biblioteca de Tracking

Crie um arquivo `funnelTracker.ts` (ou `.js`) no novo domínio:

```typescript
// funnelTracker.ts

const FUNNEL_ID_COOKIE = 'funnel_id';
const FUNNEL_ID_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';

/**
 * Gera UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Salva cookie
 */
function setCookie(name: string, value: string, maxAge: number) {
  const expires = new Date(Date.now() + maxAge).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Lê cookie
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Gera ou recupera funnel_id
 */
export function getFunnelId(): string {
  // Tentar ler de cookie
  let funnelId = getCookie(FUNNEL_ID_COOKIE);
  
  // Se não encontrou, tentar localStorage
  if (!funnelId) {
    try {
      funnelId = localStorage.getItem(FUNNEL_ID_COOKIE);
    } catch (e) {}
  }
  
  // Se não encontrou, tentar URL params (para cross-domain)
  if (!funnelId) {
    const urlParams = new URLSearchParams(window.location.search);
    funnelId = urlParams.get('funnel_id') || urlParams.get('fid');
    
    if (funnelId) {
      setCookie(FUNNEL_ID_COOKIE, funnelId, FUNNEL_ID_COOKIE_MAX_AGE);
      try {
        localStorage.setItem(FUNNEL_ID_COOKIE, funnelId);
      } catch (e) {}
    }
  }
  
  // Se ainda não encontrou, gerar novo
  if (!funnelId) {
    funnelId = generateUUID();
    setCookie(FUNNEL_ID_COOKIE, funnelId, FUNNEL_ID_COOKIE_MAX_AGE);
    try {
      localStorage.setItem(FUNNEL_ID_COOKIE, funnelId);
    } catch (e) {}
  } else {
    // Renovar expiração
    setCookie(FUNNEL_ID_COOKIE, funnelId, FUNNEL_ID_COOKIE_MAX_AGE);
  }
  
  return funnelId;
}

/**
 * Extrai parâmetros UTM da URL
 */
function getUtmParams(): { utm_campaign?: string; utm_term?: string } {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined
  };
}

/**
 * Envia evento para o backend
 */
export async function trackEvent(
  eventType: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Verificar feature flag
  if (import.meta.env.VITE_COLLECTOR_ENABLED === 'false') {
    return;
  }

  try {
    const funnelId = getFunnelId();
    const utmParams = getUtmParams();
    
    const eventData = {
      funnel_id: funnelId,
      event_type: eventType,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      domain: window.location.hostname,
      path: window.location.pathname,
      metadata: metadata || null,
      timestamp: Date.now()
    };

    // Enviar para backend (não bloquear UI)
    fetch(`${SYNC_SERVER_URL}/funnel-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData),
      keepalive: true
    }).catch(error => {
      if (import.meta.env.DEV) {
        console.error('[FunnelTracker] Erro ao enviar evento:', error);
      }
    });

    if (import.meta.env.DEV) {
      console.log('[FunnelTracker] Evento enviado:', eventType, eventData);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[FunnelTracker] Erro ao rastrear evento:', error);
    }
  }
}

/**
 * Adiciona funnel_id a uma URL para repassar entre domínios
 */
export function addFunnelIdToUrl(url: string): string {
  const funnelId = getFunnelId();
  const urlObj = new URL(url);
  urlObj.searchParams.set('funnel_id', funnelId);
  return urlObj.toString();
}
```

---

### Passo 2: Configurar Variáveis de Ambiente

No novo domínio, crie/edite `.env` ou `.env.local`:

```env
# URL do sync-server
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org

# Habilitar coletor de eventos (true ou false)
VITE_COLLECTOR_ENABLED=true

# (Opcional) API Key se necessário
VITE_SYNC_SERVER_API_KEY=sua_api_key_aqui
```

---

### Passo 3: Implementar Eventos nas Páginas

#### Exemplo: Página de Links (Landing Page)

```typescript
import { useEffect } from 'react';
import { trackEvent } from '@/lib/funnelTracker';

export function LinksPage() {
  // Evento: links_view (quando página carrega)
  useEffect(() => {
    trackEvent('links_view');
  }, []);

  const handleCtaClick = () => {
    // Evento: links_cta_click (quando clica no botão)
    trackEvent('links_cta_click', {
      cta_text: 'Acessar Agora',
      cta_position: 'header'
    });
    
    // Redirecionar para Portal
    window.location.href = addFunnelIdToUrl('https://portalcertidao.org/certidao');
  };

  return (
    <div>
      <h1>Landing Page</h1>
      <button onClick={handleCtaClick}>Acessar Agora</button>
    </div>
  );
}
```

#### Exemplo: Portal (Formulário)

```typescript
import { useEffect, useState } from 'react';
import { trackEvent, getFunnelId } from '@/lib/funnelTracker';

export function CertificateForm() {
  const [formStarted, setFormStarted] = useState(false);

  // Evento: portal_view (quando página carrega)
  useEffect(() => {
    trackEvent('portal_view');
  }, []);

  // Evento: form_start (quando usuário começa a preencher)
  const handleInputChange = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('form_start');
    }
  };

  // Evento: form_submit_success ou form_submit_error
  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        trackEvent('form_submit_success', {
          ticket_id: response.data.ticket_id
        });
        // Redirecionar para pagamento
        window.location.href = addFunnelIdToUrl(`/pagamento?ticket=${response.data.ticket_id}`);
      } else {
        trackEvent('form_submit_error', {
          error: response.error
        });
      }
    } catch (error) {
      trackEvent('form_submit_error', {
        error: error.message
      });
    }
  };

  return (
    <form onChange={handleInputChange} onSubmit={handleSubmit}>
      {/* Campos do formulário */}
    </form>
  );
}
```

#### Exemplo: Página de Pagamento

```typescript
import { useEffect } from 'react';
import { trackEvent } from '@/lib/funnelTracker';

export function PaymentPage() {
  const ticketId = new URLSearchParams(window.location.search).get('ticket');

  // Evento: pix_view (quando página carrega)
  useEffect(() => {
    trackEvent('pix_view', {
      ticket_id: ticketId
    });
  }, [ticketId]);

  const handleGeneratePix = async () => {
    // Gerar PIX
    const pixData = await generatePix(ticketId);
    
    // Evento: pix_initiated (quando PIX é gerado)
    trackEvent('pix_initiated', {
      ticket_id: ticketId,
      pix_value: pixData.value
    });
  };

  // Evento: payment_confirmed (quando pagamento é confirmado via webhook)
  // Este evento geralmente é disparado pelo backend quando recebe confirmação do Pagar.me
  // Mas você pode também disparar quando o usuário confirma manualmente

  return (
    <div>
      <h1>Pagamento</h1>
      <button onClick={handleGeneratePix}>Gerar PIX</button>
    </div>
  );
}
```

---

## 🔗 Vincular Pagamentos aos Eventos

Para vincular pagamentos confirmados aos eventos, você precisa:

1. **No webhook do Pagar.me** (quando pagamento é confirmado):

```javascript
// No sync-server.js ou webhook handler
app.post('/webhooks/pagarme', async (req, res) => {
  const { ticket_id, status } = req.body;
  
  if (status === 'paid') {
    // Buscar funnel_id do ticket
    const ticket = await getTicket(ticket_id);
    const funnelId = ticket.funnel_id; // Você precisa salvar funnel_id no ticket
    
    // Registrar evento de pagamento confirmado
    await fetch(`${SYNC_SERVER_URL}/funnel-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnel_id: funnelId,
        event_type: 'payment_confirmed',
        ticket_id: ticket_id,
        metadata: {
          payment_value: req.body.amount,
          payment_method: 'pix'
        },
        timestamp: Date.now()
      })
    });
  }
});
```

2. **Salvar funnel_id no ticket** quando formulário é enviado:

```typescript
// Ao enviar formulário
const handleSubmit = async (formData) => {
  const funnelId = getFunnelId();
  
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify({
      ...formData,
      funnel_id: funnelId // Incluir funnel_id
    })
  });
  
  // ... resto do código
};
```

---

## 📊 Como Aparece na Aba Coração

### 1. Resumo Geral

Aparece quando há eventos coletados no período selecionado:
- **Status do Funil** (semáforo)
- **Gasto sem Conversão**
- **Pagamentos**
- **ROI**

### 2. Gargalo Dominante

Identificado automaticamente baseado nas taxas de conversão entre etapas:
- **TRÁFEGO** - Gasto mas sem visualizações
- **LINKS** - Visualizações mas poucos cliques
- **PORTAL** - Visualizações mas poucos formulários iniciados
- **FORMULÁRIO** - Formulários iniciados mas poucos completados
- **PIX** - PIX gerado mas poucos pagamentos confirmados

### 3. Tabela por Campanha

Aparece quando há eventos com `utm_campaign`:
- Agrupa eventos por `utm_campaign`
- Mostra métricas por campanha
- Mostra gargalo e ação sugerida por campanha

---

## ✅ Checklist de Implementação

### No Novo Domínio:

- [ ] Criar `funnelTracker.ts` (ou `.js`)
- [ ] Configurar variáveis de ambiente (`.env`)
- [ ] Implementar `trackEvent('links_view')` na landing page
- [ ] Implementar `trackEvent('links_cta_click')` no botão CTA
- [ ] Implementar `trackEvent('portal_view')` no Portal
- [ ] Implementar `trackEvent('form_start')` quando usuário começa formulário
- [ ] Implementar `trackEvent('form_submit_success')` quando formulário é enviado
- [ ] Implementar `trackEvent('pix_view')` na página de pagamento
- [ ] Implementar `trackEvent('pix_initiated')` quando PIX é gerado
- [ ] Implementar `trackEvent('payment_confirmed')` quando pagamento é confirmado
- [ ] Garantir que `funnel_id` seja repassado entre páginas/domínios
- [ ] Salvar `funnel_id` no ticket quando formulário é enviado
- [ ] Vincular `payment_confirmed` ao `ticket_id` correto

### No Sync-Server:

- [ ] Verificar se `COLLECTOR_ENABLED=true` no `.env`
- [ ] Verificar se `funnelDatabase` está inicializado
- [ ] Testar endpoint `/funnel-events` (POST)
- [ ] Verificar se webhook do Pagar.me registra `payment_confirmed`

---

## 🧪 Testar Implementação

### 1. Verificar se Eventos Estão Sendo Enviados

No console do navegador (F12), você deve ver:
```
[FunnelTracker] Evento enviado: links_view { funnel_id: "...", event_type: "links_view", ... }
```

### 2. Verificar no Banco de Dados

```bash
# No servidor
sqlite3 funnel-database.db "SELECT * FROM funnel_events ORDER BY timestamp DESC LIMIT 10;"
```

### 3. Verificar na Aba Coração

1. Acesse a PLATAFORMA
2. Vá para a Aba Coração
3. Selecione o período com eventos
4. Deve aparecer dados no resumo geral

---

## 📝 Exemplo Completo: Novo Domínio "exemplo.com"

### Estrutura de Arquivos:

```
NOVO_DOMINIO/
├── src/
│   ├── lib/
│   │   └── funnelTracker.ts  ← Biblioteca de tracking
│   ├── pages/
│   │   ├── LandingPage.tsx     ← Página de links
│   │   ├── FormPage.tsx        ← Formulário
│   │   └── PaymentPage.tsx     ← Pagamento
│   └── ...
├── .env.local                  ← Variáveis de ambiente
└── ...
```

### .env.local:

```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_COLLECTOR_ENABLED=true
```

### LandingPage.tsx:

```typescript
import { useEffect } from 'react';
import { trackEvent, addFunnelIdToUrl } from '@/lib/funnelTracker';

export function LandingPage() {
  useEffect(() => {
    trackEvent('links_view');
  }, []);

  const handleClick = () => {
    trackEvent('links_cta_click');
    window.location.href = addFunnelIdToUrl('https://portalcertidao.org/certidao?utm_campaign=exemplo-com');
  };

  return (
    <div>
      <h1>Bem-vindo ao Exemplo.com</h1>
      <button onClick={handleClick}>Acessar Agora</button>
    </div>
  );
}
```

---

## 🎯 Pontos Importantes

### 1. UTM Campaign

**Muito importante!** Use `utm_campaign` nas URLs para:
- Agrupar eventos por campanha na tabela
- Vincular custos do Google Ads
- Analisar performance por campanha

**Exemplo:**
```
https://portalcertidao.org/certidao?utm_campaign=exemplo-com-campanha-1&utm_term=termo-1
```

### 2. Funnel ID

O `funnel_id` deve ser:
- **Único por sessão** (mesmo usuário = mesmo funnel_id)
- **Persistido** entre páginas/domínios (cookie + localStorage)
- **Repassado** via URL quando necessário (`?funnel_id=...`)

### 3. Eventos Críticos

Os eventos mais importantes são:
- ⭐ `payment_confirmed` - **CONVERSÃO PRINCIPAL**
- `form_submit_success` - Formulário completo
- `form_start` - Interesse demonstrado
- `links_view` - Tráfego chegando

---

## 🔍 Verificar se Está Funcionando

### 1. Teste Rápido

```bash
# Enviar evento de teste manualmente
curl -X POST https://api.portalcertidao.org/funnel-events \
  -H "Content-Type: application/json" \
  -d '{
    "funnel_id": "test-123",
    "event_type": "links_view",
    "domain": "exemplo.com",
    "utm_campaign": "teste",
    "timestamp": '$(date +%s000)'
  }'
```

### 2. Verificar na Aba Coração

1. Acesse PLATAFORMA → Aba Coração
2. Selecione período que inclui o evento de teste
3. Deve aparecer no resumo geral

### 3. Verificar Tabela por Campanha

Se o evento tiver `utm_campaign`, deve aparecer na tabela "Tabela por Campanha".

---

## 📞 Suporte

Se tiver dúvidas ou problemas:

1. Verifique os logs do sync-server: `pm2 logs sync-server`
2. Verifique o console do navegador (F12)
3. Verifique o banco de dados: `sqlite3 funnel-database.db "SELECT * FROM funnel_events ORDER BY timestamp DESC LIMIT 20;"`

---

## ✅ Resumo Rápido

**Para um novo domínio aparecer na Aba Coração:**

1. ✅ Implementar `funnelTracker` no novo domínio
2. ✅ Configurar variáveis de ambiente
3. ✅ Disparar eventos nas páginas corretas
4. ✅ Garantir que `funnel_id` seja persistido e repassado
5. ✅ Vincular pagamentos aos eventos via `ticket_id`
6. ✅ Usar `utm_campaign` nas URLs para agrupar por campanha

**Pronto!** Após implementar, os dados aparecerão automaticamente na Aba Coração! 🎉

