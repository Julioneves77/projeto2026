# Como verificar se o GCLID está sendo capturado corretamente

## 1. Teste rápido no navegador

### Passo 1: Acesse o site com GCLID na URL

Abra o site com o parâmetro `gclid` na URL:

```
https://www.guia-central.online/?gclid=TESTE123
```

Ou para testar wbraid/gbraid (Google Ads com iOS 14+):

```
https://www.guia-central.online/?wbraid=TESTE456
https://www.guia-central.online/?gbraid=TESTE789
```

### Passo 2: Abra o Console do navegador

- **Chrome/Edge:** F12 ou Ctrl+Shift+J (Cmd+Option+J no Mac)
- **Firefox:** F12 ou Ctrl+Shift+K
- Vá na aba **Console**

### Passo 3: Execute o comando de debug

Digite e pressione Enter:

```javascript
window.gclidUtils.__GCLID_DEBUG()
```

O resultado mostra:
- **storedData:** dados em `localStorage` (gc_click_attribution)
- **getStoredClickId:** o click ID atual (valor + tipo)
- **cookieGclid, cookieWbraid, cookieGbraid:** cookies
- **urlParams:** parâmetros da URL atual

**Exemplo de sucesso:**
```javascript
{
  storedData: { gclid: "TESTE123", clickIdType: "GCLID", updatedAt: "2026-02-24T..." },
  getStoredClickId: { value: "TESTE123", type: "GCLID" },
  cookieGclid: "TESTE123",
  urlParams: { gclid: "TESTE123", wbraid: "", gbraid: "" }
}
```

---

## 2. Verificar se o GCLID está nos formulários

O `gclid.js` adiciona automaticamente campos hidden em todos os `<form>`:

- `input[name="gclid"]` com o valor
- `input[name="clickIdType"]` com o tipo (GCLID, WBRAID ou GBRAID)

**No Console:**
```javascript
document.querySelectorAll('form input[name="gclid"]').forEach(i => console.log(i.value))
```

Se o GCLID foi capturado, deve aparecer o valor no console.

---

## 3. Verificar no fluxo completo (até o ticket)

1. Acesse **https://www.guia-central.online/?gclid=MEUTESTE123**
2. Preencha o formulário e complete até gerar o PIX
3. Na plataforma admin: **Conversões (GCLID)** → tabela de conversões
4. Verifique se existe uma conversão com **GCLID = MEUTESTE123**

Ou via API (diagnóstico):

```bash
curl -s "https://plataforma.portalcertidao.org/api/admin/sheets/diagnostic" \
  -H "X-API-Key: SUA_API_KEY"
```

O campo `recentTicketsWithGclid` indica quantos dos últimos 50 pedidos têm GCLID.

---

## 4. Checklist de verificação

| Item | Como verificar |
|------|----------------|
| `gclid.js` carregado | `typeof window.gclidUtils` no Console → deve ser `"object"` |
| Captura da URL | Acessar com `?gclid=X` e executar `window.gclidUtils.__GCLID_DEBUG()` |
| Cookie | `document.cookie` deve conter `gc_gclid=...` |
| localStorage | `localStorage.getItem('gc_click_attribution')` deve retornar JSON com gclid |
| Persistência | Navegar para outra página (sem gclid na URL) e verificar se ainda existe: `window.gclidUtils.getStoredClickId()` |
| Formulário | `document.querySelector('input[name="gclid"]')?.value` deve ter o valor |
| Ticket | Na plataforma, verificar conversão com o GCLID usado no teste |

---

## 5. Requisitos para o Google Ads enviar o GCLID

1. **URL do anúncio** deve incluir a URL final do site (ex: `https://www.guia-central.online`)
2. **Rastreamento de conversões** configurado no Google Ads
3. **Tag de conversão** ou **gtag.js** no site (já tem GTM)
4. O usuário precisa **clicar no anúncio** (não digitar a URL direto) para o Google Ads adicionar o `gclid` automaticamente

**Importante:** Se você digitar a URL manualmente com `?gclid=TESTE123`, o GCLID será capturado. Em produção, o Google Ads adiciona o parâmetro quando o usuário clica no anúncio.

---

## 6. Troubleshooting

**GCLID não aparece no `__GCLID_DEBUG()`:**
- Confirme que acessou com `?gclid=VALOR` na URL
- Verifique se o `gclid.js` está carregando (sem erros no Console)
- Verifique se o domínio não está bloqueando cookies (modo anônimo, extensões)

**GCLID capturado mas não no ticket:**
- O fluxo de criação do ticket usa `getStoredClickId()` do `ticketService.ts`
- Verifique se o `gclid.js` carrega **antes** do React (está no `<head>` do index.html)

**Google Ads não envia GCLID:**
- Verifique a configuração do link final no anúncio
- Certifique-se de que o rastreamento de conversões está ativo
- O GCLID só é enviado em cliques em anúncios de Search, Display, Shopping, etc.
