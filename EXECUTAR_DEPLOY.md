# 🚀 EXECUTAR DEPLOY AGORA

## Passo a Passo Simplificado

---

## 📋 PASSO 1: Fazer Upload dos Arquivos (No Seu Computador)

Execute este comando **no seu computador local**:

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
bash deploy-completo.sh root
```

**OU se seu usuário SSH for diferente:**

```bash
bash deploy-completo.sh seu_usuario
```

Este script vai:
- ✅ Verificar se os builds existem
- ✅ Criar diretórios no servidor
- ✅ Fazer upload de todos os arquivos
- ✅ Enviar sync-server e dependências

**Tempo estimado: 2-5 minutos**

---

## 📋 PASSO 2: Configurar Servidor (No Servidor)

Depois que o upload terminar, conecte ao servidor:

```bash
ssh root@143.198.10.145
```

Depois, execute:

```bash
cd /var/www/portal-certidao
sudo bash configurar-servidor.sh
```

Este script vai:
- ✅ Instalar Node.js, PM2, Nginx (se não tiver)
- ✅ Configurar Nginx para todos os domínios
- ✅ Instalar dependências do sync-server
- ✅ Iniciar sync-server com PM2

**Tempo estimado: 5-10 minutos**

---

## 📋 PASSO 3: Configurar SSL (HTTPS) - No Servidor

Ainda no servidor, execute:

```bash
# PORTAL
sudo certbot --nginx -d www.portalcertidao.org -d portalcertidao.org

# PLATAFORMA
sudo certbot --nginx -d plataforma.portalcertidao.org

# SOLICITE LINK
sudo certbot --nginx -d www.solicite.link -d solicite.link

# API
sudo certbot --nginx -d api.portalcertidao.org
```

Siga as instruções do Certbot (ele vai perguntar seu email).

**Tempo estimado: 5 minutos**

---

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### No Servidor:

```bash
# Verificar PM2
pm2 status
pm2 logs sync-server --lines 50

# Verificar Nginx
sudo systemctl status nginx

# Testar API
curl http://localhost:3001/health
```

### No Navegador:

Abra e teste:
- ✅ https://www.portalcertidao.org
- ✅ https://plataforma.portalcertidao.org
- ✅ https://www.solicite.link
- ✅ https://api.portalcertidao.org/health

**Pressione `Ctrl + Shift + R` para limpar cache!**

---

## ⚠️ PROBLEMAS COMUNS

### Erro de conexão SSH
```bash
# Testar conexão
ssh root@143.198.10.145

# Se pedir senha, digite a senha do servidor
```

### Erro de permissão
```bash
# No servidor, dar permissões
sudo chown -R $USER:$USER /var/www/*
```

### Nginx não inicia
```bash
# Verificar erros
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### PM2 não inicia
```bash
# Verificar logs
cd /var/www/portal-certidao
node sync-server.js  # Testar manualmente
pm2 logs sync-server
```

---

## 🎯 RESUMO RÁPIDO

1. **Local**: `bash deploy-completo.sh root`
2. **Servidor**: `ssh root@143.198.10.145`
3. **Servidor**: `sudo bash configurar-servidor.sh`
4. **Servidor**: Configurar SSL com `certbot`
5. **Navegador**: Testar os sites

---

**Pronto! Seu sistema estará no ar! 🚀**


