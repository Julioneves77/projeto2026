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
    console.log('\n📊 RELATÓRIO DE MONITORAMENTO:');
    console.log('Encontrados:', findings.length, 'problemas');
    findings.forEach(function(f, i) {
      console.log(`\n${i + 1}. ${f.type}`);
      console.log('   URL:', f.url);
      console.log('   Severidade:', f.severity);
    });
    
    if (findings.length === 0) {
      console.log('✅ Nenhum problema detectado durante o monitoramento');
    }
  }, 5000);
})();