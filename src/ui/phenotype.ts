/** Traduz o genoma em CSS custom properties — o "corpo" do organismo fora do canvas. */

import type { Genome } from '../ga/genome';
import { applyTitleFx } from './effects';

/** Ordem das seções do <main> por gene sectionOrder. Contato fica sempre por último. */
// projetos/sobre sempre no topo: o GA varia a ordem, mas a página continua sendo um portfólio
const SECTION_ORDER: Record<Genome['sectionOrder'], string[]> = {
  work: ['projetos', 'principios', 'notas', 'sobre', 'lab', 'arcade'],
  lab: ['projetos', 'principios', 'sobre', 'notas', 'arcade', 'lab'],
  stack: ['principios', 'projetos', 'sobre', 'notas', 'lab', 'arcade'],
};

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(1)} ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}%)`;
}
function hsla(h: number, s: number, l: number, a: number): string {
  return `hsl(${h.toFixed(1)} ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}% / ${a})`;
}

export function applyPhenotype(g: Genome): void {
  const r = document.documentElement.style;
  const accent = hsl(g.hue, g.sat, 0.72);
  const accent2 = hsl(g.hue2, g.sat, 0.74);

  r.setProperty('--accent', accent);
  // versões translúcidas calculadas aqui (em vez de color-mix no CSS): funcionam
  // também em Safari < 16.2 e Firefox < 113
  r.setProperty('--glow', hsla(g.hue, g.sat, 0.72, 0.65));
  r.setProperty('--glow-soft', hsla(g.hue, g.sat, 0.72, 0.25));
  r.setProperty('--glow2', hsla(g.hue2, g.sat, 0.74, 0.65));
  r.setProperty('--gridline', hsla(g.hue, g.sat, 0.72, 0.14));
  r.setProperty('--accent-a12', hsla(g.hue, g.sat, 0.72, 0.12));
  r.setProperty('--accent2-a45', hsla(g.hue2, g.sat, 0.74, 0.45));
  r.setProperty('--bg-a85', hsla(g.hue, 0.25 * g.bgTint, 0.035 + 0.01 * g.bgTint, 0.85));
  r.setProperty('--accent2', accent2);
  // fundo levemente tingido pelo hue primário (gene bgTint)
  r.setProperty('--bg', hsl(g.hue, 0.25 * g.bgTint, 0.035 + 0.01 * g.bgTint));
  r.setProperty('--surface', hsl(g.hue, 0.18 * g.bgTint, 0.065 + 0.01 * g.bgTint));
  r.setProperty('--line', hsl(g.hue, 0.15 * g.bgTint, 0.13));
  r.setProperty('--line-strong', hsl(g.hue, 0.12 * g.bgTint, 0.19));
  r.setProperty('--radius', `${g.cardRadius.toFixed(0)}px`);
  r.setProperty('--type-scale', g.typeScale.toFixed(3));
  r.setProperty('--display-weight', String(g.fontWeight));
  r.setProperty('--grain', g.grain.toFixed(2));
  r.setProperty('--motion', g.motion.toFixed(2));

  document.body.classList.remove('hero-center', 'hero-reverse');
  if (g.heroLayout === 'center') {
    r.setProperty('--hero-cols', '1fr');
    r.setProperty('--hero-align', 'center');
    r.setProperty('--hero-text-align', 'center');
    r.setProperty('--hero-justify', 'center');
    r.setProperty('--hero-copy-max', '760px');
    document.body.classList.add('hero-center');
  } else {
    r.setProperty('--hero-cols', '1fr 1fr');
    r.setProperty('--hero-align', 'start');
    r.setProperty('--hero-text-align', 'left');
    r.setProperty('--hero-justify', 'flex-start');
    r.setProperty('--hero-copy-max', '620px');
    if (g.heroLayout === 'reverse') document.body.classList.add('hero-reverse');
  }

  // genes estruturais → atributos no <html>; o CSS (genes.css) monta cada variante
  const ds = document.documentElement.dataset;
  ds.phNav = g.navStyle;
  ds.phTitle = g.titleFx;
  ds.phCards = g.cardLayout;
  ds.phSkin = g.skin;
  ds.phSteps = g.stepsLayout;
  ds.phSkills = g.skillsLayout;
  ds.phBg = g.bgPattern;
  ds.phDivider = g.divider;
  ds.phFont = g.fontPair;
  ds.phCase = g.headingCase;
  ds.phBtn = g.buttonStyle;
  ds.phChip = g.chipStyle;
  ds.phEyebrow = g.eyebrowStyle;
  ds.phLink = g.linkStyle;
  ds.phViz = g.vizFrame;
  ds.phAbout = g.aboutLayout;
  ds.phContact = g.contactLayout;
  ds.phCursor = g.cursorFx;
  r.setProperty('--space', g.spacing.toFixed(3));

  // ordem das seções + renumeração dos rótulos "02 —", "03 —"…
  const order = [...SECTION_ORDER[g.sectionOrder], 'contato'];
  order.forEach((id, i) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    sec.style.order = String(i);
    const num = sec.querySelector('[data-secnum]');
    if (num) num.textContent = String(i + 2).padStart(2, '0');
  });

  applyTitleFx(g);
}
