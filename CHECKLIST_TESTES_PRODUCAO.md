# Checklist de Testes em Produção

## ✅ Correções Implementadas

- [x] Trust proxy configurado no sync-server
- [x] Logs detalhados adicionados no sync-server
- [x] Logs de polling adicionados no frontend
- [x] Logs de conclusão adicionados no modal
- [x] Builds de produção atualizados
- [x] Scripts de teste criados
- [x] Documentação completa

## 🧪 Testes a Realizar

### Teste 1: Verificar Servidor
- [ ] Health check: `curl http://143.198.10.145:3001/health`
- [ ] Listar tickets: `curl -H "X-API-Key: ..." http://143.198.10.145:3001/tickets`
- [ ] Verificar PM2: `pm2 status`

### Teste 2: Fluxo Completo
- [ ] Criar ticket no PORTAL (https://www.portalcertidao.org)
- [ ] Verificar se aparece na PLATAFORMA (aba "Geral")
- [ ] Atribuir ticket (colocar em operação)
- [ ] Verificar se vai para aba "Em Operação"
- [ ] Abrir ticket e ir para aba "Interação"
- [ ] Selecionar status "Concluído"
- [ ] Preencher mensagem
- [ ] Marcar "Enviar e-mail" (obrigatório)
- [ ] Salvar
- [ ] **VERIFICAR**: Ticket deve aparecer na aba **"Concluídos"** (não "Geral")

### Teste 3: Verificar Logs
- [ ] Console do navegador (F12):
  - [ ] Logs de polling aparecem
  - [ ] Distribuição por status aparece
  - [ ] Logs de conclusão aparecem
- [ ] Logs do servidor:
  - [ ] `pm2 logs sync-server` mostra atualizações
  - [ ] Status CONCLUIDO está sendo salvo

### Teste 4: Verificar Sincronização
- [ ] Polling está funcionando (a cada 10s)
- [ ] Tickets atualizados aparecem no frontend
- [ ] Status está correto no servidor

## 📊 Resultado Esperado

### Comportamento Correto
- **Aba "Geral"**: Tickets com `status === 'GERAL'` (não pagos)
- **Aba "Concluídos"**: Tickets com `status === 'CONCLUIDO'`
- **Ticket concluído**: Deve aparecer na aba **"Concluídos"**

## ⚠️ Se Problema Persistir

1. Verificar logs em tempo real:
   ```bash
   # Servidor
   ssh root@143.198.10.145 "pm2 logs sync-server"
   
   # Navegador
   Abrir DevTools (F12) → Console
   ```

2. Verificar status no servidor:
   ```bash
   ssh root@143.198.10.145
   cd /var/www/portal-certidao
   cat tickets-data.json | jq '.[] | select(.codigo == "TK-XXX")'
   ```

3. Verificar variáveis de ambiente:
   - `VITE_SYNC_SERVER_URL` no frontend
   - `SYNC_SERVER_API_KEY` em ambos os lados

4. Limpar cache do navegador:
   - Ctrl + Shift + R (hard refresh)

## 📝 Observações

- Todos os logs foram adicionados para facilitar diagnóstico
- Scripts de teste estão disponíveis em `test-*.js`
- Documentação completa em `RESUMO_FINAL_TESTES.md`

