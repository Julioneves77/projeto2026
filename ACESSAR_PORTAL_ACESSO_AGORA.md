# 🌐 Acessar Portal Acesso AGORA - Guia Rápido

## ⚡ Solução Rápida (3 opções)

### Opção 1: Adicionar ao /etc/hosts (Recomendado)

Execute no terminal:

```bash
# macOS/Linux
echo "143.198.10.145 portalcacesso.online www.portalcacesso.online" | sudo tee -a /etc/hosts

# Ou execute o script:
bash configurar-hosts-local.sh
```

Depois acesse: **http://portalcacesso.online**

---

### Opção 2: Acessar Diretamente pelo IP

No navegador, acesse diretamente:

**http://143.198.10.145**

O servidor está configurado para responder corretamente mesmo sem o header Host.

---

### Opção 3: Usar Extensão do Navegador

Instale uma extensão como "ModHeader" ou "Requestly" e configure:

- **Header:** `Host`
- **Value:** `portalcacesso.online`

Depois acesse: **http://143.198.10.145**

---

## ✅ Verificação Rápida

Teste se o servidor está respondendo:

```bash
curl -H "Host: portalcacesso.online" http://143.198.10.145
```

Se retornar HTML do Portal Acesso, está funcionando!

---

## 🔧 Limpar Cache do Navegador

Se ainda não funcionar, limpe o cache:

**Chrome/Edge:**
- `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
- Selecione "Imagens e arquivos em cache"
- Clique em "Limpar dados"

**Firefox:**
- `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
- Selecione "Cache"
- Clique em "Limpar agora"

**Safari:**
- `Cmd+Option+E` para limpar cache

---

## 📋 Status Atual

- ✅ Servidor funcionando: **SIM**
- ✅ Nginx configurado: **SIM**
- ✅ Build no servidor: **SIM**
- ⚠️ DNS configurado: **NÃO** (por isso precisa usar /etc/hosts)

---

## 🚀 Após Configurar /etc/hosts

1. Abra o navegador
2. Acesse: **http://portalcacesso.online**
3. Deve carregar o Portal Acesso!

---

## 🔄 Remover do /etc/hosts Depois

Quando o DNS estiver configurado, remova a entrada:

```bash
# macOS
sudo sed -i '' '/portalcacesso.online/d' /etc/hosts

# Linux
sudo sed -i '/portalcacesso.online/d' /etc/hosts
```

