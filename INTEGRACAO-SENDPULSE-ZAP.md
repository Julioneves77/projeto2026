# Integração SendPulse e Zap API - Documentação

## Visão Geral

Esta integração permite o envio automático de confirmação de pagamento por email (SendPulse) e WhatsApp (Zap API) quando um ticket muda para status `EM_OPERACAO` no PORTAL.

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# SendPulse API Credentials
SENDPULSE_CLIENT_ID=seu_client_id_aqui
SENDPULSE_CLIENT_SECRET=seu_client_secret_aqui

# Zap API Credentials
ZAP_API_KEY=sua_api_key_aqui
ZAP_API_URL=https://api.zap.com.br/v1

# Sync Server Configuration
PORT=3001
```

**Importante:** O arquivo `.env` não deve ser commitado no Git. Use `.env.example` como referência.

### 2. Instalação de Dependências

As dependências já foram instaladas:
- `dotenv` - Gerenciamento de variáveis de ambiente
- `axios` - Cliente HTTP para requisições

## Arquitetura

```
PORTAL (Payment.tsx)
    ↓
    Chama sendPaymentConfirmation()
    ↓
PORTAL (ticketService.ts)
    ↓
    POST /tickets/:id/send-confirmation
    ↓
Sync Server (sync-server.js)
    ↓
    ├─→ SendPulse Service (email)
    └─→ Zap API Service (WhatsApp)
    ↓
    Atualiza histórico do ticket
```

## Fluxo de Funcionamento

1. **Usuário confirma pagamento** no PORTAL
2. **Ticket é atualizado** para status `EM_OPERACAO`
3. **PORTAL chama** `sendPaymentConfirmation(ticketId)`
4. **Servidor processa** envio de email e WhatsApp em paralelo
5. **Histórico do ticket** é atualizado com resultado dos envios
6. **Usuário recebe feedback** sobre o status do envio

## Endpoints

### POST /tickets/:id/send-confirmation

Envia confirmação de pagamento para um ticket específico.

**Parâmetros:**
- `id` (path): ID ou código do ticket

**Resposta de Sucesso:**
```json
{
  "success": true,
  "email": {
    "success": true,
    "messageId": "msg-123",
    "email": "cliente@email.com"
  },
  "whatsapp": {
    "success": true,
    "messageId": "msg-456",
    "phone": "5511999999999"
  },
  "ticketCodigo": "TK-001"
}
```

**Resposta de Erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "email": { "success": false, "error": "..." },
  "whatsapp": { "success": false, "error": "..." }
}
```

## Estrutura de Dados

### Histórico do Ticket

O histórico agora inclui campos adicionais para rastrear envios:

```typescript
{
  id: string;
  dataHora: Date;
  autor: string;
  statusAnterior: TicketStatus;
  statusNovo: TicketStatus;
  mensagem: string;
  enviouEmail?: boolean;
  enviouWhatsApp?: boolean;
  dataEnvioEmail?: string | null;
  dataEnvioWhatsApp?: string | null;
}
```

## Templates

### Email (SendPulse)

O template de email inclui:
- Nome do cliente
- Código do ticket
- Tipo de certidão
- Prazo de entrega
- Status do pedido

### WhatsApp (Zap API)

A mensagem WhatsApp inclui:
- Saudação personalizada
- Código do ticket
- Confirmação de pagamento
- Próximos passos

## Tratamento de Erros

- Se o email falhar, o WhatsApp ainda será enviado (e vice-versa)
- Erros não bloqueiam o fluxo principal
- Logs detalhados são gerados para debug
- Histórico do ticket registra tentativas de envio

## Logs

Os logs incluem:
- `📧 [SendPulse]` - Logs do serviço de email
- `📱 [Zap API]` - Logs do serviço WhatsApp
- `📧 [SYNC]` - Logs do servidor de sincronização
- `📧 [PORTAL]` - Logs do PORTAL

## Testes

Para testar a integração:

1. Configure as variáveis de ambiente no `.env`
2. Inicie o servidor de sincronização: `npm run sync-server`
3. Inicie o PORTAL: `cd PORTAL && npm run dev`
4. Complete um fluxo de pagamento
5. Verifique os logs no console
6. Verifique o histórico do ticket na PLATAFORMA

## Próximos Passos

- [ ] Criar templates HTML mais elaborados para email
- [ ] Adicionar retry automático em caso de falha
- [ ] Implementar fila de envio para alta demanda
- [ ] Adicionar webhook de confirmação de leitura
- [ ] Criar dashboard de monitoramento de envios

