# 🚀 Deploy Rápido - Passo a Passo

## Pré-requisitos
- Acesso SSH ao servidor (IP: 143.198.10.145)
- Usuário com permissões sudo

---

## Opção 1: Deploy Automatizado (Recomendado)

### No Servidor:

```bash
# 1. Conectar ao servidor
ssh usuario@143.198.10.145

# 2. Clonar repositório ou fazer upload dos arquivos
cd /var/www
git clone <seu-repositorio> portal-certidao
# OU fazer upload via SCP/rsync

# 3. Executar script de preparação
cd portal-certidao
bash scripts/deploy.sh

# 4. Fazer upload dos builds (se ainda não fez)
# Do seu computador local:
# bash scripts/upload-files.sh

# 5. Configurar Nginx
sudo bash scripts/configure-nginx.sh

# 6. Configurar SSL
sudo bash scripts/configure-ssl.sh

# 7. Iniciar serviços
bash scripts/start-services.sh
```

---

## Opção 2: Deploy Manual

### 1. Conectar ao Servidor
```bash
ssh usuario@143.198.10.145
```

### 2. Instalar Dependências
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# Nginx
sudo apt-get update
sudo apt-get install -y nginx
```

### 3. Criar Estrutura de Diretórios
```bash
sudo mkdir -p /var/www/portal/dist
sudo mkdir -p /var/www/plataforma/dist
sudo mkdir -p /var/www/solicite-link/dist
sudo mkdir -p /var/www/portal-certidao
sudo mkdir -p /var/www/portal-certidao/uploads
sudo mkdir -p /var/www/portal-certidao/logs

# Ajustar permissões
sudo chown -R $USER:$USER /var/www/portal
sudo chown -R $USER:$USER /var/www/plataforma
sudo chown -R $USER:$USER /var/www/solicite-link
sudo chown -R $USER:$USER /var/www/portal-certidao
```

### 4. Upload dos Arquivos

**Do seu computador local:**
```bash
# Upload builds
scp -r PORTAL/dist/* usuario@143.198.10.145:/var/www/portal/dist/
scp -r PLATAFORMA/dist/* usuario@143.198.10.145:/var/www/plataforma/dist/
scp -r "SOLICITE LINK/dist/*" usuario@143.198.10.145:/var/www/solicite-link/dist/

# Upload sync-server
scp sync-server.js usuario@143.198.10.145:/var/www/portal-certidao/
scp -r services usuario@143.198.10.145:/var/www/portal-certidao/
scp -r utils usuario@143.198.10.145:/var/www/portal-certidao/
scp package.json usuario@143.198.10.145:/var/www/portal-certidao/
scp .env usuario@143.198.10.145:/var/www/portal-certidao/
```

### 5. Configurar Nginx

Copie os arquivos de configuração de `scripts/configure-nginx.sh` ou use os templates em `DEPLOY.md`.

### 6. Configurar SSL
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.portalcertidao.org -d portalcertidao.org
sudo certbot --nginx -d plataforma.portalcertidao.org
sudo certbot --nginx -d www.solicite.link -d solicite.link
sudo certbot --nginx -d api.portalcertidao.org
```

### 7. Iniciar Sync-Server
```bash
cd /var/www/portal-certidao
npm install
pm2 start sync-server.js --name sync-server
pm2 save
pm2 startup
```

### 8. Configurar Webhook no Pagar.me
1. Acesse: https://dashboard.pagar.me
2. Configurações > Webhooks
3. URL: `https://api.portalcertidao.org/webhooks/pagarme`
4. Eventos: `transaction.paid`, `transaction.refunded`

---

## ✅ Verificação Pós-Deploy

```bash
# Health Check
curl https://api.portalcertidao.org/health

# Ver logs
pm2 logs sync-server

# Status dos serviços
pm2 list
```

---

## 🆘 Troubleshooting

### Porta 3001 já em uso
```bash
# Verificar o que está usando a porta
sudo lsof -i :3001

# Parar processo se necessário
pm2 stop sync-server
```

### Nginx não inicia
```bash
# Verificar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log
```

### Sync-server não inicia
```bash
# Verificar .env
cat /var/www/portal-certidao/.env

# Ver logs
pm2 logs sync-server

# Reiniciar
pm2 restart sync-server
```

