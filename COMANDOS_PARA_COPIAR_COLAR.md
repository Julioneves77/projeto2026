# 📋 Comandos Prontos para Copiar/Colar

## 🚀 Deploy Completo - Execute na Ordem

---

## PASSO 1: Conectar ao Servidor

```bash
ssh usuario@143.198.10.145
```

**⚠️ IMPORTANTE**: Substitua `usuario` pelo seu usuário SSH.

---

## PASSO 2: Preparar Ambiente do Servidor

```bash
# Atualizar sistema
sudo apt-get update -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt-get install -y nginx

# Criar diretórios
sudo mkdir -p /var/www/portal/dist
sudo mkdir -p /var/www/plataforma/dist
sudo mkdir -p /var/www/solicite-link/dist
sudo mkdir -p /var/www/portal-certidao
sudo mkdir -p /var/www/portal-certidao/uploads
sudo mkdir -p /var/www/portal-certidao/logs

# Ajustar permissões (substitua 'usuario' pelo seu usuário)
sudo chown -R $USER:$USER /var/www/portal
sudo chown -R $USER:$USER /var/www/plataforma
sudo chown -R $USER:$USER /var/www/solicite-link
sudo chown -R $USER:$USER /var/www/portal-certidao
```

---

## PASSO 3: Upload dos Arquivos

**⚠️ Execute do SEU COMPUTADOR LOCAL (não no servidor):**

```bash
# Navegar até a pasta do projeto
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"

# Upload PORTAL
scp -r PORTAL/dist/* usuario@143.198.10.145:/var/www/portal/dist/

# Upload PLATAFORMA
scp -r PLATAFORMA/dist/* usuario@143.198.10.145:/var/www/plataforma/dist/

# Upload SOLICITE LINK
scp -r "SOLICITE LINK/dist/"* usuario@143.198.10.145:/var/www/solicite-link/dist/

# Upload sync-server
scp sync-server.js usuario@143.198.10.145:/var/www/portal-certidao/
scp -r services usuario@143.198.10.145:/var/www/portal-certidao/
scp -r utils usuario@143.198.10.145:/var/www/portal-certidao/
scp package.json usuario@143.198.10.145:/var/www/portal-certidao/
scp .env usuario@143.198.10.145:/var/www/portal-certidao/
scp ecosystem.config.js usuario@143.198.10.145:/var/www/portal-certidao/
```

**⚠️ Substitua `usuario` pelo seu usuário SSH.**

---

## PASSO 4: Configurar Nginx (No Servidor)

```bash
# Configuração PORTAL
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

# Configuração PLATAFORMA
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

# Configuração SOLICITE LINK
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

# Configuração PORTAL_ACESSO
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

# Configuração API
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
sudo ln -sf /etc/nginx/sites-available/portalcacesso.online /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.portalcertidao.org /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

---

## PASSO 5: Configurar SSL/HTTPS (No Servidor)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obter certificados (substitua o email se necessário)
sudo certbot --nginx -d www.portalcertidao.org -d portalcertidao.org --non-interactive --agree-tos --email contato@portalcertidao.org
sudo certbot --nginx -d plataforma.portalcertidao.org --non-interactive --agree-tos --email contato@portalcertidao.org
sudo certbot --nginx -d www.solicite.link -d solicite.link --non-interactive --agree-tos --email contato@portalcertidao.org
sudo certbot --nginx -d www.portalcacesso.online -d portalcacesso.online -d portalacesso.online --non-interactive --agree-tos --email contato@portalcertidao.org
sudo certbot --nginx -d api.portalcertidao.org --non-interactive --agree-tos --email contato@portalcertidao.org
```

---

## PASSO 6: Iniciar Sync-Server (No Servidor)

```bash
cd /var/www/portal-certidao

# Instalar dependências
npm install

# Iniciar com PM2
pm2 start sync-server.js --name sync-server

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
# Execute o comando que aparecer (será algo como: sudo env PATH=... pm2 startup systemd -u usuario --hp /home/usuario)
```

---

## PASSO 7: Verificar se Está Funcionando (No Servidor)

```bash
# Ver status do sync-server
pm2 status

# Ver logs do sync-server
pm2 logs sync-server

# Testar Health Check
curl http://localhost:3001/health

# Verificar se Nginx está rodando
sudo systemctl status nginx
```

---

## PASSO 8: Configurar Webhook no Pagar.me

**⚠️ Faça manualmente no dashboard do Pagar.me:**

1. Acesse: https://dashboard.pagar.me
2. Faça login
3. Vá em **Configurações** > **Webhooks**
4. Clique em **Adicionar Webhook** ou **Novo Webhook**
5. Configure:
   - **URL**: `https://api.portalcertidao.org/webhooks/pagarme`
   - **Eventos**: Selecione `transaction.paid` e `transaction.refunded`
   - **Método**: POST
6. Salve

---

## ✅ Testes Finais

### No Servidor:
```bash
# Health Check
curl https://api.portalcertidao.org/health

# Ver logs em tempo real
pm2 logs sync-server --lines 50
```

### No Navegador:
1. Acesse: https://www.solicite.link
2. Acesse: https://www.portalcertidao.org
3. Acesse: https://plataforma.portalcertidao.org

---

## 🆘 Troubleshooting

### Porta 3001 já em uso:
```bash
sudo lsof -i :3001
pm2 stop sync-server
pm2 delete sync-server
pm2 start sync-server.js --name sync-server
```

### Nginx não inicia:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Sync-server não inicia:
```bash
cd /var/www/portal-certidao
cat .env
pm2 logs sync-server
```

---

## 📝 Checklist Rápido

- [ ] Conectado ao servidor
- [ ] Dependências instaladas (Node.js, PM2, Nginx)
- [ ] Diretórios criados
- [ ] Arquivos enviados (builds + sync-server)
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Sync-server rodando (pm2 status)
- [ ] Webhook configurado no Pagar.me
- [ ] Testes realizados

---

## 🎯 Pronto!

Após executar todos os passos, seu sistema estará em produção! 🚀




