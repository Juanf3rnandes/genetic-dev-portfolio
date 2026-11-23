/**
 * Persistência do estado evolutivo.
 *
 * - LocalStore: localStorage — cada navegador evolui a própria linhagem.
 * - RemoteStore: endpoint HTTP (GET/PUT JSON) — todos os visitantes
 *   alimentam a MESMA população. Veja server/worker.js para um exemplo
 *   gratuito em Cloudflare Workers + KV. Configure VITE_GA_ENDPOINT.
 */

import type { Genome } from './genome';

export interface Individual {
  id: string;
  genome: Genome;
  born: number;         // geração em que nasceu
  parents: string[];    // ids dos pais (vazio se aleatório/semente)
  evals: number;        // quantas sessões o avaliaram
  fitnessSum: number;   // soma dos fitness observados
}

export interface GenerationRecord {
  gen: number;
  at: number;           // timestamp
  best: number;
  mean: number;
  bestId: string;
  bestGenome: Genome;
}

export interface EvolutionState {
  version: 1;
  generation: number;
  population: Individual[];
  history: GenerationRecord[];
  totalEvals: number;
  seed: number;
}

export interface EvolutionStore {
  readonly label: string;
  load(): Promise<EvolutionState | null>;
  save(state: EvolutionState): Promise<void>;
}

// v2: redesign contido (nov/2026). Trocar a chave reinicia as linhagens locais antigas.
const KEY = 'gdp:evolution:v2';

export class LocalStore implements EvolutionStore {
  readonly label = 'local';

  async load(): Promise<EvolutionState | null> {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as EvolutionState;
      return parsed.version === 1 ? parsed : null;
    } catch {
      return null;
    }
  }

  async save(state: EvolutionState): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota cheia ou modo privado: ignora, memória segue viva na sessão */
    }
  }
}

export class RemoteStore implements EvolutionStore {
  readonly label = 'compartilhado';
  private fallback = new LocalStore();

  constructor(private endpoint: string) {}

  async load(): Promise<EvolutionState | null> {
    try {
      const res = await fetch(this.endpoint, { cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as EvolutionState | null;
      if (data && data.version === 1) {
        await this.fallback.save(data);
        return data;
      }
      return null;
    } catch {
      return this.fallback.load();
    }
  }

  async save(state: EvolutionState): Promise<void> {
    await this.fallback.save(state);
    try {
      const body = JSON.stringify(state);
      // keepalive permite enviar durante o unload da página
      await fetch(this.endpoint, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: body.length < 60_000,
      });
    } catch {
      /* offline: fica só no local */
    }
  }
}

export function createStore(): EvolutionStore {
  const endpoint = import.meta.env.VITE_GA_ENDPOINT as string | undefined;
  return endpoint ? new RemoteStore(endpoint) : new LocalStore();
}
