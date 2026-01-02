#!/usr/bin/env node

/**
 * Script para verificar sincronização entre frontend e backend em produção
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
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Timeout')));
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testSync() {
  console.log('🧪 ========== TESTE DE SINCRONIZAÇÃO EM PRODUÇÃO ==========\n');
  console.log(`📡 Servidor: ${SYNC_SERVER_URL}\n`);

  try {
    // 1. Health check
    console.log('1️⃣ Health Check...');
    const health = await makeRequest(`${SYNC_SERVER_URL}/health`);
    if (health.status === 200) {
      console.log(`   ✅ Servidor está funcionando`);
      console.log(`   Resposta:`, health.data);
    } else {
      console.log(`   ❌ Servidor com problemas: ${health.status}`);
      return;
    }
    console.log('');

    // 2. Listar tickets
    console.log('2️⃣ Listando tickets...');
    const ticketsResponse = await makeRequest(`${SYNC_SERVER_URL}/tickets`);
    
    if (ticketsResponse.status !== 200) {
      console.log(`   ❌ Erro ao listar tickets: ${ticketsResponse.status}`);
      console.log(`   Resposta:`, ticketsResponse.data);
      return;
    }

    const tickets = Array.isArray(ticketsResponse.data) ? ticketsResponse.data : [];
    console.log(`   ✅ Total de tickets: ${tickets.length}\n`);

    // 3. Análise de status
    console.log('3️⃣ Análise de Status dos Tickets:\n');
    
    const statusCount = {};
    const concluidos = [];
    const gerais = [];
    const problemas = [];

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
          operador: ticket.operador || 'N/A'
        });
      }

      // Verificar inconsistências
      if (ticket.status === 'CONCLUIDO' && !ticket.dataConclusao) {
        problemas.push({
          codigo: ticket.codigo,
          problema: 'Status CONCLUIDO mas sem dataConclusao'
        });
      }

      if (ticket.dataConclusao && ticket.status !== 'CONCLUIDO') {
        problemas.push({
          codigo: ticket.codigo,
          problema: `Tem dataConclusao mas status é ${ticket.status}`
        });
      }
    });

    console.log('   📊 Distribuição por Status:');
    Object.entries(statusCount).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
    console.log('');

    // 4. Tickets concluídos
    console.log(`4️⃣ Tickets Concluídos (${concluidos.length}):`);
    if (concluidos.length > 0) {
      concluidos.slice(-5).forEach(t => {
        console.log(`   ✅ ${t.codigo} - Operador: ${t.operador}`);
        console.log(`      Conclusão: ${t.dataConclusao}`);
      });
      if (concluidos.length > 5) {
        console.log(`   ... e mais ${concluidos.length - 5} tickets concluídos`);
      }
    } else {
      console.log('   ⚠️ Nenhum ticket concluído encontrado');
    }
    console.log('');

    // 5. Tickets em Geral
    console.log(`5️⃣ Tickets em Geral (${gerais.length}):`);
    if (gerais.length > 0) {
      gerais.slice(-5).forEach(t => {
        console.log(`   📋 ${t.codigo} - Operador: ${t.operador}`);
      });
      if (gerais.length > 5) {
        console.log(`   ... e mais ${gerais.length - 5} tickets em geral`);
      }
    } else {
      console.log('   ℹ️ Nenhum ticket em geral encontrado');
    }
    console.log('');

    // 6. Problemas encontrados
    if (problemas.length > 0) {
      console.log(`6️⃣ ⚠️ Problemas Encontrados (${problemas.length}):`);
      problemas.forEach(p => {
        console.log(`   ❌ ${p.codigo}: ${p.problema}`);
      });
      console.log('');
    } else {
      console.log('6️⃣ ✅ Nenhuma inconsistência encontrada\n');
    }

    // 7. Resumo
    console.log('📋 RESUMO:');
    console.log(`   Total de tickets: ${tickets.length}`);
    console.log(`   Tickets concluídos: ${concluidos.length}`);
    console.log(`   Tickets em geral: ${gerais.length}`);
    console.log(`   Inconsistências: ${problemas.length}`);
    console.log('');

    // 8. Verificar se tickets concluídos apareceriam na aba correta
    console.log('7️⃣ Verificação de Filtros de Abas:');
    console.log(`   Aba "Geral" deve mostrar: ${gerais.length} tickets (status === 'GERAL')`);
    console.log(`   Aba "Concluídos" deve mostrar: ${concluidos.length} tickets (status === 'CONCLUIDO')`);
    
    if (concluidos.length > 0 && problemas.length === 0) {
      console.log(`   ✅ Tickets concluídos estão corretos e apareceriam na aba "Concluídos"`);
    } else if (problemas.length > 0) {
      console.log(`   ⚠️ Há ${problemas.length} tickets com inconsistências que precisam correção`);
    }
    console.log('');

    if (problemas.length > 0) {
      console.log('❌ PROBLEMAS ENCONTRADOS - Correção necessária');
      process.exit(1);
    } else {
      console.log('✅ Sistema está sincronizado corretamente');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testSync();


