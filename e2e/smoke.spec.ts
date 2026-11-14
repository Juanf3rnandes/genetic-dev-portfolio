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

/** No celular o botão de idioma fica dentro do menu. */
async function clickLangToggle(page: Page): Promise<void> {
  const toggle = page.locator('[data-lang-toggle]');
  if (!(await toggle.isVisible())) await page.locator('[data-nav-toggle]').click();
  await toggle.click();
}

/** ROM homebrew mínima (1 KB): modo bitmap com um gradiente animado. */
function testRom(): Buffer {
  const code = [
    0xe3a00301, 0xe3a01b01, 0xe3811003, 0xe1c010b0, 0xe2804e13, 0xe3a06000, 0xe3a02406, 0xe1d430b0, 0xe1e03003, 0xe1a03b03,
    0xe1a03b23, 0xe3a07000, 0xe0878006, 0xe0288303, 0xe0c280b2, 0xe2877001, 0xe3570c96, 0x1afffff9, 0xe2866004, 0xeafffff1,
  ];
  const rom = Buffer.alloc(0x400);
  rom.writeUInt32LE(0xea00002e, 0);
  rom.write('ASCIITEST', 0xa0, 'ascii');
  rom.write('ATST00', 0xac, 'ascii');
  rom[0xb2] = 0x96;
  let c = 0;
  for (let i = 0xa0; i < 0xbd; i++) c = (c - rom[i]) & 0xff;
  rom[0xbd] = (c - 0x19) & 0xff;
  code.forEach((w, i) => rom.writeUInt32LE(w >>> 0, 0xc0 + 4 * i));
  return rom;
}

test('carrega sem erros, com cores e sem rolagem lateral', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?lang=pt');
  await expect(page.locator('.hero-copy h1')).toContainText('Juan Fernandes');
  await expect(page.locator('.project')).toHaveCount(3);

  const info = await page.evaluate(() => {
    // sonda: resolve as variáveis de cor do genoma num elemento de teste.
    // (O fundo dos botões não serve: nos estilos "bracket"/"underline" ele é transparente de propósito.)
    const probe = document.createElement('div');
    probe.style.cssText = 'color: var(--accent); background-color: var(--glow); border-top: 1px solid var(--accent-a12)';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const out = {
      isolated: crossOriginIsolated,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      accent: cs.color,
      glow: cs.backgroundColor,
      accentA12: cs.borderTopColor,
    };
    probe.remove();
    return out;
  });
  expect(info.isolated, 'isolamento cross-origin (arcade)').toBe(true);
  expect(info.overflow, 'página não pode rolar para o lado').toBeLessThanOrEqual(0);
  const transparent = ['rgba(0, 0, 0, 0)', 'transparent'];
  expect(transparent, 'cor de destaque do genoma').not.toContain(info.accent);
  expect(transparent, '--glow (calculado em hsla, sem color-mix)').not.toContain(info.glow);
  expect(transparent, '--accent-a12 (fallback de color-mix)').not.toContain(info.accentA12);

  await page.waitForTimeout(1500); // dá tempo ao WebGL e às animações
  expect(errors).toEqual([]);
});

test('troca de idioma PT → EN', async ({ page }) => {
  await page.goto('/?lang=pt');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await clickLangToggle(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.hero-copy h1')).toContainText('solve problems');
  await expect(page.locator('.project .card-link').first()).toContainText('Read case study');
});

test('menu do celular abre e navega', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só no celular');
  await page.goto('/?lang=pt');
  const toggle = page.locator('[data-nav-toggle]');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.nav-links a[href="#sobre"]').click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#sobre h2')).toBeInViewport();
});

test('estudo de caso abre e volta', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?lang=pt');
  await page.locator('.project').first().click();
  await expect(page).toHaveURL(/#\/case\//);
  await expect(page.locator('.case-head h1')).toBeVisible();
  await expect(page.locator('.case-sec').first()).toBeVisible();
  await page.locator('.case-back').click();
  await expect(page.locator('[data-case]')).toBeHidden();
  await expect(page.locator('#projetos')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('baixa o currículo depois da animação', async ({ page }) => {
  await page.goto('/?lang=pt');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15_000 }),
    page.locator('.hero [data-cv-download]').click(),
  ]);
  expect(download.suggestedFilename()).toBe('Juan-Fernandes-CV-PT.pdf');
  await expect(page.locator('.cv-portal')).toHaveCount(0, { timeout: 5_000 });
});

test('arcade roda uma ROM (WebAssembly + threads)', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?lang=pt#arcade');
  await page.locator('[data-arcade-file]').setInputFiles({ name: 'test-pattern.gba', mimeType: 'application/octet-stream', buffer: testRom() });
  await expect(page.locator('[data-arcade-status]')).toContainText('rodando', { timeout: 40_000 });
  expect(errors).toEqual([]);
});

test('princípios e notas técnicas', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?lang=pt');
  await expect(page.locator('.principle')).toHaveCount(6);
  await expect(page.locator('.note-card')).toHaveCount(2);
  await page.locator('.note-card').first().click();
  await expect(page).toHaveURL(/#\/notes\//);
  await expect(page.locator('[data-note] h1')).toBeVisible();
  await expect(page.locator('.note-body h2').first()).toBeVisible();
  await clickLangToggle(page);
  await expect(page.locator('[data-note] .case-back')).toContainText('Back to notes');
  await page.locator('[data-note] .case-back').click();
  await expect(page.locator('[data-note]')).toBeHidden();
  await expect(page.locator('#notas')).toBeInViewport();
  expect(errors).toEqual([]);
});
