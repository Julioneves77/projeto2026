#!/usr/bin/env node

/**
 * Script para monitorar scripts externos carregados dinamicamente
 * Detecta injeção de código e scripts suspeitos
 */

const fs = require('fs');
const path = require('path');

const SUSPICIOUS_DOMAINS = [
  'userstat.net',
  'userstat.com',
  'stat.net'
];

const SUSPICIOUS_PATTERNS = [
  /window\.location\s*=\s*['"]https?:\/\//gi,
  /document\.location\s*=\s*['"]https?:\/\//gi,
  /location\.href\s*=\s*['"]https?:\/\//gi,
  /window\.open\(['"]https?:\/\//gi,
  /eval\(/gi,
  /Function\(/gi,
  /document\.write\(/gi,
  /innerHTML\s*=\s*['"]<script/gi
];

console.log('🔍 Verificando scripts externos e código suspeito\n');

/**
 * Verifica arquivos JavaScript buildados
 */
function checkBuiltJavaScript() {
  console.log('📦 Verificando arquivos JavaScript buildados...\n');
  
  const distAssetsDir = path.join(__dirname, '..', 'PORTAL_ACESSO', 'dist', 'assets');
  
  if (!fs.existsSync(distAssetsDir)) {
    console.log('⚠️  Diretório dist/assets não encontrado\n');
    return [];
  }
  
  const jsFiles = fs.readdirSync(distAssetsDir)
    .filter(file => file.endsWith('.js'));
  
  const findings = [];
  
  jsFiles.forEach(file => {
    const filePath = path.join(distAssetsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar domínios suspeitos
    SUSPICIOUS_DOMAINS.forEach(domain => {
      if (content.includes(domain)) {
        findings.push({
          file,
          type: 'suspicious_domain',
          domain,
          severity: 'HIGH'
        });
      }
    });
    
    // Verificar padrões suspeitos (apenas os críticos)
    const criticalPatterns = [
      /eval\(['"]/gi,  // eval com string literal (mais suspeito)
      /document\.write\(['"]<script/gi,  // document.write com script
      /innerHTML\s*=\s*['"]<script/gi  // innerHTML com script
    ];
    
    criticalPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        findings.push({
          file,
          type: 'suspicious_pattern',
          pattern: pattern.source,
          matches: matches.length,
          severity: 'CRITICAL'
        });
      }
    });
  });
  
  if (findings.length > 0) {
    console.log('⚠️  PROBLEMAS ENCONTRADOS:\n');
    findings.forEach(f => {
      const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : '🟡';
      console.log(`   ${icon} ${f.file}`);
      if (f.type === 'suspicious_domain') {
        console.log(`      Tipo: Domínio suspeito`);
        console.log(`      Domínio: ${f.domain}`);
      } else {
        console.log(`      Tipo: Padrão suspeito`);
        console.log(`      Padrão: ${f.pattern}`);
        console.log(`      Ocorrências: ${f.matches}`);
      }
      console.log(`      Severidade: ${f.severity}\n`);
    });
  } else {
    console.log('✅ Nenhum problema encontrado nos arquivos JavaScript buildados\n');
  }
  
  return findings;
}

/**
 * Verifica código fonte TypeScript/JavaScript
 */
function checkSourceCode() {
  console.log('📁 Verificando código fonte...\n');
  
  const srcDir = path.join(__dirname, '..', 'PORTAL_ACESSO', 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.log('⚠️  Diretório src não encontrado\n');
    return [];
  }
  
  const findings = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        
        SUSPICIOUS_DOMAINS.forEach(domain => {
          if (content.includes(domain)) {
            findings.push({
              file: relativePath,
              type: 'suspicious_domain',
              domain,
              severity: 'HIGH'
            });
          }
        });
        
        // Verificar padrões críticos apenas
        const criticalPatterns = [
          /eval\(/gi,
          /Function\(/gi,
          /document\.write\(/gi
        ];
        
        criticalPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            findings.push({
              file: relativePath,
              type: 'critical_pattern',
              pattern: pattern.source,
              severity: 'CRITICAL'
            });
          }
        });
      }
    });
  }
  
  scanDirectory(srcDir);
  
  if (findings.length > 0) {
    console.log('⚠️  PROBLEMAS ENCONTRADOS:\n');
    findings.forEach(f => {
      const icon = f.severity === 'CRITICAL' ? '🔴' : '🟠';
      console.log(`   ${icon} ${f.file}`);
      if (f.type === 'suspicious_domain') {
        console.log(`      Domínio suspeito: ${f.domain}`);
      } else {
        console.log(`      Padrão crítico: ${f.pattern}`);
      }
      console.log(`      Severidade: ${f.severity}\n`);
    });
  } else {
    console.log('✅ Nenhum problema encontrado no código fonte\n');
  }
  
  return findings;
}

/**
 * Gera script HTML para monitoramento em tempo real
 */
function generateMonitoringScript() {
  console.log('📝 Gerando script de monitoramento para o navegador...\n');
  
  const monitoringScript = `
// Script de monitoramento de segurança
// Cole este código no console do navegador ao acessar www.portalacesso.online

(function() {
  console.log('🔍 Iniciando monitoramento de segurança...');
  
  const suspiciousDomains = ['userstat.net', 'userstat.com', 'stat.net'];
  const findings = [];
  
  // Monitorar scripts carregados
  const originalAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function(child) {
    if (child.tagName === 'SCRIPT' && child.src) {
      suspiciousDomains.forEach(domain => {
        if (child.src.includes(domain)) {
          findings.push({
            type: 'script_loaded',
            url: child.src,
            severity: 'HIGH'
          });
          console.error('🔴 Script suspeito carregado:', child.src);
        }
      });
    }
    return originalAppendChild.call(this, child);
  };
  
  // Monitorar redirecionamentos
  let redirectDetected = false;
  const originalLocationSet = Object.getOwnPropertyDescriptor(window, 'location').set;
  Object.defineProperty(window, 'location', {
    set: function(value) {
      suspiciousDomains.forEach(domain => {
        if (value.includes(domain)) {
          redirectDetected = true;
          findings.push({
            type: 'redirect',
            url: value,
            severity: 'CRITICAL'
          });
          console.error('🔴 Redirecionamento suspeito detectado:', value);
        }
      });
      originalLocationSet.call(window, value);
    },
    get: function() {
      return originalLocationSet.get.call(window);
    }
  });
  
  // Monitorar mudanças no DOM
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'SCRIPT' && node.src) {
            suspiciousDomains.forEach(domain => {
              if (node.src.includes(domain)) {
                findings.push({
                  type: 'dom_script_injection',
                  url: node.src,
                  severity: 'HIGH'
                });
                console.error('🔴 Script injetado no DOM:', node.src);
              }
            });
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Verificar scripts já carregados
  document.querySelectorAll('script[src]').forEach(function(script) {
    suspiciousDomains.forEach(domain => {
      if (script.src.includes(domain)) {
        findings.push({
          type: 'existing_script',
          url: script.src,
          severity: 'HIGH'
        });
        console.error('🔴 Script suspeito já presente:', script.src);
      }
    });
  });
  
  // Relatório após 5 segundos
  setTimeout(function() {
    console.log('\\n📊 RELATÓRIO DE MONITORAMENTO:');
    console.log('Encontrados:', findings.length, 'problemas');
    findings.forEach(function(f, i) {
      console.log(\`\\n\${i + 1}. \${f.type}\`);
      console.log('   URL:', f.url);
      console.log('   Severidade:', f.severity);
    });
    
    if (findings.length === 0) {
      console.log('✅ Nenhum problema detectado durante o monitoramento');
    }
  }, 5000);
})();
`;
  
  const outputPath = path.join(__dirname, '..', 'scripts', 'browser-monitor.js');
  fs.writeFileSync(outputPath, monitoringScript.trim());
  
  console.log(`✅ Script gerado em: ${outputPath}`);
  console.log('\n💡 Para usar:');
  console.log('   1. Abra www.portalacesso.online no navegador');
  console.log('   2. Abra o Console do Desenvolvedor (F12)');
  console.log(`   3. Cole o conteúdo de ${outputPath}\n`);
}

// Executar verificações
const buildFindings = checkBuiltJavaScript();
const sourceFindings = checkSourceCode();
generateMonitoringScript();

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VERIFICAÇÃO\n');
console.log(`JavaScript buildado: ${buildFindings.length > 0 ? '⚠️  PROBLEMAS ENCONTRADOS' : '✅ Limpo'}`);
console.log(`Código fonte: ${sourceFindings.length > 0 ? '⚠️  PROBLEMAS ENCONTRADOS' : '✅ Limpo'}`);
console.log('\n' + '='.repeat(60));
console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('   1. Execute o script de monitoramento no navegador');
console.log('   2. Execute: bash scripts/check-server-logs.sh');
console.log('   3. Execute: bash scripts/verify-dns-redirects.sh\n');

