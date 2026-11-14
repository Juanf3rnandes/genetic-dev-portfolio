/**
 * Deriva: o site abre ESTÁVEL (o indivíduo que o GA escolheu) e, conforme o
 * visitante usa a página, a mutação sobe aos poucos.
 *
 * Interação (mouse, scroll, toque, cliques, teclas) vira "energia". Cada
 * STEP_ENERGY acumulada gera um passo de mutação, com intervalo mínimo para a
 * mudança ser gradual. A intensidade sobe de 0% a 100% ao longo de DRIFT_STEPS
 * passos e depois continua mutando no máximo, até o visitante restaurar.
 */

export const DRIFT_STEPS = 60;
const STEP_ENERGY = 1.5;
const MIN_INTERVAL_MS = 1400;

// quanto cada tipo de interação vale, em unidades de energia
const PER_POINTER_PX = 1 / 700;
const PER_SCROLL_PX = 1 / 380;
const PER_CLICK = 1.2;
const PER_KEY = 0.4;

export class Drift {
  step = 0;
  private energy = 0;
  private lastStepAt = performance.now();
  private pending = 0;
  private lastPointer: { x: number; y: number } | null = null;
  private lastScroll = window.scrollY;
  private active = false;

  constructor(private onStep: (progress: number) => void) {
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('pointerdown', () => this.add(PER_CLICK), { passive: true });
    window.addEventListener('keydown', () => this.add(PER_KEY), { passive: true });
  }

  /** 0 = estável (genoma original) · 1 = mutação máxima. */
  get progress(): number {
    return Math.min(1, this.step / DRIFT_STEPS);
  }

  /** Volta ao genoma original e recomeça a deriva do zero. */
  start(): void {
    this.step = 0;
    this.energy = 0;
    this.lastScroll = window.scrollY;
    this.lastStepAt = performance.now();
    this.active = true;
  }

  /** Desliga a deriva (ex.: prefers-reduced-motion). */
  stop(): void {
    this.active = false;
  }

  private onPointer = (e: PointerEvent): void => {
    const p = { x: e.clientX, y: e.clientY };
    if (this.lastPointer) this.add(Math.hypot(p.x - this.lastPointer.x, p.y - this.lastPointer.y) * PER_POINTER_PX);
    this.lastPointer = p;
  };

  private onScroll = (): void => {
    const y = window.scrollY;
    this.add(Math.abs(y - this.lastScroll) * PER_SCROLL_PX);
    this.lastScroll = y;
  };

  private add(e: number): void {
    if (!this.active) return;
    this.energy = Math.min(this.energy + e, STEP_ENERGY * 3); // não acumula uma avalanche de passos
    this.tryStep();
  }

  private tryStep(): void {
    if (!this.active || this.energy < STEP_ENERGY) return;
    const wait = MIN_INTERVAL_MS - (performance.now() - this.lastStepAt);
    if (wait > 0) {
      if (!this.pending) this.pending = window.setTimeout(() => ((this.pending = 0), this.tryStep()), wait);
      return;
    }
    this.energy -= STEP_ENERGY;
    this.lastStepAt = performance.now();
    this.step += 1;
    this.onStep(this.progress);
  }
}
