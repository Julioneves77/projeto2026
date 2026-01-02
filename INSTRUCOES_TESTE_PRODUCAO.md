# Instruções para Teste em Produção

## Status Atual

✅ **Sync-server funcionando** na porta 3001
✅ **Logs detalhados adicionados** para rastrear atualizações
✅ **Build de produção atualizado** com logs de debug
✅ **Trust proxy configurado** (corrigido)

## Como Testar o Problema do Ticket Concluído

### 1. Verificar Console do Navegador

1. Abra https://plataforma.portalcertidao.org
2. Abra DevTools (F12)
3. Vá para a aba "Console"
4. Procure por logs:
   - `🟢 [PLATAFORMA] Carregando tickets...`
   - `🟢 [PLATAFORMA] Distribuição por status:`
   - `🟢 [PLATAFORMA] Recebidos X tickets do servidor`

### 2. Verificar Logs do Sync-Server

No servidor, execute:
```bash
ssh root@143.198.10.145
pm2 logs sync-server --lines 100
```

Procure por:
- `📤 [SYNC] PUT /tickets/{id} - Atualizando ticket`
- `📤 [SYNC] Status após atualização: CONCLUIDO`
- `✅ [SYNC] Ticket {codigo} salvo com status: CONCLUIDO`

### 3. Testar Fluxo Completo

1. **Criar ticket no PORTAL**:
   - Acesse https://www.portalcertidao.org
   - Preencha formulário e faça pagamento
   - Ticket deve aparecer na PLATAFORMA (aba "Geral")

2. **Atribuir ticket**:
   - Na PLATAFORMA, vá para aba "Geral"
   - Clique em "Colocar em Operação"
   - Ticket deve ir para aba "Em Operação"

3. **Concluir ticket**:
   - Abra o ticket e vá para aba "Interação"
   - Selecione status "Concluído"
   - Preencha mensagem
   - Marque "Enviar e-mail" (obrigatório)
   - Clique em "Salvar"

4. **Verificar resultado**:
   - Ticket deve aparecer na aba "Concluídos"
   - Verificar console do navegador para logs
   - Verificar logs do servidor

### 4. Verificar Status no Servidor

```bash
ssh root@143.198.10.145
cd /var/www/portal-certidao
cat tickets-data.json | jq '.[] | select(.status == "CONCLUIDO") | {codigo, status, dataConclusao}' | head -20
```

### 5. Verificar Filtros de Abas

No código (`PLATAFORMA/src/components/Tickets.tsx`):
- Aba "Geral": `status === 'GERAL'` ✅
- Aba "Concluídos": `status === 'CONCLUIDO'` ✅

## Problemas Conhecidos

1. **Trust Proxy**: Já corrigido, mas pode precisar reiniciar PM2
2. **Polling**: Verificar se está rodando a cada 10 segundos
3. **Sincronização**: Verificar se frontend está recebendo atualizações

## Próximos Passos

1. Testar fluxo completo conforme instruções acima
2. Verificar logs em tempo real
3. Se problema persistir, verificar:
   - Variáveis de ambiente no servidor
   - Configuração do Nginx
   - CORS e autenticação

