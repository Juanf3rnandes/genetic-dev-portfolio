/**
 * Liga/desliga o Raio-X: tecla X, botão </> na navegação ou ?xray na URL.
 *
 * Fica no bundle principal e é só isso: o Raio-X em si (painéis, animação, CSS)
 * é um chunk separado, baixado na primeira vez que alguém abre — quem nunca usa
 * não paga nada. Passar o mouse no botão já começa o download.
 */

import type { Evolution } from '../ga/engine';
import type { FitnessTracker } from '../ga/fitness';
import type { Genome } from '../ga/genome';
import type { Organism } from '../scene/organism';

export interface XrayContext {
  evo: Evolution;
  tracker: FitnessTracker;
  getOrganism(): Organism | null;
  getGenome(): Genome;
  driftProgress(): number;
  /** chamado quando o tema planta liga/desliga (canvas 2D relê as cores) */
  onThemeChange?(): void;
}

interface XrayModule {
  toggle(ctx: XrayContext, onState: (open: boolean) => void): void;
  close(): void;
  isOpen(): boolean;
}

let mod: Promise<XrayModule> | null = null;
const load = (): Promise<XrayModule> => (mod ??= import('./xray'));

/** true se a tecla foi digitada num campo de texto (aí o X é só uma letra). */
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const type = (t as HTMLInputElement).type;
  return !['button', 'checkbox', 'radio', 'range', 'reset', 'submit', 'color', 'file', 'image'].includes(type);
}

export function initXray(ctx: XrayContext): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-xray-toggle]')];
  const setState = (open: boolean) => {
    for (const b of buttons) b.setAttribute('aria-pressed', String(open));
  };
  let busy = false;
  const toggle = async () => {
    if (busy) return;
    busy = true;
    try {
      (await load()).toggle(ctx, setState);
    } catch (err) {
      console.warn('Raio-X indisponível', err);
      mod = null; // deixa tentar de novo (ex.: rede caiu durante o download)
    } finally {
      busy = false;
    }
  };

  for (const b of buttons) {
    b.addEventListener('click', () => {
      // no celular o botão fica dentro do menu: fecha o menu para o Raio-X aparecer
      if (document.querySelector('.nav.open')) document.querySelector<HTMLButtonElement>('[data-nav-toggle]')?.click();
      void toggle();
    });
    // intenção de clicar: já baixa o chunk
    b.addEventListener('pointerenter', () => void load().catch(() => (mod = null)), { once: true });
    b.addEventListener('focus', () => void load().catch(() => (mod = null)), { once: true });
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isTypingTarget(e.target)) return;
    if (e.key === 'x' || e.key === 'X') {
      void toggle();
    } else if (e.key === 'Escape' && mod) {
      void mod.then((m) => m.isOpen() && m.close());
    }
  });

  if (new URLSearchParams(location.search).has('xray')) void toggle();
}
