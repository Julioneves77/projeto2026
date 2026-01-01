# 🚀 DEPLOY AGORA - Guia Prático

## ⚠️ IMPORTANTE: Você precisa fazer isso no SERVIDOR (143.198.10.145)

---

## 📋 PASSO A PASSO COMPLETO

### 1️⃣ Conectar ao Servidor

```bash
ssh root@143.198.10.145
# ou
ssh seu_usuario@143.198.10.145
```

---

### 2️⃣ Preparar Estrutura de Diretórios

```bash
# Criar diretórios
sudo mkdir -p /var/www/portal/dist
sudo mkdir -p /var/www/plataforma/dist
sudo mkdir -p /var/www/solicite-link/dist
sudo mkdir -p /var/www/portal-certidao

# Dar permissões
sudo chown -R $USER:$USER /var/www/portal
sudo chown -R $USER:$USER /var/www/plataforma
sudo chown -R $USER:$USER /var/www/solicite-link
sudo chown -R $USER:$USER /var/www/portal-certidao
```

---

### 3️⃣ Instalar Dependências do Sistema

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Nginx (se não tiver)
sudo apt install -y nginx

# Instalar Certbot (para SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

### 4️⃣ Fazer Upload dos Arquivos

**OPÇÃO A: Usando SCP (do seu computador local)**

No seu computador local, execute:

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"

# Upload PORTAL
scp -r PORTAL/dist/* root@143.198.10.145:/var/www/portal/dist/

# Upload PLATAFORMA
scp -r PLATAFORMA/dist/* root@143.198.10.145:/var/www/plataforma/dist/

# Upload SOLICITE LINK
scp -r "SOLICITE LINK/dist/"* root@143.198.10.145:/var/www/solicite-link/dist/

# Upload sync-server
scp sync-server.js root@143.198.10.145:/var/www/portal-certidao/
scp -r services root@143.198.10.145:/var/www/portal-certidao/
scp -r utils root@143.198.10.145:/var/www/portal-certidao/
scp package.json root@143.198.10.145:/var/www/portal-certidao/
scp .env root@143.198.10.145:/var/www/portal-certidao/
scp ecosystem.config.js root@143.198.10.145:/var/www/portal-certidao/
```

**OPÇÃO B: Usando Git (se tiver repositório)**

No servidor:

```bash
cd /var/www/portal-certidao
git clone seu_repositorio .
# ou fazer upload manual dos arquivos
```

---

### 5️⃣ Configurar Sync-Server

No servidor:

```bash
cd /var/www/portal-certidao

# Instalar dependências
npm install

# Verificar se .env está configurado
cat .env | grep -E "PORT|PUBLIC_BASE_URL|SYNC_SERVER_API_KEY"
```

---

### 6️⃣ Configurar Nginx

No servidor, criar os arquivos de configuração:

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

# Recarregar Nginx
sudo systemctl reload nginx
```

---

### 7️⃣ Configurar SSL (HTTPS)

```bash
# Obter certificados SSL
sudo certbot --nginx -d www.portalcertidao.org -d portalcertidao.org
sudo certbot --nginx -d plataforma.portalcertidao.org
sudo certbot --nginx -d www.solicite.link -d solicite.link
sudo certbot --nginx -d api.portalcertidao.org

# Renovação automática (já configurado automaticamente)
sudo certbot renew --dry-run
```

---

### 8️⃣ Iniciar Sync-Server com PM2

```bash
cd /var/www/portal-certidao

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# (execute o comando que aparecer)
```

---

### 9️⃣ Verificar se Está Funcionando

```bash
# Verificar status do PM2
pm2 status

# Verificar logs
pm2 logs sync-server

# Verificar Nginx
sudo systemctl status nginx

# Testar endpoints
curl http://localhost:3001/health
curl http://localhost
```

---

### 🔟 Testar os Sites

Abra no navegador:
- http://www.portalcertidao.org (ou https:// após SSL)
- http://www.plataforma.portalcertidao.org
- http://www.solicite.link
- http://api.portalcertidao.org/health

---

## ⚠️ PROBLEMAS COMUNS

### Porta 80/443 já em uso
```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### Nginx não inicia
```bash
sudo nginx -t  # Verificar erros
sudo tail -f /var/log/nginx/error.log
```

### PM2 não inicia
```bash
cd /var/www/portal-certidao
node sync-server.js  # Testar manualmente
pm2 logs sync-server  # Ver logs
```

### DNS não resolve
- Verificar se DNS está apontando para 143.198.10.145
- Aguardar propagação (pode levar até 48h)

---

## ✅ CHECKLIST FINAL

- [ ] Arquivos enviados para o servidor
- [ ] Nginx configurado e rodando
- [ ] SSL configurado (HTTPS)
- [ ] Sync-server rodando com PM2
- [ ] Sites acessíveis via navegador
- [ ] API respondendo em /health

---

## 📞 PRÓXIMOS PASSOS

1. Testar cada site no navegador
2. Verificar se SSL está funcionando (https://)
3. Testar criação de ticket no PORTAL
4. Verificar se tickets aparecem na PLATAFORMA
5. Configurar webhook do Pagar.me (já está pronto no código)

---

**Pronto! Seu sistema está no ar! 🚀**

