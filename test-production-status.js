#!/usr/bin/env node

/**
 * Script para testar status de tickets em produção
 * Verifica se tickets concluídos estão com status correto
 */

require('dotenv').config();
const https = require('https');

const SYNC_SERVER_URL = process.env.SYNC_SERVER_URL || 'https://api.portalcertidao.org';
const SYNC_SERVER_API_KEY = process.env.SYNC_SERVER_API_KEY || '6071d071d03a7a595ab3c1cd3477404f68995bfc3c030ff09065a80c2f96d59c';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'X-API-Key': SYNC_SERVER_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
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

async function testTicketStatus() {
  console.log('🧪 ========== TESTE DE STATUS DE TICKETS EM PRODUÇÃO ==========\n');
  console.log(`📡 Servidor: ${SYNC_SERVER_URL}\n`);

  try {
    // 1. Health check
    console.log('1️⃣ Verificando health check...');
    const health = await makeRequest(`${SYNC_SERVER_URL}/health`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Resposta:`, health.data);
    console.log('');

    // 2. Listar todos os tickets
    console.log('2️⃣ Listando todos os tickets...');
    const ticketsResponse = await makeRequest(`${SYNC_SERVER_URL}/tickets`);
    
    if (ticketsResponse.status !== 200) {
      console.error(`❌ Erro ao listar tickets: ${ticketsResponse.status}`);
      console.error(`   Resposta:`, ticketsResponse.data);
      return;
    }

    const tickets = ticketsResponse.data;
    console.log(`   ✅ Total de tickets: ${tickets.length}\n`);

    // 3. Analisar status dos tickets
    console.log('3️⃣ Analisando status dos tickets...\n');
    
    const statusCount = {};
    const concluidos = [];
    const gerais = [];
    const emOperacao = [];

    tickets.forEach(ticket => {
      const status = ticket.status || 'SEM_STATUS';
      statusCount[status] = (statusCount[status] || 0) + 1;

      if (status === 'CONCLUIDO') {
        concluidos.push({
          codigo: ticket.codigo,
          status: ticket.status,
          operador: ticket.operador || 'N/A',
          dataConclusao: ticket.dataConclusao || 'N/A',
          dataCadastro: ticket.dataCadastro || 'N/A'
        });
      }

      if (status === 'GERAL') {
        gerais.push({
          codigo: ticket.codigo,
          status: ticket.status,
          operador: ticket.operador || 'N/A',
          dataCadastro: ticket.dataCadastro || 'N/A'
        });
      }

      if (['EM_OPERACAO', 'EM_ATENDIMENTO', 'AGUARDANDO_INFO', 'FINANCEIRO'].includes(status)) {
        emOperacao.push({
          codigo: ticket.codigo,
          status: ticket.status,
          operador: ticket.operador || 'N/A',
          dataCadastro: ticket.dataCadastro || 'N/A'
        });
      }
    });

    console.log('   📊 Distribuição por Status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
    console.log('');

    // 4. Mostrar tickets concluídos
    console.log(`4️⃣ Tickets Concluídos (${concluidos.length}):`);
    if (concluidos.length > 0) {
      concluidos.slice(-10).forEach(t => {
        console.log(`   ✅ ${t.codigo} - Operador: ${t.operador} - Conclusão: ${t.dataConclusao}`);
      });
      if (concluidos.length > 10) {
        console.log(`   ... e mais ${concluidos.length - 10} tickets concluídos`);
      }
    } else {
      console.log('   ⚠️ Nenhum ticket concluído encontrado');
    }
    console.log('');

    // 5. Mostrar tickets em Geral
    console.log(`5️⃣ Tickets em Geral (${gerais.length}):`);
    if (gerais.length > 0) {
      gerais.slice(-10).forEach(t => {
        console.log(`   📋 ${t.codigo} - Operador: ${t.operador}`);
      });
      if (gerais.length > 10) {
        console.log(`   ... e mais ${gerais.length - 10} tickets em geral`);
      }
    } else {
      console.log('   ℹ️ Nenhum ticket em geral encontrado');
    }
    console.log('');

    // 6. Verificar tickets com problemas
    console.log('6️⃣ Verificando inconsistências...\n');
    
    const problemas = [];
    
    tickets.forEach(ticket => {
      // Ticket concluído sem data de conclusão
      if (ticket.status === 'CONCLUIDO' && !ticket.dataConclusao) {
        problemas.push({
          codigo: ticket.codigo,
          problema: 'Status CONCLUIDO mas sem dataConclusao',
          status: ticket.status
        });
      }

      // Ticket com data de conclusão mas status não é CONCLUIDO
      if (ticket.dataConclusao && ticket.status !== 'CONCLUIDO') {
        problemas.push({
          codigo: ticket.codigo,
          problema: `Tem dataConclusao mas status é ${ticket.status}`,
          status: ticket.status,
          dataConclusao: ticket.dataConclusao
        });
      }
    });

    if (problemas.length > 0) {
      console.log('   ⚠️ Problemas encontrados:');
      problemas.forEach(p => {
        console.log(`      ❌ ${p.codigo}: ${p.problema}`);
      });
    } else {
      console.log('   ✅ Nenhuma inconsistência encontrada');
    }
    console.log('');

    // 7. Resumo
    console.log('📋 RESUMO:');
    console.log(`   Total de tickets: ${tickets.length}`);
    console.log(`   Tickets concluídos: ${concluidos.length}`);
    console.log(`   Tickets em geral: ${gerais.length}`);
    console.log(`   Tickets em operação: ${emOperacao.length}`);
    console.log(`   Inconsistências: ${problemas.length}`);
    console.log('');

    if (problemas.length > 0) {
      console.log('❌ PROBLEMAS ENCONTRADOS - Correção necessária');
      process.exit(1);
    } else {
      console.log('✅ Todos os tickets estão consistentes');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testTicketStatus();

