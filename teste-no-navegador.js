/**
 * Script para testar se utm_campaign está funcionando
 * Execute este script no Console do navegador (F12) quando estiver em solicite.link
 * 
 * INSTRUÇÕES:
 * 1. Acesse: https://solicite.link?utm_campaign=teste_conta_1
 * 2. Abra Console (F12)
 * 3. Cole e execute este script completo
 */

console.log('🧪 Iniciando teste automático de utm_campaign...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function test(name, condition, message) {
    if (condition) {
        console.log(`✅ ${name}: ${message}`);
        testResults.passed++;
    } else {
        console.error(`❌ ${name}: ${message}`);
        testResults.failed++;
    }
}

function warn(name, message) {
    console.warn(`⚠️ ${name}: ${message}`);
    testResults.warnings++;
}

// Teste 1: Verificar dataLayer
console.log('\n1️⃣ Verificando dataLayer...');
if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
    test('dataLayer', true, 'dataLayer existe e está funcionando');
    console.log(`   📊 Total de eventos no dataLayer: ${window.dataLayer.length}`);
} else {
    test('dataLayer', false, 'dataLayer não encontrado');
}

// Teste 2: Verificar utm_campaign na URL
console.log('\n2️⃣ Verificando utm_campaign na URL...');
const urlParams = new URLSearchParams(window.location.search);
const urlCampaign = urlParams.get('utm_campaign');

if (urlCampaign) {
    test('utm_campaign na URL', true, `Encontrado: "${urlCampaign}"`);
} else {
    warn('utm_campaign na URL', 'Não encontrado. Adicione ?utm_campaign=teste_conta_1 na URL');
}

// Teste 3: Verificar localStorage
console.log('\n3️⃣ Verificando localStorage...');
let storedCampaign = null;
try {
    storedCampaign = localStorage.getItem('utm_campaign');
    if (storedCampaign) {
        test('utm_campaign no localStorage', true, `Encontrado: "${storedCampaign}"`);
    } else {
        warn('utm_campaign no localStorage', 'Não encontrado (será salvo quando código estiver em produção)');
    }
} catch (e) {
    warn('localStorage', 'Erro ao acessar localStorage: ' + e.message);
}

// Teste 4: Verificar se eventos têm utm_campaign
console.log('\n4️⃣ Verificando eventos no dataLayer...');
const eventsWithUtm = window.dataLayer.filter(e => e.event && e.utm_campaign);
if (eventsWithUtm.length > 0) {
    test('Eventos com utm_campaign', true, `${eventsWithUtm.length} evento(s) encontrado(s)`);
    console.log('   📋 Eventos com utm_campaign:');
    eventsWithUtm.forEach((e, i) => {
        console.log(`      ${i + 1}. ${e.event}: utm_campaign="${e.utm_campaign}"`);
    });
} else {
    warn('Eventos com utm_campaign', 'Nenhum evento com utm_campaign encontrado no dataLayer');
    console.log('   💡 Isso pode ser normal se o código ainda não está em produção');
}

// Teste 5: Simular evento payment_completed
console.log('\n5️⃣ Simulando evento payment_completed...');
const testUtmCampaign = urlCampaign || storedCampaign || 'teste_conta_1';

const paymentEvent = {
    event: 'payment_completed',
    funnel_step: 'payment_success',
    source: 'links',
    utm_campaign: testUtmCampaign,
    value: 'padrao',
    timestamp: Date.now()
};

window.dataLayer.push(paymentEvent);
console.log('   ✅ Evento disparado:', paymentEvent);

// Verificar se foi adicionado ao dataLayer
const lastEvent = window.dataLayer[window.dataLayer.length - 1];
if (lastEvent.event === 'payment_completed' && lastEvent.utm_campaign) {
    test('payment_completed com utm_campaign', true, `utm_campaign="${lastEvent.utm_campaign}"`);
} else {
    test('payment_completed com utm_campaign', false, 'utm_campaign não foi incluído');
}

// Teste 6: Verificar mapeamento de contas
console.log('\n6️⃣ Verificando mapeamento de contas...');
if (testUtmCampaign) {
    if (testUtmCampaign.includes('conta_1')) {
        test('Mapeamento de conta', true, 'Conta identificada: 591-659-0517');
    } else if (testUtmCampaign.includes('conta_2')) {
        test('Mapeamento de conta', true, 'Conta identificada: 471-059-5347');
    } else {
        warn('Mapeamento de conta', `Campanha "${testUtmCampaign}" não contém "conta_1" ou "conta_2"`);
    }
}

// Teste 7: Verificar GTM
console.log('\n7️⃣ Verificando GTM...');
if (typeof window.google_tag_manager !== 'undefined') {
    test('GTM carregado', true, 'Google Tag Manager está carregado');
    const gtmContainer = window.google_tag_manager['GTM-5M37FK67'];
    if (gtmContainer) {
        test('Container GTM-5M37FK67', true, 'Container encontrado');
    } else {
        test('Container GTM-5M37FK67', false, 'Container não encontrado');
    }
} else {
    test('GTM carregado', false, 'Google Tag Manager não está carregado');
}

// Resumo final
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RESUMO DOS TESTES:');
console.log(`   ✅ Sucessos: ${testResults.passed}`);
console.log(`   ❌ Falhas: ${testResults.failed}`);
console.log(`   ⚠️ Avisos: ${testResults.warnings}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (testResults.failed === 0 && testResults.passed > 0) {
    console.log('🎉 Todos os testes passaram! O código está funcionando corretamente.');
} else if (testResults.failed > 0) {
    console.log('⚠️ Alguns testes falharam. Verifique se o código está em produção.');
    console.log('💡 Execute novamente após fazer deploy do código.');
} else {
    console.log('💡 Execute os testes novamente após acessar com ?utm_campaign=teste_conta_1 na URL');
}

console.log('\n💡 Para testar no GTM Preview Mode:');
console.log('   1. Abra GTM Preview Mode');
console.log('   2. Acesse: https://solicite.link?utm_campaign=teste_conta_1');
console.log('   3. Clique no evento payment_completed');
console.log('   4. Vá na aba "Variáveis"');
console.log('   5. Verifique se DLV - utm_campaign mostra: teste_conta_1');
console.log('   6. Verifique se google_ads_account mostra: 591-659-0517');

