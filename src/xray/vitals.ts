/**
 * Core Web Vitals medidos na própria visita (LCP, CLS, INP), sem biblioteca.
 *
 * Os observadores precisam começar no carregamento — por isso este arquivo fica
 * no bundle principal (~1 kB). O Raio-X só lê os números.
 * Em navegadores sem a API (ex.: INP no Safari), o valor fica null e o painel mostra "—".
 */

export interface Vitals {
  lcp: number | null; // ms
  cls: number | null;
  inp: number | null; // ms
}

interface ShiftLike {
  startTime: number;
  value: number;
  hadRecentInput: boolean;
}

/**
 * CLS como o Chrome calcula: a maior "janela de sessão" de mudanças de layout
 * (mudanças com menos de 1 s entre si, janela de no máximo 5 s). Mudanças logo
 * após uma interação do usuário não contam.
 */
export function computeCls(shifts: readonly ShiftLike[]): number {
  let best = 0;
  let current = 0;
  let first = -Infinity;
  let last = -Infinity;
  for (const s of shifts) {
    if (s.hadRecentInput) continue;
    if (s.startTime - last > 1000 || s.startTime - first > 5000) {
      current = 0;
      first = s.startTime;
    }
    current += s.value;
    last = s.startTime;
    best = Math.max(best, current);
  }
  return best;
}

/**
 * INP: a interação mais lenta, ignorando 1 a cada 50 (percentil ~98, como o Chrome).
 * `durations` = a duração de cada interação (já agrupada por interactionId).
 */
export function computeInp(durations: readonly number[]): number | null {
  if (!durations.length) return null;
  const sorted = [...durations].sort((a, b) => b - a);
  const skip = Math.min(sorted.length - 1, Math.floor(sorted.length / 50));
  return sorted[skip];
}

const supported = (type: string): boolean =>
  typeof PerformanceObserver !== 'undefined' && (PerformanceObserver.supportedEntryTypes ?? []).includes(type);

let lcp: number | null = null;
const shifts: ShiftLike[] = [];
const interactions = new Map<number, number>();
let started = false;

export function startVitals(): void {
  if (started) return;
  started = true;
  try {
    if (supported('largest-contentful-paint')) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) lcp = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }
    if (supported('layout-shift')) {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as ShiftLike[]) {
          shifts.push({ startTime: e.startTime, value: e.value, hadRecentInput: e.hadRecentInput });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }
    if (supported('event')) {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as PerformanceEventTiming[]) {
          const id = e.interactionId;
          if (!id) continue;
          interactions.set(id, Math.max(interactions.get(id) ?? 0, e.duration));
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    }
  } catch {
    /* navegador antigo: o painel mostra "—" */
  }
}

export function readVitals(): Vitals {
  return {
    lcp,
    cls: supported('layout-shift') ? computeCls(shifts) : null,
    inp: supported('event') ? computeInp([...interactions.values()]) : null,
  };
}
