#!/usr/bin/env node
/**
 * Teste do fluxo PIX em https://www.guia-central.online
 * 1. Navega para /certidao/federais?type=criminal
 * 2. Preenche Etapa 1: Estado=DF, Tipo=CPF, CPF, Nome, Data
 * 3. Etapa 2: Telefone, Email, termos
 * 4. Etapa 3: Confirmar e Pagar via PIX
 * 5. Ir para pagamento (window.location /pagamento)
 * 6. Aguarda 20s e verifica QR Code / Copiar código / Gerando / erro
 */
import { chromium } from 'playwright';

const BASE = 'https://www.guia-central.online';
const SCREENSHOT_PATH = '/Users/juliocesarnevesdesouza/Desktop/PROJETO 2026 ESTRUTURA/GUIA_CENTRAL/pix-flow-screenshot.png';

async function main() {
  const browser = await chromium.launch({ headless: true }); // headless: false para debug
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    // 1. Navegar
    console.log('1. Navegando para /certidao/federais?type=criminal');
    await page.goto(`${BASE}/certidao/federais?type=criminal`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Aceitar cookies se aparecer
    const acceptCookies = page.getByRole('button', { name: /Aceitar Todos|Aceitar/i });
    if (await acceptCookies.isVisible().catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // 2. Etapa 1: Estado=DF, Tipo=CPF, CPF, Nome, Data
    console.log('2. Preenchendo Etapa 1...');
    const combos = page.getByRole('combobox');
    await combos.first().click();
    await page.getByRole('option', { name: /Distrito Federal|DF/i }).first().click();

    await combos.nth(1).click();
    await page.getByRole('option', { name: 'CPF' }).first().click();

    await page.getByPlaceholder('000.000.000-00').fill('529.982.247-25');
    // Aguardar campos condicionais (Nome, Data) aparecerem
    await page.getByPlaceholder('DD/MM/AAAA').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(200);
    // Nome Completo: input sem placeholder (entre CPF e Data)
    const nomeInput = page.locator('form input:not([placeholder])').first();
    await nomeInput.fill('Teste Usuario');
    await page.getByPlaceholder('DD/MM/AAAA').fill('01/01/1990');

    await page.getByRole('button', { name: /Próximo/ }).click();

    // 3. Etapa 2: Nome (pode estar vazio), Telefone, Email, termos
    console.log('3. Preenchendo Etapa 2...');
    await page.waitForTimeout(500);
    // Garantir nomeCompleto (pode reaparecer no step 2)
    const nomeInput2 = page.locator('form input:not([placeholder])').first();
    if (await nomeInput2.isVisible().catch(() => false)) {
      await nomeInput2.fill('Teste Usuario');
    }
    await page.getByPlaceholder('(00) 00000-0000').fill('(11) 99999-9999');
    await page.getByPlaceholder('seu@email.com').fill('teste@exemplo.com');
    await page.getByRole('checkbox', { name: /Li e aceito|termos/i }).check();

    await page.screenshot({ path: SCREENSHOT_PATH.replace('.png', '-step2.png') });
    await page.getByRole('button', { name: /Próximo/ }).click();

    // 4. Etapa 3: Aguardar step de revisão e clicar Confirmar e Pagar via PIX
    console.log('4. Etapa 3 - Aguardando revisão e clicando Confirmar e Pagar via PIX');
    await page.getByText('Revisão e Pagamento').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.locator('form').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /Confirmar e Pagar via PIX/i }).click({ timeout: 15000 });

    // 5. Ir para pagamento
    console.log('5. Clicando Ir para pagamento');
    await page.getByRole('button', { name: /Ir para pagamento/i }).click({ timeout: 10000 });

    // Aguardar navegação para /pagamento (window.location = full reload)
    await page.waitForURL(/\/pagamento/, { timeout: 20000 });

    // 6. Aguardar 20 segundos
    console.log('6. Aguardando 20 segundos na página /pagamento');
    await page.waitForTimeout(20000);

    // 7. Screenshot e verificar conteúdo
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log('Screenshot salvo em:', SCREENSHOT_PATH);

    const bodyText = await page.locator('body').innerText();
    const hasQR = bodyText.includes('QR') || bodyText.includes('QR Code') || (await page.locator('canvas, img[alt*="QR"], [data-qr], svg').count()) > 0;
    const hasCopiar = bodyText.includes('Copiar código PIX') || bodyText.includes('Copiar código');
    const hasGerando = bodyText.includes('Gerando código PIX') || bodyText.includes('Gerando');
    const hasErro = bodyText.toLowerCase().includes('erro') || bodyText.toLowerCase().includes('error');

    console.log('\n--- RESULTADO ---');
    console.log('QR Code visível:', hasQR);
    console.log('"Copiar código PIX":', hasCopiar);
    console.log('"Gerando código PIX":', hasGerando);
    console.log('Mensagem de erro:', hasErro);
    console.log('URL atual:', page.url());

  } catch (err) {
    console.error('Erro:', err.message);
    const errPath = SCREENSHOT_PATH.replace('.png', '-error.png');
    await page.screenshot({ path: errPath }).catch(() => {});
    console.log('Screenshot de erro salvo em:', errPath);
  } finally {
    await browser.close();
  }
}

main();
