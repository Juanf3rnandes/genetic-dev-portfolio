/**
 * Genoma do portfólio.
 *
 * Cada gene controla um aspecto visível do site (fenótipo): cor, forma 3D,
 * movimento, tipografia e layout. O algoritmo genético nunca toca no
 * conteúdo (textos, projetos) — só em como ele é apresentado.
 */

export const SHAPES = ['sphere', 'helix', 'torus', 'galaxy', 'lattice', 'knot', 'wave'] as const;
export type Shape = (typeof SHAPES)[number];

export const HERO_LAYOUTS = ['split', 'center', 'reverse'] as const;
export type HeroLayout = (typeof HERO_LAYOUTS)[number];

// Genes estruturais: cada um troca a FORMA de um componente da tela, não só o estilo.
export const NAV_STYLES = ['top', 'rail', 'dock'] as const;             // barra no topo · trilho lateral · dock flutuante
export const TITLE_FX = ['clean', 'glitch', 'neon', 'outline', 'scramble'] as const; // efeito dos títulos
export const CARD_LAYOUTS = ['grid', 'list', 'bento', 'rail'] as const; // arranjo dos projetos
export const SKINS = ['line', 'chamfer', 'bracket', 'terminal', 'holo'] as const; // pele de cards/painéis/passos
export const STEPS_LAYOUTS = ['grid', 'timeline', 'rail'] as const;     // "como ele evolui"
export const SKILLS_LAYOUTS = ['chips', 'terminal', 'columns'] as const;
export const BG_PATTERNS = ['none', 'grid', 'dots', 'rain', 'hex'] as const; // textura de fundo
export const SECTION_ORDERS = ['work', 'lab', 'stack'] as const;        // ordem das seções
export const DIVIDERS = ['none', 'ticker', 'rule', 'hairline'] as const; // separadores entre seções
export const FONT_PAIRS = ['chakra', 'mono', 'grotesk'] as const;       // fonte dos títulos
export const HEADING_CASES = ['upper', 'normal'] as const;              // caixa dos títulos
export const BUTTON_STYLES = ['chamfer', 'pill', 'bracket', 'underline'] as const;
export const CHIP_STYLES = ['outline', 'filled', 'tag', 'dot'] as const;
export const EYEBROW_STYLES = ['slashes', 'index', 'bar', 'arrow'] as const; // rótulos "02 — PROJETOS"
export const LINK_STYLES = ['arrow', 'underline', 'bracket'] as const;  // "Ver no GitHub"
export const VIZ_FRAMES = ['plain', 'crt', 'window', 'scope'] as const; // moldura das animações
export const ABOUT_LAYOUTS = ['split', 'stacked', 'cards'] as const;
export const CONTACT_LAYOUTS = ['left', 'center', 'terminal'] as const;
export const DECOS = ['none', 'tags', 'circuits', 'glyphs'] as const;  // elementos gerados nas margens
export const CURSOR_FX = ['none', 'crosshair', 'trail'] as const;
export const ACCENT_MODES = ['duo', 'mono', 'split'] as const;      // 2 acentos · 1 acento · acento 2 só nos detalhes

type Of<T extends readonly unknown[]> = T[number];

export interface Genome {
  // Cor
  hue: number;        // 0–360  matiz do acento primário
  hue2: number;       // 0–360  matiz do acento secundário
  sat: number;        // 0.45–1 saturação dos acentos
  bgTint: number;     // 0–1    quanto o fundo puxa para o hue primário
  fx: number;         // 0–0.75 intensidade cyberpunk (glow, scanlines, aberração, chão synthwave)
  accentMode: Of<typeof ACCENT_MODES>;

  // Organismo 3D
  shape: Shape;
  particles: number;  // 3000–16000
  pointSize: number;  // 1.2–4.5 px
  noiseAmp: number;   // 0–0.6  deformação do organismo
  noiseFreq: number;  // 0.6–4  frequência do ruído
  rotSpeed: number;   // 0.02–0.45 rad/s
  pulse: number;      // 0–1    "respiração"
  cursorReact: number;// 0–1    quanto as partículas fogem/seguem o cursor
  bloom: number;      // 0–1.6  intensidade do glow
  spread: number;     // 0.7–1.4 escala do organismo

  // Tipografia e layout
  typeScale: number;  // 1.05–1.45
  fontWeight: 500 | 700;
  heroLayout: HeroLayout;
  cardRadius: number; // 6–32 px
  grain: number;      // 0–1  granulado do fundo
  motion: number;     // 0.3–1.5 velocidade geral das animações

  // Estrutura dos componentes
  navStyle: Of<typeof NAV_STYLES>;
  titleFx: Of<typeof TITLE_FX>;
  cardLayout: Of<typeof CARD_LAYOUTS>;
  skin: Of<typeof SKINS>;
  stepsLayout: Of<typeof STEPS_LAYOUTS>;
  skillsLayout: Of<typeof SKILLS_LAYOUTS>;
  bgPattern: Of<typeof BG_PATTERNS>;
  sectionOrder: Of<typeof SECTION_ORDERS>;
  divider: Of<typeof DIVIDERS>;

  // Componentes adicionais
  fontPair: Of<typeof FONT_PAIRS>;
  headingCase: Of<typeof HEADING_CASES>;
  buttonStyle: Of<typeof BUTTON_STYLES>;
  chipStyle: Of<typeof CHIP_STYLES>;
  eyebrowStyle: Of<typeof EYEBROW_STYLES>;
  linkStyle: Of<typeof LINK_STYLES>;
  vizFrame: Of<typeof VIZ_FRAMES>;
  aboutLayout: Of<typeof ABOUT_LAYOUTS>;
  contactLayout: Of<typeof CONTACT_LAYOUTS>;
  deco: Of<typeof DECOS>;
  cursorFx: Of<typeof CURSOR_FX>;
  spacing: number;    // 0.75–1.3 multiplicador de espaçamento das seções
}

interface NumGene {
  kind: 'num';
  min: number;
  max: number;
  int?: boolean;
}
interface EnumGene<T extends readonly string[] | readonly number[]> {
  kind: 'enum';
  options: T;
}
type GeneSpec = NumGene | EnumGene<readonly string[]> | EnumGene<readonly number[]>;

export const GENE_SPEC: Record<keyof Genome, GeneSpec> = {
  hue: { kind: 'num', min: 0, max: 360 },
  hue2: { kind: 'num', min: 0, max: 360 },
  sat: { kind: 'num', min: 0.45, max: 1 },
  bgTint: { kind: 'num', min: 0, max: 1 },
  fx: { kind: 'num', min: 0, max: 0.75 },
  accentMode: { kind: 'enum', options: ACCENT_MODES },

  shape: { kind: 'enum', options: SHAPES },
  particles: { kind: 'num', min: 3000, max: 16000, int: true },
  pointSize: { kind: 'num', min: 1.2, max: 4.5 },
  noiseAmp: { kind: 'num', min: 0, max: 0.6 },
  noiseFreq: { kind: 'num', min: 0.6, max: 4 },
  rotSpeed: { kind: 'num', min: 0.02, max: 0.45 },
  pulse: { kind: 'num', min: 0, max: 1 },
  cursorReact: { kind: 'num', min: 0, max: 1 },
  bloom: { kind: 'num', min: 0, max: 1.6 },
  spread: { kind: 'num', min: 0.7, max: 1.4 },

  typeScale: { kind: 'num', min: 1.05, max: 1.45 },
  fontWeight: { kind: 'enum', options: [500, 700] as const },
  heroLayout: { kind: 'enum', options: HERO_LAYOUTS },
  cardRadius: { kind: 'num', min: 6, max: 32 },
  grain: { kind: 'num', min: 0, max: 1 },
  motion: { kind: 'num', min: 0.3, max: 1.5 },

  navStyle: { kind: 'enum', options: NAV_STYLES },
  titleFx: { kind: 'enum', options: TITLE_FX },
  cardLayout: { kind: 'enum', options: CARD_LAYOUTS },
  skin: { kind: 'enum', options: SKINS },
  stepsLayout: { kind: 'enum', options: STEPS_LAYOUTS },
  skillsLayout: { kind: 'enum', options: SKILLS_LAYOUTS },
  bgPattern: { kind: 'enum', options: BG_PATTERNS },
  sectionOrder: { kind: 'enum', options: SECTION_ORDERS },
  divider: { kind: 'enum', options: DIVIDERS },

  fontPair: { kind: 'enum', options: FONT_PAIRS },
  headingCase: { kind: 'enum', options: HEADING_CASES },
  buttonStyle: { kind: 'enum', options: BUTTON_STYLES },
  chipStyle: { kind: 'enum', options: CHIP_STYLES },
  eyebrowStyle: { kind: 'enum', options: EYEBROW_STYLES },
  linkStyle: { kind: 'enum', options: LINK_STYLES },
  vizFrame: { kind: 'enum', options: VIZ_FRAMES },
  aboutLayout: { kind: 'enum', options: ABOUT_LAYOUTS },
  contactLayout: { kind: 'enum', options: CONTACT_LAYOUTS },
  deco: { kind: 'enum', options: DECOS },
  cursorFx: { kind: 'enum', options: CURSOR_FX },
  spacing: { kind: 'num', min: 0.75, max: 1.3 },
};

export const GENE_KEYS = Object.keys(GENE_SPEC) as (keyof Genome)[];

// ---------- RNG determinístico (para reprodutibilidade de uma geração) ----------

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: Rng): number {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// ---------- Operadores ----------

export function randomGenome(rng: Rng): Genome {
  const g: Partial<Record<keyof Genome, unknown>> = {};
  for (const key of GENE_KEYS) g[key] = randomGene(key, rng);
  return g as Genome;
}

/** Genoma "semente": o visual de referência do design. Entra na população inicial. */
export function seedGenome(): Genome {
  return {
    hue: 158,
    hue2: 262,
    sat: 0.85,
    bgTint: 0.35,
    fx: 0.2,
    accentMode: 'duo',
    shape: 'sphere',
    particles: 9000,
    pointSize: 2.4,
    noiseAmp: 0.14,
    noiseFreq: 2.2,
    rotSpeed: 0.12,
    pulse: 0.4,
    cursorReact: 0.7,
    bloom: 0.9,
    spread: 1,
    typeScale: 1.25,
    fontWeight: 700,
    heroLayout: 'split',
    cardRadius: 20,
    grain: 0.5,
    motion: 1,
    navStyle: 'top',
    titleFx: 'clean',
    cardLayout: 'grid',
    skin: 'line',
    stepsLayout: 'grid',
    skillsLayout: 'chips',
    bgPattern: 'none',
    sectionOrder: 'work',
    divider: 'hairline',
    fontPair: 'chakra',
    headingCase: 'normal',
    buttonStyle: 'chamfer',
    chipStyle: 'outline',
    eyebrowStyle: 'slashes',
    linkStyle: 'arrow',
    vizFrame: 'plain',
    aboutLayout: 'split',
    contactLayout: 'left',
    deco: 'none',
    cursorFx: 'none',
    spacing: 1,
  };
}

function randomGene(key: keyof Genome, rng: Rng): unknown {
  const spec = GENE_SPEC[key];
  if (spec.kind === 'num') {
    const v = spec.min + rng() * (spec.max - spec.min);
    return spec.int ? Math.round(v) : v;
  }
  const opts = spec.options as readonly unknown[];
  return opts[Math.floor(rng() * opts.length)];
}

/**
 * Garante que um genoma vindo do storage tem todos os genes atuais e com
 * valores válidos. Genes novos (ou inválidos) nascem aleatórios — assim uma
 * população antiga passa a explorar as novas dimensões imediatamente.
 */
export function normalizeGenome(raw: Partial<Record<keyof Genome, unknown>>, rng: Rng): Genome {
  const g: Partial<Record<keyof Genome, unknown>> = {};
  for (const key of GENE_KEYS) {
    const spec = GENE_SPEC[key];
    const v = raw[key];
    if (spec.kind === 'num') {
      g[key] = typeof v === 'number' && Number.isFinite(v) ? clamp(v, spec.min, spec.max) : randomGene(key, rng);
    } else {
      g[key] = (spec.options as readonly unknown[]).includes(v) ? v : randomGene(key, rng);
    }
  }
  return g as Genome;
}

/** Crossover uniforme: cada gene vem de um dos pais com 50%. */
export function crossover(a: Genome, b: Genome, rng: Rng): Genome {
  const child: Partial<Record<keyof Genome, unknown>> = {};
  for (const key of GENE_KEYS) {
    const spec = GENE_SPEC[key];
    if (spec.kind === 'num' && rng() < 0.25) {
      // 25% das vezes faz blend aritmético em genes numéricos — suaviza a busca
      const t = rng();
      const v = (a[key] as number) * t + (b[key] as number) * (1 - t);
      child[key] = spec.int ? Math.round(v) : v;
    } else {
      child[key] = rng() < 0.5 ? a[key] : b[key];
    }
  }
  return child as Genome;
}

/**
 * Mutação gaussiana. `rate` = probabilidade por gene; `sigma` = desvio
 * relativo ao intervalo do gene. Matizes são circulares (wrap em 360).
 */
export function mutate(g: Genome, rng: Rng, rate = 0.08, sigma = 0.08): Genome {
  const out: Partial<Record<keyof Genome, unknown>> = { ...g };
  for (const key of GENE_KEYS) {
    if (rng() >= rate) continue;
    const spec = GENE_SPEC[key];
    if (spec.kind === 'num') {
      const range = spec.max - spec.min;
      let v = (g[key] as number) + gaussian(rng) * sigma * range;
      if (key === 'hue' || key === 'hue2') v = ((v % 360) + 360) % 360;
      else v = clamp(v, spec.min, spec.max);
      out[key] = spec.int ? Math.round(v) : v;
    } else {
      const opts = spec.options as readonly unknown[];
      out[key] = opts[Math.floor(rng() * opts.length)];
    }
  }
  return out as Genome;
}

/** Distância normalizada entre dois genomas (0 = iguais). Usada para diversidade. */
export function distance(a: Genome, b: Genome): number {
  let acc = 0;
  for (const key of GENE_KEYS) {
    const spec = GENE_SPEC[key];
    if (spec.kind === 'num') {
      let d = Math.abs((a[key] as number) - (b[key] as number));
      if (key === 'hue' || key === 'hue2') d = Math.min(d, 360 - d);
      acc += d / (spec.max - spec.min);
    } else {
      acc += a[key] === b[key] ? 0 : 1;
    }
  }
  return acc / GENE_KEYS.length;
}

export function hashGenome(g: Genome): string {
  const s = GENE_KEYS.map((k) => `${k}=${typeof g[k] === 'number' ? (g[k] as number).toFixed(3) : g[k]}`).join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Um passo de DERIVA: muta o genoma exibido com intensidade `level` (0→1).
 * Poucos genes mudam por passo (no máximo ~15% no nível 100%), então a página
 * se transforma aos poucos. Genes em `frozen` não mudam neste passo.
 */
export function driftStep(current: Genome, level: number, rng: Rng, frozen: ReadonlySet<keyof Genome> = new Set()): Genome {
  return driftStepDetailed(current, level, rng, frozen).genome;
}

export interface DriftDetail {
  genome: Genome;
  /** genes que mudaram neste passo */
  changed: (keyof Genome)[];
  /** genes que a mutação sorteou, mas que estavam congelados e ficaram como estavam */
  blocked: (keyof Genome)[];
}

/** O mesmo passo de deriva, contando o que mudou e o que foi barrado (para o Raio-X). */
export function driftStepDetailed(
  current: Genome,
  level: number,
  rng: Rng,
  frozen: ReadonlySet<keyof Genome> = new Set(),
): DriftDetail {
  const rate = 0.02 + 0.13 * level;
  const sigma = 0.04 + 0.22 * level;
  const out = mutate(current, rng, rate, sigma) as Record<keyof Genome, unknown>;
  const changed: (keyof Genome)[] = [];
  const blocked: (keyof Genome)[] = [];
  for (const key of GENE_KEYS) {
    if (out[key] === current[key]) continue;
    if (frozen.has(key)) {
      out[key] = current[key];
      blocked.push(key);
    } else {
      changed.push(key);
    }
  }
  return { genome: out as Genome, changed, blocked };
}
