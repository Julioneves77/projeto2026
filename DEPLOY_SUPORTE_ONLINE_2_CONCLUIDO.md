# ✅ Deploy do SUPORTE ONLINE 2 Concluído

## Data do Deploy
**Data**: 18 de Janeiro de 2026  
**Hora**: ~15:56 UTC

## Status do Deploy

✅ **Build de produção**: Concluído  
✅ **Upload para servidor**: Concluído  
✅ **Configuração Nginx**: Concluído  
✅ **Permissões**: Configuradas  
✅ **CORS atualizado**: Incluído suporteonline.digital  
✅ **SendPulse configurado**: Já estava configurado para suporteonline.digital  

## Informações do Deploy

- **Domínio**: www.suporteonline.digital
- **Servidor**: 143.198.10.145
- **Diretório**: /var/www/suporte-online/dist
- **Template**: SUPORTE ONLINE 2 (substituiu o template anterior)
- **API Sync-Server**: https://plataforma.portalcertidao.org/api

## Arquivos Modificados

1. ✅ **SUPORTE ONLINE 2/VARIAVEIS_AMBIENTE_PRODUCAO.md** - Criado arquivo de documentação das variáveis de ambiente
2. ✅ **deploy-suporte-online.sh** - Atualizado para usar `SUPORTE ONLINE 2/dist` ao invés de `Suporte Online/dist`
3. ✅ **sync-server.js** - Atualizado CORS para incluir automaticamente `https://www.suporteonline.digital` e `https://suporteonline.digital`

## Configurações Verificadas

### SendPulse
- ✅ Já configurado para `suporteonline.digital` em `services/sendPulseService.js`
- ✅ Função `getSenderByDomain()` mapeia corretamente o domínio
- ✅ Variáveis de ambiente: `SUPORTE_SENDER_EMAIL`, `SUPORTE_SENDER_NAME`

### CORS
- ✅ `sync-server.js` atualizado para incluir automaticamente:
  - `https://www.suporteonline.digital`
  - `https://suporteonline.digital`
  - `http://www.suporteonline.digital`
  - `http://suporteonline.digital`

### Pagar.me Webhook
- ✅ URL do webhook: `https://plataforma.portalcertidao.org/api/webhooks/pagarme`
- ✅ Processa eventos: `order.paid`, `charge.paid`, `transaction.paid`
- ✅ Após pagamento confirmado:
  - Atualiza ticket para `EM_OPERACAO`
  - Envia email via SendPulse
  - Envia WhatsApp via Zap API
  - Envia ticket para plataforma

## Variáveis de Ambiente Configuradas no Build

As seguintes variáveis foram incorporadas no build:

- `VITE_SYNC_SERVER_URL=https://plataforma.portalcertidao.org/api`
- `VITE_SYNC_SERVER_API_KEY` (se necessário, configurar no servidor)

## Estrutura no Servidor

```
/var/www/suporte-online/
└── dist/
    ├── index.html
    ├── assets/
    │   ├── index-f500Y78L.css
    │   └── index-oo2QSHxA.js
    ├── favicon.ico
    ├── favicon.png
    ├── placeholder.svg
    └── robots.txt
```

## Próximos Passos para Teste

### 1. Verificar Site no Navegador
- Acessar: https://www.suporteonline.digital (ou http:// se SSL não estiver configurado)
- Verificar se a página inicial carrega corretamente

### 2. Testar Fluxo Completo

1. **Acessar página inicial**
   - URL: https://www.suporteonline.digital

2. **Preencher formulário em `/iniciar`**
   - Preencher todos os campos obrigatórios
   - Submeter formulário

3. **Verificar criação do ticket**
   - Verificar logs do sync-server
   - Verificar se ticket foi criado com sucesso
   - Verificar código do ticket gerado

4. **Verificar redirecionamento para `/pix`**
   - Deve redirecionar automaticamente após criação do ticket
   - Verificar se página PIX carrega corretamente

5. **Verificar geração do QR Code PIX**
   - Verificar se QR Code é exibido
   - Verificar se código PIX copiável está presente
   - Verificar data de expiração

6. **Simular ou aguardar pagamento**
   - Pagar via PIX (ou simular via dashboard Pagar.me)
   - Aguardar confirmação do pagamento

7. **Verificar webhook do Pagar.me**
   - Verificar logs do sync-server para recebimento do webhook
   - Verificar se ticket foi atualizado para `EM_OPERACAO`

8. **Verificar envio de email de confirmação**
   - Verificar se email foi enviado via SendPulse
   - Verificar logs do SendPulse
   - Verificar se email chegou na caixa de entrada

9. **Verificar envio de WhatsApp**
   - Verificar se mensagem foi enviada via Zap API
   - Verificar logs do Zap API

10. **Verificar envio para plataforma**
    - Verificar se ticket foi enviado para a plataforma
    - Verificar se ticket aparece na plataforma

## Comandos Úteis

### Verificar logs do sync-server
```bash
ssh root@143.198.10.145
pm2 logs sync-server
# ou
tail -f /var/log/sync-server.log
```

### Verificar status do Nginx
```bash
ssh root@143.198.10.145
sudo systemctl status nginx
sudo nginx -t
```

### Verificar arquivos no servidor
```bash
ssh root@143.198.10.145
ls -la /var/www/suporte-online/dist/
```

### Fazer novo deploy
```bash
cd "SUPORTE ONLINE 2"
VITE_SYNC_SERVER_URL=https://plataforma.portalcertidao.org/api npm run build
cd ..
./deploy-suporte-online.sh root
```

### Recarregar Nginx
```bash
ssh root@143.198.10.145 "sudo nginx -t && sudo systemctl reload nginx"
```

## Troubleshooting

### Site não carrega
1. Verificar se DNS está apontando corretamente: `dig www.suporteonline.digital`
2. Verificar se Nginx está rodando: `sudo systemctl status nginx`
3. Verificar logs: `sudo tail -f /var/log/nginx/error.log`

### Erro 502 Bad Gateway
- Verificar se os arquivos estão no diretório correto
- Verificar permissões: `sudo chown -R www-data:www-data /var/www/suporte-online`

### CORS Error
- Verificar se `https://www.suporteonline.digital` está na variável `CORS_ORIGINS` do sync-server
- Verificar logs do sync-server para erros de CORS

### PIX não gera QR Code
- Verificar logs do sync-server
- Verificar configuração do Pagar.me
- Verificar se `VITE_SYNC_SERVER_URL` está correto no build

### Email não é enviado
- Verificar logs do SendPulse no sync-server
- Verificar configuração do SendPulse (`SENDPULSE_CLIENT_ID`, `SENDPULSE_CLIENT_SECRET`)
- Verificar se email do remetente está verificado no SendPulse

## Notas Importantes

- O template anterior foi completamente substituído pelo SUPORTE ONLINE 2
- O diretório no servidor permanece o mesmo: `/var/www/suporte-online/dist`
- O domínio permanece o mesmo: `www.suporteonline.digital`
- A configuração do Nginx não foi alterada (já estava correta)
- O sync-server já estava configurado para processar tickets de suporteonline.digital
- O SendPulse já estava configurado para enviar emails com remetente de suporteonline.digital
- O Pagar.me webhook já estava configurado para processar pagamentos e enviar confirmações

