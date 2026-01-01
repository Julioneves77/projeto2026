# ✅ Checklist Final de Deploy

## Status: 🟢 PRONTO PARA DEPLOY

---

## ✅ Preparação Local (CONCLUÍDO)

- [x] ✅ Variáveis de ambiente configuradas (`.env` e `.env.local`)
- [x] ✅ API Key gerada e configurada
- [x] ✅ Builds de produção concluídos:
  - [x] ✅ PORTAL/dist/
  - [x] ✅ PLATAFORMA/dist/
  - [x] ✅ SOLICITE LINK/dist/
- [x] ✅ Scripts de deploy criados
- [x] ✅ Documentação completa

---

## 📋 Checklist de Deploy no Servidor

### Fase 1: Preparação do Servidor
- [ ] Conectar ao servidor via SSH
- [ ] Instalar Node.js 18+
- [ ] Instalar PM2
- [ ] Instalar Nginx
- [ ] Criar estrutura de diretórios
- [ ] Configurar permissões

### Fase 2: Upload dos Arquivos
- [ ] Upload PORTAL/dist/ → /var/www/portal/dist/
- [ ] Upload PLATAFORMA/dist/ → /var/www/plataforma/dist/
- [ ] Upload SOLICITE LINK/dist/ → /var/www/solicite-link/dist/
- [ ] Upload sync-server.js → /var/www/portal-certidao/
- [ ] Upload services/ → /var/www/portal-certidao/
- [ ] Upload utils/ → /var/www/portal-certidao/
- [ ] Upload package.json → /var/www/portal-certidao/
- [ ] Upload .env → /var/www/portal-certidao/

### Fase 3: Configuração do Nginx
- [ ] Configurar portalcertidao.org
- [ ] Configurar plataforma.portalcertidao.org
- [ ] Configurar solicite.link
- [ ] Configurar api.portalcertidao.org
- [ ] Testar configuração do Nginx
- [ ] Recarregar Nginx

### Fase 4: Configuração SSL/HTTPS
- [ ] Instalar Certbot
- [ ] Obter certificado para www.portalcertidao.org
- [ ] Obter certificado para plataforma.portalcertidao.org
- [ ] Obter certificado para www.solicite.link
- [ ] Obter certificado para api.portalcertidao.org
- [ ] Verificar renovação automática

### Fase 5: Iniciar Serviços
- [ ] Instalar dependências do sync-server (npm install)
- [ ] Iniciar sync-server com PM2
- [ ] Configurar PM2 para iniciar no boot
- [ ] Verificar se sync-server está rodando

### Fase 6: Configurar Webhook Pagar.me
- [ ] Acessar dashboard do Pagar.me
- [ ] Criar webhook com URL: https://api.portalcertidao.org/webhooks/pagarme
- [ ] Selecionar eventos: transaction.paid, transaction.refunded
- [ ] Salvar webhook

### Fase 7: Testes
- [ ] Testar Health Check: `curl https://api.portalcertidao.org/health`
- [ ] Testar acesso ao PORTAL: https://www.portalcertidao.org
- [ ] Testar acesso à PLATAFORMA: https://plataforma.portalcertidao.org
- [ ] Testar acesso ao SOLICITE LINK: https://www.solicite.link
- [ ] Testar criação de ticket no PORTAL
- [ ] Testar geração de QR Code PIX
- [ ] Testar webhook do Pagar.me (fazer pagamento de teste)
- [ ] Verificar se ticket aparece na PLATAFORMA
- [ ] Verificar se confirmações (email/WhatsApp) são enviadas

---

## 🔑 Informações Importantes

### API Key
```
6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c
```

### Domínios
- **SOLICITE LINK**: www.solicite.link
- **PORTAL**: www.portalcertidao.org
- **PLATAFORMA**: plataforma.portalcertidao.org
- **API**: api.portalcertidao.org

### Credenciais Pagar.me (Teste)
- **Public Key**: `pk_test_lopqddXFGcRjqmKG`
- **Secret Key**: `sk_test_ec07154a6cb541fd9c3540af3e6b1efb`
- **Account ID**: `acc_rOZzALlImU3VqkvD`

### Webhook URL
```
https://api.portalcertidao.org/webhooks/pagarme
```

---

## 📚 Documentação de Referência

- `DEPLOY.md` - Guia completo de deploy
- `DEPLOY_RAPIDO.md` - Deploy rápido passo a passo
- `GUIA_PROXIMOS_PASSOS.md` - Guia detalhado
- `INTEGRACAO_PAGARME_RESUMO.md` - Resumo da integração Pagar.me
- `RESUMO_FINAL_PREPARACAO.md` - Resumo do que foi preparado

---

## 🚀 Comandos Rápidos

### No Servidor:
```bash
# Ver status do sync-server
pm2 status

# Ver logs do sync-server
pm2 logs sync-server

# Reiniciar sync-server
pm2 restart sync-server

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## ✅ Tudo Pronto!

Todos os arquivos estão preparados e buildados. Siga o `DEPLOY_RAPIDO.md` para fazer o deploy no servidor.
