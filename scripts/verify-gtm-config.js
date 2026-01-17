#!/usr/bin/env node

/**
 * Script para verificar configuração do Google Tag Manager
 * Ajuda a identificar tags suspeitas que possam estar causando redirecionamento
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GTM_CONTAINER_ID = 'GTM-W7PVKNQS';
const SUSPICIOUS_DOMAINS = ['userstat.net', 'userstat.com', 'stat.net'];

console.log('🔍 Verificando configuração do Google Tag Manager\n');
console.log(`Container ID: ${GTM_CONTAINER_ID}\n`);

/**
 * Verifica se há referências a domínios suspeitos no código fonte
 */
function checkSourceCode() {
  console.log('📁 Verificando código fonte...\n');
  
  const portalAcessoDir = path.join(__dirname, '..', 'PORTAL_ACESSO');
  const filesToCheck = [
    'index.html',
    'src/lib/dataLayer.ts',
    'src/pages/Home.tsx',
    'src/pages/EventProxy.tsx'
  ];
  
  const findings = [];
  
  filesToCheck.forEach(file => {
    const filePath = path.join(portalAcessoDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      SUSPICIOUS_DOMAINS.forEach(domain => {
        if (content.includes(domain)) {
          findings.push({
            file,
            domain,
            line: content.split('\n').findIndex(line => line.includes(domain)) + 1
          });
        }
      });
    }
  });
  
  if (findings.length > 0) {
    console.log('⚠️  REFERÊNCIAS SUSPEITAS ENCONTRADAS:\n');
    findings.forEach(f => {
      console.log(`   📄 ${f.file}:${f.line} - Referência a ${f.domain}`);
    });
    console.log('');
  } else {
    console.log('✅ Nenhuma referência suspeita encontrada no código fonte\n');
  }
  
  return findings;
}

/**
 * Verifica o HTML buildado no servidor
 */
function checkBuiltHTML() {
  console.log('📦 Verificando HTML buildado...\n');
  
  const distIndexPath = path.join(__dirname, '..', 'PORTAL_ACESSO', 'dist', 'index.html');
  
  if (!fs.existsSync(distIndexPath)) {
    console.log('⚠️  Arquivo dist/index.html não encontrado localmente\n');
    return [];
  }
  
  const content = fs.readFileSync(distIndexPath, 'utf8');
  const findings = [];
  
  SUSPICIOUS_DOMAINS.forEach(domain => {
    if (content.includes(domain)) {
      findings.push({ domain, location: 'dist/index.html' });
    }
  });
  
  // Verificar scripts carregados
  const scriptMatches = content.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
  scriptMatches.forEach(match => {
    SUSPICIOUS_DOMAINS.forEach(domain => {
      if (match.includes(domain)) {
        findings.push({ domain, location: `Script tag em dist/index.html: ${match}` });
      }
    });
  });
  
  if (findings.length > 0) {
    console.log('⚠️  REFERÊNCIAS SUSPEITAS NO BUILD:\n');
    findings.forEach(f => {
      console.log(`   🔴 ${f.domain} encontrado em: ${f.location}`);
    });
    console.log('');
  } else {
    console.log('✅ Nenhuma referência suspeita no HTML buildado\n');
  }
  
  return findings;
}

/**
 * Gera instruções para verificação manual no GTM
 */
function generateGTMChecklist() {
  console.log('📋 CHECKLIST PARA VERIFICAÇÃO MANUAL NO GTM:\n');
  console.log('1. Acesse: https://tagmanager.google.com/');
  console.log(`2. Selecione o container: ${GTM_CONTAINER_ID}\n`);
  console.log('3. Verifique as seguintes seções:\n');
  console.log('   📌 TAGS:');
  console.log('      - Verifique TODAS as tags ativas');
  console.log('      - Procure por tags que redirecionam (Custom HTML, Custom JavaScript)');
  console.log('      - Verifique tags de terceiros (Analytics, Facebook Pixel, etc)');
  console.log('      - Procure por referências a "userstat.net" ou domínios similares\n');
  console.log('   📌 TRIGGERS:');
  console.log('      - Verifique triggers que executam em "All Pages"');
  console.log('      - Verifique triggers customizados que possam estar causando redirecionamento\n');
  console.log('   📌 VARIÁVEIS:');
  console.log('      - Verifique variáveis customizadas que possam conter URLs suspeitas\n');
  console.log('   📌 HISTÓRICO:');
  console.log('      - Verifique o histórico de mudanças recentes');
  console.log('      - Procure por alterações que possam ter introduzido código malicioso\n');
  console.log('4. Se encontrar tags suspeitas:');
  console.log('      - Desative imediatamente');
  console.log('      - Anote o nome da tag e configuração');
  console.log('      - Verifique quando foi criada/modificada\n');
}

/**
 * Verifica se o GTM está carregando scripts suspeitos
 */
function checkGTMScript() {
  console.log('🌐 Verificando script do GTM...\n');
  
  const gtmScript = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
  
  console.log(`URL do GTM: ${gtmScript}\n`);
  console.log('⚠️  Para verificar o conteúdo do script:');
  console.log(`   1. Abra: ${gtmScript}`);
  console.log('   2. Procure por "userstat" ou domínios suspeitos');
  console.log('   3. Verifique se há redirecionamentos ou scripts externos\n');
}

// Executar verificações
const sourceFindings = checkSourceCode();
const buildFindings = checkBuiltHTML();
generateGTMChecklist();
checkGTMScript();

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VERIFICAÇÃO\n');
console.log(`Código fonte: ${sourceFindings.length > 0 ? '⚠️  PROBLEMAS ENCONTRADOS' : '✅ Limpo'}`);
console.log(`Build: ${buildFindings.length > 0 ? '⚠️  PROBLEMAS ENCONTRADOS' : '✅ Limpo'}`);
console.log('\n' + '='.repeat(60));
console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('   1. Verifique manualmente o painel do GTM seguindo o checklist acima');
console.log('   2. Execute: node scripts/verify-external-scripts.js');
console.log('   3. Execute: bash scripts/check-server-logs.sh\n');

