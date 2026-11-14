/**
 * Elementos GERADOS pelo genoma: decoração procedural nas margens das seções
 * (gene `deco`) e efeito de cursor (gene `cursorFx`).
 *
 * Tudo é gerado a partir de uma semente derivada do genoma, então a mesma
 * variante sempre produz os mesmos elementos. Só é regerado quando o gene
 * correspondente muda (não a cada passo de deriva).
 */

import { mulberry32, type Genome, type Rng } from '../ga/genome';

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEF<>/\\=+*#';
const HEX = '0123456789ABCDEF';
let currentDeco: string | null = null;
let currentCursor: Genome['cursorFx'] | null = null;

const hex = (rng: Rng, n: number) => Array.from({ length: n }, () => HEX[Math.floor(rng() * 16)]).join('');

function targets(): HTMLElement[] {
  return [document.querySelector<HTMLElement>('.hero'), ...document.querySelectorAll<HTMLElement>('main > .section')].filter(
    (e): e is HTMLElement => !!e,
  );
}

function tags(rng: Rng, sec: HTMLElement, i: number): string {
  const n = 2 + Math.floor(rng() * 3);
  let out = '';
  for (let k = 0; k < n; k++) {
    const side = rng() < 0.5 ? 'left' : 'right';
    const top = 8 + rng() * 84;
    const kind = Math.floor(rng() * 4);
    const label =
      kind === 0
        ? `SEC-${String(i).padStart(2, '0')} // 0x${hex(rng, 4)}`
        : kind === 1
          ? `NODE ${hex(rng, 2)} · ${(rng() * 99).toFixed(1)}ms`
          : kind === 2
            ? `SIG ${'█'.repeat(1 + Math.floor(rng() * 5)).padEnd(6, '░')}`
            : `${sec.id || 'hero'}.${hex(rng, 3).toLowerCase()}`;
    out += `<span class="deco-tag ${side}" style="top:${top.toFixed(1)}%">${label}</span>`;
  }
  return out;
}

function circuits(rng: Rng): string {
  // trilhas em ângulo reto com nós nas pontas, numa faixa de 64px na margem
  const side = rng() < 0.5 ? 'left' : 'right';
  const H = 600;
  let paths = '';
  let nodes = '';
  const traces = 3 + Math.floor(rng() * 3);
  for (let t = 0; t < traces; t++) {
    let x = 8 + rng() * 48;
    let y = rng() * H * 0.3;
    let d = `M${x.toFixed(0)} ${y.toFixed(0)}`;
    nodes += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.5"/>`;
    const segs = 3 + Math.floor(rng() * 4);
    for (let s = 0; s < segs; s++) {
      if (s % 2 === 0) y = Math.min(H - 4, y + 40 + rng() * 120);
      else x = Math.max(4, Math.min(60, x + (rng() - 0.5) * 40));
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    nodes += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.5"/>`;
    paths += `<path d="${d}"/>`;
  }
  return `<svg class="deco-circuit ${side}" viewBox="0 0 64 ${H}" preserveAspectRatio="none">${paths}${nodes}</svg>`;
}

function glyphs(rng: Rng): string {
  const cols = 1 + Math.floor(rng() * 2);
  let out = '';
  for (let c = 0; c < cols; c++) {
    const side = c === 0 ? (rng() < 0.5 ? 'left' : 'right') : 'right';
    const len = 10 + Math.floor(rng() * 18);
    const s = Array.from({ length: len }, () => GLYPHS[Math.floor(rng() * GLYPHS.length)]).join('');
    out += `<span class="deco-glyphs ${side}" style="top:${(5 + rng() * 40).toFixed(0)}%">${s}</span>`;
  }
  return out;
}

function applyCursor(fx: Genome['cursorFx']): void {
  if (fx === currentCursor) return;
  currentCursor = fx;
  document.querySelector('.cursor-trail')?.remove();
  if (fx !== 'trail' || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // rastro: 10 pontos que seguem o cursor com atraso crescente
  const wrap = document.createElement('div');
  wrap.className = 'cursor-trail';
  wrap.setAttribute('aria-hidden', 'true');
  const dots = Array.from({ length: 10 }, (_, i) => {
    const d = document.createElement('i');
    d.style.opacity = String(1 - i / 10);
    wrap.appendChild(d);
    return { el: d, x: -50, y: -50 };
  });
  document.body.appendChild(wrap);
  let mx = -50;
  let my = -50;
  const move = (e: PointerEvent) => {
    mx = e.clientX;
    my = e.clientY;
  };
  window.addEventListener('pointermove', move, { passive: true });
  const tick = () => {
    if (!wrap.isConnected) {
      window.removeEventListener('pointermove', move);
      return;
    }
    let px = mx;
    let py = my;
    for (const d of dots) {
      d.x += (px - d.x) * 0.35;
      d.y += (py - d.y) * 0.35;
      d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
      px = d.x;
      py = d.y;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function applyDeco(g: Genome): void {
  applyCursor(g.cursorFx);
  // semente: tipo de decoração + matiz arredondado (a mesma variante gera os mesmos elementos)
  const key = `${g.deco}:${Math.round(g.hue / 30)}`;
  if (key === currentDeco) return;
  currentDeco = key;
  let seed = 0;
  for (const ch of key) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
  const rng = mulberry32(seed);

  targets().forEach((sec, i) => {
    sec.querySelector(':scope > .deco-layer')?.remove();
    if (g.deco === 'none') return;
    const layer = document.createElement('div');
    layer.className = `deco-layer deco-${g.deco}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = g.deco === 'tags' ? tags(rng, sec, i + 1) : g.deco === 'circuits' ? circuits(rng) : glyphs(rng);
    sec.prepend(layer);
  });
}
