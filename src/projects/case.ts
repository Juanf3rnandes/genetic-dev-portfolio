/**
 * Estudos de caso: uma "página" por projeto em #/case/<id>.
 *
 * Roteamento por hash (funciona no GitHub Pages sem configuração de servidor).
 * Ao abrir, o hero e o <main> somem e o estudo ocupa a página; voltar restaura
 * o portfólio e rola até a seção pedida.
 */

import { projects, type Project } from '../content';
import { t, tr, type Localized } from '../i18n';
import { mountViz } from './viz';

const ROUTE = /^#\/case\/([\w-]+)$/;

/**
 * Pula sem animação. `behavior: 'instant'` não existe em Safari antigo (lança
 * TypeError), então desliga o scroll-behavior suave só durante o salto.
 */
function jump(fn: () => void): void {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  fn();
  html.style.scrollBehavior = prev;
}
let currentId: string | null = null;
let onOpen: (id: string) => void = () => {};

const txt = (v: string | Localized): string => (typeof v === 'string' ? v : tr(v));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function render(p: Project): void {
  const root = document.querySelector<HTMLElement>('[data-case]')!;
  const idx = projects.indexOf(p);
  const next = projects[(idx + 1) % projects.length];
  root.innerHTML = '';

  const inner = el('div', 'case-inner');

  const back = el('a', 'case-back mono', t('case.back'));
  back.href = '#projetos';

  const head = el('header', 'case-head');
  head.append(el('span', 'eyebrow mono', `${t('case.eyebrow')} · ${String(idx + 1).padStart(2, '0')}`));
  const h1 = el('h1', 'display', p.title);
  h1.tabIndex = -1;
  head.append(h1, el('p', 'lede', tr(p.description)));

  const meta = el('dl', 'case-meta mono');
  const row = (k: string, v: Node | string) => {
    const dd = el('dd');
    dd.append(v);
    meta.append(el('dt', '', k), dd);
  };
  row(t('case.role'), tr(p.role));
  if (p.status) row(t('case.status'), tr(p.status));
  row(t('case.stack'), p.tags.map(txt).join(' · '));
  const gh = el('a', '', `${t('case.github')} ↗`);
  gh.href = p.url;
  gh.target = '_blank';
  gh.rel = 'noopener';
  row(t('case.code'), gh);
  head.append(meta);

  const viz = el('div', 'project-viz case-viz');
  const canvas = el('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  viz.append(canvas);

  const body = el('div', 'case-body');
  // destaques do card abrem o estudo
  const hl = el('section', 'case-sec');
  hl.append(el('h2', 'display', t('case.highlights')));
  const hlList = el('ul', 'project-points');
  for (const h of p.highlights) hlList.append(el('li', '', tr(h)));
  hl.append(hlList);
  body.append(hl);

  for (const sec of p.caseStudy) {
    const s = el('section', 'case-sec');
    s.append(el('h2', 'display', tr(sec.title)));
    let list: HTMLUListElement | null = null;
    for (const para of sec.body) {
      const text = tr(para);
      if (text.startsWith('• ')) {
        list ??= el('ul', 'project-points');
        list.append(el('li', '', text.slice(2)));
        s.append(list);
      } else {
        list = null;
        s.append(el('p', '', text));
      }
    }
    body.append(s);
  }

  const nextLink = el('a', 'case-next');
  nextLink.href = `#/case/${next.id}`;
  nextLink.append(el('span', 'eyebrow mono', `${t('case.next')} →`), el('span', 'display', next.title));

  inner.append(back, head, viz, body, nextLink);
  root.append(inner);
  mountViz(canvas, p.viz);
}

function open(id: string): void {
  const p = projects.find((x) => x.id === id);
  if (!p) return close();
  const first = currentId === null;
  currentId = id;
  document.body.classList.add('case-open');
  document.querySelector<HTMLElement>('[data-case]')!.hidden = false;
  render(p);
  document.title = `${p.title} — Juan Fernandes`;
  jump(() => window.scrollTo(0, 0));
  document.querySelector<HTMLElement>('.case-head h1')?.focus({ preventScroll: true });
  if (first) onOpen(id);
}

function close(): void {
  if (currentId === null) return;
  currentId = null;
  document.body.classList.remove('case-open');
  const root = document.querySelector<HTMLElement>('[data-case]')!;
  root.hidden = true;
  root.innerHTML = '';
  document.title = t('meta.title');
}

function route(): void {
  const m = location.hash.match(ROUTE);
  if (m) return open(m[1]);
  const wasOpen = currentId !== null;
  close();
  // o navegador tentou rolar até a âncora enquanto o <main> estava escondido: refaz
  if (wasOpen && location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    requestAnimationFrame(() => jump(() => target?.scrollIntoView()));
  }
}

export function initCases(onProjectOpen: (id: string) => void): void {
  onOpen = onProjectOpen;
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentId) location.hash = '#projetos';
  });
  route();
}

/** Re-renderiza o estudo aberto (troca de idioma). */
export function rerenderCase(): void {
  if (!currentId) return;
  const p = projects.find((x) => x.id === currentId);
  if (p) {
    render(p);
    document.title = `${p.title} — Juan Fernandes`;
  }
}
