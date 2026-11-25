/**
 * Rastreador de fitness: transforma o comportamento do visitante em um
 * número entre 0 e 1. Nada é enviado a terceiros — só o número agregado
 * entra na população.
 *
 * Sinais (pesos):
 *   tempo ativo na página   0.25  (saturação em 90 s, escala log)
 *   profundidade de scroll  0.20
 *   cliques em projetos     0.15  (até 3)
 *   clique em contato       0.10
 *   hover/interação no hero 0.10  (até 8 s)
 *   voto explícito          +0.30 "gostei" / -0.30 "outra variante"
 */

export interface FitnessSnapshot {
  activeSeconds: number;
  scrollDepth: number;
  projectClicks: number;
  contactClicks: number;
  heroSeconds: number;
  vote: -1 | 0 | 1;
  score: number;
  /** contribuição de cada sinal para o score (já com peso), para o Raio-X */
  parts: FitnessParts;
}

export interface FitnessParts {
  time: number;
  scroll: number;
  projects: number;
  contact: number;
  hero: number;
  vote: number;
  floor: number;
}

export interface FitnessInput {
  activeSeconds: number;
  scrollDepth: number;
  projectClicks: number;
  contactClicks: number;
  heroSeconds: number;
  vote: -1 | 0 | 1;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Fórmula do fitness, pura (testável). score = clamp(soma das partes, 0, 1). */
export function scoreParts(i: FitnessInput): { parts: FitnessParts; score: number } {
  // log para que 10 s valham bem mais que 0 s, mas 90 s não valham 9× 10 s
  const parts: FitnessParts = {
    time: 0.25 * clamp01(Math.log1p(i.activeSeconds) / Math.log1p(90)),
    scroll: 0.2 * clamp01(i.scrollDepth),
    projects: 0.15 * clamp01(i.projectClicks / 3),
    contact: 0.1 * clamp01(i.contactClicks),
    hero: 0.1 * clamp01(i.heroSeconds / 8),
    vote: 0.3 * i.vote,
    floor: 0.1, // só existir já é algo
  };
  const sum = parts.time + parts.scroll + parts.projects + parts.contact + parts.hero + parts.vote + parts.floor;
  return { parts, score: clamp01(sum) };
}


export class FitnessTracker {
  private activeMs = 0;
  private heroMs = 0;
  private lastTick = performance.now();
  private hidden = document.hidden;
  private overHero = false;
  private maxScroll = 0;
  private projectClicks = 0;
  private contactClicks = 0;
  private vote: -1 | 0 | 1 = 0;
  private raf = 0;

  constructor(hero: HTMLElement) {
    document.addEventListener('visibilitychange', () => {
      this.flushTime();
      this.hidden = document.hidden;
    });
    hero.addEventListener('pointerenter', () => (this.overHero = true));
    hero.addEventListener('pointerleave', () => (this.overHero = false));
    hero.addEventListener('pointerdown', () => (this.overHero = true));
    window.addEventListener('scroll', () => this.measureScroll(), { passive: true });
    this.measureScroll();
    this.loop();
  }

  // 4×/s basta para medir tempo ativo; um rAF permanente acordava a CPU 60×/s
  private loop = (): void => {
    this.raf = window.setInterval(() => this.flushTime(), 250);
  };

  private flushTime(): void {
    const now = performance.now();
    const dt = now - this.lastTick;
    this.lastTick = now;
    if (this.hidden || dt > 5000) return; // aba escondida ou máquina dormiu: não conta
    this.activeMs += dt;
    if (this.overHero) this.heroMs += dt;
  }

  private measureScroll(): void {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const depth = total > 0 ? (window.scrollY + window.innerHeight * 0.2) / total : 1;
    this.maxScroll = Math.max(this.maxScroll, clamp01(depth));
  }

  projectClick(): void {
    this.projectClicks = Math.min(3, this.projectClicks + 1);
  }
  contactClick(): void {
    this.contactClicks = 1;
  }
  setVote(v: -1 | 0 | 1): void {
    this.vote = v;
  }

  /** Reinicia os contadores (ao trocar de variante na mesma sessão). */
  reset(): void {
    this.activeMs = 0;
    this.heroMs = 0;
    this.maxScroll = 0;
    this.projectClicks = 0;
    this.contactClicks = 0;
    this.vote = 0;
    this.lastTick = performance.now();
    this.measureScroll();
  }

  snapshot(): FitnessSnapshot {
    this.flushTime();
    const input: FitnessInput = {
      activeSeconds: this.activeMs / 1000,
      scrollDepth: this.maxScroll,
      projectClicks: this.projectClicks,
      contactClicks: this.contactClicks,
      heroSeconds: this.heroMs / 1000,
      vote: this.vote,
    };
    return { ...input, ...scoreParts(input) };
  }

  destroy(): void {
    clearInterval(this.raf);
  }
}
