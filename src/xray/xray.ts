/**
 * Raio-X: o site mostrando os próprios bastidores (chunk carregado sob demanda).
 *
 * Entrada: um feixe de scanner desce pela tela. Acima dele o site já é planta
 * (camada com mix-blend-mode recortada por clip-path) e as partículas do
 * organismo viram contorno (uniform no shader). Quando o feixe passa do fim, a
 * camada temporária sai e entra o tema "planta" barato (variáveis CSS em
 * html.xr-on), as caixas dos componentes se desenham e os painéis entram.
 * Saída: o feixe sobe e devolve o site. Com prefers-reduced-motion, corte seco.
 *
 * Custo enquanto aberto: painéis atualizam 2×/s (só os visíveis); as caixas só
 * se reposicionam quando há rolagem/redimensionamento (1× por frame, lendo
 * todas as posições antes de escrever); nada roda depois de fechar.
 */

import './xray.css';
import { getLang, onLangChange } from '../i18n';
import { ANNOTATIONS, REPO, type Annotation } from './annotations';
import { bus, type XrEvent } from './bus';
import { clock, formatBytes, formatGene, summarizeResources, tagLabel, type ResourceLike } from './format';
import { s, type StringKey } from './strings';
import type { XrayContext } from './trigger';
import { readVitals } from './vitals';

type Phase = 'closed' | 'opening' | 'open' | 'closing';
type Panel = 'net' | 'render' | 'genome';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const WIDE = matchMedia('(min-width: 1100px)');
const FINE_HOVER = matchMedia('(hover: hover) and (pointer: fine)');

const OPEN_MS = 1150;
const CLOSE_MS = 480;
const FLASH_MS = 120;
const TICK_MS = 500;
const LOG_MAX = 80;
/** abaixo da barra do Raio-X: rótulos de caixas mais altas que a tela grudam aqui */
const PIN_TOP = 78;
/** variação mínima do fitness para virar linha no diário */
const FIT_LOG_STEP = 0.05;

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}

interface BoxRef {
  a: Annotation;
  target: Element | null;
  box: HTMLDivElement;
  label: HTMLSpanElement;
  meta: HTMLSpanElement;
  rect: DOMRect | null;
}

class XrayUI {
  readonly root = h('div', 'xr');
  /**
   * A camada de varredura fica FORA de .xr, direto no <body>: mix-blend-mode só
   * mistura com o que está no mesmo contexto de empilhamento, e .xr (fixo, com
   * z-index) isolaria a mistura — a camada viraria um retângulo azul chapado.
   */
  readonly scan = h('div', 'xr-scan');
  private beam = h('div', 'xr-beam');
  private boxesLayer = h('div', 'xr-boxes');
  private tip = h('div', 'xr-tip');
  private live = h('p', 'xr-sr');
  private hudBar = h('i');
  private boxes: BoxRef[] = [];
  private panels = new Map<Panel, HTMLElement>();
  private tabs = new Map<'structure' | Panel, HTMLButtonElement>();
  private logList = h('ol', 'xr-log');
  private fpsCanvas = h('canvas', 'xr-spark');
  private fpsHistory: number[] = [];
  private structureOn = true;
  private shown = new Set<Panel>();
  private tickTimer = 0;
  private ticks = 0;
  private beamRaf = 0;
  private layoutRaf = 0;
  private pageRaf = 0;
  private pageFrames = 0;
  private pageFpsAt = performance.now();
  private pageFps = 0;
  private edge = 0;
  private tipFor: BoxRef | null = null;
  private tipHide = 0;
  private lastFitLogged = -1;
  private cleanups: (() => void)[] = [];

  constructor(private ctx: XrayContext) {
    this.root.setAttribute('role', 'region');
    this.root.dataset.xray = '';
    this.scan.setAttribute('aria-hidden', 'true');
    this.beam.setAttribute('aria-hidden', 'true');
    this.beam.append(h('i'), h('span', 'xr-beam-tag', 'SCAN'));
    this.boxesLayer.setAttribute('aria-hidden', 'true');
    this.tip.setAttribute('role', 'tooltip');
    this.tip.hidden = true;
    this.live.setAttribute('aria-live', 'polite');
    const flash = h('div', 'xr-flash');
    flash.setAttribute('aria-hidden', 'true');
    const grid = h('div', 'xr-grid');
    grid.setAttribute('aria-hidden', 'true');

    const hud = h('div', 'xr-hud mono');
    hud.setAttribute('aria-hidden', 'true');
    const hudTrack = h('div', 'xr-hud-track');
    hudTrack.append(this.hudBar);
    hud.append(h('span', '', ''), hudTrack);
    hud.firstElementChild!.setAttribute('data-xs', 'scanning');

    this.root.append(grid, this.boxesLayer, this.beam, flash, hud, this.buildBar(), this.buildPanels(), this.tip, this.live);
    this.buildBoxes();

    this.shown = WIDE.matches ? new Set<Panel>(['net', 'render', 'genome']) : new Set<Panel>(['genome']);
    this.applyTabs();
    this.relabel();
  }

  // ------------------------------------------------------------------ montagem

  private buildBar(): HTMLElement {
    const bar = h('header', 'xr-bar mono');
    const left = h('div', 'xr-bar-left');
    left.append(h('span', 'xr-badge'), h('span', 'xr-sub'));
    left.firstElementChild!.setAttribute('data-xs', 'badge');
    left.lastElementChild!.setAttribute('data-xs', 'subtitle');

    const tabs = h('div', 'xr-tabs');
    tabs.setAttribute('role', 'toolbar');
    for (const id of ['structure', 'net', 'render', 'genome'] as const) {
      const b = h('button', 'xr-tab');
      b.type = 'button';
      b.dataset.xs = `tab.${id}`;
      b.dataset.tab = id;
      b.addEventListener('click', () => this.onTab(id));
      this.tabs.set(id, b);
      tabs.append(b);
    }

    const closeBtn = h('button', 'xr-close');
    closeBtn.type = 'button';
    closeBtn.dataset.xs = 'closeHint';
    closeBtn.addEventListener('click', () => close());
    bar.append(left, tabs, closeBtn);
    return bar;
  }

  private buildPanels(): HTMLElement {
    const wrap = h('div', 'xr-panels');
    const mk = (id: Panel, cls: string) => {
      const p = h('section', `xr-panel ${cls}`);
      p.dataset.panel = id;
      this.panels.set(id, p);
      return p;
    };

    const net = mk('net', 'xr-net');
    net.append(this.head('net.title'), h('div', 'xr-net-rows'), h('div', 'xr-vitals'), h('p', 'xr-note'));

    const render = mk('render', 'xr-render');
    this.fpsCanvas.width = 360;
    this.fpsCanvas.height = 48;
    this.fpsCanvas.setAttribute('aria-hidden', 'true');
    render.append(this.head('render.title'), this.fpsCanvas, h('dl', 'xr-stats'), h('p', 'xr-note'));

    const genome = mk('genome', 'xr-genome');
    const g1 = h('div', 'xr-col');
    g1.append(this.head('genome.title'), h('p', 'xr-ghead'), this.logList);
    const g2 = h('div', 'xr-col xr-fit');
    g2.append(h('div', 'xr-head'), h('div', 'xr-bars'), h('p', 'xr-note'));
    genome.append(g1, g2);

    // lado direito: rede + render empilhados; embaixo: genoma + fitness
    const side = h('div', 'xr-side');
    side.append(net, render);
    wrap.append(side, genome);
    return wrap;
  }

  private head(key: StringKey): HTMLElement {
    const el = h('div', 'xr-head');
    el.dataset.xs = key;
    return el;
  }

  private buildBoxes(): void {
    ANNOTATIONS.forEach((a, i) => {
      const box = h('div', `xr-box${a.hot ? ' hot' : ''}`);
      box.style.setProperty('--i', String(i));
      const label = h('span', 'xr-box-label');
      const meta = h('span', 'xr-box-meta');
      box.append(label, meta);
      this.boxesLayer.append(box);
      this.boxes.push({ a, target: null, box, label, meta, rect: null });
    });
  }

  /** Textos fixos (troca de idioma refaz). */
  relabel(): void {
    this.root.setAttribute('aria-label', s('region'));
    this.root.querySelectorAll<HTMLElement>('[data-xs]').forEach((el) => {
      el.textContent = s(el.dataset.xs as StringKey);
    });
    this.tabs.get('structure')!.parentElement!.setAttribute('aria-label', s('region'));
    // o diário é refeito a partir dos dados, já no idioma novo
    this.logList.replaceChildren();
    for (const e of bus.history()) this.appendLog(e, false);
    this.scrollLog();
    if (this.root.isConnected) this.refresh(true);
  }

  // ------------------------------------------------------------------ abas

  private onTab(id: 'structure' | Panel): void {
    if (id === 'structure') {
      this.structureOn = !this.structureOn;
    } else if (WIDE.matches) {
      if (this.shown.has(id)) this.shown.delete(id);
      else this.shown.add(id);
    } else {
      // tela estreita: uma gaveta por vez
      const only = this.shown.has(id) && this.shown.size === 1;
      this.shown = only ? new Set() : new Set([id]);
    }
    this.applyTabs();
    this.refresh(true);
  }

  private applyTabs(): void {
    this.tabs.forEach((b, id) => {
      const on = id === 'structure' ? this.structureOn : this.shown.has(id);
      b.setAttribute('aria-pressed', String(on));
    });
    this.panels.forEach((p, id) => {
      p.hidden = !this.shown.has(id);
    });
    this.boxesLayer.hidden = !this.structureOn;
    if (!this.structureOn) this.hideTip();
  }

  // ------------------------------------------------------------------ ciclo de vida

  mount(): void {
    document.body.append(this.scan, this.root);
    const onScroll = () => this.scheduleLayout();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    const onMove = (e: PointerEvent) => this.onPointer(e);
    window.addEventListener('pointermove', onMove, { passive: true });
    const unsub = bus.subscribe((e) => {
      this.appendLog(e, true);
      this.scrollLog();
    });
    const onWide = () => {
      if (!WIDE.matches && this.shown.size > 1) this.shown = new Set(['genome']);
      this.applyTabs();
      this.refresh(true);
    };
    WIDE.addEventListener('change', onWide);
    this.cleanups.push(
      () => window.removeEventListener('scroll', onScroll),
      () => window.removeEventListener('resize', onScroll),
      () => window.removeEventListener('pointermove', onMove),
      unsub,
      () => WIDE.removeEventListener('change', onWide),
    );
    this.countPageFps();
    // painéis e caixas só aparecem depois da varredura: o preenchimento completo
    // (rede, render, rótulos) fica para finishOpen, fora dos frames da animação
    this.tickTimer = window.setInterval(() => phase === 'open' && this.refresh(false), TICK_MS);
  }

  destroy(): void {
    clearInterval(this.tickTimer);
    cancelAnimationFrame(this.beamRaf);
    cancelAnimationFrame(this.layoutRaf);
    cancelAnimationFrame(this.pageRaf);
    clearTimeout(this.tipHide);
    for (const fn of this.cleanups) fn();
    this.cleanups = [];
    this.scan.remove();
    this.root.remove();
  }

  setEdge(y: number): void {
    this.edge = y;
    // primeiro a leitura (o organismo mede o canvas), depois a escrita de estilo:
    // na ordem inversa cada frame forçava um recálculo de layout (medido: ~90 ms na entrada)
    this.ctx.getOrganism()?.setXray(y);
    const v = `${y.toFixed(1)}px`;
    this.root.style.setProperty('--xr-edge', v);
    this.scan.style.setProperty('--xr-edge', v);
  }

  /** o tema mudou (planta liga/desliga): quem desenha em canvas relê as cores */
  themeChanged(): void {
    this.ctx.onThemeChange?.();
  }

  organismOff(): void {
    this.ctx.getOrganism()?.setXray('off');
  }

  animateBeam(to: number, fullMs: number, done: () => void): void {
    cancelAnimationFrame(this.beamRaf);
    const from = this.edge;
    const span = Math.max(1, window.innerHeight);
    // interrompido no meio: a duração é proporcional ao que falta percorrer
    const dur = Math.max(120, fullMs * Math.min(1, Math.abs(to - from) / span));
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const y = from + (to - from) * easeInOutCubic(k);
      this.setEdge(y); // lê antes de escrever: ver setEdge
      this.hudBar.style.transform = `scaleX(${Math.min(1, Math.max(0, y / span)).toFixed(3)})`;
      if (k < 1) this.beamRaf = requestAnimationFrame(step);
      else done();
    };
    this.beamRaf = requestAnimationFrame(step);
  }

  announce(key: StringKey): void {
    this.live.textContent = s(key);
  }

  // ------------------------------------------------------------------ atualização

  /** Tique de 2×/s: só o que está visível. `full` força tudo (abertura, troca de aba). */
  refresh(full: boolean): void {
    this.ticks++;
    if (phase === 'open') this.ctx.getOrganism()?.setXray('on'); // organismo pode ter carregado depois
    if (this.structureOn) {
      this.updateBoxLabels();
      this.layout();
    }
    if (this.shown.has('net') && (full || this.ticks % 4 === 0)) this.renderNet();
    if (this.shown.has('render')) this.renderRender();
    if (this.shown.has('genome')) this.renderGenome();
  }

  private scheduleLayout(): void {
    if (this.layoutRaf || !this.structureOn) return;
    this.layoutRaf = requestAnimationFrame(() => {
      this.layoutRaf = 0;
      this.layout();
    });
  }

  /** Posiciona as caixas: lê todas as posições, depois escreve (sem layout thrashing). */
  private layout(): void {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    for (const b of this.boxes) {
      if (!b.target || !b.target.isConnected) b.target = document.querySelector(b.a.selector);
      const r = b.target?.getBoundingClientRect() ?? null;
      const visible = !!r && r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
      b.rect = visible ? r : null;
    }
    for (const b of this.boxes) {
      const r = b.rect;
      if (!r) {
        b.box.hidden = true;
        continue;
      }
      b.box.hidden = false;
      const st = b.box.style;
      st.transform = `translate(${r.left.toFixed(0)}px, ${r.top.toFixed(0)}px)`;
      st.width = `${r.width.toFixed(0)}px`;
      st.height = `${r.height.toFixed(0)}px`;
      // rótulo gruda no topo da tela quando o elemento é mais alto que ela
      st.setProperty('--pin', `${Math.max(0, PIN_TOP - r.top).toFixed(0)}px`);
    }
  }

  private updateBoxLabels(): void {
    const g = this.ctx.getGenome();
    const stats = this.ctx.getOrganism()?.stats();
    for (const b of this.boxes) {
      const el = b.target?.isConnected ? b.target : document.querySelector(b.a.selector);
      const genes = b.a.genes.map((k) => `${k}=${formatGene(k, g[k])}`).join(' · ');
      const label = `${el ? tagLabel(el) : b.a.selector}${genes ? `  ${genes}` : ''}`;
      if (b.label.textContent !== label) b.label.textContent = label;
      let meta = b.a.src;
      if (b.a.selector === '#organism' && stats) {
        meta = `${stats.particles.toLocaleString(getLang() === 'pt' ? 'pt-BR' : 'en-US')} pts · ${stats.drawCalls} draw calls · ${stats.running ? `${stats.fps} fps` : '⏸'}`;
      }
      if (b.meta.textContent !== meta) b.meta.textContent = meta;
    }
  }

  private renderNet(): void {
    const p = this.panels.get('net')!;
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const entries: ResourceLike[] = [...(nav ? [nav] : []), ...res];
    const vit = readVitals();
    const sum = summarizeResources(entries, location.origin, vit.lcp);

    const head = p.querySelector<HTMLElement>('.xr-head')!;
    head.textContent = `${s('net.title')}  ·  ${s('net.summary', { n: sum.count, kb: formatBytes(sum.transfer) })}`;

    const rows = p.querySelector<HTMLElement>('.xr-net-rows')!;
    const end = Math.max(sum.end, vit.lcp ?? 0, 1);
    const frag = document.createDocumentFragment();
    for (const r of sum.rows) {
      const row = h('div', 'xr-row');
      const name = h('span', 'xr-row-name', r.label);
      name.title = r.label;
      const size = h('span', 'xr-row-size', r.cached ? s('net.cache') : formatBytes(r.bytes));
      const track = h('div', 'xr-row-track');
      const bar = h('i', `k-${r.kind}`);
      bar.style.left = `${((r.start / end) * 100).toFixed(2)}%`;
      bar.style.width = `${Math.max(0.8, ((r.end - r.start) / end) * 100).toFixed(2)}%`;
      track.append(bar);
      row.append(name, size, track);
      frag.append(row);
    }
    if (vit.lcp !== null) {
      // a linha do LCP fica numa camada alinhada com a coluna das barras
      const layer = h('div', 'xr-lcp-layer');
      const mark = h('i', 'xr-lcp');
      mark.style.left = `${((vit.lcp / end) * 100).toFixed(2)}%`;
      layer.append(mark);
      frag.append(layer);
    }
    rows.replaceChildren(frag);

    const vitals = p.querySelector<HTMLElement>('.xr-vitals')!;
    const v = (k: string, val: string, good: boolean | null) => {
      const d = h('div', `xr-vital${good === false ? ' warn' : ''}`);
      d.append(h('span', '', k), h('b', '', val));
      return d;
    };
    vitals.replaceChildren(
      v('LCP', vit.lcp === null ? '—' : `${(vit.lcp / 1000).toFixed(2)} s`, vit.lcp === null ? null : vit.lcp <= 2500),
      v('CLS', vit.cls === null ? '—' : vit.cls.toFixed(3), vit.cls === null ? null : vit.cls <= 0.1),
      v('INP', vit.inp === null ? '—' : `${Math.round(vit.inp)} ms`, vit.inp === null ? null : vit.inp <= 200),
    );

    const note = p.querySelector<HTMLElement>('.xr-note')!;
    const kb = formatBytes(sum.threeBytes);
    const parts = [
      sum.threeAfterLcp === null ? s('net.noThree') : sum.threeAfterLcp ? s('net.threeAfter', { kb }) : s('net.threeBefore', { kb }),
    ];
    if (vit.inp === null) parts.push(s('net.inpHint'));
    note.textContent = parts.join(' ');
  }

  private countPageFps(): void {
    const loop = (now: number) => {
      this.pageFrames++;
      if (now - this.pageFpsAt >= 1000) {
        this.pageFps = Math.round((this.pageFrames * 1000) / (now - this.pageFpsAt));
        this.pageFrames = 0;
        this.pageFpsAt = now;
      }
      this.pageRaf = requestAnimationFrame(loop);
    };
    this.pageRaf = requestAnimationFrame(loop);
  }

  private renderRender(): void {
    const p = this.panels.get('render')!;
    const o = this.ctx.getOrganism()?.stats() ?? null;
    const fps = o?.running ? o.fps : this.pageFps;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();
    this.drawSpark();

    const head = p.querySelector<HTMLElement>('.xr-head')!;
    const who = o?.running ? 'WebGL' : s('render.page');
    head.textContent = `${s('render.title')}  ·  ${who} ${fps} fps · ${fps > 0 ? (1000 / fps).toFixed(1) : '—'} ms ${s('render.frame')}`;

    const lc = getLang() === 'pt' ? 'pt-BR' : 'en-US';
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const rows: [string, string][] = [
      [s('render.page'), `${this.pageFps} fps`],
      [s('render.particles'), o ? o.particles.toLocaleString(lc) : '—'],
      [s('render.calls'), o ? String(o.drawCalls) : '—'],
      [s('render.canvas'), o ? `${o.canvas} @ ${o.dpr}x` : '—'],
      [s('render.quality'), o ? `${Math.round(o.quality * 100)}%` : '—'],
      [s('render.heap'), mem ? formatBytes(mem.usedJSHeapSize) : '—'],
    ];
    const dl = p.querySelector<HTMLElement>('.xr-stats')!;
    const frag = document.createDocumentFragment();
    for (const [k, v] of rows) frag.append(h('dt', '', k), h('dd', '', v));
    dl.replaceChildren(frag);
    p.querySelector<HTMLElement>('.xr-note')!.textContent = !o ? s('render.none') : o.running ? '' : s('render.paused');
  }

  private drawSpark(): void {
    const c = this.fpsCanvas;
    const g = c.getContext('2d');
    if (!g) return;
    const css = getComputedStyle(this.root);
    const ok = css.getPropertyValue('--xr-c').trim() || '#5ec8ff';
    const warn = css.getPropertyValue('--xr-warn').trim() || '#ffb86b';
    g.clearRect(0, 0, c.width, c.height);
    const n = this.fpsHistory.length;
    const w = c.width / 60;
    for (let i = 0; i < n; i++) {
      const f = this.fpsHistory[i];
      const hgt = Math.max(2, (Math.min(f, 60) / 60) * (c.height - 4));
      g.fillStyle = f >= 50 ? ok : warn;
      g.fillRect((60 - n + i) * w, c.height - hgt, Math.max(1, w - 2), hgt);
    }
  }

  private renderGenome(): void {
    const p = this.panels.get('genome')!;
    const evo = this.ctx.evo;
    p.querySelector<HTMLElement>('.xr-ghead')!.textContent = s('genome.head', {
      g: evo.state.generation,
      id: evo.current.id,
      n: evo.state.population.length,
      d: Math.round(this.ctx.driftProgress() * 100),
    });
    if (!this.logList.children.length) {
      const li = h('li', 'xr-empty', s('genome.empty'));
      this.logList.append(li);
    }

    const snap = this.ctx.tracker.snapshot();
    const fit = p.querySelector<HTMLElement>('.xr-fit')!;
    fit.querySelector<HTMLElement>('.xr-head')!.textContent = s('fit.title', { s: snap.score.toFixed(2) });
    const max = { time: 0.25, scroll: 0.2, projects: 0.15, contact: 0.1, hero: 0.1, vote: 0.3 } as const;
    const frag = document.createDocumentFragment();
    for (const k of Object.keys(max) as (keyof typeof max)[]) {
      const val = snap.parts[k];
      const row = h('div', 'xr-bar-row');
      const track = h('div', 'xr-bar-track');
      const fill = h('i', val < 0 ? 'neg' : '');
      fill.style.width = `${Math.min(100, (Math.abs(val) / max[k]) * 100).toFixed(1)}%`;
      track.append(fill);
      row.append(h('span', '', s(`fit.${k}` as StringKey)), track, h('b', '', val === 0 ? '—' : `${val > 0 ? '' : '−'}${Math.abs(val).toFixed(2)}`));
      frag.append(row);
    }
    fit.querySelector<HTMLElement>('.xr-bars')!.replaceChildren(frag);
    fit.querySelector<HTMLElement>('.xr-note')!.textContent = s('fit.note');

    // registra no diário quando o fitness muda de forma perceptível
    if (Math.abs(snap.score - this.lastFitLogged) >= FIT_LOG_STEP) {
      this.lastFitLogged = snap.score;
      bus.emit({ kind: 'fitness', score: snap.score });
    }
  }

  // ------------------------------------------------------------------ diário

  private appendLog(e: XrEvent, live: boolean): void {
    this.logList.querySelector('.xr-empty')?.remove();
    const lines: [string, string][] = []; // [classe, texto]
    switch (e.kind) {
      case 'visit':
        lines.push(['sel', s('log.visit', { id: e.id, g: e.gen, e: e.evals })]);
        break;
      case 'drift': {
        lines.push(['dim', s('log.drift', { s: e.step, p: Math.round(e.rate * 100) })]);
        const shown = e.changed.slice(0, 5);
        for (const c of shown) lines.push(['ok', `  ${c.gene.padEnd(13)} ${formatGene(c.gene, c.from)} → ${formatGene(c.gene, c.to)}  ✓`]);
        if (e.changed.length > shown.length) lines.push(['dim', s('log.more', { n: e.changed.length - shown.length })]);
        for (const b of e.blocked.slice(0, 3)) lines.push(['warn', `  ${b.gene.padEnd(13)} ${s(b.reason === 'locked' ? 'log.locked' : 'log.onscreen')}`]);
        if (!e.changed.length && !e.blocked.length) lines.push(['dim', s('log.none')]);
        break;
      }
      case 'restore':
        lines.push(['sel', s('log.restore', { id: e.id })]);
        break;
      case 'fitness':
        lines.push(['dim', s('log.fitness', { s: e.score.toFixed(2) })]);
        break;
      case 'vote':
        lines.push(['ok', s('log.vote', { id: e.id })]);
        break;
      case 'variant':
        lines.push(['sel', e.evolved ? s('log.evolved', { g: e.gen, id: e.id }) : s('log.variant', { id: e.id, prev: e.prev, s: e.score.toFixed(2) })]);
        break;
    }
    const frag = document.createDocumentFragment();
    lines.forEach(([cls, text], i) => {
      const li = h('li', `xr-l ${cls}${live ? ' new' : ''}`);
      li.append(h('time', '', i === 0 ? clock(e.at) : ''), h('span', '', text));
      frag.append(li);
    });
    this.logList.append(frag);
    while (this.logList.children.length > LOG_MAX) this.logList.firstElementChild!.remove();
  }

  private scrollLog(): void {
    this.logList.scrollTop = this.logList.scrollHeight;
  }

  // ------------------------------------------------------------------ dica (hover)

  private onPointer(e: PointerEvent): void {
    if (!FINE_HOVER.matches || !this.structureOn || phase !== 'open') return;
    if (this.tip.contains(e.target as Node)) {
      clearTimeout(this.tipHide);
      return;
    }
    // painéis e barra por cima: sem dica
    if ((e.target as Element | null)?.closest?.('.xr-bar, .xr-panel')) {
      this.scheduleHideTip();
      return;
    }
    let best: BoxRef | null = null;
    let bestArea = Infinity;
    for (const b of this.boxes) {
      const r = b.rect;
      if (!r || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      const area = r.width * r.height;
      if (area < bestArea) {
        best = b;
        bestArea = area;
      }
    }
    if (!best) {
      this.scheduleHideTip();
      return;
    }
    clearTimeout(this.tipHide);
    if (best !== this.tipFor) this.fillTip(best);
    this.placeTip(e.clientX, e.clientY);
  }

  private fillTip(b: BoxRef): void {
    this.tipFor = b;
    b.box.classList.add('focus');
    this.boxes.forEach((o) => o !== b && o.box.classList.remove('focus'));
    const a = h('a', 'xr-tip-link', s('tip.open'));
    a.href = REPO + b.a.src;
    a.target = '_blank';
    a.rel = 'noopener';
    this.tip.replaceChildren(
      h('span', 'xr-tip-label', b.label.textContent ?? ''),
      h('p', '', b.a.desc[getLang()]),
      h('code', '', b.a.src),
      a,
    );
    this.tip.hidden = false;
  }

  private placeTip(x: number, y: number): void {
    const w = this.tip.offsetWidth;
    const hgt = this.tip.offsetHeight;
    const left = Math.min(window.innerWidth - w - 12, x + 18);
    const top = y + 18 + hgt > window.innerHeight - 12 ? y - hgt - 14 : y + 18;
    this.tip.style.transform = `translate(${Math.max(12, left)}px, ${Math.max(60, top)}px)`;
  }

  private scheduleHideTip(): void {
    if (this.tip.hidden) return;
    clearTimeout(this.tipHide);
    this.tipHide = window.setTimeout(() => this.hideTip(), 280);
  }

  private hideTip(): void {
    this.tip.hidden = true;
    this.tipFor?.box.classList.remove('focus');
    this.tipFor = null;
  }
}

// ---------------------------------------------------------------------- estado do módulo

let phase: Phase = 'closed';
let ui: XrayUI | null = null;
let notify: (open: boolean) => void = () => {};
const html = document.documentElement;

onLangChange(() => ui?.relabel());

function finishOpen(): void {
  if (!ui) return;
  phase = 'open';
  html.classList.remove('xr-scanning');
  html.classList.add('xr-on');
  ui.root.classList.remove('is-scanning');
  ui.root.classList.add('is-ready');
  ui.setEdge(window.innerHeight + 8);
  ui.themeChanged();
  ui.announce('announceOn');
  // a troca de tema recalcula o estilo da página inteira neste frame;
  // preencher painéis e caixas fica para o próximo, para não somar as duas tarefas
  const u = ui;
  requestAnimationFrame(() => ui === u && phase === 'open' && u.refresh(true));
}

function finishClose(): void {
  if (!ui) return;
  const o = ui;
  ui = null;
  phase = 'closed';
  html.classList.remove('xr-on', 'xr-scanning');
  o.setEdge(-1e5);
  o.destroy();
  o.themeChanged();
  o.organismOff();
}

function open(ctx: XrayContext): void {
  if (phase === 'open' || phase === 'opening') return;
  if (!ui) {
    ui = new XrayUI(ctx);
    ui.mount();
    ui.setEdge(0);
  }
  phase = 'opening';
  notify(true);
  if (REDUCED.matches) {
    finishOpen();
    return;
  }
  html.classList.add('xr-scanning');
  ui.root.classList.remove('is-ready');
  ui.root.classList.add('is-scanning', 'is-flash');
  const u = ui;
  window.setTimeout(() => u.root.classList.remove('is-flash'), FLASH_MS + 160);
  u.animateBeam(window.innerHeight + 8, OPEN_MS, finishOpen);
}

export function close(): void {
  if (!ui || phase === 'closed' || phase === 'closing') return;
  phase = 'closing';
  notify(false);
  ui.announce('announceOff');
  if (REDUCED.matches) {
    finishClose();
    return;
  }
  html.classList.remove('xr-on');
  html.classList.add('xr-scanning');
  ui.root.classList.remove('is-ready');
  ui.root.classList.add('is-scanning');
  ui.animateBeam(0, CLOSE_MS, finishClose);
}

export function toggle(ctx: XrayContext, onState: (open: boolean) => void): void {
  notify = onState;
  if (phase === 'open' || phase === 'opening') close();
  else open(ctx);
}

export function isOpen(): boolean {
  return phase === 'open' || phase === 'opening';
}

/** Só para testes/depuração. */
export function _phase(): Phase {
  return phase;
}

