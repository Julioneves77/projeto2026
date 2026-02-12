# Guia de Deploy - Guia das Certidões

## Pré-requisitos

1. ✅ DNS já configurado:
   - Registro A: `@` → `143.198.10.145`
   - Registro CNAME: `www` → `guiadascertidoes.online`

2. Acesso SSH ao servidor `143.198.10.145`
3. Node.js e npm instalados localmente
4. Certbot instalado no servidor (para SSL)

## Passo 1: Build do Projeto

```bash
cd "GUIA DAS CERTIDOES"
npm install
npm run build
cd ..
```

## Passo 2: Executar Deploy

```bash
./deploy-guia-certidoes.sh root
```

Ou com outro usuário:
```bash
./deploy-guia-certidoes.sh seu-usuario
```

O script irá:
- ✅ Verificar se o build existe (ou compilar automaticamente)
- ✅ Criar diretório no servidor `/var/www/guia-certidoes/dist`
- ✅ Fazer upload dos arquivos via rsync
- ✅ Configurar Nginx
- ✅ Configurar permissões

## Passo 3: Configurar SSL (HTTPS)

Após o deploy, conecte-se ao servidor e execute:

```bash
ssh root@143.198.10.145
sudo certbot --nginx -d www.guiadascertidoes.online -d guiadascertidoes.online
```

Ou de forma não-interativa:
```bash
sudo certbot --nginx -d www.guiadascertidoes.online -d guiadascertidoes.online --non-interactive --agree-tos --email seu-email@exemplo.com
```

## Passo 4: Configurar Variáveis de Ambiente

No servidor, crie/edite o arquivo `.env` do sync-server:

```bash
# No servidor
cd /var/www/portal-certidao  # ou onde está o sync-server
nano .env
```

Adicione/verifique:
```env
# SendPulse para Guia das Certidões
GUIA_SENDER_EMAIL=contato@guiadascertidoes.online
GUIA_SENDER_NAME=Guia das Certidões

# Ou use as variáveis existentes
SENDPULSE_SENDER_EMAIL=contato@guiadascertidoes.online
SENDPULSE_SENDER_NAME=Guia das Certidões
```

## Passo 5: Verificar Funcionamento

1. Acesse: `https://www.guiadascertidoes.online`
2. Teste o fluxo completo:
   - Selecionar certidão
   - Preencher formulário
   - Criar ticket
   - Pagar PIX
   - Verificar confirmação

## Configuração Manual do Nginx (se necessário)

Se precisar configurar manualmente, edite `/etc/nginx/sites-available/guiadascertidoes.online`:

```nginx
server {
    listen 80;
    server_name www.guiadascertidoes.online guiadascertidoes.online;
    
    root /var/www/guia-certidoes/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Depois de configurar SSL, o Certbot adicionará automaticamente a configuração HTTPS.

## Troubleshooting

### Erro: "Build não encontrado"
- Execute `npm run build` na pasta "GUIA DAS CERTIDOES"
- Verifique se a pasta `dist` foi criada

### Erro: "Permission denied"
- Verifique permissões SSH
- Use `sudo` quando necessário no servidor

### Site não carrega após deploy
- Verifique logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
- Verifique se o DNS propagou: `dig www.guiadascertidoes.online`
- Teste configuração Nginx: `sudo nginx -t`

### SSL não funciona
- Verifique se o DNS está propagado
- Verifique se a porta 443 está aberta no firewall
- Execute: `sudo certbot certificates` para ver certificados

## Estrutura de Diretórios no Servidor

```
/var/www/guia-certidoes/
└── dist/              # Arquivos do build
    ├── index.html
    ├── assets/
    └── ...
```

## Próximos Passos Após Deploy

1. ✅ Configurar variáveis de ambiente do SendPulse
2. ✅ Testar criação de ticket
3. ✅ Testar pagamento PIX
4. ✅ Verificar envio de email de confirmação
5. ✅ Configurar GTM (se necessário)
6. ✅ Monitorar logs do sync-server
