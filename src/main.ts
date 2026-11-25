import './styles.css';
import './cyberpunk.css';
import './genes.css';
import './genes-extra.css';
import { Evolution, MUTATION_RATE } from './ga/engine';
import { Drift } from './ga/formation';
import { driftStepDetailed, mulberry32, type Genome } from './ga/genome';
import { bus } from './xray/bus';
import { initXray } from './xray/trigger';
import { startVitals } from './xray/vitals';
import { applyDeco } from './ui/deco';
import { createStore } from './ga/store';
import { FitnessTracker } from './ga/fitness';
import type { Organism } from './scene/organism';
import { applyPhenotype } from './ui/phenotype';
import { refreshVizPalette } from './projects/viz';
import { initNav } from './ui/nav';
import { initDebug } from './ui/debug';
import { initCvDownload } from './cv/portal';
import { applyStaticText, onLangChange, t } from './i18n';
import { initCases, rerenderCase } from './projects/case';
import { initNotes, rerenderNote } from './projects/notes';
import './ux.css';
import './compat.css';
import './career.css';
import { bumpProject, renderDynamic, renderGenome, renderLive, renderStatic, toast } from './ui/render';

// Genes que reorganizam a página inteira: nunca mudam durante o uso (só entre visitas).
const LOCKED: readonly (keyof Genome)[] = ['sectionOrder', 'navStyle', 'spacing', 'fontPair', 'headingCase'];

// Genes de layout de uma região: só mudam enquanto aquela região está FORA da tela,
// assim o conteúdo nunca pula debaixo do olho do visitante.
const REGION: Partial<Record<keyof Genome, string>> = {
  heroLayout: '.hero',
  cardLayout: '#projetos',
  vizFrame: '#projetos',
  aboutLayout: '#sobre',
  skillsLayout: '#sobre',
  stepsLayout: '#lab .steps',
  contactLayout: '#contato',
  divider: 'main',
};

function onScreen(sel: string): boolean {
  const el = document.querySelector(sel);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

function frozenNow(): Set<keyof Genome> {
  const frozen = new Set<keyof Genome>(LOCKED);
  for (const [gene, sel] of Object.entries(REGION) as [keyof Genome, string][]) {
    // divider afeta todas as seções: só muda quando o visitante está no hero
    const visible = gene === 'divider' ? window.scrollY > window.innerHeight * 0.6 : onScreen(sel);
    if (visible) frozen.add(gene);
  }
  return frozen;
}
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Web Vitals para o Raio-X: os observadores precisam começar no carregamento
startVitals();

async function boot(): Promise<void> {
  applyStaticText();
  initNav();
  const evo = new Evolution(createStore());
  await evo.init();
  bus.emit({
    kind: 'visit',
    id: evo.current.id,
    gen: evo.state.generation,
    evals: evo.current.evals,
    pop: evo.state.population.length,
  });

  // 1. a visita começa ESTÁVEL: exatamente o indivíduo escolhido pelo GA
  const rng = mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  let shown: Genome = evo.current.genome;
  applyPhenotype(shown);
  applyDeco(shown);
  refreshVizPalette();

  const heroStage = document.querySelector<HTMLElement>('.hero-stage')!;
  const canvas = document.getElementById('organism') as HTMLCanvasElement;
  const tracker = new FitnessTracker(heroStage);

  // Three.js (~140 kB gzip) vem num chunk separado: o texto da página aparece antes do 3D
  let organism: Organism | null = null;
  const organismReady = import('./scene/organism')
    .then(({ Organism }) => {
      organism = new Organism(canvas, shown);
      (window as unknown as { gdp: { organism: Organism | null } }).gdp.organism = organism;
    })
    .catch((err) => {
      console.warn('WebGL indisponível; seguindo sem o organismo 3D', err);
      heroStage.style.display = 'none';
    });


  const onProject = (id: string) => {
    bumpProject(id);
    tracker.projectClick();
  };
  const onContact = () => tracker.contactClick();
  renderStatic(onProject, onContact);
  initCases(onProject);
  initNotes();
  // baixar o currículo é um sinal forte de interesse: conta como contato no fitness
  // as partículas do organismo viram o currículo (ver cv/portal.ts)
  initCvDownload(onContact, () => organism);
  // 2. deriva: conforme o visitante usa a página, a mutação sobe aos poucos
  const levelToRate = (level: number) => MUTATION_RATE + (1 - MUTATION_RATE) * level;
  const show = (g: Genome, level: number) => {
    shown = g;
    applyPhenotype(g);
    applyDeco(g);
    refreshVizPalette();
    organism?.applyGenome(g);
    renderGenome(evo, g, levelToRate(level), level);
  };
  const milestones = new Set<number>();
  const drift = new Drift((level) => {
    const frozen = frozenNow();
    const before = shown;
    const step = driftStepDetailed(before, level, rng, frozen);
    show(step.genome, level);
    bus.emit({
      kind: 'drift',
      step: drift.step,
      level,
      rate: levelToRate(level),
      changed: step.changed.map((gene) => ({ gene, from: before[gene], to: step.genome[gene] })),
      blocked: step.blocked.map((gene) => ({ gene, reason: LOCKED.includes(gene) ? 'locked' : 'onscreen' })),
    });
    const pct = Math.floor(level * 4) * 25; // avisa em 25%, 50%, 75%, 100%
    if (pct > 0 && !milestones.has(pct)) {
      milestones.add(pct);
      toast(t('drift.milestone', { p: pct }));
    }
  });
  const restore = () => {
    milestones.clear();
    drift.start();
    show(evo.current.genome, 0);
    bus.emit({ kind: 'restore', id: evo.current.id });
  };
  document.querySelectorAll('[data-drift-reset]').forEach((b) => b.addEventListener('click', restore));
  if (REDUCED_MOTION) drift.stop();
  else drift.start();
  renderGenome(evo, shown, levelToRate(0), 0);
  renderDynamic(evo, null);

  initDebug(() => organism, () => drift.progress, () => evo.current.id);

  // troca de idioma: textos fixos já foram trocados pelo i18n; aqui re-renderiza o resto
  onLangChange(() => {
    renderStatic(onProject, onContact);
    renderGenome(evo, shown, levelToRate(drift.progress), drift.progress);
    renderDynamic(evo, null);
    rerenderCase();
    rerenderNote();
  });

  // 3. fitness "ao vivo" no HUD, para o visitante ver o próprio efeito
  const liveTimer = window.setInterval(() => renderLive(evo, tracker.snapshot().score), 2000);

  // 3. registra a sessão ao sair. pagehide é o evento confiável em mobile.
  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const snap = tracker.snapshot();
    void evo.recordFitness(snap.score);
  };
  window.addEventListener('pagehide', commit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      commit();
    } else if (committed) {
      // voltou para a aba: conta como nova sessão de avaliação
      committed = false;
      tracker.reset();
    }
  });

  // 4. votos
  const feedback = document.querySelector<HTMLElement>('[data-vote-feedback]')!;
  document.querySelector('[data-vote-up]')!.addEventListener('click', () => {
    tracker.setVote(1);
    bus.emit({ kind: 'vote', id: evo.current.id });
    feedback.textContent = t('vote.feedback', { id: evo.current.id });
    toast(t('vote.toast'));
    renderLive(evo, tracker.snapshot().score);
  });
  document.querySelector('[data-vote-next]')!.addEventListener('click', async () => {
    tracker.setVote(-1);
    const score = tracker.snapshot().score;
    const prev = evo.current.id;
    const genBefore = evo.state.generation;
    await evo.switchVariant(score);
    tracker.reset();
    restore();
    renderDynamic(evo, null);
    const evolved = evo.state.generation > genBefore;
    bus.emit({ kind: 'variant', prev, id: evo.current.id, score, evolved, gen: evo.state.generation });
    feedback.textContent = evolved
      ? t('variant.evolved', { g: evo.state.generation, id: evo.current.id })
      : t('variant.next', { prev, s: score.toFixed(2), id: evo.current.id });
    toast(evolved ? t('variant.toastGen', { g: evo.state.generation }) : t('variant.toast', { id: evo.current.id }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelector('[data-reset]')!.addEventListener('click', async () => {
    if (!confirm(t('reset.confirm'))) return;
    await evo.reset();
    tracker.reset();
    restore();
    renderDynamic(evo, null);
    toast(t('reset.toast'));
  });

  evo.onChange(() => renderDynamic(evo, null));

  // Raio-X (tecla X / botão </> / ?xray): o chunk só baixa quando alguém abre
  initXray({
    evo,
    tracker,
    getOrganism: () => organism,
    getGenome: () => shown,
    driftProgress: () => drift.progress,
    onThemeChange: refreshVizPalette,
  });

  // debug no console: window.gdp.evo.state
  (window as unknown as { gdp: unknown }).gdp = { evo, tracker, organism, organismReady, drift };
  window.addEventListener('beforeunload', () => clearInterval(liveTimer));
}

void boot();
