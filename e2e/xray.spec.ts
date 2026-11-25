import { expect, test, type Page } from '@playwright/test';

/** Erros de JavaScript e console.error durante o teste fazem o teste falhar. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

const xrayChunk = /\/assets\/xray-[\w-]+\.js$/;

async function ready(page: Page, url = '/?lang=pt'): Promise<void> {
  await page.goto(url);
  await expect(page.locator('.hero-copy h1')).toContainText('Juan Fernandes');
}

test('o chunk do Raio-X só baixa quando alguém abre', async ({ page, isMobile }) => {
  test.skip(isMobile, 'atalho de teclado: só no desktop');
  const requested: string[] = [];
  page.on('request', (r) => requested.push(r.url()));
  await ready(page);
  await page.waitForTimeout(1000);
  expect(requested.filter((u) => xrayChunk.test(u)), 'nada do Raio-X no carregamento').toEqual([]);
  await page.keyboard.press('x');
  await expect(page.locator('.xr')).toBeVisible();
  expect(requested.some((u) => xrayChunk.test(u))).toBe(true);
});

test('Raio-X: X abre com a varredura, mostra os bastidores e X fecha', async ({ page, isMobile }) => {
  test.skip(isMobile, 'atalho de teclado: só no desktop');
  const errors = watchErrors(page);
  await ready(page);
  const toggle = page.locator('[data-xray-toggle]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await page.keyboard.press('x');
  const root = page.locator('.xr');
  await expect(root).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  // durante a varredura o feixe está ligado; ao terminar, o tema planta entra
  await expect(page.locator('html')).toHaveClass(/xr-on/, { timeout: 5_000 });
  await expect(root).toHaveClass(/is-ready/);
  await expect(page.locator('.xr-badge')).toHaveText('RAIO-X');

  // enxuto: só a barra com o resumo e os contornos; nenhum painel aberto
  await expect(page.locator('.xr-status')).toContainText('LCP');
  await expect(page.locator('.xr-box:not([hidden])').first()).toBeVisible();
  await expect(page.locator('.xr-panel:visible')).toHaveCount(0);

  // dados reais nos painéis, um por vez
  await page.locator('.xr-tab[data-tab="net"]').click();
  await expect(page.locator('.xr-row').first()).toBeVisible();
  expect(await page.locator('.xr-row').count()).toBeGreaterThan(2);
  await expect(page.locator('.xr-vital')).toHaveCount(3);
  await page.locator('.xr-tab[data-tab="genome"]').click();
  await expect(page.locator('.xr-panel[data-panel="net"]')).toBeHidden();
  await expect(page.locator('.xr-log .xr-l').first()).toBeVisible();
  await expect(page.locator('.xr-bars .xr-bar-row')).toHaveCount(6);

  // mexer na página faz o algoritmo agir; o diário registra
  const before = await page.locator('.xr-log .xr-l').count();
  for (let i = 0; i < 12; i++) await page.mouse.move(100 + i * 90, 300 + (i % 2) * 200, { steps: 4 });
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.locator('.xr-log .xr-l').count(), { timeout: 10_000 }).toBeGreaterThan(before);

  await page.keyboard.press('x');
  await expect(page.locator('.xr')).toHaveCount(0, { timeout: 5_000 });
  await expect(page.locator('html')).not.toHaveClass(/xr-on|xr-scanning/);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('Raio-X: Esc fecha; X digitado num campo de texto não abre', async ({ page, isMobile }) => {
  test.skip(isMobile, 'teclado: só no desktop');
  await ready(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'campo-teste';
    document.body.prepend(input);
  });
  await page.locator('#campo-teste').fill('');
  await page.locator('#campo-teste').press('x');
  await page.waitForTimeout(400);
  await expect(page.locator('.xr')).toHaveCount(0);

  await page.locator('#campo-teste').blur();
  await page.keyboard.press('x');
  await expect(page.locator('.xr')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.xr')).toHaveCount(0, { timeout: 5_000 });
});

test('Raio-X: apertar X no meio da varredura inverte sem travar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'teclado: só no desktop');
  const errors = watchErrors(page);
  await ready(page);
  await page.keyboard.press('x');
  await expect(page.locator('.xr')).toBeVisible();
  await page.waitForTimeout(300);
  await page.keyboard.press('x'); // fecha no meio da entrada
  await page.waitForTimeout(80);
  await page.keyboard.press('x'); // e abre de novo no meio da saída
  await expect(page.locator('html')).toHaveClass(/xr-on/, { timeout: 5_000 });
  await expect(page.locator('.xr')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Raio-X com movimento reduzido: sem varredura, abre na hora', async ({ page, isMobile }) => {
  test.skip(isMobile, 'teclado: só no desktop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await page.keyboard.press('x');
  await expect(page.locator('html')).toHaveClass(/xr-on/, { timeout: 1_500 });
  await expect(page.locator('.xr')).not.toHaveClass(/is-scanning/);
  await page.keyboard.press('x');
  await expect(page.locator('.xr')).toHaveCount(0, { timeout: 1_500 });
});

test('Raio-X por ?xray, abas e troca de idioma', async ({ page, isMobile }) => {
  const errors = watchErrors(page);
  await ready(page, '/?lang=pt&xray');
  await expect(page.locator('html')).toHaveClass(/xr-on/, { timeout: 5_000 });

  // abas: um painel por vez, começando com nenhum; clicar no aberto fecha
  const net = page.locator('.xr-panel[data-panel="net"]');
  const render = page.locator('.xr-panel[data-panel="render"]');
  const netTab = page.locator('.xr-tab[data-tab="net"]');
  await expect(net).toBeHidden();
  await netTab.click();
  await expect(net).toBeVisible();
  await expect(netTab).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.xr-tab[data-tab="render"]').click();
  await expect(render).toBeVisible();
  await expect(net).toBeHidden();
  await page.locator('.xr-tab[data-tab="render"]').click();
  await expect(render).toBeHidden();
  // estrutura liga/desliga os contornos
  await page.locator('.xr-tab[data-tab="structure"]').click();
  await expect(page.locator('.xr-boxes')).toBeHidden();
  await page.locator('.xr-tab[data-tab="structure"]').click();
  await expect(page.locator('.xr-boxes')).toBeVisible();

  // troca de idioma com o Raio-X aberto (o botão de idioma fica sob a barra; clique programático)
  await page.locator('[data-lang-toggle]').dispatchEvent('click');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.xr-badge')).toHaveText('X-RAY');
  await expect(page.locator('.xr-tab[data-tab="net"]')).toHaveText('network');
  expect(errors).toEqual([]);
});

test('Raio-X no celular: botão no menu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só no celular');
  await ready(page);
  await page.locator('[data-nav-toggle]').click();
  await page.locator('[data-xray-toggle]').click();
  await expect(page.locator('[data-nav-toggle]')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('html')).toHaveClass(/xr-on/, { timeout: 5_000 });
  await expect(page.locator('.xr-bar')).toBeVisible();
  await page.locator('.xr-tab[data-tab="genome"]').click();
  await expect(page.locator('.xr-panel[data-panel="genome"]')).toBeVisible();
  await expect(page.locator('.xr-close')).toHaveAttribute('aria-label', 'fechar');
  // sem rolagem lateral com o Raio-X aberto
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.locator('.xr-close').click();
  await expect(page.locator('.xr')).toHaveCount(0, { timeout: 5_000 });
});
