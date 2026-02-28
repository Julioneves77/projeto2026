#!/usr/bin/env node
/**
 * Teste E2E do fluxo PIX - Guia Central
 * Executa: node test-pix-flow-e2e.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://www.guia-central.online';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('1. Navegando para /certidao/federais?type=criminal');
    await page.goto(`${BASE_URL}/certidao/federais?type=criminal`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Etapa 1: Estado e Documento
    console.log('2. Preenchendo Etapa 1: Estado=DF, Tipo=CPF, CPF, Nome, Data');
    // Radix Select: clicar no trigger (placeholder "Selecione estado...")
    await page.getByText('Selecione estado de emissão da certidão').click();
    await page.getByRole('option', { name: /Distrito Federal/i }).click();

    await page.getByText('Selecione tipo de documento').click();
    await page.getByRole('option', { name: /^CPF$/i }).click();

    await page.getByPlaceholder(/000\.000\.000-00/).fill('529.982.247-25');
    await page.getByLabel(/nome completo/i).first().fill('Teste Usuario');
    await page.getByPlaceholder(/DD\/MM\/AAAA/).first().fill('01/01/1990');

    console.log('3. Clicando Próximo');
    await page.getByRole('button', { name: /próximo/i }).click();
    await page.waitForTimeout(1500);

    // Etapa 2: Dados e Confirmação
    console.log('4. Preenchendo Etapa 2: Telefone, Email, Termos');
    await page.getByPlaceholder(/\(00\) 00000-0000/).fill('(11) 99999-9999');
    await page.getByPlaceholder(/seu@email\.com/).fill('teste@exemplo.com');
    await page.getByRole('checkbox', { name: /termos de uso/i }).check();

    console.log('5. Clicando Próximo');
    await page.getByRole('button', { name: /próximo/i }).click();
    await page.waitForTimeout(1500);

    // Etapa 3: Revisão e Pagamento
    console.log('6. Clicando Confirmar e Pagar via PIX');
    await page.getByRole('button', { name: /confirmar e pagar via pix/i }).click();
    await page.waitForTimeout(2000);

    // Página de confirmação pré-pagamento (PrePayment)
    await page.waitForURL(/confirmar-pagamento/);
    await page.getByRole('button', { name: /ir para pagamento/i }).click();
    await page.waitForURL(/pagamento/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Aguardar 20 segundos na página de pagamento
    console.log('7. Aguardando 20 segundos na página /pagamento');
    await page.waitForTimeout(20000);

    // Screenshot e análise
    const screenshotPath = 'pix-flow-test-result.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot salvo em: ${screenshotPath}`);

    const url = page.url();
    const hasQR = await page.locator('img[alt*="QR"], canvas, [data-qr]').count() > 0;
    const hasCodigoCopia = await page.getByText(/copia e cola|pix copia e cola|código/i).count() > 0;
    const hasLoading = await page.getByText(/carregando|aguarde|loading/i).count() > 0;
    const hasError = await page.getByText(/erro|falha|não foi possível/i).count() > 0;
    const bodyText = await page.locator('body').innerText();

    console.log('\n=== RESULTADO DO TESTE ===');
    console.log('URL atual:', url);
    console.log('Elemento QR Code encontrado:', hasQR);
    console.log('Texto "copia e cola" ou similar:', hasCodigoCopia);
    console.log('Loading/aguarde:', hasLoading);
    console.log('Mensagem de erro:', hasError);
    console.log('\nTrecho do conteúdo da página (primeiros 800 chars):');
    console.log(bodyText.substring(0, 800));

  } catch (err) {
    console.error('Erro no teste:', err.message);
    await page.screenshot({ path: 'pix-flow-test-error.png', fullPage: true });
    console.log('Screenshot do erro salvo em: pix-flow-test-error.png');
  } finally {
    await browser.close();
  }
}

runTest();
