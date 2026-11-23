/**
 * Animações dos projetos — uma por projeto, em canvas 2D.
 *
 *  crawler   — motor de busca: o crawler descobre URLs, indexa termos e responde uma consulta
 *  evolution — este portfólio: população de layouts sendo avaliada, selecionada e cruzada
 *  decompile — port para macOS: hex → assembly MIPS → C → build nativo
 *
 * Um único requestAnimationFrame atende todas; cada uma só desenha quando está
 * visível na tela, a ~30 fps. Com prefers-reduced-motion, desenha um frame estático.
 */

import type { VizKind } from '../content';
// `t` já é o tempo nas funções de desenho; a tradução usa `i18n`
import { locale, t as i18n } from '../i18n';

interface Palette {
  accent: string;
  accent2: string;
  text: string;
  muted: string;
  line: string;
  bg: string;
  surface: string;
}

const palette: Palette = {
  accent: '#7cf5c4',
  accent2: '#b48cff',
  text: '#e6f1ff',
  muted: '#7d8aa5',
  line: '#2a2e3a',
  bg: '#07080c',
  surface: '#0e1016',
};

/** Relê as cores do fenótipo atual (chamado a cada mudança de genoma). */
export function refreshVizPalette(): void {
  const css = getComputedStyle(document.documentElement);
  const get = (v: string, fb: string) => css.getPropertyValue(v).trim() || fb;
  palette.accent = get('--accent', palette.accent);
  palette.accent2 = get('--accent2', palette.accent2);
  palette.text = get('--text', palette.text);
  palette.muted = get('--muted', palette.muted);
  palette.line = get('--line-strong', palette.line);
  palette.bg = get('--bg', palette.bg);
  palette.surface = get('--surface', palette.surface);
}

const MONO = '"JetBrains Mono", ui-monospace, monospace';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

abstract class Viz {
  protected ctx: CanvasRenderingContext2D;
  protected w = 0;
  protected h = 0;
  visible = false;

  constructor(protected canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { rootMargin: '80px' }).observe(canvas);
    this.resize();
  }

  get connected(): boolean {
    return this.canvas.isConnected;
  }

  private resize(): void {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width;
    this.h = r.height;
    this.onResize();
  }

  protected onResize(): void {}

  frame(t: number, dt: number): void {
    if (!this.w) return;
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.draw(t, dt);
  }

  protected abstract draw(t: number, dt: number): void;

  protected text(s: string, x: number, y: number, color: string, size = 10, align: CanvasTextAlign = 'left'): void {
    const c = this.ctx;
    c.font = `${size}px ${MONO}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillStyle = color;
    c.fillText(s, x, y);
  }
}

// =====================================================================
// 1. CRAWLER — descobre URLs, indexa e responde uma consulta
// =====================================================================

const DOMAINS = ['docs.dev', 'blog.io', 'wiki.org', 'news.net', 'learn.io', 'api.dev', 'forum.br'];
const PATHS = ['/', '/sobre', '/rust', '/indexing', '/ranking', '/crawler', '/b-tree', '/tf-idf', '/http', '/cache', '/search', '/tokens', '/sitemap'];

interface CNode {
  x: number;
  y: number;
  url: string;
  state: 'queued' | 'fetching' | 'indexed';
  parent: number;
  born: number;
  fetchAt: number;
  score: number;
}

class CrawlerViz extends Viz {
  private nodes: CNode[] = [];
  private queue: number[] = [];
  private log: { s: string; at: number }[] = [];
  private terms = 0;
  private nextFetch = 0;
  private phase: 'crawl' | 'query' = 'crawl';
  private phaseAt = 0;
  private now = 0;

  protected onResize(): void {
    this.reset(this.now);
  }

  private get graphW(): number {
    return this.w < 420 ? this.w : this.w * 0.62;
  }

  private reset(t: number): void {
    this.nodes = [];
    this.queue = [];
    this.log = [];
    this.terms = 0;
    this.phase = 'crawl';
    this.phaseAt = t;
    this.spawn(this.graphW * 0.5, this.h * 0.5, -1, `${pick(DOMAINS)}/`, t);
  }

  private spawn(x: number, y: number, parent: number, url: string, t: number): void {
    this.nodes.push({ x, y, url, state: 'queued', parent, born: t, fetchAt: 0, score: Math.random() });
    this.queue.push(this.nodes.length - 1);
  }

  private crawlOne(t: number): void {
    const i = this.queue.shift();
    if (i === undefined) return;
    const n = this.nodes[i];
    n.state = 'fetching';
    n.fetchAt = t;
    // descobre 1–3 links novos em volta do nó
    const gw = this.graphW;
    const kids = Math.floor(rand(1, 3.99));
    for (let k = 0; k < kids && this.nodes.length < 34; k++) {
      for (let tries = 0; tries < 8; tries++) {
        const a = rand(0, Math.PI * 2);
        const d = rand(28, 58);
        const x = n.x + Math.cos(a) * d;
        const y = n.y + Math.sin(a) * d;
        if (x < 14 || x > gw - 14 || y < 22 || y > this.h - 14) continue;
        if (this.nodes.some((o) => Math.hypot(o.x - x, o.y - y) < 22)) continue;
        const sameHost = Math.random() < 0.6;
        const host = sameHost ? n.url.split('/')[0] : pick(DOMAINS);
        this.spawn(x, y, i, `${host}${pick(PATHS)}`, t);
        break;
      }
    }
    const tokens = Math.floor(rand(40, 480));
    this.terms += Math.floor(tokens * 0.3);
    this.log.push({ s: `GET ${n.url}  200  ${tokens} tok`, at: t });
    if (this.log.length > 40) this.log.shift();
  }

  protected draw(t: number): void {
    this.now = t;
    const c = this.ctx;
    const P = palette;
    if (!this.nodes.length) this.reset(t);

    if (this.phase === 'crawl') {
      if (t > this.nextFetch) {
        this.crawlOne(t);
        this.nextFetch = t + 0.32;
      }
      for (const n of this.nodes) if (n.state === 'fetching' && t - n.fetchAt > 0.45) n.state = 'indexed';
      if (!this.queue.length || this.nodes.length >= 34) {
        this.phase = 'query';
        this.phaseAt = t;
      }
    } else if (t - this.phaseAt > 5) {
      this.reset(t);
    }

    // arestas
    c.lineWidth = 1;
    for (const n of this.nodes) {
      if (n.parent < 0) continue;
      const p = this.nodes[n.parent];
      const k = Math.min(1, (t - n.born) / 0.35);
      c.strokeStyle = P.line;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + (n.x - p.x) * k, p.y + (n.y - p.y) * k);
      c.stroke();
    }

    // resultados da consulta: top 3 por score
    const ranked =
      this.phase === 'query'
        ? [...this.nodes.keys()].filter((i) => this.nodes[i].state === 'indexed').sort((a, b) => this.nodes[b].score - this.nodes[a].score).slice(0, 3)
        : [];

    // nós
    for (const [i, n] of this.nodes.entries()) {
      const age = Math.min(1, (t - n.born) / 0.3);
      const r = 3.2 * age;
      const rank = ranked.indexOf(i);
      c.beginPath();
      c.arc(n.x, n.y, rank >= 0 ? 5 : r, 0, Math.PI * 2);
      if (n.state === 'queued') {
        c.strokeStyle = P.muted;
        c.stroke();
      } else {
        c.fillStyle = n.state === 'fetching' ? P.accent2 : rank >= 0 ? P.accent : P.text;
        c.globalAlpha = this.phase === 'query' && rank < 0 ? 0.35 : 1;
        c.fill();
        c.globalAlpha = 1;
      }
      if (n.state === 'fetching') {
        const k = (t - n.fetchAt) / 0.45;
        c.strokeStyle = P.accent2;
        c.globalAlpha = 1 - k;
        c.beginPath();
        c.arc(n.x, n.y, 4 + k * 14, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
      }
      if (rank >= 0) {
        this.text(`#${rank + 1} ${n.url}`, n.x + 9, n.y, P.accent, 9);
      }
    }

    // cabeçalho do grafo
    const indexed = this.nodes.filter((n) => n.state === 'indexed').length;
    this.text(i18n('viz.crawler', { n: indexed, q: this.queue.length }), 10, 11, P.muted, 9);

    if (this.phase === 'query') {
      const typed = i18n('viz.query').slice(0, Math.floor((t - this.phaseAt) * 14));
      const bw = Math.min(this.graphW - 20, 210);
      c.fillStyle = P.bg;
      c.fillRect(10, this.h - 30, bw, 20);
      c.strokeStyle = P.accent;
      c.strokeRect(10.5, this.h - 29.5, bw, 19);
      this.text(`⌕ ${typed}${Math.floor(t * 3) % 2 ? '▮' : ''}`, 16, this.h - 20, P.text, 10);
    }

    // painel do índice
    if (this.w >= 420) {
      const x0 = this.graphW + 8;
      c.fillStyle = P.line;
      c.fillRect(x0 - 8, 0, 1, this.h);
      this.text(i18n('viz.index'), x0, 11, P.accent2, 9);
      this.text(i18n('viz.terms', { n: this.terms.toLocaleString(locale()) }), this.w - 8, 11, P.muted, 9, 'right');
      const lineH = 13;
      const max = Math.floor((this.h - 30) / lineH);
      const lines = this.log.slice(-max);
      const charW = 5.5;
      const maxChars = Math.floor((this.w - x0 - 6) / charW);
      lines.forEach((l, i) => {
        const fresh = t - l.at < 0.6;
        const s = l.s.length > maxChars ? `${l.s.slice(0, maxChars - 1)}…` : l.s;
        this.text(s, x0, 30 + i * lineH, fresh ? P.accent : P.muted, 9);
      });
    }
  }
}

// =====================================================================
// 2. EVOLUTION — população de mini-sites evoluindo em direção a um alvo
// =====================================================================

interface Mini {
  hue: number;
  layout: number; // 0..3
  fit: number;
  shownFit: number;
  flash: number;
}

class EvolutionViz extends Viz {
  private pop: Mini[] = [];
  private target = { hue: 0, layout: 0 };
  private gen = 0;
  private best: number[] = [];
  private phase: 'eval' | 'select' | 'breed' = 'eval';
  private phaseAt = 0;

  private reset(t: number): void {
    this.target = { hue: rand(0, 360), layout: Math.floor(rand(0, 4)) };
    this.pop = Array.from({ length: 8 }, () => ({ hue: rand(0, 360), layout: Math.floor(rand(0, 4)), fit: 0, shownFit: 0, flash: 0 }));
    this.gen = 0;
    this.best = [];
    this.phase = 'eval';
    this.phaseAt = t;
    this.evaluate();
  }

  private evaluate(): void {
    for (const m of this.pop) {
      const d = Math.min(Math.abs(m.hue - this.target.hue), 360 - Math.abs(m.hue - this.target.hue)) / 180;
      m.fit = Math.max(0.03, Math.min(1, 0.7 * (1 - d) + 0.3 * (m.layout === this.target.layout ? 1 : 0) + rand(-0.05, 0.05)));
      m.shownFit = 0;
    }
  }

  private breed(): void {
    const ranked = [...this.pop].sort((a, b) => b.fit - a.fit);
    const elite = ranked.slice(0, 2);
    const parents = ranked.slice(0, 4);
    const next: Mini[] = elite.map((e) => ({ ...e, flash: 0 }));
    while (next.length < 8) {
      const a = pick(parents);
      const b = pick(parents);
      const child: Mini = { hue: Math.random() < 0.5 ? a.hue : b.hue, layout: Math.random() < 0.5 ? a.layout : b.layout, fit: 0, shownFit: 0, flash: 0 };
      if (Math.random() < 0.35) {
        child.hue = (child.hue + rand(-40, 40) + 360) % 360;
        child.flash = 1;
      }
      if (Math.random() < 0.12) {
        child.layout = Math.floor(rand(0, 4));
        child.flash = 1;
      }
      next.push(child);
    }
    this.pop = next;
  }

  private thumb(x: number, y: number, w: number, h: number, m: Mini, dim: boolean): void {
    const c = this.ctx;
    const col = `hsl(${m.hue.toFixed(0)} 80% 66%)`;
    c.globalAlpha = dim ? 0.3 : 1;
    c.fillStyle = palette.surface;
    c.fillRect(x, y, w, h);
    c.fillStyle = col;
    c.fillRect(x, y, w, 3); // "nav"
    const pad = 4;
    const iw = w - pad * 2;
    const ih = h - 10;
    c.fillStyle = col;
    c.globalAlpha *= 0.75;
    if (m.layout === 0) {
      // hero + 3 cards
      c.fillRect(x + pad, y + 7, iw * 0.6, ih * 0.35);
      for (let i = 0; i < 3; i++) c.fillRect(x + pad + (iw / 3) * i, y + 7 + ih * 0.5, iw / 3 - 2, ih * 0.4);
    } else if (m.layout === 1) {
      // lista
      for (let i = 0; i < 4; i++) c.fillRect(x + pad, y + 7 + (ih / 4) * i, iw, ih / 4 - 2);
    } else if (m.layout === 2) {
      // bento
      c.fillRect(x + pad, y + 7, iw * 0.62, ih - 2);
      c.fillRect(x + pad + iw * 0.66, y + 7, iw * 0.34, ih / 2 - 2);
      c.fillRect(x + pad + iw * 0.66, y + 7 + ih / 2, iw * 0.34, ih / 2 - 2);
    } else {
      // centralizado
      c.beginPath();
      c.arc(x + w / 2, y + 7 + ih * 0.35, ih * 0.25, 0, Math.PI * 2);
      c.fill();
      c.fillRect(x + w * 0.25, y + 7 + ih * 0.72, w * 0.5, ih * 0.15);
    }
    c.globalAlpha = 1;
    if (m.flash > 0) {
      c.strokeStyle = palette.accent2;
      c.globalAlpha = m.flash;
      c.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
      c.globalAlpha = 1;
    }
  }

  protected draw(t: number, dt: number): void {
    const c = this.ctx;
    const P = palette;
    if (!this.pop.length) this.reset(t);
    const el = t - this.phaseAt;

    if (this.phase === 'eval' && el > 1.3) {
      this.phase = 'select';
      this.phaseAt = t;
    } else if (this.phase === 'select' && el > 0.9) {
      this.best.push(Math.max(...this.pop.map((m) => m.fit)));
      this.breed();
      this.gen++;
      this.phase = 'breed';
      this.phaseAt = t;
    } else if (this.phase === 'breed' && el > 0.7) {
      if (this.gen >= 22) return this.reset(t);
      this.evaluate();
      this.phase = 'eval';
      this.phaseAt = t;
    }

    // grade 4×2 de miniaturas
    const chartH = Math.max(38, this.h * 0.22);
    const top = 22;
    const gridH = this.h - top - chartH - 14;
    const cols = 4;
    const gap = 8;
    const cw = (this.w - 20 - gap * (cols - 1)) / cols;
    const ch = (gridH - gap) / 2 - 10;
    const ranked = [...this.pop].sort((a, b) => b.fit - a.fit);
    this.pop.forEach((m, i) => {
      const x = 10 + (i % cols) * (cw + gap);
      const y = top + Math.floor(i / cols) * (ch + 10 + gap);
      const isTop = ranked.indexOf(m) < 2;
      const dim = this.phase === 'select' && !isTop;
      m.flash = Math.max(0, m.flash - dt * 1.5);
      this.thumb(x, y, cw, ch, m, dim);
      // barra de fitness
      if (this.phase !== 'breed') m.shownFit += (m.fit - m.shownFit) * Math.min(1, dt * 6);
      c.fillStyle = P.line;
      c.fillRect(x, y + ch + 4, cw, 3);
      c.fillStyle = this.phase === 'select' && isTop ? P.accent : P.muted;
      c.fillRect(x, y + ch + 4, cw * m.shownFit, 3);
      if (this.phase === 'select' && isTop) {
        c.strokeStyle = P.accent;
        c.strokeRect(x - 2.5, y - 2.5, cw + 5, ch + 5);
      }
    });

    const label = i18n(({ eval: 'viz.eval', select: 'viz.select', breed: 'viz.breed' } as const)[this.phase]);
    this.text(i18n('viz.gen', { g: this.gen, l: label }), 10, 11, P.muted, 9);
    this.text(i18n('viz.target', { h: this.target.hue.toFixed(0) }), this.w - 10, 11, P.accent2, 9, 'right');

    // gráfico do melhor fitness
    const cy = this.h - chartH - 4;
    c.fillStyle = P.line;
    c.fillRect(10, this.h - 6, this.w - 20, 1);
    if (this.best.length > 1) {
      c.beginPath();
      this.best.forEach((b, i) => {
        const x = 10 + (i / 21) * (this.w - 20);
        const y = cy + chartH - b * chartH;
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      });
      c.strokeStyle = P.accent;
      c.lineWidth = 1.5;
      c.stroke();
      c.lineWidth = 1;
    }
    this.text(i18n('viz.best'), 10, cy + 6, P.muted, 8);
  }
}

// =====================================================================
// 3. DECOMPILE — hex → assembly MIPS → C → build nativo no macOS
// =====================================================================

const ASM = [
  'addiu $sp, $sp, -0x28',
  'sw    $ra, 0x14($sp)',
  'lui   $at, 0x8016',
  'lw    $t6, 0x1C($a0)',
  'beqz  $t6, .L80032B90',
  'jal   func_80032B4C',
  'lwc1  $f4, 0x24($a0)',
  'mul.s $f6, $f4, $f8',
  'swc1  $f6, 0x24($a0)',
  'lw    $ra, 0x14($sp)',
  'jr    $ra',
  'addiu $sp, $sp, 0x28',
];
const C_SRC = [
  'void Entity_Update(Entity* e) {',
  '    if (e->flags != 0) {',
  '        Entity_Step(e);',
  '    }',
  '    e->speed *= e->scale;',
  '}',
  '',
  'void Gfx_Frame(GfxCtx* g) {',
  '    Gfx_BeginList(g);',
  '    Scene_Draw(g, g->scene);',
  '    Gfx_EndList(g);',
  '}',
];

class DecompileViz extends Viz {
  private start = -1;
  private funcs = 0;
  private total = 1904;
  private bytes: string[] = [];

  protected onResize(): void {
    this.bytes = Array.from({ length: 64 }, () =>
      Array.from({ length: 8 }, () => Math.floor(rand(0, 256)).toString(16).toUpperCase().padStart(2, '0')).join(' '),
    );
  }

  protected draw(t: number): void {
    const c = this.ctx;
    const P = palette;
    // o inicializador de campo da subclasse zera `bytes` depois do resize() do construtor
    // base; sem animação (reduced motion) o draw roda antes do ResizeObserver repor.
    if (!this.bytes.length) this.onResize();
    if (this.start < 0) this.start = t;
    const el = t - this.start;
    const CYCLE = 11;

    if (el > CYCLE) {
      this.start = t;
      this.funcs = 0;
      return;
    }

    if (el > 8) return this.drawWindow(t, el - 8);

    // três colunas: HEX | ASM | C
    const narrow = this.w < 420;
    const colW = narrow ? [this.w * 0.45, this.w * 0.55, 0] : [this.w * 0.27, this.w * 0.33, this.w * 0.4];
    const x0 = 8;
    const x1 = x0 + colW[0];
    const x2 = x1 + colW[1];
    const top = 26;
    const lineH = 13;
    const rows = Math.floor((this.h - top - 30) / lineH);

    this.text('HEX', x0, 11, P.muted, 9);
    this.text('MIPS', x1, 11, P.muted, 9);
    if (!narrow) this.text('C', x2, 11, P.muted, 9);
    c.fillStyle = P.line;
    c.fillRect(x1 - 6, 4, 1, this.h - 30);
    if (!narrow) c.fillRect(x2 - 6, 4, 1, this.h - 30);

    // hex rolando com uma linha de leitura destacada
    const scroll = (el * 6) % this.bytes.length;
    const hi = Math.floor(rows * 0.4);
    for (let i = 0; i < rows; i++) {
      const s = this.bytes[(Math.floor(scroll) + i) % this.bytes.length];
      const fits = Math.max(2, Math.floor((colW[0] - 10) / 17));
      const shown = s.split(' ').slice(0, fits).join(' ');
      if (i === hi) {
        c.fillStyle = P.accent2;
        c.globalAlpha = 0.18;
        c.fillRect(x0 - 4, top + i * lineH - 6, colW[0] - 6, 12);
        c.globalAlpha = 1;
      }
      this.text(shown, x0, top + i * lineH, i === hi ? P.accent2 : P.muted, 9);
    }

    // assembly sendo decodificado
    const asmCount = Math.min(ASM.length, Math.floor(el * 2.2));
    const asmChars = Math.floor((colW[1] - 10) / 5.5);
    for (let i = 0; i < Math.min(asmCount, rows); i++) {
      const s = ASM[i].length > asmChars ? ASM[i].slice(0, asmChars) : ASM[i];
      this.text(s, x1, top + i * lineH, i === asmCount - 1 ? P.accent2 : P.text, 9);
    }

    // C aparecendo depois
    if (!narrow) {
      const cTyped = Math.max(0, (el - 2) * 26);
      let budget = cTyped;
      const cChars = Math.floor((colW[2] - 10) / 5.5);
      for (let i = 0; i < Math.min(C_SRC.length, rows) && budget > 0; i++) {
        const full = C_SRC[i].length > cChars ? C_SRC[i].slice(0, cChars) : C_SRC[i];
        const s = full.slice(0, Math.floor(budget));
        budget -= C_SRC[i].length + 4;
        const kw = /^(void|\s+if)/.test(s);
        this.text(s, x2, top + i * lineH, kw ? P.accent : P.text, 9);
      }
    }

    // progresso de decompilação + build
    this.funcs = Math.min(this.total, Math.floor(380 + el * 160));
    const pct = this.funcs / this.total;
    const by = this.h - 16;
    c.fillStyle = P.line;
    c.fillRect(x0, by, this.w - 16, 3);
    c.fillStyle = P.accent;
    c.fillRect(x0, by, (this.w - 16) * pct, 3);
    const msg =
      el < 6.5
        ? i18n('viz.decompiled', { a: this.funcs.toLocaleString(locale()), b: this.total.toLocaleString(locale()) })
        : `clang -arch arm64 … build ok ✓`;
    this.text(msg, x0, by - 8, el < 6.5 ? P.muted : P.accent, 9);
  }

  /** Janela estilo macOS rodando um terreno em wireframe (cena genérica). */
  private drawWindow(t: number, el: number): void {
    const c = this.ctx;
    const P = palette;
    const k = Math.min(1, el / 0.4);
    const ww = this.w * (0.72 + 0.12 * k);
    const wh = this.h * (0.7 + 0.12 * k);
    const wx = (this.w - ww) / 2;
    const wy = (this.h - wh) / 2;
    c.globalAlpha = k;
    c.fillStyle = P.bg;
    c.fillRect(wx, wy, ww, wh);
    c.strokeStyle = P.line;
    c.strokeRect(wx + 0.5, wy + 0.5, ww, wh);
    c.fillStyle = P.surface;
    c.fillRect(wx, wy, ww, 16);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(wx + 10 + i * 12, wy + 8, 3.5, 0, Math.PI * 2);
      c.fill();
    });
    this.text(i18n('viz.window'), wx + ww / 2, wy + 8, P.muted, 9, 'center');

    // terreno wireframe em perspectiva
    c.save();
    c.beginPath();
    c.rect(wx, wy + 16, ww, wh - 16);
    c.clip();
    const cx = wx + ww / 2;
    const horizon = wy + 16 + (wh - 16) * 0.3;
    const N = 14;
    const pts: { x: number; y: number }[][] = [];
    for (let zi = 0; zi < N; zi++) {
      const row: { x: number; y: number }[] = [];
      // a câmera avança: cada fileira se aproxima e volta para o fundo ao sair
      const z = 1.4 + zi * 0.5 - ((t * 0.9) % 0.5);
      const zw = z + Math.floor((t * 0.9) / 0.5) * 0.5; // coordenada do mundo, para o relevo andar
      for (let xi = -N; xi <= N; xi++) {
        const wxp = xi * 0.5;
        const hgt = Math.sin(wxp * 0.9 + zw * 0.8) * 0.35 + Math.cos(wxp * 0.4 - zw * 0.6) * 0.45;
        const sx = cx + (wxp / z) * ww * 0.22;
        const sy = horizon + ((1.2 - hgt) / z) * (wh * 0.4);
        row.push({ x: sx, y: sy });
      }
      pts.push(row);
    }
    c.strokeStyle = P.accent;
    c.lineWidth = 0.8;
    for (let zi = 0; zi < N; zi++) {
      c.globalAlpha = k * (1 - zi / N) * 0.9;
      c.beginPath();
      pts[zi].forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
      c.stroke();
      if (zi < N - 1) {
        for (let i = 0; i < pts[zi].length; i += 2) {
          c.beginPath();
          c.moveTo(pts[zi][i].x, pts[zi][i].y);
          c.lineTo(pts[zi + 1][i].x, pts[zi + 1][i].y);
          c.stroke();
        }
      }
    }
    c.restore();
    c.globalAlpha = 1;
    c.lineWidth = 1;
    this.text(i18n('viz.native'), wx + 10, wy + wh - 10, P.accent2, 9);
  }
}

// =====================================================================
// Agendador compartilhado
// =====================================================================

const instances: Viz[] = [];
let raf = 0;
let last = 0;
let tick = 0;

function loop(now: number): void {
  raf = requestAnimationFrame(loop);
  if (document.hidden) return;
  if (tick++ % 2) return; // ~30 fps
  const t = now / 1000;
  const dt = Math.min(0.1, t - last || 0.033);
  last = t;
  // descarta animações cujo canvas saiu da página (re-render de idioma, estudo fechado)
  for (let i = instances.length - 1; i >= 0; i--) if (!instances[i].connected) instances.splice(i, 1);
  for (const v of instances) if (v.visible) v.frame(t, dt);
}

export function mountViz(canvas: HTMLCanvasElement, kind: VizKind): void {
  const v = kind === 'crawler' ? new CrawlerViz(canvas) : kind === 'evolution' ? new EvolutionViz(canvas) : new DecompileViz(canvas);
  instances.push(v);
  if (REDUCED) {
    // um frame representativo, sem animação
    requestAnimationFrame(() => {
      for (let i = 0; i < 90; i++) v.frame(i / 15, 1 / 15);
    });
    return;
  }
  if (!raf) raf = requestAnimationFrame(loop);
}
