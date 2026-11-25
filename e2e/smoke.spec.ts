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
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      accent: cs.color,
      glow: cs.backgroundColor,
      accentA12: cs.borderTopColor,
    };
    probe.remove();
    return out;
  });
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
  await expect(page.locator('.hero-copy h1')).toContainText('Software Engineer');
  await expect(page.locator('.job').first()).toContainText('Allcom Telecom');
  await expect(page.locator('.project .card-link').first()).toContainText('Case study');
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

test('cards de projeto compactos: o essencial no card, o resto no estudo de caso', async ({ page, isMobile }) => {
  await page.goto('/?lang=pt');
  const cards = page.locator('.project');
  await expect(cards).toHaveCount(3);
  for (const layout of isMobile ? ['grid'] : ['grid', 'list', 'bento', 'rail']) {
    await page.evaluate((l) => {
      // trava o gene de layout para o teste (a deriva pode trocá-lo enquanto o mouse mexe)
      const h = document.documentElement;
      (window as unknown as { __lock?: MutationObserver }).__lock?.disconnect();
      const apply = () => h.dataset.phCards !== l && (h.dataset.phCards = l);
      apply();
      const mo = new MutationObserver(apply);
      mo.observe(h, { attributes: true, attributeFilter: ['data-ph-cards'] });
      (window as unknown as { __lock?: MutationObserver }).__lock = mo;
    }, layout);
    for (let i = 0; i < 3; i++) {
      const box = (await cards.nth(i).boundingBox())!;
      expect(box.height, `card ${i} (${layout}) baixo`).toBeLessThan(isMobile ? 420 : 460);
      // nada do card vaza para fora dele
      const overflow = await cards.nth(i).evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow, `card ${i} (${layout}) sem vazamento lateral`).toBeLessThanOrEqual(0);
    }
  }
  const first = cards.first();
  await expect(first.locator('.chip')).toHaveCount(2);
  await expect(first.locator('.project-points')).toHaveCount(0);
  await expect(first.locator('.card-link')).toContainText('Estudo de caso');
  // os destaques continuam no estudo de caso
  await first.click();
  await expect(page.locator('.case-sec .project-points li').first()).toBeVisible();
});

test('baixa o currículo depois da animação', async ({ page }) => {
  await page.goto('/?lang=pt');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15_000 }),
    page.locator('.hero [data-cv-download]').click(),
  ]);
  expect(download.suggestedFilename()).toBe('Juan-Fernandes-CV.pdf');
  expect(download.url()).toContain('juan-fernandes-cv-en.pdf');
  await expect(page.locator('.cv-portal')).toHaveCount(0, { timeout: 5_000 });
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
