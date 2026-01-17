# 📧 Configurar Registro MX para portalcertidao.org

## 🎯 Objetivo

Configurar o registro MX para que o SendPulse possa verificar e usar `contato@portalcertidao.org` como remetente.

## ⚠️ Importante

**O SendPulse NÃO requer registro MX para enviar emails!**

O SendPulse usa sua própria infraestrutura de envio. O problema que você está enfrentando é diferente:

### O Problema Real

O erro "MX: portalcertidao.org RESP: timed out" acontece quando:
1. O SendPulse tenta **verificar** se o domínio está configurado corretamente
2. Ele faz uma consulta MX para validar o domínio
3. Como não há MX, ele não consegue validar

### A Solução Correta

Você precisa configurar os registros **SPF, DKIM e DMARC** no SendPulse, não o MX!

## 📋 Passo a Passo Completo

### 1. Acessar o Painel SendPulse

1. Acesse: https://login.sendpulse.com
2. Faça login na sua conta
3. Vá em **Configurações** > **SMTP** > **Definições de domínio**

### 2. Adicionar o Domínio portalcertidao.org

1. Clique em **"Ativar"** ou **"Adicionar Domínio"**
2. Digite: `portalcertidao.org`
3. O SendPulse vai gerar os registros DNS necessários

### 3. Configurar Registros DNS

O SendPulse vai mostrar os registros que você precisa adicionar:

#### A. Registro SPF (TXT)

```
Tipo: TXT
Nome: @ (ou portalcertidao.org)
Valor: v=spf1 include:sendpulse.com ~all
```

#### B. Registro DKIM (TXT)

O SendPulse vai gerar um registro único, algo como:

```
Tipo: TXT
Nome: sendpulse._domainkey (ou similar)
Valor: [chave gerada pelo SendPulse]
```

#### C. Registro DMARC (TXT)

```
Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:contato@portalcertidao.org
```

### 4. Adicionar os Registros no seu Provedor DNS

**Onde configurar:** No painel onde você gerencia o DNS do domínio `portalcertidao.org`

**Provedores comuns:**
- **GoDaddy:** Domínios > portalcertidao.org > DNS
- **Namecheap:** Domain List > portalcertidao.org > Advanced DNS
- **Cloudflare:** Selecionar domínio > DNS > Records
- **Registro.br:** Área do cliente > portalcertidao.org > DNS

**Passos:**
1. Acesse o painel do seu provedor DNS
2. Vá na seção de registros DNS
3. Adicione os registros TXT conforme mostrado pelo SendPulse
4. Salve as alterações

### 5. Verificar no SendPulse

1. Volte ao painel SendPulse
2. Clique em **"Verificar"** ou **"Validar"**
3. O SendPulse vai verificar se os registros estão corretos
4. Aguarde alguns minutos (pode levar até 24 horas para propagar)

### 6. Verificar o Email Remetente

1. No SendPulse, vá em **Configurações** > **SMTP** > **E-mail do remetente**
2. Adicione ou verifique: `contato@portalcertidao.org`
3. O SendPulse vai enviar um email de verificação
4. Confirme o email

### 7. Atualizar o .env

Depois que tudo estiver verificado:

```bash
# No servidor
cd /var/www/portal-certidao
nano .env

# Alterar de:
SENDPULSE_SENDER_EMAIL=links@soliciterapido1.online

# Para:
SENDPULSE_SENDER_EMAIL=contato@portalcertidao.org

# Salvar e reiniciar
pm2 restart sync-server
```

## 🔍 Verificar se Está Funcionando

### Verificar Registros DNS

```bash
# Verificar SPF
dig TXT portalcertidao.org | grep spf

# Verificar DKIM (substitua pelo nome que o SendPulse gerar)
dig TXT sendpulse._domainkey.portalcertidao.org

# Verificar DMARC
dig TXT _dmarc.portalcertidao.org
```

### Testar Envio

1. Envie um email de teste pelo sistema
2. Verifique no histórico do SendPulse
3. O status deve ser "Entregue"

## ⏱️ Tempo de Propagação

- **SPF/DKIM/DMARC:** 15 minutos a 24 horas
- **Verificação SendPulse:** Imediata após propagação

## 🆘 Troubleshooting

### Se os registros não aparecerem:

1. Aguarde mais tempo (pode levar até 24 horas)
2. Verifique se digitou corretamente no DNS
3. Use ferramentas online para verificar:
   - https://mxtoolbox.com/spf.aspx
   - https://mxtoolbox.com/dkim.aspx

### Se o SendPulse não validar:

1. Verifique se todos os registros estão corretos
2. Certifique-se de que não há espaços extras
3. Verifique se o nome do registro está correto (case-sensitive)

### Se ainda der erro de MX:

O SendPulse não precisa de MX para enviar. Se ainda aparecer erro de MX:
1. Pode ser um problema temporário do SendPulse
2. Aguarde alguns minutos e tente novamente
3. Contate o suporte do SendPulse se persistir

## 📝 Nota Importante

**Registro MX é usado para RECEBER emails**, não para enviar.

Para enviar emails via SendPulse, você só precisa:
- ✅ SPF configurado
- ✅ DKIM configurado  
- ✅ DMARC configurado (opcional mas recomendado)
- ❌ MX NÃO é necessário para enviar

O erro de MX que você viu pode ser apenas uma verificação de validação do SendPulse, mas não impede o envio se SPF/DKIM estiverem corretos.

## ✅ Checklist Final

- [ ] Domínio adicionado no SendPulse
- [ ] Registro SPF adicionado no DNS
- [ ] Registro DKIM adicionado no DNS
- [ ] Registro DMARC adicionado no DNS
- [ ] Registros verificados no SendPulse
- [ ] Email remetente verificado no SendPulse
- [ ] .env atualizado com contato@portalcertidao.org
- [ ] Servidor reiniciado
- [ ] Teste de envio realizado

