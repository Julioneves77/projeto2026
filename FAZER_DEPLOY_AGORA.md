# 🚀 FAZER DEPLOY AGORA - Guia Rápido

## ⚠️ VOCÊ PRECISA FAZER ISSO NO SERVIDOR (143.198.10.145)

Os sites estão antigos porque o deploy ainda não foi feito. Siga estes passos:

---

## 📋 PASSO A PASSO

### 1️⃣ **Conectar ao Servidor**

```bash
ssh root@143.198.10.145
# ou
ssh seu_usuario@143.198.10.145
```

---

### 2️⃣ **Preparar Servidor (Execute no Servidor)**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Criar diretórios
sudo mkdir -p /var/www/portal/dist
sudo mkdir -p /var/www/plataforma/dist
sudo mkdir -p /var/www/solicite-link/dist
sudo mkdir -p /var/www/portal-certidao
sudo mkdir -p /var/www/portal-certidao/uploads
sudo mkdir -p /var/www/portal-certidao/logs

# Dar permissões
sudo chown -R $USER:$USER /var/www/portal
sudo chown -R $USER:$USER /var/www/plataforma
sudo chown -R $USER:$USER /var/www/solicite-link
sudo chown -R $USER:$USER /var/www/portal-certidao
```

---

### 3️⃣ **Fazer Upload dos Arquivos (Execute no SEU COMPUTADOR)**

Abra um **NOVO TERMINAL** no seu computador e execute:

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"

# Upload PORTAL
scp -r PORTAL/dist/* root@143.198.10.145:/var/www/portal/dist/

# Upload PLATAFORMA  
scp -r PLATAFORMA/dist/* root@143.198.10.145:/var/www/plataforma/dist/

# Upload SOLICITE LINK
scp -r "SOLICITE LINK/dist/"* root@143.198.10.145:/var/www/solicite-link/dist/

# Upload sync-server e dependências
scp sync-server.js root@143.198.10.145:/var/www/portal-certidao/
scp -r services root@143.198.10.145:/var/www/portal-certidao/
scp -r utils root@143.198.10.145:/var/www/portal-certidao/
scp package.json root@143.198.10.145:/var/www/portal-certidao/
scp ecosystem.config.js root@143.198.10.145:/var/www/portal-certidao/
```

**⚠️ IMPORTANTE**: Você também precisa enviar o arquivo `.env`. Como ele pode ter informações sensíveis, você pode:

**Opção A**: Criar o `.env` diretamente no servidor (mais seguro)
**Opção B**: Enviar via scp se tiver certeza que está seguro

```bash
# Opção B (se quiser enviar)
scp .env root@143.198.10.145:/var/www/portal-certidao/
```

---

### 4️⃣ **Configurar Sync-Server (No Servidor)**

```bash
cd /var/www/portal-certidao

# Instalar dependências
npm install

# Verificar se .env existe e está configurado
cat .env | head -20
```

Se o `.env` não existir, crie-o:

```bash
nano .env
```

Cole o conteúdo do `.env` que você tem localmente (com os valores de produção).

---

### 5️⃣ **Configurar Nginx (No Servidor)**

Execute cada bloco separadamente:

```bash
# PORTAL
sudo tee /etc/nginx/sites-available/portalcertidao.org > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.portalcertidao.org portalcertidao.org;
    root /var/www/portal/dist;
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

# PLATAFORMA
sudo tee /etc/nginx/sites-available/plataforma.portalcertidao.org > /dev/null << 'EOF'
server {
    listen 80;
    server_name plataforma.portalcertidao.org;
    root /var/www/plataforma/dist;
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

# SOLICITE LINK
sudo tee /etc/nginx/sites-available/solicite.link > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.solicite.link solicite.link;
    root /var/www/solicite-link/dist;
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

# API
sudo tee /etc/nginx/sites-available/api.portalcertidao.org > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.portalcertidao.org;
    client_max_body_size 50M;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Habilitar sites
sudo ln -sf /etc/nginx/sites-available/portalcertidao.org /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/plataforma.portalcertidao.org /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/solicite.link /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.portalcertidao.org /etc/nginx/sites-enabled/

# Remover default
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se der OK, recarregar
sudo systemctl reload nginx
```

---

### 6️⃣ **Configurar SSL/HTTPS (No Servidor)**

```bash
# Obter certificados SSL para cada domínio
sudo certbot --nginx -d www.portalcertidao.org -d portalcertidao.org
sudo certbot --nginx -d plataforma.portalcertidao.org
sudo certbot --nginx -d www.solicite.link -d solicite.link
sudo certbot --nginx -d api.portalcertidao.org
```

Siga as instruções do Certbot (ele vai perguntar seu email e se quer redirecionar HTTP para HTTPS).

---

### 7️⃣ **Iniciar Sync-Server (No Servidor)**

```bash
cd /var/www/portal-certidao

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
# Execute o comando que aparecer (algo como: sudo env PATH=...)
```

---

### 8️⃣ **Verificar se Está Funcionando**

```bash
# Verificar PM2
pm2 status
pm2 logs sync-server --lines 50

# Verificar Nginx
sudo systemctl status nginx

# Testar API
curl http://localhost:3001/health
```

---

### 9️⃣ **Testar no Navegador**

Abra e teste:
- ✅ https://www.portalcertidao.org
- ✅ https://plataforma.portalcertidao.org
- ✅ https://www.solicite.link
- ✅ https://api.portalcertidao.org/health

---

## ⚠️ PROBLEMAS COMUNS

### "Permission denied" ao fazer upload
```bash
# No servidor, dar permissões
sudo chown -R $USER:$USER /var/www/*
```

### Nginx não inicia
```bash
sudo nginx -t  # Ver erros
sudo tail -f /var/log/nginx/error.log
```

### PM2 não inicia
```bash
cd /var/www/portal-certidao
node sync-server.js  # Testar manualmente
# Se funcionar, então:
pm2 start ecosystem.config.js
pm2 logs sync-server
```

### DNS não resolve
- Verifique se os DNS estão apontando para `143.198.10.145`
- Pode levar até 48h para propagar

---

## ✅ CHECKLIST

- [ ] Servidor preparado (Node.js, PM2, Nginx instalados)
- [ ] Arquivos enviados para o servidor
- [ ] `.env` configurado no servidor
- [ ] Nginx configurado e rodando
- [ ] SSL configurado (HTTPS)
- [ ] Sync-server rodando com PM2
- [ ] Sites acessíveis no navegador

---

## 🎯 PRÓXIMO PASSO

Depois que tudo estiver funcionando, configure o webhook do Pagar.me:
1. Acesse: https://dashboard.pagar.me
2. Configurações > Webhooks
3. URL: `https://api.portalcertidao.org/webhooks/pagarme`
4. Eventos: `order.paid`

---

**Pronto! Siga os passos acima e seus sites estarão funcionando! 🚀**



