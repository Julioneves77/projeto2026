# Alterações de Email - Suporte Online Digital

## Data: 18 de Janeiro de 2026

## Alterações Realizadas

### 1. SendPulse Service (`services/sendPulseService.js`)

#### Fallback padrão atualizado:
- **Antes**: `'portalcertidao.org'` como domínio padrão
- **Agora**: `'suporteonline.digital'` como domínio padrão

#### Alterações específicas:

1. **Função `getSenderByDomain()`**:
   - Fallback padrão alterado de `portalcertidao.org` para `suporteonline.digital`
   - Email padrão alterado de `contato@portalcertidao.org` para `contato@suporteonline.digital`
   - Nome padrão alterado de `'Portal Certidão'` para `'Suporte Online'`
   - Website padrão alterado para `www.suporteonline.digital`

2. **Função `sendConfirmationEmail()`**:
   - Domínio padrão alterado de `'portalcertidao.org'` para `'suporteonline.digital'`

3. **Função `sendCompletionEmail()`**:
   - Domínio padrão alterado de `'portalcertidao.org'` para `'suporteonline.digital'`

4. **Função `sendEmail()`**:
   - Email padrão alterado de `'contato@portalcertidao.org'` para `'contato@suporteonline.digital'`
   - Nome padrão alterado de `'Portal Certidão'` para `'Suporte Online'`

### 2. Zap API Service (`services/zapApiService.js`)

#### Alterações específicas:

1. **Função `createWhatsAppMessage()`**:
   - Domínio padrão alterado de `'portalcertidao.org'` para `'suporteonline.digital'`
   - Fallback padrão alterado para usar `'Suporte Online'` e `www.suporteonline.digital`

2. **Função `createCompletionWhatsAppMessage()`**:
   - Domínio padrão alterado de `'portalcertidao.org'` para `'suporteonline.digital'`
   - Fallback padrão alterado para usar `'Suporte Online'` e `www.suporteonline.digital`

### 3. Ticket Service (`SUPORTE ONLINE 2/src/lib/ticketService.ts`)

#### Já estava configurado corretamente:
- `dominio: 'www.suporteonline.digital'` na criação do ticket (linha 173)

## Comportamento Atual

### Emails de Confirmação de Pagamento:
- **Remetente**: `SUPORTE_SENDER_EMAIL` ou `SENDPULSE_SENDER_EMAIL` ou `contato@suporteonline.digital`
- **Nome**: `SUPORTE_SENDER_NAME` ou `'Suporte Online'`
- **Website no email**: `www.suporteonline.digital`
- **URL no email**: `https://www.suporteonline.digital`

### Emails de Entrega/Conclusão:
- **Remetente**: `SUPORTE_SENDER_EMAIL` ou `SENDPULSE_SENDER_EMAIL` ou `contato@suporteonline.digital`
- **Nome**: `SUPORTE_SENDER_NAME` ou `'Suporte Online'`
- **Website no email**: `www.suporteonline.digital`
- **URL no email**: `https://www.suporteonline.digital`

### Mensagens WhatsApp:
- **Nome da marca**: `'Suporte Online'`
- **Website**: `www.suporteonline.digital`

## Variáveis de Ambiente Recomendadas

Para garantir que os emails sejam enviados corretamente, configure no `.env` do sync-server:

```env
# Email do remetente para Suporte Online
SUPORTE_SENDER_EMAIL=contato@suporteonline.digital
SUPORTE_SENDER_NAME=Suporte Online

# Ou usar as variáveis gerais do SendPulse
SENDPULSE_SENDER_EMAIL=contato@suporteonline.digital
SENDPULSE_SENDER_NAME=Suporte Online
```

**IMPORTANTE**: O email `contato@suporteonline.digital` deve estar verificado no SendPulse para poder enviar emails.

## Notas

- O mapeamento de domínios ainda mantém `portalcertidao.org` para compatibilidade com tickets existentes
- O fallback padrão agora é `suporteonline.digital` quando o domínio não é identificado
- Os tickets criados pelo SUPORTE ONLINE 2 já vêm com `dominio: 'www.suporteonline.digital'`
- O sync-server não modifica o domínio, apenas usa o que vem no ticket

## Próximos Passos

1. Verificar se o email `contato@suporteonline.digital` está verificado no SendPulse
2. Configurar variáveis de ambiente `SUPORTE_SENDER_EMAIL` e `SUPORTE_SENDER_NAME` se necessário
3. Reiniciar o sync-server para aplicar as mudanças
4. Testar envio de email de confirmação após pagamento
5. Testar envio de email de entrega após conclusão

