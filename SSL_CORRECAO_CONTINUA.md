# Correção: HTTPS quebrando após deploys

## 🔍 Causa raiz identificada

Os scripts de deploy **substituíam** a configuração completa do Nginx com versões **apenas HTTP**. Isso removia o SSL configurado pelo Certbot, fazendo o site voltar a funcionar só em HTTP.

**Fluxo do problema:**
1. Certbot configurava SSL corretamente no Nginx
2. Novo deploy executava e sobrescrevia o arquivo de config
3. A nova config era HTTP-only → SSL sumia

## ✅ Correções aplicadas

### 1. Scripts de deploy atualizados

- **deploy-guia-central.sh**: Agora detecta se o certificado existe e aplica config **com SSL** (redireciona HTTP→HTTPS)
- **deploy-guia-certidoes.sh**: Mesma lógica – preserva HTTPS quando o certificado existe
- **deploy-suporte-online.sh**: Já estava correto (config com SSL)

### 2. Comportamento atual dos deploys

- Se o certificado SSL **existe**: aplica config completa com HTTPS
- Se o certificado **não existe**: aplica config HTTP e tenta obter certificado via Certbot
- Nunca mais remove SSL em deploys

### 3. Script auxiliar

- **configurar-ssl-todos.sh**: Configura ou renova SSL em todos os domínios  
  Uso: `./configurar-ssl-todos.sh root`

## ⚠️ Conflitos de configuração no Nginx

Se aparecerem avisos como `conflicting server name "www.guia-central.online"`, significa que **mais de um arquivo** define o mesmo domínio. Para corrigir:

```bash
# Conectar ao servidor
ssh root@143.198.10.145

# Listar configs que usam guia-central
sudo grep -l "guia-central" /etc/nginx/sites-enabled/*

# Remover duplicatas (manter apenas guia-central.online)
# Exemplo: sudo rm /etc/nginx/sites-enabled/outro-arquivo-com-guia-central
```

## 📋 Domínios no servidor

| Domínio | Deploy Script | Status SSL |
|---------|---------------|------------|
| guia-central.online | deploy-guia-central.sh | ✅ Corrigido |
| centraldascertidoes.com | deploy-guia-certidoes.sh | ✅ Corrigido |
| guiadascertidoes.online | deploy-guia-certidoes.sh | ✅ Corrigido |
| suporteonline.digital | deploy-suporte-online.sh | ✅ Já estava ok |

## Data da correção

11 de Fevereiro de 2026
