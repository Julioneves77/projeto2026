# 🧹 Como Limpar Cache do Navegador

## Para ver as versões atualizadas dos sites em produção

---

## 🌐 Chrome / Edge / Brave

### Método 1: Hard Refresh (Mais Rápido)
1. Abra o site (ex: https://www.portalcertidao.org)
2. Pressione: **`Ctrl + Shift + R`** (Windows/Linux) ou **`Cmd + Shift + R`** (Mac)
3. Ou pressione **`F5`** várias vezes

### Método 2: Limpar Cache Específico do Site
1. Abra o DevTools: **`F12`** ou **`Ctrl + Shift + I`** (Windows) / **`Cmd + Option + I`** (Mac)
2. Clique com botão direito no botão de **Recarregar** (ao lado da barra de endereço)
3. Selecione **"Limpar cache e atualizar forçadamente"** ou **"Empty Cache and Hard Reload"**

### Método 3: Limpar Cache Completo
1. Pressione **`Ctrl + Shift + Delete`** (Windows) ou **`Cmd + Shift + Delete`** (Mac)
2. Selecione:
   - ✅ "Imagens e arquivos em cache"
   - ✅ "Cookies e outros dados do site"
3. Período: **"Todo o período"**
4. Clique em **"Limpar dados"**

---

## 🔥 Firefox

### Método 1: Hard Refresh
1. Abra o site
2. Pressione: **`Ctrl + Shift + R`** (Windows/Linux) ou **`Cmd + Shift + R`** (Mac)
3. Ou pressione **`Ctrl + F5`**

### Método 2: Limpar Cache Específico
1. Abra o DevTools: **`F12`**
2. Clique com botão direito no botão de **Recarregar**
3. Selecione **"Limpar cache e atualizar"**

### Método 3: Limpar Cache Completo
1. Pressione **`Ctrl + Shift + Delete`**
2. Selecione:
   - ✅ "Cache"
   - ✅ "Cookies"
3. Período: **"Tudo"**
4. Clique em **"Limpar agora"**

---

## 🍎 Safari

### Método 1: Hard Refresh
1. Abra o site
2. Pressione: **`Cmd + Option + R`**

### Método 2: Limpar Cache
1. Menu: **Safari > Configurações > Avançado**
2. Marque: **"Mostrar menu Desenvolver na barra de menus"**
3. Menu: **Desenvolver > Limpar Caches**
4. Ou pressione: **`Cmd + Option + E`**

---

## 🔍 Verificar se Está Vendo a Versão Correta

### Teste Rápido:
1. Abra: https://www.portalcertidao.org
2. Pressione **`F12`** para abrir DevTools
3. Vá na aba **"Network"** (Rede)
4. Marque **"Disable cache"** (Desabilitar cache)
5. Pressione **`Ctrl + Shift + R`** para recarregar
6. Verifique se os arquivos estão sendo carregados do servidor (não do cache)

### Verificar Versão dos Arquivos:
1. Abra DevTools (**`F12`**)
2. Aba **"Network"**
3. Recarregue a página (**`Ctrl + Shift + R`**)
4. Procure por arquivos `.js` e `.css`
5. Clique em um arquivo e veja:
   - **Status**: Deve ser `200` (não `304 Not Modified`)
   - **Size**: Mostra o tamanho real (não `disk cache` ou `memory cache`)
   - **Time**: Mostra o tempo de carregamento do servidor

---

## ⚡ Atalhos Rápidos

| Navegador | Hard Refresh | Limpar Cache |
|-----------|--------------|--------------|
| **Chrome/Edge** | `Ctrl + Shift + R` | `Ctrl + Shift + Delete` |
| **Firefox** | `Ctrl + Shift + R` | `Ctrl + Shift + Delete` |
| **Safari** | `Cmd + Option + R` | `Cmd + Option + E` |

---

## 🎯 Dica Pro

**Para desenvolvimento, sempre mantenha o cache desabilitado:**

1. Abra DevTools (**`F12`**)
2. Vá em **Settings** (Configurações) ou **⚙️**
3. Na seção **Network**, marque:
   - ✅ **"Disable cache"** (Desabilitar cache)
4. Mantenha o DevTools aberto enquanto desenvolve

Assim você sempre verá as versões mais recentes! 🚀

---

## 🔗 Sites para Testar

Depois de limpar o cache, teste:

- ✅ https://www.portalcertidao.org
- ✅ https://plataforma.portalcertidao.org  
- ✅ https://www.solicite.link
- ✅ https://api.portalcertidao.org/health

---

**Pronto! Agora você verá as versões atualizadas em produção! 🎉**



