# Configurar HTTPS para Portal Acesso

## 🚀 Configuração Rápida

### Opção 1: Script Automático (Recomendado)

No servidor, execute:

```bash
sudo bash scripts/configure-ssl-portal-acesso.sh
```

### Opção 2: Comando Manual

No servidor, execute:

```bash
sudo certbot --nginx \
    -d www.portalcacesso.online \
    -d portalcacesso.online \
    -d portalacesso.online \
    --non-interactive \
    --agree-tos \
    --email contato@portalcertidao.org \
    --redirect
```

## ✅ Verificações Antes de Configurar SSL

1. **O site está funcionando em HTTP?**
   ```bash
   curl -I http://portalcacesso.online
   ```
   Deve retornar `200 OK`

2. **O nginx está configurado?**
   ```bash
   sudo nginx -t
   ```
   Deve retornar `syntax is ok`

3. **O domínio está apontando para o servidor?**
   ```bash
   dig portalcacesso.online +short
   ```
   Deve retornar o IP do servidor (143.198.10.145)

4. **A porta 80 está acessível?**
   ```bash
   sudo netstat -tlnp | grep :80
   ```
   Deve mostrar que o nginx está escutando na porta 80

## 🔧 Troubleshooting

### Erro: "Could not find a virtual host"

**Solução:** Certifique-se de que o site está configurado no nginx:
```bash
sudo bash scripts/configure-portal-acesso.sh
```

### Erro: "Failed to obtain certificate"

**Possíveis causas:**
1. DNS não está apontando para o servidor
2. Porta 80 está bloqueada no firewall
3. Domínio já tem certificado configurado

**Solução:**
```bash
# Verificar DNS
dig portalcacesso.online

# Verificar firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar certificados existentes
sudo certbot certificates
```

### Erro: "Connection refused"

**Solução:** Verificar se o nginx está rodando:
```bash
sudo systemctl status nginx
sudo systemctl start nginx
```

## 📋 Após Configurar SSL

1. **Testar HTTPS:**
   ```bash
   curl -I https://portalcacesso.online
   ```

2. **Verificar redirecionamento HTTP -> HTTPS:**
   ```bash
   curl -I http://portalcacesso.online
   ```
   Deve retornar `301 Moved Permanently` com `Location: https://...`

3. **Verificar certificado:**
   ```bash
   echo | openssl s_client -servername portalcacesso.online -connect portalcacesso.online:443 2>/dev/null | openssl x509 -noout -dates
   ```

## 🔄 Renovação Automática

O Certbot configura renovação automática automaticamente. Para testar:

```bash
sudo certbot renew --dry-run
```

## ✅ Checklist

- [ ] Site funcionando em HTTP
- [ ] Nginx configurado e rodando
- [ ] DNS apontando para o servidor
- [ ] Porta 80 acessível
- [ ] Certificado SSL obtido
- [ ] HTTPS funcionando
- [ ] Redirecionamento HTTP -> HTTPS funcionando
- [ ] Renovação automática configurada

## 🌐 Testar no Navegador

Após configurar, teste:
- ✅ https://portalcacesso.online
- ✅ https://www.portalcacesso.online
- ✅ http://portalcacesso.online (deve redirecionar para HTTPS)

