# 🔄 Instruções para Reiniciar o Servidor em Produção

## Problema
O endpoint `/funnel-validation` está retornando 404 em produção.

## Solução

### Opção 1: Via SSH (Recomendado)

```bash
# Conectar ao servidor
ssh root@143.198.10.145

# Ir para o diretório do projeto
cd /var/www/portal-certidao

# Reiniciar o servidor com PM2
pm2 restart sync-server

# Ou se não estiver rodando:
pm2 start sync-server.js --name sync-server
pm2 save

# Verificar se está rodando
pm2 status
pm2 logs sync-server --lines 20
```

### Opção 2: Verificar se o código foi atualizado

```bash
# No servidor
cd /var/www/portal-certidao

# Verificar se o endpoint existe no código
grep -n "funnel-validation" sync-server.js

# Se não existir, fazer upload novamente:
# (Do seu computador local)
scp sync-server.js root@143.198.10.145:/var/www/portal-certidao/
```

### Opção 3: Reiniciar via Nginx (se necessário)

```bash
# No servidor
sudo systemctl restart nginx
sudo systemctl status nginx
```

## Testar após reiniciar

```bash
# Do seu computador local
curl -H "X-API-Key: 6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c" \
  "https://plataforma.portalcertidao.org/api/funnel-validation?date_from=2025-12-13&date_to=2026-01-12"
```

Deve retornar JSON com os domínios mapeados.
