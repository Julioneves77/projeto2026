#!/usr/bin/env node

/**
 * Script para testar fluxo completo em produção
 * Simula criação, atribuição e conclusão de ticket
 */

require('dotenv').config();
const http = require('http');

const SYNC_SERVER_URL = process.env.SYNC_SERVER_URL || 'http://143.198.10.145:3001';
const SYNC_SERVER_API_KEY = process.env.SYNC_SERVER_API_KEY || '6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'X-API-Key': SYNC_SERVER_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testCompleteFlow() {
  console.log('🧪 ========== TESTE DE FLUXO COMPLETO EM PRODUÇÃO ==========\n');
  console.log(`📡 Servidor: ${SYNC_SERVER_URL}\n`);

  try {
    // 1. Health check
    console.log('1️⃣ Verificando health check...');
    const health = await makeRequest(`${SYNC_SERVER_URL}/health`);
    if (health.status === 200) {
      console.log(`   ✅ Servidor está funcionando\n`);
    } else {
      console.log(`   ❌ Servidor com problemas: ${health.status}\n`);
      return;
    }

    // 2. Gerar código
    console.log('2️⃣ Gerando código de ticket...');
    const codeResponse = await makeRequest(`${SYNC_SERVER_URL}/tickets/generate-code`);
    if (codeResponse.status !== 200) {
      console.log(`   ❌ Erro ao gerar código: ${codeResponse.status}`);
      return;
    }
    const codigo = codeResponse.data.codigo;
    console.log(`   ✅ Código gerado: ${codigo}\n`);

    // 3. Criar ticket de teste
    console.log('3️⃣ Criando ticket de teste...');
    const testTicket = {
      id: `test-${Date.now()}`,
      codigo: codigo,
      nomeCompleto: 'Teste Produção',
      cpfSolicitante: '12345678900',
      telefone: '44999999999',
      email: 'teste@teste.com',
      tipoCertidao: 'criminal-federal',
      status: 'GERAL',
      prioridade: 'padrao',
      dataCadastro: new Date().toISOString(),
      historico: []
    };

    const createResponse = await makeRequest(`${SYNC_SERVER_URL}/tickets`, {
      method: 'POST',
      body: testTicket
    });

    if (createResponse.status !== 200) {
      console.log(`   ❌ Erro ao criar ticket: ${createResponse.status}`);
      console.log(`   Resposta:`, createResponse.data);
      return;
    }
    console.log(`   ✅ Ticket criado: ${codigo}\n`);

    // 4. Verificar se aparece na lista
    console.log('4️⃣ Verificando se ticket aparece na lista...');
    const listResponse = await makeRequest(`${SYNC_SERVER_URL}/tickets`);
    if (listResponse.status !== 200) {
      console.log(`   ❌ Erro ao listar tickets: ${listResponse.status}`);
      return;
    }
    const tickets = listResponse.data;
    const foundTicket = tickets.find(t => t.codigo === codigo);
    if (foundTicket) {
      console.log(`   ✅ Ticket encontrado na lista`);
      console.log(`   Status: ${foundTicket.status}`);
    } else {
      console.log(`   ❌ Ticket não encontrado na lista`);
      return;
    }
    console.log('');

    // 5. Atualizar para EM_OPERACAO
    console.log('5️⃣ Atualizando ticket para EM_OPERACAO...');
    const update1Response = await makeRequest(`${SYNC_SERVER_URL}/tickets/${testTicket.id}`, {
      method: 'PUT',
      body: {
        status: 'EM_OPERACAO',
        operador: 'Teste Operador',
        dataAtribuicao: new Date().toISOString()
      }
    });
    if (update1Response.status === 200) {
      console.log(`   ✅ Ticket atualizado para EM_OPERACAO\n`);
    } else {
      console.log(`   ❌ Erro ao atualizar: ${update1Response.status}`);
      console.log(`   Resposta:`, update1Response.data);
    }

    // 6. Atualizar para CONCLUIDO
    console.log('6️⃣ Atualizando ticket para CONCLUIDO...');
    const update2Response = await makeRequest(`${SYNC_SERVER_URL}/tickets/${testTicket.id}`, {
      method: 'PUT',
      body: {
        status: 'CONCLUIDO',
        dataConclusao: new Date().toISOString(),
        historico: [
          ...(foundTicket.historico || []),
          {
            id: `h-${Date.now()}`,
            dataHora: new Date().toISOString(),
            autor: 'Teste',
            statusAnterior: 'EM_OPERACAO',
            statusNovo: 'CONCLUIDO',
            mensagem: 'Ticket concluído em teste'
          }
        ]
      }
    });
    if (update2Response.status === 200) {
      console.log(`   ✅ Ticket atualizado para CONCLUIDO\n`);
    } else {
      console.log(`   ❌ Erro ao atualizar: ${update2Response.status}`);
      console.log(`   Resposta:`, update2Response.data);
    }

    // 7. Verificar status final
    console.log('7️⃣ Verificando status final...');
    const finalResponse = await makeRequest(`${SYNC_SERVER_URL}/tickets/${testTicket.id}`);
    if (finalResponse.status === 200) {
      const finalTicket = finalResponse.data;
      console.log(`   Código: ${finalTicket.codigo}`);
      console.log(`   Status: ${finalTicket.status}`);
      console.log(`   Operador: ${finalTicket.operador || 'N/A'}`);
      console.log(`   Data Conclusão: ${finalTicket.dataConclusao || 'N/A'}`);
      
      if (finalTicket.status === 'CONCLUIDO') {
        console.log(`   ✅ Status está correto: CONCLUIDO\n`);
      } else {
        console.log(`   ❌ Status incorreto! Esperado: CONCLUIDO, Atual: ${finalTicket.status}\n`);
      }
    }

    // 8. Verificar filtros
    console.log('8️⃣ Verificando filtros de abas...');
    const allTickets = (await makeRequest(`${SYNC_SERVER_URL}/tickets`)).data;
    const gerais = allTickets.filter(t => t.status === 'GERAL');
    const concluidos = allTickets.filter(t => t.status === 'CONCLUIDO');
    const emOperacao = allTickets.filter(t => ['EM_OPERACAO', 'EM_ATENDIMENTO', 'AGUARDANDO_INFO', 'FINANCEIRO'].includes(t.status));
    
    console.log(`   Tickets em GERAL: ${gerais.length}`);
    console.log(`   Tickets CONCLUIDOS: ${concluidos.length}`);
    console.log(`   Tickets EM_OPERACAO: ${emOperacao.length}`);
    
    const testInConcluidos = concluidos.find(t => t.codigo === codigo);
    if (testInConcluidos) {
      console.log(`   ✅ Ticket de teste está na lista de CONCLUIDOS\n`);
    } else {
      console.log(`   ❌ Ticket de teste NÃO está na lista de CONCLUIDOS\n`);
    }

    console.log('✅ Teste de fluxo completo finalizado!');

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCompleteFlow();




