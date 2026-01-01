# Guia de Deploy - Portal Certidão

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Domínio configurado (para produção)
- Credenciais das APIs (SendPulse, Zap API)

## Estrutura do Projeto

```
PROJETO 2026 ESTRUTURA/
├── PORTAL/          # Frontend do portal de certidões
├── PLATAFORMA/      # Frontend da plataforma de atendimento
├── sync-server.js   # Backend API (Node.js/Express)
├── services/        # Serviços de integração (SendPulse, Zap API)
└── utils/          # Utilitários
```

## Configuração de Ambiente

### 1. Sync-Server (Backend)

1. Copie `.env.example` para `.env` na raiz do projeto:
```bash
cp .env.example .env
```

2. Configure as variáveis no `.env`:
```env
NODE_ENV=production
PORT=3001
PUBLIC_BASE_URL=https://api.portalcertidao.org
SYNC_SERVER_API_KEY=sua_api_key_secreta_forte_aqui
CORS_ORIGINS=https://www.portalcertidao.org,https://plataforma.portalcertidao.org,https://www.solicite.link
FORCE_RESEND=false

# SendPulse
SENDPULSE_CLIENT_ID=add9a5c88271d94ec87d6016fa01d58e
SENDPULSE_CLIENT_SECRET=33a983c762b866c6c6074abefc8f71c1
SENDPULSE_SENDER_EMAIL=contato@portalcertidao.org
SENDPULSE_SENDER_NAME=Portal Certidão

# Zap API
ZAP_API_URL=https://api.z-api.io/v1
ZAP_API_KEY=3EAB7866FE55B1BEB70D52B01C4B842D
ZAP_CLIENT_TOKEN=F8337947b89a14ae78d92f6365523269bS

# Pagar.me
PAGARME_ACCOUNT_ID=acc_rOZzALlImU3VqkvD
PAGARME_SECRET_KEY=sk_test_ec07154a6cb541fd9c3540af3e6b1efb
```

### 2. PORTAL (Frontend)

1. Copie `.env.example` para `.env.local`:
```bash
cd PORTAL
cp .env.example .env.local
```

2. Configure as variáveis:
```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_SYNC_SERVER_API_KEY=sua_api_key_secreta_forte_aqui
VITE_RECAPTCHA_SITE_KEY=6Ld13bsrAAAAACyH9-lzVqe6e-NV5eXEkUlU-Q_w
VITE_PAGARME_PUBLIC_KEY=pk_test_lopqddXFGcRjqmKG
VITE_SOLICITE_LINK_URL=https://www.solicite.link
```

3. Build de produção:
```bash
npm run build
```

4. Os arquivos estarão em `PORTAL/dist/`

### 3. PLATAFORMA (Frontend)

1. Copie `.env.example` para `.env.local`:
```bash
cd PLATAFORMA
cp .env.example .env.local
```

2. Configure as variáveis:
```env
VITE_SYNC_SERVER_URL=https://api.portalcertidao.org
VITE_SYNC_SERVER_API_KEY=sua_api_key_secreta_forte_aqui
```

3. Build de produção:
```bash
npm run build
```

4. Os arquivos estarão em `PLATAFORMA/dist/`

## Deploy do Sync-Server

### Opção 1: PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar servidor
pm2 start sync-server.js --name sync-server

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

### Opção 2: systemd (Linux)

Crie `/etc/systemd/system/sync-server.service`:

```ini
[Unit]
Description=Sync Server API
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/caminho/para/projeto
ExecStart=/usr/bin/node sync-server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sync-server
sudo systemctl start sync-server
```

## Deploy dos Frontends

### Nginx (Recomendado)

#### Configuração para PORTAL

```nginx
server {
    listen 80;
    server_name portalcertidao.org www.portalcertidao.org;
    
    root /caminho/para/PORTAL/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSL (Let's Encrypt)
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/portalcertidao.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portalcertidao.org/privkey.pem;
}
```

#### Configuração para PLATAFORMA

```nginx
server {
    listen 80;
    server_name plataforma.portalcertidao.org;
    
    root /caminho/para/PLATAFORMA/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSL
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/plataforma.portalcertidao.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/plataforma.portalcertidao.org/privkey.pem;
}
```

#### Configuração para Sync-Server (API)

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

    # SSL
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.portalcertidao.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.portalcertidao.org/privkey.pem;
}
```

## Configuração do Pagar.me

### 1. Configurar Webhook

1. Acesse o dashboard do Pagar.me (https://dashboard.pagar.me)
2. Vá em **Configurações** > **Webhooks**
3. Adicione um novo webhook:
   - **URL**: `https://api.portalcertidao.org/webhooks/pagarme`
   - **Eventos**: Selecione `transaction.paid` e `transaction.refunded`
   - **Método**: POST

### 2. Credenciais

- **Public Key** (`pk_test_...`): Usada no frontend (PORTAL) - pode ser exposta
- **Secret Key** (`sk_test_...`): Usada apenas no backend (sync-server) - NUNCA exponha
- **Account ID**: Usado para identificação da conta

### 3. Ambiente de Teste vs Produção

- **Teste**: Use `pk_test_` e `sk_test_` (fornecido)
- **Produção**: Substitua por `pk_live_` e `sk_live_` após homologação no Pagar.me

## Verificação Pós-Deploy

1. **Health Check:**
```bash
curl https://api.portalcertidao.org/health
```

2. **Testar criação de ticket:**
- Acesse o PORTAL (https://www.portalcertidao.org)
- Preencha um formulário de certidão
- Selecione um plano
- Verifique se o QR Code PIX é gerado corretamente

3. **Testar pagamento:**
- Use o ambiente de teste do Pagar.me
- Faça um pagamento PIX de teste
- Verifique se o webhook é recebido (logs do sync-server)
- Verifique se o ticket é atualizado para EM_OPERACAO
- Verifique se as confirmações (email/WhatsApp) são enviadas

4. **Verificar logs:**
```bash
# PM2
pm2 logs sync-server

# systemd
sudo journalctl -u sync-server -f
```

## Troubleshooting

### Erro: "VITE_SYNC_SERVER_URL não está configurada"
- Verifique se `.env.local` existe e tem a variável configurada
- Reinicie o servidor após criar/editar `.env.local`

### Erro: "CORS policy"
- Configure `CORS_ORIGINS` no `.env` do sync-server
- Adicione todos os domínios que precisam acessar a API

### Erro: "401 Unauthorized"
- Configure `SYNC_SERVER_API_KEY` no `.env` do sync-server
- Adicione o header `X-API-Key` nas requisições do frontend

### WhatsApp attachments não funcionam
- Configure `PUBLIC_BASE_URL` com URL pública (não localhost)
- Use ngrok em desenvolvimento ou domínio próprio em produção
- Verifique se a URL é acessível publicamente

### Webhook do Pagar.me não está funcionando
- Verifique se a URL do webhook está correta: `https://api.portalcertidao.org/webhooks/pagarme`
- Verifique se o SSL/HTTPS está configurado corretamente
- Verifique os logs do sync-server para ver se o webhook está sendo recebido
- Certifique-se de que o evento `transaction.paid` está selecionado no dashboard do Pagar.me
- O webhook sempre retorna 200 para evitar reenvios do Pagar.me

### QR Code PIX não está sendo gerado
- Verifique se `VITE_PAGARME_PUBLIC_KEY` está configurada no `.env.local` do PORTAL
- Verifique o console do navegador para erros
- Certifique-se de que a API Key está correta e ativa
- Verifique se a conta do Pagar.me está ativa e habilitada para PIX

### Webhook do Pagar.me não está funcionando
- Verifique se a URL do webhook está correta: `https://api.portalcertidao.org/webhooks/pagarme`
- Verifique se o SSL/HTTPS está configurado corretamente
- Verifique os logs do sync-server para ver se o webhook está sendo recebido
- Certifique-se de que o evento `transaction.paid` está selecionado no dashboard do Pagar.me

### QR Code PIX não está sendo gerado
- Verifique se `VITE_PAGARME_PUBLIC_KEY` está configurada no `.env.local` do PORTAL
- Verifique o console do navegador para erros
- Certifique-se de que a API Key está correta e ativa

## Backup

Configure backup automático de `tickets-data.json`:

```bash
# Crontab para backup diário
0 2 * * * cp /caminho/para/tickets-data.json /backup/tickets-data-$(date +\%Y\%m\%d).json
```

## Monitoramento

- Use PM2 Monitor: `pm2 monit`
- Configure alertas para erros críticos
- Monitore logs regularmente
