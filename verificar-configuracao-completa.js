#!/usr/bin/env node

/**
 * Script de verificação completa da configuração
 * Verifica se o código está correto para disparar tags corretas no GTM
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificação Completa da Configuração');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const results = {
    passed: [],
    failed: [],
    warnings: []
};

function checkFile(filePath, checks) {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
        results.failed.push({
            file: filePath,
            check: 'Arquivo existe',
            message: 'Arquivo não encontrado'
        });
        return false;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    checks.forEach(check => {
        const { name, pattern, required = true, message } = check;
        const found = pattern.test(content);
        
        if (found) {
            results.passed.push({
                file: filePath,
                check: name,
                message: message || 'OK'
            });
        } else {
            if (required) {
                results.failed.push({
                    file: filePath,
                    check: name,
                    message: message || 'Não encontrado'
                });
            } else {
                results.warnings.push({
                    file: filePath,
                    check: name,
                    message: message || 'Não encontrado (opcional)'
                });
            }
        }
    });
    
    return true;
}

console.log('📁 Verificando arquivos...\n');

// Verificar funnelTracker.ts
console.log('1️⃣ Verificando funnelTracker.ts...');
checkFile('SOLICITE LINK/src/lib/funnelTracker.ts', [
    {
        name: 'getUtmCampaign exportado',
        pattern: /export\s+function\s+getUtmCampaign/,
        message: 'Função getUtmCampaign está exportada'
    },
    {
        name: 'saveUtmCampaign implementado',
        pattern: /function\s+saveUtmCampaign/,
        message: 'Função saveUtmCampaign implementada'
    },
    {
        name: 'getUtmCampaign lê da URL',
        pattern: /urlParams\.get\(['"]utm_campaign['"]\)/,
        message: 'Lê utm_campaign da URL'
    },
    {
        name: 'getUtmCampaign lê do localStorage',
        pattern: /localStorage\.getItem\(UTM_CAMPAIGN_STORAGE_KEY\)/,
        message: 'Lê utm_campaign do localStorage'
    },
    {
        name: 'addFunnelIdToUrl inclui utm_campaign',
        pattern: /urlObj\.searchParams\.set\(['"]utm_campaign['"]/,
        message: 'addFunnelIdToUrl inclui utm_campaign na URL'
    },
    {
        name: 'trackEvent inclui utm_campaign',
        pattern: /utm_campaign:\s*utmParams\.utm_campaign/,
        message: 'trackEvent inclui utm_campaign no evento'
    }
]);

// Verificar dataLayer.ts
console.log('2️⃣ Verificando dataLayer.ts...');
checkFile('SOLICITE LINK/src/lib/dataLayer.ts', [
    {
        name: 'pushDL importa getUtmCampaign',
        pattern: /import.*getUtmCampaign|function\s+getUtmCampaign/,
        message: 'getUtmCampaign disponível'
    },
    {
        name: 'pushDL recupera utm_campaign',
        pattern: /const\s+utmCampaign\s*=\s*payload\.utm_campaign\s*\|\|\s*getUtmCampaign\(\)/,
        message: 'pushDL recupera utm_campaign corretamente'
    },
    {
        name: 'pushDL inclui utm_campaign no evento',
        pattern: /\.\.\.\(utmCampaign\s*&&\s*\{[^}]*utm_campaign/,
        message: 'pushDL inclui utm_campaign no dataLayer'
    }
]);

// Verificar Obrigado.tsx
console.log('3️⃣ Verificando Obrigado.tsx...');
checkFile('SOLICITE LINK/src/pages/Obrigado.tsx', [
    {
        name: 'Importa getUtmCampaign',
        pattern: /import.*getUtmCampaign.*from/,
        message: 'Importa getUtmCampaign'
    },
    {
        name: 'Importa pushDL',
        pattern: /import.*pushDL.*from/,
        message: 'Importa pushDL'
    },
    {
        name: 'Chama getUtmCampaign',
        pattern: /const\s+utmCampaign\s*=\s*getUtmCampaign\(\)/,
        message: 'Chama getUtmCampaign para recuperar utm_campaign'
    },
    {
        name: 'pushDL com utm_campaign',
        pattern: /pushDL\(['"]payment_completed['"]/,
        message: 'Dispara payment_completed via pushDL'
    },
    {
        name: 'Inclui utm_campaign no payload',
        pattern: /\.\.\.\(utmCampaign\s*&&\s*\{[^}]*utm_campaign/,
        message: 'Inclui utm_campaign no payload do pushDL'
    }
]);

// Verificar LinkSelector.tsx
console.log('4️⃣ Verificando LinkSelector.tsx...');
checkFile('SOLICITE LINK/src/components/LinkSelector.tsx', [
    {
        name: 'Importa addFunnelIdToUrl',
        pattern: /import.*addFunnelIdToUrl/,
        message: 'Importa addFunnelIdToUrl'
    },
    {
        name: 'Usa addFunnelIdToUrl',
        pattern: /addFunnelIdToUrl\(/,
        message: 'Usa addFunnelIdToUrl para adicionar utm_campaign na URL'
    }
]);

// Verificar Payment.tsx (PORTAL)
console.log('5️⃣ Verificando Payment.tsx (PORTAL)...');
checkFile('PORTAL/src/pages/Payment.tsx', [
    {
        name: 'Recupera utm_campaign do localStorage',
        pattern: /localStorage\.getItem\(['"]utm_campaign['"]\)/,
        message: 'Recupera utm_campaign do localStorage'
    },
    {
        name: 'Inclui utm_campaign no redirect',
        pattern: /eventUrl\.searchParams\.set\(['"]utm_campaign['"]/,
        message: 'Inclui utm_campaign no redirect para solicite.link'
    }
]);

// Verificar EventProxy.tsx
console.log('6️⃣ Verificando EventProxy.tsx...');
checkFile('SOLICITE LINK/src/pages/EventProxy.tsx', [
    {
        name: 'Importa getUtmCampaign',
        pattern: /import.*getUtmCampaign/,
        message: 'Importa getUtmCampaign'
    },
    {
        name: 'Recupera utm_campaign',
        pattern: /const\s+utmCampaign\s*=\s*getUtmCampaign\(\)/,
        message: 'Recupera utm_campaign'
    },
    {
        name: 'Inclui utm_campaign no pushDL',
        pattern: /\.\.\.\(utmCampaign\s*&&\s*\{[^}]*utm_campaign/,
        message: 'Inclui utm_campaign no pushDL'
    }
]);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RESULTADOS DA VERIFICAÇÃO\n');

if (results.passed.length > 0) {
    console.log('✅ TESTES APROVADOS:');
    results.passed.forEach(r => {
        console.log(`   ✅ ${r.file}`);
        console.log(`      → ${r.check}: ${r.message}`);
    });
    console.log('');
}

if (results.warnings.length > 0) {
    console.log('⚠️  AVISOS:');
    results.warnings.forEach(r => {
        console.log(`   ⚠️  ${r.file}`);
        console.log(`      → ${r.check}: ${r.message}`);
    });
    console.log('');
}

if (results.failed.length > 0) {
    console.log('❌ TESTES FALHADOS:');
    results.failed.forEach(r => {
        console.log(`   ❌ ${r.file}`);
        console.log(`      → ${r.check}: ${r.message}`);
    });
    console.log('');
} else {
    console.log('🎉 Nenhum teste falhou!');
    console.log('');
}

const total = results.passed.length + results.failed.length + results.warnings.length;
const successRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(0) : 0;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📈 ESTATÍSTICAS:');
console.log(`   ✅ Aprovados: ${results.passed.length}`);
console.log(`   ❌ Falhados: ${results.failed.length}`);
console.log(`   ⚠️  Avisos: ${results.warnings.length}`);
console.log(`   📊 Taxa de sucesso: ${successRate}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (results.failed.length === 0) {
    console.log('✅ CÓDIGO ESTÁ CORRETO!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Execute: npm run build (no SOLICITE LINK)');
    console.log('   2. Faça deploy para produção');
    console.log('   3. Teste no GTM Preview Mode:');
    console.log('      - Acesse: https://solicite.link?utm_campaign=teste_conta_1');
    console.log('      - Complete o fluxo até payment_completed');
    console.log('      - Verifique se a tag correta disparou');
    console.log('');
    process.exit(0);
} else {
    console.log('❌ CORRIJA OS ERROS ANTES DE FAZER DEPLOY');
    console.log('');
    process.exit(1);
}

