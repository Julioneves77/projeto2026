# Diagnóstico de Segurança - userstat.net

## Problema Reportado

- `userstat.net/` está aparecendo no `www.portalacesso.online`
- DNS demorando para propagar
- Google Ads reprovando por "site comprometido"

## Análise Realizada

### ✅ Verificações Concluídas

1. **Código Fonte**
   - ✅ Nenhuma referência direta a `userstat.net` encontrada
   - ✅ Código TypeScript/JavaScript limpo
   - ✅ Nenhum padrão suspeito (eval, Function, document.write) encontrado

2. **Build Local**
   - ✅ HTML buildado verificado
   - ✅ Arquivos JavaScript minificados verificados
   - ✅ Nenhuma referência suspeita encontrada

3. **DNS**
   - ✅ DNS apontando corretamente para 143.198.10.145
   - ✅ Nenhum CNAME suspeito encontrado
   - ⚠️  Propagação pode estar demorando em alguns locais

4. **Configuração do Servidor**
   - ✅ Nginx configurado corretamente
   - ✅ Certificado SSL válido
   - ✅ Nenhum redirecionamento suspeito na configuração

### ⚠️ Possíveis Causas Identificadas

1. **Google Tag Manager (GTM-W7PVKNQS)**
   - ⚠️  **MAIS PROVÁVEL**: Tags configuradas no GTM podem estar causando redirecionamento
   - ⚠️  Scripts de terceiros carregados via GTM podem estar injetando código
   - ⚠️  Triggers ou variáveis customizadas podem estar causando comportamento suspeito

2. **Cache Comprometido**
   - ⚠️  Cache do navegador pode estar servindo versão antiga comprometida
   - ⚠️  Cache do servidor pode estar servindo conteúdo antigo

3. **Propagação DNS**
   - ⚠️  DNS pode estar apontando para servidor antigo em alguns locais
   - ⚠️  TTL do DNS pode estar causando demora na propagação

## Ferramentas de Diagnóstico Criadas

### Scripts Disponíveis

1. **`scripts/verify-gtm-config.js`**
   - Verifica código fonte e build por referências a domínios suspeitos
   - Gera checklist para verificação manual no GTM
   - **Uso**: `node scripts/verify-gtm-config.js`

2. **`scripts/verify-external-scripts.js`**
   - Monitora scripts externos carregados dinamicamente
   - Detecta padrões suspeitos em código JavaScript
   - Gera script para monitoramento no navegador
   - **Uso**: `node scripts/verify-external-scripts.js`

3. **`scripts/check-server-logs.sh`**
   - Analisa logs do Nginx por redirecionamentos
   - Verifica requisições suspeitas
   - **Uso**: `bash scripts/check-server-logs.sh [user] [host]`

4. **`scripts/verify-dns-redirects.sh`**
   - Verifica configuração DNS
   - Testa redirecionamentos HTTP/HTTPS
   - Verifica configuração do Nginx no servidor
   - **Uso**: `bash scripts/verify-dns-redirects.sh [user] [host]`

5. **`scripts/verify-build-integrity.sh`**
   - Verifica integridade dos arquivos buildados
   - Compara com versão no servidor
   - **Uso**: `bash scripts/verify-build-integrity.sh [user] [host]`

6. **`scripts/security-monitor.js`**
   - Monitora redirecionamentos em tempo real
   - Detecta código malicioso
   - **Uso**: 
     - Contínuo: `node scripts/security-monitor.js`
     - Uma vez: `node scripts/security-monitor.js --once`

7. **`scripts/clear-cache.sh`**
   - Limpa cache do Nginx no servidor
   - Fornece instruções para limpar cache do navegador
   - **Uso**: `bash scripts/clear-cache.sh [user] [host]`

8. **`scripts/browser-monitor.js`**
   - Script para executar no console do navegador
   - Monitora scripts carregados e redirecionamentos em tempo real
   - **Uso**: Copiar conteúdo e colar no console do navegador

## Checklist de Ações Corretivas

### Prioridade ALTA (Fazer Imediatamente)

- [ ] **Verificar Google Tag Manager**
  - [ ] Acessar painel do GTM (https://tagmanager.google.com/)
  - [ ] Verificar container GTM-W7PVKNQS
  - [ ] Revisar TODAS as tags ativas
  - [ ] Procurar por tags que redirecionam ou carregam scripts de `userstat.net`
  - [ ] Verificar triggers que executam em "All Pages"
  - [ ] Verificar histórico de mudanças recentes
  - [ ] **Se encontrar tags suspeitas: DESATIVAR IMEDIATAMENTE**

- [ ] **Executar Diagnóstico Completo**
  ```bash
  # 1. Verificar GTM
  node scripts/verify-gtm-config.js
  
  # 2. Verificar scripts externos
  node scripts/verify-external-scripts.js
  
  # 3. Verificar logs do servidor
  bash scripts/check-server-logs.sh
  
  # 4. Verificar DNS e redirecionamentos
  bash scripts/verify-dns-redirects.sh
  
  # 5. Verificar integridade do build
  bash scripts/verify-build-integrity.sh
  ```

- [ ] **Monitorar em Tempo Real**
  ```bash
  # Executar monitoramento contínuo
  node scripts/security-monitor.js
  ```

- [ ] **Testar no Navegador**
  1. Abrir www.portalacesso.online
  2. Abrir Console do Desenvolvedor (F12)
  3. Colar conteúdo de `scripts/browser-monitor.js`
  4. Observar se há redirecionamentos ou scripts suspeitos

### Prioridade MÉDIA (Fazer em Seguida)

- [ ] **Limpar Cache**
  ```bash
  # Limpar cache do servidor
  bash scripts/clear-cache.sh
  
  # Limpar cache do navegador (seguir instruções no script)
  ```

- [ ] **Fazer Novo Build Limpo**
  ```bash
  cd PORTAL_ACESSO
  rm -rf dist node_modules/.vite
  npm run build
  ```

- [ ] **Fazer Deploy do Novo Build**
  ```bash
  bash deploy-portal-acesso.sh
  ```

- [ ] **Verificar DNS**
  - Verificar configuração DNS no registrador
  - Reduzir TTL se necessário para propagação mais rápida
  - Verificar se não há registros CNAME antigos

### Prioridade BAIXA (Prevenção)

- [ ] **Implementar Monitoramento Contínuo**
  - Configurar alertas para redirecionamentos suspeitos
  - Monitorar scripts carregados dinamicamente
  - Revisar logs regularmente

- [ ] **Revisar Configurações do GTM**
  - Implementar whitelist de domínios permitidos
  - Revisar todas as tags de terceiros
  - Documentar todas as tags ativas

- [ ] **Implementar Content Security Policy (CSP)**
  - Adicionar headers CSP no Nginx
  - Restringir carregamento de scripts externos
  - Permitir apenas domínios confiáveis

## Como Verificar se o Problema Foi Resolvido

1. **Teste Manual**
   - Acessar www.portalacesso.online em navegador anônimo
   - Verificar se não há redirecionamento para userstat.net
   - Verificar Console do Desenvolvedor por erros ou scripts suspeitos

2. **Teste Automatizado**
   ```bash
   # Executar monitoramento uma vez
   node scripts/security-monitor.js --once
   ```

3. **Verificar no Google Ads**
   - Aguardar algumas horas após correções
   - Verificar novamente no Google Ads
   - Se ainda reprovado, verificar logs e executar diagnóstico novamente

## Próximos Passos Recomendados

1. **Imediato**: Verificar Google Tag Manager (mais provável causa)
2. **Curto Prazo**: Limpar cache e fazer novo deploy
3. **Médio Prazo**: Implementar monitoramento contínuo
4. **Longo Prazo**: Implementar CSP e revisar todas as integrações de terceiros

## Contatos e Recursos

- **Google Tag Manager**: https://tagmanager.google.com/
- **Container ID**: GTM-W7PVKNQS
- **Servidor**: 143.198.10.145
- **Domínio**: www.portalacesso.online

## Notas Importantes

- ⚠️  O problema mais provável está no **Google Tag Manager**
- ⚠️  Verifique primeiro o GTM antes de fazer outras alterações
- ⚠️  Mantenha logs de todas as verificações realizadas
- ⚠️  Documente qualquer tag ou configuração suspeita encontrada

---

**Última atualização**: 13 de Janeiro de 2026
**Status**: Diagnóstico completo - Ferramentas criadas e prontas para uso

