#!/usr/bin/env node

/**
 * Ferramenta de monitoramento de segurança
 * Monitora redirecionamentos e detecta código malicioso em tempo real
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const DOMAIN = 'www.portalacesso.online';
const SUSPICIOUS_DOMAINS = ['userstat.net', 'userstat.com', 'stat.net'];
const CHECK_INTERVAL = 30000; // 30 segundos

console.log('🔍 Monitoramento de Segurança');
console.log(`Domínio: ${DOMAIN}`);
console.log(`Intervalo: ${CHECK_INTERVAL / 1000} segundos\n`);

let checkCount = 0;
let issuesFound = [];

/**
 * Faz requisição HTTP/HTTPS e verifica redirecionamentos
 */
function checkDomain() {
  checkCount++;
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Verificação #${checkCount}...`);
  
  const options = {
    hostname: DOMAIN,
    port: 443,
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'SecurityMonitor/1.0'
    },
    maxRedirects: 5,
    followRedirect: false
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      // Verificar status code
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location || '';
        console.log(`   ⚠️  Redirecionamento ${res.statusCode} detectado`);
        console.log(`   Location: ${location}`);
        
        // Verificar se é suspeito
        const isSuspicious = SUSPICIOUS_DOMAINS.some(domain => 
          location.toLowerCase().includes(domain)
        );
        
        if (isSuspicious) {
          const issue = {
            timestamp,
            type: 'redirect',
            statusCode: res.statusCode,
            location,
            severity: 'CRITICAL'
          };
          
          issuesFound.push(issue);
          console.log(`   🔴 REDIRECIONAMENTO SUSPEITO PARA: ${location}`);
        }
      } else {
        console.log(`   ✅ Status: ${res.statusCode}`);
      }
      
      // Ler conteúdo
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Verificar conteúdo HTML
        if (data) {
          const suspiciousInContent = SUSPICIOUS_DOMAINS.some(domain => 
            data.toLowerCase().includes(domain)
          );
          
          if (suspiciousInContent) {
            const issue = {
              timestamp,
              type: 'content',
              domain: SUSPICIOUS_DOMAINS.find(d => data.toLowerCase().includes(d)),
              severity: 'HIGH'
            };
            
            issuesFound.push(issue);
            console.log(`   🔴 REFERÊNCIA SUSPEITA NO CONTEÚDO`);
            
            // Encontrar linha específica
            const lines = data.split('\n');
            lines.forEach((line, index) => {
              if (SUSPICIOUS_DOMAINS.some(d => line.toLowerCase().includes(d))) {
                console.log(`   Linha ${index + 1}: ${line.substring(0, 100)}...`);
              }
            });
          }
          
          // Verificar scripts carregados
          const scriptMatches = data.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
          scriptMatches.forEach(match => {
            SUSPICIOUS_DOMAINS.forEach(domain => {
              if (match.toLowerCase().includes(domain)) {
                const scriptUrl = match.match(/src=["']([^"']+)["']/i)?.[1];
                const issue = {
                  timestamp,
                  type: 'script',
                  url: scriptUrl,
                  severity: 'HIGH'
                };
                
                issuesFound.push(issue);
                console.log(`   🔴 SCRIPT SUSPEITO ENCONTRADO: ${scriptUrl}`);
              }
            });
          });
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ⚠️  Erro na requisição: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`   ⚠️  Timeout na requisição`);
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

/**
 * Gera relatório de problemas encontrados
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE MONITORAMENTO\n');
  
  if (issuesFound.length === 0) {
    console.log('✅ Nenhum problema detectado durante o monitoramento');
  } else {
    console.log(`⚠️  ${issuesFound.length} problema(s) detectado(s):\n`);
    
    const byType = {};
    issuesFound.forEach(issue => {
      if (!byType[issue.type]) {
        byType[issue.type] = [];
      }
      byType[issue.type].push(issue);
    });
    
    Object.keys(byType).forEach(type => {
      console.log(`📌 ${type.toUpperCase()}: ${byType[type].length} ocorrência(s)`);
      byType[type].forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.timestamp}] Severidade: ${issue.severity}`);
        if (issue.location) console.log(`      Location: ${issue.location}`);
        if (issue.url) console.log(`      URL: ${issue.url}`);
        if (issue.domain) console.log(`      Domínio: ${issue.domain}`);
      });
      console.log('');
    });
  }
  
  console.log('='.repeat(60));
  console.log(`\nTotal de verificações: ${checkCount}`);
  console.log(`Problemas encontrados: ${issuesFound.length}\n`);
}

/**
 * Inicia monitoramento contínuo
 */
function startMonitoring() {
  console.log('🚀 Iniciando monitoramento contínuo...');
  console.log('   Pressione Ctrl+C para parar\n');
  
  // Primeira verificação imediata
  checkDomain().catch(console.error);
  
  // Verificações periódicas
  const interval = setInterval(() => {
    checkDomain().catch(console.error);
  }, CHECK_INTERVAL);
  
  // Tratamento de saída
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Parando monitoramento...\n');
    clearInterval(interval);
    generateReport();
    process.exit(0);
  });
  
  // Gerar relatório após 5 minutos
  setTimeout(() => {
    console.log('\n📊 Relatório intermediário:\n');
    generateReport();
    console.log('\n🔄 Continuando monitoramento...\n');
  }, 5 * 60 * 1000);
}

// Verificar argumentos
const args = process.argv.slice(2);
if (args.includes('--once')) {
  // Executar apenas uma vez
  checkDomain()
    .then(() => {
      generateReport();
      process.exit(issuesFound.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Erro:', error.message);
      process.exit(1);
    });
} else {
  // Modo contínuo
  startMonitoring();
}

