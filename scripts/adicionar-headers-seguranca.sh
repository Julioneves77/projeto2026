#!/bin/bash

# Script para adicionar headers de segurança ao Nginx
# Isso pode resolver problemas de reprovação no Google Ads

set -e

echo "🔒 Adicionando headers de segurança ao Nginx..."

# Tentar encontrar o arquivo de configuração correto
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-available/www.portalacesso.online" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/www.portalacesso.online"
elif [ -f "/etc/nginx/sites-available/portalcacesso.online" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/portalcacesso.online"
else
    echo "❌ Arquivo de configuração não encontrado!"
    echo "📋 Procurando arquivos de configuração..."
    ls -la /etc/nginx/sites-available/ | grep -i portal
    exit 1
fi

echo "✅ Usando arquivo: $NGINX_CONFIG"

# Backup da configuração atual
echo "💾 Criando backup da configuração atual..."
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Verificar se os headers já existem
if grep -q "X-Frame-Options" "$NGINX_CONFIG"; then
    echo "⚠️  Headers de segurança já existem. Atualizando..."
    # Remover headers antigos se existirem
    sudo sed -i '/# Headers de segurança/,/# Content Security Policy/d' "$NGINX_CONFIG"
fi

# Ler o arquivo e adicionar headers antes do fechamento do bloco server HTTPS
TEMP_FILE=$(mktemp)

# Encontrar o bloco server que escuta na porta 443 (HTTPS)
if grep -q "listen.*443.*ssl" "$NGINX_CONFIG"; then
    echo "✅ Adicionando headers ao bloco HTTPS..."
    
    # Usar Python para adicionar headers de forma mais segura
    sudo python3 << PYTHON_SCRIPT
import re

config_file = "$NGINX_CONFIG"
backup_file = "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Ler arquivo
with open(config_file, 'r') as f:
    content = f.read()

# Headers de segurança
security_headers = """
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; frame-src https://www.googletagmanager.com;" always;
"""

# Encontrar o último } antes do fechamento do bloco server HTTPS
# Procurar por padrão: } seguido de espaços e comentários do Certbot
pattern = r'(    include /etc/letsencrypt/options-ssl-nginx\.conf;.*?\n    ssl_dhparam /etc/letsencrypt/ssl-dhparams\.pem;.*?\n)(\n\})'

# Se não encontrar o padrão acima, procurar por } no final do bloco server
if not re.search(pattern, content):
    # Procurar por } que fecha o bloco server (antes de outro server ou fim do arquivo)
    pattern = r'(    ssl_dhparam /etc/letsencrypt/ssl-dhparams\.pem;.*?\n)(\n\})'
    
if not re.search(pattern, content):
    # Tentar adicionar antes do último } do arquivo dentro do bloco server
    # Encontrar o último } antes de outro server ou fim
    lines = content.split('\n')
    insert_pos = -1
    in_https_block = False
    
    for i in range(len(lines) - 1, -1, -1):
        if 'listen.*443.*ssl' in lines[i] or 'listen 443 ssl' in lines[i]:
            in_https_block = True
        if in_https_block and lines[i].strip() == '}' and insert_pos == -1:
            insert_pos = i
            break
    
    if insert_pos > 0:
        lines.insert(insert_pos, security_headers.strip())
        content = '\n'.join(lines)
    else:
        # Último recurso: adicionar antes do último }
        content = re.sub(r'(\n\})', security_headers + r'\1', content, count=1)
else:
    # Substituir o padrão encontrado
    content = re.sub(pattern, r'\1' + security_headers + r'\2', content, flags=re.DOTALL)

# Escrever arquivo
with open(config_file, 'w') as f:
    f.write(content)

print("✅ Headers adicionados com sucesso!")
PYTHON_SCRIPT

else
    echo "⚠️  Bloco HTTPS não encontrado. Verificando estrutura..."
    # Adicionar headers no bloco server geral
    echo "✅ Adicionando headers ao bloco server..."
    
    # Adicionar antes do último } do bloco server
    sudo sed -i '/^}$/i\
    # Headers de segurança\
    add_header X-Frame-Options "SAMEORIGIN" always;\
    add_header X-Content-Type-Options "nosniff" always;\
    add_header X-XSS-Protection "1; mode=block" always;\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;\
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\
    add_header Content-Security-Policy "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' https://www.googletagmanager.com https://www.google-analytics.com; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data: https:; font-src '\''self'\'' data:; connect-src '\''self'\'' https://www.google-analytics.com https://www.googletagmanager.com; frame-src https://www.googletagmanager.com;" always;
' "$NGINX_CONFIG"
fi

echo "✅ Headers de segurança adicionados!"
echo ""
echo "📋 Testando configuração do Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida!"
    echo ""
    echo "🔄 Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado com sucesso!"
    echo ""
    echo "🧪 Testando headers..."
    echo ""
    sleep 2
    curl -sI "https://www.portalacesso.online" | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security|Content-Security-Policy|Referrer-Policy|Permissions-Policy" || echo "⚠️  Headers ainda não aparecem (pode levar alguns segundos)"
else
    echo "❌ Erro na configuração do Nginx!"
    echo "📋 Restaurando backup..."
    sudo cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null || echo "⚠️  Backup não encontrado"
    exit 1
fi

echo ""
echo "✅✅✅ Headers de segurança configurados com sucesso! ✅✅✅"
echo ""
echo "📊 Próximos passos:"
echo "   1. Aguarde alguns minutos para propagação"
echo "   2. Teste: curl -sI https://www.portalacesso.online | grep -i 'x-frame\|x-content\|strict-transport\|content-security'"
echo "   3. Aguarde 24-48 horas e verifique o status no Google Ads"
