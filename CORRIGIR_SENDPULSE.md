# 🔧 Correção do Problema SendPulse

## ❌ Problema Identificado

O SendPulse está retornando erro:
```
Status: Não foi entregue: a caixa de entrada não está disponível
Informações técnicas: == contato@portalcertidao.org MX: portalcertidao.org RESP: timed out
```

**Causa:** O domínio `portalcertidao.org` **não tem registro MX configurado** no DNS.

## ✅ Soluções

### Opção 1: Usar Email Já Verificado (RECOMENDADO - Mais Rápido)

Use um dos emails que já estão verificados e funcionando no SendPulse:

1. **links@soliciterapido1.online** ✅ (Recomendado)
2. **atendimento@insssoliciterapido.online** ✅
3. **contato@soliciterapidodocumentos.online** ✅

**Como configurar:**

No arquivo `.env` do servidor (`/var/www/portal-certidao/.env`):

```env
# Trocar de:
SENDPULSE_SENDER_EMAIL=contato@portalcertidao.org

# Para (escolha um):
SENDPULSE_SENDER_EMAIL=links@soliciterapido1.online
# OU
SENDPULSE_SENDER_EMAIL=atendimento@insssoliciterapido.online
# OU
SENDPULSE_SENDER_EMAIL=contato@soliciterapidodocumentos.online
```

**Depois de alterar:**

```bash
# No servidor
cd /var/www/portal-certidao
pm2 restart sync-server
```

### Opção 2: Configurar Registro MX (Mais Complexo)

Se você realmente precisa usar `contato@portalcertidao.org`, precisa configurar o registro MX:

1. **Acesse o painel do seu provedor de DNS** (onde você configurou o domínio)
2. **Adicione um registro MX:**
   ```
   Tipo: MX
   Nome: @ (ou portalcertidao.org)
   Prioridade: 10
   Valor: mail.portalcertidao.org (ou o servidor de email que você usar)
   ```

3. **Ou use um serviço de email:**
   - Configure um servidor de email (Postfix, etc.)
   - Ou use um serviço como Google Workspace, Microsoft 365, etc.
   - Configure o registro MX apontando para esse serviço

**⚠️ Atenção:** Configurar MX pode levar até 48 horas para propagar e requer configuração de servidor de email.

## 🎯 Recomendação

**Use a Opção 1** - é mais rápida e os emails já estão verificados no SendPulse.

## 📋 Verificação

Após alterar, teste enviando um email e verifique no histórico do SendPulse se o status mudou para "Entregue".

## 🔍 Verificar Registros MX Atuais

Para verificar se um domínio tem MX configurado:

```bash
dig MX portalcertidao.org
# ou
host -t MX portalcertidao.org
```

Se não retornar nada, o domínio não tem MX configurado.

