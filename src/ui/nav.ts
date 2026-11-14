import { getLang, setLang, t } from '../i18n';

/**
 * Navegação: menu no celular, link ativo conforme a seção na tela.
 */

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('.nav')!;
  const toggle = nav.querySelector<HTMLButtonElement>('[data-nav-toggle]')!;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('.nav-links a')];

  const setOpen = (open: boolean) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? t('nav.close') : t('nav.open'));
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target as Node)) setOpen(false);
  });

  // troca de idioma
  nav.querySelector('[data-lang-toggle]')?.addEventListener('click', () => {
    setLang(getLang() === 'pt' ? 'en' : 'pt');
    setOpen(false);
  });

  // link ativo: a seção que ocupa a faixa central da tela
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(e.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  document.querySelectorAll('main > section[id], header[id]').forEach((s) => io.observe(s));
}
