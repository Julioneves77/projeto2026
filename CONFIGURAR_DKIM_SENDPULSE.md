# 🔐 Configurar DKIM para portalcertidao.org no SendPulse

## ✅ Status Atual

- ✅ **SPF:** Já configurado (`v=spf1 include:mxsspf.sendpulse.com +a +mx ~all`)
- ✅ **DMARC:** Já configurado (`v=DMARC1; p=quarantine`)
- ❌ **DKIM:** Faltando - precisa configurar

## 🎯 O que fazer

### Passo 1: Acessar SendPulse e Adicionar Domínio

1. Acesse: https://login.sendpulse.com
2. Faça login
3. Vá em **Configurações** > **SMTP** > **Definições de domínio**
4. Clique em **"Ativar"** ou **"Adicionar Domínio"**
5. Digite: `portalcertidao.org`
6. Clique em **"Adicionar"** ou **"Salvar"**

### Passo 2: Obter o Registro DKIM do SendPulse

Após adicionar o domínio, o SendPulse vai mostrar:

1. **Registro DKIM** - algo como:
   ```
   Tipo: TXT
   Nome: sendpulse._domainkey (ou similar, o SendPulse vai mostrar o nome exato)
   Valor: [uma chave longa gerada pelo SendPulse]
   ```

2. **Copie exatamente** o nome e o valor que o SendPulse mostrar

### Passo 3: Adicionar o Registro DKIM no DNS

**Onde configurar:** No painel onde você gerencia o DNS do domínio `portalcertidao.org`

**Provedores comuns:**
- **GoDaddy:** Domínios > portalcertidao.org > DNS > Adicionar registro
- **Namecheap:** Domain List > portalcertidao.org > Advanced DNS > Add New Record
- **Cloudflare:** Selecionar domínio > DNS > Records > Add record
- **Registro.br:** Área do cliente > portalcertidao.org > DNS

**Passos:**
1. Acesse o painel DNS do seu provedor
2. Clique em **"Adicionar Registro"** ou **"Add Record"**
3. Configure:
   - **Tipo:** TXT
   - **Nome:** (o nome que o SendPulse mostrou, ex: `sendpulse._domainkey`)
   - **Valor:** (o valor que o SendPulse gerou)
   - **TTL:** 3600 (ou padrão)
4. Salve o registro

### Passo 4: Verificar no SendPulse

1. Volte ao painel SendPulse
2. Na seção do domínio `portalcertidao.org`
3. Clique em **"Verificar"** ou **"Validar"**
4. O SendPulse vai verificar se o registro DKIM está correto
5. Aguarde alguns minutos (pode levar até 24 horas para propagar)

### Passo 5: Verificar o Email Remetente

1. No SendPulse, vá em **Configurações** > **SMTP** > **E-mail do remetente**
2. Verifique se `contato@portalcertidao.org` está listado
3. Se não estiver, adicione:
   - Clique em **"Adicionar novo endereço de Remetente"**
   - Digite: `contato@portalcertidao.org`
   - O SendPulse vai enviar um email de verificação
   - Confirme o email

### Passo 6: Atualizar o .env no Servidor

Depois que tudo estiver verificado:

```bash
# Conectar ao servidor
ssh root@143.198.10.145

# Editar o .env
cd /var/www/portal-certidao
nano .env

# Alterar de:
SENDPULSE_SENDER_EMAIL=links@soliciterapido1.online

# Para:
SENDPULSE_SENDER_EMAIL=contato@portalcertidao.org

# Salvar (Ctrl+X, depois Y, depois Enter)

# Reiniciar servidor
pm2 restart sync-server
```

## 🔍 Verificar se Está Funcionando

### Verificar Registro DKIM

```bash
# Substitua 'sendpulse._domainkey' pelo nome que o SendPulse mostrar
dig TXT sendpulse._domainkey.portalcertidao.org

# Deve retornar a chave DKIM que você configurou
```

### Verificar Todos os Registros

```bash
# SPF
dig TXT portalcertidao.org | grep spf

# DKIM (substitua pelo nome correto)
dig TXT sendpulse._domainkey.portalcertidao.org

# DMARC
dig TXT _dmarc.portalcertidao.org
```

### Testar Envio

1. Envie um email de teste pelo sistema
2. Verifique no histórico do SendPulse
3. O status deve ser "Entregue"
4. Não deve mais aparecer erro de MX timeout

## ⏱️ Tempo de Propagação

- **DKIM:** 15 minutos a 24 horas
- **Verificação SendPulse:** Imediata após propagação

## 🆘 Troubleshooting

### Se o SendPulse não validar o DKIM:

1. Aguarde mais tempo (pode levar até 24 horas)
2. Verifique se digitou corretamente no DNS (sem espaços extras)
3. Verifique se o nome do registro está correto (case-sensitive)
4. Use ferramentas online:
   - https://mxtoolbox.com/dkim.aspx
   - https://www.dmarcanalyzer.com/dkim-check/

### Se ainda aparecer erro de MX:

**IMPORTANTE:** O SendPulse **NÃO precisa de MX** para enviar emails!

O erro de MX que você viu pode ser apenas uma verificação de validação do SendPulse. Se SPF, DKIM e DMARC estiverem corretos, os emails devem ser enviados normalmente.

Se ainda aparecer erro:
1. Verifique se todos os registros (SPF, DKIM, DMARC) estão corretos
2. Aguarde a propagação completa (até 24 horas)
3. Contate o suporte do SendPulse se persistir

## 📝 Nota sobre MX

**Registro MX é usado para RECEBER emails**, não para enviar.

Para enviar emails via SendPulse, você precisa:
- ✅ SPF configurado (já está ✅)
- ✅ DKIM configurado (precisa adicionar ❌)
- ✅ DMARC configurado (já está ✅)
- ❌ MX NÃO é necessário para enviar

## ✅ Checklist

- [ ] Domínio `portalcertidao.org` adicionado no SendPulse
- [ ] Registro DKIM obtido do SendPulse
- [ ] Registro DKIM adicionado no DNS
- [ ] Registro DKIM verificado no SendPulse
- [ ] Email `contato@portalcertidao.org` verificado no SendPulse
- [ ] .env atualizado com `contato@portalcertidao.org`
- [ ] Servidor reiniciado
- [ ] Teste de envio realizado
- [ ] Status "Entregue" no histórico SendPulse

