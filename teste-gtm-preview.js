/**
 * Script para testar no GTM Preview Mode
 * Execute este script no Console do navegador quando estiver em solicite.link com Preview Mode ativo
 */

console.log('🧪 Teste Automático - GTM Preview Mode');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Função para aguardar
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runGTMTests() {
    console.log('1️⃣ Verificando dataLayer...');
    
    // Verificar dataLayer
    if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
        console.log('✅ dataLayer existe');
        console.log(`   📊 Total de eventos: ${window.dataLayer.length}`);
    } else {
        console.error('❌ dataLayer não encontrado');
        return;
    }
    
    console.log('\n2️⃣ Verificando utm_campaign...');
    
    // Verificar utm_campaign na URL
    const urlParams = new URLSearchParams(window.location.search);
    let utmCampaign = urlParams.get('utm_campaign');
    
    if (!utmCampaign) {
        utmCampaign = localStorage.getItem('utm_campaign');
    }
    
    if (utmCampaign) {
        console.log(`✅ utm_campaign encontrado: "${utmCampaign}"`);
        
        // Salvar no localStorage se não estiver
        if (!localStorage.getItem('utm_campaign')) {
            localStorage.setItem('utm_campaign', utmCampaign);
            console.log('   💾 Salvo no localStorage');
        }
    } else {
        console.warn('⚠️ utm_campaign não encontrado');
        console.log('   💡 Adicione ?utm_campaign=teste_conta_1 na URL');
        return;
    }
    
    console.log('\n3️⃣ Simulando evento payment_completed...');
    
    // Simular evento payment_completed
    const paymentEvent = {
        event: 'payment_completed',
        funnel_step: 'payment_success',
        source: 'links',
        utm_campaign: utmCampaign,
        value: 'padrao',
        timestamp: Date.now()
    };
    
    window.dataLayer.push(paymentEvent);
    console.log('✅ Evento disparado:', paymentEvent);
    
    // Aguardar um pouco
    await wait(1000);
    
    console.log('\n4️⃣ Verificando eventos no dataLayer...');
    const eventsWithUtm = window.dataLayer.filter(e => e.event && e.utm_campaign);
    console.log(`   📋 Eventos com utm_campaign: ${eventsWithUtm.length}`);
    eventsWithUtm.forEach((e, i) => {
        console.log(`      ${i + 1}. ${e.event}: utm_campaign="${e.utm_campaign}"`);
    });
    
    console.log('\n5️⃣ Verificando qual conta deveria receber...');
    let accountId = '';
    if (utmCampaign.includes('conta_1')) {
        accountId = '591-659-0517';
        console.log(`✅ Conta identificada: ${accountId} (Conta 1)`);
    } else if (utmCampaign.includes('conta_2')) {
        accountId = '471-059-5347';
        console.log(`✅ Conta identificada: ${accountId} (Conta 2)`);
    } else {
        console.warn(`⚠️ Conta não identificada (campanha deve conter "conta_1" ou "conta_2")`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO:');
    console.log(`   utm_campaign: ${utmCampaign || 'não encontrado'}`);
    console.log(`   Conta esperada: ${accountId || 'não identificada'}`);
    console.log(`   Eventos no dataLayer: ${window.dataLayer.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   1. No GTM Preview Mode, clique no evento "payment_completed"');
    console.log('   2. Vá na aba "Variáveis"');
    console.log('   3. Verifique se DLV - utm_campaign mostra:', utmCampaign);
    console.log('   4. Verifique se google_ads_account mostra:', accountId || 'undefined');
    console.log('   5. Vá na aba "Tags"');
    console.log('   6. Verifique se a tag correta disparou');
    
    return {
        utmCampaign,
        accountId,
        eventDispatched: true
    };
}

// Executar automaticamente
runGTMTests().then(result => {
    if (result) {
        console.log('\n✅ Teste concluído! Verifique o GTM Preview Mode.');
    }
}).catch(error => {
    console.error('❌ Erro ao executar teste:', error);
});

