# 🚀 Deploy Completo da Validação de Funil em Produção

## ✅ O que já foi feito

1. ✅ Código atualizado localmente
2. ✅ Endpoint `/funnel-validation` implementado no `sync-server.js`
3. ✅ Frontend PLATAFORMA buildado com as correções
4. ✅ Upload do código para o servidor executado
5. ✅ Scripts de deploy criados

## ⚠️ O que precisa ser feito manualmente

O servidor em produção precisa ser **reiniciado** para carregar o novo código.

### Passo 1: Conectar ao servidor

```bash
ssh root@143.198.10.145
```

### Passo 2: Verificar se o código foi atualizado

```bash
cd /var/www/portal-certidao

# Verificar se o endpoint existe no código
grep -n "funnel-validation" sync-server.js
```

**Deve mostrar:** Linhas com `/funnel-validation` e `app.get('/funnel-validation'`

### Passo 3: Reiniciar o servidor

```bash
# Reiniciar com PM2
pm2 restart sync-server

# Ou se não estiver rodando:
pm2 start sync-server.js --name sync-server
pm2 save

# Verificar status
pm2 status
pm2 logs sync-server --lines 20
```

### Passo 4: Testar o endpoint

**Do seu computador local:**

```bash
curl -H "X-API-Key: 6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c" \
  "https://plataforma.portalcertidao.org/api/funnel-validation?date_from=2025-12-13&date_to=2026-01-12"
```

**Ou execute o script de teste:**

```bash
./testar-endpoint-producao.sh
```

**Deve retornar JSON com:**
```json
{
  "success": true,
  "validation": [
    {
      "domain": "solicite.link",
      "status": "ERROR",
      "events": { "total": 0 },
      "campaigns": { "total": 0, "total_cost": 0 },
      "mapping": { "customer_id": "591-659-0517" }
    },
    {
      "domain": "portalcacesso.online",
      "status": "ERROR",
      "events": { "total": 0 },
      "campaigns": { "total": 0, "total_cost": 0 },
      "mapping": { "customer_id": "981-373-7127" }
    }
  ],
  "summary": {
    "total_domains": 2,
    "domains_with_mapping": 2
  }
}
```

### Passo 5: Verificar no navegador

1. Acesse: `https://plataforma.portalcertidao.org`
2. Vá para a **Aba Coração**
3. A seção **"Validação por Domínio"** deve aparecer
4. Deve mostrar os 2 domínios mapeados

## 🔍 Troubleshooting

### Se o endpoint ainda retornar 404:

1. **Verificar se o código foi atualizado:**
   ```bash
   ssh root@143.198.10.145
   cd /var/www/portal-certidao
   grep "funnel-validation" sync-server.js
   ```

2. **Se não existir, fazer upload novamente:**
   ```bash
   # Do seu computador local
   scp sync-server.js root@143.198.10.145:/var/www/portal-certidao/
   ```

3. **Reiniciar o servidor:**
   ```bash
   # No servidor
   pm2 restart sync-server
   ```

### Se houver erro de permissão:

```bash
# No servidor
sudo chown -R $USER:$USER /var/www/portal-certidao
```

### Se o PM2 não estiver funcionando:

```bash
# Verificar se está instalado
pm2 --version

# Se não estiver, instalar
npm install -g pm2

# Iniciar o servidor
cd /var/www/portal-certidao
pm2 start sync-server.js --name sync-server
pm2 save
pm2 startup  # Para iniciar no boot
```

## 📋 Checklist Final

- [ ] Código atualizado no servidor (`sync-server.js` tem `/funnel-validation`)
- [ ] Servidor reiniciado (`pm2 restart sync-server`)
- [ ] Endpoint testado e retornando 200
- [ ] Frontend buildado e deployado
- [ ] Seção "Validação por Domínio" aparecendo na Aba Coração

## ✅ Quando tudo estiver funcionando

Você verá na Aba Coração:

- **Seção "Validação por Domínio"** sempre visível
- **2 domínios mapeados:**
  - `solicite.link` → `591-659-0517`
  - `portalcacesso.online` → `981-373-7127`
- **Status de cada domínio** (ERROR por enquanto, pois não há eventos ainda)
- **Métricas** (eventos, campanhas, custos)

## 🎯 Próximos passos após funcionar

1. Quando houver eventos coletados, os status mudarão automaticamente
2. Quando sincronizar campanhas, as métricas aparecerão
3. A validação mostrará avisos se algo estiver faltando

