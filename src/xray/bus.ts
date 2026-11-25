/**
 * Diário do algoritmo genético para o Raio-X.
 *
 * Fica no bundle principal (é minúsculo) e grava desde o carregamento, para que
 * ao abrir o Raio-X já exista histórico. Guarda só dados estruturados; o texto
 * (PT/EN) é montado no chunk do Raio-X, que só carrega quando alguém abre.
 */

import type { Genome } from '../ga/genome';

export type GeneValue = Genome[keyof Genome];
export type BlockReason = 'locked' | 'onscreen';

export type XrEvent =
  | { kind: 'visit'; at: number; id: string; gen: number; evals: number; pop: number }
  | {
      kind: 'drift';
      at: number;
      step: number;
      level: number;
      /** taxa de mutação mostrada ao visitante (a mesma da pílula "mutação X%") */
      rate: number;
      changed: { gene: keyof Genome; from: GeneValue; to: GeneValue }[];
      blocked: { gene: keyof Genome; reason: BlockReason }[];
    }
  | { kind: 'restore'; at: number; id: string }
  | { kind: 'fitness'; at: number; score: number }
  | { kind: 'vote'; at: number; id: string }
  | { kind: 'variant'; at: number; prev: string; id: string; score: number; evolved: boolean; gen: number };

/** Distribui `Omit` sobre a união, para cada variante manter seus campos. */
type WithoutAt<T> = T extends unknown ? Omit<T, 'at'> : never;
export type XrEventInput = WithoutAt<XrEvent>;

export const BUS_CAPACITY = 120;

export class EventBus {
  private items: XrEvent[] = [];
  private listeners = new Set<(e: XrEvent) => void>();

  constructor(private capacity = BUS_CAPACITY, private now: () => number = () => Date.now()) {}

  emit(e: XrEventInput): void {
    const ev = { ...e, at: this.now() } as XrEvent;
    this.items.push(ev);
    // descarta os mais antigos em blocos, sem realocar a cada evento
    if (this.items.length > this.capacity * 1.25) this.items = this.items.slice(-this.capacity);
    for (const fn of this.listeners) fn(ev);
  }

  /** Os eventos guardados, do mais antigo ao mais novo (no máximo `capacity`). */
  history(): readonly XrEvent[] {
    return this.items.length > this.capacity ? this.items.slice(-this.capacity) : this.items;
  }

  subscribe(fn: (e: XrEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const bus = new EventBus();
