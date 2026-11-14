/**
 * Motor do algoritmo genético.
 *
 * Ciclo:
 *  1. Um indivíduo da população é escolhido para esta visita (prioriza os
 *     menos avaliados; entre eles, torneio leve pelo fitness).
 *  2. Durante a sessão, o FitnessTracker acumula engajamento.
 *  3. Ao sair (ou trocar de variante), o fitness é registrado no indivíduo.
 *  4. Quando todos os indivíduos têm >= MIN_EVALS avaliações, nasce uma
 *     nova geração: elitismo + torneio + crossover uniforme + mutação.
 */

import {
  type Genome,
  crossover,
  distance,
  hashGenome,
  mulberry32,
  mutate,
  normalizeGenome,
  randomGenome,
  seedGenome,
  type Rng,
} from './genome';
import type { EvolutionState, EvolutionStore, Individual } from './store';

export const POP_SIZE = 8;
export const ELITISM = 2;
export const MIN_EVALS = 1;          // avaliações por indivíduo antes de evoluir
export const MUTATION_RATE = 0.08;
export const MUTATION_SIGMA = 0.08;
export const TOURNAMENT_K = 3;

export const fitnessOf = (ind: Individual): number => (ind.evals ? ind.fitnessSum / ind.evals : 0);

function makeIndividual(genome: Genome, born: number, parents: string[]): Individual {
  return { id: hashGenome(genome), genome, born, parents, evals: 0, fitnessSum: 0 };
}

export function freshState(seed = Date.now() % 1_000_000): EvolutionState {
  const rng = mulberry32(seed);
  const population: Individual[] = [makeIndividual(seedGenome(), 0, [])];
  // 3 variações leves da semente + o resto aleatório: começa bonito, explora rápido
  for (let i = 0; i < 3; i++) population.push(makeIndividual(mutate(seedGenome(), rng, 0.5, 0.15), 0, []));
  while (population.length < POP_SIZE) population.push(makeIndividual(randomGenome(rng), 0, []));
  return { version: 1, generation: 0, population, history: [], totalEvals: 0, seed };
}

function tournament(pop: Individual[], rng: Rng, k = TOURNAMENT_K): Individual {
  let best: Individual | null = null;
  for (let i = 0; i < k; i++) {
    const cand = pop[Math.floor(rng() * pop.length)];
    if (!best || fitnessOf(cand) > fitnessOf(best)) best = cand;
  }
  return best!;
}

/** Produz a próxima geração a partir da atual. Função pura. */
export function evolve(state: EvolutionState): EvolutionState {
  const rng = mulberry32(state.seed + state.generation * 7919 + 1);
  const ranked = [...state.population].sort((a, b) => fitnessOf(b) - fitnessOf(a));
  const gen = state.generation + 1;

  const next: Individual[] = [];
  // Elitismo: os melhores passam intactos, mas com avaliações zeradas (serão reavaliados)
  for (const elite of ranked.slice(0, ELITISM)) {
    next.push({ ...elite, evals: 0, fitnessSum: 0 });
  }

  let guard = 0;
  while (next.length < POP_SIZE && guard++ < 200) {
    const a = tournament(state.population, rng);
    let b = tournament(state.population, rng);
    if (b.id === a.id) b = tournament(state.population, rng);
    let child = mutate(crossover(a.genome, b.genome, rng), rng, MUTATION_RATE, MUTATION_SIGMA);
    // Pressão por diversidade: filho quase idêntico a alguém já na próxima geração sofre mutação extra
    if (next.some((n) => distance(n.genome, child) < 0.03)) {
      child = mutate(child, rng, 0.5, 0.2);
    }
    next.push(makeIndividual(child, gen, [a.id, b.id]));
  }

  const best = ranked[0];
  const mean = ranked.reduce((s, i) => s + fitnessOf(i), 0) / ranked.length;

  return {
    ...state,
    generation: gen,
    population: next,
    history: [
      ...state.history,
      { gen: state.generation, at: Date.now(), best: fitnessOf(best), mean, bestId: best.id, bestGenome: best.genome },
    ].slice(-60),
  };
}

/**
 * Estados salvos antes de novos genes existirem: completa cada genoma.
 * Determinístico (seed do estado), então recarregar a página dá o mesmo resultado.
 */
export function migrateState(state: EvolutionState): EvolutionState {
  const rng = mulberry32(state.seed + 0x5eed);
  return {
    ...state,
    population: state.population.map((ind) => ({ ...ind, genome: normalizeGenome(ind.genome, rng) })),
    history: state.history.map((h) => ({ ...h, bestGenome: normalizeGenome(h.bestGenome, rng) })),
  };
}

export class Evolution {
  state!: EvolutionState;
  current!: Individual;
  private listeners = new Set<(e: Evolution) => void>();

  constructor(private store: EvolutionStore) {}

  get storeLabel(): string {
    return this.store.label;
  }

  async init(): Promise<void> {
    const loaded = await this.store.load();
    this.state = loaded ? migrateState(loaded) : freshState();
    this.current = this.pickForVisit();
  }

  onChange(fn: (e: Evolution) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this);
  }

  /** Escolhe quem será exibido nesta visita. */
  pickForVisit(exclude?: string): Individual {
    const pop = this.state.population.filter((i) => i.id !== exclude);
    const minEvals = Math.min(...pop.map((i) => i.evals));
    const underEvaluated = pop.filter((i) => i.evals === minEvals);
    // entre os menos avaliados, leve preferência aos de melhor fitness — explora mas não desperdiça
    const rng = mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    return underEvaluated.length > 1 ? tournament(underEvaluated, rng, 2) : underEvaluated[0] ?? pop[0];
  }

  /** Registra o fitness da sessão atual e, se for hora, evolui. Retorna true se houve nova geração. */
  async recordFitness(fitness: number): Promise<boolean> {
    const ind = this.state.population.find((i) => i.id === this.current.id);
    if (!ind) return false;
    ind.evals += 1;
    ind.fitnessSum += fitness;
    this.state.totalEvals += 1;

    let evolved = false;
    if (this.state.population.every((i) => i.evals >= MIN_EVALS)) {
      this.state = evolve(this.state);
      evolved = true;
    }
    await this.store.save(this.state);
    this.emit();
    return evolved;
  }

  /** Troca para outra variante da população (registra antes o fitness parcial). */
  async switchVariant(partialFitness: number): Promise<Individual> {
    const evolved = await this.recordFitness(partialFitness);
    this.current = this.pickForVisit(evolved ? undefined : this.current.id);
    this.emit();
    return this.current;
  }

  /** Reseta a linhagem (debug / botão escondido). */
  async reset(): Promise<void> {
    this.state = freshState();
    this.current = this.pickForVisit();
    await this.store.save(this.state);
    this.emit();
  }

  get bestEver(): Individual | null {
    const h = this.state.history;
    if (!h.length) return null;
    const top = h.reduce((a, b) => (b.best > a.best ? b : a));
    return { id: top.bestId, genome: top.bestGenome, born: top.gen, parents: [], evals: 1, fitnessSum: top.best };
  }
}
