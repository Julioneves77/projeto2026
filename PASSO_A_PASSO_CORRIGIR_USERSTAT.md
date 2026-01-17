# Passo a Passo: Como Corrigir o Problema do userstat.net

## 🎯 Objetivo
Remover o redirecionamento para `userstat.net` que está aparecendo no `www.portalacesso.online` e causando reprovação no Google Ads.

---

## 📋 Passo 1: Verificar Google Tag Manager (PRIORIDADE MÁXIMA)

### 1.1 Acessar o Google Tag Manager

1. Abra seu navegador e acesse: **https://tagmanager.google.com/**
2. Faça login com a conta Google que tem acesso ao container
3. Selecione o container: **GTM-W7PVKNQS**

### 1.2 Verificar Tags Ativas

1. No menu lateral, clique em **"Tags"**
2. Clique em **"Todas as tags"**
3. Revise **TODAS** as tags que estão **Publicadas** ou **Ativas**

### 1.3 Procurar Tags Suspeitas

Para cada tag ativa, verifique:

#### Tags Custom HTML/JavaScript:
- Clique na tag
- Verifique o código HTML/JavaScript
- **Procure por:**
  - `userstat.net`
  - `userstat.com`
  - `stat.net`
  - `window.location =`
  - `document.location =`
  - `location.href =`
  - Qualquer redirecionamento suspeito

#### Tags de Terceiros:
- Verifique tags de Analytics, Facebook Pixel, etc.
- Clique em cada tag e verifique a URL de destino
- **Procure por** referências a domínios suspeitos

### 1.4 Verificar Triggers

1. No menu lateral, clique em **"Triggers"**
2. Verifique triggers que executam em **"All Pages"**
3. Para cada trigger suspeito:
   - Clique no trigger
   - Verifique as condições
   - Veja quais tags estão associadas

### 1.5 Verificar Variáveis

1. No menu lateral, clique em **"Variáveis"**
2. Verifique variáveis customizadas
3. Procure por URLs ou valores que contenham "userstat"

### 1.6 Verificar Histórico

1. No menu superior, clique em **"Versões"**
2. Revise as mudanças recentes
3. Procure por alterações que possam ter introduzido código suspeito

### 1.7 Desativar Tags Suspeitas

**Se encontrar tags suspeitas:**

1. Clique na tag suspeita
2. Clique em **"Desativar"** ou **"Pausar"**
3. Anote o nome da tag e quando foi criada/modificada
4. **IMPORTANTE**: Não delete ainda, apenas desative para testar

---

## 📋 Passo 2: Publicar Versão Limpa no GTM

### 2.1 Criar Nova Versão

1. Após desativar tags suspeitas, clique em **"Enviar"** (canto superior direito)
2. Adicione um nome para a versão: `"Remoção de tags suspeitas - userstat"`
3. Adicione uma descrição: `"Desativação de tags que podem estar causando redirecionamento para userstat.net"`
4. Clique em **"Publicar"**

### 2.2 Aguardar Propagação

- Aguarde 5-10 minutos para o GTM propagar as mudanças
- O GTM geralmente atualiza em poucos minutos

---

## 📋 Passo 3: Limpar Cache

### 3.1 Limpar Cache do Servidor

Execute no terminal:

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
bash scripts/clear-cache.sh root 143.198.10.145
```

### 3.2 Limpar Cache do Navegador

**Chrome/Edge:**
1. Pressione `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
2. Selecione **"Imagens e arquivos em cache"**
3. Selecione **"Todo o período"**
4. Clique em **"Limpar dados"**

**Firefox:**
1. Pressione `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
2. Selecione **"Cache"**
3. Selecione **"Tudo"**
4. Clique em **"Limpar agora"**

**Safari:**
1. Pressione `Cmd+Option+E` para limpar cache
2. Ou: Menu **Desenvolvedor** > **Limpar Caches**

---

## 📋 Passo 4: Testar no Navegador

### 4.1 Teste Básico

1. Abra uma **janela anônima/privada** do navegador
2. Acesse: **https://www.portalacesso.online**
3. Verifique se:
   - ✅ A página carrega normalmente
   - ✅ Não há redirecionamento para userstat.net
   - ✅ A URL permanece como portalacesso.online

### 4.2 Teste com Console do Desenvolvedor

1. Abra o Console do Desenvolvedor:
   - **Chrome/Edge**: `F12` ou `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - **Firefox**: `F12` ou `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - **Safari**: `Cmd+Option+C` (Mac)

2. Execute o script de monitoramento:
   ```bash
   # Copie o conteúdo do arquivo:
   cat scripts/browser-monitor.js
   ```
   
3. Cole o conteúdo no Console e pressione Enter

4. Aguarde 5 segundos e verifique o relatório

5. **Procure por:**
   - ❌ Scripts carregados de userstat.net
   - ❌ Redirecionamentos suspeitos
   - ❌ Erros relacionados a userstat

### 4.3 Verificar Network Tab

1. No Console do Desenvolvedor, vá para a aba **"Network"** (Rede)
2. Recarregue a página (`F5` ou `Cmd+R`)
3. Procure por requisições para:
   - `userstat.net`
   - `userstat.com`
   - `stat.net`
4. Se encontrar, anote a URL completa

---

## 📋 Passo 5: Monitorar Continuamente

### 5.1 Executar Monitoramento Automatizado

Execute no terminal:

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
node scripts/security-monitor.js --once
```

Este script vai:
- Fazer uma requisição ao site
- Verificar redirecionamentos
- Verificar conteúdo HTML
- Verificar scripts carregados
- Gerar um relatório

### 5.2 Interpretar Resultados

- ✅ **Se não encontrar problemas**: O problema foi resolvido
- ⚠️ **Se encontrar problemas**: Anote os detalhes e volte ao Passo 1

---

## 📋 Passo 6: Verificar Logs do Servidor

Execute no terminal:

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
bash scripts/check-server-logs.sh root 143.198.10.145
```

**Procure por:**
- Requisições para userstat.net
- Redirecionamentos suspeitos
- Erros relacionados

---

## 📋 Passo 7: Verificar DNS e Redirecionamentos

Execute no terminal:

```bash
cd "/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA"
bash scripts/verify-dns-redirects.sh root 143.198.10.145
```

**Verifique:**
- ✅ DNS apontando para 143.198.10.145
- ✅ Nenhum CNAME suspeito
- ✅ Redirecionamentos apenas HTTP→HTTPS (normal)

---

## 📋 Passo 8: Se o Problema Persistir

### 8.1 Desativar Temporariamente o GTM

Se o problema continuar após desativar tags suspeitas:

1. No GTM, vá em **"Tags"** > **"Todas as tags"**
2. **Desative TODAS as tags** temporariamente
3. Publique uma nova versão
4. Teste novamente

**Se o problema desaparecer:**
- O problema está definitivamente no GTM
- Reative as tags uma por uma para identificar qual está causando o problema

**Se o problema continuar:**
- O problema pode estar em outro lugar (ex: DNS, servidor)
- Continue investigando

### 8.2 Verificar Outras Fontes

1. **Verificar extensões do navegador:**
   - Desative todas as extensões
   - Teste em navegador limpo

2. **Verificar DNS local:**
   - Verifique se há entradas em `/etc/hosts` (Mac/Linux) ou `C:\Windows\System32\drivers\etc\hosts` (Windows)
   - Procure por referências a userstat

3. **Verificar outros serviços:**
   - Verifique se há outros serviços de analytics ou tracking configurados
   - Verifique configurações de CDN (se houver)

---

## 📋 Passo 9: Verificar no Google Ads

### 9.1 Aguardar Propagação

- Aguarde **24-48 horas** após as correções
- O Google Ads pode levar tempo para reavaliar o site

### 9.2 Verificar Status

1. Acesse o Google Ads
2. Vá em **"Ferramentas e configurações"** > **"Políticas de anúncios"**
3. Verifique o status do site
4. Se ainda estiver reprovado, aguarde mais tempo ou entre em contato com o suporte

---

## 📋 Passo 10: Implementar Prevenção

### 10.1 Implementar Content Security Policy (CSP)

Adicione headers CSP no Nginx para prevenir carregamento de scripts suspeitos:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com;" always;
```

### 10.2 Monitoramento Contínuo

Configure monitoramento regular:

```bash
# Adicionar ao crontab para executar diariamente
0 9 * * * cd /caminho/para/projeto && node scripts/security-monitor.js --once >> /var/log/security-monitor.log 2>&1
```

---

## ✅ Checklist de Verificação

Use este checklist para garantir que tudo foi feito:

- [ ] GTM verificado - Tags revisadas
- [ ] Tags suspeitas desativadas
- [ ] Nova versão publicada no GTM
- [ ] Cache do servidor limpo
- [ ] Cache do navegador limpo
- [ ] Teste básico realizado (janela anônima)
- [ ] Console do Desenvolvedor verificado
- [ ] Network tab verificado
- [ ] Monitoramento automatizado executado
- [ ] Logs do servidor verificados
- [ ] DNS verificado
- [ ] Problema resolvido ou identificado
- [ ] Google Ads verificado (após 24-48h)

---

## 🆘 Solução de Problemas

### Problema: Não consigo acessar o GTM

**Solução:**
- Verifique se você tem acesso à conta Google correta
- Solicite acesso ao administrador do GTM
- Use a conta que criou o container originalmente

### Problema: Não encontro tags suspeitas no GTM

**Solução:**
- Verifique o histórico de versões
- Verifique tags desativadas/pausadas
- Verifique containers relacionados
- Execute o monitoramento no navegador para identificar qual tag está causando o problema

### Problema: O problema continua após desativar tags

**Solução:**
- Desative TODAS as tags temporariamente
- Se o problema desaparecer, reative uma por uma
- Verifique outras fontes (DNS, servidor, extensões)
- Execute todas as verificações novamente

### Problema: Google Ads ainda reprova após correções

**Solução:**
- Aguarde 24-48 horas para reavaliação
- Verifique se o problema realmente foi resolvido
- Entre em contato com o suporte do Google Ads
- Forneça evidências de que o problema foi corrigido

---

## 📞 Contatos e Recursos

- **Google Tag Manager**: https://tagmanager.google.com/
- **Container ID**: GTM-W7PVKNQS
- **Google Ads Suporte**: https://support.google.com/google-ads
- **Ferramentas de Diagnóstico**: Veja `DIAGNOSTICO_SEGURANCA.md`

---

## 📝 Notas Importantes

1. ⚠️ **NÃO DELETE tags suspeitas imediatamente** - Apenas desative para poder reverter se necessário
2. ⚠️ **SEMPRE teste em janela anônima** - Para evitar cache do navegador
3. ⚠️ **AGUARDE propagação** - Mudanças no GTM podem levar alguns minutos
4. ⚠️ **DOCUMENTE tudo** - Anote quais tags foram desativadas e quando
5. ⚠️ **MONITORE continuamente** - Execute verificações regulares

---

**Última atualização**: 13 de Janeiro de 2026  
**Status**: Guia completo de correção

