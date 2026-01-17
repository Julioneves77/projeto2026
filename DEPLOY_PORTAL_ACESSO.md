# Deploy Portal Acesso - Guia Rápido

## 🚀 Deploy Automático

Execute o script de deploy:

```bash
./deploy-portal-acesso.sh [usuario_ssh]
```

**Exemplo:**
```bash
./deploy-portal-acesso.sh root
```

O script irá:
1. ✅ Verificar se o build existe (ou fazer build automaticamente)
2. ✅ Criar diretório no servidor
3. ✅ Fazer upload dos arquivos
4. ✅ Configurar nginx automaticamente
5. ✅ Recarregar nginx

## 📋 Deploy Manual

Se preferir fazer manualmente:

### 1. Fazer Build (se necessário)

```bash
cd PORTAL_ACESSO
npm run build
cd ..
```

### 2. Upload para o Servidor

```bash
# Substitua 'usuario' pelo seu usuário SSH
rsync -avz --delete PORTAL_ACESSO/dist/ usuario@143.198.10.145:/var/www/portal-acesso/dist/
```

### 3. Configurar Nginx no Servidor

```bash
# Conectar ao servidor
ssh usuario@143.198.10.145

# Executar script de configuração
sudo bash scripts/configure-portal-acesso.sh
```

**OU** configurar manualmente:

```bash
# No servidor
sudo tee /etc/nginx/sites-available/portalcacesso.online > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.portalcacesso.online portalcacesso.online portalacesso.online;
    
    root /var/www/portal-acesso/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/portalcacesso.online /etc/nginx/sites-enabled/

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configurar SSL (Opcional)

```bash
sudo certbot --nginx -d www.portalcacesso.online -d portalcacesso.online -d portalacesso.online
```

## ✅ Verificação

Após o deploy:

1. Verifique se o domínio está apontando para o servidor:
   ```bash
   dig portalcacesso.online
   ```

2. Teste o acesso:
   - http://portalcacesso.online
   - http://www.portalcacesso.online

3. Verifique se o GTM está carregando (GTM-W7PVKNQS)

## 🔧 Troubleshooting

### Erro: "Diretório não encontrado"
```bash
# No servidor
sudo mkdir -p /var/www/portal-acesso/dist
sudo chown -R $USER:$USER /var/www/portal-acesso
```

### Erro: "Nginx não recarrega"
```bash
# Verificar logs
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Site não carrega
1. Verifique se o DNS está correto
2. Verifique se o nginx está rodando: `sudo systemctl status nginx`
3. Verifique os logs: `sudo tail -f /var/log/nginx/error.log`

