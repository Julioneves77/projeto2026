#!/usr/bin/env node

/**
 * Script para validar se um domínio está coletando eventos do funil corretamente
 * 
 * Uso: node scripts/validar-dominio-funil.js [dominio]
 * Exemplo: node scripts/validar-dominio-funil.js exemplo.com
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const DOMINIO = process.argv[2];

if (!DOMINIO) {
  console.log('❌ Uso: node scripts/validar-dominio-funil.js [dominio]');
  console.log('   Exemplo: node scripts/validar-dominio-funil.js exemplo.com');
  process.exit(1);
}

const DB_FILE = path.join(__dirname, '..', 'funnel-database.db');

try {
  const db = new Database(DB_FILE);

  console.log(`\n🔍 Validando domínio: ${DOMINIO}\n`);

  // Buscar eventos do domínio
  const stmt = db.prepare(`
    SELECT 
      event_type,
      COUNT(*) as total,
      MIN(datetime(timestamp/1000, 'unixepoch')) as primeira_ocorrencia,
      MAX(datetime(timestamp/1000, 'unixepoch')) as ultima_ocorrencia
    FROM funnel_events
    WHERE domain = ?
    GROUP BY event_type
    ORDER BY total DESC
  `);

  const eventos = stmt.all(DOMINIO);

  if (eventos.length === 0) {
    console.log('⚠️  Nenhum evento encontrado para este domínio!');
    console.log('\n📋 Verificações:');
    console.log('   1. O domínio está enviando eventos para /funnel-events?');
    console.log('   2. O campo "domain" está sendo enviado corretamente?');
    console.log('   3. VITE_COLLECTOR_ENABLED está como "true"?');
    console.log('   4. VITE_SYNC_SERVER_URL está configurado?');
    process.exit(1);
  }

  console.log('✅ Eventos encontrados:\n');
  
  const eventosEsperados = [
    'links_view',
    'links_cta_click',
    'portal_view',
    'form_start',
    'form_submit_success',
    'pix_view',
    'pix_initiated',
    'payment_confirmed'
  ];

  const eventosEncontrados = eventos.map(e => e.event_type);
  const eventosFaltando = eventosEsperados.filter(e => !eventosEncontrados.includes(e));

  eventos.forEach(evento => {
    const emoji = evento.event_type === 'payment_confirmed' ? '⭐' : '✅';
    console.log(`${emoji} ${evento.event_type.padEnd(25)} ${evento.total.toString().padStart(5)} eventos`);
    console.log(`   Primeira: ${evento.primeira_ocorrencia}`);
    console.log(`   Última:   ${evento.ultima_ocorrencia}\n`);
  });

  if (eventosFaltando.length > 0) {
    console.log('⚠️  Eventos não encontrados:');
    eventosFaltando.forEach(e => {
      console.log(`   - ${e}`);
    });
    console.log('');
  }

  // Verificar campanhas
  const campanhasStmt = db.prepare(`
    SELECT DISTINCT utm_campaign, COUNT(*) as total
    FROM funnel_events
    WHERE domain = ? AND utm_campaign IS NOT NULL
    GROUP BY utm_campaign
    ORDER BY total DESC
  `);

  const campanhas = campanhasStmt.all(DOMINIO);

  if (campanhas.length > 0) {
    console.log('📊 Campanhas encontradas:');
    campanhas.forEach(c => {
      console.log(`   - ${c.utm_campaign}: ${c.total} eventos`);
    });
    console.log('');
  } else {
    console.log('⚠️  Nenhuma campanha (utm_campaign) encontrada!');
    console.log('   Use ?utm_campaign=nome nas URLs para agrupar por campanha\n');
  }

  // Verificar pagamentos
  const pagamentosStmt = db.prepare(`
    SELECT COUNT(*) as total
    FROM funnel_events
    WHERE domain = ? AND event_type = 'payment_confirmed'
  `);

  const pagamentos = pagamentosStmt.get(DOMINIO);

  console.log('💰 Resumo:');
  console.log(`   Total de eventos: ${eventos.reduce((sum, e) => sum + e.total, 0)}`);
  console.log(`   Tipos de eventos: ${eventos.length}/${eventosEsperados.length}`);
  console.log(`   Pagamentos confirmados: ${pagamentos.total}`);
  console.log(`   Campanhas: ${campanhas.length}`);

  // Status geral
  const temPagamentos = pagamentos.total > 0;
  const temTodosEventos = eventosFaltando.length === 0;
  const temCampanhas = campanhas.length > 0;

  console.log('\n📊 Status:');
  if (temPagamentos && temTodosEventos && temCampanhas) {
    console.log('   ✅ EXCELENTE - Domínio totalmente configurado!');
  } else if (temPagamentos && temTodosEventos) {
    console.log('   ✅ BOM - Funcionando, mas adicione utm_campaign nas URLs');
  } else if (temTodosEventos) {
    console.log('   ⚠️  PARCIAL - Eventos coletados, mas sem pagamentos ainda');
  } else {
    console.log('   ⚠️  INCOMPLETO - Alguns eventos estão faltando');
  }

  console.log('\n🌐 Para ver na Aba Coração:');
  console.log('   1. Acesse PLATAFORMA → Aba Coração');
  console.log(`   2. Selecione período que inclui eventos de ${DOMINIO}`);
  console.log('   3. Os dados devem aparecer automaticamente!\n');

  db.close();
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

