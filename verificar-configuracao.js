/**
 * Script para verificar se a configuração de duas contas está funcionando
 * Execute este script no Console do navegador (F12) quando estiver em solicite.link
 */

console.log('🧪 Iniciando verificação da configuração...\n');

// 1. Verificar dataLayer
console.log('1️⃣ Verificando dataLayer...');
if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
    console.log('✅ dataLayer existe');
    console.log('📊 Eventos no dataLayer:', window.dataLayer.length);
} else {
    console.error('❌ dataLayer não encontrado');
}

// 2. Verificar utm_campaign
console.log('\n2️⃣ Verificando utm_campaign...');
const urlParams = new URLSearchParams(window.location.search);
let utmCampaign = urlParams.get('utm_campaign');

if (!utmCampaign) {
    utmCampaign = localStorage.getItem('utm_campaign');
}

if (utmCampaign) {
    console.log('✅ utm_campaign encontrado:', utmCampaign);
    console.log('📍 Fonte:', urlParams.get('utm_campaign') ? 'URL' : 'localStorage');
} else {
    console.warn('⚠️ utm_campaign não encontrado');
    console.log('💡 Adicione ?utm_campaign=teste_conta_1 na URL');
}

// 3. Verificar mapeamento de contas
console.log('\n3️⃣ Verificando mapeamento de contas...');
if (utmCampaign) {
    if (utmCampaign.includes('conta_1')) {
        console.log('✅ Conta identificada: 591-659-0517');
    } else if (utmCampaign.includes('conta_2')) {
        console.log('✅ Conta identificada: 471-059-5347');
    } else {
        console.warn('⚠️ Conta não identificada');
        console.log('💡 A campanha deve conter "conta_1" ou "conta_2"');
    }
} else {
    console.warn('⚠️ Não é possível verificar mapeamento sem utm_campaign');
}

// 4. Verificar localStorage
console.log('\n4️⃣ Verificando localStorage...');
const storedUtm = localStorage.getItem('utm_campaign');
const funnelId = localStorage.getItem('funnel_id');

if (storedUtm) {
    console.log('✅ utm_campaign no localStorage:', storedUtm);
} else {
    console.warn('⚠️ utm_campaign não está no localStorage');
}

if (funnelId) {
    console.log('✅ funnel_id no localStorage:', funnelId);
}

// 5. Simular evento payment_completed
console.log('\n5️⃣ Simulando evento payment_completed...');
const testEvent = {
    event: 'payment_completed',
    funnel_step: 'payment_success',
    source: 'links',
    utm_campaign: utmCampaign || 'teste_conta_1',
    value: 'padrao',
    timestamp: Date.now()
};

window.dataLayer.push(testEvent);
console.log('✅ Evento disparado:', testEvent);

// 6. Verificar se GTM está carregado
console.log('\n6️⃣ Verificando GTM...');
if (typeof window.google_tag_manager !== 'undefined') {
    console.log('✅ GTM está carregado');
    const gtmContainer = window.google_tag_manager['GTM-5M37FK67'];
    if (gtmContainer) {
        console.log('✅ Container GTM-5M37FK67 encontrado');
    } else {
        console.warn('⚠️ Container GTM-5M37FK67 não encontrado');
    }
} else {
    console.warn('⚠️ GTM não está carregado');
}

// 7. Resumo
console.log('\n📋 RESUMO:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('dataLayer:', typeof window.dataLayer !== 'undefined' ? '✅' : '❌');
console.log('utm_campaign:', utmCampaign || '❌ Não encontrado');
console.log('Conta identificada:', utmCampaign?.includes('conta_1') ? '591-659-0517' : utmCampaign?.includes('conta_2') ? '471-059-5347' : '❌ Não identificada');
console.log('GTM carregado:', typeof window.google_tag_manager !== 'undefined' ? '✅' : '❌');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 Para testar com outra conta, adicione ?utm_campaign=teste_conta_2 na URL');

