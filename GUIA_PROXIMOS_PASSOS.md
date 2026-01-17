# Guia de Próximos Passos - Deploy

## 📋 Checklist de Ações Necessárias

### ✅ 1. Gerar API Key do Sync-Server

Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie a chave gerada (será usada em vários lugares).

---

### ✅ 2. Configurar Variáveis de Ambiente

#### 2.1. Sync-Server (Raiz do projeto)

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
cp .env.example .env
```

Edite o arquivo `.env` e configure:
```env
NODE_ENV=production
PORT=3001
PUBLIC_BASE_URL=https://api.portalcertidao.org
SYNC_SERVER_API_KEY=<cole-a-chave-gerada-aqui>
CORS_ORIGINS=https://www.portalcertidao.org,https://plataforma.portalcertidao.org,https://www.solicite.link
FORCE_RESEND=false

# SendPulse (já configurado)
SENDPULSE_CLIENT_ID=add9a5c88271d94ec87d6016fa01d58e
SENDPULSE_CLIENT_SECRET=33a983c762b866c6c6074abefc8f71c1
SENDPULSE_SENDER_EMAIL=contato@portalcertidao.org
SENDPULSE_SENDER_NAME=Portal Certidão

# Zap API (já configurado)
ZAP_API_URL=https://api.z-api.io/v1
ZAP_API_KEY=3EAB7866FE55B1BEB70D52B01C4B842D
ZAP_CLIENT_TOKEN=F8337947b89a14ae78d92f6365523269bS

# Pagar.me (já configurado)
PAGARME_ACCOUNT_ID=acc_rOZzALlImU3VqkvD
PAGARME_SECRET_KEY=sk_test_ec07154a6cb541fd9c3540af3e6b1efb
```

#### 2.2. PORTAL

```bash
cd PORTAL
cp .env.example .env.local
```

Edite o arquivo `.env.local` e configure:
```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_SYNC_SERVER_API_KEY=<mesma-chave-gerada-acima>
VITE_RECAPTCHA_SITE_KEY=6Ld13bsrAAAAACyH9-lzVqe6e-NV5eXEkUlU-Q_w
VITE_PAGARME_PUBLIC_KEY=pk_test_lopqddXFGcRjqmKG
VITE_SOLICITE_LINK_URL=https://www.solicite.link
```

#### 2.3. PLATAFORMA

```bash
cd ../PLATAFORMA
cp .env.example .env.local
```

Edite o arquivo `.env.local` e configure:
```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_SYNC_SERVER_API_KEY=<mesma-chave-gerada-acima>
```

#### 2.4. SOLICITE LINK

```bash
cd "../SOLICITE LINK"
cp .env.example .env.local
```

Edite o arquivo `.env.local` e configure:
```env
VITE_PORTAL_URL=https://www.portalcertidao.org
VITE_GTM_CONTAINER_ID=GTM-5M37FK67
```

---

### ✅ 3. Fazer Builds de Produção

#### 3.1. PORTAL
```bash
cd PORTAL
npm run build
```
Arquivos estarão em `PORTAL/dist/`

#### 3.2. PLATAFORMA
```bash
cd ../PLATAFORMA
npm run build
```
Arquivos estarão em `PLATAFORMA/dist/`

#### 3.3. SOLICITE LINK
```bash
cd "../SOLICITE LINK"
npm run build
```
Arquivos estarão em `SOLICITE LINK/dist/`

---

### ✅ 4. Configurar Infraestrutura no Servidor (IP: 143.198.10.145)

#### 4.1. Conectar ao Servidor
```bash
ssh usuario@143.198.10.145
```

#### 4.2. Instalar Dependências
```bash
# Node.js 18+ (se não estiver instalado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (gerenciador de processos)
sudo npm install -g pm2

# Nginx (servidor web)
sudo apt-get update
sudo apt-get install -y nginx
```

#### 4.3. Upload dos Arquivos

**Opção A: Via Git (Recomendado)**
```bash
# No servidor
cd /var/www
git clone <seu-repositorio> portal-certidao
cd portal-certidao
npm install  # Instalar dependências do sync-server
```

**Opção B: Via SCP**
```bash
# Do seu computador local
scp -r PORTAL/dist usuario@143.198.10.145:/var/www/portal/dist
scp -r PLATAFORMA/dist usuario@143.198.10.145:/var/www/plataforma/dist
scp -r "SOLICITE LINK/dist" usuario@143.198.10.145:/var/www/solicite-link/dist
scp sync-server.js usuario@143.198.10.145:/var/www/portal-certidao/
scp -r services usuario@143.198.10.145:/var/www/portal-certidao/
scp -r utils usuario@143.198.10.145:/var/www/portal-certidao/
scp package.json usuario@143.198.10.145:/var/www/portal-certidao/
scp .env usuario@143.198.10.145:/var/www/portal-certidao/
```

#### 4.4. Configurar Nginx

**Configuração para PORTAL** (`/etc/nginx/sites-available/portalcertidao.org`):
```nginx
server {
    listen 80;
    server_name www.portalcertidao.org portalcertidao.org;
    
    root /var/www/portal/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSL (será configurado com Let's Encrypt)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/portalcertidao.org/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/portalcertidao.org/privkey.pem;
}
```

**Configuração para PLATAFORMA** (`/etc/nginx/sites-available/plataforma.portalcertidao.org`):
```nginx
server {
    listen 80;
    server_name plataforma.portalcertidao.org;
    
    root /var/www/plataforma/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Configuração para SOLICITE LINK** (`/etc/nginx/sites-available/solicite.link`):
```nginx
server {
    listen 80;
    server_name www.solicite.link solicite.link;
    
    root /var/www/solicite-link/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Configuração para PORTAL_ACESSO** (`/etc/nginx/sites-available/portalcacesso.online`):
```nginx
server {
    listen 80;
    server_name www.portalcacesso.online portalcacesso.online portalacesso.online;
    
    root /var/www/portal-acesso/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Configuração para API** (`/etc/nginx/sites-available/api.portalcertidao.org`):
```nginx
server {
    listen 80;
    server_name api.portalcertidao.org;

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
```

**Habilitar sites:**
```bash
sudo ln -s /etc/nginx/sites-available/portalcertidao.org /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/plataforma.portalcertidao.org /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/solicite.link /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/portalcacesso.online /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.portalcertidao.org /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx
```

#### 4.5. Configurar SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obter certificados
sudo certbot --nginx -d www.portalcertidao.org -d portalcertidao.org
sudo certbot --nginx -d plataforma.portalcertidao.org
sudo certbot --nginx -d www.solicite.link -d solicite.link
sudo certbot --nginx -d www.portalcacesso.online -d portalcacesso.online -d portalacesso.online
sudo certbot --nginx -d api.portalcertidao.org

# Renovação automática (já configurado automaticamente)
```

#### 4.6. Iniciar Sync-Server com PM2

```bash
cd /var/www/portal-certidao
pm2 start sync-server.js --name sync-server
pm2 save
pm2 startup  # Configurar para iniciar no boot
```

---

### ✅ 5. Configurar Webhook no Pagar.me

1. Acesse: https://dashboard.pagar.me
2. Faça login com suas credenciais
3. Vá em **Configurações** > **Webhooks**
4. Clique em **Adicionar Webhook**
5. Configure:
   - **URL**: `https://api.portalcertidao.org/webhooks/pagarme`
   - **Eventos**: Selecione `transaction.paid` e `transaction.refunded`
   - **Método**: POST
6. Salve o webhook

---

### ✅ 6. Testar Sistema

#### 6.1. Health Check
```bash
curl https://api.portalcertidao.org/health
```

#### 6.2. Testar Fluxo Completo
1. Acesse: https://www.solicite.link
2. Selecione um serviço
3. Preencha o formulário no PORTAL
4. Selecione um plano
5. Verifique se o QR Code PIX é gerado
6. Faça um pagamento de teste no Pagar.me
7. Verifique se o ticket aparece na PLATAFORMA com status EM_OPERACAO
8. Verifique se as confirmações (email/WhatsApp) foram enviadas

#### 6.3. Verificar Logs
```bash
# Logs do sync-server
pm2 logs sync-server

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🚨 Troubleshooting

### Erro: "VITE_SYNC_SERVER_URL não está configurada"
- Verifique se `.env.local` existe em cada projeto
- Reinicie o servidor após criar/editar `.env.local`

### Erro: "CORS policy"
- Verifique se `CORS_ORIGINS` no `.env` do sync-server inclui todos os domínios
- Reinicie o sync-server após alterar

### Webhook não está funcionando
- Verifique se a URL está correta: `https://api.portalcertidao.org/webhooks/pagarme`
- Verifique se o SSL está configurado
- Verifique os logs: `pm2 logs sync-server`
- Certifique-se de que o evento `transaction.paid` está selecionado

### QR Code PIX não está sendo gerado
- Verifique se `VITE_PAGARME_PUBLIC_KEY` está no `.env.local` do PORTAL
- Verifique o console do navegador para erros
- Certifique-se de que a conta do Pagar.me está ativa

---

## 📝 Resumo das URLs

- **SOLICITE LINK**: https://www.solicite.link
- **PORTAL**: https://www.portalcertidao.org
- **PLATAFORMA**: https://plataforma.portalcertidao.org
- **API**: https://api.portalcertidao.org
- **Webhook Pagar.me**: https://api.portalcertidao.org/webhooks/pagarme

---

## ✅ Ordem Recomendada de Execução

1. ✅ Gerar API Key
2. ✅ Configurar variáveis de ambiente (local)
3. ✅ Fazer builds de produção
4. ✅ Testar builds localmente (opcional)
5. ✅ Configurar servidor (infraestrutura)
6. ✅ Upload dos arquivos
7. ✅ Configurar Nginx
8. ✅ Configurar SSL/HTTPS
9. ✅ Iniciar sync-server com PM2
10. ✅ Configurar webhook no Pagar.me
11. ✅ Testar fluxo completo

---

## 🎯 Próximo Passo Imediato

**Comece gerando a API Key e configurando as variáveis de ambiente localmente.**

Depois, quando estiver pronto para deploy, siga os passos de infraestrutura.




