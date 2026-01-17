# Adicionar Headers de Segurança - Resolver Problema Google Ads

## 🎯 Objetivo

Adicionar headers de segurança ao Nginx que podem estar causando a reprovação no Google Ads.

## ⚠️ Problema Identificado

A verificação profunda revelou que **faltam headers de segurança importantes**:

- ❌ `X-Frame-Options` - Ausente
- ❌ `X-Content-Type-Options` - Ausente
- ❌ `X-XSS-Protection` - Ausente
- ❌ `Strict-Transport-Security` (HSTS) - Ausente
- ❌ `Content-Security-Policy` (CSP) - Ausente
- ❌ `Referrer-Policy` - Ausente
- ❌ `Permissions-Policy` - Ausente

O Google Ads verifica a segurança do site, e a **ausência desses headers pode ser um fator negativo** na avaliação.

## ✅ Solução

Script automatizado para adicionar todos os headers de segurança necessários.

## 🚀 Como Executar

### Opção 1: Executar Localmente (via SSH)

```bash
# No seu computador local
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
scp scripts/adicionar-headers-seguranca.sh root@143.198.10.145:/tmp/
ssh root@143.198.10.145 "bash /tmp/adicionar-headers-seguranca.sh"
```

### Opção 2: Executar Diretamente no Servidor

```bash
# Conectar ao servidor
ssh root@143.198.10.145

# Criar o script
nano /tmp/adicionar-headers-seguranca.sh
# (copiar conteúdo do script)

# Executar
bash /tmp/adicionar-headers-seguranca.sh
```

## 📋 O Que o Script Faz

1. ✅ Cria backup da configuração atual
2. ✅ Adiciona headers de segurança ao bloco HTTPS
3. ✅ Testa a configuração do Nginx
4. ✅ Recarrega o Nginx se tudo estiver OK
5. ✅ Testa os headers após aplicação

## 🔍 Headers que Serão Adicionados

### Headers de Segurança Básicos:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### HSTS (HTTP Strict Transport Security):

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Content Security Policy (CSP):

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; frame-src https://www.googletagmanager.com;" always;
```

## ✅ Verificação Após Execução

### 1. Verificar Headers:

```bash
curl -sI "https://www.portalacesso.online" | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security|Content-Security-Policy"
```

### 2. Verificar Online:

Use ferramentas online:
- https://securityheaders.com/
- https://observatory.mozilla.org/

### 3. Verificar no Google Ads:

- Aguarde 24-48 horas após adicionar headers
- Verifique o status do site no Google Ads
- O status deve melhorar

## 🎯 Por Que Isso Resolve?

### Google Ads Verifica:

1. **Segurança do site** - Headers de segurança são indicadores importantes
2. **Proteção contra ataques** - Headers previnem XSS, clickjacking, etc.
3. **Conformidade com padrões** - Sites seguros têm headers configurados
4. **Confiança do usuário** - Headers aumentam a confiança

### Headers Específicos:

- **X-Frame-Options**: Previne clickjacking
- **X-Content-Type-Options**: Previne MIME sniffing
- **X-XSS-Protection**: Proteção contra XSS
- **HSTS**: Força HTTPS
- **CSP**: Previne injeção de código
- **Referrer-Policy**: Controla informações de referrer
- **Permissions-Policy**: Controla acesso a APIs sensíveis

## ⚠️ Importante

- ✅ O script cria backup automático antes de modificar
- ✅ Testa a configuração antes de aplicar
- ✅ Restaura backup se houver erro
- ⚠️ Aguarde alguns minutos após execução para propagação
- ⚠️ Aguarde 24-48 horas para Google Ads reavaliar

## 🔄 Se Precisar Reverter

```bash
# Listar backups
ls -la /etc/nginx/sites-available/www.portalacesso.online.backup.*

# Restaurar backup mais recente
sudo cp /etc/nginx/sites-available/www.portalacesso.online.backup.* /etc/nginx/sites-available/www.portalacesso.online
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Resultado Esperado

Após adicionar os headers:

- ✅ Site mais seguro
- ✅ Melhor avaliação no Google Ads
- ✅ Proteção contra ataques comuns
- ✅ Conformidade com padrões de segurança

---

**Última atualização**: 13 de Janeiro de 2026  
**Status**: Pronto para execução

