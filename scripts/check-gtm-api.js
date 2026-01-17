#!/usr/bin/env node
/**
 * Script para verificar configuração do GTM via API
 * Nota: Requer acesso ao Google Tag Manager API
 */

console.log('🔍 Verificando Google Tag Manager...\n');
console.log('⚠️  Para verificar o GTM manualmente:');
console.log('   1. Acesse: https://tagmanager.google.com/');
console.log('   2. Selecione container: GTM-W7PVKNQS');
console.log('   3. Vá em Tags > Todas as tags');
console.log('   4. Procure por tags que contenham:');
console.log('      - Custom HTML');
console.log('      - Custom JavaScript');
console.log('      - Referências a "userstat" ou "stat.net"');
console.log('      - Redirecionamentos (window.location, document.location)');
console.log('\n💡 Se encontrar tags suspeitas:');
console.log('   - Desative imediatamente');
console.log('   - Verifique quando foi criada/modificada');
console.log('   - Verifique os triggers associados');
