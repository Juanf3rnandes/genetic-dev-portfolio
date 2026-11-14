/** Efeitos de título controlados pelo gene titleFx que precisam de JS. */

import type { Genome } from '../ga/genome';

const GLYPHS = '!<>-_\\/[]{}=+*^?#%01アカサタナハマヤラワ';
const originals = new WeakMap<Text, string>();
const running = new WeakMap<HTMLElement, number>();

function textNodes(el: HTMLElement): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** "Decodifica" o texto: caracteres aleatórios que vão se fixando da esquerda para a direita. */
export function scramble(el: HTMLElement, duration = 900): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cancelAnimationFrame(running.get(el) ?? 0);
  const nodes = textNodes(el);
  for (const n of nodes) if (!originals.has(n)) originals.set(n, n.data);
  const total = nodes.reduce((s, n) => s + originals.get(n)!.length, 0);
  const start = performance.now();

  const frame = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    let revealed = Math.floor(p * total);
    for (const n of nodes) {
      const orig = originals.get(n)!;
      let s = '';
      for (const ch of orig) {
        if (revealed > 0 || ch === ' ' || ch === '\n') s += ch;
        else s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        revealed--;
      }
      n.data = s;
    }
    if (p < 1) running.set(el, requestAnimationFrame(frame));
    else for (const n of nodes) n.data = originals.get(n)!;
  };
  running.set(el, requestAnimationFrame(frame));
}

let observer: IntersectionObserver | null = null;
let currentFx: Genome['titleFx'] | null = null;

export function applyTitleFx(g: Genome): void {
  if (g.titleFx === currentFx) return;
  currentFx = g.titleFx;
  observer?.disconnect();
  observer = null;
  if (g.titleFx !== 'scramble') return;

  const hero = document.querySelector<HTMLElement>('.hero-copy h1');
  if (hero) scramble(hero, 1100);
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        scramble(e.target as HTMLElement);
        observer?.unobserve(e.target);
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll('.section-head h2, .contact h2, .panel-vote h3').forEach((h) => observer!.observe(h));
}
