# 🚀 Resumo Rápido: Como Corrigir userstat.net

## ⚡ Ação Imediata (5 minutos)

### 1️⃣ Verificar Google Tag Manager
```
1. Acesse: https://tagmanager.google.com/
2. Container: GTM-W7PVKNQS
3. Vá em "Tags" > "Todas as tags"
4. Procure por tags com referências a "userstat"
5. DESATIVE tags suspeitas
6. Clique em "Enviar" > "Publicar"
```

### 2️⃣ Limpar Cache
```bash
# Cache do servidor
bash scripts/clear-cache.sh root 143.198.10.145

# Cache do navegador: Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)
```

### 3️⃣ Testar
```
1. Abra janela anônima
2. Acesse: https://www.portalacesso.online
3. Verifique se não há redirecionamento
```

---

## 📋 Passos Completos

Para instruções detalhadas, veja: **PASSO_A_PASSO_CORRIGIR_USERSTAT.md**

---

## 🔍 Comandos Úteis

```bash
# Verificar GTM
node scripts/verify-gtm-config.js

# Monitorar segurança
node scripts/security-monitor.js --once

# Verificar logs
bash scripts/check-server-logs.sh root 143.198.10.145

# Verificar DNS
bash scripts/verify-dns-redirects.sh root 143.198.10.145
```

---

## ✅ Checklist Rápido

- [ ] GTM verificado
- [ ] Tags suspeitas desativadas
- [ ] Versão publicada no GTM
- [ ] Cache limpo
- [ ] Teste realizado
- [ ] Problema resolvido

---

**📄 Guia completo**: `PASSO_A_PASSO_CORRIGIR_USERSTAT.md`

