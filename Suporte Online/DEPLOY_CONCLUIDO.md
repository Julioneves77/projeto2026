# ✅ Deploy Concluído - Verificação Assistida

## Status do Deploy

✅ **Build de produção**: Concluído  
✅ **Upload para servidor**: Concluído  
✅ **Configuração Nginx**: Concluído  
⏳ **SSL/HTTPS**: Aguardando propagação DNS  

## Informações do Deploy

- **Domínio**: www.verificacaoassistida.online
- **Servidor**: 143.198.10.145
- **Diretório**: /var/www/verificacao-assistida/dist
- **Nginx**: Configurado e ativo

## Próximos Passos

### 1. Aguardar Propagação DNS

O DNS foi configurado recentemente e pode levar alguns minutos ou horas para propagar completamente. Você pode verificar a propagação com:

```bash
dig www.verificacaoassistida.online
# ou
nslookup www.verificacaoassistida.online
```

### 2. Configurar SSL/HTTPS

Após o DNS propagar completamente, execute no servidor:

```bash
ssh root@143.198.10.145
sudo certbot --nginx -d www.verificacaoassistida.online -d verificacaoassistida.online
```

Ou se preferir não-interativo:

```bash
ssh root@143.198.10.145 "sudo certbot --nginx -d www.verificacaoassistida.online -d verificacaoassistida.online --non-interactive --agree-tos --email contato@portalcertidao.org --redirect"
```

### 3. Verificar Funcionamento

Após o SSL estar configurado:

1. Acesse: https://www.verificacaoassistida.online
2. Verifique se o site carrega corretamente
3. Teste o formulário de contato
4. Teste a geração do QR Code PIX
5. Verifique os logs do servidor se necessário

## Verificações

### Verificar se o site está respondendo (via IP)

```bash
curl -H "Host: www.verificacaoassistida.online" http://143.198.10.145
```

### Verificar logs do Nginx

```bash
ssh root@143.198.10.145
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Verificar status do Nginx

```bash
ssh root@143.198.10.145
sudo systemctl status nginx
sudo nginx -t
```

## Variáveis de Ambiente Configuradas

As seguintes variáveis foram incorporadas no build:

- `VITE_SYNC_SERVER_URL=https://api.portalcertidao.org`
- `VITE_SYNC_SERVER_API_KEY` (configurada)

## Estrutura no Servidor

```
/var/www/verificacao-assistida/
└── dist/
    ├── index.html
    ├── assets/
    │   ├── index-*.css
    │   └── index-*.js
    ├── favicon.ico
    └── robots.txt
```

## Configuração Nginx

O arquivo de configuração está em:
```
/etc/nginx/sites-available/verificacaoassistida.online
```

E habilitado em:
```
/etc/nginx/sites-enabled/verificacaoassistida.online
```

## Troubleshooting

### Site não carrega

1. Verifique se o DNS propagou: `dig www.verificacaoassistida.online`
2. Verifique se o Nginx está rodando: `sudo systemctl status nginx`
3. Verifique os logs: `sudo tail -f /var/log/nginx/error.log`

### Erro 502 Bad Gateway

- Verifique se os arquivos estão no diretório correto
- Verifique as permissões: `sudo chown -R www-data:www-data /var/www/verificacao-assistida`

### SSL não funciona

- Aguarde a propagação completa do DNS (pode levar até 48 horas)
- Verifique se o DNS aponta para o IP correto: `dig www.verificacaoassistida.online`
- Tente novamente o certbot após algumas horas

## Comandos Úteis

### Fazer novo deploy

```bash
cd "Suporte Online"
npm run build
cd ..
./deploy-verificacao-assistida.sh root
```

### Recarregar Nginx

```bash
ssh root@143.198.10.145 "sudo nginx -t && sudo systemctl reload nginx"
```

### Verificar espaço em disco

```bash
ssh root@143.198.10.145 "df -h"
```

## Data do Deploy

**Data**: 15 de Janeiro de 2026  
**Hora**: ~15:58 UTC

